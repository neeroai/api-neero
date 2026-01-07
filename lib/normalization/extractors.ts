/**
 * Data Extraction Module for Bird CRM Contact Normalization
 *
 * Provides hybrid extraction strategies (Regex → AI fallback) for:
 * - Full names (firstName/lastName with LATAM 2-apellido support)
 * - Email addresses from conversation text
 * - Country inference from phone codes
 * - Display name cleaning (emojis, usernames)
 */

/**
 * Result interface for name extraction
 */
export interface NameExtractionResult {
  fullName: string;
  firstName: string;
  lastName: string;
  confidence: number; // 0-1 score
  method: 'regex' | 'ai' | 'unknown';
}

/**
 * Spanish name patterns (LATAM-optimized)
 * Patterns like "me llamo X", "soy X", "mi nombre es X"
 */
const SPANISH_NAME_PATTERNS = [
  // Explicit introductions
  /(?:me llamo|mi nombre es|soy)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,3})/i,
  /(?:puede llamarme|llamarme|decirme)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,3})/i,
  // Form-like patterns
  /(?:nombre:?|paciente:?|cliente:?)\s*([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,3})/i,
  // Greetings with name
  /^(?:hola|buenos días|buenas tardes|buenas),?\s+(?:soy|es)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,3})/im,
  // Message signatures
  /(?:saludos|atentamente|cordialmente|gracias),?\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,3})$/im,
];

/**
 * Email regex pattern (RFC 5322 simplified)
 */
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

/**
 * Phone code to country mapping (LATAM + common countries)
 */
const PHONE_CODE_TO_COUNTRY: Record<string, string> = {
  '+57': 'Colombia',
  '+52': 'México',
  '+54': 'Argentina',
  '+56': 'Chile',
  '+51': 'Perú',
  '+58': 'Venezuela',
  '+593': 'Ecuador',
  '+591': 'Bolivia',
  '+595': 'Paraguay',
  '+598': 'Uruguay',
  '+507': 'Panamá',
  '+506': 'Costa Rica',
  '+503': 'El Salvador',
  '+502': 'Guatemala',
  '+504': 'Honduras',
  '+505': 'Nicaragua',
  '+1': 'Estados Unidos',
  '+34': 'España',
};

/**
 * Emoji and special character regex for cleaning
 */
const EMOJI_PATTERN =
  /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F191}-\u{1F251}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F171}\u{1F17E}-\u{1F17F}\u{1F18E}\u{3030}\u{2B50}\u{2B55}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{3297}\u{3299}\u{303D}\u{00A9}\u{00AE}\u{2122}\u{23F3}\u{24C2}\u{23E9}-\u{23EF}\u{25B6}\u{23F8}-\u{23FA}\u{200D}\u{2640}-\u{2642}\u{2695}\u{2696}\u{2708}\u{2709}\u{270A}-\u{270D}\u{270F}\u{2712}\u{2714}\u{2716}\u{271D}\u{2721}\u{2728}\u{2733}-\u{2734}\u{2744}\u{2747}\u{274C}\u{274E}\u{2753}-\u{2755}\u{2757}\u{2763}-\u{2764}\u{2795}-\u{2797}\u{27A1}\u{27B0}\u{27BF}👑🔥💎✨🌟⭐️💫🎉🎊🎁]/gu;

/**
 * Extract full name from conversation messages using regex patterns
 *
 * @param messages - Array of conversation message texts
 * @returns Name extraction result with confidence score
 */
export function extractNameWithRegex(messages: string[]): NameExtractionResult {
  // Join recent messages (first 50 for efficiency)
  const recentMessages = messages.slice(0, 50).join(' ');

  // Try each Spanish name pattern
  for (const pattern of SPANISH_NAME_PATTERNS) {
    const match = recentMessages.match(pattern);
    if (match && match[1]) {
      const fullName = match[1].trim();

      // Split into firstName and lastName
      const { firstName, lastName } = splitFullName(fullName);

      // High confidence if explicit name declaration
      const confidence = pattern.source.includes('llamo|soy|nombre') ? 0.95 : 0.75;

      return {
        fullName,
        firstName,
        lastName,
        confidence,
        method: 'regex',
      };
    }
  }

  // No match found
  return {
    fullName: '',
    firstName: '',
    lastName: '',
    confidence: 0,
    method: 'unknown',
  };
}

/**
 * Extract name using heuristic approach (no AI APIs)
 * Looks for capitalized words in messages and greetings
 *
 * @param messages - Array of conversation message texts
 * @returns Name extraction result with confidence score
 */
export function extractNameHeuristic(messages: string[]): NameExtractionResult {
  if (messages.length === 0) {
    return { fullName: '', firstName: '', lastName: '', confidence: 0, method: 'unknown' };
  }

  // Patterns for greetings with names
  const greetingPatterns = [
    /^(?:hola|buenos días|buenas tardes|buenas noches),?\s+(?:soy|es)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,3})/i,
    /^(?:hola|hi|hey),?\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,3})\s+(?:aquí|acá)/i,
    /(?:saludos|atentamente|cordialmente),?\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,3})$/i,
  ];

  // Check first 20 messages for greeting patterns
  const recentMessages = messages.slice(0, 20);

  for (const message of recentMessages) {
    for (const pattern of greetingPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        const fullName = match[1].trim();
        const { firstName, lastName } = splitFullName(fullName);

        if (isValidName(firstName) && isValidName(lastName)) {
          return {
            fullName,
            firstName,
            lastName,
            confidence: 0.75,
            method: 'regex',
          };
        }
      }
    }

    // Look for capitalized words that look like names (2-3 consecutive capitalized words)
    const capitalizedPattern =
      /\b([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)\b/g;
    const matches = message.match(capitalizedPattern);

    if (matches) {
      for (const match of matches) {
        const parts = match.trim().split(/\s+/);
        if (parts.length >= 2 && parts.length <= 4) {
          const fullName = match.trim();
          const { firstName, lastName } = splitFullName(fullName);

          if (isValidName(firstName) && isValidName(lastName)) {
            return {
              fullName,
              firstName,
              lastName,
              confidence: 0.65,
              method: 'regex',
            };
          }
        }
      }
    }
  }

  return {
    fullName: '',
    firstName: '',
    lastName: '',
    confidence: 0,
    method: 'unknown',
  };
}

