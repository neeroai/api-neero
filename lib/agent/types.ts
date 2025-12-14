import { z } from 'zod';

/**
 * Agent Inbound Request Schema
 * Handles incoming WhatsApp messages from Bird AI Employee
 */
export const AgentInboundRequestSchema = z.object({
  context: z.object({
    conversationId: z.string().uuid(),
    contactName: z.string().optional(),
    contactId: z.string().optional(),
    channelId: z.string().optional()
  }),
  message: z.object({
    text: z.string().optional(),
    attachments: z.array(z.object({
      type: z.enum(['image', 'audio', 'document', 'video']),
      url: z.string().url(),
      mimeType: z.string().optional()
    })).optional()
  }).optional()
});

export type AgentInboundRequest = z.infer<typeof AgentInboundRequestSchema>;

/**
 * Agent Inbound Response Schema
 * Response sent back to Bird AI Employee
 */
export const AgentInboundResponseSchema = z.object({
  reply: z.string(),
  channelOps: z.array(z.object({
    type: z.enum(['sendMessage', 'sendTemplate', 'createTicket']),
    payload: z.record(z.unknown())
  })).optional(),
  status: z.enum(['resolved', 'handover', 'error', 'continued']),
  handoverReason: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

export type AgentInboundResponse = z.infer<typeof AgentInboundResponseSchema>;

/**
 * Agent Outbound Request Schema
 * Handles proactive messages (reminders, follow-ups)
 */
export const AgentOutboundRequestSchema = z.object({
  type: z.enum(['reminder_72h', 'reminder_24h', 'reminder_3h', 'followup']),
  appointmentId: z.string().uuid().optional(),
  conversationId: z.string().uuid().optional()
});

export type AgentOutboundRequest = z.infer<typeof AgentOutboundRequestSchema>;

/**
 * Media Analysis Request Schema
 * Direct multimodal processing without conversation context
 */
export const MediaAnalysisRequestSchema = z.object({
  conversationId: z.string().uuid(),
  mediaType: z.enum(['image', 'audio', 'document']),
  checkConsent: z.boolean().default(true)
});

export type MediaAnalysisRequest = z.infer<typeof MediaAnalysisRequestSchema>;

/**
 * Media Analysis Response Schema
 */
export const MediaAnalysisResponseSchema = z.object({
  success: z.boolean(),
  type: z.enum(['image', 'audio', 'document']),
  data: z.record(z.unknown()),
  processingTime: z.number(),
  model: z.string(),
  consentRequired: z.boolean().optional()
});

export type MediaAnalysisResponse = z.infer<typeof MediaAnalysisResponseSchema>;

/**
 * Conversation Context Type
 * Reconstructed context for AI inference
 */
export const ConversationContextSchema = z.object({
  conversationId: z.string().uuid(),
  leadId: z.string().uuid().optional(),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
    timestamp: z.date()
  })),
  lead: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    procedureInterest: z.string().optional(),
    stage: z.string()
  }).optional(),
  metadata: z.record(z.unknown()).optional()
});

export type ConversationContext = z.infer<typeof ConversationContextSchema>;

/**
 * Tool Call Result Types
 */
export const ToolCallResultSchema = z.object({
  success: z.boolean(),
  data: z.record(z.unknown()).optional(),
  error: z.string().optional()
});

export type ToolCallResult = z.infer<typeof ToolCallResultSchema>;

/**
 * Consent Types
 */
export type ConsentType = 'photo_analysis' | 'audio_transcription' | 'document_processing' | 'appointment_booking';

/**
 * Guardrails Validation Result
 */
export const GuardrailsValidationSchema = z.object({
  safe: z.boolean(),
  violations: z.array(z.string()),
  severity: z.enum(['none', 'low', 'medium', 'high', 'critical']).optional()
});

export type GuardrailsValidation = z.infer<typeof GuardrailsValidationSchema>;

/**
 * Service Window Status
 */
export const ServiceWindowStatusSchema = z.object({
  state: z.enum(['open', 'closed']),
  lastInteractionAt: z.date().optional(),
  expiresAt: z.date().optional()
});

export type ServiceWindowStatus = z.infer<typeof ServiceWindowStatusSchema>;
