/**
 * Tests for validation utilities
 */

import { describe, expect, it } from 'vitest';
import { isInstagramUsername, isOnlyEmojis, isValidName } from '../../utils/validation';

describe('isValidName', () => {
  it('accepts valid Spanish names', () => {
    expect(isValidName('María')).toBe(true);
    expect(isValidName('Juan')).toBe(true);
    expect(isValidName('García')).toBe(true);
    expect(isValidName('José')).toBe(true);
  });

  it('accepts names with accents', () => {
    expect(isValidName('Andrés')).toBe(true);
    expect(isValidName('Sofía')).toBe(true);
    expect(isValidName('Ángel')).toBe(true);
  });

  it('accepts names with ñ', () => {
    expect(isValidName('Nuño')).toBe(true);
    expect(isValidName('Peña')).toBe(true);
  });

  it('accepts multi-word names', () => {
    expect(isValidName('María García')).toBe(true);
    expect(isValidName('Juan Pérez')).toBe(true);
  });

  it('rejects names shorter than 2 characters', () => {
    expect(isValidName('M')).toBe(false);
    expect(isValidName('J')).toBe(false);
  });

  it('rejects empty or null names', () => {
    expect(isValidName('')).toBe(false);
    expect(isValidName('  ')).toBe(false);
  });

  it('rejects all-uppercase names (likely usernames)', () => {
    expect(isValidName('USUARIO')).toBe(false);
    expect(isValidName('ADMIN')).toBe(false);
    expect(isValidName('USER123')).toBe(false);
  });

  it('accepts short uppercase names (initials)', () => {
    expect(isValidName('ANA')).toBe(true); // 3 chars is edge case
  });

  it('rejects names with numbers', () => {
    expect(isValidName('user123')).toBe(false);
    expect(isValidName('María123')).toBe(false);
    expect(isValidName('123Juan')).toBe(false);
  });

  it('rejects names with no letters', () => {
    expect(isValidName('123')).toBe(false);
    expect(isValidName('---')).toBe(false);
    expect(isValidName('...')).toBe(false);
  });
});

describe('isOnlyEmojis', () => {
  it('returns true for only emojis', () => {
    expect(isOnlyEmojis('💕🌺')).toBe(true);
    expect(isOnlyEmojis('✨🌟⭐️')).toBe(true);
    expect(isOnlyEmojis('👑🔥💎')).toBe(true);
  });

  it('returns false for text with emojis', () => {
    expect(isOnlyEmojis('Ana 💕')).toBe(false);
    expect(isOnlyEmojis('💕 María')).toBe(false);
    expect(isOnlyEmojis('Juan 💕 Pérez')).toBe(false);
  });

  it('returns false for plain text', () => {
    expect(isOnlyEmojis('María García')).toBe(false);
    expect(isOnlyEmojis('Juan')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isOnlyEmojis('')).toBe(false);
  });

  it('returns false for spaces', () => {
    expect(isOnlyEmojis('   ')).toBe(false);
  });

  it('handles emojis with spaces', () => {
    expect(isOnlyEmojis('💕 🌺')).toBe(true);
  });
});

describe('isInstagramUsername', () => {
  it('accepts valid Instagram usernames', () => {
    expect(isInstagramUsername('maria.garcia')).toBe(true);
    expect(isInstagramUsername('user_123')).toBe(true);
    expect(isInstagramUsername('juan.perez')).toBe(true);
    expect(isInstagramUsername('ana_123')).toBe(true);
  });

  it('accepts usernames with dots and underscores', () => {
    expect(isInstagramUsername('first.last')).toBe(true);
    expect(isInstagramUsername('user_name')).toBe(true);
    expect(isInstagramUsername('user.name_123')).toBe(true);
  });

  it('accepts all lowercase alphanumeric', () => {
    expect(isInstagramUsername('user123')).toBe(true);
    expect(isInstagramUsername('abc')).toBe(true);
  });

  it('rejects usernames with spaces', () => {
    expect(isInstagramUsername('maria garcia')).toBe(false);
    expect(isInstagramUsername('user name')).toBe(false);
  });

  it('rejects usernames with uppercase', () => {
    expect(isInstagramUsername('María')).toBe(false);
    expect(isInstagramUsername('María García')).toBe(false);
    expect(isInstagramUsername('UserName')).toBe(false);
  });

  it('rejects usernames too short (< 3 chars)', () => {
    expect(isInstagramUsername('ab')).toBe(false);
    expect(isInstagramUsername('a')).toBe(false);
  });

  it('rejects usernames too long (> 30 chars)', () => {
    expect(isInstagramUsername('a'.repeat(31))).toBe(false);
    expect(isInstagramUsername('very_long_username_that_exceeds_limit')).toBe(false);
  });

  it('rejects usernames with special characters', () => {
    expect(isInstagramUsername('user@name')).toBe(false);
    expect(isInstagramUsername('user-name')).toBe(false);
    expect(isInstagramUsername('user#name')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isInstagramUsername('')).toBe(false);
  });

  it('accepts exact 3-character username', () => {
    expect(isInstagramUsername('abc')).toBe(true);
  });

  it('accepts exact 30-character username', () => {
    expect(isInstagramUsername('a'.repeat(30))).toBe(true);
  });
});
