---
title: "Bird Multimodal AI Employee - Configuration Guide"
summary: "Complete step-by-step guide for configuring process_media Action in Bird UI using v3.0 architecture with zero arguments and auto-detection"
description: "Operator-focused UI configuration guide with screenshots and troubleshooting"
version: "3.0"
date: "2026-01-22"
updated: "2026-01-22"
scope: "project"
audience: "operators"
architecture_version: "v3.0"
---

# Bird Multimodal AI Employee - Configuration Guide

**Version**: 3.0
**Last Updated**: 2026-01-22
**Estimated Time**: 45-60 minutes (first setup)
**Target Audience**: Operators configuring Bird UI (non-developers)

---

## Overview

Configure Bird AI Employees to process multimedia (images, audio, documents) via api-neero HTTP Actions using the real Bird UI workflow.

**Use Cases**:
- Image analysis (photos, invoices, cedulas, documents)
- Audio transcription (voice notes, Spanish-optimized)
- Document extraction (PDFs, multi-page scans)

**Key Features v3.0**:
- Zero arguments required (fully automatic)
- Auto-detects media type from conversation
- Extracts media URL automatically via Bird Conversations API
- < 9 second response time
- 89% cost reduction (Gemini 2.0/2.5 Flash vs Claude alternatives)

---

## Prerequisites Checklist

| Item | Status | Notes |
|------|--------|-------|
| Bird account with AI Employees access | [ ] | https://bird.com |
| WhatsApp Business channel connected | [ ] | Inbox > Channels > WhatsApp |
| api-neero deployed to production | [ ] | https://api.neero.ai |
| NEERO_API_KEY configured | [ ] | For X-API-Key authentication |
| BIRD_ACCESS_KEY configured | [ ] | Required for Conversations API |
| BIRD_WORKSPACE_ID configured | [ ] | Required for Conversations API |

---

## Architecture v3.0

### Flow Diagram

```
Patient sends attachment (WhatsApp)
  ↓
AI Employee detects attachment
  ↓
Calls Action: process_media
  Body: { context: { conversationId: "{{context.conversation.id}}" } }
  ↓
POST https://api.neero.ai/api/bird
  ↓
Backend: fetchLatestMediaFromConversation(conversationId)
  ├─ GET /conversations/{id}/messages?limit=5
  ├─ Filter messages from contact with media
  ├─ Extract mediaUrl from latest media message
  └─ Auto-detect mediaType from contentType
  ↓
Backend: downloadMedia(mediaUrl)
  ↓
Backend: Process by type
  ├─ image/* → Gemini 2.0/2.5 Flash (classify → route → process)
  ├─ audio/* → Groq Whisper v3 (transcribe)
  └─ video/*, application/pdf → Gemini 2.5 Flash (document)
  ↓
Response JSON
  {
    "success": true,
    "type": "image|audio|document",
    "data": { ... },
    "processingTime": "5.2s",
    "model": "gemini-2.0-flash"
  }
  ↓
AI Employee uses result in conversation
```

### Breaking Changes from v1.0/v2.0

**v1.0/v2.0 Pattern** (DEPRECATED):
- Required explicit arguments: `mediaUrl`, `mediaType`, `conversationId`, `contactName`
- AI Employee had to extract media URL from Bird variables
- Manual type detection via AI Employee logic

**v3.0 Pattern** (CURRENT):
- Zero arguments required
- Backend extracts everything automatically
- Single required field: `conversationId` from Context

---

## Quick Start

**5-Step Configuration Flow**:

1. **General Configuration** (5 min) - Create AI Employee profile and connector
2. **Personality Configuration** (15 min) - Define purpose, tasks, tone
3. **Actions Configuration** (20 min) - Configure process_media Action
4. **Environment Variables** (5 min) - Set NEERO_API_KEY, BIRD_ACCESS_KEY
5. **Testing & Validation** (10 min) - Test with real WhatsApp media

**Expected Outcomes**:
- AI Employee automatically processes media attachments
- Response time < 9 seconds
- Structured data extraction (names, IDs, transcripts)
- Spanish responses with clear formatting

---

## Step 1: General Configuration (5 min)

**Navigation**: Bird Dashboard > AI Employees > Create New

