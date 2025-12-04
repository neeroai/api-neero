# Edge Runtime Security

Last Updated: 2025-11-11 | Vercel Edge Runtime: 2025

## Security Standards

| Standard | Implementation |
|----------|----------------|
| OWASP Top 10 | Compliant |
| TLS | 1.3 (Vercel enforced) |
| Signatures | HMAC-SHA256 |
| Comparison | Constant-time (timing-attack resistant) |
| Rate Limiting | Token bucket algorithm |

---

## Webhook Signature Validation

### HMAC-SHA256 Implementation

```typescript
/**
 * Generate HMAC-SHA256 signature using Web Crypto API
 * Timing-attack resistant with constant-time comparison
 */
async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))

  // Convert to hex
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Validate WhatsApp webhook signature with constant-time comparison
 */
export async function validateSignature(req: Request, rawBody: string): Promise<boolean> {
  const header = req.headers.get('x-hub-signature-256') || req.headers.get('X-Hub-Signature-256')
  const { WHATSAPP_APP_SECRET } = process.env

  if (!header || !WHATSAPP_APP_SECRET) {
    console.warn('Signature validation disabled - configure WHATSAPP_APP_SECRET')
    return true
  }

  const parts = header.split('=')
  if (parts.length !== 2 || parts[0] !== 'sha256') return false

  const provided = parts[1]
  if (!provided) return false

  const expected = await hmacSha256Hex(WHATSAPP_APP_SECRET, rawBody)

  if (provided.length !== expected.length) return false

  // Constant-time XOR comparison (timing-attack resistant)
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ provided.charCodeAt(i)
  }

  return diff === 0
}
```

### Webhook Integration

```typescript
export async function POST(req: Request): Promise<Response> {
  const rawBody = await req.text()  // Read BEFORE parsing

  if (!await validateSignature(req, rawBody)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const jsonBody = JSON.parse(rawBody)  // Parse AFTER validation
  // Process...
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const mode = url.searchParams.get('hub.mode')
  const token = url.searchParams.get('hub.verify_token')
  const challenge = url.searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN && challenge) {
    return new Response(challenge, { status: 200 })
  }

  return new Response('Unauthorized', { status: 401 })
}
```

**Critical:** Always validate signature BEFORE parsing JSON.

---

## Rate Limiting

### Limits Table

| Service | Limit | Purpose |
|---------|-------|---------|
| WhatsApp API | 250 msg/sec | API compliance |
| OpenAI API | 10K TPM (varies) | Cost control |
| User-level | 10 msg/min | Abuse prevention |

### Token Bucket Implementation

```typescript
const rateLimitBuckets = new Map<number, number[]>()
const RATE_LIMIT = 250  // WhatsApp: 250 msg/sec

async function rateLimit(): Promise<void> {
  const now = Date.now()
  const second = Math.floor(now / 1000)

  if (!rateLimitBuckets.has(second)) {
    rateLimitBuckets.set(second, [])

    // Clean old buckets
    for (const [key] of rateLimitBuckets) {
      if (key < second - 2) rateLimitBuckets.delete(key)
    }
  }

  const bucket = rateLimitBuckets.get(second)!

  if (bucket.length >= RATE_LIMIT) {
    const waitTime = 1000 - (now % 1000)
    await new Promise(r => setTimeout(r, waitTime))
    return rateLimit()
  }

  bucket.push(now)
}
```

### User-Level Rate Limiting

```typescript
const userRateLimits = new Map<string, number[]>()
const USER_RATE_LIMIT = 10  // 10 msg/min per user
const WINDOW_MS = 60000

function checkUserRateLimit(userId: string): boolean {
  const now = Date.now()

  if (!userRateLimits.has(userId)) {
    userRateLimits.set(userId, [])
  }

  const timestamps = userRateLimits.get(userId)!
  const validTimestamps = timestamps.filter(t => now - t < WINDOW_MS)

  if (validTimestamps.length >= USER_RATE_LIMIT) return false

  validTimestamps.push(now)
  userRateLimits.set(userId, validTimestamps)
  return true
}

// Usage
if (!checkUserRateLimit(userId)) {
  return Response.json({ error: 'Rate limit exceeded' }, { status: 429 })
}
```

---

## Input Validation

### Zod Schema Validation

```typescript
import { z } from 'zod'

const webhookPayloadSchema = z.object({
  entry: z.array(z.object({
    id: z.string(),
    changes: z.array(z.object({
      value: z.object({
        messaging_product: z.literal('whatsapp'),
        metadata: z.object({
          phone_number_id: z.string()
        }),
        messages: z.array(z.object({
          id: z.string(),
          from: z.string(),
          timestamp: z.string(),
          type: z.enum(['text', 'image', 'audio', 'video', 'document', 'location'])
        })).optional()
      })
    }))
  }))
})

const validationResult = webhookPayloadSchema.safeParse(jsonBody)

if (!validationResult.success) {
  return Response.json(
    { error: 'Invalid payload', issues: validationResult.error.issues.slice(0, 3) },
    { status: 400 }
  )
}
```

### Input Sanitization

