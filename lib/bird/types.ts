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
 */
export const BirdActionRequestSchema = z.object({
  mediaType: MediaTypeSchema,
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
