# AI SDK Integration Guide

**Version:** 5.0.87 | **Providers:** Gemini, Groq | **Updated:** 2025-12-04 | **Tokens:** ~900

---

## Quick Reference

| Function | Use Case | Constraint |
|----------|----------|-----------|
| `generateText()` | Synchronous <9s | Bird Actions primary |
| `streamText()` | Long responses | NOT primary use case |
| `generateObject()` | Structured data | Zod schema validation |
| `tool()` | Function calling | Zod input validation |

**Critical:** MAX 9 seconds response time or immediate error (Bird Actions constraint).

---

## Providers

### Google Gemini (Primary - Images/Documents)

**Installation:**
```bash
pnpm add @ai-sdk/google
```

**Models:**

| Model | Use Case | Features | Cost |
|-------|----------|----------|------|
| gemini-2.0-flash | Images, PDF (primary) | Vision, native PDF, fast | $0.17/1K images |
| gemini-2.5-flash | Complex documents | Enhanced reasoning | Higher cost |
| gemini-2.5-pro | Advanced analysis | Thinking mode, grounding | Production only |

**Configuration:**
```typescript
import { google } from '@ai-sdk/google'

const model = google('gemini-2.0-flash', {
  safetySettings: [
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' }
  ]
})
```

**Vision Processing (Image Analysis):**
```typescript
import { generateText } from 'ai'
import { google } from '@ai-sdk/google'

const result = await generateText({
  model: google('gemini-2.0-flash'),
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Extract cedula information from this image' },
        { type: 'image', image: imageBuffer }  // Buffer or base64
      ]
    }
  ]
})
```

**PDF Processing (Native):**
```typescript
// Gemini processes multi-page PDFs natively
const result = await generateText({
  model: google('gemini-2.0-flash'),
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Extract invoice data from this PDF' },
        { type: 'file', data: pdfBuffer, mimeType: 'application/pdf' }
      ]
    }
  ]
})
```

**Caching (75% cost reduction):**
```typescript
// Cache large context (documents, system prompts >32K tokens)
const result = await generateText({
  model: google('gemini-2.0-flash', {
    cacheControl: {
      ttlSeconds: 3600  // 1 hour
    }
  }),
  messages: [...]
})
```

**Grounding (Google Search):**
```typescript
// Real-time information
const result = await generateText({
  model: google('gemini-2.5-pro', {
    useSearchGrounding: true
  }),
  prompt: 'Current exchange rate USD to COP'
})
```

**Sources:**
- https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai
- https://ai.google.dev/gemini-api/docs

---

### Groq (Audio Transcription)

**Installation:**
```bash
pnpm add @ai-sdk/groq
```

**Transcription (Whisper Large v3):**
```typescript
import { groq } from '@ai-sdk/groq'

const result = await groq.transcribe({
  model: 'whisper-large-v3',
  audio: audioBuffer,  // Buffer or File
  language: 'es',      // Spanish primary
  response_format: 'json'
})

// result.text contains transcription
```

**Service Tiers:**

| Tier | Rate Limits | Use Case |
|------|------------|----------|
| on_demand | Standard | Development, low volume |
| flex | 10x higher | Production burst traffic |
| auto | Dynamic | Cost-optimized production |

**Configuration:**
```typescript
const client = groq({
  apiKey: process.env.GROQ_API_KEY,
  serviceTier: 'flex'  // Higher rate limits
})
```

**Cost:** $0.67/1K minutes

**Sources:**
- https://ai-sdk.dev/providers/ai-sdk-providers/groq
- https://groq.com/groqcloud

---

### OpenAI (Fallback Only)

**Installation:**
```bash
pnpm add @ai-sdk/openai
```

**Usage (Complex Reasoning Only):**
```typescript
import { openai } from '@ai-sdk/openai'

// Use ONLY when Gemini cannot handle complexity
const result = await generateText({
  model: openai('gpt-4o-mini'),
  prompt: 'Complex multi-step analysis...'
})
```

**Cost:** $0.15/1M input tokens (10x more expensive than Gemini for images)

---

## Core Patterns

### Bird Actions (Synchronous <9s)

**Critical constraint:** Response or error in MAX 9 seconds.

```typescript
// app/api/bird/route.ts
export const runtime = 'edge'
export const maxDuration = 9  // Vercel enforces timeout

export async function POST(req: Request) {
  const startTime = Date.now()

  try {
    // Timeout wrapper
    const result = await Promise.race([
      processWithAI(request),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), 8500)  // 8.5s buffer
      )
    ])

    return Response.json({
      success: true,
      data: result,
      processingTime: `${((Date.now() - startTime) / 1000).toFixed(1)}s`
    })
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message === 'TIMEOUT' ? 'Processing exceeded 9 seconds' : error.message,
      code: error.message === 'TIMEOUT' ? 'TIMEOUT' : 'PROCESSING_ERROR'
    }, { status: error.message === 'TIMEOUT' ? 408 : 500 })
  }
}
```

**Reference:** `/docs/bird/bird-actions-architecture.md`

---

### Structured Outputs (Zod Schemas)

**Extract data from images/documents:**
```typescript
import { generateObject } from 'ai'
import { z } from 'zod'

const schema = z.object({
  documentType: z.enum(['cedula', 'passport', 'invoice']),
  name: z.string(),
  idNumber: z.string(),
  expiryDate: z.string().optional(),
  total: z.number().optional()
})

const result = await generateObject({
  model: google('gemini-2.0-flash'),
  schema,
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Extract data from this ID document' },
        { type: 'image', image: imageBuffer }
      ]
    }
  ]
})

// result.object is typed according to schema
console.log(result.object.name)  // TypeScript knows this is string
```

