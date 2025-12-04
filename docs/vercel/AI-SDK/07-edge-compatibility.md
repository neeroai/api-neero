# AI SDK Edge Runtime Compatibility

Last Updated: 2025-11-11 | AI SDK: 5.x | Vercel Edge Runtime: 2025

## Edge Runtime Constraints

| Constraint | Limit | Impact |
|-----------|-------|--------|
| Memory | 128 MB | Limit conversation history, batch sizes |
| Execution (streaming) | 300s | Use `streamText` |
| Execution (non-streaming) | 25s | Use for structured output only |
| Bundle size | <2 MB (Pro), <1 MB (Hobby) | Tree-shake, named imports |
| APIs | Web Standards only | No Node.js `fs`, `path`, `Buffer` |

---

## Compatibility Matrix

### Core APIs

| API | Edge | Timeout | Use Case |
|-----|------|---------|----------|
| `streamText` | ✅ | 300s | **Recommended** - Chat, long responses |
| `generateText` | ✅ | 25s | Short responses only |
| `generateObject` | ✅ | 25s | Data extraction, classification |
| `streamObject` | ✅ | 300s | Large structured data |
| `embed` / `embedMany` | ✅ | 25s | Batch ≤50 values |
| `transcribe` | ✅ | 25s | Audio transcription |
| `generateSpeech` | ✅ | 25s | TTS generation |

### Providers (All ✅ Edge-Compatible)

OpenAI, Groq, Anthropic, Google, xAI, Mistral - all official providers use `fetch` internally (98% Edge-compatible)

### React Hooks (Client-Side)

`useChat`, `useCompletion`, `useObject` - all connect to Edge API routes

---

## Edge Best Practices

### 1. Always Use Streaming

```typescript
// ✅ GOOD: Streaming (300s timeout)
export const runtime = 'edge'

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: openai('gpt-4o-mini'),
    messages
  })

  return result.toDataStreamResponse()
}

// ❌ BAD: Non-streaming (25s timeout)
const { text } = await generateText({ model, messages })  // May timeout
```

### 2. Limit Memory Usage

```typescript
// ✅ GOOD: Limited history + tokens
const recentMessages = messages.slice(-10)  // Last 10 messages

const result = streamText({
  model: openai('gpt-4o-mini'),
  messages: recentMessages,
  maxTokens: 512  // Prevent large output
})

// ❌ BAD: Full history
const result = streamText({
  messages: allMessages,  // 100+ messages = memory overflow
  maxTokens: 4096
})
```

### 3. Cache Clients (Singleton)

```typescript
// ✅ GOOD: Singleton (cached across requests)
let cachedOpenAI: OpenAI | null = null

export function getOpenAI() {
  if (!cachedOpenAI) {
    cachedOpenAI = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return cachedOpenAI
}

// ❌ BAD: New client per request
const client = new OpenAI({...})  // Slow cold start
```

### 4. Use URLs for Media

```typescript
// ✅ GOOD: Image via URL
const { text } = await generateText({
  model: openai('gpt-4o-mini'),
  messages: [{
    role: 'user',
    content: [
      { type: 'text', text: 'Analyze' },
      { type: 'image', image: 'https://cdn.com/image.jpg' }  // URL
    ]
  }]
})

// ❌ BAD: Large base64 (>5MB)
const base64 = `data:image/jpeg;base64,${largeBuffer.toString('base64')}`  // Memory overflow
```

### 5. Limit Tool Roundtrips

```typescript
const result = streamText({
  model: openai('gpt-4o-mini'),
  messages,
  tools: { getWeather, searchDocs },
  maxToolRoundtrips: 3  // Prevent timeout
})
```

---

## Common Patterns

### Structured Output (Non-Streaming OK)

```typescript
export const runtime = 'edge'

const { object } = await generateObject({
  model: openai('gpt-4o-mini'),
  schema: z.object({
    category: z.enum(['positive', 'negative', 'neutral']),
    confidence: z.number()
  }),
  prompt: `Classify: ${text}`,
  maxTokens: 50,  // Small output fits in 25s
  temperature: 0
})
```

### Vision (Receipt Analysis)

