# Bird AI Employees Actions Architecture

**For:** api-neero implementation
**Purpose:** Document Bird Actions pattern (HTTP requests from AI Employees)
**Last Updated:** 2025-12-11

---

## Overview

Bird AI Employees can call external APIs via **Actions** (HTTP requests) to extend their capabilities. This is different from the webhook pattern where Bird sends events TO your API.

**Actions Pattern:** Bird AI Employee → HTTP POST → Your API → Response → Continue conversation

---

## Architecture Flow

```
1. User sends media via WhatsApp (image/audio/PDF)
2. Bird AI Employee receives message
3. AI Employee triggers Action (configured in Bird dashboard)
4. HTTP POST to https://api.neero.ai/api/bird
   Headers:
     Content-Type: application/json
     X-API-Key: {{env.NEERO_API_KEY}}  (optional)
   Body:
     {
       "type": "image" | "document" | "audio",
       "mediaUrl": "https://media.nest.messagebird.com/.../file",
       "context": { "email": "...", "name": "...", ... }
     }
5. API downloads media (if needed), processes with AI
6. API returns structured JSON:
   {
     "success": true,
     "data": { extracted fields },
     "processingTime": "2.3s"
   }
7. Bird AI Employee uses response data to continue conversation
```

---

## Actions vs Webhooks Comparison

| Aspect | Actions (HTTP Request) | Webhooks |
|--------|----------------------|----------|
| **Direction** | Bird calls YOUR API | Bird sends events TO you |
| **Trigger** | AI Employee logic | WhatsApp message received |
| **Authentication** | API key in headers (your choice) | HMAC signature validation |
| **BIRD_ACCESS_KEY** | Maybe (if downloading from CDN) | Required (for media download) |
| **BIRD_SIGNING_KEY** | NOT NEEDED | Required (HMAC validation) |
| **Response** | Synchronous JSON | 200 OK + background processing |
| **Use Case** | AI-driven API calls | Real-time event processing |

---

## Configuration

**See:** `/docs/bird/bird-ai-employees-setup-guide.md` for step-by-step Bird dashboard configuration

**Summary:**
- Define 4 Task Arguments: `mediaType`, `mediaUrl`, `conversationId`, `contactName`
- Configure HTTP Request to POST to `https://api.neero.ai/api/bird`
- Use dropdown selector (type `{{`) for all variables—don't manually type
- Optional: Add `email`, `pais`, `telefono` context fields

---

## Authentication

| Option | Config | Best For |
|--------|--------|----------|
| **API Key** (Recommended) | Header: `X-API-Key: {{env.NEERO_API_KEY}}` | Sensitive data, production |
| **Bearer Token** | Header: `Authorization: Bearer {{env.TOKEN}}` | OAuth flows |
| **None** | Trust network security | Public, non-sensitive only |

---

## Environment Variables

### New Architecture

```bash
# AI Services (REQUIRED)
AI_GATEWAY_API_KEY=xxx             # Vercel AI Gateway (Gemini models)
GROQ_API_KEY=xxx                   # Groq Whisper v3

# Optional Fallback
OPENAI_API_KEY=xxx                 # GPT-4o-mini

# Bird Integration (CONDITIONAL)
BIRD_ACCESS_KEY=xxx                # Only if Bird CDN requires auth

# API Authentication (OPTIONAL)
NEERO_API_KEY=xxx                  # Your custom API key
```

### Removed from Original PRD

```bash
# NOT NEEDED for Actions pattern
BIRD_SIGNING_KEY=xxx               # Only for webhook HMAC validation
BIRD_WORKSPACE_ID=xxx              # Not used in Actions
BIRD_CHANNEL_ID=xxx                # Not used in Actions
```

---

## API Endpoint Design

### POST /api/bird

**Request:**
```typescript
{
  type: 'image' | 'document' | 'audio',
  mediaUrl: string,
  context?: {
    email?: string,
    name?: string,
    pais?: string,
    telefono?: string,
    [key: string]: any
  }
}
```

