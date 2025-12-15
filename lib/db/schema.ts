import { pgTable, uuid, varchar, text, timestamp, jsonb, boolean, integer, customType } from 'drizzle-orm/pg-core';

/**
 * Custom type for pgvector embeddings
 * Stores 768-dimensional vectors for semantic search
 */
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(768)';
  },
  toDriver(value: number[]): string {
    return JSON.stringify(value);
  },
  fromDriver(value: string): number[] {
    return JSON.parse(value);
  }
});

/**
 * Medical knowledge base - Validated content with vector embeddings for RAG
 */
export const medicalKnowledge = pgTable('medical_knowledge', {
  knowledgeId: uuid('knowledge_id').primaryKey().defaultRandom(),
  content: text('content').notNull(),
  embedding: vector('embedding'),
  category: varchar('category', { length: 50 }).notNull(),
  subcategory: text('subcategory'),
  metadata: jsonb('metadata'),
  validatedBy: varchar('validated_by', { length: 100 }).notNull(),
  validatedAt: timestamp('validated_at').notNull(),
  version: integer('version').notNull().default(1),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

/**
 * Leads table - Tracks potential patients and their journey
 */
export const leads = pgTable('leads', {
  leadId: uuid('lead_id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull().unique(),
  name: text('name'),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  country: varchar('country', { length: 100 }),
  city: varchar('city', { length: 100 }),
  procedureInterest: text('procedure_interest'),
  stage: varchar('stage', { length: 50 }).notNull().default('new'),
  source: varchar('source', { length: 50 }).notNull().default('whatsapp'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

/**
 * Consents table - Tracks user consent for sensitive data processing
 */
export const consents = pgTable('consents', {
  consentId: uuid('consent_id').primaryKey().defaultRandom(),
  leadId: uuid('lead_id').notNull().references(() => leads.leadId),
  conversationId: uuid('conversation_id').notNull(),
  consentType: varchar('consent_type', { length: 50 }).notNull(),
  granted: boolean('granted').notNull().default(false),
  method: varchar('method', { length: 50 }).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

/**
 * Appointments table - Tracks scheduled consultations and procedures
 */
export const appointments = pgTable('appointments', {
  appointmentId: uuid('appointment_id').primaryKey().defaultRandom(),
  leadId: uuid('lead_id').notNull().references(() => leads.leadId),
  conversationId: uuid('conversation_id').notNull(),
  appointmentType: varchar('appointment_type', { length: 50 }).notNull(),
  scheduledAt: timestamp('scheduled_at').notNull(),
  location: varchar('location', { length: 255 }),
  status: varchar('status', { length: 50 }).notNull().default('scheduled'),
  remindersSent: jsonb('reminders_sent'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

/**
 * Message logs table - Tracks all conversation messages for context reconstruction
 */
export const messageLogs = pgTable('message_logs', {
  messageId: uuid('message_id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull(),
  direction: varchar('direction', { length: 20 }).notNull(),
  text: text('text'),
  attachmentsMeta: jsonb('attachments_meta'),
  toolCalls: jsonb('tool_calls'),
  model: varchar('model', { length: 100 }),
  tokensUsed: jsonb('tokens_used'),
  processingTimeMs: jsonb('processing_time_ms'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

/**
 * Conversation state table - Tracks current conversation state and context
 */
export const conversationState = pgTable('conversation_state', {
  conversationId: uuid('conversation_id').primaryKey(),
  leadId: uuid('lead_id').references(() => leads.leadId),
  currentStage: varchar('current_stage', { length: 50 }).notNull().default('greeting'),
  lastMessageAt: timestamp('last_message_at').notNull().defaultNow(),
  messagesCount: jsonb('messages_count'),
  requiresHuman: boolean('requires_human').notNull().default(false),
  handoverReason: text('handover_reason'),
  context: jsonb('context'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

/**
 * Type exports for use in queries
 */
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;

export type Consent = typeof consents.$inferSelect;
export type NewConsent = typeof consents.$inferInsert;

export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;

export type MessageLog = typeof messageLogs.$inferSelect;
export type NewMessageLog = typeof messageLogs.$inferInsert;

export type ConversationState = typeof conversationState.$inferSelect;
export type NewConversationState = typeof conversationState.$inferInsert;

export type MedicalKnowledge = typeof medicalKnowledge.$inferSelect;
export type NewMedicalKnowledge = typeof medicalKnowledge.$inferInsert;
