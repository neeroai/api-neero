/**
 * Gemini AI Gateway
 * Vercel AI SDK 5.0 integration for Google Gemini models
 */

import { google } from '@ai-sdk/google';
import type { LanguageModel } from 'ai';

/**
 * Supported Gemini model IDs
 */
export const GeminiModelId = {
  FLASH_2_0: 'gemini-2.0-flash-exp',
  FLASH_2_5: 'gemini-2.5-flash',
} as const;

export type GeminiModelIdType = (typeof GeminiModelId)[keyof typeof GeminiModelId];

/**
 * Model configuration for different use cases
 */
export const GeminiModelConfig = {
  [GeminiModelId.FLASH_2_0]: {
    id: GeminiModelId.FLASH_2_0,
    name: 'Gemini 2.0 Flash',
    maxTokens: 8192,
    timeout: 4000, // 4 seconds
    useCase: 'Fast photo processing, general vision',
  },
  [GeminiModelId.FLASH_2_5]: {
    id: GeminiModelId.FLASH_2_5,
    name: 'Gemini 2.5 Flash',
    maxTokens: 8192,
    timeout: 5500, // 5.5 seconds
    useCase: 'Complex documents, cedulas, contracts',
  },
} as const;

/**
 * Get configured Gemini model from Vercel AI SDK
 *
 * @param modelId - Gemini model identifier
 * @returns LanguageModel instance configured with API key
 * @throws Error if GOOGLE_GENERATIVE_AI_API_KEY is not set
 *
 * Usage:
 * ```typescript
 * const model = getGeminiModel(GeminiModelId.FLASH_2_0);
 * const result = await generateText({ model, prompt: '...' });
 * ```
 */
export function getGeminiModel(modelId: GeminiModelIdType): LanguageModel {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set');
  }

  return google(modelId);
}

/**
 * Get default Gemini model (2.0 Flash for fast processing)
 *
 * @returns LanguageModel instance for Gemini 2.0 Flash
 */
export function getDefaultGeminiModel(): LanguageModel {
  return getGeminiModel(GeminiModelId.FLASH_2_0);
}

/**
 * Get model configuration by ID
 *
 * @param modelId - Gemini model identifier
 * @returns Model configuration object
 */
export function getModelConfig(modelId: GeminiModelIdType) {
  return GeminiModelConfig[modelId];
}
