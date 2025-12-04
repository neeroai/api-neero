/**
 * Groq Audio Transcription
 * Direct Groq API integration for Whisper Large v3 Turbo
 * Spanish-optimized voice note transcription
 *
 * Note: Uses Groq REST API directly as @ai-sdk/groq doesn't expose transcription
 */

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
 * Groq API transcription response
 */
interface GroqTranscriptionResponse {
  text: string;
  task?: string;
  language?: string;
  duration?: number;
}

/**
 * Transcribe audio using Groq Whisper Large v3 Turbo
 *
 * @param audioBuffer - Audio file as ArrayBuffer (from downloadMedia)
 * @param options - Transcription options (language, prompt)
 * @returns Transcription text
 * @throws Error if GROQ_API_KEY is not set or transcription fails
 *
 * Edge Runtime compatible:
 * - Uses fetch (Web API)
 * - Uses ArrayBuffer (not Node.js Buffer)
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
    // Create FormData with audio file
    const formData = new FormData();

    // Convert ArrayBuffer to Blob
    const audioBlob = new Blob([audioBuffer], {
      type: 'audio/ogg', // WhatsApp default format
    });

    // Append file to FormData
    formData.append('file', audioBlob, 'audio.ogg');
    formData.append('model', GroqWhisperModel.id);

    // Add language if specified
    if (options.language && options.language !== 'auto') {
      formData.append('language', options.language);
    }

    // Add prompt for context (improves accuracy)
    if (options.prompt) {
      formData.append('prompt', options.prompt);
    }

    // Call Groq transcription API with timeout enforcement
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: formData,
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error: ${response.status} ${errorText}`);
    }

    const result = (await response.json()) as GroqTranscriptionResponse;

    if (!result.text || result.text.trim().length === 0) {
      throw new Error('Transcription returned empty text');
    }

    return result.text.trim();
  } catch (error) {
    if (error instanceof Error) {
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
  const text = await transcribeAudio(audioBuffer, options);

  return {
    text,
    language: options.language ?? 'es',
    duration: undefined, // Duration not available from Groq API
  };
}
