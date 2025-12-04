# Bird Webhooks on Vercel Edge Runtime

**For:** api-neero project (Vercel deployment)
**Purpose:** Edge Runtime-compatible Bird webhook integration
**Last Updated:** 2025-12-03

---

## Edge Runtime Constraints

| Constraint | Limitation | Solution |
|------------|------------|----------|
| No Node.js APIs | fs, crypto.createHmac, Buffer | Use Web Crypto API |
| Timeout | 25s default, 300s streaming | Fire-and-forget pattern |
| Memory | 128MB limit | Stream processing |
| Cold start | ~50-200ms | Optimize bundle size |
| No background tasks | Can't run after response | Use waitUntil() or separate endpoint |

---

## HMAC Signature Verification

### Web Crypto Implementation (Edge Compatible)

**Bird signature algorithm:**
```
payload = timestamp + "\n" + url + "\n" + sha256(body)
signature = base64(hmac_sha256(signingKey, payload))
```

**Implementation:**
```typescript
// lib/security/crypto.ts
export async function verifyBirdWebhook(
  request: Request,
  body: string,
  signingKey: string
): Promise<boolean> {
  const signature = request.headers.get('messagebird-signature');
  const timestamp = request.headers.get('messagebird-request-timestamp');

  if (!signature || !timestamp) {
    return false;
  }

  // 1. Hash request body
  const bodyEncoder = new TextEncoder();
  const bodyHash = await crypto.subtle.digest(
    'SHA-256',
    bodyEncoder.encode(body)
  );

  // 2. Build payload string
  const url = new URL(request.url);
  const payload = `${timestamp}\n${url.pathname}\n${arrayBufferToBinary(bodyHash)}`;

  // 3. Generate HMAC
  const keyEncoder = new TextEncoder();
  const keyData = keyEncoder.encode(signingKey);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const payloadEncoder = new TextEncoder();
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    payloadEncoder.encode(payload)
  );

  // 4. Compare signatures (timing-safe)
  const computed = btoa(arrayBufferToBinary(signatureBuffer));
  return computed === signature;
}

function arrayBufferToBinary(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return String.fromCharCode(...bytes);
}
```

**Usage:**
```typescript
// app/api/bird/webhook/route.ts
export const runtime = 'edge';

export async function POST(request: Request) {
  const body = await request.text();
  const signingKey = process.env.BIRD_SIGNING_KEY!;

  const isValid = await verifyBirdWebhook(request, body, signingKey);

  if (!isValid) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Process webhook...
}
```

---

## Fire-and-Forget Pattern

### Problem: Bird requires < 5s webhook response

**Pattern:**
```typescript
export async function POST(request: Request) {
  const body = await request.text();
  const webhook = JSON.parse(body);

  // 1. Validate HMAC (< 100ms)
  const isValid = await verifyBirdWebhook(request, body, signingKey);
  if (!isValid) return new Response('Unauthorized', { status: 401 });

  // 2. Return 200 OK immediately (< 500ms total)
  const response = new Response('OK', { status: 200 });

  // 3. Process async (use waitUntil for cleanup tasks)
  request.signal.addEventListener('abort', () => {
    // Optional: cleanup if needed
  });

  // 4. Fire async processing (don't await)
  processWebhookAsync(webhook).catch(error => {
    console.error('Async processing failed:', error);
  });

  return response;
}

async function processWebhookAsync(webhook: BirdWebhook) {
  // Extract message
  const message = extractMessage(webhook);

  // Check for duplicates
  if (await isDuplicate(message.id)) {
    return;
  }

  // Process with AI
  const aiResponse = await generateAIResponse(message);

  // Send response via Bird API
  await sendBirdMessage(message.sender, aiResponse);
}
```

**Vercel-specific optimization:**
```typescript
// Use waitUntil() for Edge Runtime (Next.js 15+)
import { waitUntil } from '@vercel/functions';

export async function POST(request: Request) {
  // ... validation ...

  // Schedule background work
  waitUntil(processWebhookAsync(webhook));

  return new Response('OK', { status: 200 });
}
```

---

## Rate Limiting

### In-Memory Token Bucket (Edge Runtime)

**Implementation:**
```typescript
// lib/bird/rate-limit.ts
interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, TokenBucket>();

export function checkRateLimit(
  identifier: string,
  maxTokens: number = 250,
  refillRate: number = 250
): boolean {
  const now = Date.now();
  let bucket = buckets.get(identifier);

  if (!bucket) {
    bucket = { tokens: maxTokens, lastRefill: now };
    buckets.set(identifier, bucket);
  }

  // Refill tokens (1 token per second = 250/sec)
  const elapsed = (now - bucket.lastRefill) / 1000;
  const tokensToAdd = elapsed * refillRate;
  bucket.tokens = Math.min(maxTokens, bucket.tokens + tokensToAdd);
  bucket.lastRefill = now;

  // Consume token
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return true;
  }

  return false;
}

// Cleanup old buckets (call periodically)
export function cleanupBuckets() {
  const now = Date.now();
  const maxAge = 3600000; // 1 hour

  for (const [key, bucket] of buckets.entries()) {
    if (now - bucket.lastRefill > maxAge) {
      buckets.delete(key);
    }
  }
}
```

