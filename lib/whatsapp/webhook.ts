/**
 * WhatsApp Webhook Utilities - Edge Runtime Compatible
 * Signature validation, message extraction, and deduplication
 * Uses Web Crypto API for HMAC-SHA256 validation (Edge Runtime compatible)
 */

import type {
  WhatsAppWebhookPayload,
  WhatsAppIncomingMessage,
} from '../types/whatsapp';

/**
 * In-memory deduplication cache (60-second window)
 * WhatsApp retries webhooks up to 5 times if no 200 response received
 */
const processedMessages = new Set<string>();
const MESSAGE_CACHE_TTL = 60000;

/**
 * Validate webhook signature using HMAC-SHA256 (Edge Runtime compatible)
 * WhatsApp signs webhook payloads with app secret for security
 * @param payload - Raw request body as string
 * @param signature - X-Hub-Signature-256 header value (format: sha256=hash)
 * @param secret - WHATSAPP_APP_SECRET from environment
 * @returns True if signature is valid, false otherwise
 * @example
 * const body = await request.text();
 * const signature = request.headers.get('x-hub-signature-256');
 * if (!await validateSignature(body, signature, process.env.WHATSAPP_APP_SECRET)) {
 *   return new Response('Invalid signature', { status: 403 });
 * }
 */
export async function validateSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  if (!signature || !signature.startsWith('sha256=')) {
    return false;
  }

  const providedSignature = signature.replace('sha256=', '');

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payload)
  );

  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return constantTimeEqual(providedSignature, expectedSignature);
}

/**
 * Constant-time string comparison to prevent timing attacks
 * Replaces crypto.timingSafeEqual (not available in Edge Runtime)
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns True if strings are equal, false otherwise
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Extract messages from webhook payload
 * Handles multiple entries and changes per webhook
 * @param webhookBody - Parsed webhook payload
 * @returns Array of incoming messages
 */
export function extractMessages(
  webhookBody: WhatsAppWebhookPayload
): WhatsAppIncomingMessage[] {
  const messages: WhatsAppIncomingMessage[] = [];

  for (const entry of webhookBody.entry) {
    for (const change of entry.changes) {
      if (change.field === 'messages' && change.value.messages) {
        messages.push(...change.value.messages);
      }
    }
  }

  return messages;
}

/**
 * Check if message has been processed (deduplication)
 * WhatsApp retries webhooks if no 200 response received within 5 seconds
 * Messages are cached for 60 seconds to handle retries
 * @param messageId - WhatsApp message ID
 * @returns True if message is duplicate, false if new
 */
export function isDuplicateMessage(messageId: string): boolean {
  if (processedMessages.has(messageId)) {
    return true;
  }

  processedMessages.add(messageId);

  setTimeout(() => {
    processedMessages.delete(messageId);
  }, MESSAGE_CACHE_TTL);

  return false;
}

/**
 * Extract phone number ID from webhook payload
 * Used for sending reply messages
 * @param webhookBody - Parsed webhook payload
 * @returns Phone number ID or null if not found
 */
export function extractPhoneNumberId(
  webhookBody: WhatsAppWebhookPayload
): string | null {
  const firstChange = webhookBody.entry[0]?.changes[0];
  return firstChange?.value?.metadata?.phone_number_id || null;
}

/**
 * Extract contact info from webhook payload
 * Includes WhatsApp ID and profile name
 * @param webhookBody - Parsed webhook payload
 * @returns Contact info or null if not found
 */
export function extractContact(webhookBody: WhatsAppWebhookPayload): {
  wa_id: string;
  name: string;
} | null {
  const firstChange = webhookBody.entry[0]?.changes[0];
  const contact = firstChange?.value?.contacts?.[0];

  if (!contact) {
    return null;
  }

  return {
    wa_id: contact.wa_id,
    name: contact.profile.name,
  };
}
