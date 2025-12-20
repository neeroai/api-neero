# Bird AI Employees Setup Guide

> LLM-optimized manual configuration guide for Bird AI Employees UI | Time: 45-60 min | Updated: 2025-12-05

## Overview

Configure Bird AI Employees to process multimedia (images, audio, documents) via api-neero HTTP Actions using the real Bird UI workflow.

**Use Cases:**
- Image analysis (photos, invoices, cedulas, documents)
- Audio transcription (voice notes, Spanish-optimized)
- Document extraction (PDFs, multi-page scans)

**Time Estimate:** 45-60 minutes first setup

---

## Prerequisites Checklist

| Item | Status | Notes |
|------|--------|-------|
| Bird account with AI Employees access | [ ] | https://bird.com |
| WhatsApp Business channel connected | [ ] | Inbox > Channels > WhatsApp |
| api-neero deployed to production | [ ] | https://api.neero.ai |
| NEERO_API_KEY configured | [ ] | For X-API-Key authentication |
| BIRD_ACCESS_KEY (optional) | [ ] | Only if CDN requires auth |

---

## Step 1: General Configuration (5 min)

**Navigation:** Bird Dashboard > AI Employees > Create New

### 1.1 Profile

| Field | Value | Notes |
|-------|-------|-------|
| Name | Multimedia Assistant | Descriptive name |
| Description | Asistente multimodal para WhatsApp | Brief description |
| Avatar | Upload image | Optional brand logo |

### 1.2 Connector

| Field | Value |
|-------|-------|
| LLM Provider | OpenAI |
| Connector Name | OpenAI2025 |

**Note:** Ensure connector is configured before proceeding (green checkmark ✓).

---

## Step 2: Personality Configuration (15 min)

**Navigation:** AI Employee > Behavior > Personality

### 2.1 Purpose (High-level job description)

```
Asistente multimodal para procesar imagenes, audios y documentos de clientes empresariales en LATAM.
```

### 2.2 Tasks (Specific functions)

```
- Analizar fotos de productos, personas y escenas
- Extraer datos estructurados de facturas colombianas (IVA, NIT, totales)
- Procesar cedulas y documentos de identidad colombianos
- Transcribir notas de voz en español con alta precision
```

### 2.3 Audience (Who interacts)

```
Usuarios empresariales WhatsApp en LATAM (Colombia, Mexico, Argentina).
Nivel de comunicacion: Profesional, B2B.
```

### 2.4 Tone (Voice, traits, characteristics)

```
Profesional, claro, conciso. Responde siempre en español.
Evita jerga tecnica innecesaria. Enfoque en eficiencia.
```

### 2.5 Custom Instructions (Detailed behavior)

```
FLUJO DE TRABAJO:
1. Cuando recibas una imagen → Llama action "process_media"
2. Cuando recibas audio → Llama action "process_media"
3. Cuando recibas documento PDF → Llama action "process_media"

MANEJO DE RESPUESTAS:
- Usa los datos estructurados devueltos por el action
- Para imagenes: Resume objetos, personas, texto detectado
- Para facturas: Lista vendor, total, items principales
- Para cedulas: Confirma nombre, numero CC, fecha emision
- Para audio: Provee transcripcion completa

FORMATO:
- Bullet points para listados
- Numeros con separadores de miles (ej: 1.250.000 COP)
- Fechas en formato DD/MM/YYYY
```

---

## Step 3: Guardrails Configuration (5 min)

**Navigation:** AI Employee > Behavior > Guardrails

### Guardrails Text

```
LIMITACIONES:
- NO procesar imagenes con contenido sensible o inapropiado
- NO almacenar datos personales mas alla de la sesion
- NO proporcionar asesoria legal o financiera
- Si la imagen es borrosa o ilegible, solicitar mejor calidad
- Si el audio tiene ruido excesivo, solicitar reenvio
- Timeout maximo 9 segundos por procesamiento
```

---

## Step 4: Actions - Main Task (20 min)

**Navigation:** AI Employee > Actions > Main task > Setup flow

### 4.1 Create Action

