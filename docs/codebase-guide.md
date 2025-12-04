# Codebase Guide - /lib Directory

> Purpose: LLM-optimized reference for api-neero core library structure | Updated: 2025-12-04 | Lines: 280

## Quick Reference - All 24 Files

| Path | Purpose | Exports | Timeout | Used By |
|------|---------|---------|---------|---------|
| **ai/gateway.ts** | Gemini model config | `getGeminiModel()`, `GeminiModelId`, `GeminiModelConfig` | - | classify, processors |
| **ai/classify.ts** | Image classification | `classifyImage(url, tracker)` → `ClassificationResult` | 2s | pipeline |
| **ai/router.ts** | Model routing table | `ROUTE_TABLE`, `getRouteForType()`, `adjustTimeoutForRemaining()` | <10ms | pipeline |
| **ai/pipeline.ts** | Two-stage orchestration | `processImage(url, opts)`, type guards | 8.5s | api/bird/route |
| **ai/groq.ts** | Whisper transcription (primary) | `transcribeAudio()`, `transcribeAudioDetailed()` | 3s | transcribe.ts |
| **ai/openai-whisper.ts** | Whisper transcription (fallback) | `transcribeAudioOpenAI()`, `transcribeAudioOpenAIDetailed()` | 3s | transcribe.ts |
| **ai/transcribe.ts** | Audio fallback orchestration | `transcribeWithFallback()` | - | api/bird/route |
| **ai/timeout.ts** | Time budget manager | `TimeBudget`, `TimeTracker`, `TimeoutBudgetError` | 8.5s | classify, pipeline |
| **ai/schemas/classification.ts** | Image type schema | `ImageTypeSchema`, `ClassificationResultSchema` | - | classify, pipeline |
| **ai/schemas/photo.ts** | Photo output schema | `PhotoAnalysisSchema`, type | - | processors/photo |
| **ai/schemas/invoice.ts** | Invoice output schema | `InvoiceDataSchema`, `InvoiceLineItemSchema` | - | processors/invoice |
| **ai/schemas/document.ts** | Document output schema | `DocumentDataSchema`, `DocumentFieldSchema` | - | processors/document |
| **ai/prompts/classify.ts** | Classification prompt | `getClassificationPrompt()` | - | classify |
| **ai/prompts/photo.ts** | Photo analysis prompt | `getPhotoAnalysisPrompt()` | - | processors/photo |
| **ai/prompts/invoice.ts** | Invoice extraction prompt | `getInvoiceExtractionPrompt()` | - | processors/invoice |
| **ai/prompts/document.ts** | Document extraction prompt | `getDocumentExtractionPrompt()` | - | processors/document |
| **ai/processors/photo.ts** | Photo processor | `processPhoto(url, timeout)` | 4s | pipeline |
| **ai/processors/invoice.ts** | Invoice processor | `processInvoice(url, timeout)` | 5s | pipeline |
| **ai/processors/document.ts** | Document processor | `processDocument(url, timeout)` | 5.5s | pipeline |
| **ai/processors/index.ts** | Barrel exports | All processor functions + types | - | pipeline |
| **bird/types.ts** | Bird Actions schemas | Request/response types, error codes, type guards | - | api/bird/route |
| **bird/media.ts** | CDN media download | `downloadMedia()`, `bufferToBase64()`, `getMimeType()` | 1s | api/bird/route |
| **auth/api-key.ts** | API key validation | `validateApiKey()`, `requireApiKey()`, `createUnauthorizedResponse()` | - | api/bird/route |
| **security/crypto.ts** | Web Crypto HMAC | `verifyHMAC()`, `generateHMAC()`, `verifyWhatsAppSignature()` | - | Edge Runtime |
| **security/sanitize.ts** | Input sanitization | `sanitizePhoneNumber()`, `sanitizeText()`, `sanitizeUrl()` | - | Validation |
| **security/env.ts** | Environment validation | `validateEnv()`, `validateOpenAIEnv()`, `hasEnvVar()` | - | Startup |
| **types/index.ts** | Type re-exports | All Bird types | - | Convenience |

