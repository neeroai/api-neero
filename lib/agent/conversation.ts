import { db } from '@/lib/db/client';
import { messageLogs, leads, conversationState } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { ConversationContext, MessageMetadata } from './types';

/**
 * Reconstructs conversation context from database
 * Fetches last 10 messages + lead data for AI inference
 *
 * @param conversationId - UUID of the conversation
 * @returns Conversation context with messages and lead data
 */
export async function reconstructContext(conversationId: string): Promise<ConversationContext> {
  const [messages, leadData, state] = await Promise.all([
    db.select()
      .from(messageLogs)
      .where(eq(messageLogs.conversationId, conversationId))
      .orderBy(desc(messageLogs.createdAt))
      .limit(10),

    db.select()
      .from(leads)
      .where(eq(leads.conversationId, conversationId))
      .limit(1),

    db.select()
      .from(conversationState)
      .where(eq(conversationState.conversationId, conversationId))
      .limit(1)
  ]);

  return {
    conversationId,
    leadId: leadData[0]?.leadId,
    messages: messages.reverse().map(msg => ({
      role: msg.direction === 'incoming' ? 'user' as const : 'assistant' as const,
      content: msg.text || '',
      timestamp: msg.createdAt
    })),
    lead: leadData[0] ? {
      name: leadData[0].name || undefined,
      phone: leadData[0].phone || undefined,
      email: leadData[0].email || undefined,
      procedureInterest: leadData[0].procedureInterest || undefined,
      stage: leadData[0].stage
    } : undefined,
    metadata: {
      currentStage: state[0]?.currentStage,
      messagesCount: state[0]?.messagesCount,
      requiresHuman: state[0]?.requiresHuman
    }
  };
}

/**
 * Saves a message to the database
 *
 * @param conversationId - UUID of the conversation
 * @param direction - 'incoming' (user) or 'outgoing' (assistant)
 * @param text - Message text content
 * @param extraMetadata - Optional metadata (attachments, tool calls, model info, structured metadata)
 */
export async function saveMessage(
  conversationId: string,
  direction: 'incoming' | 'outgoing',
  text: string,
  extraMetadata?: {
    attachmentsMeta?: unknown;
    toolCalls?: unknown;
    model?: string;
    tokensUsed?: unknown;
    processingTimeMs?: unknown;
    metadata?: MessageMetadata;
  }
): Promise<void> {
  await db.insert(messageLogs).values({
    conversationId,
    direction,
    text,
    attachmentsMeta: extraMetadata?.attachmentsMeta,
    toolCalls: extraMetadata?.toolCalls,
    model: extraMetadata?.model,
    tokensUsed: extraMetadata?.tokensUsed,
    processingTimeMs: extraMetadata?.processingTimeMs,
    metadata: extraMetadata?.metadata
  });
}

/**
 * Updates conversation state
 *
 * @param conversationId - UUID of the conversation
 * @param updates - Fields to update
 */
export async function updateConversationState(
  conversationId: string,
  updates: {
    currentStage?: string;
    requiresHuman?: boolean;
    handoverReason?: string;
    context?: unknown;
    messagesCount?: unknown;
  }
): Promise<void> {
  const existing = await db.select()
    .from(conversationState)
    .where(eq(conversationState.conversationId, conversationId))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(conversationState).values({
      conversationId,
      ...updates,
      lastMessageAt: new Date()
    });
  } else {
    await db.update(conversationState)
      .set({
        ...updates,
        lastMessageAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(conversationState.conversationId, conversationId));
  }
}

/**
 * Checks if conversation requires human handover
 *
 * @param conversationId - UUID of the conversation
 * @returns True if handover is required
 */
export async function requiresHandover(conversationId: string): Promise<boolean> {
  const state = await db.select()
    .from(conversationState)
    .where(eq(conversationState.conversationId, conversationId))
    .limit(1);

  return state[0]?.requiresHuman || false;
}

/**
 * Marks conversation for human handover
 *
 * @param conversationId - UUID of the conversation
 * @param reason - Reason for handover
 */
export async function markForHandover(
  conversationId: string,
  reason: string
): Promise<void> {
  await updateConversationState(conversationId, {
    requiresHuman: true,
    handoverReason: reason
  });
}
