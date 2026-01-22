/**
 * @file POST /api/contacts/update
 * @description API route handler
 * @module app/api/contacts/update/route
 * @exports POST, runtime
 * @runtime edge
 */
/**
 * POST /api/contacts/update
 * Update Bird CRM contact with flexible normalization and graceful degradation
 *
 * Features:
 * - FLAT request structure (no nested context/updates)
 * - Auto country extraction from phone number (+57 → CO, +52 → MX, +1 → US)
 * - Flexible input normalization (espacios en email, emojis en nombre)
 * - Graceful degradation (campos inválidos se ignoran, no fallan request)
 * - Dual country fields (country: ISO code, countryName: full name)
 * - Auto display name cleaning (emojis, capitalization)
 * - Dual-field update strategy (displayName + firstName/lastName)
 * - Auto estatus (datosok: displayName + email, pendiente: missing any)
 * - Post-update verification
 * - <9 second timeout (Bird constraint)
 *
 * Minimum required: displayName only (country auto-extracted from phone)
 */

import { NextResponse } from 'next/server';
import { TimeBudget, TimeoutBudgetError } from '@/lib/ai/timeout';
import { validateApiKey } from '@/lib/auth/api-key';
import {
  addEmailIdentifier,
  fetchContactById,
  searchContactByPhone,
  updateContact,
} from '@/lib/bird/contacts';
import type {
  BirdContact,
  ContactUpdateRequest,
  ContactUpdateSuccessResponse,
} from '@/lib/bird/types';
import { ContactUpdateRequestSchema } from '@/lib/bird/types';
import {
  handleRouteError,
  NotFoundError,
  TimeoutError,
  UnauthorizedError,
  ValidationError,
} from '@/lib/errors';
import {
  extractCountryFromPhone,
  normalizeAndValidateContactUpdates,
} from '@/lib/utils/contact-normalization';
import { parseFullName } from '@/lib/utils/name-cleaning';

export const runtime = 'edge';

/**
 * POST handler
 */
export async function POST(request: Request): Promise<Response> {
  const startTime = Date.now();
  const budget = new TimeBudget(8500); // 8.5s total budget

  try {
    // 1. API Key Validation (optional)
    if (!validateApiKey(request)) {
      throw new UnauthorizedError('API key required or invalid');
    }

    // 2. Parse and validate request body
    const body = await parseRequestBody(request);

    budget.checkBudget();

    // 3. Extract country from phone number BEFORE normalization
    const countryFromPhone = extractCountryFromPhone(body.contactPhone);

    // 4. Normalize and validate update fields (graceful degradation)
    const normalization = normalizeAndValidateContactUpdates({
      displayName: body.displayName,
      email: body.email,
      country: countryFromPhone.valid ? countryFromPhone.code : undefined,
    });

    // Require minimum data: displayName only (country extracted from phone)
    if (!normalization.hasRequiredFields) {
      throw new ValidationError('Minimum required field: displayName', {
        hasDisplayName: !!normalization.normalized.displayName,
      });
    }

    budget.checkBudget();

    // 5. Search contact by phone
    console.log(`[Contact Update] Searching contact: ${maskPhone(body.contactPhone)}`);
    const contact = await searchContactByPhone(body.contactPhone);

    if (!contact) {
      throw new NotFoundError(`Contact with phone ${maskPhone(body.contactPhone)} not found`, {
        phone: body.contactPhone,
      });
    }

    budget.checkBudget();

    // 6. Prepare update payload with cleaning and normalized data
    const updatePayload = prepareUpdatePayload(
      contact,
      normalization.normalized,
      normalization.estatus
    );

    // 7. Update contact
    console.log(`[Contact Update] Updating contact ${contact.id}...`);
    await updateContact(contact.id, updatePayload.payload);

    budget.checkBudget();

    // 8. Add email identifier if email was updated (separate API call)
    if (body.email) {
      try {
        await addEmailIdentifier(contact.id, body.email);
      } catch (error) {
        console.warn(`[Contact Update] Failed to add email identifier: ${error}`);
        // Non-critical - continue
      }
    }

    budget.checkBudget();

    // 9. Verify update
    console.log(`[Contact Update] Verifying update...`);
    await sleep(500); // Small delay for Bird to process
    const updatedContact = await fetchContactById(contact.id);

    const verified = verifyUpdate(updatedContact, updatePayload.after);

    // 10. Build response
    const response: ContactUpdateSuccessResponse = {
      success: true,
      message: verified
        ? 'Contact updated and verified successfully'
        : 'Contact updated but verification incomplete',
      data: {
        contactId: contact.id,
        before: updatePayload.before,
        after: updatePayload.after,
        updatedFields: updatePayload.updatedFields,
        verified,
      },
      processingTime: formatProcessingTime(startTime),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof TimeoutBudgetError) {
      throw new TimeoutError(error.message, { budgetMs: 8500 });
    }

    return handleRouteError(error);
  }
}

