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

### 4.1 Action Structure

```
Main task
└── Action: process_media
    ├── Name: process_media
    ├── Description: Process multimedia via api-neero
    └── Steps:
        ├── Arguments (trigger parameters)
        └── Http request (API call)
```

### 4.2 Create New Action

1. Click "Main task"
2. Click "+ Add action"
3. Fill fields:
   - **Name:** `process_media`
   - **Description:** `Process image, audio, or document via api-neero`
4. Click "Setup flow"

### 4.3 Task Arguments Configuration

**Purpose:** Define custom input parameters that AI Employee will populate (CRITICAL STEP)

**IMPORTANT:** Task Arguments are NOT Bird native variables. The AI Employee must set these values before calling the Action.

#### Add Task Arguments in Configuration Section

Click the **"+" button** in the Configuration section and add each argument:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `mediaType` | string | Yes | AI Employee sets to: "image", "document", or "audio" |
| `mediaUrl` | string | Yes | AI Employee extracts appropriate media URL |
| `conversationId` | string | Yes | Conversation UUID (from Bird context) |
| `contactName` | string | Yes | Contact display name (from Bird context) |

**Steps:**
1. In Arguments step, click "Configuration" section
2. Click "+" to add new argument
3. Enter **Name** (exactly as shown above)
4. Select **Type** (string)
5. Repeat for ALL 4 task arguments
6. Verify no validation errors

**Critical Distinction:**
- **Bird Native Variables** (`{{messageImage}}`, `{{messageFile}}`, `{{messageAudio}}`) are ONLY available in Flow Builder triggers, NOT in AI Employee Actions
- **Task Arguments** (`mediaType`, `mediaUrl`) must be manually defined and populated by the AI Employee before calling this Action

**How AI Employee Populates Arguments:**

The AI Employee must determine `mediaType` and `mediaUrl` based on the message received:

```
If user sends image:
  - Set mediaType = "image"
  - Set mediaUrl = value from messageImage

If user sends document/PDF:
  - Set mediaType = "document"
  - Set mediaUrl = value from messageFile

If user sends audio/voice note:
  - Set mediaType = "audio"
  - Set mediaUrl = value from messageAudio
```

**Common Errors:**
- `"invalid variable: conversationMessageType"` → This variable doesn't exist in Bird (use `mediaType` instead)
- `"type: Required, mediaUrl: Required"` → AI Employee didn't populate task arguments before calling Action

### 4.4 Http Request Configuration

Click "+ Add step" > "Http request"

#### Operation

| Field | Value |
|-------|-------|
| Method | POST |

#### Configuration

| Field | Value |
|-------|-------|
| URL | `https://api.neero.ai/api/bird` |
| Follow redirect | OFF (unchecked) |
| Content type | application/json |

#### Headers

Click "+ Add header" and add:

| Key | Value |
|-----|-------|
| X-API-Key | `{{env.NEERO_API_KEY}}` |

**Note:** Use `{{env.VARIABLE}}` syntax for environment variables.

#### Request Body

Click "switch to JSON editor" and paste:

```json
{
  "type": "{{mediaType}}",
  "mediaUrl": "{{mediaUrl}}",
  "context": {
    "conversationId": "{{conversationId}}",
    "contactName": "{{contactName}}"
  }
}
```

**IMPORTANT - Variable Insertion:**
- Do NOT manually type variable names like `{{mediaType}}`
- Instead: Click in field > type `{{` > SELECT variable from dropdown that appears
- Variables from Arguments step should appear in "Available variables" dropdown
- If dropdown shows `Arguments.mediaType`, use that full path
- If you manually type variables, you may get `"invalid variable"` errors

**What These Variables Are:**
- `{{mediaType}}` → Task Argument populated by AI Employee ("image", "document", or "audio")
- `{{mediaUrl}}` → Task Argument populated by AI Employee (extracted from Bird native variables)
- `{{conversationId}}` → Task Argument from Bird conversation context
- `{{contactName}}` → Task Argument from Bird contact info

**How It Works:**
1. User sends media to AI Employee via WhatsApp
2. Bird provides native variables: `messageImage`, `messageFile`, `messageAudio`
3. AI Employee determines media type and extracts appropriate URL
4. AI Employee sets task arguments: `mediaType` and `mediaUrl`
5. AI Employee calls this Action with populated arguments
6. HTTP Request uses task arguments to call api-neero

### 4.5 Validate and Save

- Ensure no validation errors (0 errors)
- Click "Save" to persist action
- Return to AI Employee main page

### 4.6 AI Employee Configuration for Task Arguments

**Purpose:** Configure the AI Employee to populate task arguments before calling the Action.

#### Update Custom Instructions (Step 2.5)

Add this section to the AI Employee's Custom Instructions:

```
BEFORE CALLING process_media ACTION:
1. Determine media type from message:
   - If user sent image → Set mediaType = "image"
   - If user sent document/PDF → Set mediaType = "document"
   - If user sent audio/voice note → Set mediaType = "audio"

2. Extract media URL:
   - For images: Use {{messageImage}} value
   - For documents: Use {{messageFile}} value
   - For audio: Use {{messageAudio}} value

3. Set task arguments:
   - mediaType: The determined type ("image", "document", or "audio")
   - mediaUrl: The extracted URL
   - conversationId: {{conversationId}}
   - contactName: {{contact.name}}

4. Call process_media Action with these arguments

CRITICAL: Never call the Action without setting ALL 4 task arguments first.
```

