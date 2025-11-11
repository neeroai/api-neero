# WhatsApp Business API Utilities

Edge Runtime compatible utilities for WhatsApp Cloud API v23.0 integration.

## Files Overview

### messaging.ts
Send text, interactive, and media messages via WhatsApp Cloud API.

**Functions:**
- `sendTextMessage(to, text)` - Send text message (max 4096 chars)
- `sendButtonMessage(to, text, buttons)` - Send interactive buttons (max 3)
- `sendListMessage(to, text, buttonText, sections)` - Send interactive list (4-10 rows)

**Usage:**
```typescript
import { sendTextMessage, sendButtonMessage } from '@/lib/whatsapp';

await sendTextMessage('1234567890', 'Hello from WhatsApp!');

await sendButtonMessage('1234567890', 'Choose an option:', [
  { id: 'opt1', title: 'Option 1' },
  { id: 'opt2', title: 'Option 2' },
]);
```

### webhook.ts
Webhook validation, message extraction, and deduplication using Web Crypto API.

**Functions:**
- `validateSignature(payload, signature, secret)` - HMAC-SHA256 validation (Edge compatible)
- `extractMessages(webhookBody)` - Extract messages from webhook payload
- `isDuplicateMessage(messageId)` - In-memory deduplication (60s window)
- `extractPhoneNumberId(webhookBody)` - Get phone number ID for replies
- `extractContact(webhookBody)` - Get contact info (WhatsApp ID, name)

**Usage:**
```typescript
import { validateSignature, extractMessages, isDuplicateMessage } from '@/lib/whatsapp';

const body = await request.text();
const signature = request.headers.get('x-hub-signature-256');

if (!await validateSignature(body, signature, process.env.WHATSAPP_APP_SECRET!)) {
  return new Response('Invalid signature', { status: 403 });
}

const payload = JSON.parse(body);
const messages = extractMessages(payload);

for (const message of messages) {
  if (isDuplicateMessage(message.id)) continue;
  // Process message
}
```

### media.ts
Download, upload, and validate media files (audio, images, documents).

**Functions:**
- `downloadMedia(mediaId)` - Download media from WhatsApp
- `uploadMedia(file, mimeType, filename)` - Upload media to WhatsApp
- `getMediaUrl(mediaId)` - Get media URL from ID
- `validateMediaUrl(url)` - Validate media URL format
- `validateMedia(buffer, mimeType)` - Validate file size and type

**Constants:**
- `MEDIA_LIMITS` - Size limits per media type
- `SUPPORTED_MIME_TYPES` - Supported MIME types per category

**Usage:**
```typescript
import { downloadMedia, uploadMedia, MEDIA_LIMITS } from '@/lib/whatsapp';

const media = await downloadMedia('media_id');
console.log(`Downloaded ${media.mimeType}, ${media.fileSize} bytes`);

const uploaded = await uploadMedia(buffer, 'image/jpeg', 'photo.jpg');
console.log(`Uploaded media ID: ${uploaded.id}`);
```

### normalization.ts
Normalize various WhatsApp message types to unified interface for AI processing.

**Functions:**
- `normalizeMessage(message)` - Convert any message type to unified interface
- `extractTextContent(normalized)` - Extract text content
- `requiresMediaDownload(normalized)` - Check if media download needed
- `formatTimestamp(timestamp)` - Format Unix timestamp to ISO string

**Usage:**
```typescript
import { normalizeMessage, extractTextContent } from '@/lib/whatsapp';

const normalized = normalizeMessage(incomingMessage);
console.log(`User ${normalized.userId}: ${normalized.content}`);

if (normalized.type === 'audio') {
  const mediaId = normalized.metadata?.mediaId;
  // Download and transcribe audio
}
```

### rate-limit.ts
Token bucket rate limiter for WhatsApp Cloud API (250 messages/second).

**Classes:**
- `RateLimiter` - Token bucket implementation with configurable capacity/refill rate

**Functions:**
- `checkRateLimit(userId, limiter?)` - Middleware helper (returns 429 if limited)

**Usage:**
```typescript
import { globalRateLimiter, checkRateLimit } from '@/lib/whatsapp';

const rateLimitResponse = checkRateLimit(userId);
if (rateLimitResponse) return rateLimitResponse;

await sendTextMessage(userId, 'Hello!');
```

## Edge Runtime Compatibility

All utilities use Web Crypto API instead of Node.js crypto module:
- HMAC-SHA256 signature validation via `crypto.subtle.sign()`
- Constant-time string comparison (replaces `crypto.timingSafeEqual()`)
- RSA/AES encryption support for WhatsApp Flows

## Environment Variables Required

```bash
WHATSAPP_TOKEN=your_access_token
WHATSAPP_PHONE_ID=your_phone_number_id
WHATSAPP_APP_SECRET=your_app_secret
```

## References

- WhatsApp Cloud API v23.0: https://developers.facebook.com/docs/whatsapp/cloud-api
- Vercel Edge Runtime: https://vercel.com/docs/functions/runtimes/edge
- Web Crypto API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API
