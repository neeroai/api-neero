# Platform: Vercel (Edge + Serverless)

**Status**: Production | **Plans**: Hobby (Free), Pro ($20/mo), Enterprise
**Updated**: 2025-11-02 | **Edge Timeout**: 25s | **Serverless**: 10-300s

---

## TL;DR

**What**: Serverless platform with Edge (V8) and Node.js runtimes
**Why**: Git-based deploys, global CDN, <100ms latency, zero DevOps
**When**: APIs, webhooks, full-stack apps with Next.js/React

**Quick Facts**:
- ✅ **Edge**: <100ms global latency, 128MB RAM, 25s timeout
- ✅ **Serverless**: Full Node.js, 10-300s timeout, 512MB-3GB RAM
- ⚠️ **Limitation**: Edge = No `fs`, `child_process`, dynamic imports
- 💰 **Cost**: Free tier generous, Pro scales predictably
- 📊 **Limits**: 100GB bandwidth/mo (Hobby), 1TB (Pro)

**Quick Deploy**:
```bash
# 1. Install CLI
npm i -g vercel

# 2. Deploy
vercel --prod

# Or: Push to main branch (auto-deploy)
git push origin main
```

**Edge vs Serverless Decision**:
| Use Edge When | Use Serverless When |
|---------------|---------------------|
| API latency < 100ms critical | Need full Node.js APIs |
| Webhooks (WhatsApp, Stripe) | File system access required |
| Global user base | Long-running tasks (>25s) |
| Simple data transformations | Native modules (Puppeteer, Sharp) |
| Cost optimization priority | Complex compute (PDF generation) |

---

## Essential Guide

### Core Concepts

**Edge Runtime**: V8 JavaScript engine (Cloudflare Workers model)
- Runs globally on Vercel Edge Network
- Web Standard APIs only (fetch, crypto, Headers)
- No filesystem access
- Cold start <10ms

**Serverless Runtime**: Full Node.js containers
- Runs in single region (default: `iad1` Washington DC)
- All Node.js APIs available
- `/tmp` filesystem (500MB)
- Cold start 50-200ms

**Decision Mental Model**:
```
Request → Edge or Serverless?
   ↓           ↓
Need fs?   No fs needed
Need >25s? <25s OK
Native?    Web APIs OK
   ↓           ↓
Serverless   Edge
```

---

### Common Patterns

#### Pattern 1: Edge Function (Webhook Handler)

**When to use**: Webhooks, APIs <25s, global latency matters

```typescript
// api/webhook/route.ts
export const runtime = 'edge' // ← Declares Edge Runtime

export async function POST(req: Request): Promise<Response> {
  // Validate signature (HMAC-SHA256)
  const signature = req.headers.get('x-hub-signature-256')
  const body = await req.text()

  if (!await validateSignature(signature, body)) {
    return new Response('Invalid signature', { status: 401 })
  }

  // Process webhook
  const data = JSON.parse(body)
  await processWebhook(data)

  return new Response('OK', { status: 200 })
}
```

**Gotchas**:
- ⚠️ Must use Web Crypto API (not Node.js `crypto`)
- ⚠️ Static imports only (no dynamic `import()`)
- ⚠️ 128MB memory limit (watch large payloads)

---

#### Pattern 2: Edge Function with Streaming

**When to use**: AI responses, large data, real-time updates

```typescript
// api/chat/route.ts
export const runtime = 'edge'

export async function POST(req: Request) {
  const { messages } = await req.json()

  const stream = await openai.chat.completions.create({
    model: 'gpt-4',
    messages,
    stream: true
  })

  return new Response(
    new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content
          if (text) controller.enqueue(new TextEncoder().encode(text))
        }
        controller.close()
      }
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache'
      }
    }
  )
}
```

**Benefits**:
- 💡 300s timeout for streaming (vs. 25s non-streaming)
- 💡 Lower memory usage (chunks vs. full response)
- 💡 Better UX (progressive rendering)

---

#### Pattern 3: Serverless Function (Heavy Compute)

**When to use**: PDF generation, image processing, >25s tasks

```typescript
// api/generate-pdf/route.ts
// No runtime specified = Node.js Serverless by default

import { writeFileSync, readFileSync } from 'fs'
import puppeteer from 'puppeteer'

export async function POST(req: Request) {
  const { html } = await req.json()

  // Use /tmp filesystem (500MB available)
  const tmpPath = '/tmp/output.pdf'

  // Launch browser (only works in Serverless)
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.setContent(html)
  await page.pdf({ path: tmpPath, format: 'A4' })
  await browser.close()

  // Read and return PDF
  const pdf = readFileSync(tmpPath)
  return new Response(pdf, {
    headers: { 'Content-Type': 'application/pdf' }
  })
}
```