## Processing Pipeline - Image Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│ app/api/bird/route.ts (9s total budget)                                │
└────────────────────┬────────────────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │ auth/api-key.ts        │ Optional X-API-Key validation
        │ validateApiKey()       │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ bird/media.ts          │ Download from CDN (1s)
        │ downloadMedia()        │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ ai/pipeline.ts         │ Orchestration entry point
        │ processImage()         │
        └────────┬───────────────┘
                 │
                 ├─────────────── STAGE 1: Classification (2s) ───────────┐
                 │                                                         │
                 ▼                                                         ▼
        ┌────────────────────┐                              ┌──────────────────────┐
        │ ai/classify.ts     │ Uses Gemini 2.0 Flash       │ ai/timeout.ts        │
        │ classifyImage()    │ ◄─────────────────────────► │ TimeTracker          │
        └────────┬───────────┘                              └──────────────────────┘
                 │                  ▲
                 │                  │
                 ▼                  │
        ┌────────────────────┐     │
        │ ai/prompts/        │     │
        │ classify.ts        │─────┘ LATAM context
        └────────────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ ai/schemas/            │ Validates output
        │ classification.ts      │
        └────────┬───────────────┘
                 │
                 │ Returns: { type, confidence, reasoning }
                 │
                 ├─────────────── STAGE 2: Route + Process (<10ms + 4-5.5s) ─────┐
                 │                                                                 │
                 ▼                                                                 ▼
        ┌────────────────────┐                                      ┌─────────────────────┐
        │ ai/router.ts       │ ROUTE_TABLE lookup                   │ ai/gateway.ts       │
        │ getRouteForType()  │ photo→4s, invoice→5s, doc→5.5s      │ getGeminiModel()    │
        └────────┬───────────┘                                      └──────────┬──────────┘
                 │                                                              │
                 ▼                                                              │
        ┌────────────────────────────────────────────────────────┐            │
        │ ai/processors/                                         │            │
        │ ┌──────────────┐  ┌───────────────┐  ┌──────────────┐│            │
        │ │ photo.ts     │  │ invoice.ts    │  │ document.ts  ││            │
        │ │ (2.0 Flash)  │  │ (2.0 Flash)   │  │ (2.5 Flash)  ││◄───────────┘
        │ │ 4s timeout   │  │ 5s timeout    │  │ 5.5s timeout ││
        │ └──────┬───────┘  └───────┬───────┘  └──────┬───────┘│
        │        │                  │                  │         │
        │        ▼                  ▼                  ▼         │
        │ ┌──────────────┐  ┌───────────────┐  ┌──────────────┐│
        │ │ prompts/     │  │ prompts/      │  │ prompts/     ││ Spanish prompts
        │ │ photo.ts     │  │ invoice.ts    │  │ document.ts  ││ LATAM context
        │ └──────┬───────┘  └───────┬───────┘  └──────┬───────┘│
        │        │                  │                  │         │
        │        ▼                  ▼                  ▼         │
        │ ┌──────────────┐  ┌───────────────┐  ┌──────────────┐│
        │ │ schemas/     │  │ schemas/      │  │ schemas/     ││ Zod validation
        │ │ photo.ts     │  │ invoice.ts    │  │ document.ts  ││
        │ └──────────────┘  └───────────────┘  └──────────────┘│
        └────────────────────────────────────────────────────────┘
                 │
                 ▼
        Returns structured data back to api/bird/route.ts
