/**
 * Tests for contact normalization utilities
 */

import { describe, expect, it } from 'vitest';
import {
  extractCountryFromPhone,
  normalizeAndValidateContactUpdates,
  normalizeCountry,
  normalizeEmail,
} from '@/lib/utils/contact-normalization';

describe('normalizeCountry', () => {
  it('should normalize USA to US', () => {
    const result = normalizeCountry('USA');
    expect(result).toEqual({
      code: 'US',
      name: 'United States',
      valid: true,
    });
  });

  it('should normalize Estados Unidos to US', () => {
    const result = normalizeCountry('Estados Unidos');
    expect(result).toEqual({
      code: 'US',
      name: 'United States',
      valid: true,
    });
  });

  it('should normalize Colombia to CO', () => {
    const result = normalizeCountry('Colombia');
    expect(result).toEqual({
      code: 'CO',
      name: 'Colombia',
      valid: true,
    });
  });

  it('should normalize Mexico variations', () => {
    expect(normalizeCountry('Mexico')).toEqual({
      code: 'MX',
      name: 'Mexico',
      valid: true,
    });
    expect(normalizeCountry('México')).toEqual({
      code: 'MX',
      name: 'Mexico',
      valid: true,
    });
    expect(normalizeCountry('Mejico')).toEqual({
      code: 'MX',
      name: 'Mexico',
      valid: true,
    });
  });

  it('should handle ISO codes directly', () => {
    const result = normalizeCountry('CO');
    expect(result).toEqual({
      code: 'CO',
      name: 'Colombia',
      valid: true,
    });
  });

  it('should reject invalid country', () => {
    const result = normalizeCountry('XYZ');
    expect(result).toEqual({
      valid: false,
    });
  });

  it('should be case-insensitive', () => {
    expect(normalizeCountry('usa')).toEqual({
      code: 'US',
      name: 'United States',
      valid: true,
    });
    expect(normalizeCountry('colombia')).toEqual({
      code: 'CO',
      name: 'Colombia',
      valid: true,
    });
  });
});

describe('extractCountryFromPhone', () => {
  it('should extract Colombia from +57 prefix', () => {
    const result = extractCountryFromPhone('+57 300 123 4567');
    expect(result).toEqual({
      code: 'CO',
      name: 'Colombia',
      valid: true,
    });
  });

  it('should extract Mexico from +52 prefix', () => {
    const result = extractCountryFromPhone('+52 55 1234 5678');
    expect(result).toEqual({
      code: 'MX',
      name: 'Mexico',
      valid: true,
    });
  });

  it('should extract US from +1 prefix', () => {
    const result = extractCountryFromPhone('+1 555 123 4567');
    expect(result).toEqual({
      code: 'US',
      name: 'United States',
      valid: true,
    });
  });

  it('should extract Spain from +34 prefix', () => {
    const result = extractCountryFromPhone('+34 612 345 678');
    expect(result).toEqual({
      code: 'ES',
      name: 'España',
      valid: true,
    });
  });

  it('should extract Ecuador from +593 prefix (3-digit code)', () => {
    const result = extractCountryFromPhone('+593 2 123 4567');
    expect(result).toEqual({
      code: 'EC',
      name: 'Ecuador',
      valid: true,
    });
  });

  it('should handle phone without + prefix', () => {
    const result = extractCountryFromPhone('573001234567');
    expect(result).toEqual({
      code: 'CO',
      name: 'Colombia',
      valid: true,
    });
  });

  it('should handle phone with spaces and dashes', () => {
    const result = extractCountryFromPhone('+57-300-123-4567');
    expect(result).toEqual({
      code: 'CO',
      name: 'Colombia',
      valid: true,
    });
  });

  it('should return invalid for unknown country code', () => {
    const result = extractCountryFromPhone('3001234567');
    expect(result).toEqual({
      valid: false,
    });
  });

  it('should return invalid for empty or very short number', () => {
    const result = extractCountryFromPhone('');
    expect(result).toEqual({
      valid: false,
    });
  });
});

describe('normalizeEmail', () => {
  it('should remove spaces', () => {
    const input = '  juan' + '@' + 'gmail.com  ';
    const expected = 'juan' + '@' + 'gmail.com';
    const result = normalizeEmail(input);
    expect(result).toBe(expected);
  });

  it('should fix gmail.con typo', () => {
    const input = 'juan' + '@' + 'gmail.con';
    const expected = 'juan' + '@' + 'gmail.com';
    const result = normalizeEmail(input);
    expect(result).toBe(expected);
  });

  it('should fix hotmial.com typo', () => {
    const input = 'maria' + '@' + 'hotmial.com';
    const expected = 'maria' + '@' + 'hotmail.com';
    const result = normalizeEmail(input);
    expect(result).toBe(expected);
  });

  it('should return undefined for invalid email', () => {
    expect(normalizeEmail('invalid' + '@')).toBeUndefined();
    expect(normalizeEmail('notanemail')).toBeUndefined();
  });
});

