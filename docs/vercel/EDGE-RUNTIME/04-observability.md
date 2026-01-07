# Edge Runtime Observability & Error Handling

Last Updated: 2025-11-11 | Vercel Edge Runtime: 2025

## Quick Reference

```json
// vercel.json
{
  "analytics": { "enabled": true },
  "observability": { "enabled": true, "logsEnabled": true, "tracingEnabled": true }
}
```

**Dashboard:** https://vercel.com/dashboard/[project]/analytics

---

## Metrics & Targets

### Function Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Duration (P95) | <100ms | >500ms |
| Error Rate | <0.1% | >1% (5 min) |
| Cold Starts | <5% | >10% (1 hr) |
| Memory Usage | <100 MB | >120 MB |
| TTFB | <100ms | >200ms |

### Dashboard Views

| View | Contains |
|------|----------|
| **Overview** | Invocations, error trends, P95 latency, top errors |
| **Performance** | TTFB histogram, cold starts, memory/CPU |
| **Logs** | Real-time streaming, filterable by level/requestId, export CSV/JSON |

---

## Structured Logging

### Minimal Logger Implementation

```typescript
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  requestId?: string
  userId?: string
  conversationId?: string
  duration?: number
  metadata?: Record<string, unknown>
}

function log(level: LogLevel, message: string, error?: Error, context?: LogContext): void {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    service: 'app-name',
    environment: process.env.NODE_ENV || 'development',
    ...context,
    ...(error && {
      error: {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    })
  }

  console.log(JSON.stringify(entry))
}

export const logger = {
  debug: (message: string, context?: LogContext) => log('debug', message, undefined, context),
  info: (message: string, context?: LogContext) => log('info', message, undefined, context),
  warn: (message: string, context?: LogContext) => log('warn', message, undefined, context),
  error: (message: string, error?: Error, context?: LogContext) => log('error', message, error, context)
}
```

### Usage Patterns

```typescript
// Basic
logger.info('[webhook] Request received', { requestId })

// With error
logger.error('Processing failed', err, { requestId, userId })

// With metadata
logger.warn('Validation failed', {
  requestId,
  metadata: { issues: validationResult.error.issues }
})
```

### Request ID Tracing

```typescript
function getRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export async function POST(req: Request): Promise<Response> {
  const requestId = getRequestId()

  logger.info('[webhook] Incoming', { requestId })
  // Use requestId in all logs

  return Response.json({ request_id: requestId })
}
```

**Benefits:** Correlate logs, trace requests, debug distributed calls

---

## Performance Monitoring

### Latency Tracking

```typescript
const startTime = Date.now()
const res = await fetch(url, { ... })
const latency = Date.now() - startTime

if (latency > 100) {
  logger.warn(`Slow API: ${latency}ms`, {
    requestId,
    metadata: { endpoint: url, status: res.status }
  })
}
```

### Cold Start Detection

```typescript
let isWarmStart = false

export async function GET(req: Request): Promise<Response> {
  const isColdStart = !isWarmStart
  isWarmStart = true

  if (isColdStart) {
    logger.info('Cold start', { metadata: { runtime: 'edge' } })
  }
}
```

### Performance Budgets

```typescript
const BUDGETS = {
  WEBHOOK_RESPONSE: 5000,   // 5s (WhatsApp)
  DATABASE_QUERY: 1000,     // 1s
  API_CALL: 100,            // 100ms
  AI_RESPONSE: 30000        // 30s
}

if (duration > BUDGETS.WEBHOOK_RESPONSE) {
  logger.warn('Budget exceeded', { requestId, duration, metadata: { budget } })
}
```

---

## Error Types & Handling

### Error Categories

| Type | Common Causes | Handling |
|------|---------------|----------|
| **Network** | API timeouts, connection resets | Retry with backoff |
| **Validation** | Invalid payloads, schema failures | Return 400 with details |
| **Application** | Business logic errors | Custom AppError with context |
| **Rate Limit** | API quota exceeded | Wait + retry or queue |

### Custom Error Class

