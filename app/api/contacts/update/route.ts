/**
 * POST /api/contacts/update
 * Update Bird CRM contact with validation and cleaning
 *
 * Features:
 * - Pre-update validation (email, phone, country)
 * - Auto display name cleaning (emojis, capitalization)
 * - Dual-field update strategy (displayName + firstName/lastName)
 * - Post-update verification
 * - <9 second timeout (Bird constraint)
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { TimeBudget, TimeoutBudgetError } from '@/lib/ai/timeout';
import {
  createUnauthorizedResponse,
  validateApiKey,
} from '@/lib/auth/api-key';
import {
  searchContactByPhone,
  updateContact,
  fetchContactById,
  addEmailIdentifier,
} from '@/lib/bird/contacts';
import type {
  ContactUpdateRequest,
  ContactUpdateSuccessResponse,
  ContactUpdateErrorResponse,
  BirdContact,
} from '@/lib/bird/types';
import { ContactUpdateRequestSchema } from '@/lib/bird/types';
import { validateContactUpdates } from '@/lib/utils/contact-validation';
import { cleanDisplayName, parseFullName } from '@/lib/utils/name-cleaning';

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
      return createUnauthorizedResponse();
    }

    // 2. Parse and validate request body
    const bodyOrError = await parseRequestBody(request, startTime);
    if (bodyOrError instanceof Response) {
      return bodyOrError;
    }
    const body = bodyOrError;

    budget.checkBudget();

    // 3. Validate update fields
    const validation = validateContactUpdates(body.updates);
    if (!validation.valid) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Validation failed',
        400,
        startTime,
        validation.errors
      );
    }

    budget.checkBudget();

    // 4. Search contact by phone
    console.log(
      `[Contact Update] Searching contact: ${maskPhone(body.context.contactPhone)}`
    );
    const contact = await searchContactByPhone(body.context.contactPhone);

    if (!contact) {
      return createErrorResponse(
        'CONTACT_NOT_FOUND',
        `Contact with phone ${maskPhone(body.context.contactPhone)} not found`,
        404,
        startTime
      );
    }

    budget.checkBudget();

    // 5. Prepare update payload with cleaning
    const updatePayload = prepareUpdatePayload(contact, body.updates);

    // 6. Update contact
    console.log(`[Contact Update] Updating contact ${contact.id}...`);
    await updateContact(contact.id, updatePayload.payload);

    budget.checkBudget();

    // 7. Add email identifier if email was updated (separate API call)
    if (body.updates.email) {
      try {
        await addEmailIdentifier(contact.id, body.updates.email);
      } catch (error) {
        console.warn(
          `[Contact Update] Failed to add email identifier: ${error}`
        );
        // Non-critical - continue
      }
    }

    budget.checkBudget();

    // 8. Verify update
    console.log(`[Contact Update] Verifying update...`);
    await sleep(500); // Small delay for Bird to process
    const updatedContact = await fetchContactById(contact.id);

    const verified = verifyUpdate(updatedContact, updatePayload.after);

    // 9. Build response
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
      return createErrorResponse('TIMEOUT_ERROR', error.message, 408, startTime);
    }

    return createErrorResponse(
      'UPDATE_ERROR',
      error instanceof Error ? error.message : 'Unexpected error',
      500,
      startTime
    );
  }
}

/**
 * Helper: Parse request body
 */
async function parseRequestBody(
  request: Request,
  startTime: number
): Promise<ContactUpdateRequest | Response> {
  try {
    const rawBody = await request.json();
    return ContactUpdateRequestSchema.parse(rawBody);
  } catch (error) {
    if (error instanceof ZodError) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        `Invalid request body: ${error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        400,
        startTime
      );
    }
    return createErrorResponse(
      'VALIDATION_ERROR',
      'Invalid JSON body',
      400,
      startTime
    );
  }
}

/**
 * Helper: Prepare update payload with cleaning
 */
function prepareUpdatePayload(
  contact: BirdContact,
  updates: ContactUpdateRequest['updates']
) {
  const before: Record<string, any> = {};
  const after: Record<string, any> = {};
  const updatedFields: string[] = [];
  const payload: any = { attributes: {} };

  // Display Name (with cleaning and dual-field strategy)
  if (updates.displayName) {
    before.displayName =
      contact.attributes?.displayName || contact.computedDisplayName;

    const cleaned = cleanDisplayName(updates.displayName);
    const { firstName, lastName } = parseFullName(cleaned);

    // Dual-field strategy (same as CSV script)
    payload.firstName = firstName;
    payload.lastName = lastName;
    payload.attributes.displayName = cleaned;
    payload.attributes.firstName = firstName;
    payload.attributes.lastName = lastName;
    payload.attributes.jose = cleaned; // Custom full name field

    after.displayName = cleaned;
    updatedFields.push('displayName', 'firstName', 'lastName', 'jose');
  }

  // Email
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

  // Country (convert code to full name)
  if (updates.country) {
    before.country = contact.attributes?.country;
    const countryName = convertCountryCodeToName(updates.country);
    payload.attributes.country = countryName;
    after.country = countryName;
    updatedFields.push('country');
  }

  return { payload, before, after, updatedFields };
}

/**
 * Helper: Convert country code to full name
 */
function convertCountryCodeToName(code: string): string {
  const mapping: Record<string, string> = {
    CO: 'Colombia',
    MX: 'Mexico',
    US: 'United States',
    AR: 'Argentina',
    CL: 'Chile',
    PE: 'Peru',
    EC: 'Ecuador',
    VE: 'Venezuela',
    ES: 'España',
    NL: 'Netherlands',
  };

  return mapping[code] || code;
}

/**
 * Helper: Verify update succeeded
 */
function verifyUpdate(
  updatedContact: BirdContact,
  expectedAfter: Record<string, any>
): boolean {
  // Check displayName (either computedDisplayName or attribute)
  if (expectedAfter.displayName) {
    const actualDisplayName =
      updatedContact.computedDisplayName ||
      updatedContact.attributes?.displayName;

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

  // Check country
  if (expectedAfter.country) {
    if (updatedContact.attributes?.country !== expectedAfter.country) {
      console.warn(`[Verification] Country mismatch`);
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
 * Helper: Create error response
 */
function createErrorResponse(
  code: ContactUpdateErrorResponse['code'],
  message: string,
  status: number,
  startTime: number,
  details?: Record<string, any>
): Response {
  const response: ContactUpdateErrorResponse = {
    success: false,
    error: message,
    code,
    details,
    processingTime: formatProcessingTime(startTime),
  };

  console.error(`[Contact Update Error] ${code}: ${message}`);

  return NextResponse.json(response, { status });
}

/**
 * Helper: Format processing time
 */
function formatProcessingTime(startTime: number): string {
  const elapsed = Date.now() - startTime;
  return `${(elapsed / 1000).toFixed(1)}s`;
}
