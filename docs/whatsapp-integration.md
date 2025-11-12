# WhatsApp Integration Guide

**API Version:** v23.0 Cloud API | **Updated:** 2025-11-12

---

## Quick Start

### 1. Get Credentials

From Meta Business Manager (developers.facebook.com):
- `WHATSAPP_TOKEN` - Access token
- `WHATSAPP_PHONE_ID` - Phone number ID
- `WHATSAPP_VERIFY_TOKEN` - Webhook verification token (you create this)
- `WHATSAPP_APP_SECRET` - App secret (for HMAC validation)

### 2. Configure Webhook

**URL:** `https://your-domain.vercel.app/api/whatsapp/webhook`
**Verify Token:** Match your `WHATSAPP_VERIFY_TOKEN`
**Fields:** Subscribe to `messages`

### 3. Test

Send message to WhatsApp number → Webhook receives → AI responds

**Validated Source:** docs-global/platforms/whatsapp/api-v23-guide.md:6-28

---

## Message Types

### Text Messages

```typescript
// Send
await sendMessage(phoneNumber, 'Hello!')

// Receive (webhook)
if (message.type === 'text') {
  const text = message.text.body
}
```

### Interactive Buttons (1-3 options)

```typescript
// Send
await sendButtons(phoneNumber, 'Choose an option:', [
  { id: 'opt1', title: 'Option 1' },
  { id: 'opt2', title: 'Option 2' }
])

// Receive (webhook)
if (message.type === 'interactive' &&
    message.interactive?.type === 'button_reply') {
  const buttonId = message.interactive.button_reply.id
}
```

### Interactive Lists (4+ options)

```typescript
// Send
await sendList(phoneNumber, 'Select:', [
  { id: 'opt1', title: 'Option 1', description: 'Details' }
])

// Receive (webhook)
if (message.type === 'interactive' &&
    message.interactive?.type === 'list_reply') {
  const selectedId = message.interactive.list_reply.id
}
```

### Media Messages

```typescript
// Send image
await sendImage(phoneNumber, imageUrl, 'Caption')

// Send audio
await sendAudio(phoneNumber, audioUrl)

// Receive (webhook)
if (message.type === 'image') {
  const imageId = message.image.id
  const url = await downloadMedia(imageId)
}
```

**Validated Source:** docs-global/platforms/whatsapp/api-v23-guide.md:30-67

---

## Webhook Structure

### Incoming Message

```typescript
interface WebhookPayload {
  entry: Array<{
    changes: Array<{
      field: 'messages'
      value: {
        messages?: Array<{
          from: string            // User phone number
          id: string              // Message ID
          timestamp: string       // Unix timestamp
          type: 'text' | 'audio' | 'image' | 'interactive'
          text?: { body: string }
          interactive?: {
            type: 'button_reply' | 'list_reply'
            button_reply?: { id: string; title: string }
            list_reply?: { id: string; title: string }
          }
        }>
        statuses?: Array<{      // Message status updates
          id: string
          status: 'sent' | 'delivered' | 'read' | 'failed'
        }>
      }
    }>
  }>
}
```

### Processing Pattern

```typescript
export async function POST(req: Request) {
  const body = await req.json()

  for (const entry of body.entry) {
    for (const change of entry.changes) {
      if (change.field === 'messages') {
        const message = change.value.messages?.[0]
        if (message) {
          await processMessage(message)
        }
      }
    }
  }

  return new Response('OK', { status: 200 })
}
```

**Validated Source:** docs-global/platforms/whatsapp/api-v23-guide.md:69-102

---

## Rate Limits

| Limit Type | Value | Template Implementation |
|-----------|-------|-------------------------|
| Messages/sec | 80 (Business tier) | Token bucket: 250 msg/sec |
| Message length | 4096 chars | Validated in `sendMessage()` |
| Buttons | 3 max | Enforced in `sendButtons()` |
| List rows | 10/section, 10 sections | Enforced in `sendList()` |
| Media size | 100 MB | No validation (client-side) |

**Note:** Template implements 250 msg/sec to provide buffer above API limit.

**Validated Source:** docs-global/platforms/whatsapp/api-v23-guide.md:117-126

---

## Error Handling

### Common Errors

| Code | Meaning | Action |
|------|---------|--------|
| 130429 | Rate limit exceeded | Retry with exponential backoff |
| 131051 | Unsupported message type | Use supported type |
| 133000 | Invalid parameter | Validate payload |
| 135000 | Generic error | Check `fbtrace_id` |

