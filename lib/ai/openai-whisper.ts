/**
 * OpenAI Whisper Audio Transcription
 * Vercel AI SDK integration for OpenAI Whisper
 * Fallback transcription provider when Groq fails
 *
 * Uses Vercel AI SDK transcribe() function for Edge Runtime compatibility
 */

import { openai } from '@ai-sdk/openai';
import { experimental_transcribe as transcribe } from 'ai';

/**
 * OpenAI Whisper model configuration
 */
export const OpenAIWhisperModel = {
  id: 'whisper-1',
  name: 'OpenAI Whisper',
  language: 'es', // Spanish primary, auto-detects others
  timeout: 3000, // 3 seconds max processing
} as const;

/**
 * Transcription options
 */
export interface TranscriptionOptions {
  language?: 'es' | 'en' | 'auto';
  prompt?: string; // Context hint for better accuracy
  timeoutMs?: number; // Override default timeout (useful for budget-aware processing)
}

/**
 * Transcription result
 */
export interface TranscriptionResult {
  text: string;
  language: string;
  duration?: number;
}

/**
 * Transcribe audio using OpenAI Whisper
 *
 * @param audioBuffer - Audio file as ArrayBuffer (from downloadMedia)
 * @param options - Transcription options (language, prompt)
 * @returns Transcription text
 * @throws Error if OPENAI_API_KEY is not set or transcription fails
 *
 * Edge Runtime compatible:
 * - Uses Vercel AI SDK transcribe() (Web API compatible)
 * - Uses ArrayBuffer converted to Uint8Array
 * - Supports WhatsApp audio formats (ogg, mp3, m4a, wav)
 *
 * Usage:
 * ```typescript
 * const buffer = await downloadMedia(audioUrl);
 * const transcript = await transcribeAudioOpenAI(buffer, { language: 'es' });
 * ```
 */
export async function transcribeAudioOpenAI(
  audioBuffer: ArrayBuffer,
  options: TranscriptionOptions = {}
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  // Use provided timeout or default to model timeout
  const timeoutMs = options.timeoutMs ?? OpenAIWhisperModel.timeout;

  try {
    // Convert ArrayBuffer to Uint8Array for AI SDK
    const audioData = new Uint8Array(audioBuffer);

    // Build provider options (only include defined values)
    const openaiOptions: Record<string, string> = {};
    if (options.language && options.language !== 'auto') {
      openaiOptions.language = options.language;
    }
    if (options.prompt) {
      openaiOptions.prompt = options.prompt;
    }

    // Transcribe with OpenAI Whisper using AI SDK with dynamic timeout
    const result = await transcribe({
      model: openai.transcription(OpenAIWhisperModel.id),
      audio: audioData,
      abortSignal: AbortSignal.timeout(timeoutMs),
      providerOptions: {
        openai: openaiOptions,
      },
    });

    if (!result.text || result.text.trim().length === 0) {
      throw new Error('Transcription returned empty text');
    }

    return result.text.trim();
  } catch (error) {
    if (error instanceof Error) {
      // Handle timeout errors specifically
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        throw new Error('Audio transcription timed out');
      }
      throw new Error(`Audio transcription failed: ${error.message}`);
    }
    throw new Error('Unknown error during audio transcription');
  }
}

/**
 * Transcribe audio with detailed result
 *
 * @param audioBuffer - Audio file as ArrayBuffer
 * @param options - Transcription options
 * @returns Detailed transcription result with metadata
 */
export async function transcribeAudioOpenAIDetailed(
  audioBuffer: ArrayBuffer,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  // Use provided timeout or default to model timeout
  const timeoutMs = options.timeoutMs ?? OpenAIWhisperModel.timeout;

  try {
    const audioData = new Uint8Array(audioBuffer);

    // Build provider options (only include defined values)
    const openaiOptions: Record<string, string> = {};
    if (options.language && options.language !== 'auto') {
      openaiOptions.language = options.language;
    }
    if (options.prompt) {
      openaiOptions.prompt = options.prompt;
    }

    const result = await transcribe({
      model: openai.transcription(OpenAIWhisperModel.id),
      audio: audioData,
      abortSignal: AbortSignal.timeout(timeoutMs),
      providerOptions: {
        openai: openaiOptions,
      },
    });

    return {
      text: result.text?.trim() ?? '',
      language: result.language ?? options.language ?? 'es',
      duration: result.durationInSeconds,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Audio transcription failed: ${error.message}`);
    }
    throw new Error('Unknown error during audio transcription');
  }
}
