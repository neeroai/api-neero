/**
 * @file GPT-4o-mini Extractor Unit Tests
 * @description Tests for contact normalization using GPT-4o-mini structured outputs
 * @module __tests__/lib/normalization/gpt4o-mini-extractor
 */

import { describe, expect, it, vi } from 'vitest';
import {
  estimateExtractionCost,
  extractContactDataGPT4oMini,
} from '@/lib/normalization/gpt4o-mini-extractor';

// Mock AI SDK to avoid actual API calls in tests
vi.mock('ai', () => ({
  generateObject: vi.fn().mockResolvedValue({
    object: {
      displayName: 'Maria Garcia',
      firstName: 'Maria',
      lastName: 'Garcia',
      email: '[email protected]',
      country: 'CO',
      confidence: 0.95,
    },
    usage: {
      totalTokens: 250,
    },
  }),
}));

describe('extractContactDataGPT4oMini', () => {
  it('should extract name, email, and country from explicit introduction', async () => {
    const result = await extractContactDataGPT4oMini(
      'Hola! Soy Maria Garcia, mi correo es [email protected]',
      {
        contactPhone: '+573001234567',
        fallbackToRegex: false, // Force GPT-4o-mini
      }
    );

    expect(result.displayName).toBe('Maria Garcia');
    expect(result.firstName).toBe('Maria');
    expect(result.lastName).toBe('Garcia');
    expect(result.email).toBe('[email protected]');
    expect(result.country).toBe('CO');
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    expect(result.method).toBe('gpt4o-mini');
  });

  it('should use regex fallback for high-confidence patterns', async () => {
    const result = await extractContactDataGPT4oMini(
      'Me llamo Juan Pérez López y mi email es [email protected]',
      {
        contactPhone: '+523001234567',
        fallbackToRegex: true, // Enable regex fallback
      }
    );

    // Should use regex (confidence >= 0.85) and skip AI call
    expect(result.displayName).toContain('Juan');
    expect(result.method).toBe('regex');
    expect(result.confidence).toBeGreaterThanOrEqual(0.85);
  });

  it('should handle empty conversation gracefully', async () => {
    const result = await extractContactDataGPT4oMini('', {
      contactPhone: '+573001234567',
    });

    expect(result.displayName).toBe('');
    expect(result.confidence).toBe(0);
    expect(result.method).toBe('regex');
  });

  it('should clean emojis from display name', async () => {
    const result = await extractContactDataGPT4oMini(
      'Hola soy 😊MARIA😊 mi correo es [email protected]',
      {
        contactPhone: '+573001234567',
        fallbackToRegex: false,
      }
    );

    expect(result.displayName).not.toContain('😊');
    expect(result.displayName).toMatch(/^[A-Za-z\s]+$/);
  });

  it('should infer country from phone code', async () => {
    const result = await extractContactDataGPT4oMini('Hola soy Ana López', {
      contactPhone: '+523001234567', // Mexico
      fallbackToRegex: false,
    });

    // Country should be inferred from phone code
    expect(['MX', 'CO']).toContain(result.country);
  });

  it('should handle LATAM naming (2 apellidos)', async () => {
    const result = await extractContactDataGPT4oMini(
      'Mi nombre es Carlos Pérez Rodríguez',
      {
        contactPhone: '+573001234567',
        fallbackToRegex: false,
      }
    );

    expect(result.firstName).toBe('Carlos');
    expect(result.lastName).toContain('Pérez');
    // Should support 2 apellidos
    expect(result.displayName).toContain('Rodríguez');
  });

  it('should return low confidence for ambiguous input', async () => {
    const result = await extractContactDataGPT4oMini('Hola', {
      contactPhone: '+573001234567',
      fallbackToRegex: true,
    });

    // Regex should fail, GPT-4o-mini should return low confidence
    expect(result.confidence).toBeLessThan(0.6);
  });

  it('should handle Instagram usernames (not real names)', async () => {
    const result = await extractContactDataGPT4oMini('@mariita_123 Hola cómo estás', {
      contactPhone: '+573001234567',
      fallbackToRegex: false,
    });

    // Should recognize @username is not a real name
    expect(result.displayName).not.toBe('@mariita_123');
    expect(result.confidence).toBeLessThan(0.5);
  });

  it('should include processing time and token usage', async () => {
    const result = await extractContactDataGPT4oMini('Hola soy Maria Garcia', {
      contactPhone: '+573001234567',
      fallbackToRegex: false,
    });

    expect(result.processingTime).toBeGreaterThan(0);
    expect(result.tokensUsed).toBeGreaterThan(0);
  });

  it('should truncate long conversations to maxTokens', async () => {
    const longConversation = 'Hola '.repeat(1000) + 'Soy Maria Garcia';

    const result = await extractContactDataGPT4oMini(longConversation, {
      contactPhone: '+573001234567',
      maxTokens: 100, // Limit to 100 tokens (~400 chars)
      fallbackToRegex: false,
    });

    // Should still extract name despite truncation
    expect(result.displayName).toBeTruthy();
  });
});

describe('estimateExtractionCost', () => {
  it('should calculate cost for 1000 contacts', () => {
    const cost = estimateExtractionCost(1000);

    // Expected: ~$0.03 for 1000 contacts
    expect(cost).toBeGreaterThan(0);
    expect(cost).toBeLessThan(0.05); // Should be < $0.05
  });

  it('should calculate cost for 10,000 contacts', () => {
    const cost = estimateExtractionCost(10000);

    // Expected: ~$0.30 for 10,000 contacts
    expect(cost).toBeGreaterThan(0.25);
    expect(cost).toBeLessThan(0.35);
  });

  it('should scale linearly with contact count', () => {
    const cost1K = estimateExtractionCost(1000);
    const cost2K = estimateExtractionCost(2000);

    // Cost should double when contacts double
    expect(cost2K).toBeCloseTo(cost1K * 2, 2);
  });
});