1. Click "Main task" > "+ Add action"
2. Name: `process_media`
3. Description: `Process image, audio, or document via api-neero`
4. Click "Setup flow"

### 4.2 Task Arguments (CRITICAL)

Add 2 REQUIRED arguments in Configuration section (v3.0):

| Name | Type | Value | Required |
|------|------|-------|----------|
| `conversationId` | string | From Bird conversation context | ✓ Required |
| `contactName` | string | From Bird contact info | ✓ Required |
| `mediaType` | string | AI Employee determines: "image", "document", "audio" | ✗ Optional - API auto-detects |

**Key:** Don't manually type variables—use `{{` dropdown selector.

**v3.0 Changes:**
- `mediaUrl` removed - API extracts automatically from conversation via Bird Conversations API
- `mediaType` now optional - API auto-detects from latest message structure and contentType

### 4.3 HTTP Request Step

**Config:**
- Method: POST
- URL: `https://api.neero.ai/api/bird`
- Content-Type: application/json

**Headers:**
```
X-API-Key: {{env.NEERO_API_KEY}}
```

**Body (JSON editor):**
```json
{
  "context": {
    "conversationId": "{{conversationId}}",
    "contactName": "{{contactName}}"
  }
}
```

**Note:** `mediaType` can be omitted - API will auto-detect from latest message in conversation.

### 4.4 Configure AI Employee to Populate Arguments

Add to Custom Instructions (Step 2.5):

```
BEFORE process_media:
1. Set task arguments:
   - conversationId (from conversation context)
   - contactName (from contact info)

2. Call process_media Action

CRITICAL: Both task arguments required before Action call.
API will auto-detect media type from latest message.
```

### 4.5 v3.0 Breaking Changes (Migration Guide)

**If upgrading from v2.x:**

**1. Remove mediaUrl argument:**
- **Old (v2.x):** Task argument `mediaUrl` extracted from `{{messageImage}}`, `{{messageFile}}`, or `{{messageAudio}}`
- **New (v3.0):** API extracts media URL from conversation automatically via Bird Conversations API
- **Action:** Delete `mediaUrl` from Task Arguments configuration

**2. Make mediaType optional (recommended):**
- **Old (v2.x):** `"type": "{{mediaType}}"` (required, AI Employee guesses)
- **New (v3.0):** Omit `mediaType` field entirely (API auto-detects from message)
- **Action:** Remove mediaType from JSON body in HTTP Request step
- **Alternative:** Keep `"mediaType": "{{mediaType}}"` if you prefer AI Employee detection

**3. Ensure conversationId is available:**
- **Requirement:** Required for media extraction via Bird Conversations API
- **Use:** Bird native variable `{{conversationId}}` (available in all conversations)
- **Action:** Verify conversationId is in Task Arguments and request body context

**Environment variables required (v3.0):**
```bash
BIRD_ACCESS_KEY=xxx        # Required for Conversations API
BIRD_WORKSPACE_ID=xxx      # Required for Conversations API
NEERO_API_KEY=xxx          # Optional API authentication
```

### 4.6 Alternative: Custom Function (if HTTP fails)

Replace HTTP Request step with Custom Function:

```javascript
exports.handler = async function (context, variables) {
  const axios = require('axios');

  // v3.0: API extracts mediaUrl and auto-detects mediaType from conversation
  const response = await axios.post('https://api.neero.ai/api/bird', {
    context: {
      conversationId: variables.conversationId,
      contactName: variables.contactName
    }
  }, {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': context.env.NEERO_API_KEY
    },
    timeout: 9000
  });

  return { success: true, data: response.data };
};
```

---

## Step 5: Environment Variables (5 min)

**Navigation:** Bird Dashboard > Settings > Environment Variables

### Required Variables

| Variable Name | Type | Value | Notes |
|---------------|------|-------|-------|
| `NEERO_API_KEY` | Secret | `nro_prod_abc123...` | From api-neero deployment |
| `BIRD_ACCESS_KEY` | Secret | `AccessKey xyz...` | Optional, test if CDN needs auth |

