# Customization Guide

**Updated:** 2025-11-12

---

## Overview

Template provides complete implementation. Customize for your specific use case by:

1. Customizing AI prompts
2. Adding custom tools
3. Implementing conversation persistence
4. Customizing message handling
5. Adding business logic

---

## 1. Customize AI Prompts

### System Prompt

**File:** `lib/ai/prompts.ts`

```typescript
export const systemPrompt = `You are a helpful assistant for [YOUR BUSINESS].

Role:
- [Define assistant's role]
- [Specific capabilities]
- [Limitations]

Guidelines:
- Keep responses under 500 words (WhatsApp readability)
- Use simple language
- Ask clarifying questions
- Be [friendly/professional/formal]

Context:
- Business hours: [YOUR HOURS]
- Services: [YOUR SERVICES]
- Contact: [YOUR CONTACT]
`
```

### Dynamic Context

```typescript
export function buildSystemPrompt(userContext?: {
  name?: string
  history?: string
  location?: string
}): string {
  return `${systemPrompt}

User Context:
${userContext?.name ? `- Name: ${userContext.name}` : ''}
${userContext?.history ? `- History: ${userContext.history}` : ''}
${userContext?.location ? `- Location: ${userContext.location}` : ''}
`
}
```

### Temperature & Creativity

```typescript
// lib/ai/config.ts
export const AI_CONFIG = {
  // Deterministic (customer support): 0.3
  temperature: 0.3,

  // Creative (content generation): 0.8
  // temperature: 0.8,

  maxTokens: 500  // Short responses for WhatsApp
}
```

---

## 2. Add Custom Tools

### Tool Structure

**File:** `lib/ai/tools.ts`

```typescript
import { tool } from 'ai'
import { z } from 'zod'

export const tools = {
  // Existing: getCurrentTime
  getCurrentTime: tool({
    description: 'Get current time',
    inputSchema: z.object({}),
    execute: async () => ({
      time: new Date().toISOString()
    })
  }),

  // Add your custom tools here
  searchProducts: tool({
    description: 'Search products in catalog',
    inputSchema: z.object({
      query: z.string().describe('Search query'),
      category: z.string().optional()
    }),
    execute: async ({ query, category }) => {
      // Call your product API
      const results = await fetch(
        `https://api.yoursite.com/products?q=${query}&cat=${category}`
      )
      return results.json()
    }
  }),

  makeReservation: tool({
    description: 'Make a reservation',
    inputSchema: z.object({
      date: z.string().describe('Date (YYYY-MM-DD)'),
      time: z.string().describe('Time (HH:MM)'),
      guests: z.number().describe('Number of guests')
    }),
    execute: async ({ date, time, guests }) => {
      // Call your booking API
      const response = await fetch('https://api.yoursite.com/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, time, guests })
      })
      return response.json()
    }
  })
}
```

### Tool Best Practices

1. **Clear descriptions:** Helps model decide when to use
2. **Validate inputs:** Use Zod schemas
3. **Handle errors:** Return user-friendly messages
4. **Keep simple:** One tool = one action
5. **Test thoroughly:** Mock API calls in tests

---

## 3. Implement Conversation Persistence

### Using Drizzle ORM (Provided Example)

**File:** `lib/db/schema.ts`

```typescript
import { pgTable, text, timestamp, jsonb } from 'drizzle-orm/pg-core'

export const conversations = pgTable('conversations', {
  phoneNumber: text('phone_number').primaryKey(),
  lastMessageAt: timestamp('last_message_at').defaultNow(),
  context: jsonb('context').$type<ConversationContext>(),
  createdAt: timestamp('created_at').defaultNow()
})

export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  phoneNumber: text('phone_number').notNull(),
  role: text('role').$type<'user' | 'assistant'>().notNull(),
  content: text('content').notNull(),
  timestamp: timestamp('timestamp').defaultNow()
})
```

### Save Messages

```typescript
// lib/db/conversations.ts
import { db } from './client'
import { messages } from './schema'

export async function saveMessage(
  phoneNumber: string,
  role: 'user' | 'assistant',
  content: string
) {
  await db.insert(messages).values({
    id: crypto.randomUUID(),
    phoneNumber,
    role,
    content
  })
}
```

### Load History

```typescript
export async function getConversationHistory(
  phoneNumber: string,
  limit = 10
) {
  return await db
    .select()
    .from(messages)
    .where(eq(messages.phoneNumber, phoneNumber))
    .orderBy(desc(messages.timestamp))
    .limit(limit)
}
```

### Use in Message Handler

```typescript
// app/api/whatsapp/webhook/route.ts
const history = await getConversationHistory(from, 10)

const response = await generateText({
  model: openai('gpt-4o-mini'),
  messages: [
    { role: 'system', content: systemPrompt },
    ...history,  // Include conversation history
    { role: 'user', content: message.text.body }
  ]
})