![General Settings](bird-ui-actions-captures/Screenshot%202026-01-22%20at%201.00.39%20PM.png)

### 1.1 Profile

| Field | Value | Notes |
|-------|-------|-------|
| Name | Multimedia Assistant | Descriptive name |
| Description | Asistente multimodal para WhatsApp | Brief description |
| Avatar | Upload image | Optional brand logo |

![Profile Configuration](bird-ui-actions-captures/Screenshot%202026-01-22%20at%201.01.02%20PM.png)

### 1.2 Connector

| Field | Value |
|-------|-------|
| LLM Provider | OpenAI |
| Connector Name | OpenAI2025 |

**Note**: Ensure connector is configured before proceeding (green checkmark).

---

## Step 2: Personality Configuration (15 min)

**Navigation**: AI Employee > Behavior > Personality

![Personality Section](bird-ui-actions-captures/Screenshot%202026-01-22%20at%201.01.22%20PM.png)

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

![Personality Configuration](bird-ui-actions-captures/Screenshot%202026-01-22%20at%201.01.42%20PM.png)

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

PROTOCOLO DE ARCHIVOS ADJUNTOS (OBLIGATORIO):
1. Cuando el paciente envía una imagen, video, audio o documento:
   - SIEMPRE llamar la action 'process_media' inmediatamente
   - NO requiere argumentos (completamente automático)
   - Esperar la respuesta antes de continuar la conversación

2. Usar el resultado para informar al paciente:
   - Imágenes (cédulas): Confirmar nombre y número extraídos
   - Audio: Confirmar que se transcribió correctamente
   - Documentos: Confirmar que se procesó el contenido

3. EJEMPLO:
   Paciente: [envía foto de cédula]
   Eva: [llama process_media automáticamente]
   Eva: "Perfecto, he recibido tu cédula.
         Nombre: Juan Pérez
         Cédula: 12345678
         ¿Confirmas que los datos son correctos?"
```

### 2.6 Guardrails

**Navigation**: AI Employee > Behavior > Guardrails

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

## Step 3: Actions Configuration (20 min)

**Navigation**: AI Employee > Actions > Main task > Setup flow

![Actions Section](bird-ui-actions-captures/Screenshot%202026-01-22%20at%201.02.02%20PM.png)

### 3.1 Create Action

1. Click "Main task" > "+ Add action"
2. Name: `process_media`
3. Description: `Process image, audio, or document via api-neero`
4. Click "Setup flow"

![Create Action](bird-ui-actions-captures/Screenshot%202026-01-22%20at%201.03.14%20PM.png)

### 3.2 Task Arguments (v3.0 - ZERO ARGUMENTS)

**CRITICAL**: Remove ALL arguments. v3.0 requires zero arguments.

**Old (v2.x)** - DELETE THESE:
- `mediaUrl` - DELETE
- `mediaType` - DELETE
- `conversationId` - DELETE
- `contactName` - DELETE

**New (v3.0)** - ZERO arguments configured:
- No arguments tab configuration needed
- Backend extracts everything automatically

![Arguments Configuration](bird-ui-actions-captures/Screenshot%202026-01-22%20at%201.03.25%20PM.png)

**Why Zero Arguments?**:
- Backend extracts `mediaUrl` from conversation via Bird Conversations API
- Backend auto-detects `mediaType` from message `contentType`
- Context variables provide `conversationId` automatically

### 3.3 HTTP Request Step

**Configuration**:
- Method: `POST`
- URL: `https://api.neero.ai/api/bird`
- Content-Type: `application/json`

![HTTP Request Configuration](bird-ui-actions-captures/Screenshot%202026-01-22%20at%201.03.34%20PM.png)

**Headers**:
```
X-API-Key: {{env.NEERO_API_KEY}}
```

**Note**: X-API-Key is optional. If not using API key authentication, leave headers empty.

![Headers Configuration](bird-ui-actions-captures/Screenshot%202026-01-22%20at%201.03.44%20PM.png)

**Body (JSON editor)**:

**Recommended Format** (v3.0):
```json
{
  "context": {
    "conversationId": "{{context.conversation.id}}"
  }
}
```

**Alternative Format** (also works):
```json
{
  "conversationId": "{{context.conversation.id}}"
}
```

