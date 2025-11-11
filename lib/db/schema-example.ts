/**
 * Drizzle ORM Schema Examples
 * NOTE: Examples only - not connected to actual database
 *
 * To use these schemas:
 * 1. Install Drizzle: pnpm add drizzle-orm
 * 2. Install database driver: pnpm add postgres (or your preferred driver)
 * 3. Configure database connection in lib/db/client.ts
 * 4. Copy these schemas to your actual schema file
 * 5. Generate migrations: pnpm drizzle-kit generate
 *
 * Reference: https://orm.drizzle.team/docs/overview
 */

import { pgTable, text, timestamp, uuid, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Users table
 * Stores user information from WhatsApp
 */
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  phoneNumber: text('phone_number').notNull().unique(),
  name: text('name').notNull(),
  whatsappId: text('whatsapp_id').notNull().unique(),
  preferences: jsonb('preferences').$type<UserPreferences>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  phoneNumberIdx: index('phone_number_idx').on(table.phoneNumber),
  whatsappIdIdx: index('whatsapp_id_idx').on(table.whatsappId),
}));

/**
 * User preferences type
 */
export type UserPreferences = {
  language?: string;
  timezone?: string;
  notifications?: boolean;
  [key: string]: unknown;
};

/**
 * Conversations table
 * Stores conversation metadata
 */
export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  title: text('title'),
  status: text('status').notNull().default('active'),
  metadata: jsonb('metadata').$type<ConversationMetadata>(),
  messageCount: integer('message_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('conversation_user_id_idx').on(table.userId),
  statusIdx: index('conversation_status_idx').on(table.status),
  createdAtIdx: index('conversation_created_at_idx').on(table.createdAt),
}));

/**
 * Conversation metadata type
 */
export type ConversationMetadata = {
  source?: 'whatsapp' | 'web' | 'api';
  tags?: string[];
  [key: string]: unknown;
};

/**
 * Messages table
 * Stores individual messages in conversations
 */
export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').references(() => conversations.id).notNull(),
  role: text('role').notNull(),
  content: text('content').notNull(),
  whatsappMessageId: text('whatsapp_message_id'),
  metadata: jsonb('metadata').$type<MessageMetadata>(),
  tokenCount: integer('token_count'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  conversationIdIdx: index('message_conversation_id_idx').on(table.conversationId),
  whatsappMessageIdIdx: index('message_whatsapp_id_idx').on(table.whatsappMessageId),
  createdAtIdx: index('message_created_at_idx').on(table.createdAt),
}));

/**
 * Message metadata type
 */
export type MessageMetadata = {
  toolCalls?: unknown[];
  model?: string;
  temperature?: number;
  [key: string]: unknown;
};

/**
 * Drizzle ORM Relations
 * Defines relationships between tables
 */
export const usersRelations = relations(users, ({ many }) => ({
  conversations: many(conversations),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

/**
 * Type exports for use in application
 */
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
