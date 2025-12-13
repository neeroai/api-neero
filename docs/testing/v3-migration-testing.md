# v3.0 Migration Testing Guide

**Version:** 3.0.0 | **Date:** 2025-12-13 | **Status:** Ready for Testing

---

## Breaking Changes Summary

### Request Schema Changes

**OLD (v2.x):**
```json
{
  "type": "image",
  "mediaUrl": "https://media.api.bird.com/...",
  "context": {
    "conversationId": "uuid"
  }
}
```

**NEW (v3.0):**
```json
{
  "mediaType": "image",
  "context": {
    "conversationId": "uuid"
  }
}
```

**Changes:**
- `type` → `mediaType` (renamed)
- `mediaUrl` → REMOVED (API fetches from conversation)
- `context.conversationId` → REQUIRED (was optional)

---

## Prerequisites

### Environment Variables (REQUIRED)

Verify these are configured in `.env.local`:

```bash
# Bird Conversations API (v3.0 - REQUIRED)
BIRD_ACCESS_KEY=3VLoMcCHqrssb4Hixg6sd6KHpC0skrvaNN6x
BIRD_WORKSPACE_ID=5cce71bc-a8f5-4201-beeb-6df0aef3cfc8

# AI Services
AI_GATEWAY_API_KEY=xxx
GROQ_API_KEY=xxx

# Optional
OPENAI_API_KEY=xxx
NEERO_API_KEY=xxx
```

---

## Local Testing Steps

### Step 1: Start Development Server

```bash
pnpm dev
```

Expected output:
```
▲ Next.js 16.0.10 (Turbopack)
- Local:        http://localhost:3000
- Environments: .env.local

✓ Starting...
✓ Ready in 1.2s
```

### Step 2: Run Automated Tests

```bash
./test-v3-api.sh
```

This script tests:
1. ✅ Valid request with new schema
2. ❌ Invalid request with old schema (should fail)
3. ❌ Missing conversationId (should fail)

### Step 3: Manual API Tests

#### Test 1: Image Processing (New Schema)

**Request:**
```bash
curl -X POST http://localhost:3000/api/bird \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${NEERO_API_KEY}" \
  -d '{
    "mediaType": "image",
    "context": {
      "conversationId": "ea4679c2-bba7-4e78-bdb7-2b8b4210d2e6"
    }
  }'
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "type": "image",
  "data": {
    "documentType": "photo|invoice|cedula|unknown",
    "description": "...",
    "extractedFields": { ... }
  },
  "processingTime": "3.2s",
  "model": "gemini-2.0-flash"
}
```

**Expected Logs:**
```
[Bird API] Fetching media from conversation ea4679c2-bba7-4e78-bdb7-2b8b4210d2e6...
[Bird API] Extracted: type=image, url=https://media.api.bird.com/...
```

#### Test 2: Document Processing

**Request:**
```bash
curl -X POST http://localhost:3000/api/bird \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${NEERO_API_KEY}" \
  -d '{
    "mediaType": "document",
    "context": {
      "conversationId": "ea4679c2-bba7-4e78-bdb7-2b8b4210d2e6"
    }
  }'
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "type": "document",
  "data": {
    "text": "Extracted text...",
    "pages": 1,
    "documentType": "cedula|passport|invoice|..."
  },
  "processingTime": "4.1s",
  "model": "gemini-2.5-flash"
}
```

#### Test 3: Audio Processing

**Request:**
```bash
curl -X POST http://localhost:3000/api/bird \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${NEERO_API_KEY}" \
  -d '{
    "mediaType": "audio",
    "context": {
      "conversationId": "test-audio-conversation-id"
    }
  }'
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "type": "audio",
  "data": {
    "transcript": "Transcribed text...",
    "language": "es"
  },
  "processingTime": "2.8s",
  "model": "whisper-large-v3-turbo",
  "fallbackUsed": false
}
```

#### Test 4: Old Schema (Should Fail)

**Request:**
```bash
curl -X POST http://localhost:3000/api/bird \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${NEERO_API_KEY}" \
  -d '{
    "type": "image",
    "mediaUrl": "https://example.com/image.jpg",
    "context": {
      "conversationId": "ea4679c2-bba7-4e78-bdb7-2b8b4210d2e6"
    }
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Invalid request body: mediaType: Required",
  "code": "VALIDATION_ERROR",
  "processingTime": "0.0s"
}
```

#### Test 5: Missing conversationId (Should Fail)

**Request:**
```bash
curl -X POST http://localhost:3000/api/bird \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${NEERO_API_KEY}" \
  -d '{
    "mediaType": "image",
    "context": {}
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Invalid request body: context.conversationId: Required",
  "code": "VALIDATION_ERROR",
  "processingTime": "0.0s"
}
```

