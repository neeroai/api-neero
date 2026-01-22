---
title: "Changelog - Webhook conversation.created"
summary: "Historial de cambios del webhook de normalización proactiva para nuevas conversaciones"
description: "Registro cronológico de problemas, decisiones y fixes del webhook conversation-created"
version: "1.0"
date: "2026-01-21"
updated: "2026-01-21 00:00"
scope: "project"
---

# Changelog - Webhook conversation.created

**Archivo**: `app/api/webhooks/bird/conversation-created/route.ts`
**Propósito**: Normalización proactiva de contactos cuando Bird crea una nueva conversación

---

## [2026-01-21] - PROBLEMA CRÍTICO IDENTIFICADO

### Problema

El webhook está **extrayendo y actualizando nombres incorrectamente**:

1. **Extracción incorrecta**: Está tomando cualquier nombre que aparece mencionado en la conversación, NO solo cuando el paciente comparte sus datos explícitamente
2. **Ejemplo real**:
   - Mensaje del paciente: "¡Hola! 💙 Me gustaría agendar una valoracion en Bogota."
   - displayName en Bird: "🏁" (emoji bandera)
   - **NO HAY NOMBRE del paciente en el mensaje**
   - Webhook intentó normalizar y falló/extrajo datos incorrectos

### Comportamiento Actual (INCORRECTO)

```typescript
// L138-152: Fetch mensajes y extrae CUALQUIER texto del contacto
const conversationText = messages
  .filter((msg) => msg.sender.type === 'contact') // SOLO contacto
  .map((msg) => {
    if (msg.body.type === 'text') {
      const textBody = msg.body.text as any;
      return typeof textBody === 'string' ? textBody : textBody?.text || '';
    }
    return '';
  })
  .filter((text) => text.length > 0)
  .join('\n');

// L170-173: Extrae con GPT-4o-mini (asume que hay nombre)
const extracted = await extractContactDataGPT4oMini(conversationText, {
  contactPhone,
  fallbackToRegex: true,
});

// L182: Actualiza si confidence >= 0.6 (threshold muy bajo)
if (extracted.confidence >= 0.6 && extracted.displayName) {
  await updateContact(contactId, updatePayload);
}
```

### Diagnóstico

El webhook NO debe normalizar automáticamente en `conversation.created` porque:

1. **Mensaje inicial no contiene datos del paciente**: Típicamente es una solicitud de servicio ("quiero agendar cita")
2. **GPT-4o-mini no puede distinguir**: Si no hay nombre explícito, puede inventar o extraer incorrectamente
3. **Threshold 0.6 muy permisivo**: Acepta extracciones ambiguas

### Impacto

- Miles de contactos normalizados con datos incorrectos (emojis, usernames, nombres inventados)
- Contactos bloqueados en DB con `status='success'`, no se pueden re-procesar
- Bird reintenta 26+ veces porque contacto sigue mal normalizado

### Ejemplo Payload Real

```json
{
  "service": "conversations",
  "event": "conversation.created",
  "payload": {
    "id": "24e9402d-eb10-431f-bd07-6dc5c4d9be43",
    "featuredParticipants": [
      {
        "id": "edbcc2d9-22dc-42c3-a018-43f580b668e8",
        "type": "contact",
        "displayName": "🏁",
        "contact": {
          "identifierValue": "+573102187641"
        }
      }
    ],
    "lastMessage": {
      "preview": {
        "text": "¡Hola! 💙 Me gustaría agendar una valoracion en Bogota."
      }
    }
  }
}
```

**NO HAY NOMBRE** en este mensaje, pero webhook intentó normalizar.

---

## [2026-01-20] - Commits Recientes

### commit 668dab4 - fix(build): resolve TypeScript errors in webhook and batch script
- Tipo: Fix TypeScript
- Cambios: Correcciones de tipos

### commit 9b5f26d - debug(webhook): make signature verification non-blocking temporarily
- Tipo: Debug
- Razón: Bird NO estaba enviando firma `X-Bird-Signature`
- Cambio: Deshabilitó verificación de firma (L81-84)
- Estado: **INSEGURO pero necesario** hasta que Bird envíe firma correctamente

```typescript
// L81-84: Verificación deshabilitada
if (!signatureValid) {
  console.warn('[Webhook DEBUG] Signature verification FAILED - allowing anyway for debugging');
  // TEMPORARY: Don't throw, just log warning
}
```

### commit 9425499 - debug(webhook): add temporary logging to diagnose 401 errors
- Tipo: Debug
- Razón: Investigar 401 errors
- Cambios: Añadió logging de firma, body, secret

### commit 21067b7 - fix(webhook): resolve conversation.created 401 errors
- Tipo: Fix
- Cambios: Intentó resolver 401 errors (probablemente relacionado con firma)

