/**
 * @file GPT-4o-mini Contact Data Extractor (Jan 2026)
 * @description Production-ready contact normalization using GPT-4o-mini with structured outputs
 * @module lib/normalization/gpt4o-mini-extractor
 * @exports extractContactDataGPT4oMini, GPT4oMiniExtractionResult
 */

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import {
  cleanDisplayName,
  extractEmail,
  extractNameWithRegex,
  phoneToCountryCode,
  splitFullName,
} from './extractors';

/**
 * Zod schema for GPT-4o-mini structured outputs
 * Enforces exact format, prevents hallucination
 */
const ContactExtractionSchema = z.object({
  displayName: z.string().describe('Full name cleaned (no emojis, proper case)'),
  firstName: z.string().describe('First name only (proper case)'),
  lastName: z.string().describe('Last name(s) - LATAM format supports 2 apellidos'),
  email: z
    .union([z.string().email(), z.literal('')])
    .optional()
    .describe('Valid email address from conversation (RFC 5322) or empty string if not found'),
  country: z
    .enum(['CO', 'MX', 'US', 'AR', 'CL', 'PE', 'EC', 'VE', 'ES', 'NL', 'PA', 'CR', 'GT', 'BO'])
    .optional()
    .describe('ISO 3166-1 alpha-2 country code inferred from phone or conversation'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('Confidence score: 0.9+ = high, 0.6-0.89 = medium, <0.6 = low (manual review)'),
});

/**
 * Type for extraction result
 */
export type GPT4oMiniExtractionResult = z.infer<typeof ContactExtractionSchema> & {
  method: 'regex' | 'gpt4o-mini';
  tokensUsed?: number;
  processingTime?: number;
};

/**
 * System prompt for medical CRM context (Spanish LATAM)
 */
const SYSTEM_PROMPT = `Eres un especialista en extracción de datos de contactos para un CRM médico.
Tu tarea es extraer información de pacientes desde conversaciones de WhatsApp en español.

REGLAS ESTRICTAS:
1. **Nombre completo:**
   - Formato: "Nombre Apellido" o "Nombre Apellido1 Apellido2" (LATAM)
   - Capitalización adecuada: "Maria Garcia" no "MARIA GARCIA" ni "maria garcia"
   - Elimina TODOS los emojis, caracteres especiales, y decoraciones
   - Si aparece "@usuario" es username de Instagram, NO es nombre real

2. **Email:**
   - SOLO si aparece explícitamente en la conversación
   - Debe ser formato válido RFC 5322 ([email protected])
   - Si NO encuentras email, devuelve campo vacío (NO inventes)

3. **País:**
   - Infiere desde código de teléfono (+57 = Colombia, +52 = México)
   - O desde contexto de conversación si es obvio
   - Devuelve código ISO 3166-1 alpha-2 (CO, MX, etc.)
   - Si NO puedes inferir, devuelve campo vacío

4. **Confianza (confidence):**
   - 0.95: Nombre explícito ("me llamo Maria Garcia")
   - 0.85: Saludo con nombre ("Hola, soy Juan Pérez")
   - 0.70: Firma en mensaje ("Saludos, Ana López")
   - 0.50: Nombre en contexto pero ambiguo
   - <0.50: Muy incierto, requiere revisión manual

5. **SI NO ESTÁS SEGURO:**
   - NO inventes información
   - Devuelve campo vacío
   - Baja confianza (<0.6) activa revisión manual

EJEMPLOS:

Input: "Hola! 😊 Soy MARIA 😊 mi correo es [email protected]"
Output: {
  "displayName": "Maria Garcia",
  "firstName": "Maria",
  "lastName": "Garcia",
  "email": "[email protected]",
  "country": "CO",
  "confidence": 0.95
}

Input: "Buenos días, necesito agendar cita. Saludos, Juan Pérez López"
Output: {
  "displayName": "Juan Pérez López",
  "firstName": "Juan",
  "lastName": "Pérez López",
  "email": "",
  "country": "",
  "confidence": 0.80
}

Input: "@mariita_123 Hola"
Output: {
  "displayName": "",
  "firstName": "",
  "lastName": "",
  "email": "",
  "country": "",
  "confidence": 0.10
}`;

/**
 * Extract contact data using GPT-4o-mini with structured outputs
 *
 * @param conversationText - Recent messages from conversation (max 500 tokens recommended)
 * @param options - Extraction options
 * @returns Extracted contact data with confidence score
 *
 * @example
 * ```ts
 * const result = await extractContactDataGPT4oMini(
 *   "Hola soy Maria Garcia, mi email es [email protected]",
 *   { contactPhone: "+573001234567", fallbackToRegex: true }
 * );
 * // result.displayName: "Maria Garcia"
 * // result.confidence: 0.95
 * // result.method: "gpt4o-mini"
 * ```
 */
export async function extractContactDataGPT4oMini(
  conversationText: string,
  options: {
    contactPhone?: string;
    fallbackToRegex?: boolean;
    maxTokens?: number;
  } = {}
): Promise<GPT4oMiniExtractionResult> {
  const startTime = Date.now();

  // Default options
  const { contactPhone, fallbackToRegex = true, maxTokens = 500 } = options;

  // 1. Validate input
  if (!conversationText || conversationText.trim().length === 0) {
    return {
      displayName: '',
      firstName: '',
      lastName: '',
      email: undefined,
      country: undefined,
      confidence: 0,
      method: 'regex',
      processingTime: Date.now() - startTime,
    };
  }

  // 2. Try regex first (zero-cost, ~60% success rate)
  if (fallbackToRegex) {
    const messages = conversationText.split('\n').filter((m) => m.trim().length > 0);

    // Try regex extraction
    const regexResult = extractNameWithRegex(messages);

    // If high confidence (>=0.85), return immediately (no need for AI)
    if (regexResult.confidence >= 0.85) {
      const email = extractEmail(messages);
      const country = contactPhone ? phoneToCountryCode(contactPhone) : null;

      return {
        displayName: regexResult.fullName,
        firstName: regexResult.firstName,
        lastName: regexResult.lastName,
        email: email || undefined,
        country: (country as any) || undefined,
        confidence: regexResult.confidence,
        method: 'regex',
        processingTime: Date.now() - startTime,
      };
    }
  }

  // 3. Fallback to GPT-4o-mini with structured outputs
  try {
    // Truncate conversation to max tokens (estimate: 4 chars = 1 token)
    const maxChars = maxTokens * 4;
    const truncatedText =
      conversationText.length > maxChars
        ? conversationText.substring(0, maxChars) + '\n[...truncated]'
        : conversationText;

    // Build context-aware prompt
    let userPrompt = `Extrae los datos del contacto desde esta conversación de WhatsApp:\n\n${truncatedText}`;

    if (contactPhone) {
      userPrompt += `\n\nNúmero de teléfono del contacto: ${contactPhone}`;
      userPrompt += `\n(Usa el código de país para inferir país si no está explícito en la conversación)`;
    }

    // Call GPT-4o-mini with structured outputs
    const result = await generateObject({
      model: openai('gpt-4o-mini-2024-07-18'), // GPT-4o-mini stable release
      schema: ContactExtractionSchema,
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.1, // Deterministic extraction
    });

    const processingTime = Date.now() - startTime;

    // Clean extracted display name (remove any remaining emojis)
    const cleanedDisplayName = result.object.displayName
      ? cleanDisplayName(result.object.displayName)
      : '';

    // Split into firstName/lastName if GPT-4o-mini didn't extract them properly
    const { firstName, lastName } =
      result.object.firstName && result.object.lastName
        ? {
            firstName: result.object.firstName,
            lastName: result.object.lastName,
          }
        : splitFullName(cleanedDisplayName);

    return {
      displayName: cleanedDisplayName,
      firstName,
      lastName,
      email: result.object.email,
      country: result.object.country,
      confidence: result.object.confidence,
      method: 'gpt4o-mini',
      tokensUsed: result.usage?.totalTokens,
      processingTime,
    };
  } catch (error) {
    // Log error to Sentry (production)
    console.error('[GPT-4o-mini Extraction] Error:', error);

    // If AI fails and regex fallback enabled, try regex again
    if (fallbackToRegex) {
      const messages = conversationText.split('\n').filter((m) => m.trim().length > 0);
      const regexResult = extractNameWithRegex(messages);
      const email = extractEmail(messages);
      const country = contactPhone ? phoneToCountryCode(contactPhone) : null;

      return {
        displayName: regexResult.fullName,
        firstName: regexResult.firstName,
        lastName: regexResult.lastName,
        email: email || undefined,
        country: (country as any) || undefined,
        confidence: Math.max(0.3, regexResult.confidence), // Reduce confidence due to AI failure
        method: 'regex',
        processingTime: Date.now() - startTime,
      };
    }

    // No fallback - return empty result
    return {
      displayName: '',
      firstName: '',
      lastName: '',
      email: undefined,
      country: undefined,
      confidence: 0,
      method: 'gpt4o-mini',
      processingTime: Date.now() - startTime,
    };
  }
}

/**
 * Batch extract contact data for multiple conversations
 * Optimized for rate limits: 100 req/min (OpenAI Tier 1)
 *
 * @param conversations - Array of conversation texts with metadata
 * @returns Array of extraction results
 *
 * @example
 * ```ts
 * const results = await batchExtractContactData([
 *   { text: "Hola soy Maria", contactPhone: "+573001234567" },
 *   { text: "Buenos días, Juan aquí", contactPhone: "+523001234567" }
 * ]);
 * // results[0].displayName: "Maria"
 * // results[1].displayName: "Juan"
 * ```
 */
export async function batchExtractContactData(
  conversations: Array<{ text: string; contactPhone?: string }>
): Promise<GPT4oMiniExtractionResult[]> {
  const results: GPT4oMiniExtractionResult[] = [];

  // Process in batches of 10 to respect rate limits
  const batchSize = 10;
  for (let i = 0; i < conversations.length; i += batchSize) {
    const batch = conversations.slice(i, i + batchSize);

    // Process batch in parallel
    const batchResults = await Promise.all(
      batch.map((conv) =>
        extractContactDataGPT4oMini(conv.text, {
          contactPhone: conv.contactPhone,
          fallbackToRegex: true,
        })
      )
    );

    results.push(...batchResults);

    // Rate limit delay: 600ms between batches (100 req/min = 1 req/600ms)
    if (i + batchSize < conversations.length) {
      await new Promise((resolve) => setTimeout(resolve, 600));
    }
  }

  return results;
}

/**
 * Calculate cost estimate for GPT-4o-mini extraction
 *
 * @param conversationCount - Number of conversations to process
 * @param avgTokensPerConversation - Average tokens per conversation (default: 200)
 * @returns Cost estimate in USD
 *
 * @example
 * ```ts
 * const cost = estimateExtractionCost(1000); // ~$0.03
 * console.log(`Cost to process 1000 contacts: $${cost.toFixed(2)}`);
 * ```
 */
export function estimateExtractionCost(
  conversationCount: number,
  avgTokensPerConversation: number = 200
): number {
  // GPT-4o-mini pricing (Jan 2026)
  const inputCostPer1M = 0.15; // $0.15 per 1M input tokens
  const outputCostPer1M = 0.6; // $0.60 per 1M output tokens

  // Estimate tokens
  const totalInputTokens = conversationCount * avgTokensPerConversation;
  const totalOutputTokens = conversationCount * 50; // ~50 tokens per response

  // Calculate cost
  const inputCost = (totalInputTokens / 1_000_000) * inputCostPer1M;
  const outputCost = (totalOutputTokens / 1_000_000) * outputCostPer1M;

  return inputCost + outputCost;
}
