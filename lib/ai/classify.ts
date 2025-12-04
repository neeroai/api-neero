/**
 * Image Classification
 * Fast image type classification using Gemini 2.0 Flash (2-second budget)
 * Routes images to optimal processor based on content type
 */

import { generateObject } from 'ai';
import { GeminiModelId, getGeminiModel } from '@/lib/ai/gateway';
import { getClassificationPrompt } from '@/lib/ai/prompts/classify';
import {
  type ClassificationResult,
  ClassificationResultSchema,
} from '@/lib/ai/schemas/classification';
import type { TimeTracker } from '@/lib/ai/timeout';
import { checkTimeout, getRemaining } from '@/lib/ai/timeout';

/**
 * Classify image type for routing to optimal processor
 *
 * @param imageUrl - URL of the image to classify
 * @param timeTracker - Time budget tracker
 * @returns Classification result with type, confidence, and metadata
 * @throws TimeoutBudgetError if time budget exceeded
 *
 * Performance: ~2 seconds with Gemini 2.0 Flash
 */
export async function classifyImage(
  imageUrl: string,
  timeTracker: TimeTracker
): Promise<ClassificationResult> {
  // Check time budget before starting
  checkTimeout(timeTracker);

  const remainingMs = getRemaining(timeTracker);

  // Use max 2 seconds for classification, or remaining time if less
  const classificationTimeout = Math.min(2000, remainingMs - 500);

  if (classificationTimeout < 1000) {
    throw new Error(
      `Insufficient time for classification: ${remainingMs}ms remaining, need at least 1000ms`
    );
  }

  const model = getGeminiModel(GeminiModelId.FLASH_2_0);
  const prompt = getClassificationPrompt();

  try {
    const result = await generateObject({
      model,
      schema: ClassificationResultSchema,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image', image: imageUrl },
          ],
        },
      ],
      abortSignal: AbortSignal.timeout(classificationTimeout),
    });

    return result.object;
  } catch (error) {
    // Handle timeout or API errors
    if (error instanceof Error) {
      if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
        throw new Error(`Classification timeout after ${classificationTimeout}ms`);
      }
      throw new Error(`Classification failed: ${error.message}`);
    }
    throw error;
  }
}
