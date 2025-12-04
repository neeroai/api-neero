/**
 * Audio Transcription with Fallback
 * Primary: Groq Whisper v3 Turbo ($0.67/1K min)
 * Fallback: OpenAI Whisper ($6.00/1K min)
 *
 * Automatically falls back to OpenAI if Groq fails or times out.
 * Supports budget-aware timeout management.
 */

import { transcribeAudio as transcribeGroq } from './groq';
import { transcribeAudioOpenAI } from './openai-whisper';
import type { TranscriptionOptions } from './groq';
import {
  type TimeTracker,
  getAudioTimeout,
  shouldAttemptAudioFallback,
  formatElapsed,
} from './timeout';

/**
 * Transcription result with provider metadata
 */
export interface TranscribeResult {
  text: string;
  provider: 'groq' | 'openai';
  fallbackUsed: boolean;
}

/**
 * Transcribe audio with automatic fallback
 *
 * @param audioBuffer - Audio file as ArrayBuffer (from downloadMedia)
 * @param options - Transcription options (language, prompt)
 * @param timeTracker - Optional time budget tracker for dynamic timeout management
 * @returns Transcription result with provider metadata
 *
 * Flow:
 * 1. Try Groq Whisper v3 Turbo (primary, low cost)
 * 2. If Groq fails → Fall back to OpenAI Whisper (higher cost, high reliability)
 * 3. Return result with provider info
 *
 * Budget-Aware Behavior:
 * - If timeTracker provided: Uses dynamic timeout based on remaining budget
 * - If insufficient time: Throws TimeoutBudgetError instead of attempting fallback
 * - If no timeTracker: Uses default timeouts (backward compatible)
 *
 * Usage:
 * ```typescript
 * // Basic usage (no budget tracking)
 * const result = await transcribeWithFallback(buffer, { language: 'es' });
 *
 * // Budget-aware usage
 * const tracker = startTimeTracking(8500);
 * const result = await transcribeWithFallback(buffer, { language: 'es' }, tracker);
 * console.log(result.text);
 * console.log(result.provider);        // 'groq' | 'openai'
 * console.log(result.fallbackUsed);    // true if OpenAI was used
 * ```
 */
export async function transcribeWithFallback(
  audioBuffer: ArrayBuffer,
  options: TranscriptionOptions = {},
  timeTracker?: TimeTracker
): Promise<TranscribeResult> {
  // Calculate dynamic timeout for Groq if budget tracking enabled
  const groqTimeout = timeTracker
    ? getAudioTimeout(timeTracker, 'groq')
    : undefined;

  try {
    // Try Groq first (primary provider)
    const text = await transcribeGroq(audioBuffer, {
      ...options,
      timeoutMs: groqTimeout,
    });

    return {
      text,
      provider: 'groq',
      fallbackUsed: false,
    };
  } catch (groqError) {
    // Check if fallback should be attempted based on remaining budget
    if (timeTracker && !shouldAttemptAudioFallback(timeTracker)) {
      throw new Error(
        `Groq transcription failed and insufficient time for OpenAI fallback (${formatElapsed(timeTracker)} elapsed). ` +
          `Error: ${groqError instanceof Error ? groqError.message : 'Unknown error'}`
      );
    }

    // Log Groq failure and attempt OpenAI fallback
    console.warn(
      'Groq transcription failed, falling back to OpenAI:',
      groqError instanceof Error ? groqError.message : 'Unknown error'
    );

    try {
      // Calculate dynamic timeout for OpenAI if budget tracking enabled
      const openaiTimeout = timeTracker
        ? getAudioTimeout(timeTracker, 'openai')
        : undefined;

      // Fallback to OpenAI
      const text = await transcribeAudioOpenAI(audioBuffer, {
        ...options,
        timeoutMs: openaiTimeout,
      });

      return {
        text,
        provider: 'openai',
        fallbackUsed: true,
      };
    } catch (openaiError) {
      // Both providers failed - throw with context
      throw new Error(
        `Audio transcription failed on both providers. ` +
          `Groq: ${groqError instanceof Error ? groqError.message : 'Unknown error'}. ` +
          `OpenAI: ${openaiError instanceof Error ? openaiError.message : 'Unknown error'}`
      );
    }
  }
}
