/**
 * @file Contact Updater
 * @description Validates and updates Bird CRM contacts with extracted data
 * @module app/api/cron/normalize-contacts/lib/contact-updater
 * @exports validateAndUpdate, buildExtractedDataObject, buildUpdatePayload
 */

import { updateContact } from '@/lib/bird/contacts';
import type { BirdContact, BirdContactUpdate } from '@/lib/bird/types';
import { db } from '@/lib/db/client';
import { contactNormalizations } from '@/lib/db/schema';
import type { GPT4oMiniExtractionResult } from '@/lib/normalization/gpt4o-mini-extractor';
import { isValidPatientName } from '@/lib/normalization/validators';
import {
  CONFIDENCE_THRESHOLD,
  COUNTRY_NAMES,
  CRON_UPDATE_BY,
  STATUS_OK,
  STATUS_PENDING,
} from './constants';
import type { ContactAuditState, ContactNormalizationUpdate, ContactUpdateResult } from './types';

/**
 * Build extracted data object for DB storage
 *
 * UNIFIED: Replaces 4 duplicated object constructions in original code
 * (lines 218-226 and 248-256 in route.ts).
 *
 * WHY: Centralizes data transformation logic to ensure consistency
 * across success and needs_review cases.
 *
 * @param extracted - GPT-4o-mini extraction result
 * @returns Normalized contact update object
 *
 * @example
 * ```ts
 * const data = buildExtractedDataObject(extracted);
 * // { displayName: 'Maria Garcia', firstName: 'Maria', ... }
 * ```
 */
export function buildExtractedDataObject(
  extracted: GPT4oMiniExtractionResult
): ContactNormalizationUpdate {
  return {
    displayName: extracted.displayName,
    firstName: extracted.firstName,
    lastName: extracted.lastName,
    email: extracted.email,
    country: extracted.country,
    method: extracted.method,
    tokensUsed: extracted.tokensUsed,
  };
}

/**
 * Build Bird CRM update payload
 *
 * TYPE SAFETY FIX: Replaces `any` type with `BirdContactUpdate`.
 * Original code used `any` which defeats TypeScript type checking.
 *
 * WHY: Type-safe payload construction prevents runtime errors from
 * mismatched field names or types.
 *
 * @param extracted - GPT-4o-mini extraction result
 * @param status - Update status ('datosok' or 'pendiente')
 * @returns Type-safe Bird contact update payload
 *
 * @example
 * ```ts
 * const payload = buildUpdatePayload(extracted, 'datosok');
 * await updateContact(contactId, payload);
 * ```
 */
export function buildUpdatePayload(
  extracted: GPT4oMiniExtractionResult,
  status: 'datosok' | 'pendiente'
): BirdContactUpdate {
  const attributes: BirdContactUpdate['attributes'] = {
    displayName: extracted.displayName,
    firstName: extracted.firstName,
    lastName: extracted.lastName,
    updateBy: CRON_UPDATE_BY,
    estatus: status,
  };

  // Add optional fields
  if (extracted.email) {
    attributes.email = extracted.email;
  }

  if (extracted.country) {
    const countryName = COUNTRY_NAMES[extracted.country] || extracted.country;
    attributes.country = countryName;
  }

  return {
    firstName: extracted.firstName,
    lastName: extracted.lastName,
    attributes,
  };
}

/**
 * Capture contact audit state
 *
 * WHY: Compliance requirement to track before/after changes for
 * data modification auditing.
 *
 * @param contact - Bird contact
 * @returns Audit state snapshot
 */
export function captureAuditState(contact: BirdContact): ContactAuditState {
  return {
    displayName: contact.computedDisplayName,
    firstName: contact.attributes?.firstName || null,
    lastName: contact.attributes?.lastName || null,
    email: contact.attributes?.email || null,
    country: contact.attributes?.country || null,
    updateBy: contact.attributes?.updateBy || null,
    estatus: contact.attributes?.estatus || null,
  };
}

/**
 * Build after-state for audit trail
 *
 * @param extracted - Extraction result
 * @returns After-state audit object
 */
export function buildAfterState(extracted: GPT4oMiniExtractionResult): ContactAuditState {
  return {
    displayName: extracted.displayName,
    firstName: extracted.firstName,
    lastName: extracted.lastName,
    email: extracted.email || null,
    country: extracted.country || null,
    updateBy: CRON_UPDATE_BY,
    estatus: STATUS_OK,
  };
}

/**
 * Validate and update Bird CRM contact
 *
 * Flow:
 * 1. Validate extracted name
 * 2. If valid and high confidence -> update Bird CRM + log success
 * 3. If invalid or low confidence -> mark pending + log for review
 *
 * WHY: Centralized validation and update logic ensures consistent
 * handling across all contacts and makes error handling testable.
 *
 * @param contact - Bird contact to update
 * @param conversationId - Bird conversation UUID
 * @param extracted - GPT-4o-mini extraction result
 * @returns Update result with action taken
 *
 * @example
 * ```ts
 * const result = await validateAndUpdate(contact, conversationId, extracted);
 * if (result.success) {
 *   console.log('Updated:', result.after.displayName);
 * }
 * ```
 */
export async function validateAndUpdate(
  contact: BirdContact,
  conversationId: string,
  extracted: GPT4oMiniExtractionResult
): Promise<ContactUpdateResult> {
  const extractedData = buildExtractedDataObject(extracted);

  // Validate extracted name
  const validation = isValidPatientName(extracted.displayName, extracted.confidence);

  // Check if should update (confidence >= 0.75 AND passes validation)
  if (extracted.confidence >= CONFIDENCE_THRESHOLD && extracted.displayName && validation.valid) {
    // Capture before state
    const beforeState = captureAuditState(contact);

    // Build update payload (TYPE SAFE - no `any`)
    const updatePayload = buildUpdatePayload(extracted, STATUS_OK);

    // Update Bird CRM
    await updateContact(contact.id, updatePayload);

    // Capture after state
    const afterState = buildAfterState(extracted);

    // Log success to DB
    await db.insert(contactNormalizations).values({
      contactId: contact.id,
      conversationId,
      status: 'success',
      confidence: extracted.confidence,
      before: beforeState,
      after: afterState,
      extractedData,
    });

    return {
      success: true,
      action: 'updated',
      extractedData,
      before: beforeState,
      after: afterState,
    };
  } else {
    // Determine reason for rejection
    let errorMessage = '';
    if (!validation.valid) {
      errorMessage = validation.reason || 'Validation failed';
    } else if (extracted.confidence < CONFIDENCE_THRESHOLD) {
      errorMessage = `Low confidence (${extracted.confidence})`;
    } else if (!extracted.displayName) {
      errorMessage = 'Missing displayName';
    }

    // Log for manual review
    await db.insert(contactNormalizations).values({
      contactId: contact.id,
      conversationId,
      status: 'needs_review',
      confidence: extracted.confidence,
      errorMessage,
      extractedData,
    });

    // Mark in Bird as pending for manual review
    await updateContact(contact.id, {
      attributes: {
        updateBy: CRON_UPDATE_BY,
        estatus: STATUS_PENDING,
      },
    });

    return {
      success: false,
      action: 'needs_review',
      errorMessage,
      extractedData,
    };
  }
}