/**
 * Helper: Parse request body
 */
async function parseRequestBody(request: Request): Promise<ContactUpdateRequest> {
  const rawBody = await request.json();
  return ContactUpdateRequestSchema.parse(rawBody);
}

/**
 * Helper: Prepare update payload with cleaning
 */
function prepareUpdatePayload(
  contact: BirdContact,
  updates: {
    displayName?: string;
    email?: string;
    phone?: string;
    country?: string;
    countryName?: string;
  },
  estatus: 'datosok' | 'pendiente'
) {
  const before: Record<string, any> = {};
  const after: Record<string, any> = {};
  const updatedFields: string[] = [];
  const payload: any = { attributes: {} };

  // Display Name (already cleaned by normalization)
  if (updates.displayName) {
    before.displayName = contact.attributes?.displayName || contact.computedDisplayName;

    const { firstName, lastName } = parseFullName(updates.displayName);

    // Dual-field strategy (same as CSV script)
    payload.firstName = firstName;
    payload.lastName = lastName;
    payload.attributes.displayName = updates.displayName;
    payload.attributes.firstName = firstName;
    payload.attributes.lastName = lastName;

    after.displayName = updates.displayName;
    updatedFields.push('displayName', 'firstName', 'lastName');
  }

  // Email (already cleaned by normalization)
  if (updates.email) {
    before.email = contact.attributes?.email;
    payload.attributes.email = updates.email;
    after.email = updates.email;
    updatedFields.push('email');
  }

  // Phone
  if (updates.phone) {
    before.phone = contact.attributes?.telefono;
    payload.attributes.telefono = updates.phone;
    after.phone = updates.phone;
    updatedFields.push('telefono');
  }

  // Country (dual field: code + name)
  if (updates.country && updates.countryName) {
    before.country = contact.attributes?.country;
    before.countryName = contact.attributes?.countryName;

    payload.attributes.country = updates.country; // ISO code (US, CO, MX)
    payload.attributes.countryName = updates.countryName; // Full name

    after.country = updates.country;
    after.countryName = updates.countryName;
    updatedFields.push('country', 'countryName');
  }

  // Add estatus and updateBy (always set)
  payload.attributes.estatus = estatus;
  payload.attributes.updateBy = 'contacts';
  updatedFields.push('estatus', 'updateBy');

  return { payload, before, after, updatedFields };
}

/**
 * Helper: Verify update succeeded
 */
function verifyUpdate(updatedContact: BirdContact, expectedAfter: Record<string, any>): boolean {
  // Check displayName (either computedDisplayName or attribute)
  if (expectedAfter.displayName) {
    const actualDisplayName =
      updatedContact.computedDisplayName || updatedContact.attributes?.displayName;

    if (actualDisplayName !== expectedAfter.displayName) {
      console.warn(
        `[Verification] Display name mismatch: expected "${expectedAfter.displayName}", got "${actualDisplayName}"`
      );
      return false;
    }
  }

  // Check email
  if (expectedAfter.email) {
    if (updatedContact.attributes?.email !== expectedAfter.email) {
      console.warn(`[Verification] Email mismatch`);
      return false;
    }
  }

  // Check country (ISO code)
  if (expectedAfter.country) {
    if (updatedContact.attributes?.country !== expectedAfter.country) {
      console.warn(`[Verification] Country code mismatch`);
      return false;
    }
  }

  // Check countryName
  if (expectedAfter.countryName) {
    if (updatedContact.attributes?.countryName !== expectedAfter.countryName) {
      console.warn(`[Verification] Country name mismatch`);
      return false;
    }
  }

  return true;
}

/**
 * Helper: Sleep
 */
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Helper: Mask phone number for logs
 */
function maskPhone(phone: string): string {
  if (phone.length <= 4) return phone;
  const lastFour = phone.slice(-4);
  const masked = '*'.repeat(Math.max(0, phone.length - 4));
  return masked + lastFour;
}

/**
 * Helper: Format processing time
 */
function formatProcessingTime(startTime: number): string {
  const elapsed = Date.now() - startTime;
  return `${(elapsed / 1000).toFixed(1)}s`;
}
