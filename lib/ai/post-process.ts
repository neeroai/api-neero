/**
 * Transcript Post-Processing
 * Enhances audio transcriptions using Groq LLM
 * - Normalizes punctuation and formatting
 * - Classifies audio intent
 * - Improves Spanish language quality
 *
 * Feature-flagged: Disabled by default (enable with AUDIO_POSTPROCESS_ENABLED=true)
 */

import { generateTextWithGroq, GroqTextModels } from './groq-text';
import type { TimeTracker } from './timeout';
import { getAudioTimeout, shouldAttemptPostProcessing } from './timeout';

/**
 * Audio intent classification
 */
export type AudioIntent = 'question' | 'statement' | 'command' | 'unknown';

/**
 * Post-processed transcript result
 */
export interface PostProcessedTranscript {
  text: string;
  originalText: string;
  intent: AudioIntent;
  enhanced: boolean;
}

/**
 * Post-processing options
 */
export interface PostProcessOptions {
  language?: string;
  timeTracker?: TimeTracker;
}

/**
 * Check if post-processing is enabled via environment variable
 */
export function isPostProcessingEnabled(): boolean {
  return process.env.AUDIO_POSTPROCESS_ENABLED === 'true';
}

/**
 * Normalize and enhance transcript using Groq LLM
 *
 * @param text - Raw transcript text
 * @param options - Post-processing options
 * @returns Enhanced transcript with metadata
 *
 * Usage:
 * ```typescript
 * const result = await postProcessTranscript('hola como estas', { language: 'es' });
 * console.log(result.text);    // "Hola, ¿cómo estás?"
 * console.log(result.intent);  // "question"
 * ```
 */
export async function postProcessTranscript(
  text: string,
  options: PostProcessOptions = {}
): Promise<PostProcessedTranscript> {
  const { language = 'es', timeTracker } = options;

  // Check if post-processing is enabled
  if (!isPostProcessingEnabled()) {
    return {
      text,
      originalText: text,
      intent: 'unknown',
      enhanced: false,
    };
  }

  // Check if sufficient budget for post-processing
  if (timeTracker && !shouldAttemptPostProcessing(timeTracker)) {
    console.warn('Skipping post-processing: insufficient time budget');
    return {
      text,
      originalText: text,
      intent: 'unknown',
      enhanced: false,
    };
  }

  try {
    // Calculate timeout if budget tracking enabled
    const timeoutMs = timeTracker
      ? getAudioTimeout(timeTracker, 'postprocess')
      : 1500;

    const prompt = buildPostProcessPrompt(text, language);

    const enhanced = await generateTextWithGroq(prompt, {
      model: GroqTextModels.INSTANT_8B,
      temperature: 0.3,
      maxTokens: 300,
      timeoutMs,
    });

    // Parse response (format: "INTENT|enhanced text")
    const [intentStr, enhancedText] = parsePostProcessResponse(enhanced);

    return {
      text: enhancedText,
      originalText: text,
      intent: intentStr,
      enhanced: true,
    };
  } catch (error) {
    // If post-processing fails, return original text
    console.warn(
      'Post-processing failed, returning original:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return {
      text,
      originalText: text,
      intent: 'unknown',
      enhanced: false,
    };
  }
}

/**
 * Build prompt for transcript post-processing
 */
function buildPostProcessPrompt(text: string, language: string): string {
  const languageName = language === 'es' ? 'Spanish' : 'English';

  return `You are a transcript enhancer. Your task is to:
1. Add proper punctuation and capitalization
2. Fix common transcription errors
3. Classify the speaker's intent

Transcript language: ${languageName}
Original transcript: "${text}"

Respond ONLY in this format:
INTENT|enhanced text

Where INTENT is one of: question, statement, command, unknown
And "enhanced text" is the improved version with proper punctuation.

Example input: "hola como estas"
Example output: question|Hola, ¿cómo estás?

Now process the transcript above:`;
}

/**
 * Parse post-processing response
 */
function parsePostProcessResponse(response: string): [AudioIntent, string] {
  const parts = response.split('|');

  if (parts.length !== 2) {
    console.warn('Invalid post-process response format:', response);
    return ['unknown', response];
  }

  const [intentStr, enhancedText] = parts;
  const intent = parseIntent(intentStr.trim().toLowerCase());

  return [intent, enhancedText.trim()];
}

/**
 * Parse intent string to AudioIntent type
 */
function parseIntent(intentStr: string): AudioIntent {
  switch (intentStr) {
    case 'question':
      return 'question';
    case 'statement':
      return 'statement';
    case 'command':
      return 'command';
    default:
      return 'unknown';
  }
}
