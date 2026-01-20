/**
 * @file Contact Validation Utilities
 * @description Exports 6 functions and types
 * @module lib/utils/contact-validation
 * @exports ValidationResult, validateContactUpdates, validateCountryCode, validateDisplayName, validateEmail, validatePhone
 */
/**
 * Contact Validation Utilities
 *
 * Provides Edge Runtime compatible validation functions for contact data.
 * All validations use Web APIs only (no Node.js dependencies).
 *
 * Validates:
 * - Email format (RFC 5322 simplified)
 * - Phone format (E.164 international standard)
 * - Country code (ISO 3166-1 alpha-2)
 * - Display name (length and content)
 */

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate email format (RFC 5322 simplified)
 *
 * Uses simplified RFC 5322 regex for broad compatibility.
 * Edge Runtime compatible (no Node.js regex features).
 *
 * Rules:
 * - Format: [local]@[domain].[tld]
 * - Max length: 254 chars (RFC 5321)
 * - No spaces allowed
 *
 * @param email - Email address to validate
 * @returns Validation result with error message if invalid
 *
 * @example
 * validateEmail('[email protected]') // Returns: { valid: true }
 * validateEmail('abc@') // Returns: { valid: false, error: 'Invalid email format' }
 * validateEmail('[email protected]') // Returns: { valid: false, error: 'Invalid email format' }
 */
export function validateEmail(email: string): ValidationResult {
  // Simple but reliable email regex (RFC 5322 subset)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  if (email.length > 254) {
    return { valid: false, error: 'Email too long (max 254 chars)' };
  }

  return { valid: true };
}

/**
 * Validate phone format (E.164 international standard)
 *
 * E.164 format: +[country code][subscriber number]
 * - Must start with '+'
 * - Followed by 1-15 digits
 * - No spaces, dashes, or parentheses
 *
 * @param phone - Phone number to validate
 * @returns Validation result with error message if invalid
 *
 * @example
 * validatePhone('+573001234567') // Returns: { valid: true }
 * validatePhone('+12025551234') // Returns: { valid: true }
 * validatePhone('3001234567') // Returns: { valid: false, error: '...' }
 * validatePhone('+0123456789') // Returns: { valid: false, error: '...' }
 */
export function validatePhone(phone: string): ValidationResult {
  // E.164 format: + followed by 1-15 digits
  // First digit after + must be 1-9 (no leading zeros in country codes)
  const phoneRegex = /^\+[1-9]\d{1,14}$/;

  if (!phoneRegex.test(phone)) {
    return {
      valid: false,
      error: 'Invalid phone format. Must be E.164 format: +[country][number]',
    };
  }

  return { valid: true };
}

/**
 * Validate ISO 3166-1 alpha-2 country code
 *
 * ISO 3166-1 alpha-2: Exactly 2 uppercase letters (e.g., CO, MX, US)
 *
 * Supported countries (LATAM + common):
 * - CO (Colombia)
 * - MX (Mexico)
 * - US (United States)
 * - AR (Argentina)
 * - CL (Chile)
 * - PE (Peru)
 * - EC (Ecuador)
 * - VE (Venezuela)
 * - ES (España)
 * - NL (Netherlands)
 *
 * @param code - Country code to validate
 * @returns Validation result with error message if invalid
 *
 * @example
 * validateCountryCode('CO') // Returns: { valid: true }
 * validateCountryCode('MX') // Returns: { valid: true }
 * validateCountryCode('Colombia') // Returns: { valid: false, error: '...' }
 * validateCountryCode('co') // Returns: { valid: false, error: '...' }
 */
export function validateCountryCode(code: string): ValidationResult {
  // ISO 3166-1 alpha-2: exactly 2 uppercase letters
  if (!/^[A-Z]{2}$/.test(code)) {
    return {
      valid: false,
      error: 'Invalid country code. Must be ISO 3166-1 alpha-2 (e.g., CO, US)',
    };
  }

  // Whitelist of supported countries
  const supportedCountries = [
    'CO', // Colombia
    'MX', // Mexico
    'US', // United States
    'AR', // Argentina
    'CL', // Chile
    'PE', // Peru
    'EC', // Ecuador
    'VE', // Venezuela
    'ES', // España
    'NL', // Netherlands
  ];

  if (!supportedCountries.includes(code)) {
    return {
      valid: false,
      error: `Unsupported country code: ${code}. Supported: ${supportedCountries.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Validate display name (length and content)
 *
 * Rules:
 * - Min length: 1 char (after trim)
 * - Max length: 100 chars
 * - Must contain at least one letter or number
 *
 * @param name - Display name to validate
 * @returns Validation result with error message if invalid
 *
 * @example
 * validateDisplayName('Juan Perez') // Returns: { valid: true }
 * validateDisplayName('D. Fernando') // Returns: { valid: true }
 * validateDisplayName('   ') // Returns: { valid: false, error: 'Display name cannot be empty' }
 * validateDisplayName('😊😊😊') // Returns: { valid: false, error: 'Display name must contain...' }
 */
export function validateDisplayName(name: string): ValidationResult {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Display name cannot be empty' };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'Display name too long (max 100 chars)' };
  }

  // Check for only special characters (no letters/numbers)
  if (!/[a-zA-Z0-9]/.test(trimmed)) {
    return {
      valid: false,
      error: 'Display name must contain at least one letter or number',
    };
  }

  return { valid: true };
}

/**
 * Validate all update fields (batch validation)
 *
 * Returns all errors (not just first failure).
 * Useful for showing user all validation issues at once.
 *
 * @param updates - Contact update fields
 * @returns Validation result with errors object (field → error message)
 *
 * @example
 * validateContactUpdates({
 *   displayName: 'Juan Perez',
 *   email: '[email protected]',
 *   phone: '+573001234567',
 *   country: 'CO'
 * })
 * // Returns: { valid: true, errors: {} }
 *
 * validateContactUpdates({
 *   email: 'abc@',
 *   phone: '3001234567'
 * })
 * // Returns: {
 * //   valid: false,
 * //   errors: {
 * //     email: 'Invalid email format',
 * //     phone: 'Invalid phone format...'
 * //   }
 * // }
 */
export function validateContactUpdates(updates: {
  displayName?: string;
  email?: string;
  phone?: string;
  country?: string;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (updates.displayName) {
    const result = validateDisplayName(updates.displayName);
    if (!result.valid) errors.displayName = result.error!;
  }

  if (updates.email) {
    const result = validateEmail(updates.email);
    if (!result.valid) errors.email = result.error!;
  }

  if (updates.phone) {
    const result = validatePhone(updates.phone);
    if (!result.valid) errors.phone = result.error!;
  }

  if (updates.country) {
    const result = validateCountryCode(updates.country);
    if (!result.valid) errors.country = result.error!;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
