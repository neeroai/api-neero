/**
 * WhatsApp Conversation Data Extraction Utilities
 * Parse patient data from conversation messages
 */

/**
 * Conversation message structure
 */
export interface ConversationMessage {
  id: string;
  at: string;
  role: 'bot' | 'patient' | 'user';
  sender: string;
  text: string;
}

/**
 * Extracted patient data
 */
export interface PatientData {
  name?: string;
  email?: string;
  phone?: string; // Local phone from structured message (not contactPhone)
  country?: string;
  city?: string;
  procedureInterest?: string;
}

/**
 * Email regex (RFC 5322 simplified)
 */
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;

/**
 * Country keywords (LATAM focus)
 */
const COUNTRY_KEYWORDS = [
  'Colombia',
  'United States',
  'Estados Unidos',
  'Panama',
  'Panamá',
  'Venezuela',
  'Ecuador',
  'Perú',
  'Peru',
  'México',
  'Mexico',
  'Costa Rica',
  'Honduras',
  'Chile',
  'Argentina',
  'Uruguay',
  'Paraguay',
  'Bolivia',
  'Nicaragua',
  'Guatemala',
  'El Salvador',
  'República Dominicana',
  'Cuba',
  'Puerto Rico',
];

/**
 * City keywords (Colombian cities primary)
 */
const CITY_KEYWORDS = [
  'Bogotá',
  'Bogota',
  'Medellín',
  'Medellin',
  'Cali',
  'Barranquilla',
  'Cartagena',
  'Bucaramanga',
  'Cúcuta',
  'Cucuta',
  'Pereira',
  'Manizales',
  'Santa Marta',
  'Ibagué',
  'Ibague',
  'Pasto',
  'Villavicencio',
  'Montería',
  'Monteria',
  'Valledupar',
  'Sincelejo',
  'Armenia',
  'Popayán',
  'Popayan',
  'Tunja',
  'Neiva',
  'Riohacha',
  'Quibdó',
  'Quibdo',
];

/**
 * Procedure keywords → standardized names
 */
const PROCEDURE_KEYWORDS: Record<string, string> = {
  enzimas: 'Enzimas PB Serum',
  'pb serum': 'Enzimas PB Serum',
  toxina: 'Toxina Botulínica',
  botulínica: 'Toxina Botulínica',
  botulinica: 'Toxina Botulínica',
  botox: 'Toxina Botulínica',
  'deep slim': 'Deep Slim',
  rinoplastia: 'Rinoplastia',
  liposucción: 'Liposucción',
  liposuccion: 'Liposucción',
  lipo: 'Liposucción',
  lifting: 'Lifting Facial',
  mamoplastia: 'Mamoplastia',
  'aumento de senos': 'Mamoplastia',
  'aumento senos': 'Mamoplastia',
  abdominoplastia: 'Abdominoplastia',
  'cirugía abdominal': 'Abdominoplastia',
  rinoplastía: 'Rinoplastia',
  'cirugía de nariz': 'Rinoplastia',
  blefaroplastia: 'Blefaroplastia',
  'cirugía de párpados': 'Blefaroplastia',
  otoplastia: 'Otoplastia',
  'cirugía de orejas': 'Otoplastia',
  bichectomía: 'Bichectomía',
  bichectomia: 'Bichectomía',
  mentoplastia: 'Mentoplastia',
  'aumento de mentón': 'Mentoplastia',
  'aumento menton': 'Mentoplastia',
  indiba: 'Indiba',
  m22: 'M22',
  'fixer dv9': 'Fixer DV9',
  hifu: 'HIFU',
  'radiofrecuencia facial': 'Radiofrecuencia',
  radiofrecuencia: 'Radiofrecuencia',
  ultrasonido: 'Ultrasonido Facial',
  mesoterapia: 'Mesoterapia',
  carboxiterapia: 'Carboxiterapia',
  'peeling químico': 'Peeling Químico',
  peeling: 'Peeling Químico',
  microdermoabrasión: 'Microdermoabrasión',
  microdermoabrasion: 'Microdermoabrasión',
  dermapen: 'Dermapen',
  microneedling: 'Microneedling',
  'plasma rico en plaquetas': 'PRP',
  prp: 'PRP',
  'factores de crecimiento': 'Factores de Crecimiento',
};

/**
 * Extract structured patient data (multiline pattern: Name\nPhone\nEmail\nCountry)
 *
 * @param messages - Array of conversation messages
 * @returns PatientData if structured format found, undefined otherwise
 *
 * @example
 * // Looks for pattern like:
 * // Sindy Fernandez
 * // 302 3643745
 * // sindyfe1985@hotmail.com
 * // Colombia
 */
export function extractStructuredData(messages: ConversationMessage[]): PatientData | undefined {
  const patientMessages = messages.filter((m) => m.role === 'patient' && m.text);

  for (const msg of patientMessages) {
    const lines = msg.text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l);

    // Pattern: At least 3 lines with email present
    if (lines.length >= 3) {
      const hasEmail = lines.some((l) => EMAIL_REGEX.test(l));

      if (hasEmail) {
        const data: PatientData = {};

        // First line is likely name (if not a phone/email)
        if (lines[0] && !EMAIL_REGEX.test(lines[0]) && !/^\+?\d+/.test(lines[0])) {
          data.name = lines[0];
        }

        // Extract email
        const emailLine = lines.find((l) => EMAIL_REGEX.test(l));
        if (emailLine) {
          const match = emailLine.match(EMAIL_REGEX);
          if (match) data.email = match[0];
        }

        // Extract country
        const countryLine = lines.find((l) =>
          COUNTRY_KEYWORDS.some((kw) => l.toLowerCase().includes(kw.toLowerCase()))
        );
        if (countryLine) {
          const country = COUNTRY_KEYWORDS.find((kw) =>
            countryLine.toLowerCase().includes(kw.toLowerCase())
          );
          if (country) data.country = country;
        }

        // Extract local phone (line with digits but no @)
        const phoneLine = lines.find((l) => /^\+?\d[\d\s\-()]+$/.test(l) && !EMAIL_REGEX.test(l));
        if (phoneLine) {
          data.phone = phoneLine.replace(/\s+/g, '');
        }

        if (Object.keys(data).length > 0) return data;
      }
    }
  }

  return undefined;
}

