# Architecture - ai-sdk-wp Template

**Updated:** 2025-11-12 | **Stack:** Next.js 16 + Edge Runtime + AI SDK 5.0 + WhatsApp v23.0

---

## Overview

Full-featured template for AI-powered WhatsApp assistants. Built on Vercel Edge Runtime for global low-latency deployment.

**Key Features:**
- Edge-first serverless architecture (<100ms latency)
- Streaming AI responses with tool calling
- WhatsApp Cloud API v23.0 integration
- HMAC signature validation (Edge-compatible)
- Rate limiting and deduplication
- Production-ready security

---

## System Architecture

```
User (WhatsApp) → Meta Servers → Vercel Edge Function
                                        ↓
                                   Validate HMAC
                                        ↓
                                   Rate Limiter
                                        ↓
                                   Deduplication
                                        ↓
                                   AI Processing (OpenAI)
                                        ↓
                                   Send Response → WhatsApp
```

---

## Runtime Decision: Edge Functions

**Choice:** Vercel Edge Runtime (V8 isolates)
**Why:** Global deployment, <100ms latency, cost optimization

**Edge Runtime Characteristics:**
- Cold start: <10ms
- Timeout: 25s (300s for streaming)
- Memory: 128MB
- APIs: Web Standard only (no Node.js `fs`, `child_process`)
- Regions: 300+ global locations

**Validated Source:** docs-global/platforms/vercel/platform-vercel.md:48-52

---

## Core Components

### 1. API Routes (Edge Functions)

**`/api/whatsapp/webhook`** - Webhook handler
- GET: Verification (Meta setup)
- POST: Message processing
- HMAC validation with Web Crypto API
- Fire-and-forget pattern (< 5 sec response)

**`/api/chat`** - AI streaming endpoint
- Streaming with ReadableStream
- Tool calling support
- Context management

**`/api/example`** - Complete echo bot example
- End-to-end flow demonstration
- Integration reference

**Validated Source:** docs-global/platforms/vercel/platform-vercel.md:76-98

### 2. Library Structure

**`lib/whatsapp/`** - WhatsApp utilities
- `messaging.ts`: Send text, buttons, lists, media
- `webhook.ts`: Webhook parsing, validation
- `media.ts`: Media handling (upload/download)
- `rate-limit.ts`: Token bucket (250 msg/sec)

**`lib/ai/`** - AI utilities
- `client.ts`: OpenAI client (cached)
- `streaming.ts`: Stream handling
- `tools.ts`: Function calling definitions
- `prompts.ts`: System prompts
- `context.ts`: Conversation management

**`lib/security/`** - Security utilities
- `crypto.ts`: HMAC-SHA256 (Web Crypto API)
- `env.ts`: Environment validation
- `sanitize.ts`: Input sanitization

**`lib/db/`** - Database patterns
- `schema.ts`: Drizzle ORM examples
- `conversations.ts`: Conversation persistence
- `users.ts`: User management

### 3. Type System

**`lib/types/whatsapp.ts`** - WhatsApp API v23.0 types
- Message types (text, interactive, media)
- Webhook event types
- Error response types

**`lib/types/ai.ts`** - AI SDK 5.0 types
- Streaming types
- Tool calling types
- Structured output types

**Validated Source:** docs-global/platforms/whatsapp/api-v23-guide.md:91-101

---

## Security Architecture

### HMAC Signature Validation

**Implementation:** Web Crypto API (Edge-compatible)

```typescript
// Validated against docs-global/platforms/vercel/platform-vercel.md:403-444
crypto.subtle.importKey() → crypto.subtle.sign() → constant-time comparison
```

**Why Web Crypto:** Node.js `crypto` not available in Edge Runtime

### Environment Validation

**Implementation:** Runtime checks on function cold start

```typescript
// Required variables verified at startup
OPENAI_API_KEY, WHATSAPP_TOKEN, WHATSAPP_PHONE_ID,
WHATSAPP_VERIFY_TOKEN, WHATSAPP_APP_SECRET
```

### Input Sanitization

**Implementation:** Zod schemas + manual sanitization

```typescript
// Remove potentially dangerous content before AI processing
sanitizeInput(text) → removeScripts() → validateLength()
```

