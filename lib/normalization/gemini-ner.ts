/**
 * @file Gemini NER for Contact Normalization
 * @description AI-powered name extraction from conversation text using Gemini 2.0 Flash (fallback when regex fails)
 * @module lib/normalization/gemini-ner
 * @exports extractNameWithGemini
 */

import { generateText } from 'ai';
import { GeminiModelId, getGeminiModel } from '@/lib/ai/gateway';
import type { NameExtractionResult } from './extractors';

/**
 * Extract patient name from conversation messages using Gemini AI
 *
 * Strategy:
 * 1. Analyze first 20 messages for name mentions
 * 2. Look for patterns: "me llamo X", "soy X", "mi nombre es X"
 * 3. Return structured JSON with firstName, lastName, confidence
 * 4. Confidence score based on explicitness of mention
 *
 * @param messages - Array of conversation message texts
 * @returns Name extraction result with confidence score
 */
export async function extractNameWithGemini(messages: string[]): Promise<NameExtractionResult> {
  try {
    // Take first 20 messages (limit context for cost efficiency)
    const recentMessages = messages.slice(0, 20);

    if (recentMessages.length === 0) {
      return {
        fullName: '',
        firstName: '',
        lastName: '',
        confidence: 0,
        method: 'ai',
      };
    }

    // Build prompt
    const prompt = buildNERPrompt(recentMessages);

    // Call Gemini via AI Gateway (PAID tier for production)
    const result = await generateText({
      model: getGeminiModel(GeminiModelId.FLASH_2_0),
      prompt,
      maxRetries: 2,
      temperature: 0.1, // Low temperature for deterministic extraction
    });

    // Parse JSON response
    const parsed = parseGeminiResponse(result.text);

    return {
      ...parsed,
      method: 'ai',
    };
  } catch (error: any) {
    console.error('Gemini NER error:', error.message);

    // Return empty result on error
    return {
      fullName: '',
      firstName: '',
      lastName: '',
      confidence: 0,
      method: 'ai',
    };
  }
}

/**
 * Build NER prompt for Gemini
 *
 * Optimized for LATAM Spanish naming conventions:
 * - Supports 2 apellidos (García López, Rodríguez Martínez)
 * - Recognizes compound first names (Ana Sofía, María José)
 * - Handles informal name mentions
 *
 * @param messages - Conversation messages
 * @returns Prompt string
 */
function buildNERPrompt(messages: string[]): string {
  const conversationText = messages.join('\n');

  return `Analiza esta conversación de WhatsApp y extrae el nombre completo del paciente.

CONVERSACIÓN:
${conversationText}

INSTRUCCIONES:
1. Busca patrones explícitos como:
   - "me llamo [nombre]"
   - "soy [nombre]"
   - "mi nombre es [nombre]"
   - Saludos: "Hola, soy [nombre]"
   - Firma de mensajes: "Saludos, [nombre]"

2. IMPORTANTE - Nombres LATAM:
   - Pueden tener 2 apellidos (ej: "Juan Pérez García")
   - Pueden tener nombres compuestos (ej: "Ana Sofía", "María José")
   - Si encuentras 2 palabras → primer nombre + apellido
   - Si encuentras 3 palabras → primer nombre + dos apellidos
   - Si encuentras 4+ palabras → nombre compuesto + apellidos

3. Separa en:
   - firstName: nombre(s) de pila
   - lastName: apellido(s)

4. Asigna confidence score (0-1):
   - 1.0: Mención explícita ("me llamo Juan Pérez")
   - 0.9: Muy probable (saludo + nombre coherente)
   - 0.7-0.8: Probable (inferido de contexto)
   - 0.5-0.6: Posible (mención indirecta)
   - <0.5: Incierto

5. VALIDACIONES:
   - El nombre debe tener al menos 2 palabras (nombre + apellido)
   - No debe contener números
   - No debe ser "Hola", "Gracias", etc.
   - Debe empezar con mayúscula

FORMATO DE RESPUESTA (JSON ESTRICTO):
{
  "fullName": "Juan Pérez García",
  "firstName": "Juan",
  "lastName": "Pérez García",
  "confidence": 0.95
}

SOLO responde con el JSON, sin texto adicional.`;
}

/**
 * Parse Gemini JSON response
 *
 * Handles:
 * - Valid JSON responses
 * - Malformed JSON (tries to extract with regex)
 * - Missing fields
 *
 * @param responseText - Raw Gemini response
 * @returns Parsed name extraction result
 */
function parseGeminiResponse(responseText: string): Omit<NameExtractionResult, 'method'> {
  try {
    // Try to parse as JSON
    const cleaned = responseText.trim();

    // Remove markdown code blocks if present
    const jsonText = cleaned
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    const parsed = JSON.parse(jsonText);

    // Validate required fields
    if (!parsed.fullName || !parsed.firstName || !parsed.lastName) {
      throw new Error('Missing required fields in Gemini response');
    }

    // Validate confidence is between 0-1
    const confidence =
      typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0;

    return {
      fullName: String(parsed.fullName).trim(),
      firstName: String(parsed.firstName).trim(),
      lastName: String(parsed.lastName).trim(),
      confidence,
    };
  } catch (error) {
    console.error('Failed to parse Gemini response:', error);

    // Try to extract with regex as fallback
    const fullNameMatch = responseText.match(/"fullName":\s*"([^"]+)"/);
    const firstNameMatch = responseText.match(/"firstName":\s*"([^"]+)"/);
    const lastNameMatch = responseText.match(/"lastName":\s*"([^"]+)"/);
    const confidenceMatch = responseText.match(/"confidence":\s*([0-9.]+)/);

    if (fullNameMatch && fullNameMatch[1] && firstNameMatch && firstNameMatch[1] && lastNameMatch && lastNameMatch[1]) {
      return {
        fullName: fullNameMatch[1].trim(),
        firstName: firstNameMatch[1].trim(),
        lastName: lastNameMatch[1].trim(),
        confidence: confidenceMatch && confidenceMatch[1] ? parseFloat(confidenceMatch[1]) : 0.5,
      };
    }

    // Complete failure - return empty
    return {
      fullName: '',
      firstName: '',
      lastName: '',
      confidence: 0,
    };
  }
}
