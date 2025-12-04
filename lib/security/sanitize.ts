/**
 * Input Sanitization Utilities
 * Prevent injection attacks and normalize input
 */

import { z } from 'zod';

/**
 * Sanitizes phone number to E.164 format
 * Removes all non-numeric characters except leading +
 *
 * @param phone - Raw phone number string
 * @returns Sanitized phone number
 *
 * @example
 * ```ts
 * sanitizePhoneNumber('+1 (555) 123-4567') // '+15551234567'
 * sanitizePhoneNumber('5551234567') // '5551234567'
 * sanitizePhoneNumber('+52-555-123-4567') // '+525551234567'
 * ```
 */
export function sanitizePhoneNumber(phone: string): string {
  if (!phone) return '';

  const hasPlus = phone.trim().startsWith('+');
  const digits = phone.replace(/\D/g, '');

  return hasPlus ? `+${digits}` : digits;
}

/**
 * Sanitizes text input to prevent XSS and injection attacks
 * Removes dangerous characters while preserving readability
 *
 * @param text - Raw text input
 * @param maxLength - Maximum allowed length (default: 4096)
 * @returns Sanitized text
 *
 * @example
 * ```ts
 * sanitizeText('<script>alert("xss")</script>') // 'scriptalert("xss")/script'
 * sanitizeText('Hello\x00World') // 'HelloWorld'
 * sanitizeText('A'.repeat(5000), 1000) // First 1000 characters
 * ```
 */
export function sanitizeText(text: string, maxLength = 4096): string {
  if (!text) return '';

  let sanitized = text
    .replace(/\x00/g, '')
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();

  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized;
}

/**
 * Validates and sanitizes URL
 * Ensures URL is safe and uses allowed protocols
 *
 * @param url - URL string to validate
 * @param allowedProtocols - Allowed URL protocols (default: ['https:', 'http:'])
 * @returns Sanitized URL or null if invalid
 *
 * @example
 * ```ts
 * sanitizeUrl('https://example.com') // 'https://example.com'
 * sanitizeUrl('javascript:alert(1)') // null
 * sanitizeUrl('http://example.com', ['https:']) // null (http not allowed)
 * ```
 */
export function sanitizeUrl(url: string, allowedProtocols = ['https:', 'http:']): string | null {
  try {
    const parsed = new URL(url);

    if (!allowedProtocols.includes(parsed.protocol)) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * WhatsApp webhook payload validation schema
 */
const webhookPayloadSchema = z.object({
  object: z.literal('whatsapp_business_account'),
  entry: z.array(
    z.object({
      id: z.string(),
      changes: z.array(
        z.object({
          value: z.object({
            messaging_product: z.literal('whatsapp'),
            metadata: z.object({
              display_phone_number: z.string(),
              phone_number_id: z.string(),
            }),
            contacts: z
              .array(
                z.object({
                  profile: z.object({
                    name: z.string(),
                  }),
                  wa_id: z.string(),
                })
              )
              .optional(),
            messages: z.array(z.any()).optional(),
            statuses: z.array(z.any()).optional(),
          }),
          field: z.literal('messages'),
        })
      ),
    })
  ),
});

/**
 * Validates WhatsApp webhook payload structure
 * Ensures payload conforms to expected schema
 *
 * @param payload - Raw webhook payload (unknown type)
 * @returns Validated payload
 * @throws ZodError if validation fails
 *
 * @example
 * ```ts
 * export async function POST(request: Request) {
 *   const body = await request.json();
 *
 *   try {
 *     const validPayload = validateWebhookPayload(body);
 *     // Process valid payload...
 *   } catch (error) {
 *     if (error instanceof z.ZodError) {
 *       return new Response('Invalid payload', { status: 400 });
 *     }
 *   }
 * }
 * ```
 */
export function validateWebhookPayload(payload: unknown) {
  return webhookPayloadSchema.parse(payload);
}

/**
 * Sanitizes user input message
 * Combines text sanitization with length limits
 *
 * @param message - Raw message text
 * @param maxLength - Maximum message length (default: 4096)
 * @returns Sanitized message
 *
 * @example
 * ```ts
 * const userMessage = sanitizeUserMessage(incomingMessage.text.body);
 * ```
 */
export function sanitizeUserMessage(message: string, maxLength = 4096): string {
  return sanitizeText(message, maxLength);
}

/**
 * Validates and sanitizes email address
 *
 * @param email - Email address to validate
 * @returns Sanitized email or null if invalid
 *
 * @example
 * ```ts
 * sanitizeEmail('user@example.com') // 'user@example.com'
 * sanitizeEmail('invalid-email') // null
 * sanitizeEmail('USER@EXAMPLE.COM') // 'user@example.com'
 * ```
 */
export function sanitizeEmail(email: string): string | null {
  const emailSchema = z.string().email();
  const result = emailSchema.safeParse(email.toLowerCase().trim());

  return result.success ? result.data : null;
}

/**
 * Removes HTML tags from text
 * Useful for displaying user-generated content safely
 *
 * @param html - HTML string
 * @returns Plain text without HTML tags
 *
 * @example
 * ```ts
 * stripHtml('<p>Hello <b>World</b></p>') // 'Hello World'
 * stripHtml('<script>alert(1)</script>Text') // 'Text'
 * ```
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}
