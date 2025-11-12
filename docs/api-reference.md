# API Reference

**Updated:** 2025-11-12

---

## API Routes

### GET /api/whatsapp/webhook

Webhook verification endpoint (Meta setup).

**Headers:**
- None required

**Query Parameters:**
- `hub.mode`: Must be "subscribe"
- `hub.verify_token`: Must match `WHATSAPP_VERIFY_TOKEN`
- `hub.challenge`: Returned if verification succeeds

**Response:**
- `200 OK` with challenge string if valid
- `403 Forbidden` if invalid token

**Example:**
```
GET /api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=123
→ 200 OK: "123"
```

---

### POST /api/whatsapp/webhook

Webhook handler for incoming WhatsApp messages.

**Headers:**
- `x-hub-signature-256`: HMAC-SHA256 signature (required)
- `Content-Type`: `application/json`

**Request Body:**
```typescript
{
  entry: Array<{
    changes: Array<{
      field: 'messages',
      value: {
        messages?: Array<{
          from: string             // User phone number
          id: string               // Message ID
          timestamp: string        // Unix timestamp
          type: 'text' | 'audio' | 'image' | 'interactive'
          text?: { body: string }
          // ... other message types
        }>
      }
    }>
  }>
}
```

**Response:**
- `200 OK` - Always (fire-and-forget)
- `401 Unauthorized` - Invalid HMAC signature

**Security:**
- HMAC signature validation required
- Rate limiting applied
- Deduplication (60s window)

---

### POST /api/chat

AI streaming endpoint (example).

**Headers:**
- `Content-Type`: `application/json`

**Request Body:**
```typescript
{
  messages: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
  }>
}
```

**Response:**
- `200 OK` - Server-Sent Events stream
- `Content-Type`: `text/event-stream`

**Example:**
```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'Hello!' }
    ]
  })
})

const reader = response.body.getReader()
// Process stream...
```

---

### GET/POST /api/example

Complete echo bot example (reference implementation).

**Method:** `GET` (verification) and `POST` (webhook)
**Purpose:** Demonstration of complete flow
**Use:** Copy and customize for your needs

---

## Library Functions

### WhatsApp Messaging (`lib/whatsapp/messaging.ts`)

#### sendMessage()

Send plain text message.

```typescript
async function sendMessage(
  to: string,
  text: string
): Promise<string | null>
```

**Parameters:**
- `to`: Phone number (E.164 format: +1234567890)
- `text`: Message text (max 4096 chars)

**Returns:**
- Message ID if successful
- `null` if failed

**Example:**
```typescript
const messageId = await sendMessage('+1234567890', 'Hello!')
```

#### sendButtons()

Send interactive buttons (1-3 options).

```typescript
async function sendButtons(
  to: string,
  text: string,
  buttons: Array<{ id: string; title: string }>
): Promise<string | null>
```

**Parameters:**
- `to`: Phone number
- `text`: Message text
- `buttons`: Button array (max 3)

**Returns:**
- Message ID or `null`

**Example:**
```typescript
await sendButtons('+1234567890', 'Choose:', [
  { id: 'opt1', title: 'Option 1' },
  { id: 'opt2', title: 'Option 2' }
])
```

#### sendList()

Send interactive list (4+ options).

```typescript
async function sendList(
  to: string,
  text: string,
  rows: Array<{
    id: string
    title: string
    description?: string
  }>
): Promise<string | null>
```

**Parameters:**
- `to`: Phone number
- `text`: Message text
- `rows`: List items (max 10 per section, 10 sections)

**Returns:**
- Message ID or `null`

**Example:**
```typescript
await sendList('+1234567890', 'Select:', [
  { id: 'opt1', title: 'Option 1', description: 'Details' },
  { id: 'opt2', title: 'Option 2' }
])
```

#### sendImage()

Send image with optional caption.

```typescript
async function sendImage(
  to: string,
  imageUrl: string,
  caption?: string
): Promise<string | null>
```

**Parameters:**
- `to`: Phone number
- `imageUrl`: Image URL (max 100MB)
- `caption`: Optional caption

**Returns:**
- Message ID or `null`

**Example:**
```typescript
await sendImage(
  '+1234567890',
  'https://example.com/image.jpg',
  'Check this out!'
)
```

#### sendAudio()

Send audio file.

```typescript
async function sendAudio(
  to: string,
  audioUrl: string
): Promise<string | null>
```

#### sendReaction()

React to message with emoji.

```typescript
async function sendReaction(
  messageId: string,
  emoji: string
): Promise<void>
```

#### markAsRead()

Mark message as read.

```typescript
async function markAsRead(
  messageId: string
): Promise<void>
```

---

### AI Functions (`lib/ai/`)

#### generateText()

Generate AI response (non-streaming).

```typescript
import { generateText } from 'ai'
import { getModel } from 'lib/ai/client'

const { text } = await generateText({
  model: getModel(),
  prompt: 'Hello!'
})
```

#### streamText()

Generate streaming AI response.

```typescript
import { streamText } from 'ai'
import { getModel } from 'lib/ai/client'

const result = streamText({
  model: getModel(),
  messages: [
    { role: 'user', content: 'Hello!' }
  ]
})

return result.toDataStreamResponse()
```

