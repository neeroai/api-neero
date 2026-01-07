/**
 * Contact Normalization Tracking Module
 *
 * Manages Neon PostgreSQL tracking of normalization results:
 * - Save normalization attempts (success/needs_review/error)
 * - Query contacts needing manual review
 * - Mark reviewed contacts
 */

import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import {
  type ContactNormalization,
  contactNormalizations,
  type NewContactNormalization,
} from '@/lib/db/schema';
import type { NameExtractionResult } from './extractors';

/**
 * Input data for saving normalization result
 */
export interface NormalizationInput {
  contactId: string;
  conversationId?: string;
  status: 'success' | 'needs_review' | 'error';
  confidence?: number;
  extractedData?: NameExtractionResult & {
    email?: string | null;
    country?: string | null;
  };
  before?: {
    displayName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    country?: string;
  };
  after?: {
    displayName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    country?: string;
  };
  errorMessage?: string;
}

/**
 * Save normalization result to Neon database
 *
 * @param input - Normalization data to save
 * @returns Saved contact normalization record
 */
export async function saveNormalizationResult(
  input: NormalizationInput
): Promise<ContactNormalization> {
  const record: NewContactNormalization = {
    contactId: input.contactId,
    conversationId: input.conversationId || null,
    status: input.status,
    confidence: input.confidence || null,
    extractedData: input.extractedData ? (input.extractedData as any) : null,
    before: input.before ? (input.before as any) : null,
    after: input.after ? (input.after as any) : null,
    errorMessage: input.errorMessage || null,
  };

  const [saved] = await db.insert(contactNormalizations).values(record).returning();

  return saved;
}

/**
 * Get all contacts that need manual review
 *
 * @param limit - Maximum number of records to return (default: 100)
 * @returns Array of contacts needing review
 */
export async function getNeedsReview(limit = 100): Promise<ContactNormalization[]> {
  const results = await db
    .select()
    .from(contactNormalizations)
    .where(eq(contactNormalizations.status, 'needs_review'))
    .orderBy(desc(contactNormalizations.createdAt))
    .limit(limit);

  return results;
}

/**
 * Get normalization history for a specific contact
 *
 * @param contactId - Bird contact ID
 * @returns Array of normalization attempts for this contact
 */
export async function getNormalizationHistory(contactId: string): Promise<ContactNormalization[]> {
  const results = await db
    .select()
    .from(contactNormalizations)
    .where(eq(contactNormalizations.contactId, contactId))
    .orderBy(desc(contactNormalizations.createdAt));

  return results;
}

/**
 * Mark a contact as manually reviewed (updates status from needs_review to success)
 * Note: This creates a new record rather than updating the old one (audit trail)
 *
 * @param contactId - Bird contact ID
 * @param reviewedData - Final reviewed data
 * @returns New normalization record with success status
 */
export async function markAsReviewed(
  contactId: string,
  reviewedData: {
    firstName: string;
    lastName: string;
    email?: string;
    country?: string;
  }
): Promise<ContactNormalization> {
  // Create new record showing manual review success
  const record: NewContactNormalization = {
    contactId,
    conversationId: null,
    status: 'success',
    confidence: 1.0, // Manual review = 100% confidence
    extractedData: {
      fullName: `${reviewedData.firstName} ${reviewedData.lastName}`.trim(),
      firstName: reviewedData.firstName,
      lastName: reviewedData.lastName,
      email: reviewedData.email,
      country: reviewedData.country,
      method: 'manual_review',
      confidence: 1.0,
    } as any,
    before: null,
    after: reviewedData as any,
    errorMessage: null,
  };

  const [saved] = await db.insert(contactNormalizations).values(record).returning();

  return saved;
}

/**
 * Get normalization statistics
 *
 * @returns Statistics object with counts by status
 */
export async function getNormalizationStats(): Promise<{
  total: number;
  success: number;
  needsReview: number;
  errors: number;
}> {
  const allResults = await db.select().from(contactNormalizations);

  const stats = {
    total: allResults.length,
    success: allResults.filter((r) => r.status === 'success').length,
    needsReview: allResults.filter((r) => r.status === 'needs_review').length,
    errors: allResults.filter((r) => r.status === 'error').length,
  };

  return stats;
}
