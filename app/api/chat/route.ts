/**
 * AI Chat Endpoint - Vercel AI SDK with Streaming
 * POST /api/chat - Stream AI responses with tool calling
 *
 * Edge Runtime compatible for global low-latency responses
 */

import { streamText } from 'ai';
import { openai, DEFAULT_MODEL } from '@/lib/ai/openai';
import { exampleTools } from '@/lib/ai/tools';
import { customerSupportPrompt } from '@/lib/ai/prompts';
import type { CoreMessage } from '@/lib/types/ai';

export const runtime = 'edge';

/**
 * POST /api/chat
 * Stream AI responses with tool calling support
 *
 * Request body:
 * {
 *   messages: CoreMessage[] - Conversation history
 * }
 *
 * Response:
 * - Streaming text response with tool calls
 * - Uses Vercel AI SDK data stream protocol
 *
 * @example
 * ```ts
 * fetch('/api/chat', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     messages: [
 *       { role: 'user', content: 'What time is it?' }
 *     ]
 *   })
 * });
 * ```
 */
export async function POST(req: Request) {
  try {
    // Parse request body
    const body = await req.json();
    const { messages } = body as { messages: CoreMessage[] };

    // Validate messages array
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request body. Expected { messages: CoreMessage[] }',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Stream AI response with tool calling
    const result = streamText({
      model: openai(DEFAULT_MODEL),
      system: customerSupportPrompt,
      messages,
      tools: exampleTools,
      maxToolRoundtrips: 3,
      temperature: 0.7,
    });

    // Return streaming response using AI SDK protocol
    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);

    // Return error response
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