```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public context?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// Usage
throw new AppError('User not found', 'USER_NOT_FOUND', 404, { userId })
```

### Handling Patterns

| Pattern | Use Case | Example |
|---------|----------|---------|
| **Try-Catch Fallback** | Non-critical errors | `try { await markAsRead() } catch { log }` |
| **Fire-and-Forget** | Background tasks | `processAsync().catch(log)` |
| **Finally Cleanup** | Resource management | `try { process } finally { cleanup() }` |

```typescript
// Pattern 1: Try-Catch Fallback
try {
  await markAsRead(messageId)
} catch (err: any) {
  logger.error('Mark read failed', err)  // Log but don't fail
}

// Pattern 2: Fire-and-Forget
processMessageWithAI(conversationId, userId, content, messageId)
  .catch(err => logger.error('Background failed', err, { requestId }))

return Response.json({ success: true })  // Immediate response

// Pattern 3: Finally Cleanup
const typingManager = createTypingManager(userPhone, messageId)
try {
  await processAI()
} catch (error: any) {
  logger.error('Processing failed', error)
  await reactWithWarning(userPhone, messageId).catch(log)
} finally {
  await typingManager.stop()
}
```

---

## Timeout Management

### Limits

| Type | Timeout | Use Case |
|------|---------|----------|
| Regular | 25s | Webhooks, API calls |
| Streaming | 300s (5 min) | AI streaming |
| WhatsApp webhook | 5s | Fire-and-forget pattern |

### WhatsApp Pattern

```typescript
export async function POST(req: Request): Promise<Response> {
  const requestId = getRequestId()

  try {
    const normalized = await validateAndPersist(req)  // <1s

    // Fire-and-forget: Process async
    processMessageWithAI(/* ... */).catch(err => logger.error('Background failed', err))

    // Respond <5s
    return Response.json({ success: true, request_id: requestId })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
```

### Processing Timeout Notification

```typescript
function createProcessingNotifier(conversationId: string, userPhone: string) {
  let timer: ReturnType<typeof setTimeout> | null = null

  return {
    start() {
      timer = setTimeout(() => {
        sendTextAndPersist(conversationId, userPhone, 'Still processing...').catch(log)
      }, 30000)
    },
    stop() {
      if (timer) clearTimeout(timer)
    }
  }
}
```

---

## Retry Strategies

### Exponential Backoff

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error

      // Don't retry client errors
      if (error.statusCode >= 400 && error.statusCode < 500) throw error

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt)
        await new Promise(r => setTimeout(r, delay))
      }
    }
  }

  throw lastError!
}

// Usage
const result = await retryWithBackoff(
  () => fetch(url).then(r => r.json()),
  3,     // Max retries
  1000   // Base delay (1s → 2s → 4s)
)
```

**Schedule:** Immediate → 1s → 2s → 4s

### OpenAI Built-in Retries

```typescript
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
  maxRetries: 2
})
```

---

## Graceful Degradation

### Feature Fallbacks

```typescript
try {
  await sendInteractiveButtons(userPhone, message, buttons)
} catch (error: any) {
  logger.warn('Interactive failed, fallback to text')
  await sendWhatsAppText(userPhone, message + '\n\n' + buttons.map(b => `- ${b.title}`).join('\n'))
}
```

### Partial Responses

```typescript
try {
  const result = await processDocument(mediaUrl, userId)
  await sendTextAndPersist(conversationId, userPhone, formatResponse(result))
} catch (error: any) {
  logger.error('Document processing failed', error)

  const errorMessage = error?.message?.includes('Unsupported')
    ? 'Sorry, I can only process PDF files and images.'
    : 'I had trouble processing the document. Can you try again?'

  await sendTextAndPersist(conversationId, userPhone, errorMessage).catch(log)
}
```

---

## Debugging

### Local Development

```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev

# Test webhook
curl -X POST http://localhost:3000/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{"entry":[]}'
```

### Production

```bash
# Stream logs
vercel logs --follow --project app-name

# Filter by request ID
vercel logs | grep "requestId\":\"xyz123"

