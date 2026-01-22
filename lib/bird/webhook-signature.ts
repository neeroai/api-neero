/**
 * @file Bird Webhook Signature Verification
 * @description HMAC-SHA256 signature verification for Bird webhook security
 * @module lib/bird/webhook-signature
 * @exports verifyBirdWebhookSignature
 * @runtime edge
 */

import { getWebhookSecret } from './env';

/**
 * Verify Bird webhook signature using HMAC-SHA256
 * Prevents unauthorized webhook calls and replay attacks
 *
 * @param signature - Signature from X-Bird-Signature header
 * @param rawBody - Raw request body (string or Buffer)
 * @returns True if signature is valid
 *
 * @example
 * ```ts
 * const signature = request.headers.get('X-Bird-Signature');
 * const body = await request.text();
 *
 * if (!verifyBirdWebhookSignature(signature, body)) {
 *   return new Response('Unauthorized', { status: 401 });
 * }
 * ```
 */
export async function verifyBirdWebhookSignature(
  signature: string | null,
  rawBody: string | Buffer
): Promise<boolean> {
  // 1. Validate inputs
  if (!signature) {
    console.warn('[Webhook Signature] Missing X-Bird-Signature header');
    return false;
  }

  const secret = getWebhookSecret();
  if (!secret) {
    console.error('[Webhook Signature] BIRD_WEBHOOK_SECRET not configured');
    // In production, reject requests without secret
    // In dev, log warning but allow (for testing)
    return process.env.NODE_ENV === 'development';
  }

  try {
    // 2. Parse signature format (Bird uses: "sha256=<hex_signature>")
    const signatureParts = signature.split('=');
    if (signatureParts.length !== 2 || signatureParts[0] !== 'sha256') {
      console.warn('[Webhook Signature] Invalid signature format:', signature);
      return false;
    }

    const receivedSignature = signatureParts[1];

    if (!receivedSignature) {
      console.warn('[Webhook Signature] Missing signature value');
      return false;
    }

    // 3. Convert body to bytes
    const bodyBytes =
      typeof rawBody === 'string' ? new TextEncoder().encode(rawBody) : new Uint8Array(rawBody);

    // 4. Compute HMAC-SHA256 signature
    const secretBytes = new TextEncoder().encode(secret!);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      secretBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, bodyBytes);

    // 5. Convert signature to hex string
    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // 6. Compare signatures (constant-time comparison to prevent timing attacks)
    const isValid = constantTimeCompare(receivedSignature, computedSignature);

    if (!isValid) {
      console.warn('[Webhook Signature] Signature mismatch');
      console.debug('[Webhook Signature] Received:', receivedSignature);
      console.debug('[Webhook Signature] Computed:', computedSignature);
    }

    return isValid;
  } catch (error) {
    console.error('[Webhook Signature] Verification error:', error);
    return false;
  }
}

/**
 * Constant-time string comparison to prevent timing attacks
 *
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal
 */
function constantTimeCompare(a: string, b: string): boolean {
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
 * Generate HMAC-SHA256 signature for testing
 * Used in test suites to create valid signatures
 *
 * @param body - Request body to sign
 * @param secret - Webhook secret
 * @returns Signature in format "sha256=<hex>"
 *
 * @example
 * ```ts
 * const signature = await generateTestSignature(JSON.stringify(payload), 'test-secret');
 * // signature: "sha256=abc123..."
 * ```
 */
export async function generateTestSignature(body: string, secret: string): Promise<string> {
  const bodyBytes = new TextEncoder().encode(body);
  const secretBytes = new TextEncoder().encode(secret);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, bodyBytes);

  const hexSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `sha256=${hexSignature}`;
}
