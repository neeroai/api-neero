/**
 * @file Name Splitting Utilities
 * @description Split full names into firstName/lastName with LATAM 2-apellido support
 * @module lib/normalization/utils/splitting
 * @exports splitFullName
 */

/**
 * Split full name into firstName and lastName with LATAM naming support
 * Handles 2-apellido convention common in Latin America
 *
 * @param fullName - Full name to split
 * @returns Object with firstName and lastName
 *
 * @example
 * ```ts
 * // 2 words: firstName + lastName
 * splitFullName('Juan Pérez');
 * // { firstName: 'Juan', lastName: 'Pérez' }
 *
 * // 3 words: firstName + 2 apellidos
 * splitFullName('María García López');
 * // { firstName: 'María', lastName: 'García López' }
 *
 * // 4+ words: Compound firstName + 2 apellidos
 * splitFullName('Ana Sofía Rodríguez Martínez');
 * // { firstName: 'Ana Sofía', lastName: 'Rodríguez Martínez' }
 *
 * // 1 word: firstName only
 * splitFullName('Juan');
 * // { firstName: 'Juan', lastName: '' }
 * ```
 */
export function splitFullName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  if (!fullName) {
    return { firstName: '', lastName: '' };
  }

  // Normalize whitespace
  const normalized = fullName.trim().replace(/\s+/g, ' ');

  // Split by spaces
  const parts = normalized.split(' ');

  if (parts.length === 1) {
    // Single word: treat as firstName only
    return {
      firstName: parts[0],
      lastName: '',
    };
  } else if (parts.length === 2) {
    // Two words: first = firstName, second = lastName
    return {
      firstName: parts[0],
      lastName: parts[1],
    };
  } else if (parts.length === 3) {
    // Three words: first = firstName, second+third = lastName (2 apellidos)
    return {
      firstName: parts[0],
      lastName: `${parts[1]} ${parts[2]}`,
    };
  } else {
    // Four or more words: first+second = compound firstName, rest = lastName
    // Example: "Ana Sofía Rodríguez Martínez" → "Ana Sofía" + "Rodríguez Martínez"
    return {
      firstName: `${parts[0]} ${parts[1]}`,
      lastName: parts.slice(2).join(' '),
    };
  }
}
