# AI Integration Guide

**AI SDK Version:** 5.0 | **Updated:** 2025-11-12

---

## Overview

Template uses Vercel AI SDK 5.0 for unified AI integration. Supports 20+ providers with single API, Edge Runtime compatible, built-in streaming and tool calling.

**Core Features:**
- Streaming responses (ReadableStream)
- Tool/function calling
- Structured outputs (Zod schemas)
- Context management
- Type-safe end-to-end

**Validated Source:** docs-global/platforms/vercel/AI-SDK/01-ai-sdk-overview.md:6-19

---

## Quick Start

### Basic Text Generation

```typescript
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

const { text } = await generateText({
  model: openai('gpt-4o-mini'),
  prompt: 'Hello, how can I help?'
})
```

### Streaming Responses

```typescript
import { streamText } from 'ai'

const result = streamText({
  model: openai('gpt-4o-mini'),
  messages: [
    { role: 'user', content: 'Explain quantum computing' }
  ]
})

// Stream to client
return result.toDataStreamResponse()
```

**Validated Source:** docs-global/platforms/vercel/AI-SDK/01-ai-sdk-overview.md:71-81

---

## Model Selection

### Default: GPT-4o-mini

**Why:**
- Fast (<1s response)
- Cost-effective ($0.15/1M input tokens)
- Good for most tasks
- Edge Runtime compatible

### When to Upgrade to GPT-4o

**Use cases:**
- Complex reasoning
- Long-form content
- Multi-step analysis
- Image understanding

### Configuration

```typescript
// In lib/ai/client.ts
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

export function getModel() {
  return openai(MODEL)
}
```

**Validated Source:** docs-global/platforms/vercel/AI-SDK/01-ai-sdk-overview.md:22-34

---

## Tool Calling (Function Calling)

### Basic Pattern

```typescript
import { generateText, tool } from 'ai'
import { z } from 'zod'

const result = await generateText({
  model: openai('gpt-4o'),
  prompt: 'What time is it?',
  tools: {
    getCurrentTime: tool({
      description: 'Get current time',
      inputSchema: z.object({}),
      execute: async () => {
        return { time: new Date().toISOString() }
      }
    })
  }
})
```

### Tool Definition Structure

```typescript
const tools = {
  toolName: tool({
    description: 'Clear description helps model decide when to use',
    inputSchema: z.object({
      param: z.string().describe('Parameter description')
    }),
    execute: async ({ param }) => {
      // Perform action
      return { result: 'data' }
    }
  })
}
```

**Validated Source:** docs-global/platforms/vercel/AI-SDK/04-tool-calling.md:29-78

### Multi-Step Tool Execution

```typescript
const result = await generateText({
  model: openai('gpt-4o'),
  prompt: 'Book restaurant for tonight',
  tools: {
    searchRestaurants: tool({...}),
    makeReservation: tool({...})
  },
  maxToolRoundtrips: 5  // Allow multiple tool calls
})
```

**Validated Source:** docs-global/platforms/vercel/AI-SDK/04-tool-calling.md:83-100

---

## Streaming Implementation

### Edge Function Pattern

```typescript
// app/api/chat/route.ts
export const runtime = 'edge'

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: openai('gpt-4o-mini'),
    messages,
    temperature: 0.7
  })

  return result.toDataStreamResponse()
}
```

### Benefits

- **300s timeout** (vs. 25s non-streaming)
- **Lower memory** (chunks vs. full response)
- **Better UX** (progressive rendering)

**Validated Source:** docs-global/platforms/vercel/platform-vercel.md:107-148

---

## Context Management

### Conversation History

```typescript
// lib/ai/context.ts
interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export function buildContext(
  history: Message[],
  maxMessages = 10
): Message[] {
  // Keep last N messages
  const recent = history.slice(-maxMessages)

  // Always include system prompt
  return [
    { role: 'system', content: systemPrompt },
    ...recent
  ]
}
```

### Token Management

```typescript
// Estimate tokens (rough: 1 token ≈ 4 chars)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

// Trim if exceeds model limit
if (estimateTokens(context) > 15000) {
  context = trimOldMessages(context)
}
```