/**
 * Hybrid extraction: Regex → Heuristic → Gemini AI (production-ready)
 *
 * @param messages - Array of conversation message texts
 * @returns Promise with name extraction result
 */
export async function extractNameHybrid(messages: string[]): Promise<NameExtractionResult> {
  // 1. Try explicit patterns first (high confidence)
  const regexResult = extractNameWithRegex(messages);

  if (regexResult.confidence >= 0.85) {
    return regexResult;
  }

  // 2. Try heuristic extraction (greetings, capitalized words)
  const heuristicResult = extractNameHeuristic(messages);

  if (heuristicResult.confidence >= 0.85) {
    return heuristicResult;
  }

  // 3. Fallback to Gemini AI (paid tier, high accuracy)
  const { extractNameWithGemini } = await import('./gemini-ner');
  const geminiResult = await extractNameWithGemini(messages);

  // Return best result
  if (
    geminiResult.confidence > regexResult.confidence &&
    geminiResult.confidence > heuristicResult.confidence
  ) {
    return geminiResult;
  }

  return regexResult.confidence > heuristicResult.confidence ? regexResult : heuristicResult;
}

/**
 * Extract email address from conversation messages
 *
 * @param messages - Array of conversation message texts
 * @returns Email address or null if not found
 */
export function extractEmail(messages: string[]): string | null {
  // Join recent messages (first 50 for efficiency)
  const recentMessages = messages.slice(0, 50).join(' ');

  // Find all email matches
  const matches = recentMessages.match(EMAIL_PATTERN);

  if (matches && matches.length > 0) {
    // Return the first email found (most likely to be patient's email)
    return matches[0].toLowerCase();
  }

  return null;
}

/**
 * Infer country from phone number code (E.164 format)
 *
 * @param phoneNumber - Phone number in E.164 format (e.g., "+57300123456")
 * @returns Country name or null if not recognized
 */
export function inferCountryFromPhone(phoneNumber: string): string | null {
  if (!phoneNumber) return null;

  // Normalize phone number (remove spaces, dashes)
  const normalized = phoneNumber.replace(/[\s-]/g, '');

  // Try to match phone code (longest first for +593, +591, etc.)
  const sortedCodes = Object.keys(PHONE_CODE_TO_COUNTRY).sort((a, b) => b.length - a.length);

  for (const code of sortedCodes) {
    if (normalized.startsWith(code)) {
      return PHONE_CODE_TO_COUNTRY[code];
    }
  }

  return null;
}

/**
 * Clean display name by removing emojis and special characters
 *
 * @param displayName - Raw display name from Bird CRM
 * @returns Cleaned display name
 */
export function cleanDisplayName(displayName: string): string {
  if (!displayName) return '';

  // Remove emojis
  let cleaned = displayName.replace(EMOJI_PATTERN, '');

  // Remove multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ');

  // Trim whitespace
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Check if display name is likely an Instagram username
 *
 * @param displayName - Display name to check
 * @returns True if looks like Instagram username
 */
export function isInstagramUsername(displayName: string): boolean {
  if (!displayName) return false;

  // Instagram usernames:
  // - All lowercase
  // - No spaces
  // - May contain dots, underscores
  // - Usually 3-30 characters
  const instagramPattern = /^[a-z0-9_.]{3,30}$/;

  return instagramPattern.test(displayName);
}

/**
 * Check if display name contains only emojis
 *
 * @param displayName - Display name to check
 * @returns True if only emojis (no text)
 */
export function isOnlyEmojis(displayName: string): boolean {
  if (!displayName) return false;

  // Remove all emojis and check if anything remains
  const withoutEmojis = displayName.replace(EMOJI_PATTERN, '').trim();

  return withoutEmojis.length === 0;
}

/**
 * Split full name into firstName and lastName
 * Supports LATAM naming convention (2 apellidos)
 *
 * Examples:
 * - "Juan Pérez" → firstName: "Juan", lastName: "Pérez"
 * - "María García López" → firstName: "María", lastName: "García López"
 * - "Ana Sofía Rodríguez Martínez" → firstName: "Ana Sofía", lastName: "Rodríguez Martínez"
 *
 * Strategy:
 * - If 2 words: firstName = first, lastName = second
 * - If 3 words: firstName = first, lastName = second + third
 * - If 4 words: firstName = first + second, lastName = third + fourth
 * - If 1 word: firstName = word, lastName = empty
 *
 * @param fullName - Full name to split
 * @returns Object with firstName and lastName
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
    // Single word: treat as firstName
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
    // Three words: first = firstName, second+third = lastName
    return {
      firstName: parts[0],
      lastName: `${parts[1]} ${parts[2]}`,
    };
  } else {
    // Four or more words: first+second = firstName, rest = lastName
    return {
      firstName: `${parts[0]} ${parts[1]}`,
      lastName: parts.slice(2).join(' '),
    };
  }
}

/**
 * Validate if extracted name looks reasonable
 *
 * @param name - Name to validate
 * @returns True if name passes basic validation
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
