/**
 * @file Gemini AI Gateway
 * @description Exports 6 functions and types
 * @module lib/ai/gateway
 * @exports GeminiModelConfig, GeminiModelId, GeminiModelIdType, getDefaultGeminiModel, getGeminiModel, getModelConfig
 */
/**
 * Gemini AI Gateway
 * Vercel AI SDK 5.0 integration for Google Gemini models via Vercel AI Gateway
 */

import { createGateway } from '@ai-sdk/gateway';
import type { LanguageModel } from 'ai';

/**
 * Supported Gemini model IDs
 */
export const GeminiModelId = {
  FLASH_2_0: 'google/gemini-2.0-flash', // Vercel AI Gateway format
  FLASH_2_5: 'google/gemini-2.5-flash', // Vercel AI Gateway format
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
 * Vercel AI Gateway Configuration
 * @see https://ai-sdk.dev/providers/ai-sdk-providers/ai-gateway
 *
 * Uses lazy initialization pattern to ensure API key is validated before gateway creation
 */
let gatewayInstance: ReturnType<typeof createGateway> | null = null;

/**
 * Get configured Gemini model from Vercel AI Gateway
 *
 * @param modelId - Gemini model identifier (must include provider prefix)
 * @returns LanguageModel instance configured with API key
 * @throws Error if AI_GATEWAY_API_KEY is not set
 */
export function getGeminiModel(modelId: GeminiModelIdType): LanguageModel {
  // Lazy initialization: create gateway on first call
  if (!gatewayInstance) {
    const apiKey = process.env.AI_GATEWAY_API_KEY;

    if (!apiKey) {
      throw new Error('AI_GATEWAY_API_KEY environment variable is not set');
    }

    gatewayInstance = createGateway({ apiKey });
  }

  return gatewayInstance(modelId);
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