#### getModel()

Get configured AI model.

```typescript
function getModel(): LanguageModel
```

**Returns:**
- Configured OpenAI model (gpt-4o-mini by default)

---

### Security Functions (`lib/security/`)

#### validateHMAC()

Validate WhatsApp webhook signature.

```typescript
async function validateHMAC(
  signature: string | null,
  body: string,
  secret: string
): Promise<boolean>
```

**Parameters:**
- `signature`: `x-hub-signature-256` header value
- `body`: Raw request body (string)
- `secret`: `WHATSAPP_APP_SECRET`

**Returns:**
- `true` if valid
- `false` if invalid

**Example:**
```typescript
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
```

#### validateEnv()

Validate required environment variables.

```typescript
function validateEnv(): void
```

**Throws:**
- Error if any required variable missing

**Example:**
```typescript
// Call on cold start
validateEnv()
```

#### sanitizeInput()

Sanitize user input.

```typescript
function sanitizeInput(text: string): string
```

**Parameters:**
- `text`: User input

**Returns:**
- Sanitized text (scripts removed, length limited)

---

### Rate Limiting (`lib/security/rate-limit.ts`)

#### rateLimit()

Check rate limit (token bucket).

```typescript
function rateLimit(
  key: string,
  maxTokens: number,
  refillRate: number
): boolean
```

**Parameters:**
- `key`: Identifier (IP, phone number)
- `maxTokens`: Bucket capacity
- `refillRate`: Tokens per second

**Returns:**
- `true` if allowed
- `false` if rate limited

**Example:**
```typescript
const ip = req.headers.get('x-forwarded-for') || 'unknown'

if (!rateLimit(ip, 10, 1)) {  // 10 burst, 1/s refill
  return new Response('Rate limited', { status: 429 })
}
```

---

### Deduplication (`lib/security/dedup.ts`)

#### isDuplicate()

Check if message already processed.

```typescript
function isDuplicate(messageId: string): boolean
```

**Parameters:**
- `messageId`: WhatsApp message ID

**Returns:**
- `true` if duplicate (skip processing)
- `false` if new (process normally)

**Example:**
```typescript
if (isDuplicate(message.id)) {
  return new Response('OK', { status: 200 })
}
```

---

## Type Definitions

### WhatsApp Types (`lib/types/whatsapp.ts`)

```typescript
interface IncomingMessage {
  from: string
  id: string
  timestamp: string
  type: 'text' | 'audio' | 'image' | 'interactive'
  text?: { body: string }
  audio?: { id: string; mime_type: string }
  image?: { id: string; mime_type: string; caption?: string }
  interactive?: {
    type: 'button_reply' | 'list_reply'
    button_reply?: { id: string; title: string }
    list_reply?: { id: string; title: string }
  }
}

interface WebhookPayload {
  entry: Array<{
    changes: Array<{
      field: 'messages'
      value: {
        messages?: IncomingMessage[]
        statuses?: Array<{
          id: string
          status: 'sent' | 'delivered' | 'read' | 'failed'
        }>
      }
    }>
  }>
}
```

### AI Types (`lib/types/ai.ts`)

```typescript
interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface Tool {
  description: string
  inputSchema: ZodSchema
  execute: (params: any) => Promise<any>
}
```

---

## Error Responses

### Standard Error Format

```typescript
interface ErrorResponse {
  error: {
    code: string
    message: string
    details?: unknown
  }
}
```

### Common Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| UNAUTHORIZED | 401 | Invalid HMAC signature |
| RATE_LIMITED | 429 | Too many requests |
| INVALID_PAYLOAD | 400 | Malformed request |
| INTERNAL_ERROR | 500 | Server error |
| TIMEOUT | 504 | Request timeout |

---

## Environment Variables

### Required

```bash
OPENAI_API_KEY          # OpenAI API key
WHATSAPP_TOKEN          # WhatsApp access token
WHATSAPP_PHONE_ID       # Phone number ID
WHATSAPP_VERIFY_TOKEN   # Webhook verification token
WHATSAPP_APP_SECRET     # App secret (HMAC validation)
```

### Optional

```bash
OPENAI_MODEL            # Override model (default: gpt-4o-mini)
NEXT_PUBLIC_APP_URL     # App URL for links
```

---

## Limits & Quotas

### Edge Runtime

- Timeout: 25s (300s streaming)
- Memory: 128MB
- Bundle size: <1MB (Hobby), <2MB (Pro)

### WhatsApp API

- Messages/sec: 80 (Business tier)
- Message length: 4096 chars
- Buttons: 3 max
- List rows: 10/section, 10 sections max
- Media: 100MB max

### Rate Limiting (Template)

- Default: 250 msg/sec (token bucket)
- Per-IP: 10 burst, 1/s refill
- Deduplication: 60s window

---

## References

**Implementation Files:**
- API Routes: `/app/api/`
- Libraries: `/lib/`
- Types: `/lib/types/`
- Examples: `/app/api/example/`

**External:**
- WhatsApp Cloud API: https://developers.facebook.com/docs/whatsapp/cloud-api
- Vercel AI SDK: https://sdk.vercel.ai/docs
- Edge Runtime: https://edge-runtime.vercel.app/
