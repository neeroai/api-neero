/**
 * Tests for normalization Zod schemas
 */

import { describe, it, expect } from 'vitest';
import {
  ContactInputSchema,
  NormalizedContactSchema,
  AIExtractionSchema,
} from '../schemas';

describe('ContactInputSchema', () => {
  it('validates valid contact input', () => {
    const input = {
      displayName: 'María García 💕',
      phone: '+573001234567',
      conversationMessages: ['Hola, me llamo María García López'],
    };

    const result = ContactInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('allows optional fields', () => {
    const input = {};
    const result = ContactInputSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.conversationMessages).toEqual([]);
    }
  });

  it('defaults conversationMessages to empty array', () => {
    const input = { displayName: 'Juan' };
    const result = ContactInputSchema.parse(input);
    expect(result.conversationMessages).toEqual([]);
  });
});

describe('NormalizedContactSchema', () => {
  it('validates complete normalized contact', () => {
    const contact = {
      displayName: 'María García López',
      firstName: 'María',
      lastName: 'García López',
      email: 'test@test.com',
      country: 'CO',
      countryName: 'Colombia',
      phone: '+573001234567',
      gender: 'F' as const,
      city: 'Bogotá',
      alias: 'Mari',
      confidence: 0.95,
      method: 'hybrid' as const,
      extractionMethods: ['regex', 'ai'],
    };

    const result = NormalizedContactSchema.safeParse(contact);
    if (!result.success) {
      console.error('Validation errors:', JSON.stringify(result.error.errors, null, 2));
    }
    expect(result.success).toBe(true);
  });

  it('requires critical fields', () => {
    const contact = {
      displayName: 'Juan',
      firstName: 'Juan',
      lastName: 'Pérez',
      confidence: 0.85,
      method: 'regex' as const,
      extractionMethods: ['regex'],
    };

    const result = NormalizedContactSchema.safeParse(contact);
    expect(result.success).toBe(true);
  });

  it('validates email format', () => {
    const contact = {
      displayName: 'Juan',
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'invalid-email',
      confidence: 0.85,
      method: 'regex' as const,
      extractionMethods: ['regex'],
    };

    const result = NormalizedContactSchema.safeParse(contact);
    expect(result.success).toBe(false);
  });

  it('validates gender enum', () => {
    const contact = {
      displayName: 'Juan',
      firstName: 'Juan',
      lastName: 'Pérez',
      gender: 'X' as any,
      confidence: 0.85,
      method: 'regex' as const,
      extractionMethods: ['regex'],
    };

    const result = NormalizedContactSchema.safeParse(contact);
    expect(result.success).toBe(false);
  });

  it('validates confidence range 0-1', () => {
    const contact = {
      displayName: 'Juan',
      firstName: 'Juan',
      lastName: 'Pérez',
      confidence: 1.5,
      method: 'regex' as const,
      extractionMethods: ['regex'],
    };

    const result = NormalizedContactSchema.safeParse(contact);
    expect(result.success).toBe(false);
  });
});

describe('AIExtractionSchema', () => {
  it('validates AI extraction with all fields', () => {
    const extraction = {
      fullName: 'María García López',
      firstName: 'María',
      lastName: 'García López',
      email: 'test@test.com',
      gender: 'F' as const,
      city: 'Bogotá',
      confidence: 0.95,
      reasoning: 'Explicit mention with pattern "me llamo"',
    };

    const result = AIExtractionSchema.safeParse(extraction);
    if (!result.success) {
      console.error('Validation errors:', JSON.stringify(result.error.errors, null, 2));
    }
    expect(result.success).toBe(true);
  });

  it('validates minimal AI extraction', () => {
    const extraction = {
      fullName: 'Juan Pérez',
      firstName: 'Juan',
      lastName: 'Pérez',
      confidence: 0.75,
    };

    const result = AIExtractionSchema.safeParse(extraction);
    expect(result.success).toBe(true);
  });

  it('validates email format in extraction', () => {
    const extraction = {
      fullName: 'Juan',
      firstName: 'Juan',
      lastName: '',
      email: 'invalid',
      confidence: 0.5,
    };

    const result = AIExtractionSchema.safeParse(extraction);
    expect(result.success).toBe(false);
  });
});