#### How Bird AI Employees Handle This

Bird AI Employees can:
- Access Bird native variables (`{{messageImage}}`, etc.)
- Determine context from conversation
- Set task argument values programmatically
- Call Actions with populated arguments

**Example Flow:**
1. User sends image via WhatsApp
2. AI Employee detects `{{messageImage}}` has a value
3. AI Employee sets: `mediaType = "image"`, `mediaUrl = {{messageImage}}`
4. AI Employee calls `process_media` Action
5. Action receives task arguments and calls api-neero
6. API processes image and returns results
7. AI Employee formats response for user

### 4.7 Alternative: Custom Function (If HTTP Request Fails)

**Use this if:** Variables arrive empty at API despite correct configuration.

**Why:** AI Employee Actions may have different variable scope than Flow Builder. Custom Function has direct access to `variables` object.

#### Replace HTTP Request with Custom Function

1. In Action flow, delete "Http request" step
2. Click "+ Add step" > "Call my function"
3. Click "Create new function"
4. Name: `process_media_function`
5. Paste this code:

```javascript
exports.handler = async function (context, variables) {
  const axios = require('axios');

  // Get media URL (only one will have value)
  const mediaUrl = variables.messageImage ||
                   variables.messageAudio ||
                   variables.messageFile;

  const type = variables.conversationMessageType;

  // Call api-neero
  const response = await axios.post('https://api.neero.ai/api/bird', {
    type,
    mediaUrl,
    context: {
      conversationId: variables.conversationId,
      contactName: variables.contact?.name,
      timestamp: new Date().toISOString()
    }
  }, {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': context.env.NEERO_API_KEY
    },
    timeout: 9000  // 9 second max
  });

  return {
    success: true,
    data: response.data
  };
};
```

6. Click "Save function"
7. In Action flow, select the new function
8. Test with real media

**Advantages:**
- Direct access to variables without interpolation issues
- More control over error handling
- Works with AI Employee Actions scope

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

## Bird Variables vs Task Arguments Reference

### Bird Native Variables (Flow Builder Context ONLY)

**IMPORTANT:** These variables are available in Flow Builder triggers but NOT automatically in AI Employee Actions.

| Variable | Description | Availability |
|----------|-------------|--------------|
| `{{messageImage}}` | Image URL from WhatsApp | Flow Builder triggers, AI Employee can access |
| `{{messageAudio}}` | Audio URL from WhatsApp | Flow Builder triggers, AI Employee can access |
| `{{messageVideo}}` | Video URL from WhatsApp | Flow Builder triggers, AI Employee can access |
| `{{messageFile}}` | Document/PDF URL | Flow Builder triggers, AI Employee can access |
| `{{conversationMessageContent}}` | Text message content | Flow Builder triggers, AI Employee can access |
| `{{contact.name}}` | Contact name | Flow Builder triggers, AI Employee can access |
| `{{conversationId}}` | Conversation UUID | Flow Builder triggers, AI Employee can access |
| `{{currentTime}}` | Current timestamp | Universal |
| `{{env.VARIABLE}}` | Environment variable | Universal |

**NOT a Bird variable:**
- `{{conversationMessageType}}` - This does NOT exist in Bird's documentation

### Task Arguments (Manually Defined in Actions)

These must be defined in Arguments Configuration and populated by AI Employee:

| Argument | Type | Description |
|----------|------|-------------|
| `mediaType` | string | Set by AI Employee: "image", "document", or "audio" |
| `mediaUrl` | string | Set by AI Employee: extracted from Bird native variables |
| `conversationId` | string | Set by AI Employee: from `{{conversationId}}` |
| `contactName` | string | Set by AI Employee: from `{{contact.name}}` |

**How It Works:**
1. Bird provides native variables (`messageImage`, etc.) to AI Employee
2. AI Employee accesses these and determines media type
3. AI Employee sets Task Arguments (`mediaType`, `mediaUrl`)
4. AI Employee calls Action with Task Arguments
5. Action uses Task Arguments in HTTP Request

**Usage:** Type `{{` in any field to see available variables dropdown.

---

## Testing Procedures

### Test 1: Image Analysis (Photo)

**WhatsApp:**
1. Send image to AI Employee WhatsApp number
2. Wait 5-9 seconds (processing time)
3. Expect: Spanish description of image contents

**cURL Test:**

```bash
curl -X POST https://api.neero.ai/api/bird \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "type": "image",
    "mediaUrl": "https://example.com/photo.jpg",
    "context": {"conversationId": "test-001"}
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "description": "Foto de una persona en un parque...",
    "objects": ["persona", "arbol", "banco"],
    "confidence": 0.95
  },
  "type": "photo",
  "processingTime": 4200
}
```

### Test 2: Audio Transcription

