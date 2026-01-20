/**
 * @file Display Name Cleaning Utilities
 * @description Utilities for cleaning and normalizing display names from Bird CRM
 * @module lib/normalization/utils/cleaning
 * @exports cleanDisplayName, removeEmojis, EMOJI_PATTERN
 */

/**
 * Comprehensive emoji and special character regex
 * Covers Unicode ranges for all common emojis and symbols
 */
export const EMOJI_PATTERN =
  /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F191}-\u{1F251}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F171}\u{1F17E}-\u{1F17F}\u{1F18E}\u{3030}\u{2B50}\u{2B55}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{3297}\u{3299}\u{303D}\u{00A9}\u{00AE}\u{2122}\u{23F3}\u{24C2}\u{23E9}-\u{23EF}\u{25B6}\u{23F8}-\u{23FA}\u{200D}\u{2640}-\u{2642}\u{2695}\u{2696}\u{2708}\u{2709}\u{270A}-\u{270D}\u{270F}\u{2712}\u{2714}\u{2716}\u{271D}\u{2721}\u{2728}\u{2733}-\u{2734}\u{2744}\u{2747}\u{274C}\u{274E}\u{2753}-\u{2755}\u{2757}\u{2763}-\u{2764}\u{2795}-\u{2797}\u{27A1}\u{27B0}\u{27BF}👑🔥💎✨🌟⭐️💫🎉🎊🎁]/gu;

/**
 * Remove emojis and special characters from text
 *
 * @param text - Text with potential emojis
 * @returns Text with emojis removed
 *
 * @example
 * ```ts
 * const cleaned = removeEmojis('Melissa Martinez 💕');
 * // Result: 'Melissa Martinez '
 * ```
 */
export function removeEmojis(text: string): string {
  if (!text) return '';
  return text.replace(EMOJI_PATTERN, '');
}

/**
 * Clean display name by removing emojis and normalizing whitespace
 *
 * @param displayName - Raw display name from Bird CRM
 * @returns Cleaned display name
 *
 * @example
 * ```ts
 * const cleaned = cleanDisplayName('Melissa Martinez 💕');
 * // Result: 'Melissa Martinez'
 *
 * const cleaned2 = cleanDisplayName('Ana  ✨🌟  García');
 * // Result: 'Ana García'
 * ```
 */
export function cleanDisplayName(displayName: string): string {
  if (!displayName) return '';

  // Remove emojis
  let cleaned = removeEmojis(displayName);

  // Normalize multiple spaces to single space
  cleaned = cleaned.replace(/\s+/g, ' ');

  // Trim whitespace
  cleaned = cleaned.trim();

  return cleaned;
}
