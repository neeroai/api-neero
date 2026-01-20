/**
 * @file API Key Authentication
 * @description Exports 5 functions and types
 * @module lib/auth/api-key
 * @exports AuthenticationError, createUnauthorizedResponse, getMaskedApiKey, requireApiKey, validateApiKey
 */
/**
 * API Key Authentication
 * Optional API key validation for Bird Actions requests
 * Edge Runtime compatible (no Node.js crypto)
 */

/**
 * Authentication error
 */
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Validate API key from request headers
 *
 * @param request - Request object with headers
 * @returns true if valid, false if invalid
 *
 * Checks `X-API-Key` header against `NEERO_API_KEY` environment variable.
 * If `NEERO_API_KEY` is not set, validation is disabled (allows all requests).
 *
 * Usage:
 * ```typescript
 * if (!validateApiKey(request)) {
 *   return Response.json({ error: 'Unauthorized' }, { status: 401 });
 * }
 * ```
 */
export function validateApiKey(request: Request): boolean {
  const expectedKey = process.env.NEERO_API_KEY;

  // If NEERO_API_KEY is not configured, allow all requests
  if (!expectedKey) {
    return true;
  }

  const providedKey = request.headers.get('X-API-Key');

  // No key provided
  if (!providedKey) {
    return false;
  }

  // Compare keys (constant-time comparison would be better, but Edge Runtime limitations)
  return providedKey === expectedKey;
}

/**
 * Validate API key and throw error if invalid
 *
 * @param request - Request object with headers
 * @throws AuthenticationError if API key is invalid
 *
 * Usage:
 * ```typescript
 * try {
 *   requireApiKey(request);
 * } catch (error) {
 *   return Response.json({ error: error.message }, { status: 401 });
 * }
 * ```
 */
export function requireApiKey(request: Request): void {
  if (!validateApiKey(request)) {
    throw new AuthenticationError('Invalid or missing API key');
  }
}

/**
 * Create unauthorized response
 *
 * @returns JSON response with 401 status
 *
 * Usage:
 * ```typescript
 * if (!validateApiKey(request)) {
 *   return createUnauthorizedResponse();
 * }
 * ```
 */
export function createUnauthorizedResponse(): Response {
  return Response.json(
    {
      success: false,
      error: 'Unauthorized',
      code: 'UNAUTHORIZED',
    },
    {
      status: 401,
      headers: {
        'WWW-Authenticate': 'ApiKey realm="Bird Actions API"',
      },
    }
  );
}

/**
 * Get API key from request (for logging, NOT validation)
 *
 * @param request - Request object with headers
 * @returns Masked API key (e.g., "sk_...xyz") or null
 *
 * Usage:
 * ```typescript
 * const maskedKey = getMaskedApiKey(request);
 * console.log(`Request from: ${maskedKey ?? 'no-key'}`);
 * ```
 */
export function getMaskedApiKey(request: Request): string | null {
  const key = request.headers.get('X-API-Key');

  if (!key) {
    return null;
  }

  // Show first 3 and last 3 characters
  if (key.length <= 6) {
    return '***';
  }

  return `${key.slice(0, 3)}...${key.slice(-3)}`;
}