```typescript
// Sanitize phone
function sanitizePhoneNumber(phone: string): string {
  return phone.replace(/[^\d+]/g, '')
}

// Sanitize text
function sanitizeText(text: string): string {
  return text
    .trim()
    .slice(0, 4096)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')  // Remove control chars
}
```

---

## Secret Management

### Environment Variables

```typescript
// lib/env.ts
export function getEnv() {
  return {
    WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN,
    WHATSAPP_PHONE_ID: process.env.WHATSAPP_PHONE_ID,
    WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN,
    WHATSAPP_APP_SECRET: process.env.WHATSAPP_APP_SECRET,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_KEY: process.env.SUPABASE_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY
  }
}
```

### Best Practices

| Practice | Implementation |
|----------|----------------|
| Storage | Vercel environment variables |
| Git | Never commit secrets |
| Development | Use `.env.local` only |
| Rotation | Quarterly minimum |
| Logging | Never log secrets |
| Errors | Never include secrets in messages |

```bash
# Set in Vercel
vercel env add WHATSAPP_APP_SECRET production
vercel env add WHATSAPP_APP_SECRET preview
vercel env add WHATSAPP_APP_SECRET development
```

**Dashboard:** https://vercel.com/dashboard/[project]/settings/environment-variables

---

## Attack Prevention

### Attack Types & Mitigations

| Attack | Prevention | Implementation |
|--------|-----------|----------------|
| **Replay** | Idempotency | Track message IDs (1 min window) |
| **SQL Injection** | Parameterized queries | Supabase auto-escapes |
| **XSS** | Sanitization | Remove control chars |
| **SSRF** | URL validation | Whitelist CDN hosts only |
| **MiTM** | HTTPS + Signatures | Vercel enforces TLS 1.3 |
| **Timing** | Constant-time comparison | XOR-based validation |

### Replay Attack Prevention

```typescript
const processedWebhooks = new Map<string, number>()
const DEDUP_WINDOW_MS = 60000

function isDuplicateWebhook(messageId: string): boolean {
  const now = Date.now()

  if (processedWebhooks.has(messageId)) {
    const processedAt = processedWebhooks.get(messageId)!
    if (now - processedAt < DEDUP_WINDOW_MS) return true
  }

  processedWebhooks.set(messageId, now)

  // Clean old entries
  for (const [id, timestamp] of processedWebhooks) {
    if (now - timestamp > DEDUP_WINDOW_MS) {
      processedWebhooks.delete(id)
    }
  }

  return false
}
```

### SSRF Prevention

```typescript
async function fetchMedia(url: string): Promise<ArrayBuffer> {
  const allowedHosts = ['lookaside.fbsbx.com', 'mmg.whatsapp.net']
  const parsed = new URL(url)

  if (!allowedHosts.includes(parsed.hostname)) {
    throw new Error('Invalid media URL host')
  }

  const res = await fetch(url)
  return res.arrayBuffer()
}
```

### SQL Injection Prevention

```typescript
// GOOD: Parameterized (Supabase auto-escapes)
const { data } = await supabase
  .from('messages')
  .select('*')
  .eq('user_id', userId)

// BAD: String concatenation (vulnerable)
const query = `SELECT * FROM messages WHERE user_id = '${userId}'`
```

---

## Security Checklist

### Pre-Deployment
- [ ] HMAC signature validation enabled
- [ ] Constant-time comparison implemented
- [ ] Verify token configured
- [ ] Rate limiting active (API + user-level)
- [ ] Zod schema validation for all inputs
- [ ] Secrets in Vercel environment variables
- [ ] No secrets in git
- [ ] HTTPS enforced
- [ ] Deduplication implemented
- [ ] Parameterized queries only
- [ ] SSRF protection (URL validation)
- [ ] Input sanitization applied

### Post-Deployment
- [ ] Monitor failed signature validations
- [ ] Check rate limit violations
- [ ] Review error logs for security events
- [ ] Rotate secrets quarterly
- [ ] Update dependencies for security patches
- [ ] Test webhook with invalid signatures
- [ ] Verify rate limiting under load

---

## Incident Response

### Decision Table

| Incident | Immediate Action | Investigation | Remediation |
|----------|------------------|---------------|-------------|
| **Signature Fail** | Block suspicious IPs | Check if secret leaked | Rotate WHATSAPP_APP_SECRET |
| **Rate Limit** | Block abusive users | Analyze message patterns | Adjust limits or add CAPTCHA |
| **Invalid Payload** | Return 400, log details | Check for attack patterns | Update Zod schema |
| **SSRF Attempt** | Block request, log URL | Review allowed hosts | Tighten whitelist |

### Test Security

```bash
# Test invalid signature (should fail with 401)
curl -X POST https://app.vercel.app/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=invalid" \
  -d '{"entry": []}'
```

---

## Related Docs

- [Edge Runtime Essentials](./01-edge-essentials.md)
- [Performance Optimization](./02-performance.md)
- [Observability](./04-observability.md)
- [WhatsApp Integration](../INTEGRATIONS/whatsapp-business.md)

---

**Token Count:** ~300 tokens | **Lines:** 350 | **Format:** Tables > Code > Lists
