/**
 * @file Contact Normalization Utilities
 * @description Flexible normalization functions for contact data from AI extraction
 * @module lib/utils/contact-normalization
 * @exports normalizeCountry, extractCountryFromPhone, normalizeEmail, normalizeAndValidateContactUpdates, NormalizedContactUpdate, CountryResult, NormalizationResult
 */

import { validateDisplayName, validateEmail, validatePhone } from './contact-validation';
import { cleanDisplayName } from './name-cleaning';

/**
 * Country normalization result
 */
export interface CountryResult {
  code?: string; // ISO 3166-1 alpha-2 (CO, MX, US)
  name?: string; // Full name (Colombia, Mexico, United States)
  valid: boolean;
}

/**
 * Normalized contact update result
 */
export interface NormalizedContactUpdate {
  displayName?: string;
  email?: string;
  phone?: string;
  country?: string; // ISO code
  countryName?: string; // Full name
}

/**
 * Normalization result with validation
 */
export interface NormalizationResult {
  normalized: NormalizedContactUpdate;
  hasData: boolean; // At least one valid field
  hasRequiredFields: boolean; // displayName + country present
  estatus: 'datosok' | 'pendiente';
}

/**
 * Country name/code mapping (LATAM + common)
 */
const COUNTRY_MAPPING: Record<string, { code: string; name: string }> = {
  // Colombia
  CO: { code: 'CO', name: 'Colombia' },
  COLOMBIA: { code: 'CO', name: 'Colombia' },

  // Mexico
  MX: { code: 'MX', name: 'Mexico' },
  MEXICO: { code: 'MX', name: 'Mexico' },
  MÉXICO: { code: 'MX', name: 'Mexico' },
  MEJICO: { code: 'MX', name: 'Mexico' },

  // United States
  US: { code: 'US', name: 'United States' },
  USA: { code: 'US', name: 'United States' },
  'UNITED STATES': { code: 'US', name: 'United States' },
  'ESTADOS UNIDOS': { code: 'US', name: 'United States' },
  'U.S.A.': { code: 'US', name: 'United States' },
  'U.S.': { code: 'US', name: 'United States' },

  // Argentina
  AR: { code: 'AR', name: 'Argentina' },
  ARGENTINA: { code: 'AR', name: 'Argentina' },

  // Chile
  CL: { code: 'CL', name: 'Chile' },
  CHILE: { code: 'CL', name: 'Chile' },

  // Peru
  PE: { code: 'PE', name: 'Peru' },
  PERU: { code: 'PE', name: 'Peru' },
  PERÚ: { code: 'PE', name: 'Peru' },

  // Ecuador
  EC: { code: 'EC', name: 'Ecuador' },
  ECUADOR: { code: 'EC', name: 'Ecuador' },

  // Venezuela
  VE: { code: 'VE', name: 'Venezuela' },
  VENEZUELA: { code: 'VE', name: 'Venezuela' },

  // España
  ES: { code: 'ES', name: 'España' },
  ESPAÑA: { code: 'ES', name: 'España' },
  SPAIN: { code: 'ES', name: 'España' },

  // Netherlands
  NL: { code: 'NL', name: 'Netherlands' },
  NETHERLANDS: { code: 'NL', name: 'Netherlands' },
  HOLANDA: { code: 'NL', name: 'Netherlands' },
};

/**
 * Normalize country input to ISO code + full name
 *
 * Accepts flexible formats:
 * - ISO codes: CO, MX, US
 * - Full names: Colombia, Mexico, United States
 * - Variations: USA, Estados Unidos, México, U.S.A.
 *
 * @param input - Country name or code (case-insensitive)
 * @returns Country code, name, and validity
 *
 * @example
 * ```ts
 * normalizeCountry('USA');
 * // { code: 'US', name: 'United States', valid: true }
 *
 * normalizeCountry('Estados Unidos');
 * // { code: 'US', name: 'United States', valid: true }
 *
 * normalizeCountry('CO');
 * // { code: 'CO', name: 'Colombia', valid: true }
 *
 * normalizeCountry('XYZ');
 * // { valid: false }
 * ```
 */
export function normalizeCountry(input: string): CountryResult {
  const normalized = input.trim().toUpperCase();

  const result = COUNTRY_MAPPING[normalized];
  if (result) {
    return { ...result, valid: true };
  }

  return { valid: false };
}

/**
 * Phone country code to ISO mapping (LATAM + common)
 */
const PHONE_COUNTRY_CODES: Record<string, { code: string; name: string }> = {
  '1': { code: 'US', name: 'United States' }, // Also Canada, but default to US
  '52': { code: 'MX', name: 'Mexico' },
  '57': { code: 'CO', name: 'Colombia' },
  '51': { code: 'PE', name: 'Peru' },
  '54': { code: 'AR', name: 'Argentina' },
  '56': { code: 'CL', name: 'Chile' },
  '58': { code: 'VE', name: 'Venezuela' },
  '593': { code: 'EC', name: 'Ecuador' },
  '34': { code: 'ES', name: 'España' },
  '31': { code: 'NL', name: 'Netherlands' },
};

/**
 * Extract country from phone number country code
 *
 * Analyzes phone number to extract country code prefix and maps to ISO alpha-2.
 * Supports formats with or without + prefix.
 *
 * @param phone - Phone number with country code (e.g., '+57 300 123 4567', '573001234567')
 * @returns Country code, name, and validity
 *
 * @example
 * ```ts
 * extractCountryFromPhone('+57 300 123 4567');
 * // { code: 'CO', name: 'Colombia', valid: true }
 *
 * extractCountryFromPhone('573001234567');
 * // { code: 'CO', name: 'Colombia', valid: true }
 *
 * extractCountryFromPhone('+1 555 123 4567');
 * // { code: 'US', name: 'United States', valid: true }
 *
 * extractCountryFromPhone('3001234567');
 * // { valid: false }
 * ```
 */
