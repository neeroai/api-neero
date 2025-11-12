# Edge Runtime Guide

**Platform:** Vercel Edge Functions | **Runtime:** V8 Isolates | **Updated:** 2025-11-12

---

## Overview

Template built for Vercel Edge Runtime: V8-based serverless functions deployed globally for <100ms latency.

**Key Characteristics:**
- Cold start: <10ms
- Timeout: 25s (300s for streaming)
- Memory: 128MB
- APIs: Web Standard only
- Regions: 300+ global locations

**Validated Source:** docs-global/platforms/vercel/platform-vercel.md:48-52

---

## Why Edge Runtime?

### Benefits

1. **Global Low Latency** - Deploy to 300+ locations, serve from nearest edge
2. **Fast Cold Starts** - <10ms vs. 50-200ms (Serverless)
3. **Cost Optimization** - Pay per request, no idle costs
4. **WhatsApp Compatible** - Meets <5 sec response requirement

### vs. Serverless (Node.js)

| Feature | Edge | Serverless |
|---------|------|------------|
| Cold Start | <10ms | 50-200ms |
| Timeout | 25s (300s streaming) | 10-300s |
| Memory | 128MB | 512MB-3GB |
| APIs | Web Standard only | Full Node.js |
| Filesystem | No | Yes (/tmp) |
| Global | Yes (300+ locations) | Single region |

**When to use Serverless:**
- Need `fs`, `child_process`
- Tasks >25s (non-streaming)
- Native modules (Puppeteer, Sharp)

**Validated Source:** docs-global/platforms/vercel/platform-vercel.md:728-741

---

## Declaring Edge Runtime

```typescript
// app/api/whatsapp/webhook/route.ts
export const runtime = 'edge'  // Enable Edge Runtime

export async function POST(req: Request) {
  // Your code here
}
```

**Note:** Omit runtime declaration = Serverless (Node.js)

**Validated Source:** docs-global/platforms/vercel/platform-vercel.md:76-98

---

## Web Standard APIs

### Available APIs

**Network:**
- `fetch()` - HTTP requests
- `Request` / `Response` - Web API objects
- `Headers` - HTTP headers manipulation
- `URL` / `URLSearchParams` - URL parsing

**Crypto:**
- `crypto.subtle` - Web Crypto API (HMAC, SHA-256)
- `crypto.randomUUID()` - Generate UUIDs

**Encoding:**
- `TextEncoder` / `TextDecoder` - String ↔ Uint8Array
- `btoa()` / `atob()` - Base64 encoding

**Streams:**
- `ReadableStream` / `WritableStream` - Streaming data
- `TransformStream` - Stream transformations

**Other:**
- `console` - Logging
- `setTimeout()` / `setInterval()` - Timers
- `JSON.parse()` / `JSON.stringify()` - JSON handling

### NOT Available (Node.js APIs)

- `fs` (file system)
- `child_process` (spawn processes)
- `Buffer` (use `Uint8Array`)
- `path` (use URL manipulation)
- Dynamic `import()` (use static imports)

**Validated Source:** docs-global/platforms/vercel/platform-vercel.md:100-104

---

## HMAC Validation (Edge-Compatible)

### Problem: Node.js crypto Not Available

```typescript
// This FAILS in Edge Runtime
import crypto from 'crypto'
const hmac = crypto.createHmac('sha256', secret)
```

### Solution: Web Crypto API

```typescript
// Edge-compatible HMAC validation
async function validateSignature(
  signature: string | null,
  body: string,
  secret: string
): Promise<boolean> {
  if (!signature) return false

  // Import key
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  // Generate signature
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(body)
  )

  // Convert to hex
  const expected = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  // Constant-time comparison
  const received = signature.replace('sha256=', '')
  if (expected.length !== received.length) return false

  let result = 0
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ received.charCodeAt(i)
  }

  return result === 0
}
```

**Validated Source:** docs-global/platforms/vercel/platform-vercel.md:403-444

---

## Performance Optimization

### 1. Client Caching

```typescript
// Cache expensive clients (survives across requests)
let cachedClient: OpenAI | null = null

export function getClient() {
  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey: process.env.API_KEY })
  }
  return cachedClient
}
```

**Why:** Avoid re-initialization penalty (~50ms)

**Validated Source:** docs-global/platforms/vercel/platform-vercel.md:247-258

### 2. Static Imports Only

```typescript
// Good: Static import
import { helper } from './utils'

// Bad: Dynamic import (breaks Edge)
const { helper } = await import('./utils')
```

**Validated Source:** docs-global/platforms/vercel/platform-vercel.md:260-268

### 3. Memory Management (128MB Limit)

```typescript
// Limit cache size to prevent OOM
const cache = new Map()
const MAX_CACHE_SIZE = 100

function cacheSet(key: string, value: any) {
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value
    cache.delete(firstKey)
  }
  cache.set(key, value)
}
```

**Validated Source:** docs-global/platforms/vercel/platform-vercel.md:321-355

---

## Timeout Strategy

### Non-Streaming: 25 seconds

```typescript
// Set aggressive timeouts for external calls
const response = await fetch(externalAPI, {
  signal: AbortSignal.timeout(20000)  // 20s for 25s function
})
```

### Streaming: 300 seconds

```typescript
// Streaming extends timeout automatically
return new Response(
  new ReadableStream({...}),
  {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache'
    }
  }
)
```

**Validated Source:** docs-global/platforms/vercel/platform-vercel.md:520-559

---

## Error Handling

### Common Edge Runtime Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 504 Gateway Timeout | >25s execution | Optimize or use streaming |
| 507 Out of Memory | >128MB usage | Optimize memory, limit cache |
| Module not found | Dynamic import | Use static imports |
| crypto is not defined | Node.js API | Use Web Crypto API |

**Validated Source:** docs-global/platforms/vercel/platform-vercel.md:755-763

### Graceful Timeout Handling

```typescript
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Timeout')), timeoutMs)
  })
  return Promise.race([promise, timeout])
}

// Usage
try {
  const result = await withTimeout(expensiveOp(), 20000)
} catch (error) {
  if (error.message === 'Timeout') {
    return new Response('Processing...', { status: 202 })
  }
  throw error
}
```

**Validated Source:** docs-global/platforms/vercel/platform-vercel.md:526-559

---

## Best Practices

### Do:

- Use Web Crypto for HMAC validation
- Cache clients (OpenAI, Supabase)
- Static imports only
- Set aggressive timeouts (<20s for 25s function)
- Use streaming for long-running tasks
- Monitor memory usage

### Don't:

- Use Node.js APIs (`fs`, `crypto`, `path`)
- Use dynamic imports
- Use top-level await
- Ignore cold start optimizations
- Forget to set timeouts on external calls

**Validated Source:** docs-global/platforms/vercel/platform-vercel.md:245-307

---

## Monitoring

### Performance Metrics

View at vercel.com/[team]/[project]/analytics:
- Cold start duration (target: <10ms)
- Execution time (target: <100ms for webhooks)
- Memory usage (limit: 128MB)
- Error rate (target: <1%)

### Logging

```typescript
// Structured logging for Edge Functions
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'info',
  message: 'Webhook processed',
  duration: Date.now() - startTime
}))
```

**Validated Source:** docs-global/platforms/vercel/platform-vercel.md:607-674

---

## References

**Validated Against:**
- docs-global/platforms/vercel/platform-vercel.md (Edge Runtime, APIs, optimizations)

**External:**
- Edge Runtime API: https://edge-runtime.vercel.app/
- Vercel Docs: https://vercel.com/docs/functions/edge-functions