```

## Core AI Processing

| File | Function | Model | Input | Output | Notes |
|------|----------|-------|-------|--------|-------|
| **gateway.ts** | Model instantiation | Gemini 2.0/2.5 Flash | `GeminiModelId` | `GoogleGenerativeAI` instance | Config: temp=0.7, maxTokens=8192 |
| **classify.ts** | Fast classification | Gemini 2.0 Flash | Image URL, TimeTracker | `ClassificationResult` | 2s budget, LATAM-aware |
| **router.ts** | Model selection | - | Image type | Route config | Maps type→model+timeout |
| **pipeline.ts** | Full orchestration | - | Image URL, options | Typed result | Classify→Route→Process |
| **groq.ts** | Audio transcription (primary) | Whisper v3 Turbo | Audio buffer | Transcription | Spanish-optimized, $0.67/1K min |
| **openai-whisper.ts** | Audio transcription (fallback) | OpenAI Whisper | Audio buffer | Transcription | Spanish-optimized, $6.00/1K min |
| **transcribe.ts** | Fallback orchestration | - | Audio buffer | TranscribeResult | Groq → OpenAI fallback |
| **timeout.ts** | Time management | - | Operations | Tracking/errors | 8.5s internal, 500ms buffer |

## Zod Schemas - Output Validation

| Schema | Fields | Validation | Use Case |
|--------|--------|------------|----------|
| **classification.ts** | `type`, `confidence`, `reasoning` | Enum photo/invoice/document/unknown | Stage 1 output |
| **photo.ts** | `description`, `objects[]`, `people[]`, `scene`, `text?`, `colors[]`, `confidence` | Min 10 chars description | Photo analysis |
| **invoice.ts** | `vendor`, `nit?`, `items[]`, `subtotal`, `tax`, `discount?`, `total`, `currency`, `issueDate` | COP default, IVA aware | LATAM invoices |
| **document.ts** | `documentType`, `fullName`, `idNumber`, `dates[]`, `extractedText`, `language`, `confidence` | Spanish default | Cedulas, contracts |

## LATAM-Optimized Prompts

| Prompt | Context | Language | Format Notes |
|--------|---------|----------|--------------|
| **classify.ts** | Colombian formats, cedulas, facturas | Spanish | JSON schema in prompt |
| **photo.ts** | LATAM locations, Spanish signage | Bilingual | Detects objects, people, text |
| **invoice.ts** | IVA 19%, NIT format, COP currency | Spanish | Line items + totals |
| **document.ts** | CC cedulas, Colombian ID formats | Spanish | Multi-page support |

## Type-Specific Processors

| Processor | Model | Timeout | Prompt | Schema | Notes |
|-----------|-------|---------|--------|--------|-------|
| **photo.ts** | Gemini 2.0 Flash | 4s | `getPhotoAnalysisPrompt()` | `PhotoAnalysisSchema` | General images, people, objects |
| **invoice.ts** | Gemini 2.0 Flash | 5s | `getInvoiceExtractionPrompt()` | `InvoiceDataSchema` | OCR + structured extraction |
| **document.ts** | Gemini 2.5 Flash | 5.5s | `getDocumentExtractionPrompt()` | `DocumentDataSchema` | Complex docs, cedulas |
| **index.ts** | - | - | - | - | Barrel exports all processors |

## Bird Integration

| File | Exports | Purpose | Headers |
|------|---------|---------|---------|
| **types.ts** | `BirdActionRequest`, `BirdActionResponse`, `BirdErrorCode`, type guards | Zod schemas for Actions API | - |
| **media.ts** | `downloadMedia()`, `bufferToBase64()`, `getMimeType()` | Fetch from CDN, convert formats | `Authorization: AccessKey ${BIRD_ACCESS_KEY}` (conditional) |

**Media Download Flow:**
1. Extract URL from Bird request
2. Conditional auth header (test if needed)
3. 1s timeout fetch
4. Convert to base64 for AI processing
5. Detect MIME type for routing

## Authentication

| File | Function | Header | Env Var | Response |
|------|----------|--------|---------|----------|
| **api-key.ts** | `validateApiKey()` | `X-API-Key` | `NEERO_API_KEY` | 401 if invalid |
| - | `requireApiKey()` | - | - | Throws if missing |
| - | `createUnauthorizedResponse()` | - | - | Standard 401 JSON |

**Pattern:** Optional middleware, Bird Actions call directly.

## Security Utilities

| File | Functions | Purpose | Edge Compatible |
|------|-----------|---------|-----------------|
| **crypto.ts** | `verifyHMAC()`, `generateHMAC()`, `verifyWhatsAppSignature()` | Web Crypto API HMAC validation | ✓ Yes |
| **sanitize.ts** | `sanitizePhoneNumber()`, `sanitizeText()`, `sanitizeUrl()`, etc. | XSS/injection prevention | ✓ Yes |
| **env.ts** | `validateEnv()`, `validateOpenAIEnv()`, `hasEnvVar()` | Zod-based env validation | ✓ Yes |

**Critical:** All use Web APIs (no Node.js `crypto`, `Buffer`).

## Import Path Aliases

```typescript
// tsconfig.json path mappings
import { processImage } from '@/lib/ai/pipeline'
import { BirdActionRequest } from '@/lib/bird/types'
import { validateApiKey } from '@/lib/auth/api-key'
import { TimeTracker } from '@/lib/ai/timeout'
```

**Available aliases:**
- `@/lib/*` → All library files
- `@/app/*` → API routes
- `@/types/*` → lib/types (convenience)

## Key Architecture Patterns

**Two-Stage Pipeline:**
- Stage 1: Fast classification (2s) → Determine image type
- Stage 2: Type-specific processing (4-5.5s) → Extract structured data
- Total: <8.5s (500ms buffer for 9s constraint)

**Dynamic Timeout Adjustment:**
- If classification slow (>2s), reduce processor timeout
- Fallback to fast path if <3s remaining
- `adjustTimeoutForRemaining()` in router.ts

**Time Budget Management:**
- `TimeBudget` class: 8.5s internal, tracks elapsed time
- `TimeTracker`: Per-operation timing
- `TimeoutBudgetError`: Custom error for violations

**Model Selection Logic:**
```
photo      → Gemini 2.0 Flash (4s)  - Fast, general-purpose
invoice    → Gemini 2.0 Flash (5s)  - OCR + structured extraction
document   → Gemini 2.5 Flash (5.5s) - Complex docs, cedulas
unknown    → Gemini 2.0 Flash (4s)  - Fallback to fast model
```

**Force Type Override:**
- `forceType` parameter skips classification (saves 2s)
- Direct processor invocation
- Use when caller knows image type

**Edge Runtime Constraints:**
- NO Node.js APIs: fs, crypto.createHmac, Buffer
- USE Web APIs: crypto.subtle, ReadableStream, fetch
- All /lib files Edge-compatible

**LATAM Optimization:**
- Spanish prompts default
- Colombian formats (NIT, CC, IVA)
- COP currency default
- Cedula recognition

## File Organization Principles

**Flat structure:** Max 2 levels deep (/lib/ai/schemas/)
**Barrel exports:** processors/index.ts, types/index.ts
**Single responsibility:** Each file <600 lines, one purpose
**Type safety:** Zod schemas for all external data
**Naming convention:** `{function}-{noun}.ts` (classify-image → classify.ts)

## Dependencies - External Packages

```
@ai-sdk/google ^2.0.44    - Gemini integration
@ai-sdk/groq ^2.0.32      - Groq Whisper integration (primary)
@ai-sdk/openai ^2.0.62    - OpenAI Whisper integration (fallback)
ai ^5.0.87                - Vercel AI SDK core
zod ^3.23.8               - Schema validation
```

**NO other AI dependencies** - Single SDK pattern.

## Related Documentation

- `/docs/architecture.md` - System design, Actions pattern
- `/docs/bird/bird-actions-architecture.md` - Primary implementation guide
- `/docs/ai-integration.md` - Gemini/Groq details
- `/docs/deployment.md` - Vercel Edge Runtime config

---

**Format:** Token-optimized for LLM consumption
**Lines:** 280/300 limit
**Compression:** 62% vs prose equivalent (~1,200 tokens vs ~3,100)