# Find errors
vercel logs | grep '"level":"error"'
```

### Request Tracing

```typescript
const traceId = getRequestId()

logger.info('Processing message', { requestId: traceId, userId })
logger.info('Calling OpenAI', { requestId: traceId, metadata: { model } })
logger.info('Saving to DB', { requestId: traceId, metadata: { table } })
logger.info('Response sent', { requestId: traceId, duration })
```

**Search:** `vercel logs | grep "xyz123"`

---

## Production Playbook

### Incident Response Decision Tree

| Alert | Command | Action |
|-------|---------|--------|
| **High Error Rate** | `vercel logs \| grep error \| jq .error.message \| sort \| uniq -c` | Identify most common error |
| **Slow Response** | `vercel logs \| jq 'select(.duration > 5000)'` | Find slow requests |
| **High Memory** | `vercel logs \| grep "Cold start"` | Check cold start frequency |

### Health Check Endpoint

```typescript
// app/api/health/route.ts
export const runtime = 'edge'

export async function GET(req: Request): Promise<Response> {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      supabase: 'unknown',
      openai: 'unknown'
    }
  }

  try {
    await supabase.from('messages').select('id').limit(1)
    health.checks.supabase = 'healthy'
  } catch {
    health.checks.supabase = 'unhealthy'
    health.status = 'degraded'
  }

  return Response.json(health, {
    status: health.status === 'healthy' ? 200 : 503
  })
}
```

### Alerting Rules

| Alert | Threshold | Duration |
|-------|-----------|----------|
| Error Rate | >1% | 5 min |
| Latency (P95) | >500ms | 5 min |
| Availability | <99% | 15 min |
| Cold Starts | >10% | 1 hour |

---

## Common Errors

### WhatsApp API

| Status | Cause | Solution |
|--------|-------|----------|
| 400 | Invalid phone | Validate format |
| 401 | Invalid token | Check WHATSAPP_TOKEN |
| 403 | Rate limit | Token bucket + retry |
| 404 | Message not found | Check ID |
| 500 | Server error | Retry with backoff |

### OpenAI API

| Error | Cause | Solution |
|-------|-------|----------|
| Timeout | Slow response | Reduce max_tokens |
| 429 | Rate limit | Queue or backoff |
| 400 | Bad parameters | Validate inputs |
| Content filter | Flagged content | Handle gracefully |

### Error Handlers

```typescript
// WhatsApp
if (!res.ok) {
  if (res.status === 429) {
    await new Promise(r => setTimeout(r, 5000))
    return sendWhatsAppRequest(payload)  // Retry once
  }
  throw new Error(`WhatsApp API ${res.status}`)
}

// OpenAI
try {
  const response = await client.chat.completions.create({ ... })
  return response.choices[0]?.message?.content
} catch (error: any) {
  if (error.status === 429) {
    throw new AppError('OpenAI rate limit', 'RATE_LIMIT', 429)
  }
  throw error
}
```

---

## Monitoring Checklist

### Pre-Deployment
- [ ] Structured logging implemented
- [ ] Request IDs generated
- [ ] Performance budgets set
- [ ] Health check endpoint created
- [ ] Log level configured (production: info/warn/error)

### Post-Deployment
- [ ] Vercel Observability enabled
- [ ] Error rate <0.1%
- [ ] P95 latency <100ms
- [ ] Cold starts <5%
- [ ] Memory usage <100 MB
- [ ] Logs searchable by requestId

### Ongoing
- [ ] Monitor error trends daily
- [ ] Review slow requests weekly
- [ ] Analyze cold starts monthly
- [ ] Optimize budgets quarterly

---

## Related Docs

- [Edge Runtime Essentials](./01-edge-essentials.md)
- [Performance Optimization](./02-performance.md)
- [Security Best Practices](./03-security.md)
- [AI SDK Edge Compatibility](../AI-SDK/07-edge-compatibility.md)

---

**Token Count:** ~350 tokens | **Lines:** 430 | **Format:** Tables > Code > Lists