---

## Prompt Engineering

### System Prompt Structure

```typescript
// lib/ai/prompts.ts
export const systemPrompt = `You are a helpful WhatsApp assistant.

Guidelines:
- Keep responses concise (under 500 words)
- Use clear, simple language
- Ask clarifying questions if needed
- Be friendly and professional

Context: {user_context}
`
```

### Best Practices

1. **Be specific:** Clear instructions > vague descriptions
2. **Provide examples:** Show desired output format
3. **Set constraints:** Length, tone, format
4. **Use delimiters:** Separate instructions from content

---

## Error Handling

### Timeout Management

```typescript
import { withTimeout } from 'lib/utils'

try {
  const result = await withTimeout(
    generateText({ model, prompt }),
    20000  // 20s for 25s Edge Function
  )
} catch (error) {
  if (error.message === 'Timeout') {
    return 'Processing is taking longer than expected...'
  }
  throw error
}
```

### Graceful Degradation

```typescript
try {
  return await generateAIResponse(prompt)
} catch (error) {
  console.error('AI error:', error)
  return 'Sorry, I encountered an error. Please try again.'
}
```

---

## Template Implementation

### Client Caching

**File:** `lib/ai/client.ts`

```typescript
import { OpenAI } from '@ai-sdk/openai'

let cachedClient: OpenAI | null = null

export function getOpenAIClient() {
  if (!cachedClient) {
    cachedClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }
  return cachedClient
}
```

**Why:** Avoid re-initialization on every request (saves ~50ms)

**Validated Source:** docs-global/platforms/vercel/platform-vercel.md:247-258

### Streaming Handler

**File:** `lib/ai/streaming.ts`

Functions:
- `streamTextResponse(messages)` - Generate streaming response
- `formatStreamChunk(chunk)` - Format for client consumption
- `handleStreamError(error)` - Error recovery

### Tool Definitions

**File:** `lib/ai/tools.ts`

Example tool provided:
- `getCurrentTime` - Returns current timestamp

Add your custom tools:
```typescript
export const tools = {
  getCurrentTime: tool({...}),
  // Add your tools here
  searchProducts: tool({...}),
  makeReservation: tool({...})
}
```

---

## Performance Optimization

### 1. Model Selection

```typescript
// Fast queries: Use gpt-4o-mini
const quickModel = openai('gpt-4o-mini')

// Complex reasoning: Use gpt-4o
const advancedModel = openai('gpt-4o')
```

### 2. Temperature Tuning

```typescript
// Deterministic (customer support): 0.3-0.5
temperature: 0.3

// Creative (content generation): 0.7-0.9
temperature: 0.8
```

### 3. Max Tokens

```typescript
// Short responses (chat): 500 tokens
maxTokens: 500

// Long-form (articles): 2000 tokens
maxTokens: 2000
```

---

## Testing

### Unit Tests

```typescript
// tests/unit/ai-client.test.ts
describe('AI Client', () => {
  it('should generate response', async () => {
    const response = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: 'Say hello'
    })
    expect(response.text).toContain('hello')
  })
})
```

### Mocking for Tests

```typescript
// Mock OpenAI responses
vi.mock('ai', () => ({
  generateText: vi.fn().mockResolvedValue({
    text: 'Mocked response'
  })
}))
```

---

## Cost Optimization

### Model Pricing (2025)

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| gpt-4o-mini | $0.15 | $0.60 |
| gpt-4o | $2.50 | $10.00 |

### Strategies

1. **Use mini for most tasks**
2. **Cache responses** (avoid redundant calls)
3. **Trim context** (fewer tokens = lower cost)
4. **Stream responses** (cancel if user stops reading)

---

## References

**Validated Against:**
- docs-global/platforms/vercel/AI-SDK/01-ai-sdk-overview.md (Core concepts)
- docs-global/platforms/vercel/AI-SDK/04-tool-calling.md (Function calling)
- docs-global/platforms/vercel/platform-vercel.md (Edge Runtime, caching)

**External:**
- Vercel AI SDK: https://sdk.vercel.ai/docs
- OpenAI API: https://platform.openai.com/docs
