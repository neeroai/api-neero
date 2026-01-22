# Plan: Fix /api/contacts/update - Eva AI Employee

**Fecha**: 2026-01-21
**Scope**: SOLO endpoint /api/contacts/update
**Status**: EN REVISIÓN

---

## Problema

Eva AI Employee no puede actualizar contactos en Bird CRM. Cuando el paciente comparte sus datos (nombre, email, ciudad), Eva intenta normalizar el contacto pero recibe HTTP 400 con errores de validación.

### Conversación Real

**Paciente**: Chyenne Larkins, Tampa Fl USA, [email protected], 7279107703

**Eva**:
1. Extrae datos correctamente
2. Llama action "actualizacion de datos"
3. Recibe HTTP 400 (Validation Error)
4. Escala a agente humano: "Error en la actualización de datos de contacto"

### Errores Retornados

**Error 1**: Country format
- Eva envía: `"country": "USA"` (3 caracteres)
- API espera: `"country": "US"` (ISO 3166-1 alpha-2, 2 caracteres)
- Validation: `"String must contain exactly 2 character(s)"`

**Error 2**: Audit log faltante
- Endpoint actualiza Bird CRM pero NO guarda registro en DB
- Tabla `contact_normalizations` solo tiene registros del cron y webhook
- Falta trazabilidad de cambios manuales vía Eva

---

## Root Cause

### 1. Country Format Incompatible

**Flujo Actual**:
```
Paciente: "Tampa, Fl USA"
  ↓
Eva extrae: "USA"
  ↓
Eva envía a API: country: "USA"
  ↓
API valida: z.string().length(2)
  ↓
ERROR: "String must contain exactly 2 character(s)"
```

**Por qué ocurre**:
- Eva extrae texto literal del mensaje del paciente
- Eva no convierte country format antes de enviar
- API tiene validación estricta (Zod schema)

**Lógica de conversión existe** pero NO está implementada en el endpoint:
- Webhook usa `phoneToCountryCode()` para convertir teléfono → país
- Cron también hace conversión automática
- Endpoint `/api/contacts/update` NO hace conversión

### 2. Audit Log No Implementado

**Estado Actual**:
- Cron: ✅ Guarda en `contact_normalizations`
- Webhook: ✅ Guarda en `contact_normalizations`
- Endpoint: ❌ NO guarda (solo actualiza Bird CRM)

**Por qué es problema**:
- No hay trazabilidad de cambios manuales vía Eva
- No se puede hacer rollback si Eva actualiza incorrectamente
- No hay historial de before/after para auditoría

### 3. conversationId Disponible pero No Usado

**Nota**: Bird SÍ provee conversationId en actions vía `{{context.conversation.id}}`

Según screenshot del usuario, Bird actions pueden acceder a:
- `{{context.contact.computedDisplayName}}`
- `{{context.conversation.id}}`
- `{{arguments.*}}`

El action de Eva debe estar usando conversationId pero quizás con sintaxis incorrecta.

---

## Solución Propuesta

### Fix 1: Normalizar Country Code en Backend

**Objetivo**: API debe aceptar múltiples formatos de country y convertir a ISO alpha-2

**Estrategia**:
- Agregar función `normalizeCountryCode()` antes de validación Zod
- Soportar 3 formatos: ISO alpha-2 (US), ISO alpha-3 (USA), nombre completo (United States)
- Si formato inválido, remover campo en lugar de fallar (graceful degradation)

**Mapping requerido**:
- USA / United States / Estados Unidos → US
- COL / Colombia → CO
- MEX / Mexico / México → MX
- Otros países LATAM comunes

**Beneficio**:
- Eva no necesita cambiar (sigue extrayendo texto literal)
- API es más flexible y tolerante
- Solución reutilizable para otros clientes del API

### Fix 2: Agregar Audit Logging

**Objetivo**: Registrar todas las actualizaciones vía endpoint en DB

**Estrategia**:
- Llamar `saveNormalizationResult()` después de actualizar Bird CRM
- Guardar before/after snapshot igual que cron y webhook
- Marcar origen con `source: 'api_endpoint'` para diferenciar
- Confidence: 1.0 (actualización manual = 100% confianza)

**Campos a guardar**:
- contactId (Bird UUID)
- conversationId (si está disponible)
- status: 'success'
- before: estado anterior del contacto
- after: estado después de actualización
- extractedData: datos enviados por Eva

**Beneficio**:
- Trazabilidad completa
- Capacidad de rollback
- Auditoría de cambios
- Query: "Qué contactos actualizó Eva hoy?"

### Fix 3: Verificar conversationId en Eva Action

**Objetivo**: Confirmar que Eva está usando `{{context.conversation.id}}` correctamente

**Investigación requerida**:
- Revisar Eva Valoración.agent.json líneas 14-40 (action arguments)
- Verificar si usa `{{context.conversation.id}}` en body.context
- Si NO lo usa, agregarlo
- Si SÍ lo usa, verificar por qué envía "0" en lugar del UUID real

**Posibles causas si falla**:
- Sintaxis incorrecta en placeholder
- Campo no disponible en ese contexto de Bird
- Valor por defecto cuando conversation no existe

**Acción**:
- Si conversationId no está disponible en Bird actions, el schema lo marca como opcional
- Backend debe manejar gracefully (undefined o string vacío)

