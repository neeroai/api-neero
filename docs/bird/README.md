# Bird.com Integration Documentation

**Last Updated:** 2025-12-03

---

## Overview

Complete documentation for Bird.com multimodal API integration.

**Integration Pattern:** Bird AI Employees call our API via **HTTP Actions** (not webhooks).

See `bird-actions-architecture.md` for primary implementation pattern.

---

## Contents

**PRIMARY PATTERN:**

1. **[bird-actions-architecture.md](./bird-actions-architecture.md)** ⭐
   - Bird AI Employees HTTP Actions pattern
   - No webhooks, no HMAC validation
   - Direct API calls from Bird to our endpoint
   - Authentication options and testing guide

**REFERENCE (Webhook Pattern - Not Used):**

2. **[bird-webhook-format.md](./bird-webhook-format.md)**
   - Bird webhook payload structure (reference only)
   - Image, document, audio message formats

3. **[bird-hmac-validation.md](./bird-hmac-validation.md)**
   - Bird HMAC algorithm (reference only)
   - **NOT NEEDED for Actions pattern**

4. **[bird-api-endpoints.md](./bird-api-endpoints.md)**
   - API endpoint patterns (outdated - see actions-architecture.md)

5. **[bird-media-cdn.md](./bird-media-cdn.md)**
   - Media download from Bird CDN
   - Authentication with AccessKey (conditional)

**OTHER DOCS:**

6. **[bird-ai-employees.md](./bird-ai-employees.md)**
   - AI Employees overview, tasks, knowledge base

7. **[bird-flow-templates.md](./bird-flow-templates.md)**
   - Flow Builder examples with HTTP Actions

8. **[bird-integration-patterns.md](./bird-integration-patterns.md)**
   - Vision/STT integration examples

9. **[bird-quick-reference.md](./bird-quick-reference.md)**
   - Cheat sheet for common operations

---

## Quick Start (Actions Pattern)

### 1. Environment Setup

```bash
# .env.local
# AI Services (REQUIRED)
AI_GATEWAY_API_KEY=xxx      # Vercel AI Gateway (Gemini models)
GROQ_API_KEY=xxx

# Optional
OPENAI_API_KEY=xxx
BIRD_ACCESS_KEY=xxx         # Only if Bird CDN requires auth
NEERO_API_KEY=xxx           # Your custom API key
```

**Removed:** `BIRD_SIGNING_KEY` (not needed for Actions)

### 2. Configure Bird AI Employee Action

In Bird dashboard:
1. Create AI Employee
2. Add Action → HTTP Request
3. Configure:
   - Method: POST
   - URL: `https://api.neero.ai/api/bird`
   - Headers: `X-API-Key: {{env.NEERO_API_KEY}}`
   - Body: See `bird-actions-architecture.md`

### 3. Test

1. Send media via WhatsApp
2. AI Employee triggers Action
3. Check API logs for request
4. Verify JSON response

---

## Architecture Flow (Actions Pattern)

```
WhatsApp User → Bird.com → Bird AI Employee
                                  ↓
                         Triggers HTTP Action
                                  ↓
                    POST /api/bird (our API)
                                  ↓
                    Download media from URL
                                  ↓
               ┌──────────────────┼──────────────────┐
               ↓                  ↓                  ↓
        Gemini 2.0 Flash    Gemini PDF       Groq Whisper v3
         (images)          (documents)         (audio)
               ↓                  ↓                  ↓
               └──────────────────┼──────────────────┘
                                  ↓
                      Return JSON response
                                  ↓
                       Bird AI Employee
                                  ↓
               Continue conversation with data
                                  ↓
                          Bird.com → WhatsApp User
```

---

## Key Constraints

1. **Response Time:** < 9 seconds (synchronous JSON response)
2. **Edge Runtime:** Web APIs only, no Node.js
3. **Authentication:** Optional API key (no HMAC)
4. **Media Auth:** Conditional AccessKey for CDN downloads
5. **File Limits:** 5MB images, 25MB audio

---

## Implementation Files (Actions Pattern)

| File | Purpose |
|------|---------|
| `lib/bird/types.ts` | Zod schemas for Actions |
| `lib/bird/media.ts` | CDN downloads (conditional auth) |
| `lib/auth/api-key.ts` | Optional API key validation |
| `lib/ai/gemini.ts` | Gemini 2.0 Flash client |
| `lib/ai/groq.ts` | Groq Whisper v3 client |
| `app/api/bird/route.ts` | Unified Actions endpoint |
| `app/api/bird/health/route.ts` | Health check |

**Removed (webhook pattern):**
- `lib/bird/crypto.ts` - HMAC not needed
- `lib/bird/webhook.ts` - No webhooks
- `lib/bird/messaging.ts` - No outbound Bird API calls

---

## Cost Estimation (New Stack)

**Per 1,000 requests:**
- Gemini 2.0 Flash (images): $0.17 (1K × $0.00017)
- Groq Whisper v3 (audio): $0.67 (1K mins × $0.00067)
- **Total:** ~$0.84 per 1K requests (89% cheaper than Claude)

---

## Support

- **Bird Docs:** https://bird.com/docs
- **Claude API:** https://docs.anthropic.com/claude/docs
- **Deepgram:** https://developers.deepgram.com/docs
- **Vercel Edge:** https://vercel.com/docs/functions/edge-functions

---

## Next Steps

1. Read `bird-actions-architecture.md` for implementation details
2. Test media URL authentication (BIRD_ACCESS_KEY needed?)
3. Configure Bird AI Employee with Actions
4. Implement `/api/bird/route.ts` endpoint
5. Test end-to-end flow with real WhatsApp messages
6. Deploy to Vercel

See `plan.md` and `prd.md` for detailed specs.

---

**Lines:** 100
