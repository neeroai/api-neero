# IMPLEMENTATION_PLAN.md
## Objetivo
Implementar guardrails robustos (salida estructurada + verificador) y triage clínico (emergency/urgent/routine) para el AI Employee “Eva” en Vercel Edge, manteniendo conversación en Bird (workflow tipo deployment) y escalación segura a humano.

## Entregables técnicos
- Respuesta del modelo **siempre** como JSON validable (Zod): `EvaResult`.
- Middleware `verifyAndRewrite()` que:
  1) valida schema,
  2) aplica reglas deterministas,
  3) opcionalmente ejecuta un “mini-verifier” (modelo barato),
  4) decide `handover`/`reply` final (plantillas seguras).
- Playbooks de triage con `reason_code` + `risk_flags`.
- Logging/auditoría por `conversationId`.

## Hitos
### H1 — Schemas y reason codes (Día 1)
- Definir `EvaResult` + enums (`reason_code`, `risk_flags`, `urgency`).
- Definir plantillas seguras (emergency/urgent/medical/pricing/consent).

### H2 — Prompt Eva v2 (Día 1–2)
- Reescribir prompt con:
  - prohibiciones clínicas,
  - triage explícito,
  - uso de herramientas,
  - salida estructurada obligatoria.

### H3 — Verificador (Día 2–3)
- Implementar `verifyAndRewrite(result, rawContext)`:
  - reglas de emergencia,
  - reglas anti-diagnóstico,
  - reglas anti-promesas,
  - reglas anti-precio (si no hay pricingTool),
  - reglas de consentimiento antes de multimedia.

### H4 — Tool contracts + resumen a humano (Día 3–4)
- Definir contratos para:
  - `ticket.create` (handover),
  - `calendar.*`,
  - `whatsapp.send` (texto/template),
  - `media.analyze`.
- `notes_for_human` obligatorio cuando `handover=true`.

### H5 — E2E tests (Día 4–6)
- Matriz de escenarios (triage, pricing, consent, multimedia, fallas de tools).
- Pruebas de idempotencia por `messageId`.

## Done / Exit criteria (Pilot)
- 0 respuestas con consejo médico (auditoría de 100 conversaciones).
- 0 envíos proactivos fuera de ventana sin template.
- 100% de respuestas parseables por Zod (o fallback seguro + handover).
- p95 respuesta inbound < 10s con degradación a handover si excede presupuesto.

## Riesgos principales
- Parseo JSON intermitente → usar Structured Outputs / reintento controlado / fallback.
- Triage incompleto → verificador determinista + mini-verifier opcional.
- Multimedia sin consentimiento → gate duro antes de `media.analyze`.