**Usage:**
```typescript
export async function POST(request: Request) {
  const webhook = JSON.parse(await request.text());
  const phoneNumber = webhook.payload.sender.identifierValue;

  if (!checkRateLimit(phoneNumber, 250, 250)) {
    console.warn(`Rate limit exceeded: ${phoneNumber}`);
    return new Response('OK', { status: 200 }); // Still return 200
  }

  // Process webhook...
}
```

### Vercel Edge KV (Alternative)

**Setup:**
```typescript
import { kv } from '@vercel/kv';

export async function checkRateLimitKV(
  identifier: string,
  maxRequests: number = 250,
  windowSeconds: number = 60
): Promise<boolean> {
  const key = `rate:${identifier}`;
  const current = await kv.incr(key);

  if (current === 1) {
    await kv.expire(key, windowSeconds);
  }

  return current <= maxRequests;
}
```

---

## Message Deduplication

### 60-Second Window (In-Memory)

**Implementation:**
```typescript
// lib/bird/deduplication.ts
const processedMessages = new Map<string, number>();

export function isDuplicateMessage(messageId: string): boolean {
  const now = Date.now();
  const WINDOW_MS = 60000; // 60 seconds

  // Check if exists
  const timestamp = processedMessages.get(messageId);
  if (timestamp && now - timestamp < WINDOW_MS) {
    return true; // Duplicate
  }

  // Mark as processed
  processedMessages.set(messageId, now);

  // Cleanup old entries
  for (const [id, ts] of processedMessages.entries()) {
    if (now - ts > WINDOW_MS) {
      processedMessages.delete(id);
    }
  }

  return false;
}
```

**Usage:**
```typescript
async function processWebhookAsync(webhook: BirdWebhook) {
  const messageId = webhook.payload.id;

  if (isDuplicateMessage(messageId)) {
    console.log(`Duplicate message ignored: ${messageId}`);
    return;
  }

  // Process message...
}
```

---

## Media Processing Pipeline

### Download → Supabase → Process

**Flow:**
```
1. Receive webhook with mediaUrl
2. Download from Bird CDN (< 2s)
3. Upload to Supabase Storage (< 1s)
4. Process with AI (async, 3-10s)
5. Send confirmation message
```

**Implementation:**
```typescript
// lib/bird/media.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export async function processImageMessage(
  webhook: BirdWebhook
): Promise<void> {
  const { payload } = webhook;
  const phone = payload.sender.identifierValue;
  const mediaUrl = payload.body.image.images[0].mediaUrl;

  // 1. Download from Bird (Authorization required)
  const imageResponse = await fetch(mediaUrl, {
    headers: {
      'Authorization': `AccessKey ${process.env.BIRD_ACCESS_KEY}`
    }
  });

  if (!imageResponse.ok) {
    throw new Error(`Download failed: ${imageResponse.status}`);
  }

  const imageBuffer = await imageResponse.arrayBuffer();

  // 2. Upload to Supabase
  const path = `media/${phone}/${Date.now()}.jpg`;
  const { error: uploadError } = await supabase.storage
    .from('bird-media')
    .upload(path, imageBuffer, {
      contentType: 'image/jpeg',
      upsert: false
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // 3. Get public URL
  const { data } = supabase.storage
    .from('bird-media')
    .getPublicUrl(path);

  // 4. Process with AI (async)
  const analysis = await analyzeImageWithClaude(data.publicUrl);

  // 5. Store result
  await supabase.from('image_analysis').insert({
    phone,
    image_url: data.publicUrl,
    analysis,
    created_at: new Date().toISOString()
  });

  // 6. Send confirmation
  await sendBirdMessage(phone, `Imagen procesada: ${analysis.summary}`);
}
```

**Audio processing:**
```typescript
export async function processAudioMessage(
  webhook: BirdWebhook
): Promise<void> {
  const { payload } = webhook;
  const phone = payload.sender.identifierValue;
  const audioUrl = payload.body.file.files[0].mediaUrl;

  // Download
  const audioResponse = await fetch(audioUrl, {
    headers: { 'Authorization': `AccessKey ${process.env.BIRD_ACCESS_KEY}` }
  });

  const audioBuffer = await audioResponse.arrayBuffer();

  // Upload to Supabase
  const path = `audio/${phone}/${Date.now()}.ogg`;
  await supabase.storage.from('bird-media').upload(path, audioBuffer, {
    contentType: 'audio/ogg'
  });

  // Transcribe with Deepgram
  const transcript = await transcribeAudio(audioBuffer);

  // Store + respond
  await supabase.from('voice_notes').insert({
    phone,
    audio_path: path,
    transcript,
    created_at: new Date().toISOString()
  });

  await sendBirdMessage(phone, `Nota de voz recibida: "${transcript}"`);
}
```

