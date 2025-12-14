# POLICY_GUARDRAILS.md
## Objetivo
Evitar:
- consejo médico,
- promesas/garantías,
- compromisos de precio,
- tratamiento de datos sensibles sin consentimiento,
- fallas por ambigüedad (parseo) y por drift del modelo.

## Política de decisión (orden de precedencia)
1) **Seguridad/urgencia** (emergency) domina todo.
2) **Cumplimiento clínico** (no diagnóstico/prescripción).
3) **Precios/pagos** (solo por herramienta o handover).
4) **Consentimiento sensible** (gate duro).
5) **Calidad de respuesta** (si hay duda: handover).

## Reason codes (definición operativa)
- EMERGENCY_SYMPTOMS: síntomas graves → urgencias + handover.
- URGENT_SYMPTOMS: señales de complicación → contacto hoy + handover.
- MEDICAL_ADVICE_REQUEST: pregunta buscando diagnóstico/tratamiento → handover.
- PRICING_QUOTE_REQUEST: pide precio o cotización → handover (o pricingTool).
- SENSITIVE_DATA_CONSENT_MISSING: falta consentimiento para fotos/datos de salud → pedir consentimiento.
- TOOL_FAILURE: tool timeout/error → handover con resumen.

## Plantillas seguras (texto base)
### Emergency
- “Esto puede ser una urgencia. Busca atención médica inmediata (urgencias). Ya estoy notificando al equipo. ¿Ciudad y número de contacto?”
### Urgent
- “Esto requiere revisión del equipo clínico hoy. Voy a escalarlo ahora. ¿Me confirmas tu número y cuándo fue tu procedimiento?”
### Medical advice
- “Puedo ayudarte con logística e información general, pero la evaluación clínica la debe hacer el equipo. Te transfiero.”
### Pricing
- “Para cotización exacta necesito que el equipo lo confirme. Te transfiero.”
### Consent
- “Para revisar fotos/datos de salud necesito tu autorización. ¿Confirmas que aceptas enviarlos para que el equipo los revise? Responde: SÍ / NO.”

## Logging obligatorio
- `conversationId`, `messageId`, `urgency`, `handover`, `reason_code`, `risk_flags`, `latencyMs`, `toolCalls[]`.
