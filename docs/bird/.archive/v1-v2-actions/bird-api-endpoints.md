# Bird API Endpoints

**Last Updated:** 2025-12-03

---

## Overview

API endpoints for Bird.com multimodal integration. All endpoints use Vercel Edge Runtime.

---

## Endpoints

### 1. Webhook Handler

**POST** `/api/bird/webhook`

Receives Bird webhook events, validates HMAC, and routes to processing endpoints.

**Headers:**
```
messagebird-signature: base64-encoded-hmac
messagebird-request-timestamp: unix-timestamp
Content-Type: application/json
```

**Request Body:** See `docs/bird/bird-webhook-format.md`

**Response:**
```json
{
  "status": "received",
  "messageId": "msg-uuid-12345"
}
```

**Response Time:** < 500ms (fire-and-forget pattern)

**Implementation:** `app/api/bird/webhook/route.ts`

---

### 2. Image Processing

**POST** `/api/bird/process/image`

Process images using Claude 3.5 Vision.

**Request:**
```json
{
  "mediaUrl": "https://media.nest.messagebird.com/...",
  "contentType": "image/jpeg",
  "prompt": "Extract name, ID number, and expiry date from this ID document"
}
```

**Response:**
```json
{
  "analysis": {
    "name": "Juan Pérez",
    "idNumber": "1234567890",
    "expiryDate": "2030-12-31"
  },
  "confidence": 0.98,
  "processingTime": 3200
}
```

**Processing Time:** 3-5 seconds

**Implementation:** `app/api/bird/process/image/route.ts`

---

### 3. Document Processing

**POST** `/api/bird/process/document`

Extract text from documents using Claude Vision OCR.

**Request:**
```json
{
  "mediaUrl": "https://media.nest.messagebird.com/...",
  "contentType": "application/pdf",
  "filename": "invoice.pdf"
}
```

**Response:**
```json
{
  "text": "Extracted text from PDF...",
  "pages": 3,
  "wordCount": 450,
  "processingTime": 6800
}
```

**Processing Time:** 5-10 seconds

**Supported Formats:** PDF, DOCX, PNG, JPG

**Implementation:** `app/api/bird/process/document/route.ts`

---

### 4. Audio Processing

**POST** `/api/bird/process/audio`

Transcribe audio using Deepgram Nova-2.

**Request:**
```json
{
  "mediaUrl": "https://media.nest.messagebird.com/...",
  "contentType": "audio/ogg",
  "language": "es"
}
```

**Response:**
```json
{
  "transcript": "Hola, necesito ayuda con mi cuenta...",
  "confidence": 0.95,
  "duration": 8.5,
  "processingTime": 4200
}
```

**Processing Time:** 3-8 seconds

**Supported Languages:** Spanish (es), English (en)

**Implementation:** `app/api/bird/process/audio/route.ts`

---

### 5. Health Check

**GET** `/api/bird/health`

Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "ok",
  "timestamp": 1701648000,
  "services": {
    "claude": "ok",
    "deepgram": "ok",
    "bird": "ok"
  }
}
```

**Response Time:** < 100ms

**Implementation:** `app/api/bird/health/route.ts`

---

## Error Responses

All endpoints return standard error format:

```json
{
  "error": "Invalid HMAC signature",
  "code": "INVALID_SIGNATURE",
  "timestamp": 1701648000
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad request (invalid payload)
- `401` - Unauthorized (HMAC validation failed)
- `500` - Internal server error
- `503` - Service unavailable (AI service down)

---

## Rate Limiting

No rate limiting implemented. Bird handles rate limiting on their side.

---

## Authentication

All endpoints require valid Bird HMAC signature in webhook requests.
Media downloads require `BIRD_ACCESS_KEY` in Authorization header.

---

**Lines:** 150