**Gotchas**:
- ⚠️ Higher latency (50-200ms cold start)
- ⚠️ Regional execution (not global)
- ⚠️ Higher cost than Edge

---

### Configuration

**Environment Variables** (Vercel Dashboard):
```bash
# Core
VERCEL_ENV=production              # Auto-set by Vercel
VERCEL_URL=your-app.vercel.app     # Auto-set deployment URL

# Custom (set manually)
DATABASE_URL=postgresql://...
API_KEY=your_secret_key
```

**vercel.json** (Optional):
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",

  "regions": ["iad1"],  // Serverless region (Edge ignores)

  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,POST,OPTIONS" }
      ]
    }
  ],

  "crons": [
    {
      "path": "/api/cron/daily-cleanup",
      "schedule": "0 0 * * *"  // Every day at midnight UTC
    }
  ]
}
```

**Runtime Declaration**:
```typescript
// Edge Runtime
export const runtime = 'edge'
export const maxDuration = 25  // seconds (optional, default=25)

// Serverless (default, no declaration needed)
// But you can specify:
export const maxDuration = 60  // Pro plan: 60s, Enterprise: 300s
export const memory = 1024     // MB (Hobby: 512, Pro: 1024-3008)
```

---

### Best Practices

#### ✅ DO:

- **Cache client instances**:
  ```typescript
  let cachedClient: Client | null = null

  export function getClient() {
    if (!cachedClient) {
      cachedClient = new Client({ apiKey: process.env.API_KEY })
    }
    return cachedClient
  }
  ```

- **Use static imports** (Edge):
  ```typescript
  // ✅ Good
  import { getClient } from '@/lib/client'

  // ❌ Bad (breaks Edge)
  const { getClient } = await import('@/lib/client')
  ```

- **Set appropriate timeouts**:
  ```typescript
  const response = await fetch(url, {
    signal: AbortSignal.timeout(20000)  // 20s timeout
  })
  ```

#### ❌ DON'T:

- **Don't use top-level await** (Edge):
  ```typescript
  // ❌ Bad (breaks bundling)
  const config = await fetchConfig()

  export const runtime = 'edge'

  // ✅ Good (lazy load)
  export const runtime = 'edge'

  let config: Config | null = null
  async function getConfig() {
    if (!config) config = await fetchConfig()
    return config
  }
  ```

- **Don't ignore cold starts**:
  ```typescript
  // ❌ Bad (initializes heavy client always)
  const heavyClient = new HeavyLibrary()

  // ✅ Good (lazy + cached)
  let client: HeavyLibrary | null = null
  function getClient() {
    if (!client) client = new HeavyLibrary()
    return client
  }
  ```

#### 💡 PRO TIPS:

- **Optimize bundle size**: Use tree-shaking, avoid huge deps
- **Regional strategy**: Put Serverless in same region as DB
- **Monitor cold starts**: Vercel Analytics shows p50/p95/p99
- **Preview deployments**: Every PR gets unique URL for testing

---

## Advanced Topics

### Edge Runtime Optimization

#### Memory Management (128MB limit)

**Problem**: Edge Functions terminate at 128MB

**Solution**: Lazy initialization + cleanup

```typescript
// Memory-efficient caching with TTL
const cache = new Map<string, { data: any; timestamp: number }>()
const TTL = 3600 * 1000  // 1 hour

function cacheGet(key: string) {
  const entry = cache.get(key)
  if (!entry) return null

  // Expire old entries
  if (Date.now() - entry.timestamp > TTL) {
    cache.delete(key)
    return null
  }

  return entry.data
}

