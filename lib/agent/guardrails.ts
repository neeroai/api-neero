import type { GuardrailsValidation } from './types';

/**
 * Medical Advice Keywords (Spanish)
 * These indicate the AI may be providing medical diagnosis or prescription
 */
const MEDICAL_ADVICE_KEYWORDS = [
  // Diagnosis
  'diagnóstico',
  'diagnostico',
  'tienes',
  'padeces',
  'sufres de',
  'enfermedad',
  'condición médica',
  'condicion medica',
  'síntoma de',
  'sintoma de',

  // Prescription
  'prescripción',
  'prescripcion',
  'receta',
  'medicamento',
  'toma',
  'debes tomar',
  'te receto',
  'antibiótico',
  'antibiotico',
  'analgésico',
  'analgesico',

  // Medical recommendations
  'te recomiendo que',
  'deberías',
  'deberias',
  'es necesario que',
  'tienes que',
  'urgente',
  'emergencia médica',
  'emergencia medica',
  'acude al hospital',
  'llama una ambulancia',
];

/**
 * Pricing Commitment Keywords (Spanish)
 * These indicate the AI may be committing to specific prices
 */
const PRICING_KEYWORDS = [
  'cuesta $',
  'precio de $',
  'precio es $',
  'valor de $',
  'son $',
  'costo de $',
  'cuota de $',
  'total de $',
  'pago de $',
  'tarifa de $',
  'financiación',
  'financiacion',
  'plan de pagos',
  'cuotas de',
];

/**
 * Unsafe Recommendations (Spanish)
 * These indicate potentially dangerous advice
 */
const UNSAFE_RECOMMENDATIONS = [
  'no es necesario consultar',
  'no necesitas ir al médico',
  'no necesitas ir al medico',
  'puedes esperar',
  'no te preocupes',
  'es normal',
  'no pasa nada',
  'no es grave',
];

/**
 * Validate AI response against guardrails
 *
 * Checks for:
 * 1. Medical advice (diagnosis, prescription, unsafe recommendations)
 * 2. Pricing commitments (specific prices, payment plans)
 * 3. Other unsafe content
 *
 * @param response - AI generated response text
 * @returns Validation result with violations and severity
 */
export function validateResponse(response: string): GuardrailsValidation {
  const violations: string[] = [];
  const lowerResponse = response.toLowerCase();

  // 1. Check for medical advice
  for (const keyword of MEDICAL_ADVICE_KEYWORDS) {
    if (lowerResponse.includes(keyword.toLowerCase())) {
      violations.push(`Medical advice detected: "${keyword}"`);
    }
  }

  // 2. Check for pricing commitments
  for (const keyword of PRICING_KEYWORDS) {
    if (lowerResponse.includes(keyword.toLowerCase())) {
      violations.push(`Pricing commitment detected: "${keyword}"`);
    }
  }

  // 3. Check for unsafe recommendations
  for (const keyword of UNSAFE_RECOMMENDATIONS) {
    if (lowerResponse.includes(keyword.toLowerCase())) {
      violations.push(`Unsafe recommendation detected: "${keyword}"`);
    }
  }

  // Determine severity
  let severity: GuardrailsValidation['severity'] = 'none';
  if (violations.length > 0) {
    // Medical advice and unsafe recommendations are CRITICAL
    const hasMedicalViolation = violations.some(
      (v) =>
        v.includes('Medical advice') ||
        v.includes('Unsafe recommendation')
    );

    // Pricing commitments are HIGH (not critical but should escalate)
    const hasPricingViolation = violations.some((v) => v.includes('Pricing commitment'));

    if (hasMedicalViolation) {
      severity = 'critical';
    } else if (hasPricingViolation) {
      severity = 'high';
    } else {
      severity = 'medium';
    }
  }

  return {
    safe: violations.length === 0,
    violations,
    severity,
  };
}

/**
 * Audit conversation for compliance
 * Used for post-conversation review and analytics
 *
 * @param messages - Array of message texts from conversation
 * @returns Aggregated audit result
 */
export function auditConversation(messages: string[]): {
  totalMessages: number;
  violationsCount: number;
  criticalViolations: number;
  violations: Array<{ messageIndex: number; violations: string[] }>;
} {
  let violationsCount = 0;
  let criticalViolations = 0;
  const violations: Array<{ messageIndex: number; violations: string[] }> = [];

  messages.forEach((message, index) => {
    const validation = validateResponse(message);
    if (!validation.safe) {
      violationsCount++;
      if (validation.severity === 'critical') {
        criticalViolations++;
      }
      violations.push({
        messageIndex: index,
        violations: validation.violations,
      });
    }
  });

  return {
    totalMessages: messages.length,
    violationsCount,
    criticalViolations,
    violations,
  };
}

/**
 * Get safe fallback response when guardrails are violated
 *
 * @param severity - Severity of the violation
 * @returns Safe fallback message to send to user
 */
export function getSafeFallback(severity: GuardrailsValidation['severity']): string {
  if (severity === 'critical') {
    return (
      'Para brindarte información precisa sobre tu situación específica, necesito que hables ' +
      'directamente con el Dr. Durán o uno de nuestros asesores especializados. ' +
      '¿Te conecto con un asesor ahora?'
    );
  }

  if (severity === 'high') {
    return (
      'Para darte información exacta sobre precios y opciones de pago, necesito que hables ' +
      'con uno de nuestros asesores. Ellos podrán ofrecerte una cotización personalizada. ' +
      '¿Te conecto con un asesor?'
    );
  }

  return (
    'Para asegurarme de darte la mejor información, prefiero que hables directamente ' +
    'con uno de nuestros especialistas. ¿Te conecto con un asesor?'
  );
}
