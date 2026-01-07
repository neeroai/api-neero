# Security Guide

**Updated:** 2025-11-12 | **Edge Runtime Compatible**

---

## Overview

Template implements production-grade security with Edge Runtime compatibility.

**Security Layers:**
1. HMAC signature validation (webhook authentication)
2. Environment variable validation
3. Input sanitization
4. Rate limiting
5. HTTPS enforcement (Vercel)

---

## HMAC Signature Validation

### Why Needed

WhatsApp webhooks could be spoofed without signature validation. HMAC ensures requests come from Meta.

**Validated Source:** docs-global/platforms/vercel/platform-vercel.md:399-467

### Implementation (Web Crypto API)

```typescript
// lib/security/crypto.ts
export async function validateHMAC(
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

  // Constant-time comparison (prevents timing attacks)
  const received = signature.replace('sha256=', '')
  if (expected.length !== received.length) return false

  let result = 0
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ received.charCodeAt(i)
  }

  return result === 0
}
```

### Usage in Webhook

```typescript
// app/api/whatsapp/webhook/route.ts
export const runtime = 'edge'

export async function POST(req: Request) {
  const signature = req.headers.get('x-hub-signature-256')
  const body = await req.text()

  const isValid = await validateHMAC(
    signature,
    body,
    process.env.WHATSAPP_APP_SECRET!
  )

  if (!isValid) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Process webhook...
}
```

**Why Web Crypto:** Node.js `crypto` not available in Edge Runtime

---

## Environment Variable Validation

### Runtime Validation

```typescript
// lib/security/env.ts
const requiredEnvVars = [
  'OPENAI_API_KEY',
  'WHATSAPP_TOKEN',
  'WHATSAPP_PHONE_ID',
  'WHATSAPP_VERIFY_TOKEN',
  'WHATSAPP_APP_SECRET'
]

export function validateEnv(): void {
  const missing = requiredEnvVars.filter(
    key => !process.env[key]
  )

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    )
  }
}

// Call on function cold start
validateEnv()
```

### Best Practices

1. **Validate on startup** - Fail fast if misconfigured
2. **Use strong secrets** - Min 32 chars, random
3. **Never log secrets** - Redact from logs
4. **Rotate regularly** - Change tokens every 90 days

---

## Input Sanitization

### Text Sanitization

```typescript
// lib/security/sanitize.ts
export function sanitizeInput(text: string): string {
  // Remove potentially dangerous content
  return text
    .replace(/<script.*?<\/script>/gi, '')  // Remove scripts
    .replace(/<iframe.*?<\/iframe>/gi, '')  // Remove iframes
    .replace(/javascript:/gi, '')           // Remove JS protocols
    .trim()
    .slice(0, 4096)                        // Enforce max length
}
```

### URL Validation

```typescript
export function validateURL(url: string): boolean {
  try {
    const parsed = new URL(url)
    // Only allow HTTP(S)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}
```

### Phone Number Validation

```typescript
export function validatePhoneNumber(phone: string): boolean {
  // E.164 format: +[country code][number]
  return /^\+[1-9]\d{1,14}$/.test(phone)
}
```

---

## Rate Limiting

### Token Bucket Algorithm

```typescript
// lib/security/rate-limit.ts
const buckets = new Map<string, {
  tokens: number
  lastRefill: number
}>()

export function rateLimit(
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

  // Refill tokens based on time elapsed
  const elapsed = (now - bucket.lastRefill) / 1000
  bucket.tokens = Math.min(
    maxTokens,
    bucket.tokens + elapsed * refillRate
  )
  bucket.lastRefill = now

  // Consume token
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1
    return true  // Allow request
  }

  return false  // Rate limited
}
```

### Usage

```typescript
// In webhook handler
const ip = req.headers.get('x-forwarded-for') || 'unknown'

if (!rateLimit(ip, 10, 1)) {  // 10 requests burst, 1/s refill
  return new Response('Rate limited', { status: 429 })
}
```