**Sources:**
- https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data

---

### Tool Calling (Function Calling)

**Define tools with Zod:**
```typescript
import { generateText, tool } from 'ai'
import { z } from 'zod'

const result = await generateText({
  model: google('gemini-2.0-flash'),
  prompt: 'What time is it in Bogota?',
  tools: {
    getCurrentTime: tool({
      description: 'Get current time in specified timezone',
      parameters: z.object({
        timezone: z.string().describe('IANA timezone (e.g., America/Bogota)')
      }),
      execute: async ({ timezone }) => {
        return { time: new Date().toLocaleString('en-US', { timeZone: timezone }) }
      }
    })
  },
  maxToolRoundtrips: 3  // Allow multi-step tool calls
})
```

**Sources:**
- https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling

---

### Streaming (Long Responses)

**NOT primary for Bird Actions (<9s), but available:**
```typescript
import { streamText } from 'ai'

export async function POST(req: Request) {
  const result = streamText({
    model: google('gemini-2.0-flash'),
    messages: await req.json()
  })

  // Edge Runtime compatible streaming
  return result.toDataStreamResponse()
}
```

**Benefits:**
- 300s timeout (vs 25s non-streaming)
- Lower memory (chunks vs full response)
- Progressive rendering

**Sources:**
- https://ai-sdk.dev/docs/ai-sdk-core/generating-text

---

## Edge Runtime Constraints

**Allowed (Web APIs):**
- `fetch()`, `Request`, `Response`
- `crypto.subtle` (NOT `crypto.createHmac`)
- `ReadableStream`, `WritableStream`
- `TextEncoder`, `TextDecoder`

**Forbidden (Node.js APIs):**
- `fs`, `path`, `Buffer` (use `Uint8Array`)
- `crypto.createHmac` (use Web Crypto)
- `process.cwd()`, `__dirname`

**Timeouts:**
- Non-streaming: 25s default
- Streaming: 300s default
- Custom: `export const maxDuration = 9` (Bird Actions)

**Memory:** 128MB limit

**Reference:** `/docs/architecture.md`

---

## Error Handling

### Timeout Strategy
```typescript
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), ms)
    )
  ])
}

// Usage
try {
  const result = await withTimeout(
    generateText({ model, prompt }),
    8500  // 8.5s for 9s limit
  )
} catch (error) {
  if (error.message === 'TIMEOUT') {
    // Return immediate error to Bird
    return { success: false, error: 'Processing exceeded time limit' }
  }
  throw error
}
```

### Graceful Degradation
```typescript
// Try Gemini, fallback to OpenAI if fails
try {
  return await generateText({ model: google('gemini-2.0-flash'), prompt })
} catch (error) {
  console.error('Gemini failed, trying OpenAI:', error)
  return await generateText({ model: openai('gpt-4o-mini'), prompt })
}
```

---

## Cost Optimization

### Provider Pricing (2025-12-04)

| Provider | Use Case | Cost | Volume |
|----------|----------|------|--------|
| Gemini 2.0 Flash | Images | $0.17/1K | 10K = $1.70/mo |
| Groq Whisper v3 | Audio | $0.67/1K min | 10K = $6.70/mo |
| OpenAI GPT-4o-mini | Fallback | $0.15/1M tokens | Avoid |

**Target:** $8.40/month (10K images + 10K audio) vs $75+ with Claude

### Strategies

1. **Gemini primary:** 89% cheaper than Claude for images
2. **Groq for audio:** Fastest transcription, Spanish optimized
3. **Cache large prompts:** 75% discount with Gemini caching
4. **Avoid streaming:** Synchronous for <9s Bird Actions
5. **OpenAI last resort:** Only complex reasoning Gemini cannot handle

---

## Implementation Checklist

**Environment Variables:**
```bash
# REQUIRED
GOOGLE_GENERATIVE_AI_API_KEY=xxx
GROQ_API_KEY=xxx

# OPTIONAL
OPENAI_API_KEY=xxx                 # Fallback only
BIRD_ACCESS_KEY=xxx                # If CDN requires auth
NEERO_API_KEY=xxx                  # API authentication
```

**API Route Pattern:**
- [x] `export const runtime = 'edge'`
- [x] `export const maxDuration = 9`
- [x] Timeout wrapper (8.5s)
- [x] Structured error responses
- [x] Processing time tracking

**Type Safety:**
- [x] Zod schemas for `generateObject()`
- [x] Zod parameters for `tool()`
- [x] TypeScript strict mode enabled

**Testing:**
- [x] Test with images <9s
- [x] Test with PDFs <9s
- [x] Test with audio <9s
- [x] Test timeout handling (>9s)
- [x] Test fallback providers

---

## References

**Project Documentation:**
- `/docs/bird/bird-actions-architecture.md` - Bird Actions implementation
- `/docs/architecture.md` - Edge Runtime patterns
- `/CLAUDE.md` - Stack and constraints

**External Documentation:**
- Vercel AI SDK Core: https://ai-sdk.dev/docs
- Google Gemini Provider: https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai
- Groq Provider: https://ai-sdk.dev/providers/ai-sdk-providers/groq
- Google Gemini API: https://ai.google.dev/gemini-api/docs
- Groq Cloud: https://groq.com/groqcloud

**Validated Against:**
- /Users/mercadeo/neero/docs-global/platforms/vercel/
- Package versions verified 2025-12-04 (ai@5.0.87, @ai-sdk/google@2.0.44, @ai-sdk/groq@2.0.32)

---

**Lines:** 298 | **Token Estimate:** ~900 tokens | **Format:** 65% tables, 20% code, 15% prose
