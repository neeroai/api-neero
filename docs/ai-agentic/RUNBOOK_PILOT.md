# RUNBOOK_PILOT.md
## Monitoreo
- Alertas:
  - % parse-fail > 1% en 1h
  - P0 sin handover detectado (cualquier “emergency” sin ticket)
  - Latencia p95 > 10s
  - tool failure rate > 5%

## Incidentes (playbooks)
### P0 — Emergencia sin escalación
- Acción inmediata: desactivar respuestas automáticas (feature flag) y pasar a modo “handover always”.
- Revisar logs por `conversationId`, `messageId`.
- Parche: actualizar verificador R1 y redeploy.

### P1 — Consejo médico detectado
- Bloquear ruta de salida, activar plantilla safe.
- Auditar `reply` y ajustar reglas R3.

### P1 — Precio inventado
- Activar regla R5 estricta (cualquier número monetario ⇒ handover si no hay pricingTool).
- Revisar prompt para prohibición explícita.

## Auditoría semanal
- Muestreo 100 conversaciones:
  - clasificación correcta de triage,
  - cumplimiento pricing/medical,
  - consentimiento sensible,
  - calidad de `notes_for_human`.