**Setup Steps:**
1. Click "+ Add variable"
2. Enter variable name (exactly as shown)
3. Select "Secret" type
4. Paste value
5. Click "Save"
6. Repeat for all variables

---

## Bird Variables Reference

**AI Employee Access (before calling Action):**

| Variable | Source | Use |
|----------|--------|-----|
| `{{messageImage}}` | WhatsApp | Extract to `mediaUrl` if image |
| `{{messageAudio}}` | WhatsApp | Extract to `mediaUrl` if audio |
| `{{messageFile}}` | WhatsApp | Extract to `mediaUrl` if document |
| `{{conversationId}}` | Bird | Copy to Task Argument |
| `{{contact.name}}` | Bird | Copy to Task Argument |
| `{{env.NEERO_API_KEY}}` | Settings | Use in HTTP headers |

**NOT a Bird variable:** `{{conversationMessageType}}` doesn't exist—use `mediaType` Task Argument instead.

---

## Quick Test

**WhatsApp Test:**
1. Send image/audio/PDF to AI Employee number
2. Wait 3-9 seconds (processing time varies by type)
3. Expect Spanish response with extracted data

**cURL Test:**
```bash
curl -X POST https://api.neero.ai/api/bird \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"type":"image","mediaUrl":"https://example.com/photo.jpg","context":{"conversationId":"test-001"}}'
```

---

## Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| `context: Required` | Missing conversationId or contactName | Add both task arguments (Step 4.2) |
| `invalid variable` despite defined | Variables manually typed, not selected | Use `{{` dropdown selector |
| `Latest message is text, not media` | AI Employee called on text message | Only call process_media for media |
| `Location messages are not supported` | User sent location | Inform user location not processable |
| `Latest message is not from contact` | Bot message is most recent | Wait for user to send media |
| `401 Unauthorized` | Invalid X-API-Key | Verify `NEERO_API_KEY` in env vars |
| `403 Forbidden` | CDN auth failed | Add `BIRD_ACCESS_KEY` env variable |
| `408 Timeout` | Processing >9s | Reduce media size, try again |
| `500 Internal Error` | API failure | Check Vercel logs |

**Debug Quick Steps:**
1. Bird Logs: Dashboard > Logs > Filter by AI Employee
2. Vercel Logs: https://vercel.com/neero/api-neero/logs
3. Test API: Use cURL with sample data
4. Check flow: Arguments → HTTP Request configured?

---

## Specialized Configurations

### Eva Valoración: Contact Update Action

For configuring Eva Valoración's contact update functionality (name cleaning, email validation, country mapping), see the dedicated guide:

**Guide:** `/docs/bird/eva-contact-update-setup.md`

**Features:**
- Automatic emoji removal from names (`Juan 😊` → `Juan`)
- Proper capitalization (`MARIA GARCIA` → `Maria Garcia`)
- Email/phone/country validation with specific error messages
- Before/after change transparency
- Post-update verification

**Time:** 15-20 minutes
**Prerequisites:** Eva Valoración AI Employee created, `/api/contacts/update` endpoint deployed

---

## Sources

**Official Bird Documentation:**
- [Bird AI Employees Introduction](https://bird.com/en-us/knowledge-base/ai/introduction-to-ai-employees)
- [Set Up Actions for AI Employee](https://bird.com/en-us/knowledge-base/ai/introduction-to-ai-employees/set-up-actions-for-your-ai-employee)
- [HTTP Request in Flow Builder](https://developers.messagebird.com/tutorials/http-request-in-flow-builder)
- [AI Flow Actions](https://docs.bird.com/applications/ai-features/ai/concepts/ai-flow-actions)
- [Available Variables](https://docs.bird.com/connectivity-platform/faq/what-are-available-variables)

**api-neero Documentation:**
- `/docs/bird/bird-actions-architecture.md` - Implementation details
- `/docs/bird/bird-quick-reference.md` - Variable reference
- `/docs/architecture.md` - System design
- `/docs/ai-integration.md` - Model configuration

---

**Format:** LLM-optimized | **Lines:** 200 | **Token Budget:** ~1,100 tokens
