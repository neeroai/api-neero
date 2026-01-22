/**
 * @file Contact Normalization Types
 * @description Type definitions for the contact normalization cron system
 * @module app/api/cron/normalize-contacts/lib/types
 * @exports NormalizationCandidate, ContactAuditState, ContactNormalizationUpdate, NormalizationStats, SummaryResponse, ContactUpdateResult, ConversationParseResult
 */

import type { BirdContact } from '@/lib/bird/types';

/**
 * Candidate for normalization processing
 * Contains contact data and decision about whether to normalize
 */
export interface NormalizationCandidate {
  contact: BirdContact;
  phone: string;
  shouldNormalize: boolean;
  skipReason?: string;
}

/**
 * Contact state for audit trail
 * Captures before/after snapshots for compliance and debugging
 */
export interface ContactAuditState {
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  country: string | null;
  updateBy: string | null;
  estatus: string | null;
}

/**
 * Normalized contact data update
 * Subset of extracted data that gets stored in DB
 */
export interface ContactNormalizationUpdate {
  displayName: string;
  firstName: string;
  lastName: string;
  email?: string;
  country?: string;
  method: 'regex' | 'gpt4o-mini';
  tokensUsed?: number;
}

/**
 * Normalization processing statistics
 * Tracks outcomes and costs for the batch run
 */
export interface NormalizationStats {
  totalProcessed: number;
  successful: number;
  lowConfidence: number;
  failed: number;
  skipped: number;
  totalCost: number; // USD
  processingTimeMs: number;
}

/**
 * Summary response for cron endpoint
 * Returned to Vercel Cron for logging
 */
export interface SummaryResponse {
  success: boolean;
  message: string;
  stats: {
    totalContacts: number;
    recentlyUpdated: number;
    normalized: number;
    successful: number;
    lowConfidence: number;
    failed: number;
    skipped: number;
    totalCost: string;
    processingTime: string;
  };
}

/**
 * Contact update result
 * Outcome of validating and updating a single contact
 */
export interface ContactUpdateResult {
  success: boolean;
  action: 'updated' | 'needs_review' | 'skipped';
  errorMessage?: string;
  extractedData: ContactNormalizationUpdate;
  before?: ContactAuditState;
  after?: ContactAuditState;
}

/**
 * Conversation parse result
 * Extracted text and metadata from Bird conversation
 */
export interface ConversationParseResult {
  text: string;
  messageCount: number;
  contactMessages: number;
  isEmpty: boolean;
}
