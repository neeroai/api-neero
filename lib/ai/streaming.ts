/**
 * Stream Handling Utilities
 * Edge Runtime compatible
 */

import { StreamingTextResponse } from 'ai';

/**
 * Converts an AI stream to an HTTP streaming response
 * Edge Runtime compatible
 *
 * @param stream - ReadableStream from AI SDK
 * @returns Response with streaming text
 *
 * @example
 * ```ts
 * import { streamText } from 'ai';
 * import { openai } from '@/lib/ai/openai';
 * import { streamToResponse } from '@/lib/ai/streaming';
 *
 * export async function POST(request: Request) {
 *   const { messages } = await request.json();
 *
 *   const result = streamText({
 *     model: openai('gpt-4o-mini'),
 *     messages,
 *   });
 *
 *   return streamToResponse(result.toDataStream());
 * }
 * ```
 */
export function streamToResponse(stream: ReadableStream): Response {
  return new StreamingTextResponse(stream);
}

/**
 * Parses a Server-Sent Events (SSE) chunk
 * Used for processing AI SDK streaming responses
 *
 * @param chunk - Raw SSE chunk string
 * @returns Parsed data or null if invalid
 *
 * @example
 * ```ts
 * const chunk = 'data: {"content":"Hello"}\n\n';
 * const parsed = parseStreamChunk(chunk);
 * console.log(parsed); // { content: "Hello" }
 * ```
 */
export function parseStreamChunk(chunk: string): unknown {
  if (!chunk.startsWith('data: ')) {
    return null;
  }

  const data = chunk.slice(6).trim();

  if (data === '[DONE]') {
    return null;
  }

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Collects all chunks from a stream into a single string
 * Useful for testing or non-streaming contexts
 *
 * @param stream - ReadableStream to collect from
 * @returns Complete text from stream
 *
 * @example
 * ```ts
 * import { streamText } from 'ai';
 * import { openai } from '@/lib/ai/openai';
 *
 * const result = streamText({
 *   model: openai('gpt-4o-mini'),
 *   prompt: 'Say hello'
 * });
 *
 * const fullText = await collectStream(result.textStream);
 * console.log(fullText); // "Hello! How can I help you today?"
 * ```
 */
export async function collectStream(stream: ReadableStream<string>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      result += typeof value === 'string' ? value : decoder.decode(value);
    }
  } finally {
    reader.releaseLock();
  }

  return result;
}

/**
 * Creates a TransformStream that logs all chunks passing through
 * Useful for debugging streaming responses
 *
 * @param label - Label for console logs
 * @returns TransformStream that can be piped
 *
 * @example
 * ```ts
 * const result = streamText({
 *   model: openai('gpt-4o-mini'),
 *   messages
 * });
 *
 * return new StreamingTextResponse(
 *   result.textStream.pipeThrough(debugStream('AI Response'))
 * );
 * ```
 */
export function debugStream(label: string): TransformStream<string, string> {
  return new TransformStream({
    transform(chunk, controller) {
      console.log(`[${label}]`, chunk);
      controller.enqueue(chunk);
    },
  });
}
