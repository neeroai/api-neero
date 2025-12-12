# Neero Multimodal API for Bird AI Employees

Cost-optimized multimodal processing API for WhatsApp business via Bird.com. Process images, documents, and audio in <9 seconds with intelligent routing.

**Version:** 2.2.3 | **Production:** https://api.neero.ai | **Cost Savings:** 89% cheaper than Claude alternatives

---

## Features

### Intelligent Image Routing
Two-stage pipeline automatically selects the optimal model based on image type:

| Type | Model | Timeout | Use Case |
|------|-------|---------|----------|
| **photo** | Gemini 2.0 Flash | 4s | People, objects, scenes, general images |
| **invoice** | Gemini 2.0 Flash | 5s | Invoices, receipts, OCR text extraction |
| **document** | Gemini 2.5 Flash | 5.5s | Cedulas, contracts, policies, complex docs |
| **unknown** | Gemini 2.5 Flash | 5.5s | Fallback for unclassified images |

**Pipeline:** `Image → Classify (2s) → Route (<10ms) → Process (4-5.5s) → Response`

### Multimodal Processing

**Image Analysis:**
- ID documents (cedulas, passports) - Extract name, ID number, expiry
- Invoices/receipts - Extract vendor, NIT, total, IVA, items
- Products/clothing - Describe, categorize, identify
- General photos - Detect objects, people, scenes

**Document Processing:**
- Multi-page PDF extraction (Gemini PDF native)
- Scanned documents with OCR
- Colombian cedula recognition
- Contract and policy analysis

**Audio Transcription:**
- Spanish voice notes (LATAM-optimized)
- Groq Whisper v3 Turbo ($0.67/1K min, primary, 95% of requests)
- OpenAI Whisper ($6.00/1K min, fallback, 5% of requests)
- 228x realtime processing speed

---

## Quick Start

Configure your Bird AI Employee to call this API in 10-15 minutes.

### 1. Create AI Employee in Bird

**Bird Dashboard → AI Employees → Create New**

Configure basic settings:
- Name: Multimedia Assistant
- Connector: OpenAI
- Personality: Spanish-speaking, professional, B2B

### 2. Define Task Arguments

**AI Employee → Actions → Main task → Setup flow → Arguments**

Click "+ Add argument" for each:

| Argument Name | Type | Required | Description |
|--------------|------|----------|-------------|
| `mediaType` | string | Yes | "image", "document", or "audio" |
| `mediaUrl` | string | Yes | Media URL from Bird CDN |
| `conversationId` | string | Yes | Conversation UUID |
| `contactName` | string | Yes | Contact display name |

**CRITICAL:** These are NOT Bird native variables. The AI Employee must populate these values programmatically before calling the Action.

### 3. Configure HTTP Request

**Add step → Http request**

**Method:** POST
**URL:** `https://api.neero.ai/api/bird`
**Content-Type:** application/json

**Headers:**
```
X-API-Key: {{env.NEERO_API_KEY}}
```

**Request Body** (use variable picker, type `{{` to see dropdown):
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

**IMPORTANT:** Use the dropdown variable picker (type `{{`) - do NOT manually type variable names or you'll get `invalid variable` errors.

### 4. Configure AI Employee Logic

**AI Employee → Behavior → Personality → Custom Instructions**

Add this section:

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
   - mediaType: The determined type
   - mediaUrl: The extracted URL
   - conversationId: {{conversationId}}
   - contactName: {{contact.name}}

4. Call process_media Action with ALL 4 arguments set

CRITICAL: Never call the Action without populating ALL task arguments first.
```

### 5. Set Environment Variables

**Bird Dashboard → Settings → Environment Variables**

Add:
```
NEERO_API_KEY=your-api-key-here
```

Contact support@neero.ai to obtain your API key.

### 6. Test Integration

Send media via WhatsApp to your AI Employee:
- Image (photo, invoice, cedula)
- Voice note in Spanish
- PDF document

Expected response time: 3-9 seconds

**Complete Setup Guide:** See [docs/bird/bird-ai-employees-setup-guide.md](docs/bird/bird-ai-employees-setup-guide.md) for detailed 45-60 minute walkthrough.

---

## API Endpoint Reference

### POST /api/bird

Main endpoint for multimodal processing from Bird AI Employees.

**Headers:**
```
Content-Type: application/json
X-API-Key: your-api-key (optional but recommended)
```

**Request Body:**
```json
{
  "type": "image" | "document" | "audio",
  "mediaUrl": "https://media.nest.messagebird.com/.../file",
  "context": {
    "conversationId": "uuid",
    "contactName": "Juan Perez",
    "email": "optional@example.com"
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "description": "Extracted data based on type",
    "confidence": 0.95
  },
  "type": "photo",
  "model": "gemini-2.0-flash",
  "processingTime": "4.2s"
}
```

**Error Responses:**
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2025-12-12T10:30:00Z"
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad request (invalid type or missing mediaUrl)
- `401` - Unauthorized (invalid API key)
- `500` - Internal error (AI model failure)
- `504` - Timeout (processing exceeded 9 seconds)

**Example cURL:**
```bash
curl -X POST https://api.neero.ai/api/bird \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-key" \
  -d '{
    "type": "image",
    "mediaUrl": "https://example.com/photo.jpg",
    "context": {
      "conversationId": "test-001",
      "contactName": "Test User"
    }
  }'