await saveMessage(from, 'user', message.text.body)
await saveMessage(from, 'assistant', response.text)
```

---

## 4. Customize Message Handling

### Custom Message Logic

**File:** `app/api/example/route.ts` (copy and modify)

```typescript
// Handle different message types
switch (message.type) {
  case 'text':
    // Your custom text handling
    if (message.text.body.toLowerCase().includes('help')) {
      await sendButtons(from, 'How can I help?', [
        { id: 'support', title: 'Support' },
        { id: 'info', title: 'Info' }
      ])
    } else {
      // Generate AI response
      const response = await generateResponse(message.text.body)
      await sendMessage(from, response)
    }
    break

  case 'audio':
    // Your custom audio handling
    const audioUrl = await downloadMedia(message.audio.id)
    const transcription = await transcribeAudio(audioUrl)
    await sendMessage(from, `I heard: ${transcription}`)
    break

  case 'interactive':
    // Your custom button/list handling
    const buttonId = message.interactive?.button_reply?.id
    if (buttonId === 'support') {
      await sendMessage(from, 'Connecting you to support...')
    }
    break

  case 'image':
    // Your custom image handling
    const imageUrl = await downloadMedia(message.image.id)
    const analysis = await analyzeImage(imageUrl)
    await sendMessage(from, analysis)
    break
}
```

### Add Custom Commands

```typescript
// Command pattern
const commands = {
  '/help': async (from) => {
    await sendButtons(from, 'Choose:', [
      { id: 'faq', title: 'FAQ' },
      { id: 'contact', title: 'Contact' }
    ])
  },

  '/status': async (from) => {
    const status = await getOrderStatus(from)
    await sendMessage(from, `Your order: ${status}`)
  }
}

// In message handler
const text = message.text.body
if (text.startsWith('/')) {
  const command = commands[text.split(' ')[0]]
  if (command) {
    await command(from)
    return
  }
}
```

---

## 5. Add Business Logic

### Example: E-commerce Integration

```typescript
// lib/business/ecommerce.ts
export async function getProducts(category?: string) {
  const response = await fetch(
    `https://api.yourstore.com/products?category=${category}`
  )
  return response.json()
}

export async function createOrder(
  phoneNumber: string,
  items: Array<{ id: string; quantity: number }>
) {
  const response = await fetch('https://api.yourstore.com/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer: phoneNumber,
      items
    })
  })
  return response.json()
}
```

### Example: Appointment Booking

```typescript
// lib/business/bookings.ts
export async function getAvailableSlots(date: string) {
  const response = await fetch(
    `https://api.yoursite.com/slots?date=${date}`
  )
  return response.json()
}

export async function bookAppointment(
  phoneNumber: string,
  slot: { date: string; time: string }
) {
  const response = await fetch('https://api.yoursite.com/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer: phoneNumber,
      ...slot
    })
  })
  return response.json()
}
```

---

## Quick Customization Checklist

### Essential (5-30 minutes)

- [ ] Update system prompt (`lib/ai/prompts.ts`)
- [ ] Change app name/description (`package.json`)
- [ ] Update environment variables (`.env.example`)
- [ ] Test with your WhatsApp number

### Recommended (1-4 hours)

- [ ] Add custom tools (`lib/ai/tools.ts`)
- [ ] Customize message handling (`/api/example`)
- [ ] Implement conversation persistence (`lib/db/`)
- [ ] Add your business logic

### Advanced (4+ hours)

- [ ] Add interactive messages (buttons, lists)
- [ ] Implement media handling (images, audio)
- [ ] Add custom analytics
- [ ] Create admin dashboard
- [ ] Add multi-language support

---

## Example Customizations

### 1. Restaurant Bot

```typescript
// System prompt
const systemPrompt = `You are a helpful assistant for [Restaurant Name].

You can help with:
- Menu information
- Making reservations
- Dietary restrictions
- Operating hours
- Location

Be friendly and helpful!`

// Custom tools
const tools = {
  searchMenu: tool({...}),
  makeReservation: tool({...}),
  checkAvailability: tool({...})
}
```

### 2. E-commerce Bot

```typescript
// System prompt
const systemPrompt = `You are a sales assistant for [Store Name].

You can help with:
- Product recommendations
- Order tracking
- Returns & exchanges
- Payment questions

Be professional and helpful!`

// Custom tools
const tools = {
  searchProducts: tool({...}),
  trackOrder: tool({...}),
  processReturn: tool({...})
}
```

### 3. Support Bot

```typescript
// System prompt
const systemPrompt = `You are a support assistant for [Company Name].

You can help with:
- Technical issues
- Account questions
- Billing inquiries
- Feature requests

Be patient and thorough!`

// Custom tools
const tools = {
  searchKnowledgeBase: tool({...}),
  createTicket: tool({...}),
  escalateToHuman: tool({...})
}
```

---

## Testing Customizations

### 1. Unit Tests

```typescript
// tests/unit/custom-tools.test.ts
describe('searchProducts', () => {
  it('should return products', async () => {
    const results = await tools.searchProducts.execute({
      query: 'shoes',
      category: 'footwear'
    })
    expect(results).toHaveLength(3)
  })
})
```

### 2. Integration Tests

```typescript
// tests/integration/message-flow.test.ts
describe('Custom message flow', () => {
  it('should handle product search', async () => {
    const response = await POST(createMockRequest({
      message: { text: { body: 'show me shoes' } }
    }))
    expect(response.status).toBe(200)
  })
})
```

### 3. Manual Testing

Test with real WhatsApp:
1. Send test messages to your number
2. Verify AI responses
3. Test tool calls
4. Check error handling

---

## Best Practices

1. **Start simple:** Customize prompts first, add tools gradually
2. **Test thoroughly:** Every tool, every message type
3. **Monitor costs:** Track AI API usage
4. **Iterate:** Improve based on user feedback
5. **Document:** Keep README.md updated

---

## Get Help

- Template docs: /docs
- Vercel AI SDK: https://sdk.vercel.ai/docs
- WhatsApp API: https://developers.facebook.com/docs/whatsapp
- Community: GitHub Discussions