export function extractCountryFromPhone(phone: string): CountryResult {
  // Remove all non-digit characters except leading +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // Remove + prefix if present
  const digits = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;

  // Try 3-digit codes first (Ecuador: 593)
  if (digits.length >= 3) {
    const threeDigit = digits.slice(0, 3);
    const result = PHONE_COUNTRY_CODES[threeDigit];
    if (result) {
      return { ...result, valid: true };
    }
  }

  // Try 2-digit codes (Mexico: 52, Colombia: 57, etc.)
  if (digits.length >= 2) {
    const twoDigit = digits.slice(0, 2);
    const result = PHONE_COUNTRY_CODES[twoDigit];
    if (result) {
      return { ...result, valid: true };
    }
  }

  // Try 1-digit codes (US/Canada: 1)
  if (digits.length >= 1) {
    const oneDigit = digits.slice(0, 1);
    const result = PHONE_COUNTRY_CODES[oneDigit];
    if (result) {
      return { ...result, valid: true };
    }
  }

  return { valid: false };
}

/**
 * Normalize email input
 *
 * Cleans common issues:
 * - Removes leading/trailing spaces
 * - Fixes typos: gmail.con → gmail.com, hotmial.com → hotmail.com
 *
 * @param input - Email address (may have spaces/typos)
 * @returns Cleaned email or undefined if invalid
 *
 * @example
 * ```ts
 * normalizeEmail('  [email protected]  ');
 * // '[email protected]'
 *
 * normalizeEmail('[email protected]');
 * // '[email protected]'
 *
 * normalizeEmail('invalid@');
 * // undefined
 * ```
 */
export function normalizeEmail(input: string): string | undefined {
  // 1. Remove all spaces
  let cleaned = input.replace(/\s+/g, '');

  // 2. Fix common typos
  cleaned = cleaned
    .replace(/gmail\.con$/i, 'gmail.com')
    .replace(/hotmial\.com$/i, 'hotmail.com')
    .replace(/yahooo\.com$/i, 'yahoo.com')
    .replace(/outlok\.com$/i, 'outlook.com');

  // 3. Validate
  const validation = validateEmail(cleaned);
  if (!validation.valid) {
    return undefined;
  }

  return cleaned;
}

/**
 * Normalize and validate contact updates with graceful degradation
 *
 * Strategy:
 * - Normalizes each field BEFORE validation
 * - Invalid fields → undefined (not included in result)
 * - Valid fields → included in normalized result
 * - estatus logic (updated - country extracted from phone, not required):
 *   - datosok: displayName + email valid
 *   - pendiente: missing displayName or email
 *
 * @param updates - Raw contact updates from AI extraction
 * @returns Normalized updates + validation status + estatus
 *
 * @example
 * ```ts
 * normalizeAndValidateContactUpdates({
 *   displayName: '😊 Maria Garcia',
 *   email: '  [email protected]  ',
 *   country: 'USA'
 * });
 * // {
 * //   normalized: {
 * //     displayName: 'Maria Garcia',
 * //     email: '[email protected]',
 * //     country: 'US',
 * //     countryName: 'United States'
 * //   },
 * //   hasData: true,
 * //   hasRequiredFields: true,
 * //   estatus: 'datosok'
 * // }
 *
 * normalizeAndValidateContactUpdates({
 *   displayName: 'Juan',
 *   email: 'invalid@'
 * });
 * // {
 * //   normalized: { displayName: 'Juan' },
 * //   hasData: true,
 * //   hasRequiredFields: true,
 * //   estatus: 'pendiente'
 * // }
 * ```
 */
export function normalizeAndValidateContactUpdates(updates: {
  displayName?: string;
  email?: string;
  phone?: string;
  country?: string;
}): NormalizationResult {
  const normalized: NormalizedContactUpdate = {};

  // 1. Normalize displayName (remove emojis, capitalize)
  if (updates.displayName) {
    const cleaned = cleanDisplayName(updates.displayName);
    const validation = validateDisplayName(cleaned);
    if (validation.valid) {
      normalized.displayName = cleaned;
    }
  }

  // 2. Normalize email (remove spaces, fix typos)
  if (updates.email) {
    const cleaned = normalizeEmail(updates.email);
    if (cleaned) {
      normalized.email = cleaned;
    }
  }

  // 3. Normalize phone (just validate, no cleaning needed)
  if (updates.phone) {
    const validation = validatePhone(updates.phone);
    if (validation.valid) {
      normalized.phone = updates.phone;
    }
  }

  // 4. Normalize country (USA → US, Estados Unidos → US)
  if (updates.country) {
    const countryResult = normalizeCountry(updates.country);
    if (countryResult.valid) {
      normalized.country = countryResult.code;
      normalized.countryName = countryResult.name;
    }
  }

  // 5. Determine estatus
  const hasDisplayName = !!normalized.displayName;
  const hasEmail = !!normalized.email;

  // datosok = displayName + email (country extracted from phone, not required)
  // pendiente = missing displayName or email
  const estatus = hasDisplayName && hasEmail ? 'datosok' : 'pendiente';

  return {
    normalized,
    hasData: Object.keys(normalized).length > 0,
    hasRequiredFields: hasDisplayName, // Only displayName is required now
    estatus,
  };
}
