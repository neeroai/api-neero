# System Architecture - Cost-Optimized Multimodal API

**Last Updated:** 2025-12-04
**Version:** 3.0.0
**Stack:** Vercel AI Gateway (Gemini) + Groq Whisper v3 (directo)

---

## Overview

Cost-optimized multimodal processing API for Bird.com AI employees. Processes images, documents, PDFs, and audio from WhatsApp conversations for corporate clients.

**Cost Savings:** 89% cheaper than Claude-based alternatives ($8.40/month vs $75+)

**AI Stack:**
- **Vision:** Vercel AI Gateway → Gemini 2.0/2.5 Flash (0% markup, failover)
- **Audio:** Groq Whisper v3 directo (AI Gateway no soporta `/audio/transcriptions`)

---

## AI Gateway vs API Directo

| Endpoint | AI Gateway | API Directo |
|----------|------------|-------------|
| `/chat/completions` | YES | - |
| `/embeddings` | YES | - |
| `/audio/transcriptions` | NO | GROQ_API_KEY |
| `/audio/speech` | NO | - |

**Decision:** Enfoque hibrido - AI Gateway para vision, Groq directo para audio.

---

## Environment Variables

**Required (Vercel):**
| Variable | Uso |
|----------|-----|
| `AI_GATEWAY_API_KEY` | Gemini via AI Gateway |
| `GROQ_API_KEY` | Whisper audio transcription |

**Optional:**
| Variable | Uso |
|----------|-----|
| `BIRD_ACCESS_KEY` | Si Bird CDN requiere auth |
| `NEERO_API_KEY` | API authentication |

**Removed:**
- ~~GOOGLE_GENERATIVE_AI_API_KEY~~ → Use AI Gateway
- ~~OPENAI_API_KEY~~ → Use AI Gateway

---

## Intelligent Image Routing

### Two-Stage Pipeline

```
Image Input → Classify (2s) → Route (<10ms) → Process (4-5.5s) → Response
               AI Gateway       In-memory      Type-specific
               Gemini 2.0       route table    processor
```

### Classification Types

| Type | Model | Timeout | Use Case |
|------|-------|---------|----------|
| photo | google/gemini-2.0-flash | 4s | People, objects, scenes |
| invoice | google/gemini-2.0-flash | 5s | Invoices, receipts, OCR |
| document | google/gemini-2.5-flash | 5.5s | Cedulas, contracts |
| unknown | google/gemini-2.0-flash | 4s | Fallback |

### Timeout Budget (8.5s total)

| Stage | Budget | Notes |
|-------|--------|-------|
| Download media | 1.0s | Bird CDN fetch |
| Classify image | 2.0s | AI Gateway |
| Route to model | <10ms | In-memory lookup |
| Process image | 5.0s | Type-specific |
| Response buffer | 0.5s | Network latency |

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        WhatsApp User                             │
│                    (Sends image/audio/PDF)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Bird AI Employee                              │
│              (Receives message, triggers Action)                 │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP POST Action
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              /api/bird (Edge Function)                           │
│  1. API Key Validation (optional, < 50ms)                       │
│  2. Download media from Bird CDN                                │
│  3. Process with AI (< 9 seconds)                               │
│  4. Return JSON response                                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                 ┌───────────┼───────────┐
                 │           │           │
                 ▼           ▼           ▼
         ┌──────────┐ ┌──────────┐ ┌──────────┐
         │   AI     │ │   AI     │ │  Groq    │
         │ Gateway  │ │ Gateway  │ │ (direct) │
         │ (images) │ │ (PDFs)   │ │ (audio)  │
         └─────┬────┘ └─────┬────┘ └─────┬────┘
               │            │            │
               └────────────┼────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │  Return JSON Response │
                └───────────────────────┘
```

---

## Component Architecture

### 1. AI Gateway Client (`lib/ai/gateway.ts`)

```typescript
import { createGateway } from 'ai';

const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY ?? '',
});

// Usage
const result = await generateText({
  model: gateway('google/gemini-2.0-flash'),
  messages: [...]
});
```

### 2. Groq Client (`lib/ai/groq.ts`)

```typescript
import { experimental_transcribe as transcribe } from 'ai';
import { createGroq } from '@ai-sdk/groq';

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

const result = await transcribe({
  model: groq.transcription('whisper-large-v3-turbo'),
  audio: audioBuffer,
  providerOptions: { groq: { language: 'es' } },
});
```

### 3. Bird Integration (`lib/bird/`)

**`lib/bird/types.ts`** - Zod schemas for Actions
**`lib/bird/media.ts`** - Download from CDN (conditional auth)

### 4. API Endpoints (`app/api/bird/`)

**`/api/bird/route.ts`** - Unified Actions endpoint
**`/api/bird/health/route.ts`** - Health check

---

## Edge Runtime Constraints

**NO Node.js APIs:**
- ❌ `fs`, `crypto.createHmac`, `Buffer`

**Web APIs Only:**
- ✅ `fetch()`, `crypto.subtle`, `Uint8Array`, `ReadableStream`

---

## 9-Second Timeout Strategy

```typescript
export const runtime = 'edge';
export const maxDuration = 9;

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const result = await processWithTimeout(
      processMedia(type, mediaUrl),
      8500  // Leave 500ms buffer
    );

    return Response.json({ success: true, data: result });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

---

## Cost Optimization

| Use Case | Model | Cost/Request | Monthly (10K) |
|----------|-------|--------------|---------------|
| Classification | google/gemini-2.0-flash | $0.00008 | $0.80 |
| Photos | google/gemini-2.0-flash | $0.00017 | $1.70 |
| Invoices | google/gemini-2.0-flash | $0.00020 | $2.00 |
| Documents | google/gemini-2.5-flash | $0.00035 | $3.50 |
| Audio | groq/whisper-large-v3-turbo | $0.00067/min | $6.70 |

**Total:** ~$8.40/month (10K images + 10K audio minutes)

---

## Key Files

**AI:**
- `lib/ai/gateway.ts` - AI Gateway client
- `lib/ai/groq.ts` - Groq Whisper client
- `lib/ai/classify.ts` - Image classifier
- `lib/ai/router.ts` - Model routing
- `lib/ai/pipeline.ts` - Two-stage orchestration
- `lib/ai/timeout.ts` - Timeout utilities

**Schemas:**
- `lib/ai/schemas/classification.ts`
- `lib/ai/schemas/photo.ts`
- `lib/ai/schemas/invoice.ts`
- `lib/ai/schemas/document.ts`

**Bird:**
- `lib/bird/types.ts` - Zod schemas
- `lib/bird/media.ts` - CDN download

**API:**
- `app/api/bird/route.ts` - Main endpoint
- `app/api/bird/health/route.ts` - Health check

---

## References

**AI Gateway:**
- https://vercel.com/ai-gateway
- https://vercel.com/docs/ai-gateway/openai-compat

**AI SDK:**
- https://ai-sdk.dev/docs/ai-sdk-core/transcription
- https://ai-sdk.dev/providers/ai-sdk-providers/groq

**Bird.com:**
- https://bird.com/docs

---

**Lines:** 200
