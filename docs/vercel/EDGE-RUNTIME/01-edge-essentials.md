# Edge Runtime Essentials

Last Updated: 2025-11-11 | Vercel Edge Runtime: 2025

## Overview

Edge Functions run on Vercel's Edge Runtime (V8-based) instead of Node.js, providing global low-latency execution.

**Benefits**:
- 40% faster than traditional Serverless
- 15x more cost-effective for compute-intensive tasks
- <100ms global latency (executes near users)
- Extended timeouts (300s streaming vs 25s non-streaming)

**Ideal For**: AI APIs, chatbots, webhooks, proxies, real-time apps

## Prerequisites

- Next.js 15+ or compatible framework
- Understanding of Edge Runtime limitations (No full Node.js)
- Web Standards knowledge

## Basic Configuration

### Declare Edge Runtime

```typescript
// app/api/hello/route.ts
export const runtime = 'edge'  // NOT 'experimental-edge'

export async function GET(req: Request) {
  return Response.json({ message: 'Hello from Edge!' })
}
```

### Next.js App Router

```typescript
// app/api/chat/route.ts
export const runtime = 'edge'
export const maxDuration = 300  // Optional: 300s for streaming

export async function POST(req: Request) {
  const { message } = await req.json()
  // Process message
  return Response.json({ response: 'AI response' })
}
```

### Pages Router

```typescript
// pages/api/hello.ts
export const config = { runtime: 'edge' }

export default async function handler(req: Request) {
  return new Response('Hello', { status: 200 })
}
```

## vercel.json Configuration

**CRITICAL**: Do NOT specify runtime in vercel.json

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs"
}
```

Vercel auto-detects Edge Functions via `export const runtime = 'edge'`

## Import Patterns

### Static Imports (Required)

```typescript
// GOOD: Static imports
import { createClient } from '@/lib/supabase/server'
import { openai } from '@ai-sdk/openai'

export const runtime = 'edge'

export async function POST(req: Request) {
  const supabase = createClient()
  // ...
}
```

### Dynamic Imports (Avoid)

```typescript
// BAD: Dynamic imports fail in Edge
export async function POST(req: Request) {
  const { createClient } = await import('@/lib/supabase/server')  // Fails!
}
```

**Reason**: Vercel bundler analyzes imports at build time. Dynamic imports break dependency resolution.

## Compatible Web APIs

### Fully Supported

| API | Description | Example |
|-----|-------------|---------|
| `fetch` | HTTP requests | `await fetch(url)` |
| `Request` / `Response` | Web Standards | `new Request(url)` |
| `Headers` | HTTP headers | `new Headers()` |
| `URL` / `URLSearchParams` | URL manipulation | `new URL(url)` |
| `crypto.subtle` | Web Crypto | `crypto.subtle.digest()` |
| `crypto.randomUUID()` | UUID generation | `crypto.randomUUID()` |
| `TextEncoder` / `TextDecoder` | String encoding | `new TextEncoder()` |
| `ReadableStream` / `WritableStream` | Streaming I/O | `new ReadableStream()` |
| `setTimeout` / `setInterval` | Timers | `setTimeout(fn, 1000)` |
| `console.log` / `console.error` | Logging | `console.log('message')` |
| `atob` / `btoa` | Base64 encoding | `btoa('string')` |
| `JSON.parse` / `JSON.stringify` | JSON handling | `JSON.parse(data)` |

### NOT Supported (Node.js APIs)

| API | Workaround |
|-----|------------|
| `fs` (file system) | Use URLs or external storage |
| `path` | Use `URL` or string manipulation |
| `os` | Not available |
| `child_process` | Not available |
| `http` / `https` | Use `fetch` |
| `Buffer` | Use `Uint8Array` + `TextEncoder` |
| `stream` | Use `ReadableStream` |
| `crypto` (Node) | Use `crypto.subtle` |

## Request/Response Patterns

### Parse JSON Body

```typescript
export async function POST(req: Request) {
  const body = await req.json()
  return Response.json({ received: body })
}
```

### Parse Form Data

```typescript
export async function POST(req: Request) {
  const formData = await req.formData()
  const name = formData.get('name')
  return Response.json({ name })
}
```

### Set Headers

```typescript
export async function GET() {
  return Response.json(
    { data: 'value' },
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600'
      }
    }
  )
}
```

### Streaming Response

```typescript
export async function GET() {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('chunk 1\n'))
      controller.enqueue(encoder.encode('chunk 2\n'))
      controller.close()
    }
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  })
}
```

## Environment Variables

### Access Variables

```typescript
export async function GET() {
  const apiKey = process.env.API_KEY  // Available in Edge
  return Response.json({ key: apiKey ? 'set' : 'not set' })
}
```

### Configure in Vercel

```bash
# Add via CLI
vercel env add API_KEY