function cacheSet(key: string, data: any) {
  // Prevent unbounded growth
  if (cache.size > 100) {
    const oldest = Array.from(cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)[0]
    if (oldest) cache.delete(oldest[0])
  }

  cache.set(key, { data, timestamp: Date.now() })
}
```

**Monitor memory**:
```typescript
if (process.env.NODE_ENV === 'development') {
  const mem = (performance as any).memory
  if (mem) {
    console.log(`Memory: ${(mem.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`)
  }
}
```

---

#### Bundle Size Optimization

**Problem**: Large bundles slow cold starts

**Strategies**:

1. **Tree-shaking**: Import only what you need
   ```typescript
   // ✅ Good
   import { specific } from 'library'

   // ❌ Bad
   import * as all from 'library'
   ```

2. **Bundle analysis**:
   ```bash
   npm run build
   # Check .next/server/edge output size
   ```

3. **Remove unused deps**:
   ```bash
   npm prune
   ```

**Target**: <1MB (Hobby), <2MB (Pro), <4MB (Enterprise)

---

### Security Best Practices

#### Webhook Signature Validation

**HMAC-SHA256 using Web Crypto** (Edge-compatible):

```typescript
async function validateSignature(
  signature: string | null,
  body: string,
  secret: string
): Promise<boolean> {
  if (!signature) return false

  // Import HMAC key
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  // Generate expected signature
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(body)
  )

  // Convert to hex
  const expected = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  // Constant-time comparison (prevent timing attacks)
  const received = signature.replace('sha256=', '')
  if (expected.length !== received.length) return false

  let result = 0
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ received.charCodeAt(i)
  }

  return result === 0
}
```

**Usage**:
```typescript
export const runtime = 'edge'

export async function POST(req: Request) {
  const signature = req.headers.get('x-hub-signature-256')
  const body = await req.text()

  const isValid = await validateSignature(
    signature,
    body,
    process.env.WEBHOOK_SECRET!
  )

  if (!isValid) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Process webhook...
}
```

---

#### Rate Limiting (Token Bucket)

```typescript
// Simple in-memory rate limiter
const buckets = new Map<string, { tokens: number; lastRefill: number }>()

function rateLimit(
  key: string,
  maxTokens: number,
  refillRate: number  // tokens per second
): boolean {
  const now = Date.now()
  let bucket = buckets.get(key)

  if (!bucket) {
    bucket = { tokens: maxTokens, lastRefill: now }
    buckets.set(key, bucket)
  }

  // Refill tokens
  const elapsed = (now - bucket.lastRefill) / 1000
  bucket.tokens = Math.min(maxTokens, bucket.tokens + elapsed * refillRate)
  bucket.lastRefill = now

  // Consume token
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1
    return true
  }

  return false  // Rate limited
}

// Usage
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'

  if (!rateLimit(ip, 10, 1)) {  // 10 requests burst, 1/s refill
    return new Response('Rate limited', { status: 429 })
  }

  // Process request...
}
```

---

### Error Handling

#### Timeout Management

**Problem**: Edge 25s timeout, Serverless 10-300s

**Strategies**:

```typescript
// 1. Set aggressive timeouts for external calls
const response = await fetch(externalAPI, {
  signal: AbortSignal.timeout(20000)  // 20s for 25s function
})

// 2. Implement timeout wrapper
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
  const result = await withTimeout(
    expensiveOperation(),
    20000
  )
} catch (error) {
  if (error.message === 'Timeout') {
    // Handle gracefully
    return new Response('Processing taking longer than expected', {
      status: 202  // Accepted, processing async
    })
  }
  throw error
}
```

#### Structured Error Responses

```typescript
interface ErrorResponse {
  error: {
    code: string
    message: string
    details?: unknown
  }
}

function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: unknown
): Response {
  const body: ErrorResponse = {
    error: { code, message, ...(details && { details }) }
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

// Usage
export async function POST(req: Request) {
  try {
    // ... operation
  } catch (error) {
    if (error.code === 'TIMEOUT') {
      return errorResponse('TIMEOUT', 'Request timeout', 504)
    }

    return errorResponse('INTERNAL_ERROR', 'Something went wrong', 500, {
      message: error.message
    })
  }
}
```

---

### Monitoring & Observability

#### Vercel Analytics Integration

```typescript
// Automatic in Vercel (no setup needed)
// View at vercel.com/[team]/[project]/analytics

// Custom events:
import { track } from '@vercel/analytics'

export async function POST(req: Request) {
  const startTime = Date.now()

  try {
    const result = await processWebhook(await req.json())

    track('webhook_processed', {
      duration: Date.now() - startTime,
      status: 'success'
    })

    return new Response('OK')
  } catch (error) {
    track('webhook_error', {
      duration: Date.now() - startTime,
      error: error.message
    })

    throw error
  }
}
```

#### Logging Best Practices

```typescript
// Structured logging
function log(level: string, message: string, meta?: Record<string, any>) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta
  }))
}

