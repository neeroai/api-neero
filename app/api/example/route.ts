/**
 * Echo Bot Example - WhatsApp + AI Integration
 * POST /api/example - Complete WhatsApp webhook receiver with AI responses
 *
 * This is a simplified example demonstrating the full flow:
 * WhatsApp Message → AI Processing → WhatsApp Response
 *
 * For production, expand this with:
 * - Conversation state management
 * - Multiple message types (audio, images)
 * - Error retry logic
 * - Rate limiting
 * - User authentication
 */

import { generateText } from 'ai';
import { openai, DEFAULT_MODEL } from '@/lib/ai/openai';
import { getCurrentTimeTool } from '@/lib/ai/tools';
import { whatsappAssistantPrompt } from '@/lib/ai/prompts';
import { normalizeMessage } from '@/lib/whatsapp/normalization';
import { sendTextMessage } from '@/lib/whatsapp/messaging';
import type { WhatsAppWebhookPayload } from '@/lib/types/whatsapp';

export const runtime = 'edge';

/**
 * GET /api/example
 * WhatsApp webhook verification endpoint
 *
 * Facebook requires GET verification when setting up webhooks
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Verify webhook subscription
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('Webhook verified successfully');
    return new Response(challenge, { status: 200 });
  }

  // Verification failed
  return new Response('Forbidden', { status: 403 });
}

/**
 * POST /api/example
 * WhatsApp webhook receiver - Echo bot with AI
 *
 * Flow:
 * 1. Receive WhatsApp message webhook
 * 2. Normalize message to extract text
 * 3. Process with AI (with tool calling)
 * 4. Send response back to WhatsApp
 * 5. Return 200 (always, to prevent retries)
 *
 * Webhook payload structure:
 * {
 *   object: 'whatsapp_business_account',
 *   entry: [{
 *     changes: [{
 *       value: {
 *         messages: [{ from, text: { body }, ... }],
 *         contacts: [{ profile: { name }, ... }]
 *       }
 *     }]
 *   }]
 * }
 */
export async function POST(req: Request) {
  try {
    // Parse WhatsApp webhook payload
    const payload: WhatsAppWebhookPayload = await req.json();

    console.log('Received webhook:', JSON.stringify(payload, null, 2));

    // Extract messages from webhook payload
    const messages = payload.entry?.[0]?.changes?.[0]?.value?.messages;

    // No messages in payload - skip processing
    if (!messages || messages.length === 0) {
      console.log('No messages in webhook payload');
      return new Response('OK', { status: 200 });
    }

    // Process first message (webhooks typically send one message at a time)
    const incomingMessage = messages[0];

    // Normalize message to unified format
    const normalized = normalizeMessage(incomingMessage);

    console.log('Normalized message:', normalized);

    // Only process text messages in this simple example
    // For production: handle audio, images, interactive messages
    if (normalized.type !== 'text') {
      console.log(`Skipping non-text message type: ${normalized.type}`);
      return new Response('OK', { status: 200 });
    }

    // Extract user text content
    const userMessage = normalized.content;
    const userId = normalized.userId;

    console.log(`Processing message from ${userId}: "${userMessage}"`);

    // Call AI with user message and tool support
    // Uses getCurrentTimeTool to demonstrate tool calling
    const { text: aiResponse } = await generateText({
      model: openai(DEFAULT_MODEL),
      system: whatsappAssistantPrompt,
      prompt: userMessage,
      tools: {
        getCurrentTime: getCurrentTimeTool,
      },
      maxToolRoundtrips: 2,
      temperature: 0.7,
    });

    console.log(`AI response: "${aiResponse}"`);

    // Send AI response back to WhatsApp user
    await sendTextMessage(userId, aiResponse);

    console.log(`Response sent to ${userId}`);

    // Always return 200 to prevent WhatsApp from retrying
    return new Response('OK', { status: 200 });
  } catch (error) {
    // Log error but still return 200 to prevent retries
    // For production: implement proper error handling and alerting
    console.error('Echo bot error:', error);

    // Return 200 to prevent WhatsApp from retrying on application errors
    // Only return 500 for infrastructure issues
    return new Response('OK', { status: 200 });
  }
}