**WhatsApp:**
1. Send voice note in Spanish
2. Wait 3-5 seconds
3. Expect: Full transcription

**cURL Test:**

```bash
curl -X POST https://api.neero.ai/api/bird \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "type": "audio",
    "mediaUrl": "https://example.com/voice.ogg",
    "context": {"conversationId": "test-002"}
  }'
```

### Test 3: Document Extraction (Invoice)

**WhatsApp:**
1. Send invoice image/PDF
2. Wait 5-9 seconds
3. Expect: Extracted fields (vendor, NIT, total, items)

---

## Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| `invalid variable: conversationMessageType` | Variable doesn't exist in Bird | Use `mediaType` Task Argument instead (section 4.3) |
| `invalid variable: mediaType` | Task Argument not defined | Add ALL 4 task arguments in section 4.3 |
| `type: Required, mediaUrl: Required` | AI Employee didn't populate arguments | Configure AI Employee (section 4.6) |
| `401 Unauthorized` | Missing/invalid X-API-Key | Verify `NEERO_API_KEY` in Bird env vars |
| `403 Forbidden` | CDN auth failed | Add `BIRD_ACCESS_KEY` env variable |
| `408 Timeout` | Processing >9s | Reduce image size, optimize |
| `422 Unprocessable` | Invalid mediaUrl | Check CDN URL format |
| `500 Internal Error` | AI model failure | Check Vercel logs for api-neero |
| `2 validation errors` | Action flow incomplete | Ensure URL and headers configured |

### Common Issues

**Issue:** `"invalid variable: conversationMessageType"` error
- **Cause:** This variable does NOT exist in Bird's documented variables
- **Root Cause:** Confusion between Bird native variables and Task Arguments
- **Solution 1:** Use `mediaType` instead (defined as Task Argument in section 4.3)
- **Solution 2:** Ensure AI Employee populates `mediaType` before calling Action (section 4.6)
- **Solution 3:** Update HTTP Request body to use `{{mediaType}}` not `{{conversationMessageType}}`
- **CRITICAL:** `conversationMessageType` is NOT a Bird variable - it was a documentation error

**Issue:** `"invalid variable"` error DESPITE arguments being defined
- **Cause:** Variables must be selected from dropdown, NOT manually typed
- **Solution 1 (RECOMMENDED):** In HTTP Request step, delete Request Body content
- **Solution 2:** Click in Request Body field and type `{{`
- **Solution 3:** Wait for dropdown to appear with "Available variables"
- **Solution 4:** SELECT variables from dropdown (don't type them manually)
- **Solution 5:** If variables DON'T appear in dropdown, try prefixed path: `{{Arguments.variableName}}`
- **Alternative:** Use "Custom Function" step instead of HTTP Request (has direct access to variables object)
- **Reference:** [Fetching Variables Documentation](https://docs.bird.com/connectivity-platform/steps-catalogue/fetching-variable-steps-in-flow-builder)

**Issue:** `"type: Required, mediaUrl: Required"` - Fields arriving empty at API
- **Cause:** AI Employee didn't populate task arguments before calling Action
- **Solution 1 (PRIMARY):** Configure AI Employee to set task arguments (section 4.6)
  - AI Employee must set `mediaType` and `mediaUrl` before calling Action
  - Update Custom Instructions to include argument population logic
- **Solution 2:** Verify task arguments are defined in Arguments Configuration (section 4.3)
  - Must have: `mediaType`, `mediaUrl`, `conversationId`, `contactName`
- **Solution 3:** If HTTP Request still fails, use **Custom Function** instead (see section 4.7)
- **Solution 4:** Verify variables are selected from dropdown, NOT typed manually
- **Reference:** See `/plan/bugs.md` for BUG-001 resolution details

**Issue:** AI Employee not responding to media
- **Solution 1:** Check WhatsApp channel is connected (General > Connector ✓)
- **Solution 2:** Verify Main task action is configured
- **Solution 3:** Test action flow manually in Flow Builder

**Issue:** Action validation errors
- **Solution 1:** Ensure URL starts with `https://`
- **Solution 2:** Verify JSON body syntax (use JSON editor)
- **Solution 3:** Check all `{{variables}}` are spelled correctly

**Issue:** Environment variable not found
- **Solution 1:** Use exact syntax: `{{env.VARIABLE_NAME}}`
- **Solution 2:** Verify variable exists in Settings > Environment Variables
- **Solution 3:** Check variable type is "Secret"

**Issue:** Media URL returns 404
- **Solution 1:** Bird CDN URLs expire after 30 days
- **Solution 2:** Test if `BIRD_ACCESS_KEY` auth required
- **Solution 3:** Use `Authorization: AccessKey {{env.BIRD_ACCESS_KEY}}` header if needed

### Debug Workflow

1. **Check Bird Logs:** Dashboard > Logs > Filter by AI Employee
2. **Check Vercel Logs:** https://vercel.com/neero/api-neero/logs
3. **Test API directly:** Use cURL with sample data
4. **Verify variables:** Use Flow Builder test mode to inspect values
5. **Check action flow:** Ensure Arguments → Http request sequence is correct

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
