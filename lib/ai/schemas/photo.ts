/**
 * @file Photo
 * @description Exports 2 functions and types
 * @module lib/ai/schemas/photo
 * @exports PhotoAnalysis, PhotoAnalysisSchema
 */
import { z } from 'zod';

/**
 * Photo analysis output schema for people/objects/scenes
 * Optimized for Gemini 2.0 Flash processing
 */
export const PhotoAnalysisSchema = z.object({
  description: z.string().describe('Detailed description of the photo content'),

  objects: z.array(z.string()).describe('List of detected objects in the image'),

  people: z
    .object({
      count: z.number().int().min(0).describe('Number of people detected'),
      description: z.string().optional().describe('Description of people in the photo'),
    })
    .optional()
    .describe('People detection results if present'),

  scene: z.string().describe('Location or setting of the photo (indoor/outdoor, type of place)'),

  text: z.string().optional().describe('Any text detected in the image via OCR'),

  colors: z.array(z.string()).describe('Dominant colors in the image'),

  confidence: z.number().min(0).max(1).optional().describe('Confidence score for analysis (0-1)'),

  metadata: z
    .record(z.unknown())
    .optional()
    .describe('Additional metadata or contextual information'),
});

export type PhotoAnalysis = z.infer<typeof PhotoAnalysisSchema>;