```

---

## Bird AI Employee Configuration

### Understanding Task Arguments vs Bird Variables

**Bird Native Variables** (available to AI Employee):
- `{{messageImage}}` - Image URL from WhatsApp
- `{{messageFile}}` - Document/PDF URL
- `{{messageAudio}}` - Audio/voice note URL
- `{{contact.name}}` - Contact display name
- `{{conversationId}}` - Conversation UUID

**Task Arguments** (manually defined, AI Employee populates):
- `mediaType` - AI Employee determines from message type
- `mediaUrl` - AI Employee extracts from native variables
- `conversationId` - AI Employee gets from Bird context
- `contactName` - AI Employee gets from Bird context

**Key Principle:** Bird native variables are NOT automatically passed to Actions. The AI Employee must:
1. Access Bird native variables
2. Determine media type and extract URL
3. Populate Task Arguments
4. Call Action with arguments

### Variable Selection Best Practice

When configuring the HTTP Request body:
1. Click in the field where you want to insert a variable
2. Type `{{` (two opening braces)
3. Wait for dropdown to appear
4. SELECT the variable from dropdown (don't type manually)
5. If variable shows as `Arguments.mediaType`, use that full path

**Never manually type variable names** - this causes `invalid variable` errors.

**Reference:** See [docs/bird/bird-variables-reference.md](docs/bird/bird-variables-reference.md) for complete variable reference.

---

## Authentication

### API Key (Optional but Recommended)

API key authentication via `X-API-Key` header provides:
- Request tracking and analytics
- Rate limiting per customer
- Security and access control

**How to Configure:**

1. **Obtain API Key:** Contact support@neero.ai
2. **Add to Bird Environment Variables:**
   - Bird Dashboard → Settings → Environment Variables
   - Name: `NEERO_API_KEY`
   - Value: Your API key
3. **Use in HTTP Request Headers:**
   ```
   X-API-Key: {{env.NEERO_API_KEY}}
   ```

**Without API Key:** The API will still process requests but with lower priority and no tracking.

---

## Testing

### Test 1: Image Analysis (WhatsApp)

1. Send photo to AI Employee WhatsApp number
2. Wait 4-6 seconds
3. Expected response: Spanish description of image contents

### Test 2: Invoice Processing (WhatsApp)

1. Send invoice image or PDF
2. Wait 5-9 seconds
3. Expected response: Vendor, NIT, total, IVA, items list

### Test 3: Audio Transcription (WhatsApp)

1. Send voice note in Spanish
2. Wait 3-5 seconds
3. Expected response: Complete transcription

### Test 4: API Direct (cURL)

**Image:**
```bash
curl -X POST https://api.neero.ai/api/bird \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_KEY" \
  -d '{
    "type": "image",
    "mediaUrl": "https://example.com/photo.jpg",
    "context": {"conversationId": "test-001"}
  }'
```

**Audio:**
```bash
curl -X POST https://api.neero.ai/api/bird \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_KEY" \
  -d '{
    "type": "audio",
    "mediaUrl": "https://example.com/voice.ogg",
    "context": {"conversationId": "test-002"}
  }'
```

**Document:**
```bash
curl -X POST https://api.neero.ai/api/bird \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_KEY" \
  -d '{
    "type": "document",
    "mediaUrl": "https://example.com/invoice.pdf",
    "context": {"conversationId": "test-003"}
  }'
