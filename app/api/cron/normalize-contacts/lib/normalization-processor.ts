/**
 * @file Normalization Processor
 * @description Main processing loop for contact normalization batch
 * @module app/api/cron/normalize-contacts/lib/normalization-processor
 * @exports processNormalizationBatch
 */

import type { TimeBudget } from '@/lib/ai/timeout';
import { findConversationByPhone } from '@/lib/bird/conversations';
import { extractContactDataGPT4oMini } from '@/lib/normalization/gpt4o-mini-extractor';
import { GPT4O_MINI_COST_PER_1M_TOKENS, RATE_LIMIT_DELAY_MS } from './constants';
import { validateAndUpdate } from './contact-updater';
import { parseConversationText } from './conversation-parser';
import type { NormalizationCandidate, NormalizationStats } from './types';

/**
 * Process normalization batch for multiple contacts
 *
 * Main processing loop that:
 * 1. Finds conversation for each contact
 * 2. Parses conversation text
 * 3. Extracts contact data with GPT-4o-mini
 * 4. Validates and updates Bird CRM
 * 5. Tracks statistics and costs
 * 6. Respects rate limits
 *
 * WHY: Separating the processing loop from route handler makes it
 * testable and reusable. Rate limiting prevents API throttling.
 *
 * @param candidates - Array of contacts that need normalization
 * @param budget - Time budget for timeout management
 * @returns Processing statistics
 *
 * @example
 * ```ts
 * const stats = await processNormalizationBatch(candidates, budget);
 * console.log(`Successful: ${stats.successful}, Cost: $${stats.totalCost}`);
 * ```
 */
export async function processNormalizationBatch(
  candidates: NormalizationCandidate[],
  budget: TimeBudget
): Promise<NormalizationStats> {
  const startTime = Date.now();

  let successCount = 0;
  let lowConfidenceCount = 0;
  let failureCount = 0;
  let skippedCount = 0;
  let totalCost = 0;

  for (const candidate of candidates) {
    try {
      const { contact, phone } = candidate;

      // Find conversation
      const conversation = await findConversationByPhone(phone);
      if (!conversation) {
        skippedCount++;
        continue;
      }

      // Parse conversation text
      const parseResult = await parseConversationText(conversation.id);

      if (parseResult.isEmpty) {
        skippedCount++;
        continue;
      }

      // Extract contact data with GPT-4o-mini
      const extracted = await extractContactDataGPT4oMini(parseResult.text, {
        contactPhone: phone,
        fallbackToRegex: true,
      });

      // Update cost tracking
      if (extracted.tokensUsed) {
        const cost = (extracted.tokensUsed / 1_000_000) * GPT4O_MINI_COST_PER_1M_TOKENS;
        totalCost += cost;
      }

      // Validate and update contact
      const updateResult = await validateAndUpdate(contact, conversation.id, extracted);

      if (updateResult.success) {
        successCount++;
      } else {
        lowConfidenceCount++;
      }

      // Budget check
      budget.checkBudget();

      // Rate limit: delay to prevent hitting API limits
      // 600ms = 100 req/min (Bird API + OpenAI limits)
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
    } catch (error) {
      console.error(`[Cron] Error normalizing contact ${candidate.contact.id}:`, error);
      failureCount++;
    }
  }

  const processingTimeMs = Date.now() - startTime;

  return {
    totalProcessed: candidates.length,
    successful: successCount,
    lowConfidence: lowConfidenceCount,
    failed: failureCount,
    skipped: skippedCount,
    totalCost,
    processingTimeMs,
  };
}
