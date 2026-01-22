/**
 * @file Cron Authorization
 * @description Verifies Vercel cron authorization header
 * @module app/api/cron/normalize-contacts/lib/auth
 * @exports verifyCronAuthorization
 */

import { UnauthorizedError } from '@/lib/errors';

/**
 * Verify Vercel cron authorization header
 *
 * Validates that the request comes from Vercel's cron system by checking
 * the Authorization header against the NEERO_API_KEY environment variable.
 *
 * WHY: Security-critical - prevents unauthorized access to the cron endpoint
 * which could trigger expensive AI processing and Bird API calls.
 *
 * @param request - HTTP request with Authorization header
 * @throws UnauthorizedError if invalid or missing authorization
 *
 * @example
 * ```ts
 * await verifyCronAuthorization(request);
 * // Proceeds if valid, throws UnauthorizedError if invalid
 * ```
 */
export async function verifyCronAuthorization(request: Request): Promise<void> {
  const authHeader = request.headers.get('Authorization');
  const expectedAuth = `Bearer ${process.env.NEERO_API_KEY}`;

  if (authHeader !== expectedAuth) {
    throw new UnauthorizedError('Invalid cron authorization');
  }
}
