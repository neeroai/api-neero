/**
 * @file Statistics Collector
 * @description Builds summary responses for cron execution
 * @module app/api/cron/normalize-contacts/lib/stats-collector
 * @exports buildSummaryResponse
 */

import type { NormalizationStats, SummaryResponse } from './types';

/**
 * Build summary response for cron endpoint
 *
 * Formats normalization statistics into the response structure expected
 * by Vercel Cron for logging and monitoring.
 *
 * WHY: Centralized formatting ensures consistent response structure and
 * makes it easy to add new metrics in the future.
 *
 * @param stats - Processing statistics from normalization batch
 * @param totalContacts - Total number of contacts in CRM
 * @param recentlyUpdatedCount - Number of recently updated contacts
 * @returns Formatted summary response
 *
 * @example
 * ```ts
 * const response = buildSummaryResponse(stats, 1000, 50);
 * // {
 * //   success: true,
 * //   message: 'Daily contact normalization completed',
 * //   stats: { ... }
 * // }
 * ```
 */
export function buildSummaryResponse(
  stats: NormalizationStats,
  totalContacts: number,
  recentlyUpdatedCount: number
): SummaryResponse {
  return {
    success: true,
    message: 'Daily contact normalization completed',
    stats: {
      totalContacts,
      recentlyUpdated: recentlyUpdatedCount,
      normalized: stats.totalProcessed,
      successful: stats.successful,
      lowConfidence: stats.lowConfidence,
      failed: stats.failed,
      skipped: stats.skipped,
      totalCost: `$${stats.totalCost.toFixed(4)}`,
      processingTime: `${(stats.processingTimeMs / 1000).toFixed(1)}s`,
    },
  };
}
