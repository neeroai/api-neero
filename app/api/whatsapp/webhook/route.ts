/**
 * WhatsApp Webhook Handler - Edge Runtime
 * Handles webhook verification (GET) and incoming messages (POST)
 * Implements fire-and-forget pattern for <5s response requirement
 */

import { verifyWhatsAppSignature } from '@/lib/security/crypto';
import {
  extractMessages,
  isDuplicateMessage,
  extractContact,
  extractPhoneNumberId,
} from '@/lib/whatsapp/webhook';
import type { WhatsAppWebhookPayload } from '@/lib/types/whatsapp';

export const runtime = 'edge';

/**
 * GET handler for webhook verification
 * WhatsApp sends this request during webhook setup
 * @param request - Next.js request object
 * @returns Challenge string if valid, 403 if invalid
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const challenge = url.searchParams.get('hub.challenge');
  const token = url.searchParams.get('hub.verify_token');

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (!verifyToken) {
    console.error('WHATSAPP_VERIFY_TOKEN not configured');
    return new Response('Server configuration error', { status: 500 });
  }

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('Webhook verified successfully');
    return new Response(challenge, { status: 200 });
  }

  console.warn('Webhook verification failed', { mode, token });
  return new Response('Forbidden', { status: 403 });
}

/**
 * POST handler for incoming webhooks
 * Implements fire-and-forget pattern (respond immediately, process async)
 * @param request - Next.js request object
 * @returns Always returns 200 to prevent WhatsApp retries
 */
export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-hub-signature-256') || '';
    const appSecret = process.env.WHATSAPP_APP_SECRET;

    if (!appSecret) {
      console.error('WHATSAPP_APP_SECRET not configured');
      return new Response('OK', { status: 200 });
    }

    // Validate signature
    const isValid = await verifyWhatsAppSignature(body, signature, appSecret);

    if (!isValid) {
      console.warn('Invalid webhook signature');
      return new Response('OK', { status: 200 });
    }

    // Parse webhook payload
    const webhookData: WhatsAppWebhookPayload = JSON.parse(body);

    // Extract messages
    const messages = extractMessages(webhookData);

    if (messages.length === 0) {
      console.log('No messages in webhook payload');
      return new Response('OK', { status: 200 });
    }

    // Extract metadata
    const contact = extractContact(webhookData);
    const phoneNumberId = extractPhoneNumberId(webhookData);

    // Process each message
    for (const message of messages) {
      // Check for duplicates
      if (isDuplicateMessage(message.id)) {
        console.log('Duplicate message detected', { messageId: message.id });
        continue;
      }

      // Log message for demonstration
      console.log('New message received', {
        messageId: message.id,
        from: message.from,
        type: message.type,
        contact: contact?.name,
        phoneNumberId,
      });

      // TODO: Process message asynchronously
      // This is where you would:
      // 1. Queue message for AI processing
      // 2. Store message in database
      // 3. Trigger business logic
      // Example:
      // await processMessage(message, contact, phoneNumberId);

      // For now, just log the message content
      if (message.type === 'text') {
        console.log('Text message:', message.text.body);
      } else if (message.type === 'interactive') {
        console.log('Interactive response:', message.interactive);
      } else if (message.type === 'audio') {
        console.log('Audio message:', message.audio.id);
      } else if (message.type === 'image') {
        console.log('Image message:', message.image.id);
      }
    }

    // Always return 200 to acknowledge receipt
    return new Response('OK', { status: 200 });
  } catch (error) {
    // Log error but still return 200 to prevent WhatsApp retries
    console.error('Webhook processing error:', error);
    return new Response('OK', { status: 200 });
  }
}
