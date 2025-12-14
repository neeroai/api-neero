# ARCHIVED.md

**Version:** 1.0 | **Date:** 2025-12-14 | **Status:** Archive

---

## Archivos Archivados (Obsoletos)

### PROMPT_EVA_v2.md

**Razón:** Supersedido por `/lib/agent/prompts/eva-system.ts` (Phase 3 implementation)

**Problema:**
- Propone salida JSON estructurada (`EvaResult`) como única respuesta
- Conflicto con arquitectura híbrida (natural language + metadata)

**Decisión:** Enfoque híbrido adoptado - respuestas conversacionales + metadata estructurada.

**Fecha Archivado:** 2025-12-14
**Reemplazado Por:**
- `/lib/agent/prompts/eva-system.ts` - Prompt productivo (875 líneas, español conversacional)
- `/docs/ai-agentic/VALIDATED_RECOMMENDATIONS.md` - P0-2 (Structured Metadata)

---

### SCHEMA_EvaResult.md

**Razón:** Schema no utilizado en implementación actual (Phase 3).

**Problema:**
- Diseñado para salida JSON completa del modelo
- Implementación actual usa lenguaje natural + keyword validation

**Contenido Reutilizable:**
- `reason_code` enum → Adoptado en VALIDATED_RECOMMENDATIONS.md (P0-2)
- `risk_flags` enum → Adoptado en VALIDATED_RECOMMENDATIONS.md (P0-2)
- `urgency` enum → Adoptado en VALIDATED_RECOMMENDATIONS.md (P0-2)

**Decisión:** Metadata schema integrado en enfoque híbrido (no como salida única).

**Fecha Archivado:** 2025-12-14
**Reemplazado Por:**
- `/docs/ai-agentic/VALIDATED_RECOMMENDATIONS.md` - P0-2 (MessageMetadata interface)
- `/lib/agent/guardrails.ts` - Validation + metadata extraction

---

### implementation_plan.md

**Razón:** Plan ChatGPT supersedido por implementación real (Phase 1-4 complete).

**Problema:**
- Propone verificador complejo con "mini-verifier model"
- Hitos (H1-H5) ya completados en Phase 1-4

**Contenido Reutilizable:**
- Verificador determinístico → Validado en VALIDATED_RECOMMENDATIONS.md (P1-6)
- Tool contracts → Ya implementado en `/lib/agent/tools/`
- Test matrix → Validado en VALIDATED_RECOMMENDATIONS.md (P1-4)

**Decisión:** Plan original reemplazado por IMPLEMENTATION-STATUS.md (progreso real).

**Fecha Archivado:** 2025-12-14
**Reemplazado Por:**
- `/docs/ai-agentic/IMPLEMENTATION-STATUS.md` - Estado actual (Phase 1-4 complete, 75%)
- `/docs/ai-agentic/VALIDATED_RECOMMENDATIONS.md` - Roadmap P0/P1/P2

---

### Research Files (docs/ subdirectory)

**Archivos:**
- bird workflow ai agent multimodal.json
- README-workflow-analysis.md
- agentic-architecture-patterns.md
- agentic-patterns-quick-reference.md
- ai agent multimodal.json
- ai plastic surgery agent.json
- medical-ai-best-practices.md
- plastic-surgery-agent-examples.md
- plastic-surgery-workflow-design.md
- platform-specifics.md
- staff-interview-template.md
- workflow-analysis-checklist.md
- workflow-design-executive-summary.md

**Razón:** Research phase complete - insights integrated into implementation

**Contenido Reutilizable:**
- Medical best practices → Integrated into `/lib/agent/guardrails.ts`
- Workflow patterns → Implemented in Phase 3 (inbound route)
- Platform specifics → Bird integration complete

**Decisión:** Research artifacts archived - active development in progress

**Fecha Archivado:** 2025-12-14
**Reemplazado Por:**
- `/docs/ai-agentic/CONVERSATION_INSIGHTS.md` - Real conversation analysis
- `/lib/agent/` - Production implementation

---

## Archivos Activos (Mantener)

| Archivo | Propósito | Status |
|---------|-----------|--------|
| `IMPLEMENTATION-STATUS.md` | Progreso fases 1-5 | ✅ ACTIVO - Phase 4 complete (75%) |
| `VALIDATED_RECOMMENDATIONS.md` | Roadmap P0/P1/P2 con enfoque híbrido | ✅ ACTIVO |
| `CONVERSATION_INSIGHTS.md` | Análisis de conversaciones reales | ✅ ACTIVO |
| `POLICY_GUARDRAILS.md` | Reglas de compliance | ✅ ACTIVO |
| `RUNBOOK_PILOT.md` | Monitoreo y playbooks | ✅ ACTIVO |
| `TEST_PLAN_GUARDRAILS_TRIAGE.md` | Matriz de testing | ✅ ACTIVO (referencia P1-4) |
| `TOOLS_CONTRACTS.md` | Contratos de herramientas | ✅ ACTIVO (referencia) |
| `PRD.md` | Product Requirements (v2.0) | ✅ ACTIVO |

---

## Decisiones de Arquitectura (Resumen)

### ✅ Adoptado: Enfoque Híbrido

**Natural Language (User-facing):**
```typescript
const aiResponse = await generateText({
  model: google('gemini-2.0-flash-exp'),
  system: EVA_SYSTEM_PROMPT, // Español conversacional
  messages,
  tools: { ... }
});

return { reply: aiResponse.text }; // Natural
```

**Structured Metadata (Internal audit):**
```typescript
const metadata = {
  urgency: 'routine' | 'urgent' | 'emergency',
  reason_code: 'PRICING_QUOTE_REQUEST' | null,
  risk_flags: ['MISSING_CONSENT'],
  handover: false,
  processingTimeMs: 2340
};

await saveMessage(conversationId, 'outgoing', {
  text: aiResponse.text,
  metadata // ← Structured for audit
});
```

**Ventajas:**
- ✅ UX conversacional (usuarios prefieren natural)
- ✅ Compliance auditable (metadata estructurada)
- ✅ Compatible con Phase 3 implementation (incremental)

### ❌ Rechazado: JSON Estructurado Único

**Propuesta ChatGPT:**
```typescript
// Modelo genera SOLO JSON
{
  "reply": "...",
  "urgency": "routine",
  "handover": false,
  ...
}
```

**Razones Rechazo:**
- Menos conversacional (modelo piensa en JSON, no español)
- Mayor complejidad de prompt
- Requiere reescritura completa de Phase 3
- Rígido (cambios requieren modificar schema)

---

## Referencias

**Documentos Actualizados:**
- `/docs/ai-agentic/VALIDATED_RECOMMENDATIONS.md` - Validación completa de recomendaciones
- `/docs/ai-agentic/CONVERSATION_INSIGHTS.md` - Análisis de datos reales
- `/docs/ai-agentic/IMPLEMENTATION-STATUS.md` - Progreso actualizado

**Implementación:**
- `/lib/agent/prompts/eva-system.ts` - Prompt productivo (Phase 3)
- `/lib/agent/guardrails.ts` - Validation + metadata extraction
- `/app/api/agent/inbound/route.ts` - Endpoint principal

---

**Archivado Por:** claude-master analysis (2025-12-14)
**Razón Principal:** Conflicto arquitectónico (JSON estructurado vs híbrido)
**Contenido Recuperable:** Metadata schemas reutilizados en enfoque híbrido
