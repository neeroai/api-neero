/**
 * Name Cleaning Utilities
 *
 * Provides functions for cleaning and normalizing contact display names.
 * Extracted from /scripts/update-contacts-from-csv.ts for reusability.
 *
 * Key features:
 * - Emoji removal (comprehensive Unicode ranges)
 * - Proper capitalization (First Letter Uppercase)
 * - Name parsing (firstName/lastName split)
 * - Whitespace normalization
 */

/**
 * Remove all emojis from string (comprehensive Unicode ranges)
 *
 * Removes emojis across multiple Unicode blocks:
 * - Emoticons (1F600-1F64F)
 * - Misc Symbols and Pictographs (1F300-1F5FF)
 * - Transport and Map (1F680-1F6FF)
 * - Flags (1F1E0-1F1FF)
 * - Misc Symbols (2600-26FF)
 * - Dingbats (2700-27BF)
 * - Supplemental Symbols (1F900-1F9FF)
 * - Additional ranges (1F018-1F270, 1FAA0-1FAFF)
 *
 * @param text - Text containing emojis
 * @returns Text with emojis removed and trimmed
 *
 * @example
 * removeEmojis('Juan 😊') // Returns: 'Juan'
 * removeEmojis('🌻TheFloRG🌻') // Returns: 'TheFloRG'
 * removeEmojis('😊😊😊') // Returns: ''
 */
export function removeEmojis(text: string): string {
  return text
    .replace(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{1FAA0}-\u{1FAFF}]/gu,
      ''
    )
    .trim();
}

/**
 * Capitalize first letter of each word (proper case)
 *
 * Special handling:
 * - Single letters: Uppercase (e.g., "D.")
 * - Single letter + dot: Uppercase (e.g., "D.")
 * - Normal words: First letter uppercase, rest lowercase
 *
 * @param text - Text to capitalize
 * @returns Text with proper capitalization
 *
 * @example
 * capitalizeProper('MARIA GARCIA') // Returns: 'Maria Garcia'
 * capitalizeProper('jose luis') // Returns: 'Jose Luis'
 * capitalizeProper('D. Fernando') // Returns: 'D. Fernando'
 */
export function capitalizeProper(text: string): string {
  if (!text) return text;

  return text
    .split(/\s+/)
    .map((word) => {
      if (word.length === 0) return word;

      // Preserve special patterns like "D." or single letters
      if (word.length === 1 || (word.length === 2 && word.endsWith('.'))) {
        return word.toUpperCase();
      }

      // Normal capitalization
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Parse display name into firstName and lastName
 *
 * Algorithm:
 * 1. Remove emojis
 * 2. Trim and split by whitespace
 * 3. First word → firstName
 * 4. Remaining words → lastName
 * 5. Apply proper capitalization to each part
 *
 * Edge cases:
 * - Empty string → firstName: 'Unknown', lastName: ''
 * - Single character → firstName: char, lastName: ''
 * - Single word → firstName: word, lastName: ''
 * - Multiple words → firstName: first, lastName: rest
 *
 * @param displayName - Full display name (may contain emojis)
 * @returns Object with firstName and lastName (both properly capitalized)
 *
 * @example
 * parseFullName('Juan Perez') // Returns: { firstName: 'Juan', lastName: 'Perez' }
 * parseFullName('MARIA GARCIA') // Returns: { firstName: 'Maria', lastName: 'Garcia' }
 * parseFullName('José') // Returns: { firstName: 'José', lastName: '' }
 * parseFullName('😊😊😊') // Returns: { firstName: 'Unknown', lastName: '' }
 */
export function parseFullName(displayName: string): {
  firstName: string;
  lastName: string;
} {
  const cleanName = removeEmojis(displayName).trim();

  // Handle empty or single-character names
  if (!cleanName || cleanName.length === 1) {
    return { firstName: cleanName || 'Unknown', lastName: '' };
  }

  // Split by whitespace
  const parts = cleanName.split(/\s+/).filter((p) => p.length > 0);

  if (parts.length === 0) {
    return { firstName: 'Unknown', lastName: '' };
  }

  if (parts.length === 1) {
    return {
      firstName: capitalizeProper(parts[0]),
      lastName: '',
    };
  }

  // Multiple parts: first = firstName, rest = lastName
  const firstName = capitalizeProper(parts[0]);
  const lastName = parts.slice(1).map(capitalizeProper).join(' ');

  return { firstName, lastName };
}

/**
 * Clean display name: remove emojis, proper caps, normalize whitespace
 *
 * Complete cleaning pipeline:
 * 1. Remove emojis
 * 2. Normalize whitespace (multiple spaces → single space)
 * 3. Apply proper capitalization
 * 4. Trim result
 *
 * @param displayName - Display name to clean
 * @returns Cleaned display name
 *
 * @example
 * cleanDisplayName('Juan 😊') // Returns: 'Juan'
 * cleanDisplayName('MARIA   GARCIA') // Returns: 'Maria Garcia'
 * cleanDisplayName('jose   luis') // Returns: 'Jose Luis'
 * cleanDisplayName('😊😊😊') // Returns: 'Unknown'
 */
export function cleanDisplayName(displayName: string): string {
  // 1. Remove emojis
  let cleaned = removeEmojis(displayName);

  // 2. Normalize whitespace (multiple spaces → single space)
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // 3. Apply proper capitalization
  cleaned = capitalizeProper(cleaned);

  // 4. Handle empty result (only emojis/whitespace)
  if (!cleaned || !/[a-zA-Z0-9]/.test(cleaned)) {
    return 'Unknown';
  }

  return cleaned;
}
