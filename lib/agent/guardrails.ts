import type { GuardrailsValidation, MessageMetadata } from './types';

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
      (v) => v.includes('Medical advice') || v.includes('Unsafe recommendation')
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

/**
 * Extract structured metadata from AI response (Hybrid Approach)
 *
 * Converts natural language validation into structured metadata for:
 * - Compliance auditing (Ley 1581/2012)
 * - Performance monitoring (urgency distribution, handover rates)
 * - Quality control (violation detection, risk assessment)
 *
 * @param response - AI generated response text
 * @param validation - Guardrails validation result
 * @returns Structured metadata for message_logs table
 *
 * Reference: /docs/ai-agentic/VALIDATED_RECOMMENDATIONS.md (P0-2)
 */
export function extractMetadata(
  response: string,
  validation: GuardrailsValidation
): MessageMetadata {
  const lowerResponse = response.toLowerCase();

  // 1. Determine urgency level
  let urgency: MessageMetadata['urgency'] = 'routine';

  // Emergency symptoms (chest pain, breathing issues, high fever)
  const emergencyKeywords = [
    'dolor en el pecho',
    'dolor de pecho',
    'dificultad para respirar',
    'falta de aire',
    'fiebre alta',
    'temperatura alta',
    'pus',
    'mal olor',
    'herida infectada',
    'sangrado abundante',
  ];

  for (const keyword of emergencyKeywords) {
    if (lowerResponse.includes(keyword)) {
      urgency = 'emergency';
      break;
    }
  }

  // Urgent symptoms (moderate pain, wound issues, anxiety)
  if (urgency === 'routine') {
    const urgentKeywords = [
      'dolor moderado',
      'molestia',
      'inflamación',
      'inflamacion',
      'hinchazón',
      'hinchazon',
      'enrojecimiento',
      'preocupación',
      'preocupacion',
      'ansiedad',
      'miedo',
    ];

    for (const keyword of urgentKeywords) {
      if (lowerResponse.includes(keyword)) {
        urgency = 'urgent';
        break;
      }
    }
  }

  // 2. Map violations to reason_code
  let reason_code: MessageMetadata['reason_code'] = null;

  if (validation.violations.length > 0) {
    const violationText = validation.violations.join(' ').toLowerCase();

    if (urgency === 'emergency') {
      reason_code = 'EMERGENCY_SYMPTOMS';
    } else if (urgency === 'urgent') {
      reason_code = 'URGENT_SYMPTOMS';
    } else if (violationText.includes('medical advice')) {
      reason_code = 'MEDICAL_ADVICE_REQUEST';
    } else if (violationText.includes('pricing commitment')) {
      reason_code = 'PRICING_QUOTE_REQUEST';
    } else if (violationText.includes('consent')) {
      reason_code = 'SENSITIVE_DATA_CONSENT_MISSING';
    }
  }

  // 3. Extract risk_flags
  const risk_flags: MessageMetadata['risk_flags'] = [];

  // Emergency symptoms
  if (lowerResponse.includes('dolor en el pecho') || lowerResponse.includes('dolor de pecho')) {
    risk_flags.push('CHEST_PAIN');
  }
  if (
    lowerResponse.includes('dificultad para respirar') ||
    lowerResponse.includes('falta de aire')
  ) {
    risk_flags.push('SHORTNESS_OF_BREATH');
  }
  if (lowerResponse.includes('fiebre alta') || lowerResponse.includes('temperatura alta')) {
    risk_flags.push('FEVER_HIGH');
  }
  if (
    (lowerResponse.includes('pus') && lowerResponse.includes('herida')) ||
    lowerResponse.includes('mal olor')
  ) {
    risk_flags.push('WOUND_PUS_ODOR');
  }

  // Medical advice violations
  if (validation.violations.some((v) => v.includes('Medical advice'))) {
    if (
      lowerResponse.includes('diagnóstico') ||
      lowerResponse.includes('diagnostico') ||
      lowerResponse.includes('tienes') ||
      lowerResponse.includes('padeces')
    ) {
      risk_flags.push('MEDICAL_DIAGNOSIS');
    }
    if (
      lowerResponse.includes('toma') ||
      lowerResponse.includes('debes tomar') ||
      lowerResponse.includes('prescripción') ||
      lowerResponse.includes('prescripcion')
    ) {
      risk_flags.push('TREATMENT_INSTRUCTIONS');
    }
  }

  // Pricing violations
  if (validation.violations.some((v) => v.includes('Pricing commitment'))) {
    risk_flags.push('PRICE_COMMITMENT');
  }

  // Consent violations
  if (
    lowerResponse.includes('necesito tu consentimiento') ||
    lowerResponse.includes('autorización') ||
    lowerResponse.includes('autorizacion')
  ) {
    risk_flags.push('MISSING_CONSENT');
  }

  // 4. Determine handover
  const handover = validation.severity === 'critical' || urgency === 'emergency';

  // 5. Generate notes_for_human (optional)
  let notes_for_human: string | undefined;

  if (handover) {
    const reasons: string[] = [];

    if (urgency === 'emergency') {
      reasons.push(
        `Emergency symptoms detected (${risk_flags
          .filter((f) =>
            ['CHEST_PAIN', 'SHORTNESS_OF_BREATH', 'FEVER_HIGH', 'WOUND_PUS_ODOR'].includes(f)
          )
          .join(', ')})`
      );
    }

    if (validation.severity === 'critical') {
      reasons.push(`Critical guardrails violation: ${validation.violations.join(', ')}`);
    }

    if (reasons.length > 0) {
      notes_for_human = reasons.join(' | ');
    }
  }

  return {
    urgency,
    reason_code,
    risk_flags,
    handover,
    notes_for_human,
  };
}
