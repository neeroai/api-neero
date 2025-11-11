/**
 * OpenAI Client Configuration
 * Edge Runtime compatible
 */

import { createOpenAI } from '@ai-sdk/openai';

/**
 * Validates that required OpenAI environment variables are present
 * @throws Error if OPENAI_API_KEY is not set
 */
function validateOpenAIConfig(): void {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      'Missing required environment variable: OPENAI_API_KEY. ' +
      'Please add it to your .env.local file.'
    );
  }
}

/**
 * Configured OpenAI client instance
 * Uses gpt-4o-mini as default model
 *
 * @example
 * ```ts
 * import { openai } from '@/lib/ai/openai';
 * import { generateText } from 'ai';
 *
 * const { text } = await generateText({
 *   model: openai('gpt-4o-mini'),
 *   prompt: 'What is the capital of France?'
 * });
 * ```
 */
export const openai = (() => {
  validateOpenAIConfig();

  return createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    compatibility: 'strict',
  });
})();

/**
 * Default model for general-purpose tasks
 * gpt-4o-mini: Fast, cost-effective, good for most use cases
 */
export const DEFAULT_MODEL = 'gpt-4o-mini';

/**
 * Model for complex reasoning tasks
 * gpt-4o: More capable, higher cost, slower
 */
export const ADVANCED_MODEL = 'gpt-4o';
