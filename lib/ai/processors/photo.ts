/**
 * @file Photo Processor
 * @description Exports processPhoto
 * @module lib/ai/processors/photo
 * @exports processPhoto
 */
/**
 * Photo Processor
 * Analyzes photos with Gemini 2.0 Flash for people, objects, and scenes
 */

import { generateObject } from 'ai';
import { GeminiModelId, getGeminiModel } from '@/lib/ai/gateway';
import { getPhotoAnalysisPrompt } from '@/lib/ai/prompts/photo';
import { type PhotoAnalysis, PhotoAnalysisSchema } from '@/lib/ai/schemas/photo';

/**
 * Process photo for detailed analysis
 *
 * @param imageUrl - URL of the photo to analyze
 * @param timeoutMs - Maximum processing time in milliseconds (default: 4000ms)
 * @returns Photo analysis with objects, people, scene, and colors
 * @throws Error if processing fails or times out
 *
 * Performance: ~4 seconds with Gemini 2.0 Flash
 * Use case: General photos, people, objects, scenes, products, clothing
 */
export async function processPhoto(imageUrl: string, timeoutMs = 4000): Promise<PhotoAnalysis> {
  const model = getGeminiModel(GeminiModelId.FLASH_2_0);
  const prompt = getPhotoAnalysisPrompt();

  try {
    const result = await generateObject({
      model,
      schema: PhotoAnalysisSchema,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image', image: imageUrl },
          ],
        },
      ],
      abortSignal: AbortSignal.timeout(timeoutMs),
    });

    return result.object;
  } catch (error) {
    // Handle timeout or API errors
    if (error instanceof Error) {
      if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
        throw new Error(`Photo processing timeout after ${timeoutMs}ms`);
      }
      throw new Error(`Photo processing failed: ${error.message}`);
    }
    throw error;
  }
}
