/**
 * @file Bird Actions API Types
 * @description TypeScript type definitions
 * @module lib/bird/types
 * @exports AudioData, AudioDataSchema, BirdActionContext, BirdActionContextSchema, BirdActionErrorResponse, BirdActionErrorResponseSchema, BirdActionRequest, BirdActionRequestSchema, BirdActionResponse, BirdActionResponseSchema, BirdActionSuccessResponse, BirdActionSuccessResponseSchema, BirdContact, BirdContactAttributes, BirdContactIdentifier, BirdContactUpdate, BirdConversation, BirdConversationParticipant, BirdConversationsResponse, BirdMessage, BirdMessageBody, BirdMessagesResponse, ContactUpdateErrorCode, ContactUpdateErrorCodeSchema, ContactUpdateErrorResponse, ContactUpdateErrorResponseSchema, ContactUpdateRequest, ContactUpdateRequestSchema, ContactUpdateResponse, ContactUpdateResponseSchema, ContactUpdateSuccessResponse, ContactUpdateSuccessResponseSchema, DocumentData, DocumentDataSchema, ErrorCode, ErrorCodeSchema, ImageData, ImageDataSchema, MediaType, MediaTypeSchema, ResponseData, ResponseDataSchema, isErrorResponse, isSuccessResponse
 */
/**
 * Bird Actions API Types
 * Zod schemas for type-safe Bird AI Employees Actions integration
 */

import { z } from 'zod';

/**
 * Media type enumeration
 */
export const MediaTypeSchema = z.enum(['image', 'document', 'audio']);
export type MediaType = z.infer<typeof MediaTypeSchema>;

/**
 * Bird Action Request Context
 * v3.0: conversationId is now REQUIRED for media extraction from conversation
 */
export const BirdActionContextSchema = z
  .object({
    conversationId: z.string().uuid(),
    email: z.string().email().optional(),
    name: z.string().optional(),
    pais: z.string().optional(),
    telefono: z.string().optional(),
  })
  .passthrough(); // Allow additional fields

export type BirdActionContext = z.infer<typeof BirdActionContextSchema>;

/**
 * Bird Action Request (POST body from Bird AI Employee)
 * v3.0 BREAKING CHANGE:
 * - Renamed 'type' to 'mediaType'
 * - Removed 'mediaUrl' (AI Employee cannot obtain it reliably)
 * - Made 'context' required (need conversationId for media extraction)
 * - Made 'mediaType' optional (API auto-detects from latest message)
 */
export const BirdActionRequestSchema = z.object({
  mediaType: MediaTypeSchema.optional(),
  context: BirdActionContextSchema,
});

export type BirdActionRequest = z.infer<typeof BirdActionRequestSchema>;

/**
 * Extracted fields from image processing
 */
export const ImageDataSchema = z.object({
  documentType: z.enum(['cedula', 'passport', 'invoice', 'receipt', 'photo', 'unknown']).optional(),
  extractedFields: z.record(z.string(), z.unknown()).optional(),
  description: z.string().optional(),
});

export type ImageData = z.infer<typeof ImageDataSchema>;

/**
 * Extracted fields from audio processing
 */
export const AudioDataSchema = z.object({
  transcript: z.string(),
  language: z.enum(['es', 'en', 'auto']).optional(),
  duration: z.number().optional(),
});

export type AudioData = z.infer<typeof AudioDataSchema>;

/**
 * Extracted fields from document processing
 */
export const DocumentDataSchema = z.object({
  text: z.string(),
  pages: z.number().optional(),
  documentType: z.string().optional(),
});

export type DocumentData = z.infer<typeof DocumentDataSchema>;

/**
 * Response data (union type based on media type)
 */
export const ResponseDataSchema = z.union([ImageDataSchema, AudioDataSchema, DocumentDataSchema]);

export type ResponseData = z.infer<typeof ResponseDataSchema>;

/**
 * Bird Action Success Response
 */
export const BirdActionSuccessResponseSchema = z.object({
  success: z.literal(true),
  type: MediaTypeSchema,
  data: ResponseDataSchema,
  processingTime: z.string(),
  model: z.string(),
  fallbackUsed: z.boolean().optional(), // True if fallback provider was used (audio only)
});

export type BirdActionSuccessResponse = z.infer<typeof BirdActionSuccessResponseSchema>;

/**
 * Error codes for failed processing
 */
export const ErrorCodeSchema = z.enum([
  'TIMEOUT',
  'TIMEOUT_ERROR',
  'INVALID_MEDIA',
  'PROCESSING_ERROR',
  'DOWNLOAD_ERROR',
  'MEDIA_DOWNLOAD_ERROR',
  'MEDIA_EXTRACTION_ERROR',
  'UNAUTHORIZED',
  'AUTHENTICATION_ERROR',
  'VALIDATION_ERROR',
  'UNSUPPORTED_MEDIA_TYPE',
]);

export type ErrorCode = z.infer<typeof ErrorCodeSchema>;

/**
 * Bird Action Error Response
 */
export const BirdActionErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: ErrorCodeSchema,
  processingTime: z.string().optional(),
});

export type BirdActionErrorResponse = z.infer<typeof BirdActionErrorResponseSchema>;

/**
 * Bird Action Response (union of success and error)
 */
export const BirdActionResponseSchema = z.union([
  BirdActionSuccessResponseSchema,
  BirdActionErrorResponseSchema,
]);

export type BirdActionResponse = z.infer<typeof BirdActionResponseSchema>;

