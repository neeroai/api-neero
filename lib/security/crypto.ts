/**
 * HMAC Validation for Edge Runtime
 * Uses Web Crypto API (NO Node.js crypto)
 */

/**
 * Verifies HMAC-SHA256 signature using Web Crypto API
 * Edge Runtime compatible
 *
 * @param payload - Raw payload string to verify
 * @param signature - Expected signature (hex string)
 * @param secret - Secret key for HMAC
 * @returns True if signature is valid
 *
 * @example
 * ```ts
 * // Verify WhatsApp webhook signature
 * const isValid = await verifyHMAC(
 *   JSON.stringify(webhookBody),
 *   request.headers.get('x-hub-signature-256')?.replace('sha256=', '') || '',
 *   process.env.WHATSAPP_APP_SECRET!
 * );
 *
 * if (!isValid) {
 *   return new Response('Invalid signature', { status: 401 });
 * }
 * ```
 */
export async function verifyHMAC(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const expectedSignature = await generateHMAC(payload, secret);
    return timingSafeEqual(signature, expectedSignature);
  } catch (error) {
    console.error('HMAC verification failed:', error);
    return false;
  }
}

/**
 * Generates HMAC-SHA256 signature using Web Crypto API
 * Edge Runtime compatible
 *
 * @param payload - Data to sign
 * @param secret - Secret key for HMAC
 * @returns Hex-encoded signature
 *
 * @example
 * ```ts
 * const signature = await generateHMAC(
 *   JSON.stringify(data),
 *   process.env.WEBHOOK_SECRET!
 * );
 *
 * // Send with request
 * await fetch(url, {
 *   headers: {
 *     'X-Signature': `sha256=${signature}`
 *   }
 * });
 * ```
 */
export async function generateHMAC(
  payload: string,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );

  return bufferToHex(signature);
}

/**
 * Timing-safe string comparison
 * Prevents timing attacks by comparing all characters
 *
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal
 */
function timingSafeEqual(a: string, b: string): boolean {
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
 * Converts ArrayBuffer to hex string
 *
 * @param buffer - Buffer to convert
 * @returns Hex string
 */
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verifies WhatsApp webhook signature
 * Convenience wrapper for WhatsApp-specific HMAC verification
 *
 * @param body - Webhook request body (string or object)
 * @param signature - Value from X-Hub-Signature-256 header
 * @param secret - WhatsApp app secret
 * @returns True if signature is valid
 *
 * @example
 * ```ts
 * export async function POST(request: Request) {
 *   const body = await request.text();
 *   const signature = request.headers.get('x-hub-signature-256') || '';
 *
 *   const isValid = await verifyWhatsAppSignature(
 *     body,
 *     signature,
 *     process.env.WHATSAPP_APP_SECRET!
 *   );
 *
 *   if (!isValid) {
 *     return new Response('Unauthorized', { status: 401 });
 *   }
 *
 *   // Process webhook...
 * }
 * ```
 */
export async function verifyWhatsAppSignature(
  body: string | object,
  signature: string,
  secret: string
): Promise<boolean> {
  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  const cleanSignature = signature.replace('sha256=', '');

  return verifyHMAC(payload, cleanSignature, secret);
}