---

## Archivos a Modificar

### 1. Backend - app/api/contacts/update/route.ts

**Cambio 1**: Agregar función `normalizeCountryCode()`
- Ubicación: Después de línea 222 (helpers section)
- Propósito: Convertir USA/United States → US

**Cambio 2**: Modificar `parseRequestBody()`
- Ubicación: Línea 143-146
- Propósito: Sanitizar country antes de validación Zod

**Cambio 3**: Agregar audit logging
- Ubicación: Después de línea 112 (después de verifyUpdate)
- Propósito: Llamar `saveNormalizationResult()`

**Import adicional requerido**:
- `saveNormalizationResult` de `@/lib/normalization/tracking`

### 2. Eva Config - docs/eva-ai-employee/eva-valoracion/Eva Valoración.agent.json

**Cambio 1**: Verificar conversationId argument
- Ubicación: Líneas 14-23 (arguments)
- Acción: Confirmar que existe `conversationId: { "type": "string" }`

**Cambio 2**: Verificar HTTP request body
- Ubicación: Líneas 30-40 (body.context)
- Acción: Confirmar que usa `"conversationId": "{{context.conversation.id}}"`

**Cambio 3**: Actualizar description
- Ubicación: Línea 13
- Acción: Documentar que API convierte country automáticamente

---

## Plan de Ejecución

### Fase 1: Backend Fixes

**Paso 1**: Implementar `normalizeCountryCode()`
- Función helper que convierte formatos de country
- Retorna ISO alpha-2 o undefined

**Paso 2**: Integrar en `parseRequestBody()`
- Interceptar country antes de Zod validation
- Convertir si es válido, remover si es inválido
- Log warning si formato no reconocido

**Paso 3**: Agregar audit logging
- Import `saveNormalizationResult`
- Llamar después de verificación exitosa
- Capturar errores sin fallar request principal

**Paso 4**: Testing local
- Probar con curl usando country: "USA"
- Verificar que convierte a "US"
- Verificar que guarda en DB

### Fase 2: Eva Config Review

**Paso 5**: Revisar Eva action config
- Leer Eva Valoración.agent.json completo
- Verificar sintaxis de conversationId
- Confirmar mapping correcto

**Paso 6**: Update si necesario
- Si conversationId falta, agregar con sintaxis correcta
- Si description no menciona country, actualizar
- Deploy a Bird UI

### Fase 3: Verificación End-to-End

**Paso 7**: Test en production
- Conversación real de prueba
- Paciente comparte datos con country "USA"
- Verificar Eva actualiza exitosamente
- Verificar HTTP 200

**Paso 8**: Verificar audit log
- Query DB: `SELECT * FROM contact_normalizations WHERE extracted_data->>'source' = 'api_endpoint'`
- Confirmar registro existe
- Verificar conversationId capturado
- Verificar before/after snapshot

**Paso 9**: Verificar en Bird CRM
- Contact debe tener displayName limpio
- Country debe ser "United States" (convertido de USA→US→United States)
- Email debe estar en identifiers

---

## Verificación de Éxito

| Criterio | Target | Cómo Verificar |
|----------|--------|---------------|
| Eva actualiza sin errores | HTTP 200 | Logs de Vercel |
| Country "USA" funciona | Convertido a "US" | Test con curl |
| Audit log guardado | 1 registro en DB | Query PostgreSQL |
| conversationId capturado | UUID válido en DB | Query DB campo conversation_id |
| Before/after snapshot | Datos completos | JSON fields populated |
| Patient UX mejorado | Sin escalación a humano | Bird conversation logs |

---

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Mitigación |
|--------|--------------|-----------|
| Country format no reconocido | MEDIA | Graceful degradation (remove field) |
| Audit log falla | BAJA | Non-blocking (catch error, log warning) |
| conversationId no disponible | BAJA | Schema marca como optional |
| Performance degradation | MUY BAJA | Operaciones son I/O bound, no CPU |

---

## Notas Técnicas

### Por qué normalizar country en backend vs Eva

**Opción A**: Eva convierte (rechazada)
- Eva tendría que ser más inteligente
- Difícil de mantener (prompt engineering)
- Dificulta debugging

**Opción B**: Backend convierte (elegida)
- API es más flexible
- Reutilizable para otros clientes
- Fácil de testear y mantener

### Por qué audit log es importante

Sin audit log:
- No sabemos qué cambió Eva
- No podemos rollback si hay error
- No hay accountability

Con audit log:
- Trazabilidad completa
- Rollback capability
- Queries: "Qué contactos cambió Eva esta semana?"

### conversationId: Optional pero valioso

Si está disponible:
- Link directo a conversación en Bird
- Debugging más fácil
- Contexto completo

Si NO está disponible:
- Sistema sigue funcionando
- Solo perdemos link a conversación
- No es bloqueador

---

## Próximos Pasos (Después de este fix)

1. ✅ /api/contacts/update funcionando
2. ⏸️ Fix webhook conversation-created (threshold 0.6 → 0.75)
3. ⏸️ Fix cron normalize-contacts (CRON_SECRET + threshold)
4. ⏸️ Cleanup contactos con datos incorrectos (recovery scripts)

**Filosofía**: Un problema a la vez, verificar que funciona antes de siguiente.
