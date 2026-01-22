/**
 * @file Conversation Text Parser
 * @description Extracts text from Bird conversation messages with type safety
 * @module app/api/cron/normalize-contacts/lib/conversation-parser
 * @exports parseConversationText, extractMessageText
 */

import { getConversationMessages } from '@/lib/bird/conversations';
import type { BirdMessage } from '@/lib/bird/types';
import type { ConversationParseResult } from './types';

/**
 * Extract text from message body with type safety
 *
 * Handles Bird API's complex message body types:
 * - { type: 'text', text: string } (simple format)
 * - { type: 'text', text: { text: string } } (nested format)
 *
 * WHY: Bird API returns different formats depending on message source
 * (webhook vs API fetch). This function normalizes both formats.
 *
 * @param msg - Bird message from conversation
 * @returns Extracted text or empty string if not text type
 *
 * @example
 * ```ts
 * const text = extractMessageText(msg);
 * // "Hola soy Maria"
 * ```
 */
export function extractMessageText(msg: BirdMessage): string {
  if (msg.body.type !== 'text') {
    return '';
  }

  const body = msg.body as { type: 'text'; text?: { text?: string } | string };

  if (!body.text) {
    return '';
  }

  // Handle both string and object formats
  if (typeof body.text === 'string') {
    return body.text;
  }

  return body.text.text || '';
}

/**
 * Parse conversation text from Bird messages
 *
 * Fetches last 10 messages from conversation and extracts text from
 * contact messages only (excludes agent/bot messages).
 *
 * WHY: GPT-4o-mini needs conversation context to extract contact data.
 * We only use contact messages because agent messages don't contain
 * patient name or contact information.
 *
 * @param conversationId - Bird conversation UUID
 * @returns Parsed conversation result with text and metadata
 *
 * @example
 * ```ts
 * const result = await parseConversationText('uuid-123');
 * // result.text: "Hola soy Maria\nMi email es [email protected]"
 * // result.contactMessages: 2
 * // result.isEmpty: false
 * ```
 */
export async function parseConversationText(
  conversationId: string
): Promise<ConversationParseResult> {
  // Fetch all messages, then take last 10
  const allMessages = await getConversationMessages(conversationId);
  const messages = allMessages.slice(-10);

  // Filter to contact messages only
  const contactMessages = messages.filter((msg) => msg.sender.type === 'contact');

  // Extract text from each message
  const textLines = contactMessages
    .map((msg) => extractMessageText(msg))
    .filter((text) => text.length > 0);

  const conversationText = textLines.join('\n');

  return {
    text: conversationText,
    messageCount: messages.length,
    contactMessages: contactMessages.length,
    isEmpty: conversationText.trim().length === 0,
  };
}