**Response (Success):**
```typescript
{
  success: true,
  type: 'image' | 'document' | 'audio',
  data: {
    // For images (ID docs, invoices, etc.)
    documentType?: 'cedula' | 'passport' | 'invoice',
    extractedFields?: {
      name?: string,
      idNumber?: string,
      expiryDate?: string,
      total?: number,
      // ...
    },

    // For audio
    transcript?: string,
    language?: 'es' | 'en',

    // For documents
    text?: string,
    pages?: number
  },
  processingTime: string,  // "2.3s"
  model: string            // "gemini-2.0-flash"
}
```

**Response (Error):**
```typescript
{
  success: false,
  error: string,
  code: 'TIMEOUT' | 'INVALID_MEDIA' | 'PROCESSING_ERROR',
  processingTime: string
}
```

---

## Testing

**Step 1:** Configure HTTP Request in Bird Action (see Configuration above)

**Step 2:** Test API directly
```bash
curl -X POST https://api.neero.ai/api/bird \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_KEY" \
  -d '{"type":"image","mediaUrl":"https://example.com/photo.jpg","context":{}}'
```

**Step 3:** Test with real WhatsApp media
- Send image to AI Employee
- Verify response in 3-9 seconds
- Check Bird logs for request/response details

---

## Production Checklist

- [ ] Test media URL authentication (BIRD_ACCESS_KEY needed?)
- [ ] Configure NEERO_API_KEY in Bird environment variables
- [ ] Implement API key validation in /api/bird endpoint
- [ ] Test timeout handling (MAX 9 seconds)
- [ ] Error responses return proper JSON format
- [ ] Logging includes Bird request details (not media content)
- [ ] Rate limiting configured (if needed)
- [ ] HTTPS only (Vercel enforces this)
- [ ] Test with all media types (image, audio, PDF)
- [ ] Validate Bird can parse response JSON

---

## Implementation Example

```typescript
// app/api/bird/route.ts
export const runtime = 'edge';
export const maxDuration = 9;

export async function POST(req: Request) {
  const startTime = Date.now();

  // 1. Validate API key
  const apiKey = req.headers.get('X-API-Key');
  if (apiKey !== process.env.NEERO_API_KEY) {
    return Response.json({
      success: false,
      error: 'Unauthorized'
    }, { status: 401 });
  }

  // 2. Parse request
  const { type, mediaUrl, context } = await req.json();

  try {
    // 3. Download media (with or without BIRD_ACCESS_KEY)
    const headers = process.env.BIRD_ACCESS_KEY
      ? { Authorization: `AccessKey ${process.env.BIRD_ACCESS_KEY}` }
      : {};

    const response = await fetch(mediaUrl, { headers });
    if (!response.ok) throw new Error('Media download failed');

    const buffer = await response.arrayBuffer();

    // 4. Process with AI
    let result;
    if (type === 'image') {
      result = await processImageWithGemini(buffer);
    } else if (type === 'audio') {
      result = await processAudioWithGroq(buffer);
    }

    // 5. Return response
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);

    return Response.json({
      success: true,
      type,
      data: result,
      processingTime: `${processingTime}s`,
      model: type === 'image' ? 'gemini-2.0-flash' : 'groq-whisper-v3'
    });

  } catch (error) {
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);

    return Response.json({
      success: false,
      error: error.message,
      code: 'PROCESSING_ERROR',
      processingTime: `${processingTime}s`
    }, { status: 500 });
  }
}
```

---

## Sources

- [Bird AI Employees](https://bird.com/en-us/knowledge-base/ai/introduction-to-ai-employees)
- [Bird Flow Builder](https://docs.bird.com/applications/automation/flows)
- [HTTP Requests in Flows](https://developers.messagebird.com/tutorials/http-request-in-flow-builder)
- [Custom Functions](https://docs.bird.com/connectivity-platform/advanced-functionalities/create-and-use-custom-functions-in-flow-builder)
