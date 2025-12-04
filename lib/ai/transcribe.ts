/**
 * Audio Transcription with Fallback
 * Primary: Groq Whisper v3 Turbo ($0.67/1K min)
 * Fallback: OpenAI Whisper ($6.00/1K min)
 *
 * Automatically falls back to OpenAI if Groq fails or times out.
 * Supports budget-aware timeout management.
 * Optional post-processing with Groq LLM (feature-flagged).
 */

import type { TranscriptionOptions } from './groq';
import { transcribeAudio as transcribeGroq } from './groq';
import { transcribeAudioOpenAI } from './openai-whisper';
import { type AudioIntent, isPostProcessingEnabled, postProcessTranscript } from './post-process';
import {
  formatElapsed,
  getAudioTimeout,
  shouldAttemptAudioFallback,
  type TimeTracker,
} from './timeout';

/**
 * Transcription result with provider metadata
 */
export interface TranscribeResult {
  text: string;
  originalText?: string;
  intent?: AudioIntent;
  provider: 'groq' | 'openai';
  fallbackUsed: boolean;
  postProcessed?: boolean;
  metrics?: TranscriptionMetrics;
}

/**
 * Transcription performance metrics
 */
export interface TranscriptionMetrics {
  totalMs: number;
  transcriptionMs: number;
  postProcessMs?: number;
  provider: 'groq' | 'openai';
  fallbackUsed: boolean;
  estimatedCost: number;
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
  const groqTimeout = timeTracker ? getAudioTimeout(timeTracker, 'groq') : undefined;

  try {
    // Try Groq first (primary provider)
    const rawText = await transcribeGroq(audioBuffer, {
      ...options,
      timeoutMs: groqTimeout,
    });

    // Optional post-processing (feature-flagged)
    if (isPostProcessingEnabled() && timeTracker) {
      const postProcessed = await postProcessTranscript(rawText, {
        language: options.language || 'es',
        timeTracker,
      });

      return {
        text: postProcessed.text,
        originalText: postProcessed.originalText,
        intent: postProcessed.intent,
        provider: 'groq',
        fallbackUsed: false,
        postProcessed: postProcessed.enhanced,
      };
    }

    return {
      text: rawText,
      provider: 'groq',
      fallbackUsed: false,
      postProcessed: false,
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
      const openaiTimeout = timeTracker ? getAudioTimeout(timeTracker, 'openai') : undefined;

      // Fallback to OpenAI
      const rawText = await transcribeAudioOpenAI(audioBuffer, {
        ...options,
        timeoutMs: openaiTimeout,
      });

      // Optional post-processing (feature-flagged)
      if (isPostProcessingEnabled() && timeTracker) {
        const postProcessed = await postProcessTranscript(rawText, {
          language: options.language || 'es',
          timeTracker,
        });

        return {
          text: postProcessed.text,
          originalText: postProcessed.originalText,
          intent: postProcessed.intent,
          provider: 'openai',
          fallbackUsed: true,
          postProcessed: postProcessed.enhanced,
        };
      }

      return {
        text: rawText,
        provider: 'openai',
        fallbackUsed: true,
        postProcessed: false,
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
