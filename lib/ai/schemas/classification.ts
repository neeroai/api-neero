/**
 * @file Classification
 * @description Exports 4 functions and types
 * @module lib/ai/schemas/classification
 * @exports ClassificationResult, ClassificationResultSchema, ImageType, ImageTypeSchema
 */
import { z } from 'zod';

/**
 * Image type classification for routing to optimal processor
 */
export const ImageTypeSchema = z.enum(['photo', 'invoice', 'document', 'unknown'], {
  description: 'Type of image for routing to appropriate processor',
});

/**
 * Classification result with confidence and reasoning
 */
export const ClassificationResultSchema = z.object({
  type: ImageTypeSchema.describe('Classified image type'),
  confidence: z.number().min(0).max(1).describe('Confidence score for classification (0-1)'),
  reasoning: z.string().optional().describe('Explanation of why this classification was chosen'),
  subtype: z
    .string()
    .optional()
    .describe('Specific subtype like "cedula", "receipt", "person", "product"'),
  language: z.string().optional().describe('Detected language code (es, en, other)'),
});

export type ImageType = z.infer<typeof ImageTypeSchema>;
export type ClassificationResult = z.infer<typeof ClassificationResultSchema>;