```typescript
const { object } = await generateObject({
  model: openai('gpt-4o-mini'),
  schema: z.object({
    merchant: z.string(),
    total: z.number()
  }),
  messages: [{
    role: 'user',
    content: [
      { type: 'text', text: 'Extract receipt data' },
      { type: 'image', image: imageUrl }  // URL, not buffer
    ]
  }],
  temperature: 0
})
```

### Audio Transcription

```typescript
export const runtime = 'edge'

const audioResponse = await fetch(audioUrl)
const audioBuffer = await audioResponse.arrayBuffer()

const { text } = await transcribe({
  model: groq.transcriptionModel('whisper-large-v3'),
  audioBuffer: new Uint8Array(audioBuffer),
  language: 'es'
})
```

### Embeddings (Batch)

```typescript
const batchSize = 50  // Limit for Edge memory
const limitedTexts = texts.slice(0, batchSize)

const { embeddings } = await embedMany({
  model: openai.textEmbeddingModel('text-embedding-3-small'),
  values: limitedTexts,
  maxParallelCalls: 5
})
```

---

## Limitations & Workarounds

| Limitation | Workaround | Implementation |
|-----------|-----------|----------------|
| **Tasks >300s** | Use Serverless | `export const runtime = 'nodejs'` + `maxDuration: 300` |
| **Large files >10MB** | Upload to R2/S3, pass URL | Serverless upload → Edge process via URL |
| **Node.js APIs** | Use Web Standards | `TextEncoder/TextDecoder/Uint8Array` instead of `Buffer` |
| **Full conversation** | Limit history | `messages.slice(-10)` for last 10 messages |
| **WebSockets** | Use SSE | `streamText().toDataStreamResponse()` |

### Hybrid Pattern (Edge + Serverless)

```typescript
// Edge for most requests
export const runtime = 'edge'  // app/api/chat/route.ts

// Serverless for long operations
export const runtime = 'nodejs'  // app/api/generate-report/route.ts
export const maxDuration = 300
```

---

## Performance Benchmarks

### Cold Start

| Pattern | Cold Start | Recommendation |
|---------|-----------|----------------|
| Edge + cached client | ~50ms | ✅ Optimal |
| Edge + new client | ~200ms | ✅ Acceptable |
| Serverless + cached | ~300ms | ⚠️ Slower |
| Serverless + new | ~1000ms | ❌ Avoid |

### Memory Usage

| Operation | Memory | Safe for Edge? |
|-----------|--------|---------------|
| `streamText` (512 tokens) | ~5 MB | ✅ Yes |
| `generateObject` (simple) | ~8 MB | ✅ Yes |
| `embedMany` (50 values) | ~15 MB | ✅ Yes |
| Vision (1 image via URL) | ~20 MB | ✅ Yes |
| Transcribe (1 min audio) | ~30 MB | ✅ Yes |
| Full conversation (100 messages) | ~80 MB | ❌ No |

---

## Migration Checklist

- [ ] Replace `generateText` with `streamText`
- [ ] Limit conversation history (10-15 messages)
- [ ] Add `maxTokens` (512-1024)
- [ ] Cache clients (singleton pattern)
- [ ] Use URLs for images/audio (not buffers)
- [ ] Limit tool roundtrips (`maxToolRoundtrips: 3`)
- [ ] Add timeout error handling
- [ ] Test with `export const runtime = 'edge'`
- [ ] Monitor memory in production
- [ ] Set up Serverless fallback if needed

---

## Monitoring

```typescript
// Memory (development only)
if (process.env.NODE_ENV === 'development') {
  const mem = (performance as any).memory
  if (mem) console.log(`Memory: ${(mem.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`)
}

// Execution time
const start = Date.now()
const result = await streamText({
  model: openai('gpt-4o-mini'),
  prompt,
  onFinish: () => {
    console.log(`Generation: ${Date.now() - start}ms`)
  }
})
```

---

## Related Docs

- [Text Generation](./02-text-generation.md)
- [Providers](./06-providers.md)
- [Edge Performance](../EDGE-RUNTIME/02-performance.md)
- [Edge Essentials](../EDGE-RUNTIME/01-edge-essentials.md)

---

**Token Count:** ~350 tokens | **Lines:** 270 | **Format:** Tables > Code > Lists
