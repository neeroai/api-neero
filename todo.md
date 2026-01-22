# TODO - Sistema de Normalización de Contactos

**Fecha**: 2026-01-21
**Prioridad**: CRÍTICO

---

## Estado General

| Tarea | Estado | Criticidad |
|-------|--------|-----------|
| 1. Fix /api/contacts/update | 🔴 PENDIENTE | CRÍTICA |
| 2. Fix webhook conversation-created | ⏸️ PAUSADO | ALTA |
| 3. Fix cron normalize-contacts | ⏸️ PAUSADO | MEDIA |

---

## [DOING] Tarea 1: Fix /api/contacts/update

**Problema**: Eva AI Employee no puede actualizar contactos en Bird CRM

**Síntomas**:
- Eva extrae datos correctamente del paciente
- Eva llama action "actualizacion de datos"
- HTTP 400 Validation Error
- Eva escala a agente humano con mensaje genérico

**Errores Identificados**:
1. Country format: Eva envía "USA" (3 chars) pero API espera "US" (2 chars ISO alpha-2)
2. Audit log: Endpoint NO guarda registro en contact_normalizations table
3. conversationId: Disponible en Bird como `{{context.conversation.id}}` pero action no lo usa correctamente

**Archivos a Modificar**:
- `app/api/contacts/update/route.ts` - Backend fixes
- `docs/eva-ai-employee/eva-valoracion/Eva Valoración.agent.json` - Eva action config

**Verificación de Éxito**:
- [ ] Eva puede actualizar contactos sin errores (HTTP 200)
- [ ] Country "USA" se convierte automáticamente a "US"
- [ ] Audit log guarda en DB con source='api_endpoint'
- [ ] conversationId se captura correctamente

---

## [TODO] Tarea 2: Fix webhook conversation-created

**Problema**: Webhook normaliza en momento incorrecto (primer mensaje)

**Archivos a Modificar**:
- `app/api/webhooks/bird/conversation-created/route.ts`

**Pendiente hasta completar Tarea 1**

---

## [TODO] Tarea 3: Fix cron normalize-contacts

**Problema**: CRON_SECRET no configurado, threshold 0.6 demasiado bajo

**Archivos a Modificar**:
- `app/api/cron/normalize-contacts/route.ts`
- Vercel environment variables

**Pendiente hasta completar Tarea 1**

---

## Notas

- Enfoque: Una tarea a la vez
- Prioridad: Desbloquear Eva primero (impacto directo en pacientes)
- Documentación: Sin código en plan.md, solo estrategia