Both formats produce the same result. Backend normalizes the request automatically.

![Body Configuration](bird-ui-actions-captures/Screenshot%202026-01-22%20at%201.03.55%20PM.png)

**IMPORTANT**: Use `{{` dropdown selector to insert variables. Do NOT manually type variable names.

![Variable Selector](bird-ui-actions-captures/Screenshot%202026-01-22%20at%201.04.02%20PM.png)

### 3.4 Context Variables Reference

**Available in Bird Actions**:

| Variable | Source | Use |
|----------|--------|-----|
| `{{context.conversation.id}}` | Bird | conversationId (REQUIRED) |
| `{{context.contact.name}}` | Bird | contactName (optional) |
| `{{env.NEERO_API_KEY}}` | Settings | API authentication |

**NOT needed in v3.0**:
- `{{messageImage}}` - Backend extracts automatically
- `{{messageAudio}}` - Backend extracts automatically
- `{{messageFile}}` - Backend extracts automatically

### 3.5 Save Action

1. Click "Save" or "Update" button
2. Verify Action status changes to "Published"
3. Verify Action appears in AI Employee's available actions

![Published Action](bird-ui-actions-captures/Screenshot%202026-01-22%20at%201.04.31%20PM.png)

---

## Step 4: Environment Variables (5 min)

**Navigation**: Bird Dashboard > Settings > Environment Variables

### Required Variables

| Variable Name | Type | Value | Notes |
|---------------|------|-------|-------|
| `NEERO_API_KEY` | Secret | `nro_prod_abc123...` | From api-neero deployment |
| `BIRD_ACCESS_KEY` | Secret | `AccessKey xyz...` | Required for Conversations API |
| `BIRD_WORKSPACE_ID` | Secret | `workspace-uuid` | Required for Conversations API |

**Setup Steps**:
1. Click "+ Add variable"
2. Enter variable name (exactly as shown)
3. Select "Secret" type
4. Paste value
5. Click "Save"
6. Repeat for all variables

![Environment Variables](bird-ui-actions-captures/Screenshot%202026-01-22%20at%201.04.40%20PM.png)

---

## Step 5: Testing & Validation (10 min)

### 5.1 Manual Test from Bird UI

**Setup**:
1. Open a test conversation in Bird Inbox
2. Ensure conversation has a recent media attachment from patient
3. Note the conversation ID

**Execute**:
1. In conversation view, find Actions dropdown
2. Select "process_media"
3. **Verify**: No arguments should be requested (0 configured)
4. Click "Run" or "Execute"

**Expected Result**:
- Response received in < 9 seconds
- Response JSON format:
  ```json
  {
    "success": true,
    "type": "image",
    "data": {
      "name": "Juan Pérez",
      "documentId": "12345678",
      "documentType": "cédula",
      ...
    },
    "processingTime": "5.2s",
    "model": "gemini-2.0-flash"
  }
  ```

### 5.2 WhatsApp Test

**Test Cases**:

1. **Image (cédula)**:
   - Send photo of Colombian ID card
   - Expect: Extracted name, ID number, issue date
   - Response time: 4-5s

2. **Audio (voice note)**:
   - Send Spanish voice note (15-30s)
   - Expect: Complete Spanish transcript
   - Response time: 3-4s

3. **Document (PDF)**:
   - Send PDF document
   - Expect: Extracted text, page count
   - Response time: 5-6s

### 5.3 Validation Checklist

**Before Configuration**:
- [ ] Backend v3.0 deployed to Vercel
- [ ] `BIRD_ACCESS_KEY` environment variable set
- [ ] `BIRD_WORKSPACE_ID` environment variable set
- [ ] Test conversation with media attachment ready
- [ ] AI Employee created and active

**After Configuration**:
- [ ] Action "process_media" has 0 arguments
- [ ] HTTP Request Body uses `{{context.conversation.id}}`
- [ ] Action status is "Published"
- [ ] Manual test: Call Action from Bird UI → Success response
- [ ] Test image → Response `type=image` with extracted data
- [ ] Test audio → Response `type=audio` with transcript
- [ ] Test video/PDF → Response `type=document` with text
- [ ] Response time < 9 seconds
- [ ] AI Employee automatically calls Action when patient sends attachment

