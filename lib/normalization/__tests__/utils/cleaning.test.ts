/**
 * Tests for cleaning utilities
 */

import { describe, it, expect } from 'vitest';
import { cleanDisplayName, removeEmojis, EMOJI_PATTERN } from '../../utils/cleaning';

describe('EMOJI_PATTERN', () => {
  it('matches common emojis', () => {
    const text = 'Hello 💕 World 🌟';
    const result = text.replace(EMOJI_PATTERN, '');
    expect(result).toBe('Hello  World ');
  });

  it('matches multiple emoji categories', () => {
    const text = '👑🔥💎✨🌟⭐️💫🎉🎊🎁';
    const result = text.replace(EMOJI_PATTERN, '');
    expect(result).toBe('');
  });

  it('preserves regular text', () => {
    const text = 'No emojis here';
    const result = text.replace(EMOJI_PATTERN, '');
    expect(result).toBe('No emojis here');
  });
});

describe('removeEmojis', () => {
  it('removes emojis from text', () => {
    expect(removeEmojis('Melissa Martinez 💕')).toBe('Melissa Martinez ');
  });

  it('removes multiple emojis', () => {
    expect(removeEmojis('Ana ✨🌟 García 💕')).toBe('Ana  García ');
  });

  it('handles text with no emojis', () => {
    expect(removeEmojis('Juan Pérez')).toBe('Juan Pérez');
  });

  it('handles empty string', () => {
    expect(removeEmojis('')).toBe('');
  });

  it('handles only emojis', () => {
    expect(removeEmojis('💕🌺✨')).toBe('');
  });
});

describe('cleanDisplayName', () => {
  it('removes emojis and trims', () => {
    expect(cleanDisplayName('Melissa Martinez 💕')).toBe('Melissa Martinez');
  });

  it('normalizes multiple spaces', () => {
    expect(cleanDisplayName('Ana  ✨🌟  García')).toBe('Ana García');
  });

  it('handles leading and trailing spaces', () => {
    expect(cleanDisplayName('  María García  ')).toBe('María García');
  });

  it('handles mixed emojis and spaces', () => {
    expect(cleanDisplayName('Juan 💕  Pérez  🌟')).toBe('Juan Pérez');
  });

  it('handles empty string', () => {
    expect(cleanDisplayName('')).toBe('');
  });

  it('handles only emojis', () => {
    expect(cleanDisplayName('💕🌺✨')).toBe('');
  });

  it('handles only spaces', () => {
    expect(cleanDisplayName('   ')).toBe('');
  });

  it('preserves proper names', () => {
    expect(cleanDisplayName('María García López')).toBe('María García López');
  });

  it('handles tab characters', () => {
    expect(cleanDisplayName('Ana\t\tGarcía')).toBe('Ana García');
  });

  it('handles newline characters', () => {
    expect(cleanDisplayName('Juan\nPérez')).toBe('Juan Pérez');
  });
});