#### Test 6: No Media Found (Error Case)

**Request:**
```bash
curl -X POST http://localhost:3000/api/bird \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${NEERO_API_KEY}" \
  -d '{
    "mediaType": "image",
    "context": {
      "conversationId": "text-only-conversation-id"
    }
  }'
```

**Expected Response (500 Internal Server Error):**
```json
{
  "success": false,
  "error": "No media messages found in conversation",
  "code": "MEDIA_EXTRACTION_ERROR",
  "processingTime": "1.2s"
}
```

---

## Validation Checklist

### Code Validation
- [x] TypeScript compilation passes (`pnpm typecheck`)
- [x] Production build succeeds (`pnpm build`)
- [x] No linting errors (`pnpm lint`)

### API Schema Validation
- [ ] New schema (mediaType + conversationId) works
- [ ] Old schema (type + mediaUrl) returns validation error
- [ ] Missing conversationId returns validation error
- [ ] mediaUrl in request is ignored (not in schema)

### Media Extraction
- [ ] Image extraction from conversation works
- [ ] Document extraction from conversation works
- [ ] Audio extraction from conversation works
- [ ] No media found returns proper error

### Error Handling
- [ ] Bird API errors are handled gracefully
- [ ] Missing env vars return proper error
- [ ] Invalid conversationId returns proper error
- [ ] Timeout errors handled correctly

### Performance
- [ ] Image processing < 9s
- [ ] Document processing < 9s
- [ ] Audio processing < 9s
- [ ] Total response time within Edge Runtime limits

---

## Known Test Conversations

From Bird API exploration:

**Conversation with Image:**
- ID: `ea4679c2-bba7-4e78-bdb7-2b8b4210d2e6`
- Latest media: Image message
- Use for: Image processing tests

**Conversation with Document:**
- ID: `ea4679c2-bba7-4e78-bdb7-2b8b4210d2e6`
- Latest media: Excel file (Malla plataforma Crea.xlsx)
- Use for: Document processing tests

---

## Troubleshooting

### Error: Missing BIRD_ACCESS_KEY or BIRD_WORKSPACE_ID

**Cause:** Environment variables not configured

**Fix:** Add to `.env.local`:
```bash
BIRD_ACCESS_KEY=3VLoMcCHqrssb4Hixg6sd6KHpC0skrvaNN6x
BIRD_WORKSPACE_ID=5cce71bc-a8f5-4201-beeb-6df0aef3cfc8
```

### Error: Bird API error: 401 Unauthorized

**Cause:** Invalid BIRD_ACCESS_KEY

**Fix:** Verify access key in Bird dashboard or contact support

### Error: No media messages found in conversation

**Cause:** Conversation has no media or only text messages

**Fix:** Use a conversation ID with actual media messages (see Known Test Conversations)

### Error: Could not extract media URL from latest message

**Cause:** Message structure doesn't match expected schemas

**Fix:** Check message structure in Bird API and update schemas if needed

---

## Next Steps

After local testing passes:

1. **Deploy to Vercel**
   - Push changes to main branch
   - Vercel auto-deploys
   - Configure env vars in Vercel dashboard

2. **Update Bird Action Configuration**
   - Update HTTP Request body to new schema
   - Remove mediaUrl from Task Arguments
   - Test with real WhatsApp conversations

3. **Production Testing**
   - Send image via WhatsApp → Verify processing
   - Send document via WhatsApp → Verify processing
   - Send audio via WhatsApp → Verify processing

---

## Migration Checklist for Bird Dashboard

### Task Arguments (Remove mediaUrl)

**OLD:**
- `mediaType` (string)
- `mediaUrl` (string) ← REMOVE THIS
- `conversationId` (string)
- `contactName` (string)

**NEW:**
- `mediaType` (string)
- `conversationId` (string)
- `contactName` (string)

### HTTP Request Body

**OLD:**
```json
{
  "type": "{{Arguments.type}}",
  "mediaUrl": "{{Arguments.mediaUrl}}",
  "context": {
    "conversationId": "{{conversationId}}",
    "contactName": "{{Arguments.contactName}}"
  }
}
```

**NEW:**
```json
{
  "mediaType": "{{Arguments.mediaType}}",
  "context": {
    "conversationId": "{{conversationId}}",
    "contactName": "{{Arguments.contactName}}"
  }
}
```

### AI Employee Instructions

Update instructions to:
- Detect media type from message (image/document/audio)
- Set `mediaType` task argument ONLY (no mediaUrl needed)
- API will extract media URL from conversation automatically

---

**Testing Duration:** 15-20 minutes
**Last Updated:** 2025-12-13
**Status:** Ready for manual testing