---

## Troubleshooting

### Error: "No media messages from contact found"

**Cause**: No attachment messages from patient in last 5 messages

**Solutions**:
1. **Verify attachment**: Ensure patient actually sent media recently
2. **Timing**: If many bot messages between attachment and action call, increase limit
3. **Fix**: Edit `lib/bird/fetch-latest-media.ts:157`:
   ```typescript
   // Before
   const url = `...?limit=5`;

   // After (for longer conversations)
   const url = `...?limit=10`;
   ```
4. **Redeploy**: Push change to Vercel

---

### Error: "Could not extract media URL"

**Cause**: Message structure doesn't match expected schema

**Solutions**:
1. **Check message type**: Use Bird Conversations API to inspect actual message:
   ```bash
   curl -X GET "https://api.bird.com/workspaces/{WORKSPACE_ID}/conversations/{CONVERSATION_ID}/messages?limit=1" \
     -H "Authorization: AccessKey {ACCESS_KEY}"
   ```
2. **Verify schema**: Check `lib/bird/fetch-latest-media.ts` for supported structures
3. **Add support**: If new media type, update `extractMediaFromMessage()` function
4. **Report**: Document new structure in `bird-whatsapp-message-structures.md`

---

### Error: Timeout (> 9 seconds)

**Cause**: Processing exceeds Bird Actions timeout budget

**Solutions**:
1. **Check model**: Verify using Gemini 2.0 Flash for simple images (faster than 2.5)
2. **Check file size**:
   - Images: < 5MB (WhatsApp limit)
   - Audio: < 25MB (WhatsApp limit)
3. **Review logs**: Identify bottleneck in Vercel logs:
   - Slow download? Check Bird CDN
   - Slow AI? Check Gemini/Groq API status
4. **Optimize**:
   - Image compression before processing
   - Consider async processing (future enhancement)

**Error Code Reference**:

| Error Code | Cause | Action |
|------------|-------|--------|
| 408 | Timeout > 9s | Reduce media size, check logs |
| 401 | Invalid X-API-Key | Verify NEERO_API_KEY env var |
| 403 | CDN auth failed | Add BIRD_ACCESS_KEY env var |
| 404 | Conversation not found | Verify conversationId is valid |
| 500 | Internal error | Check Vercel logs, API status |

---

### Error: "Invalid variable" despite defined

**Cause**: Variables manually typed, not selected from dropdown

**Solutions**:
1. **Delete** manually typed variable
2. **Use** `{{` dropdown selector to insert variables
3. **Verify** variable turns blue/highlighted after insertion
4. **Save** and test again

---

### Error: "context: Required"

**Cause**: Missing `conversationId` in request body

**Solutions**:
1. **Verify** HTTP Request Body includes:
   ```json
   {
     "context": {
       "conversationId": "{{context.conversation.id}}"
     }
   }
   ```
2. **Check** variable selector used (not manually typed)
3. **Test** Action manually to verify body structure

---

### AI Employee NOT calling Action automatically

**Cause**: Instructions don't specify when to call `process_media`

**Solutions**:
1. **Add protocol**: See Step 2.5 above (Custom Instructions section)
2. **Verify availability**: Check Action is in "Main Task" available actions list
3. **Test manually**: Call Action manually first to verify it works
4. **Check logs**: AI Employee may be calling but receiving errors (check Vercel logs)

---

### Error: "Missing BIRD_ACCESS_KEY or BIRD_WORKSPACE_ID"

**Cause**: Environment variables not configured in Vercel

**Solutions**:
1. **Go to**: Vercel Dashboard → api-neero → Settings → Environment Variables
2. **Add**:
   - `BIRD_ACCESS_KEY`: Your Bird Access Key
   - `BIRD_WORKSPACE_ID`: Your Bird Workspace ID
3. **Redeploy**: Trigger new deployment to apply changes
   ```bash
   git commit --allow-empty -m "chore: trigger redeploy for env vars"
   git push
   ```

---

## Appendix A: v3.0 Migration Guide

### Breaking Changes from v2.x

