/**
 * Conversation Persistence Patterns
 * NOTE: Interfaces only - implementation left to user
 *
 * These interfaces define the contract for conversation operations.
 * Implement these with your database of choice (PostgreSQL, MySQL, etc.)
 */

import type { CoreMessage } from 'ai';

/**
 * Conversation data structure
 */
export interface ConversationData {
  id?: string;
  userId: string;
  title?: string;
  status?: 'active' | 'archived' | 'deleted';
  metadata?: Record<string, unknown>;
  messageCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Message data structure
 */
export interface MessageData {
  id?: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  whatsappMessageId?: string;
  metadata?: Record<string, unknown>;
  tokenCount?: number;
  createdAt?: Date;
}

/**
 * Conversation with messages
 */
export interface ConversationWithMessages extends ConversationData {
  messages: MessageData[];
}

/**
 * Interface: Save or update conversation
 *
 * Implementation example:
 * ```ts
 * export async function saveConversation(data: ConversationData): Promise<ConversationData> {
 *   const db = await getDatabase();
 *
 *   if (data.id) {
 *     // Update existing
 *     return await db.update(conversations)
 *       .set({ ...data, updatedAt: new Date() })
 *       .where(eq(conversations.id, data.id))
 *       .returning();
 *   }
 *
 *   // Create new
 *   return await db.insert(conversations)
 *     .values(data)
 *     .returning();
 * }
 * ```
 */
export interface SaveConversation {
  (data: ConversationData): Promise<ConversationData>;
}

/**
 * Interface: Get conversation by ID
 *
 * Implementation example:
 * ```ts
 * export async function getConversation(id: string): Promise<ConversationData | null> {
 *   const db = await getDatabase();
 *
 *   const result = await db.select()
 *     .from(conversations)
 *     .where(eq(conversations.id, id))
 *     .limit(1);
 *
 *   return result[0] || null;
 * }
 * ```
 */
export interface GetConversation {
  (id: string): Promise<ConversationData | null>;
}

/**
 * Interface: Get conversation history for user
 *
 * Implementation example:
 * ```ts
 * export async function getConversationHistory(
 *   userId: string,
 *   limit = 20
 * ): Promise<ConversationData[]> {
 *   const db = await getDatabase();
 *
 *   return await db.select()
 *     .from(conversations)
 *     .where(eq(conversations.userId, userId))
 *     .orderBy(desc(conversations.createdAt))
 *     .limit(limit);
 * }
 * ```
 */
export interface GetConversationHistory {
  (userId: string, limit?: number): Promise<ConversationData[]>;
}

/**
 * Interface: Get conversation with all messages
 *
 * Implementation example:
 * ```ts
 * export async function getConversationWithMessages(
 *   conversationId: string
 * ): Promise<ConversationWithMessages | null> {
 *   const db = await getDatabase();
 *
 *   const conversation = await getConversation(conversationId);
 *   if (!conversation) return null;
 *
 *   const messages = await db.select()
 *     .from(messages)
 *     .where(eq(messages.conversationId, conversationId))
 *     .orderBy(asc(messages.createdAt));
 *
 *   return {
 *     ...conversation,
 *     messages
 *   };
 * }
 * ```
 */
export interface GetConversationWithMessages {
  (conversationId: string): Promise<ConversationWithMessages | null>;
}

/**
 * Interface: Save message to conversation
 *
 * Implementation example:
 * ```ts
 * export async function saveMessage(data: MessageData): Promise<MessageData> {
 *   const db = await getDatabase();
 *
 *   const result = await db.insert(messages)
 *     .values(data)
 *     .returning();
 *
 *   // Update conversation message count
 *   await db.update(conversations)
 *     .set({
 *       messageCount: sql`message_count + 1`,
 *       updatedAt: new Date()
 *     })
 *     .where(eq(conversations.id, data.conversationId));
 *
 *   return result[0];
 * }
 * ```
 */
export interface SaveMessage {
  (data: MessageData): Promise<MessageData>;
}

/**
 * Interface: Delete conversation and all messages
 *
 * Implementation example:
 * ```ts
 * export async function deleteConversation(conversationId: string): Promise<void> {
 *   const db = await getDatabase();
 *
 *   // Delete messages first (foreign key constraint)
 *   await db.delete(messages)
 *     .where(eq(messages.conversationId, conversationId));
 *
 *   // Delete conversation
 *   await db.delete(conversations)
 *     .where(eq(conversations.id, conversationId));
 * }
 * ```
 */
export interface DeleteConversation {
  (conversationId: string): Promise<void>;
}

/**
 * Helper: Convert database messages to AI SDK format
 *
 * @param messages - Array of database messages
 * @returns Array of CoreMessage for AI SDK
 *
 * @example
 * ```ts
 * const conversation = await getConversationWithMessages(conversationId);
 * const aiMessages = convertToAIMessages(conversation.messages);
 *
 * const result = await generateText({
 *   model: openai('gpt-4o-mini'),
 *   messages: aiMessages
 * });
 * ```
 */
export function convertToAIMessages(messages: MessageData[]): CoreMessage[] {
  return messages.map((msg) => ({
    role: msg.role as 'user' | 'assistant' | 'system' | 'tool',
    content: msg.content,
  }));
}

/**
 * Helper: Convert AI SDK messages to database format
 *
 * @param messages - Array of AI SDK messages
 * @param conversationId - Conversation ID to associate with
 * @returns Array of MessageData for database insertion
 *
 * @example
 * ```ts
 * const aiMessages: CoreMessage[] = [
 *   { role: 'user', content: 'Hello' },
 *   { role: 'assistant', content: 'Hi there!' }
 * ];
 *
 * const dbMessages = convertFromAIMessages(aiMessages, conversationId);
 * for (const msg of dbMessages) {
 *   await saveMessage(msg);
 * }
 * ```
 */
export function convertFromAIMessages(
  messages: CoreMessage[],
  conversationId: string
): Omit<MessageData, 'id' | 'createdAt'>[] {
  return messages.map((msg) => ({
    conversationId,
    role: msg.role,
    content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
  }));
}
