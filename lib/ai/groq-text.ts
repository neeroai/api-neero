/**
 * @file Groq Text Model Gateway
 * @description Exports 4 functions and types
 * @module lib/ai/groq-text
 * @exports GenerateTextOptions, GroqTextModel, GroqTextModels, generateTextWithGroq
 */
/**
 * Groq Text Model Gateway
 * Vercel AI SDK integration for Groq LLM text models
 * Cost-efficient text processing for transcript enhancement and classification
 *
 * Models:
 * - llama-3.1-8b-instant: $0.05/1M input, $0.08/1M output - Fast, cheap, good for simple tasks
 * - llama-3.3-70b-versatile: $0.59/1M input, $0.79/1M output - Slower, more capable
 */

import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';

/**
 * Groq text model IDs
 */
export const GroqTextModels = {
  INSTANT_8B: 'llama-3.1-8b-instant',
  VERSATILE_70B: 'llama-3.3-70b-versatile',
} as const;

/**
 * Groq text model type
 */
export type GroqTextModel = (typeof GroqTextModels)[keyof typeof GroqTextModels];

/**
 * Text generation options
 */
export interface GenerateTextOptions {
  model?: GroqTextModel;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

/**
 * Generate text using Groq LLM
 *
 * @param prompt - System or user prompt
 * @param options - Generation options (model, temperature, etc.)
 * @returns Generated text
 * @throws Error if GROQ_API_KEY is not set or generation fails
 *
 * Usage:
 * ```typescript
 * const result = await generateTextWithGroq(
 *   'Normalize this transcript: hola como estas',
 *   { model: GroqTextModels.INSTANT_8B }
 * );
 * ```
 */
export async function generateTextWithGroq(
  prompt: string,
  options: GenerateTextOptions = {}
): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY environment variable is not set');
  }

  const { model = GroqTextModels.INSTANT_8B, temperature = 0.3, timeoutMs = 3000 } = options;

  try {
    const result = await generateText({
      model: groq(model),
      prompt,
      temperature,
      abortSignal: AbortSignal.timeout(timeoutMs),
    });

    if (!result.text || result.text.trim().length === 0) {
      throw new Error('Generated text is empty');
    }

    return result.text.trim();
  } catch (error) {
    if (error instanceof Error) {
      // Handle timeout errors specifically
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        throw new Error('Text generation timed out');
      }
      throw new Error(`Text generation failed: ${error.message}`);
    }
    throw new Error('Unknown error during text generation');
  }
}