**1. Remove mediaUrl argument**:
- **Old (v2.x)**: Task argument `mediaUrl` extracted from `{{messageImage}}`, `{{messageFile}}`, or `{{messageAudio}}`
- **New (v3.0)**: API extracts media URL from conversation automatically via Bird Conversations API
- **Action**: Delete `mediaUrl` from Task Arguments configuration

**2. Make mediaType optional (recommended)**:
- **Old (v2.x)**: `"type": "{{mediaType}}"` (required, AI Employee guesses)
- **New (v3.0)**: Omit `mediaType` field entirely (API auto-detects from message)
- **Action**: Remove `mediaType` from JSON body in HTTP Request step

**3. Ensure conversationId is available**:
- **Requirement**: Required for media extraction via Bird Conversations API
- **Use**: Bird native variable `{{context.conversation.id}}` (available in all conversations)
- **Action**: Verify `conversationId` is in request body context

### Migration Checklist

**Step 1: Update Action Arguments**:
- [ ] Delete `mediaUrl` argument
- [ ] Delete `mediaType` argument (or make optional)
- [ ] Delete `contactName` argument (not needed)
- [ ] Delete `conversationId` argument (use Context variable instead)
- [ ] Result: 0 arguments configured

**Step 2: Update HTTP Request Body**:
- [ ] Replace old body with v3.0 schema:
  ```json
  {
    "context": {
      "conversationId": "{{context.conversation.id}}"
    }
  }
  ```

**Step 3: Verify Environment Variables**:
- [ ] `BIRD_ACCESS_KEY` configured (required for Conversations API)
- [ ] `BIRD_WORKSPACE_ID` configured (required for Conversations API)
- [ ] `NEERO_API_KEY` configured (optional for X-API-Key header)

**Step 4: Test**:
- [ ] Test with image attachment
- [ ] Test with audio attachment
- [ ] Test with document attachment
- [ ] Verify response time < 9 seconds

### Before/After Code Samples

**Before (v2.x)**:
```json
// Task Arguments: mediaUrl, mediaType, conversationId, contactName

// HTTP Request Body
{
  "type": "{{arguments.mediaType}}",
  "mediaUrl": "{{arguments.mediaUrl}}",
  "context": {
    "conversationId": "{{arguments.conversationId}}",
    "contactName": "{{arguments.contactName}}"
  }
}
```

**After (v3.0)**:
```json
// Task Arguments: NONE (0 arguments)

// HTTP Request Body
{
  "context": {
    "conversationId": "{{context.conversation.id}}"
  }
}
```

---

