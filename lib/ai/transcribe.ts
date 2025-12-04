/**
 * Audio Transcription with Fallback
 * Primary: Groq Whisper v3 Turbo ($0.67/1K min)
 * Fallback: OpenAI Whisper ($6.00/1K min)
 *
 * Automatically falls back to OpenAI if Groq fails or times out.
 */

import { transcribeAudio as transcribeGroq } from './groq';
import { transcribeAudioOpenAI } from './openai-whisper';
import type { TranscriptionOptions } from './groq';

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
 * @returns Transcription result with provider metadata
 *
 * Flow:
 * 1. Try Groq Whisper v3 Turbo (primary, low cost)
 * 2. If Groq fails → Fall back to OpenAI Whisper (higher cost, high reliability)
 * 3. Return result with provider info
 *
 * Usage:
 * ```typescript
 * const buffer = await downloadMedia(audioUrl);
 * const result = await transcribeWithFallback(buffer, { language: 'es' });
 *
 * console.log(result.text);
 * console.log(result.provider);        // 'groq' | 'openai'
 * console.log(result.fallbackUsed);    // true if OpenAI was used
 * ```
 */
export async function transcribeWithFallback(
  audioBuffer: ArrayBuffer,
  options: TranscriptionOptions = {}
): Promise<TranscribeResult> {
  try {
    // Try Groq first (primary provider)
    const text = await transcribeGroq(audioBuffer, options);

    return {
      text,
      provider: 'groq',
      fallbackUsed: false,
    };
  } catch (groqError) {
    // Log Groq failure and attempt OpenAI fallback
    console.warn(
      'Groq transcription failed, falling back to OpenAI:',
      groqError instanceof Error ? groqError.message : 'Unknown error'
    );

    try {
      // Fallback to OpenAI
      const text = await transcribeAudioOpenAI(audioBuffer, options);

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