# Or via Dashboard
# Project Settings > Environment Variables
```

## Error Handling

### Basic Try-Catch

```typescript
export async function POST(req: Request) {
  try {
    const body = await req.json()
    // Process
    return Response.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return Response.json(
      { error: 'Request failed' },
      { status: 500 }
    )
  }
}
```

### Timeout Handling

```typescript
export async function POST(req: Request) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20000)  // 20s

  try {
    const response = await fetch(externalAPI, {
      signal: controller.signal
    })
    clearTimeout(timeout)
    return Response.json({ data: await response.json() })
  } catch (error) {
    if (error.name === 'AbortError') {
      return Response.json({ error: 'Timeout' }, { status: 504 })
    }
    throw error
  }
}
```

## CORS Configuration

### Enable CORS

```typescript
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}

export async function POST(req: Request) {
  // Process request
  return Response.json(
    { data: 'value' },
    {
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    }
  )
}
```

## Geolocation

### Access User Location

```typescript
export async function GET(req: Request) {
  const geo = req.geo || {}

  return Response.json({
    city: geo.city,
    country: geo.country,
    region: geo.region,
    latitude: geo.latitude,
    longitude: geo.longitude
  })
}
```

## Limitations

| Limit | Value | Notes |
|-------|-------|-------|
| **Memory** | 128 MB | Hard limit |
| **Timeout (non-streaming)** | 25s | Use streaming for longer |
| **Timeout (streaming)** | 300s | 5 minutes max |
| **Bundle Size (Hobby)** | 1 MB | Compressed |
| **Bundle Size (Pro)** | 2 MB | Compressed |
| **Cold Start** | <100ms | Typical |

## Best Practices

1. **Use streaming** for responses >25s
2. **Cache clients** (singleton pattern)
3. **Limit conversation history** (10-15 messages)
4. **Use URLs for media** (not buffers)
5. **Monitor memory usage**
6. **Add timeout handling**
7. **Static imports only**
8. **Test locally** with `runtime: 'edge'`

## Migration from Serverless

### Before (Serverless)

```typescript
// pages/api/hello.ts
export default function handler(req, res) {
  res.status(200).json({ message: 'Hello' })
}
```

### After (Edge)

```typescript
// app/api/hello/route.ts
export const runtime = 'edge'

export async function GET(req: Request) {
  return Response.json({ message: 'Hello' })
}
```

## Local Development

### Next.js Dev Server

```bash
npm run dev
# Edge Functions work automatically
```

### Vercel CLI

```bash
vercel dev
# Test Edge Functions locally
```

## Next Steps

- [Performance Optimization](./02-performance.md)
- [Security Best Practices](./03-security.md)
- [Observability & Monitoring](./04-observability.md)

## Related Documentation

- [AI SDK Edge Compatibility](../AI-SDK/07-edge-compatibility.md)
- [Platform Overview](../platform-vercel.md)

---

Token Count: ~700 tokens | Lines: 348 | Format: Tables > Code > Lists (consolidated from vercel-edge-guide.md)