### commit 38fdee8 - feat(normalization): implement GPT-4o-mini contact normalization system
- Tipo: Feature inicial
- Contenido: Implementación del webhook con normalización proactiva

---

## Archivos Relacionados

| Archivo | Propósito | Relación |
|---------|-----------|----------|
| `app/api/webhooks/bird/conversation-created/route.ts` | Webhook handler (ÚNICO archivo) | Este archivo |
| `lib/normalization/gpt4o-mini-extractor.ts` | Extractor de datos con GPT-4o-mini | Llamado por webhook L170 |
| `lib/bird/conversations.ts` | Cliente Bird Conversations API | Fetch mensajes L139 |
| `lib/bird/contacts.ts` | Cliente Bird Contacts API | Update contacto L220 |
| `lib/db/schema.ts` | Schema contact_normalizations | Log resultados L225, L266 |

---

## Variables de Entorno Requeridas

| Variable | Propósito | Estado |
|----------|-----------|--------|
| `BIRD_WEBHOOK_SECRET` | Verificación de firma HMAC | Deshabilitada (Bird no envía firma) |
| `BIRD_ACCESS_KEY` | Autenticación Bird API | Requerida |
| `AI_GATEWAY_API_KEY` | OpenAI GPT-4o-mini via Vercel Gateway | Requerida |
| `DATABASE_URL` | PostgreSQL connection | Requerida |

---

## Decisiones de Diseño Actuales

1. **Normalización proactiva**: Intentar normalizar en `conversation.created` (PROBLEMÁTICO)
2. **Threshold 0.6**: Aceptar confidence >= 0.6 (DEMASIADO PERMISIVO)
3. **Idempotencia**: Skip si ya normalizado con confidence >= 0.6 (BLOQUEA RE-PROCESAMIENTO)
4. **Verificación firma deshabilitada**: Bird no envía firma (INSEGURO)
5. **Solo mensajes del contacto**: Filtra mensajes por `sender.type === 'contact'` (CORRECTO)
6. **Fallback regex**: Si GPT-4o-mini falla, intenta regex (PUEDE EMPEORAR)

---

## Soluciones Propuestas (Pendientes)

### Opción A: Deshabilitar Normalización Proactiva (RECOMENDADO)

**Rationale**: El evento `conversation.created` ocurre cuando el paciente envía el PRIMER mensaje, que típicamente es una solicitud de servicio, NO sus datos personales.

**Cambios**:
1. Deshabilitar webhook o convertirlo en no-op
2. Normalizar solo cuando:
   - Agente solicita datos explícitamente
   - Paciente responde con confirmación de datos
   - Usar otro evento (ej: `message.created` con filtros)

### Opción B: Validación Estricta Pre-Extracción

**Cambios**:
1. Antes de llamar GPT-4o-mini, validar que mensaje contiene patrones de nombre:
   - "me llamo"
   - "soy"
   - "mi nombre es"
   - Regex: `[A-Z][a-z]+ [A-Z][a-z]+` (nombre completo)
2. Si no hay patrones, retornar 200 sin normalizar
3. Subir threshold a 0.85+

### Opción C: Proceso de 2 Pasos

**Cambios**:
1. `conversation.created`: Solo marcar para revisión (no actualizar Bird)
2. Agente humano o workflow automatizado solicita confirmación
3. Normalizar solo después de confirmación

---

## Próximos Pasos

1. **Decidir estrategia**: Opción A, B, o C
2. **Crear tests**: Casos de no-normalización (sin nombre explícito)
3. **Actualizar lógica**: Implementar solución elegida
4. **Limpiar DB**: Marcar contactos incorrectos para re-procesamiento
5. **Re-habilitar firma**: Cuando Bird empiece a enviar `X-Bird-Signature`

---

## Notas Técnicas

### Por Qué Signature Verification está Deshabilitada

Bird NO está enviando el header `X-Bird-Signature` en webhooks. Verificación deshabilitada temporalmente con logging para diagnosticar. **INSEGURO** pero necesario hasta que Bird envíe firma correctamente.

### Por Qué Threshold 0.6 es Problemático

GPT-4o-mini puede asignar confidence ~0.65 a extracciones ambiguas donde:
- Solo hay saludo genérico
- Menciona nombre de otra persona (doctor, familiar)
- Username de Instagram
- Emoji como displayName

Threshold 0.75+ es más seguro para normalización automática.

### Por Qué conversation.created es Mal Momento

El primer mensaje de una conversación típicamente es:
- "Hola, quiero agendar cita"
- "Buenos días, necesito información"
- "Me gustaría valoración"

**NO contiene datos del paciente**. Mejor normalizar después de que agente solicite datos explícitamente.

---

**Última Actualización**: 2026-01-21 00:00
**Siguiente Revisión**: Después de implementar solución
