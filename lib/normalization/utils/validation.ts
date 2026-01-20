/**
 * @file Name and Display Name Validation Utilities
 * @description Validation helpers for extracted names and display names
 * @module lib/normalization/utils/validation
 * @exports isValidName, isOnlyEmojis, isInstagramUsername
 */

import { EMOJI_PATTERN } from './cleaning';

/**
 * Validate if extracted name looks reasonable
 * Checks for minimum length, letter presence, and common issues
 *
 * @param name - Name to validate
 * @returns True if name passes validation
 *
 * @example
 * ```ts
 * isValidName('María'); // true
 * isValidName('USUARIO'); // false (all uppercase)
 * isValidName('user123'); // false (contains numbers)
 * isValidName('M'); // false (too short)
 * ```
 */
export function isValidName(name: string): boolean {
  if (!name || name.length < 2) return false;

  // Must contain at least one letter
  if (!/[a-záéíóúñA-ZÁÉÍÓÚÑ]/.test(name)) return false;

  // Should not be all uppercase (likely username or placeholder)
  if (name === name.toUpperCase() && name.length > 3) return false;

  // Should not contain numbers
  if (/\d/.test(name)) return false;

  return true;
}

/**
 * Check if display name contains only emojis (no text)
 *
 * @param displayName - Display name to check
 * @returns True if only emojis, no text
 *
 * @example
 * ```ts
 * isOnlyEmojis('💕🌺'); // true
 * isOnlyEmojis('Ana 💕'); // false
 * isOnlyEmojis(''); // false
 * ```
 */
export function isOnlyEmojis(displayName: string): boolean {
  if (!displayName || !displayName.trim()) return false;

  // Must contain at least one emoji
  const hasEmojis = EMOJI_PATTERN.test(displayName);
  if (!hasEmojis) return false;

  // Remove all emojis and check if anything remains
  const withoutEmojis = displayName.replace(EMOJI_PATTERN, '').trim();

  return withoutEmojis.length === 0;
}

/**
 * Check if display name is likely an Instagram username
 * Instagram usernames are lowercase, no spaces, 3-30 chars, may contain dots/underscores
 *
 * @param displayName - Display name to check
 * @returns True if looks like Instagram username
 *
 * @example
 * ```ts
 * isInstagramUsername('maria.garcia'); // true
 * isInstagramUsername('user_123'); // true
 * isInstagramUsername('María García'); // false (spaces, uppercase)
 * isInstagramUsername('ab'); // false (too short)
 * ```
 */
export function isInstagramUsername(displayName: string): boolean {
  if (!displayName) return false;

  // Instagram username pattern:
  // - All lowercase
  // - No spaces
  // - May contain dots, underscores
  // - 3-30 characters
  const instagramPattern = /^[a-z0-9_.]{3,30}$/;

  return instagramPattern.test(displayName);
}