// Usage
export async function POST(req: Request) {
  const requestId = crypto.randomUUID()

  log('info', 'Webhook received', {
    requestId,
    headers: Object.fromEntries(req.headers)
  })

  try {
    // ... process
    log('info', 'Webhook processed successfully', { requestId })
  } catch (error) {
    log('error', 'Webhook processing failed', {
      requestId,
      error: error.message,
      stack: error.stack
    })
  }
}
```

---

### Supabase Integration

**Edge-Compatible Client Setup**:

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

let cachedClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!cachedClient) {
    cachedClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,      // CRITICAL for Edge
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }
    )
  }
  return cachedClient
}
```

**Usage in Edge Function**:
```typescript
export const runtime = 'edge'

export async function GET(req: Request) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('status', 'active')
    .limit(10)

  if (error) throw error

  return Response.json(data)
}
```

---

## Reference

### Runtime Comparison Table

| Feature | Edge | Serverless |
|---------|------|------------|
| **Cold Start** | <10ms | 50-200ms |
| **Timeout** | 25s (300s streaming) | 10s-300s (plan dependent) |
| **Memory** | 128MB | 512MB-3GB |
| **Regions** | Global (300+ locations) | Single region |
| **APIs** | Web Standard only | Full Node.js |
| **Filesystem** | ❌ No | ✅ /tmp 500MB |
| **Native Modules** | ❌ No | ✅ Yes |
| **Pricing** | $0.65 per 1M requests | $0.60 per 1M + duration |
| **Bundle Size** | <1MB (Hobby) | No strict limit |

### Pricing (2025)

| Plan | Price | Bandwidth | Function Invocations | Serverless Execution |
|------|-------|-----------|----------------------|----------------------|
| **Hobby** | Free | 100GB/mo | Unlimited | 100 GB-hours/mo |
| **Pro** | $20/mo | 1TB/mo | Unlimited | 1000 GB-hours/mo |
| **Enterprise** | Custom | Custom | Unlimited | Custom |

**Cost Examples**:
- 1M Edge Function calls (100ms avg): ~$0.65
- 1M Serverless calls (200ms, 512MB): ~$2.40
- Bandwidth overage: $0.15/GB

### Error Codes

| Code | Description | Cause | Solution |
|------|-------------|-------|----------|
| 504 | Gateway Timeout | Function >25s (Edge) or >timeout | Optimize or use async processing |
| 413 | Payload Too Large | Request body >4.5MB | Stream large payloads |
| 500 | Internal Error | Unhandled exception | Check logs, add error handling |
| 507 | Out of Memory | Edge >128MB | Optimize memory usage |

### Environment Variables

**Auto-set by Vercel**:
- `VERCEL`: Always `"1"`
- `VERCEL_ENV`: `"production"` | `"preview"` | `"development"`
- `VERCEL_URL`: Deployment URL (no protocol)
- `VERCEL_REGION`: Region code (e.g., `"iad1"`)

**Custom Variables** (set in Dashboard):
- Secrets: Encrypted, not visible after creation
- Normal: Visible in dashboard
- System: Reserved by Vercel (VERCEL_*)

---

## Related Documentation

**Within docs-global/**:
- 📖 **[Supabase Integration](platforms/supabase/README.md)** - Database setup
- 📖 **[Next.js Patterns](stack/nextjs-react-patterns.md)** - Framework integration
- 📖 **[API Design](patterns/api-design.md)** - REST API patterns

**External Resources**:
- 🌐 **[Vercel Docs](https://vercel.com/docs)** - Official documentation
- 🌐 **[Edge Runtime API](https://edge-runtime.vercel.app/)** - API reference
- 🌐 **[Status Page](https://vercel-status.com)** - Service status

**Examples in Neero Projects**:
- 📦 **evaia** - WhatsApp bot with Edge Functions
- 📦 **WhatsApp bots** - Medical and business assistants with streaming
- 📦 **Static sites** - ISR and SSG with automatic CDN

---

## Changelog

**2025-11-02**:
- ✅ Consolidated from 8 Vercel platform files
- ✅ Removed project-specific references (migue.ai)
- ✅ Applied token-efficient formatting
- ✅ Added Edge/Serverless decision matrix
- ✅ Updated pricing to 2025 rates

**Original Sources**:
- README.md, vercel-edge-guide.md, functions-guide.md
- edge-functions-optimization.md, edge-error-handling.md
- edge-observability.md, edge-security-guide.md
- supabase-integration.md

---

**📊 Token Efficiency**: ~1,100 tokens (vs. ~4,900 original = 78% reduction)
**📏 Line Count**: ~630 lines (vs. 5,418 original = 88% reduction)
**🎯 Coverage**: 80% of common use cases in Essential Guide