**Validated Source:** docs-global/platforms/vercel/platform-vercel.md:399-467

---

## Performance Optimizations

### 1. Client Caching

```typescript
// Cached OpenAI client (survives function reuse)
let cachedClient: OpenAI | null = null
export function getOpenAIClient() {
  if (!cachedClient) cachedClient = new OpenAI(...)
  return cachedClient
}
```

**Why:** Avoid re-initialization on every request (saves ~50ms)

**Validated Source:** docs-global/platforms/vercel/platform-vercel.md:247-258

### 2. Rate Limiting

**Pattern:** Token bucket algorithm
**Capacity:** 250 tokens/sec (WhatsApp API limit)
**Refill:** Continuous

```typescript
// In-memory token bucket (survives across requests)
const buckets = new Map<string, TokenBucket>()
```

**Validated Source:** docs-global/platforms/vercel/platform-vercel.md:471-514

### 3. Deduplication

**Pattern:** 60-second window with message ID tracking
**Storage:** In-memory Map (Edge Function instance-level)

```typescript
// Prevent duplicate webhook processing
const processedMessages = new Map<string, number>()
```

**Why:** Meta may retry webhooks if response slow

### 4. Streaming Responses

**Pattern:** ReadableStream with chunked encoding
**Benefit:** 300s timeout (vs. 25s non-streaming)

```typescript
// Stream AI responses chunk-by-chunk
return new Response(new ReadableStream({...}), {
  headers: { 'Content-Type': 'text/event-stream' }
})
```

**Validated Source:** docs-global/platforms/vercel/platform-vercel.md:107-148

---

## WhatsApp Integration Pattern

### Fire-and-Forget Architecture

**Requirement:** WhatsApp expects < 5 sec response
**Solution:** Respond immediately, process async

```typescript
POST /webhook → Validate → Return 200 OK (< 500ms)
                              ↓
                         Process message async
                              ↓
                         Send response via API
```

**Validated Source:** docs-global/platforms/whatsapp/api-v23-guide.md:73-88

### Message Flow

1. User sends message → Meta webhook → Edge Function
2. HMAC validation (Web Crypto)
3. Rate limit check (token bucket)
4. Deduplication check (60s window)
5. AI processing (streaming)
6. Send response via WhatsApp API
7. Return 200 OK to Meta

---

## Database Strategy

**Pattern:** Optional persistence with Drizzle ORM examples
**Philosophy:** Template provides patterns, not implementation

**Provided Examples:**
- Conversation history storage
- User profile management
- Message deduplication tracking

**Users Choose:**
- Vercel Postgres
- Supabase
- PlanetScale
- No database (stateless)

---

## Error Handling Strategy

### Structured Errors

```typescript
interface ErrorResponse {
  error: { code: string; message: string; details?: unknown }
}
```

### Timeout Management

**Edge Function:** 25s timeout (300s streaming)
**Strategy:** Aggressive external API timeouts (20s for 25s function)

```typescript
fetch(url, { signal: AbortSignal.timeout(20000) })
```

**Validated Source:** docs-global/platforms/vercel/platform-vercel.md:520-559

### Graceful Degradation

**Pattern:** Fallback responses on failure

```typescript
try {
  return await generateAIResponse()
} catch (error) {
  return "Sorry, I'm having trouble right now. Please try again."
}
```

---

## Deployment Architecture

**Platform:** Vercel
**Regions:** Global (Edge Functions)
**Scaling:** Automatic (per-request pricing)

**Environment Variables:**
- Production: Vercel Dashboard
- Preview: Branch-specific overrides
- Development: `.env.local`

**Validated Source:** docs-global/platforms/vercel/platform-vercel.md:192-202

---

## References

**Validated Against:**
- docs-global/platforms/vercel/platform-vercel.md (Edge Runtime, security, optimizations)
- docs-global/platforms/whatsapp/api-v23-guide.md (Message types, webhooks, rate limits)
- docs-global/platforms/whatsapp/integration-plan.md (Implementation patterns)

**External:**
- Vercel Edge Runtime API: https://edge-runtime.vercel.app/
- WhatsApp Cloud API: https://developers.facebook.com/docs/whatsapp/cloud-api
- Vercel AI SDK: https://sdk.vercel.ai/docs