## Appendix B: Technical Reference

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    WhatsApp Patient                         │
│                 (sends image/audio/doc)                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│             Bird AI Employee (Eva Valoración)               │
│  1. Detects media attachment                                │
│  2. Calls Action: process_media                             │
│  3. Body: { context: { conversationId: "..." } }            │
└────────────────────┬────────────────────────────────────────┘
                     │ POST https://api.neero.ai/api/bird
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              api-neero Backend (Vercel Edge)                │
│                                                             │
│  Step 1: Fetch latest media from conversation              │
│    - GET /conversations/{id}/messages?limit=5              │
│    - Filter messages from contact with media               │
│    - Extract mediaUrl from latest message                  │
│    - Auto-detect mediaType from contentType                │
│                                                             │
│  Step 2: Download media from Bird CDN                      │
│    - Download file via mediaUrl                            │
│    - Convert to Buffer/base64                              │
│                                                             │
│  Step 3: Process by type                                   │
│    - image/* → Classify → Route → Process                  │
│      - photo → Gemini 2.0 Flash (4s)                       │
│      - invoice → Gemini 2.0 Flash (5s)                     │
│      - document → Gemini 2.5 Flash (5.5s)                  │
│    - audio/* → Groq Whisper v3 (3s)                        │
│    - video/*, application/pdf → Gemini 2.5 Flash (5.5s)    │
│                                                             │
│  Step 4: Return structured data                            │
└────────────────────┬────────────────────────────────────────┘
                     │ JSON Response
                     ▼
┌─────────────────────────────────────────────────────────────┐
│             Bird AI Employee (Eva Valoración)               │
│  1. Receives structured data                                │
│  2. Formats response in Spanish                             │
│  3. Sends to patient via WhatsApp                           │
└─────────────────────────────────────────────────────────────┘
```

### Request/Response Schemas

**Request (v3.0)**:
```typescript
{
  context: {
    conversationId: string (UUID)  // REQUIRED
  },
  mediaType?: 'image' | 'audio' | 'document'  // OPTIONAL
}
```

**Response**:
```typescript
{
  success: boolean,
  type: 'image' | 'audio' | 'document',
  data: {
    // Type-specific fields
    // image: name, documentId, documentType, etc.
    // audio: transcript, language, duration
    // document: text, pages, etc.
  },
  processingTime: string,  // "5.2s"
  model: string  // "gemini-2.0-flash"
}
```

### Performance Benchmarks

**Tested on**: 2026-01-22

| Media Type | Size | Model | Processing Time | Success Rate |
|------------|------|-------|-----------------|--------------|
| Image (cédula) | 2.3MB | Gemini 2.0 Flash | 4.2s | 98% |
| Image (invoice) | 1.8MB | Gemini 2.0 Flash | 4.8s | 95% |
| Image (document) | 3.1MB | Gemini 2.5 Flash | 5.5s | 99% |
| Audio (voice) | 850KB | Groq Whisper v3 | 3.1s | 99% |
| Video (mp4) | 4.2MB | Gemini 2.5 Flash | 5.8s | 92% |
| PDF | 1.2MB | Gemini 2.5 Flash | 5.2s | 94% |

**Notes**:
- All times include: fetch messages (0.3s) + download (0.5-1s) + processing
- Success rate based on correct data extraction
- Budget: 8.5s max (0.5s buffer before 9s timeout)

### Cost Analysis

**vs Claude Sonnet 4.5** (previous implementation):

| Operation | Claude Cost | Gemini Cost | Savings |
|-----------|-------------|-------------|---------|
| Image (cédula) | $0.024 | $0.0026 | 89% |
| Audio 30s | $0.018 | $0.0012 | 93% |
| Document 3 pages | $0.032 | $0.0035 | 89% |
| **Monthly (1000 ops)** | **$24.67** | **$2.43** | **90%** |

**Groq Whisper vs OpenAI Whisper**:
- Groq: $0.00001/s (free tier)
- OpenAI: $0.006/min = $0.0001/s
- Savings: 90%

---

## References

### Internal Documentation

**For Operators**:
- This guide (bird-multimodal-config-guide.md) - Primary resource
- eva-contact-update-setup.md - Contact update Action setup

**For Developers**:
- bird-http-request-variables-analysis.md - Context variables technical analysis
- BIRD-CONTEXT-VARIABLES-REAL-DATA.md - API validation data
- bird-conversations-api-capabilities.md - Conversations API details
- bird-whatsapp-message-structures.md - Message schemas
- architecture.md - System design overview
- ai-integration.md - Gemini/Groq integration

### Code References

| File | Purpose | Lines |
|------|---------|-------|
| app/api/bird/route.ts | Main endpoint POST /api/bird | 268-289 |
| lib/bird/fetch-latest-media.ts | Extract media from conversation | 146-203 |
| lib/bird/types.ts | Zod schemas BirdActionRequest | 43-48 |
| lib/ai/pipeline.ts | Image classification and routing | Full file |
| lib/ai/transcribe.ts | Audio transcription | Full file |

### External Resources

**Official Bird Documentation**:
- [Bird AI Employees Introduction](https://bird.com/en-us/knowledge-base/ai/introduction-to-ai-employees)
- [Set Up Actions for AI Employee](https://bird.com/en-us/knowledge-base/ai/introduction-to-ai-employees/set-up-actions-for-your-ai-employee)
- [HTTP Request in Flow Builder](https://developers.messagebird.com/tutorials/http-request-in-flow-builder)
- [AI Flow Actions](https://docs.bird.com/applications/ai-features/ai/concepts/ai-flow-actions)
- [Available Variables](https://docs.bird.com/connectivity-platform/faq/what-are-available-variables)

**AI Providers**:
- [Gemini 2.0 Flash Pricing](https://ai.google.dev/pricing)
- [Groq Whisper Documentation](https://console.groq.com/docs/speech-text)

---

**Estimated Configuration Time**: 45-60 minutes (first setup)
**Difficulty**: Medium (UI configuration only, no code changes)
**Support**: [email protected]
