/**
 * @file Env
 * @description Exports 4 functions and types
 * @module lib/bird/env
 * @exports BIRD_API_BASE, getBirdConfig, getOptionalChannelId, getWebhookSecret
 */
const BIRD_API_BASE = 'https://api.bird.com';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var ${name}`);
  }
  return value;
}

/**
 * Get Bird API configuration from environment variables
 *
 * @returns Object with accessKey, workspaceId, apiBase
 * @throws {Error} If BIRD_ACCESS_KEY or BIRD_WORKSPACE_ID missing
 *
 * @example
 * ```ts
 * const config = getBirdConfig();
 * // config: { accessKey: "key_xxx", workspaceId: "ws_xxx", apiBase: "https://api.bird.com" }
 * ```
 */
export function getBirdConfig() {
  const accessKey = requiredEnv('BIRD_ACCESS_KEY');
  const workspaceId = requiredEnv('BIRD_WORKSPACE_ID');

  return { accessKey, workspaceId, apiBase: BIRD_API_BASE };
}

/**
 * Get optional Bird channel ID from environment
 *
 * @returns Channel ID or null if not set
 *
 * @example
 * ```ts
 * const channelId = getOptionalChannelId();
 * // channelId: "ch_xxx" or null
 * ```
 */
export function getOptionalChannelId(): string | null {
  return process.env.BIRD_CHANNEL_ID ?? null;
}

/**
 * Get optional webhook verification secret from environment
 *
 * @returns Webhook secret or null if not set
 *
 * @example
 * ```ts
 * const secret = getWebhookSecret();
 * // secret: "whsec_xxx" or null
 * ```
 */
export function getWebhookSecret(): string | null {
  return process.env.BIRD_WEBHOOK_SECRET ?? null;
}

export { BIRD_API_BASE };