/**
 * Type guard for success response
 */
export function isSuccessResponse(
  response: BirdActionResponse
): response is BirdActionSuccessResponse {
  return response.success === true;
}

/**
 * Type guard for error response
 */
export function isErrorResponse(response: BirdActionResponse): response is BirdActionErrorResponse {
  return response.success === false;
}

/**
 * Bird Contact identifier
 */
export interface BirdContactIdentifier {
  key: string;
  value: string;
}

/**
 * Bird Contact attributes (custom fields configured in Bird workspace)
 * IMPORTANT: Only include attributes that EXIST in your Bird workspace
 */
export interface BirdContactAttributes {
  // Display Name fields (NEW - discovered from Bird API docs)
  displayName?: string; // Direct displayName attribute (may have priority over computed)
  firstName?: string; // First name (can be in attributes for storage)
  lastName?: string; // Last name (can be in attributes for storage)

  // Custom attributes that EXIST
  jose?: string; // Full name (custom attribute)
  telefono?: string; // Local phone number
  email?: string; // Email (system attribute, can be in attributes too)
  city?: string; // City (system attribute)
  country?: string; // Country (custom attribute for location)
  fase?: string; // Lead phase (custom attribute)
  initialSource?: string; // Initial contact source (custom attribute)

  // Allow additional custom attributes from Bird workspace
  pagovaloracion?: string;
  referido?: string;
  birthday?: string;
  accountIds?: string[];

  [key: string]: any; // Allow other custom attributes
}

/**
 * Bird Contact (GET response)
 */
export interface BirdContact {
  id: string;
  computedDisplayName: string;
  featuredIdentifiers: BirdContactIdentifier[];
  identifierCount: number;
  attributes: Record<string, any>;
  listIds: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Bird Contact Update payload (PATCH request)
 * Includes system fields (firstName, lastName) that fix the Contact column display
 */
export interface BirdContactUpdate {
  firstName?: string; // System field - fixes Contact column
  lastName?: string; // System field - fixes Contact column
  attributes?: BirdContactAttributes;
}

/**
 * Bird Conversation Participant
 */
export interface BirdConversationParticipant {
  type: string;
  displayName?: string;
  contact?: {
    identifierValue?: string;
  };
}

/**
 * Bird Conversation
 */
export interface BirdConversation {
  id: string;
  channelId?: string;
  featuredParticipants?: BirdConversationParticipant[];
  lastMessage?: {
    createdAt?: string;
  };
  lastMessageIncomingAt?: string;
  lastMessageOutgoingAt?: string;
}

/**
 * Bird Conversations API response
 */
export interface BirdConversationsResponse {
  results: BirdConversation[];
  nextPageToken?: string;
}

/**
 * Bird Message Body
 */
export type BirdMessageBody =
  | { type: 'text'; text?: { text?: string } | string }
  | { type: 'image' }
  | { type: 'file' }
  | { type: 'location' }
  | { type: string; [key: string]: unknown };

/**
 * Bird Conversation Message
 */
export interface BirdMessage {
  id: string;
  createdAt: string;
  sender: { type: string; displayName?: string };
  body: BirdMessageBody;
}

/**
 * Bird Messages API response
 */
export interface BirdMessagesResponse {
  results: BirdMessage[];
  nextPageToken?: string;
}

/**
 * Contact Update API - Request/Response Schemas
 * For /api/contacts/update endpoint
 */

/**
 * Contact Update Request (POST body)
 */
export const ContactUpdateRequestSchema = z.object({
  context: z.object({
    conversationId: z.string().uuid().optional(), // Optional - not used in business logic, kept for audit trail
    contactPhone: z.string().min(1), // Required for searching contact
    contactName: z.string().optional(), // Optional for logging
  }),
  updates: z
    .object({
      displayName: z.string().min(1).max(100).optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      country: z.string().length(2).optional(), // ISO 3166-1 alpha-2
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    }),
});

export type ContactUpdateRequest = z.infer<typeof ContactUpdateRequestSchema>;

/**
 * Contact Update Success Response
 */
export const ContactUpdateSuccessResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.object({
    contactId: z.string().uuid(),
    before: z.object({
      displayName: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      country: z.string().optional(),
    }),
    after: z.object({
      displayName: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      country: z.string().optional(),
    }),
    updatedFields: z.array(z.string()),
    verified: z.boolean(),
  }),
  processingTime: z.string(),
});

export type ContactUpdateSuccessResponse = z.infer<typeof ContactUpdateSuccessResponseSchema>;

/**
 * Contact Update Error Codes
 */
export const ContactUpdateErrorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'CONTACT_NOT_FOUND',
  'UPDATE_ERROR',
  'VERIFICATION_ERROR',
  'TIMEOUT_ERROR',
  'UNAUTHORIZED',
]);

export type ContactUpdateErrorCode = z.infer<typeof ContactUpdateErrorCodeSchema>;

/**
 * Contact Update Error Response
 */
export const ContactUpdateErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: ContactUpdateErrorCodeSchema,
  details: z.record(z.string(), z.any()).optional(),
  processingTime: z.string().optional(),
});

export type ContactUpdateErrorResponse = z.infer<typeof ContactUpdateErrorResponseSchema>;

/**
 * Contact Update Response (union of success and error)
 */
export const ContactUpdateResponseSchema = z.union([
  ContactUpdateSuccessResponseSchema,
  ContactUpdateErrorResponseSchema,
]);

export type ContactUpdateResponse = z.infer<typeof ContactUpdateResponseSchema>;