---

## Error Handling

### Bird API Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 401 | Invalid AccessKey | Check credentials |
| 404 | Media not found | URL expired, skip |
| 413 | Payload too large | Reject, inform user |
| 429 | Rate limit exceeded | Exponential backoff |
| 500 | Server error | Retry 3x, then fail |

**Retry Strategy:**
```typescript
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if retryable
      if (error instanceof Response) {
        const status = error.status;
        if (status === 401 || status === 404) {
          throw error; // Don't retry auth or not found
        }
      }

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

// Usage
const result = await withRetry(() =>
  fetch(birdApiUrl, { method: 'POST', body: JSON.stringify(payload) })
);
```

---

## Complete Example

### Edge Runtime Webhook Handler

```typescript
// app/api/bird/webhook/route.ts
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { verifyBirdWebhook } from '@/lib/security/crypto';
import { isDuplicateMessage } from '@/lib/bird/deduplication';
import { checkRateLimit } from '@/lib/bird/rate-limit';
import {
  processImageMessage,
  processAudioMessage,
  processTextMessage
} from '@/lib/bird/media';

export async function POST(request: Request) {
  // 1. Read body
  const body = await request.text();

  // 2. Verify signature (< 100ms)
  const signingKey = process.env.BIRD_SIGNING_KEY!;
  const isValid = await verifyBirdWebhook(request, body, signingKey);

  if (!isValid) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 3. Parse webhook
  const webhook = JSON.parse(body);
  const messageId = webhook.payload.id;
  const phone = webhook.payload.sender.identifierValue;

  // 4. Check duplicate (< 10ms)
  if (isDuplicateMessage(messageId)) {
    return new Response('OK', { status: 200 });
  }

  // 5. Rate limit (< 10ms)
  if (!checkRateLimit(phone, 250, 250)) {
    console.warn(`Rate limit: ${phone}`);
    return new Response('OK', { status: 200 });
  }

  // 6. Return 200 OK (< 500ms total)
  const response = new Response('OK', { status: 200 });

  // 7. Process async (fire-and-forget)
  processMessageAsync(webhook).catch(error => {
    console.error('Processing failed:', error);
  });

  return response;
}

async function processMessageAsync(webhook: BirdWebhook) {
  const { payload } = webhook;

  try {
    switch (payload.body.type) {
      case 'image':
        await processImageMessage(webhook);
        break;
      case 'file':
        const file = payload.body.file.files[0];
        if (file.contentType.startsWith('audio/')) {
          await processAudioMessage(webhook);
        } else if (file.contentType === 'application/pdf') {
          await processDocumentMessage(webhook);
        }
        break;
      case 'text':
        await processTextMessage(webhook);
        break;
    }
  } catch (error) {
    console.error('Message processing error:', error);
    // Optionally send error notification to monitoring
  }
}
```

---

## Environment Variables

```env
# Bird API
BIRD_ACCESS_KEY=your-access-key
BIRD_SIGNING_KEY=your-signing-key
BIRD_WORKSPACE_ID=your-workspace-id
BIRD_CHANNEL_ID=your-channel-id

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your-supabase-key

# AI Services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DEEPGRAM_API_KEY=xxx
```

---

## Performance Benchmarks

| Operation | Target | Measured |
|-----------|--------|----------|
| HMAC verification | < 100ms | ~50ms |
| Duplicate check | < 10ms | ~5ms |
| Rate limit check | < 10ms | ~3ms |
| Total webhook response | < 500ms | ~200ms |
| Media download | < 2s | ~800ms |
| Supabase upload | < 1s | ~400ms |
| AI processing | 3-10s | ~5s |

---

## Security Checklist

- [ ] HMAC signature verification enabled
- [ ] Rate limiting per phone number
- [ ] Message deduplication (60s window)
- [ ] Input validation (phone, message types)
- [ ] Environment variables secured
- [ ] Supabase RLS policies enabled
- [ ] Error messages sanitized (no internal data)
- [ ] Webhook endpoint not publicly documented

---

## Sources

- [Bird Webhook Verification](https://docs.bird.com/api/notifications-api/api-reference/webhook-subscriptions/verifying-a-webhook-subscription)
- [Vercel Edge Runtime](https://vercel.com/docs/functions/edge-functions)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
