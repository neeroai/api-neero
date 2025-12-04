/**
 * Groq Audio Transcription
 * Vercel AI SDK integration for Groq Whisper Large v3 Turbo
 * Spanish-optimized voice note transcription
 *
 * Uses Vercel AI SDK transcribe() function for Edge Runtime compatibility
 */

import { groq } from '@ai-sdk/groq';
import { experimental_transcribe as transcribe } from 'ai';

/**
 * Groq Whisper model configuration
 */
export const GroqWhisperModel = {
  id: 'whisper-large-v3-turbo',
  name: 'Whisper Large v3 Turbo',
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
 * Transcribe audio using Groq Whisper Large v3 Turbo
 *
 * @param audioBuffer - Audio file as ArrayBuffer (from downloadMedia)
 * @param options - Transcription options (language, prompt, timeout)
 * @returns Transcription text
 * @throws Error if GROQ_API_KEY is not set or transcription fails
 *
 * Edge Runtime compatible:
 * - Uses Vercel AI SDK transcribe() (Web API compatible)
 * - Uses ArrayBuffer converted to Uint8Array
 * - Supports WhatsApp audio formats (ogg, mp3, m4a, wav)
 *
 * Usage:
 * ```typescript
 * const buffer = await downloadMedia(audioUrl);
 * const transcript = await transcribeAudio(buffer, { language: 'es' });
 * ```
 */
export async function transcribeAudio(
  audioBuffer: ArrayBuffer,
  options: TranscriptionOptions = {}
): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY environment variable is not set');
  }

  // Use provided timeout or default to model timeout
  const timeoutMs = options.timeoutMs ?? GroqWhisperModel.timeout;

  try {
    // Convert ArrayBuffer to Uint8Array for AI SDK
    const audioData = new Uint8Array(audioBuffer);

    // Build provider options (only include defined values)
    const groqOptions: Record<string, string> = {};
    if (options.language && options.language !== 'auto') {
      groqOptions.language = options.language;
    }
    if (options.prompt) {
      groqOptions.prompt = options.prompt;
    }

    // Transcribe with Groq Whisper using AI SDK with timeout enforcement
    const result = await transcribe({
      model: groq.transcription(GroqWhisperModel.id),
      audio: audioData,
      abortSignal: AbortSignal.timeout(timeoutMs),
      providerOptions: {
        groq: groqOptions,
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
export async function transcribeAudioDetailed(
  audioBuffer: ArrayBuffer,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY environment variable is not set');
  }

  // Use provided timeout or default to model timeout
  const timeoutMs = options.timeoutMs ?? GroqWhisperModel.timeout;

  try {
    const audioData = new Uint8Array(audioBuffer);

    // Build provider options (only include defined values)
    const groqOptions: Record<string, string> = {};
    if (options.language && options.language !== 'auto') {
      groqOptions.language = options.language;
    }
    if (options.prompt) {
      groqOptions.prompt = options.prompt;
    }

    const result = await transcribe({
      model: groq.transcription(GroqWhisperModel.id),
      audio: audioData,
      abortSignal: AbortSignal.timeout(timeoutMs),
      providerOptions: {
        groq: groqOptions,
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