### Retry Strategy

```typescript
async function sendWithRetry(payload: any, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await sendMessage(payload)
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await sleep(Math.pow(2, i) * 1000) // Exponential backoff
    }
  }
}
```

**Validated Source:** docs-global/platforms/whatsapp/api-v23-guide.md:128-153

---

## Advanced Features

### Typing Indicators

```typescript
// Show "typing..."
await sendTypingIndicator(phoneNumber, 'on')

// Process AI response...

// Hide "typing..."
await sendTypingIndicator(phoneNumber, 'off')
```

### Read Receipts

```typescript
await markMessageAsRead(messageId)
```

### Reactions

```typescript
await reactToMessage(messageId, '👍')
```

**Validated Source:** docs-global/platforms/whatsapp/api-v23-guide.md:104-115

---

## 2025 Breaking Changes

### April 2025: US Marketing Template Restriction

**Effective:** April 1, 2025
**Impact:** Marketing templates to US numbers PAUSED (temporary)

**Workaround:** Use SERVICE/UTILITY templates or 24h window

```typescript
// Blocked
await sendTemplate('+1234567890', {
  name: 'marketing_promo',
  category: 'MARKETING'
})

// Allowed
await sendTemplate('+1234567890', {
  name: 'service_followup',
  category: 'SERVICE'
})
```

### July 2025: Pricing Model Change (CBP → PMP)

**Effective:** July 1, 2025
**Change:** Per-message pricing replaces conversation-based pricing

| Type | After July 2025 |
|------|-----------------|
| Utility within 24h | FREE |
| Marketing within 24h | $0.0667 |
| SERVICE templates | FREE |

**Impact:** POSITIVE (more free opportunities)
**Code changes:** None (automatic)

### October 2025: On-Premises API Deprecation

**Effective:** October 2025
**Change:** Cloud API only
**Impact:** None (already using Cloud API v23.0)

**Validated Source:** docs-global/platforms/whatsapp/api-v23-guide.md:164-235

---

## Best Practices

### 1. Use Interactive Messages

Prefer buttons/lists over free text for better UX and tracking:

```typescript
// Good: Structured options
await sendButtons(phone, 'What would you like?', [
  { id: 'help', title: 'Get Help' },
  { id: 'info', title: 'Learn More' }
])

// Less ideal: Free text prompt
await sendMessage(phone, 'Reply "help" or "info"')
```

### 2. Implement Graceful Degradation

```typescript
try {
  await sendButtons(phone, text, buttons)
} catch (error) {
  // Fallback to text if buttons fail
  await sendMessage(phone, text)
}
```

### 3. Respect Rate Limits

```typescript
// Queue messages instead of sending in burst
const queue = new MessageQueue({ rateLimit: 80 })
await queue.add(message)
```

### 4. Upload Media to Permanent Storage

```typescript
// Bad: Send media by ID (temporary, 30 days)
await sendImage(phone, { id: mediaId })

// Good: Send by URL (permanent)
await sendImage(phone, { link: permanentUrl })
```

**Validated Source:** docs-global/platforms/whatsapp/api-v23-guide.md:155-162

---

## Template Implementation

### Sending Messages

**File:** `lib/whatsapp/messaging.ts`

Functions available:
- `sendMessage(to, text)` - Plain text
- `sendButtons(to, text, buttons)` - Interactive buttons
- `sendList(to, text, rows)` - Interactive list
- `sendImage(to, url, caption?)` - Image with optional caption
- `sendAudio(to, url)` - Audio file
- `sendReaction(messageId, emoji)` - React to message

### Webhook Processing

**File:** `/api/whatsapp/webhook/route.ts`

Pattern:
1. Validate HMAC signature
2. Check rate limit
3. Deduplicate message
4. Process message by type
5. Generate AI response
6. Send response
7. Return 200 OK

### Complete Example

**File:** `/api/example/route.ts`

End-to-end implementation showing:
- Webhook validation
- Message handling
- AI integration
- Error handling
- Response sending

---

## References

**Validated Against:**
- docs-global/platforms/whatsapp/api-v23-guide.md (Core API reference)
- docs-global/platforms/whatsapp/integration-plan.md (Implementation patterns)

**External:**
- WhatsApp Cloud API: https://developers.facebook.com/docs/whatsapp/cloud-api
- Meta Business Manager: https://business.facebook.com