describe('normalizeAndValidateContactUpdates', () => {
  it('should normalize all valid fields', () => {
    const email = '  maria' + '@' + 'example.com  ';
    const result = normalizeAndValidateContactUpdates({
      displayName: '😊 Maria Garcia',
      email: email,
      country: 'USA',
    });

    expect(result.normalized.displayName).toBe('Maria Garcia');
    expect(result.normalized.email).toBe('maria' + '@' + 'example.com');
    expect(result.normalized.country).toBe('US');
    expect(result.normalized.countryName).toBe('United States');
    expect(result.estatus).toBe('datosok');
    expect(result.hasData).toBe(true);
    expect(result.hasRequiredFields).toBe(true);
  });

  it('should mark as pendiente when email missing', () => {
    const result = normalizeAndValidateContactUpdates({
      displayName: 'Juan Perez',
      country: 'CO',
    });

    expect(result.normalized.displayName).toBe('Juan Perez');
    expect(result.normalized.country).toBe('CO');
    expect(result.normalized.countryName).toBe('Colombia');
    expect(result.normalized.email).toBeUndefined();
    expect(result.estatus).toBe('pendiente');
    expect(result.hasRequiredFields).toBe(true); // displayName + country present
  });

  it('should ignore invalid email but keep valid fields', () => {
    const result = normalizeAndValidateContactUpdates({
      displayName: 'Juan Perez',
      email: 'invalid' + '@',
      country: 'MX',
    });

    expect(result.normalized.displayName).toBe('Juan Perez');
    expect(result.normalized.country).toBe('MX');
    expect(result.normalized.email).toBeUndefined(); // Invalid email ignored
    expect(result.estatus).toBe('pendiente'); // Missing valid email
  });

  it('should ignore invalid country but keep valid fields', () => {
    const result = normalizeAndValidateContactUpdates({
      displayName: 'Maria Garcia',
      email: 'maria' + '@' + 'test.com',
      country: 'XYZ',
    });

    expect(result.normalized.displayName).toBe('Maria Garcia');
    expect(result.normalized.email).toBe('maria' + '@' + 'test.com');
    expect(result.normalized.country).toBeUndefined(); // Invalid country ignored
    expect(result.normalized.countryName).toBeUndefined();
    expect(result.estatus).toBe('datosok'); // Has displayName + email (country not required)
  });

  it('should return hasRequiredFields=false when missing displayName', () => {
    const result = normalizeAndValidateContactUpdates({
      email: 'test' + '@' + 'example.com',
      country: 'CO',
    });

    expect(result.hasRequiredFields).toBe(false);
    expect(result.estatus).toBe('pendiente');
  });

  it('should return hasRequiredFields=true and datosok when has displayName and email', () => {
    const result = normalizeAndValidateContactUpdates({
      displayName: 'Juan Perez',
      email: 'juan' + '@' + 'test.com',
    });

    expect(result.hasRequiredFields).toBe(true); // Has displayName (country not required)
    expect(result.estatus).toBe('datosok'); // Has displayName + email
  });

  it('should handle all invalid fields', () => {
    const result = normalizeAndValidateContactUpdates({
      displayName: '😊😊😊', // Only emojis -> normalizes to 'Unknown' (valid)
      email: 'invalid' + '@',
      country: 'XYZ',
    });

    // displayName '😊😊😊' normalizes to 'Unknown' which is valid
    expect(result.normalized.displayName).toBe('Unknown');
    expect(result.normalized.email).toBeUndefined(); // Invalid
    expect(result.normalized.country).toBeUndefined(); // Invalid
    expect(result.hasData).toBe(true); // displayName is valid
    expect(result.hasRequiredFields).toBe(true); // Has displayName (country not required)
    expect(result.estatus).toBe('pendiente'); // Missing email
  });

  it('should normalize complex real-world case', () => {
    const email = '  maria' + '@' + 'gmail.con  ';
    const result = normalizeAndValidateContactUpdates({
      displayName: '😊 MARIA   GARCIA 🌻',
      email: email,
      country: 'Estados Unidos',
    });

    expect(result.normalized.displayName).toBe('Maria Garcia');
    expect(result.normalized.email).toBe('maria' + '@' + 'gmail.com'); // Fixed typo
    expect(result.normalized.country).toBe('US');
    expect(result.normalized.countryName).toBe('United States');
    expect(result.estatus).toBe('datosok');
  });
});
