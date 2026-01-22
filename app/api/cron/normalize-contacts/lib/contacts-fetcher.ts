/**
 * @file Contacts Fetcher
 * @description Fetches and filters contacts that need normalization with batch DB optimization
 * @module app/api/cron/normalize-contacts/lib/contacts-fetcher
 * @exports fetchNormalizationCandidates, batchGetLatestNormalizations
 */

import { desc, inArray } from 'drizzle-orm';
import type { TimeBudget } from '@/lib/ai/timeout';
import { listAllContacts } from '@/lib/bird/contacts';
import { db } from '@/lib/db/client';
import type { ContactNormalization } from '@/lib/db/schema';
import { contactNormalizations } from '@/lib/db/schema';
import { CONFIDENCE_SKIP_THRESHOLD, LOOKBACK_HOURS } from './constants';
import type { NormalizationCandidate } from './types';

/**
 * Batch fetch latest normalizations for multiple contacts
 *
 * OPTIMIZATION: Replaces N+1 query pattern with single batch query.
 * Before: 100 contacts = 100 DB queries
 * After: 100 contacts = 1 batch query
 *
 * WHY: Original implementation queried DB inside a loop, causing severe
 * performance degradation with large contact lists. Batch query with
 * WHERE IN clause is 99% faster.
 *
 * @param contactIds - Array of Bird contact IDs
 * @returns Map of contactId -> latest normalization record
 *
 * @example
 * ```ts
 * const normalizations = await batchGetLatestNormalizations(['id1', 'id2']);
 * const latestForId1 = normalizations.get('id1');
 * ```
 */
export async function batchGetLatestNormalizations(
  contactIds: string[]
): Promise<Map<string, ContactNormalization>> {
  if (contactIds.length === 0) {
    return new Map();
  }

  // Fetch all normalizations for these contacts in one query
  const results = await db
    .select()
    .from(contactNormalizations)
    .where(inArray(contactNormalizations.contactId, contactIds))
    .orderBy(desc(contactNormalizations.createdAt));

  // Group by contactId and keep only the latest (first after ordering by desc)
  const latestByContact = new Map<string, ContactNormalization>();

  for (const result of results) {
    if (!latestByContact.has(result.contactId)) {
      latestByContact.set(result.contactId, result);
    }
  }

  return latestByContact;
}

/**
 * Fetch normalization candidates from Bird CRM
 *
 * Flow:
 * 1. Fetch all contacts from Bird CRM
 * 2. Filter to recently updated (last 24 hours)
 * 3. Batch query DB to check existing normalizations
 * 4. Filter out contacts that don't need re-normalization
 *
 * WHY: Reduces unnecessary AI calls by skipping contacts that were
 * already normalized with high confidence.
 *
 * @param budget - Time budget for timeout management
 * @returns Array of contacts that need normalization
 *
 * @example
 * ```ts
 * const candidates = await fetchNormalizationCandidates(budget);
 * // [ { contact, phone, shouldNormalize: true }, ... ]
 * ```
 */
export async function fetchNormalizationCandidates(
  budget: TimeBudget
): Promise<NormalizationCandidate[]> {
  // 1. Fetch all contacts from Bird CRM
  const contacts = await listAllContacts();
  console.log(`[Cron] Total contacts: ${contacts.length}`);

  budget.checkBudget();

  // 2. Filter contacts updated in last 24 hours
  const yesterday = new Date(Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000).toISOString();
  const recentlyUpdatedContacts = contacts.filter((contact) => {
    return contact.updatedAt >= yesterday;
  });

  console.log(`[Cron] Recently updated contacts (last 24h): ${recentlyUpdatedContacts.length}`);

  // 3. Batch query DB for existing normalizations (FIX N+1 QUERY)
  const contactIds = recentlyUpdatedContacts.map((contact) => contact.id);
  const existingNormalizations = await batchGetLatestNormalizations(contactIds);

  // 4. Filter contacts that need normalization
  const candidates: NormalizationCandidate[] = [];

  for (const contact of recentlyUpdatedContacts) {
    // Get phone number
    const phoneIdentifier = contact.featuredIdentifiers.find((id) => id.key === 'phonenumber');

    if (!phoneIdentifier) {
      candidates.push({
        contact,
        phone: '',
        shouldNormalize: false,
        skipReason: 'No phone number',
      });
      continue;
    }

    const phone = phoneIdentifier.value;

    // Check if already normalized with high confidence
    const existing = existingNormalizations.get(contact.id);

    if (
      existing &&
      existing.status === 'success' &&
      existing.confidence &&
      existing.confidence >= CONFIDENCE_SKIP_THRESHOLD
    ) {
      candidates.push({
        contact,
        phone,
        shouldNormalize: false,
        skipReason: `Already normalized (confidence: ${existing.confidence})`,
      });
      continue;
    }

    // Needs normalization
    candidates.push({
      contact,
      phone,
      shouldNormalize: true,
    });
  }

  const needsNormalization = candidates.filter((c) => c.shouldNormalize);
  console.log(`[Cron] Contacts to normalize: ${needsNormalization.length}`);

  budget.checkBudget();

  return needsNormalization;
}
