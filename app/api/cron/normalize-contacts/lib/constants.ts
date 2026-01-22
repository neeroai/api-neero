/**
 * @file Contact Normalization Constants
 * @description Configuration constants for the normalization cron system
 * @module app/api/cron/normalize-contacts/lib/constants
 * @exports TIMEOUT_MS, LOOKBACK_HOURS, CONFIDENCE_THRESHOLD, CONFIDENCE_SKIP_THRESHOLD, RATE_LIMIT_DELAY_MS, GPT4O_MINI_COST_PER_1M_TOKENS, COUNTRY_NAMES, CRON_UPDATE_BY, STATUS_OK, STATUS_PENDING
 */

/**
 * Maximum processing time before timeout
 * Vercel cron timeout is 10 minutes, we use 9 to have buffer
 */
export const TIMEOUT_MS = 540_000; // 9 minutes

/**
 * Lookback period for recent contact updates
 * Filters contacts updated within this timeframe
 */
export const LOOKBACK_HOURS = 24;

/**
 * Minimum confidence to auto-update contact
 * Below this threshold, contact is marked for manual review
 */
export const CONFIDENCE_THRESHOLD = 0.75;

/**
 * Confidence threshold to skip re-normalization
 * If existing normalization has confidence >= this, skip
 */
export const CONFIDENCE_SKIP_THRESHOLD = 0.6;

/**
 * Delay between processing contacts (milliseconds)
 * Rate limit: 100 req/min = 1 request every 600ms
 * Prevents hitting Bird API and OpenAI rate limits
 */
export const RATE_LIMIT_DELAY_MS = 600;

/**
 * GPT-4o-mini cost per 1M tokens (USD)
 * Pricing as of January 2026
 * Used for cost tracking and budget estimation
 */
export const GPT4O_MINI_COST_PER_1M_TOKENS = 0.15;

/**
 * Country code to full name mapping
 * Used to store readable country names in Bird CRM
 */
export const COUNTRY_NAMES: Record<string, string> = {
  CO: 'Colombia',
  MX: 'Mexico',
  US: 'United States',
  AR: 'Argentina',
  CL: 'Chile',
  PE: 'Peru',
  EC: 'Ecuador',
  VE: 'Venezuela',
  ES: 'España',
} as const;

/**
 * Tracking attribute: who updated the contact
 * Identifies cron-automated updates vs manual updates
 */
export const CRON_UPDATE_BY = 'cron';

/**
 * Status for successfully normalized contacts
 * Bird CRM attribute value
 */
export const STATUS_OK = 'datosok';

/**
 * Status for contacts needing manual review
 * Bird CRM attribute value
 */
export const STATUS_PENDING = 'pendiente';