/**
 * Extract name from sender field (fallback method)
 *
 * @param messages - Array of conversation messages
 * @returns Name from most recent patient message sender, or undefined
 *
 * @example
 * // sender: "Sindy Fernandez" → "Sindy Fernandez"
 * // sender: "+573001234567" → undefined (phone number, not a name)
 */
export function extractNameFromSender(messages: ConversationMessage[]): string | undefined {
  const patientMessages = messages.filter(
    (m) => m.role === 'patient' && m.sender && m.sender.length > 1 && !m.sender.match(/^\+?\d+$/) // Not a phone number
  );

  if (patientMessages.length > 0) {
    // Use most recent patient sender name
    const lastMessage = patientMessages[patientMessages.length - 1];
    return lastMessage?.sender;
  }

  return undefined;
}

/**
 * Extract email from any patient message
 *
 * @param messages - Array of conversation messages
 * @returns First email address found, or undefined
 */
export function extractEmail(messages: ConversationMessage[]): string | undefined {
  for (const msg of messages) {
    if (msg.role === 'patient' && msg.text) {
      const match = msg.text.match(EMAIL_REGEX);
      if (match) return match[0];
    }
  }
  return undefined;
}

/**
 * Extract country from any message
 *
 * @param messages - Array of conversation messages
 * @returns First matched country keyword, or undefined
 */
export function extractCountry(messages: ConversationMessage[]): string | undefined {
  for (const msg of messages) {
    if (msg.role === 'patient' && msg.text) {
      const country = COUNTRY_KEYWORDS.find((kw) =>
        msg.text.toLowerCase().includes(kw.toLowerCase())
      );
      if (country) return country;
    }
  }
  return undefined;
}

/**
 * Extract city from any message
 *
 * @param messages - Array of conversation messages
 * @returns First matched city keyword, or undefined
 */
export function extractCity(messages: ConversationMessage[]): string | undefined {
  for (const msg of messages) {
    if (msg.text) {
      const city = CITY_KEYWORDS.find((kw) => msg.text.toLowerCase().includes(kw.toLowerCase()));
      if (city) return city;
    }
  }
  return undefined;
}

/**
 * Extract procedure interests from all messages
 *
 * @param messages - Array of conversation messages
 * @returns Comma-separated list of procedures, or undefined if none found
 *
 * @example
 * // "enzimas" → "Enzimas PB Serum"
 * // "botox y lifting" → "Toxina Botulínica, Lifting Facial"
 */
export function extractProcedure(messages: ConversationMessage[]): string | undefined {
  const procedures = new Set<string>();

  for (const msg of messages) {
    if (msg.text) {
      const lowerText = msg.text.toLowerCase();

      for (const [keyword, procedure] of Object.entries(PROCEDURE_KEYWORDS)) {
        if (lowerText.includes(keyword.toLowerCase())) {
          procedures.add(procedure);
        }
      }
    }
  }

  // Return comma-separated list if multiple found
  if (procedures.size > 0) {
    return Array.from(procedures).join(', ');
  }

  return undefined;
}

/**
 * Master extraction function - Combine all extraction methods
 *
 * @param messages - Array of conversation messages
 * @returns PatientData with all extractable fields
 *
 * @example
 * const data = extractAllPatientData(conversation.messages);
 * // {
 * //   name: "Sindy Fernandez",
 * //   email: "sindyfe1985@hotmail.com",
 * //   country: "Colombia",
 * //   procedureInterest: "Enzimas PB Serum"
 * // }
 */
export function extractAllPatientData(messages: ConversationMessage[]): PatientData {
  // Try structured extraction first (most reliable)
  const structured = extractStructuredData(messages);

  if (structured) {
    // Enhance structured data with additional fields
    return {
      ...structured,
      city: structured.city || extractCity(messages),
      procedureInterest: extractProcedure(messages),
    };
  }

  // Fallback to individual extraction
  return {
    name: extractNameFromSender(messages),
    email: extractEmail(messages),
    country: extractCountry(messages),
    city: extractCity(messages),
    procedureInterest: extractProcedure(messages),
  };
}

/**
 * Parse full name into firstName and lastName
 *
 * @param fullName - Full name string (e.g., "Jasmine Diaz", "Maria Elena Rodriguez")
 * @returns Object with firstName and lastName properties
 *
 * @example
 * parseFullName("Jasmine Diaz")
 * // { firstName: "Jasmine", lastName: "Diaz" }
 *
 * parseFullName("Maria Elena Rodriguez")
 * // { firstName: "Maria", lastName: "Elena Rodriguez" }
 *
 * parseFullName("Carlos")
 * // { firstName: "Carlos", lastName: undefined }
 */
export function parseFullName(fullName: string): { firstName?: string; lastName?: string } {
  const parts = fullName.trim().split(/\s+/);

  if (parts.length === 0) return {};
  if (parts.length === 1) return { firstName: parts[0] };

  // First word = firstName, rest = lastName
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}
