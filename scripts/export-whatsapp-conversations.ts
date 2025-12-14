/**
 * Exporta las conversaciones de WhatsApp de los últimos 30 días desde Bird.
 *
 * Requisitos:
 *   BIRD_ACCESS_KEY
 *   BIRD_WORKSPACE_ID
 *   (opcional) BIRD_CHANNEL_ID  -> si está, limita solo a ese canal (WhatsApp)
 *
 * Ejecución:
 *   pnpm tsx scripts/export-whatsapp-conversations.ts
 *
 * Salida:
 *   convers/whatsapp-conversations-YYYY-MM-DD.json
 *   Estructura:
 *     [
 *       {
 *         conversationId,
 *         channelId,
 *         contactPhone,
 *         lastMessageAt,
 *         messages: [{id, at, role, sender, text}]
 *       }
 *     ]
 */

import fs from 'node:fs';
import path from 'node:path';

import { BIRD_API_BASE, getBirdConfig, getOptionalChannelId } from '../lib/bird/env';

type ConversationParticipant = {
  type: string;
  displayName?: string;
  contact?: {
    identifierValue?: string;
  };
};

type Conversation = {
  id: string;
  channelId?: string;
  featuredParticipants?: ConversationParticipant[];
  lastMessage?: {
    createdAt?: string;
  };
  lastMessageIncomingAt?: string;
  lastMessageOutgoingAt?: string;
};

type ConversationsResponse = {
  results: Conversation[];
  nextPageToken?: string;
};

type MessageBody =
  | { type: 'text'; text?: { text?: string } | string }
  | { type: 'image' }
  | { type: 'file' }
  | { type: 'location' }
  | { type: string; [key: string]: unknown };

type Message = {
  id: string;
  createdAt: string;
  sender: { type: string; displayName?: string };
  body: MessageBody;
};

type MessagesResponse = {
  results: Message[];
  nextPageToken?: string;
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const OUTPUT_DIR = path.join(process.cwd(), 'convers');

function dateFrom(value?: string) {
  if (!value) return null;
  const asDate = new Date(value);
  return Number.isNaN(asDate.getTime()) ? null : asDate;
}

function conversationUpdatedAt(conversation: Conversation) {
  return (
    dateFrom(conversation.lastMessage?.createdAt) ||
    dateFrom(conversation.lastMessageIncomingAt) ||
    dateFrom(conversation.lastMessageOutgoingAt)
  );
}

function normalizeRole(senderType: string) {
  if (senderType === 'contact') return 'patient';
  if (senderType === 'bot') return 'bot';
  if (senderType === 'agent' || senderType === 'human') return 'human';
  return senderType || 'unknown';
}

function extractText(body: MessageBody): string | null {
  if (body.type !== 'text') return null;

  if (typeof body === 'object' && 'text' in body) {
    const textField = (body as { text?: unknown }).text;

    if (typeof textField === 'string') return textField;
    if (textField && typeof textField === 'object' && 'text' in textField) {
      const nested = (textField as { text?: unknown }).text;
      if (typeof nested === 'string') return nested;
    }
  }

  return null;
}

async function fetchJson<T>(url: string, accessKey: string) {
  const response = await fetch(url, {
    headers: {
      Authorization: `AccessKey ${accessKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Bird API ${response.status} ${response.statusText}: ${text}`);
  }

  return (await response.json()) as T;
}

async function fetchRecentConversations(accessKey: string, workspaceId: string, cutoff: Date) {
  const channelFilter = getOptionalChannelId();
  const conversations: Conversation[] = [];

  let pageToken: string | undefined;

  do {
    const searchParams = new URLSearchParams({
      limit: '100',
    });
    if (pageToken) {
      searchParams.set('pageToken', pageToken);
    }

    const url = `${BIRD_API_BASE}/workspaces/${workspaceId}/conversations?${searchParams.toString()}`;
    const page = await fetchJson<ConversationsResponse>(url, accessKey);

    for (const conversation of page.results) {
      if (channelFilter && conversation.channelId !== channelFilter) continue;

      const updatedAt = conversationUpdatedAt(conversation);
      if (!updatedAt || updatedAt < cutoff) continue;

      conversations.push(conversation);
    }

    const lastInPage = page.results[page.results.length - 1];
    const lastUpdatedAt = lastInPage ? conversationUpdatedAt(lastInPage) : null;
    const allOld = lastUpdatedAt && lastUpdatedAt < cutoff;

    pageToken = page.nextPageToken && !allOld ? page.nextPageToken : undefined;
  } while (pageToken);

  return conversations;
}

async function fetchConversationMessages(
  accessKey: string,
  workspaceId: string,
  conversationId: string
) {
  const messages: Message[] = [];
  let pageToken: string | undefined;

  do {
    const searchParams = new URLSearchParams({
      limit: '100',
      direction: 'asc',
    });
    if (pageToken) {
      searchParams.set('pageToken', pageToken);
    }

    const url = `${BIRD_API_BASE}/workspaces/${workspaceId}/conversations/${conversationId}/messages?${searchParams.toString()}`;
    const page = await fetchJson<MessagesResponse>(url, accessKey);

    messages.push(...page.results);
    pageToken = page.nextPageToken;
  } while (pageToken);

  return messages;
}

async function main() {
  const { accessKey, workspaceId } = getBirdConfig();
  const cutoff = new Date(Date.now() - THIRTY_DAYS_MS);

  console.log('Exportando conversaciones de los últimos 30 días...');

  const conversations = await fetchRecentConversations(accessKey, workspaceId, cutoff);
  console.log(`Conversaciones candidatas: ${conversations.length}`);

  const exported = [];

  for (const conversation of conversations) {
    const messages = await fetchConversationMessages(accessKey, workspaceId, conversation.id);

    const textMessages = messages
      .map((message) => ({
        id: message.id,
        at: message.createdAt,
        role: normalizeRole(message.sender.type),
        sender: message.sender.displayName ?? message.sender.type,
        text: extractText(message.body),
      }))
      .filter((m) => m.text && m.text.trim().length > 0);

    if (!textMessages.length) continue;

    const contactPhone =
      conversation.featuredParticipants?.find((p) => p.type === 'contact')?.contact
        ?.identifierValue ?? null;

    exported.push({
      conversationId: conversation.id,
      channelId: conversation.channelId ?? null,
      contactPhone,
      lastMessageAt:
        conversation.lastMessage?.createdAt ??
        conversation.lastMessageIncomingAt ??
        conversation.lastMessageOutgoingAt ??
        null,
      messages: textMessages,
    });
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const filename = `whatsapp-conversations-${new Date().toISOString().slice(0, 10)}.json`;
  const outputPath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(outputPath, JSON.stringify(exported, null, 2), 'utf8');

  console.log(`Export completado: ${exported.length} conversaciones -> ${outputPath}`);
}

main().catch((error) => {
  console.error('Error al exportar conversaciones:', error);
  process.exitCode = 1;
});