```

---

## Troubleshooting

### Common Configuration Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `invalid variable: conversationMessageType` | Variable doesn't exist in Bird | Use `mediaType` Task Argument instead |
| `invalid variable: mediaType` | Task Argument not defined | Add ALL 4 task arguments (Step 2) |
| `type: Required, mediaUrl: Required` | AI Employee didn't populate arguments | Configure AI Employee logic (Step 4) |
| Variables arrive empty at API | Not selected from dropdown | Use `{{` dropdown picker, don't type manually |
| `2 validation errors` | Action flow incomplete | Verify URL and headers are configured |

### Common API Errors

| Error | HTTP | Cause | Solution |
|-------|------|-------|----------|
| `401 Unauthorized` | 401 | Missing/invalid X-API-Key | Verify `NEERO_API_KEY` in Bird env vars |
| `403 Forbidden` | 403 | CDN auth failed | Contact support for BIRD_ACCESS_KEY |
| `408 Timeout` | 504 | Processing >9 seconds | Reduce media file size |
| `422 Unprocessable` | 400 | Invalid mediaUrl format | Check CDN URL is valid Bird media URL |
| `500 Internal Error` | 500 | AI model failure | Check API status page, retry request |

### Debug Workflow

1. **Check Bird Logs:** Bird Dashboard → AI Employee → Activity Logs
2. **Verify Task Arguments:** Ensure ALL 4 arguments defined and populated
3. **Verify HTTP Request:** Check URL, headers, body format
4. **Test with cURL:** Bypass Bird to isolate API issues
5. **Check API Status:** See status page for service health

**Detailed Troubleshooting:** See [docs/bird/bird-ai-employees-setup-guide.md#troubleshooting](docs/bird/bird-ai-employees-setup-guide.md)

---

## Cost & Limits

### Pricing Comparison (10K images + 10K audio minutes/month)

| Service | Model | Rate | Monthly Cost | Usage |
|---------|-------|------|--------------|-------|
| Image (general) | Gemini 2.0 Flash | $0.17/1K | $1.53 | 90% of images |
| Image (complex) | Gemini 2.5 Flash | $0.30/1K | $0.30 | 10% of images |
| Audio (primary) | Groq Whisper v3 | $0.67/1K min | $6.70 | 95% of audio |
| Audio (fallback) | OpenAI Whisper | $6.00/1K min | $0.30 | 5% of audio |
| **TOTAL** | - | - | **$8.83/month** | - |

**Comparison:** Claude Vision alternative: ~$75+/month for same workload (89% cost savings)

### File Size Limits

| Type | Max Size | Constraint |
|------|----------|------------|
| Images | 5 MB | WhatsApp limit |
| Audio | 25 MB | WhatsApp limit |
| Documents | 100 MB | PDF processing limit |

### Processing Timeouts

**CRITICAL:** All requests must complete in MAX 9 seconds or return error.

| Type | Typical Time | Max Time |
|------|--------------|----------|
| Photo | 4-5s | 9s |
| Invoice | 5-6s | 9s |
| Document | 5.5-7s | 9s |
| Audio | 3-5s | 9s |

**If timeout occurs:** Reduce media file size or quality.

---

## Documentation & Support

### Documentation

**Bird Configuration Guides:**
- [AI Employees Setup Guide](docs/bird/bird-ai-employees-setup-guide.md) - Complete 45-60 min walkthrough
- [Bird Actions Architecture](docs/bird/bird-actions-architecture.md) - HTTP Actions pattern explained
- [Bird Variables Reference](docs/bird/bird-variables-reference.md) - Complete variable reference
- [Bird Quick Reference](docs/bird/bird-quick-reference.md) - Cheat sheet

**Technical Documentation:**
- [AI SDK Integration](docs/ai-sdk.md) - Gemini, Groq, OpenAI via Vercel AI SDK
- [Deployment](docs/deployment.md) - Vercel deployment guide
- [Development Guide](docs/development.md) - Local development, installation, commands

**API Reference:**
- Vercel AI SDK: https://ai-sdk.dev
- Google Gemini: https://ai.google.dev/gemini-api/docs
- Groq: https://groq.com/groqcloud
- Bird: https://bird.com/docs
- Next.js: https://nextjs.org/docs

### Support

**Technical Support:**
- Email: support@neero.ai
- Response time: 24-48 hours

**Bug Reports & Feature Requests:**
- GitHub Issues: https://github.com/neero/api-neero/issues

**API Status:**
- Status Page: https://status.neero.ai
- Real-time monitoring of API health and performance

---

**Version:** 2.2.3 | **Last Updated:** 2025-12-12 | **Lines:** ~345
