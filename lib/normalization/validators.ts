/**
 * @file Name Validation
 * @description Valida nombres extraídos antes de actualizar contactos en Bird CRM
 * @module lib/normalization/validators
 * @exports isConversationFragment, isGenericBotName, isValidPatientName
 */

/**
 * Detecta fragmentos de conversación que no son nombres reales
 *
 * @param text - Texto a validar
 * @returns True si es un fragmento de conversación
 *
 * @example
 * ```ts
 * isConversationFragment('para que pueda atender'); // true
 * isConversationFragment('María González'); // false
 * ```
 */
export function isConversationFragment(text: string): boolean {
  const conversationPatterns =
    /\b(para|pueda|atender|cuando|pero|que|claro|costo|precio|buenas|noches|dia|hoy|beneficio|consulta)\b/i;
  return conversationPatterns.test(text);
}

/**
 * Detecta nombres genéricos de bots o agentes
 *
 * @param text - Texto a validar
 * @returns True si es un nombre genérico de bot
 *
 * @example
 * ```ts
 * isGenericBotName('Eva'); // true
 * isGenericBotName('María'); // false
 * ```
 */
export function isGenericBotName(text: string): boolean {
  const botNames = /^(Eva|Karina|Bot|Assistant|System|Auto|Agent|Support)$/i;
  return botNames.test(text.trim());
}

/**
 * Valida si un nombre es válido para actualizar un contacto de paciente
 *
 * @param displayName - Nombre completo a validar
 * @param confidence - Nivel de confianza de la extracción (0-1)
 * @returns Objeto con resultado de validación y razón si falla
 *
 * @example
 * ```ts
 * isValidPatientName('María González', 0.85);
 * // { valid: true }
 *
 * isValidPatientName('Eva', 0.65);
 * // { valid: false, reason: 'Generic bot name detected' }
 *
 * isValidPatientName('para que pueda', 0.70);
 * // { valid: false, reason: 'Conversation fragment detected' }
 * ```
 */
export function isValidPatientName(
  displayName: string,
  confidence: number
): { valid: boolean; reason?: string } {
  // Regla 1: No fragmentos de conversación
  if (isConversationFragment(displayName)) {
    return { valid: false, reason: 'Conversation fragment detected' };
  }

  // Regla 2: No nombres genéricos de bots
  if (isGenericBotName(displayName)) {
    return { valid: false, reason: 'Generic bot name detected' };
  }

  // Regla 3: Longitud mínima (5 caracteres)
  if (displayName.trim().length < 5) {
    return { valid: false, reason: 'Name too short' };
  }

  // Regla 4: Debe tener al menos 2 palabras (nombre + apellido)
  const words = displayName.trim().split(/\s+/);
  if (words.length < 2) {
    return { valid: false, reason: 'Missing surname' };
  }

  // Regla 5: Confidence mínima aumentada a 0.75
  if (confidence < 0.75) {
    return { valid: false, reason: `Low confidence (${confidence})` };
  }

  // Regla 6: Solo letras y espacios (LATAM names)
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(displayName)) {
    return { valid: false, reason: 'Invalid characters' };
  }

  return { valid: true };
}