**Validated Source:** docs-global/platforms/vercel/platform-vercel.md:471-514

---

## Message Deduplication

### 60-Second Window

```typescript
// lib/security/dedup.ts
const processedMessages = new Map<string, number>()
const DEDUP_WINDOW = 60 * 1000  // 60 seconds

export function isDuplicate(messageId: string): boolean {
  const now = Date.now()

  // Check if already processed
  const processedAt = processedMessages.get(messageId)
  if (processedAt && (now - processedAt) < DEDUP_WINDOW) {
    return true  // Duplicate
  }

  // Mark as processed
  processedMessages.set(messageId, now)

  // Clean old entries (prevent unbounded growth)
  for (const [id, timestamp] of processedMessages.entries()) {
    if (now - timestamp > DEDUP_WINDOW) {
      processedMessages.delete(id)
    }
  }

  return false  // Not duplicate
}
```

### Usage

```typescript
if (isDuplicate(message.id)) {
  return new Response('OK', { status: 200 })  // Already processed
}
```

**Why Needed:** Meta may retry webhooks if response is slow

---

## Secrets Management

### Vercel Dashboard

1. Go to Project Settings → Environment Variables
2. Add secrets (encrypted, not visible after creation)
3. Set environment: Production, Preview, Development

### Local Development

```bash
# .env.local (NEVER commit to git)
OPENAI_API_KEY=sk-...
WHATSAPP_TOKEN=...
WHATSAPP_PHONE_ID=...
WHATSAPP_VERIFY_TOKEN=...
WHATSAPP_APP_SECRET=...
```

### .gitignore

```gitignore
.env*.local
.env.local
.env
```

---

## HTTPS Enforcement

Enforced automatically by Vercel (all requests upgraded to HTTPS).

**Benefit:** Prevents man-in-the-middle attacks

---

## Error Handling

### Never Expose Internal Errors

```typescript
// Bad: Exposes internal details
catch (error) {
  return Response.json({ error: error.message }, { status: 500 })
}

// Good: Generic error message
catch (error) {
  console.error('Internal error:', error)  // Log for debugging
  return Response.json({
    error: 'Internal server error'
  }, { status: 500 })
}
```

### Structured Error Responses

```typescript
interface ErrorResponse {
  error: {
    code: string
    message: string
  }
}

function errorResponse(
  code: string,
  message: string,
  status: number
): Response {
  return Response.json({
    error: { code, message }
  }, { status })
}

// Usage
if (!isAuthorized) {
  return errorResponse(
    'UNAUTHORIZED',
    'Invalid signature',
    401
  )
}
```

---

## Security Checklist

### Before Deployment

- [ ] HMAC validation implemented
- [ ] Environment variables validated
- [ ] Input sanitization applied
- [ ] Rate limiting configured
- [ ] Secrets in Vercel Dashboard (not code)
- [ ] .env.local in .gitignore
- [ ] Error messages sanitized (no internal details)
- [ ] HTTPS enforced (automatic on Vercel)

### Ongoing

- [ ] Rotate secrets every 90 days
- [ ] Monitor for suspicious activity
- [ ] Review logs for errors
- [ ] Update dependencies regularly

---

## Common Vulnerabilities

### Command Injection

**Risk:** User input executed as system command
**Prevention:** Never use `eval()` or `exec()` with user input (not available in Edge anyway)

### XSS (Cross-Site Scripting)

**Risk:** Malicious scripts in user input
**Prevention:** Sanitize input, remove `<script>` tags

### SQL Injection

**Risk:** Malicious SQL in user input
**Prevention:** Use parameterized queries (ORM handles this)

---

## References

**Validated Against:**
- docs-global/platforms/vercel/platform-vercel.md (HMAC, rate limiting, security patterns)

**External:**
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Web Crypto API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API
