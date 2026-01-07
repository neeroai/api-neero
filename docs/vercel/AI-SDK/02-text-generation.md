# Text Generation with AI SDK

Last Updated: 2025-11-11 | AI SDK Version: 5.x

## Overview

Two primary APIs for text generation:
- **generateText**: Synchronous, complete response (non-interactive)
- **streamText**: Streaming, progressive response (interactive)

## Quick Comparison

| Feature | generateText | streamText |
|---------|-------------|------------|
| **Response** | Complete text at once | Progressive chunks |
| **Use Case** | Batch, email drafts, summaries | Chat, real-time UIs |
| **Latency** | Higher (wait for full response) | Lower (first token <500ms) |
| **Error Handling** | Throws exceptions | Embeds in stream |
| **Edge Compatible** | ✅ Yes | ✅ Yes (preferred) |
| **Timeout** | 25s Edge, 60s Serverless | 300s Edge, unlimited Serverless |

## generateText API

### Basic Usage

```typescript
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

const { text } = await generateText({
  model: openai('gpt-4o'),
  prompt: 'Write a vegetarian lasagna recipe for 4 people.'
})

console.log(text)
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| **model*** | ModelProvider | - | Model to use (openai('gpt-4o')) |
| **prompt** or **messages*** | string \| Message[] | - | Input text or conversation |
| system | string | - | System instructions |
| maxTokens | number | - | Max output tokens |
| temperature | number (0-2) | 1 | Randomness (0=deterministic) |
| topP | number (0-1) | 1 | Nucleus sampling |
| tools | object | - | Tool definitions for function calling |
| maxToolRoundtrips | number | 0 | Max tool iterations |
| stopSequences | string[] | - | Stop generation at these strings |

*Required parameters

### Return Values

```typescript
interface GenerateTextResult {
  text: string                    // Generated text
  usage: {
    promptTokens: number          // Input tokens
    completionTokens: number      // Output tokens
    totalTokens: number
  }
  finishReason: 'stop' | 'length' | 'tool-calls' | 'error' | 'other'
  toolCalls?: ToolCall[]          // If tools were used
  toolResults?: ToolResult[]      // Tool execution results
  response: {
    id: string                    // Response ID
    model: string                 // Model used
    timestamp: Date               // When generated
    headers?: Headers             // Raw response headers
  }
}
```

### Use Cases

| Use Case | Model | Key Settings |
|----------|-------|--------------|
| Email drafting | gpt-4o-mini | maxTokens: 512 |
| Document summarization | gpt-4o-mini | maxTokens: 150, temperature: 0 |
| ⚠️ **Data extraction** | - | Use `generateObject` instead (see 03-structured-output.md) |

### Error Handling

```typescript
try {
  const { text } = await generateText({
    model: openai('gpt-4o'),
    prompt: 'Hello!'
  })
} catch (error) {
  if (error instanceof Error) {
    console.error('Generation failed:', error.message)
  }
}
```

## streamText API

### Basic Usage

```typescript
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

const result = streamText({
  model: openai('gpt-4o'),
  prompt: 'Invent a new holiday and describe its traditions.'
})

// Consume stream
for await (const textPart of result.textStream) {
  process.stdout.write(textPart)
}
```

### Additional Parameters (Streaming-Specific)

| Parameter | Type | Description |
|-----------|------|-------------|
| onChunk | (chunk) => void | Called for each stream event |
| onFinish | (result) => void | Called when complete (text, usage, finishReason) |
| onError | (error) => void | Called on error (won't crash server) |
| experimental_transform | Transform | Smooth jittery output (`smoothStream()`) |

### Stream Types

```typescript
const result = streamText({...})

// Text stream (most common)
for await (const text of result.textStream) {
  console.log(text)
}

// Full stream (includes all events)
for await (const chunk of result.fullStream) {
  if (chunk.type === 'text-delta') {
    console.log('Text:', chunk.textDelta)
  } else if (chunk.type === 'tool-call') {
    console.log('Tool:', chunk.toolName)
  }
}

// Async generators
const text = await result.text           // Full text (waits for completion)
const toolCalls = await result.toolCalls // Tool calls (if any)
```

### Edge Runtime Response

```typescript
// app/api/chat/route.ts
export const runtime = 'edge'

export async function POST(req: Request) {
  const { prompt } = await req.json()

  const result = streamText({
    model: openai('gpt-4o'),
    prompt
  })

  // Convert to Response object
  return result.toDataStreamResponse()  // SSE format
}
```

### React Integration (useChat)

See [React Hooks](#react-hooks-usechat) below.

## React Hooks (useChat)

### Setup

```bash
npm install @ai-sdk/react
```

### Client Component (Minimal Example)

```typescript
'use client'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'

export default function Chat() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' })
  })

  return (
    <div>
      {messages.map(m => (
        <div key={m.id}>{m.role}: {m.parts.map(p => p.text).join('')}</div>
      ))}
      <form onSubmit={e => { e.preventDefault(); sendMessage({ text: input }) }}>
        <input disabled={status !== 'ready'} />
        <button type="submit">Send</button>
      </form>
    </div>
  )
}
```

### API Route

```typescript
// app/api/chat/route.ts
export const runtime = 'edge'

import { openai } from '@ai-sdk/openai'
import { convertToModelMessages, streamText, UIMessage } from 'ai'

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const result = streamText({
    model: openai('gpt-4o'),
    system: 'You are a helpful assistant.',
    messages: convertToModelMessages(messages)  // Convert UI messages
  })

  return result.toUIMessageStreamResponse()
}
```

### useChat Options

| Option | Type | Description |
|--------|------|-------------|
| messages | Message[] | Message history |
| sendMessage | (msg) => void | Send new message |
| status | string | 'ready' \| 'submitted' \| 'streaming' \| 'error' |
| stop, regenerate | () => void | Abort streaming, retry last message |
| setMessages | (msgs) => void | Manually update messages |

**Transport config**: api, headers, body, credentials
**Advanced**: experimental_throttle, id

## Conversation History Management

### Limit History (Edge Runtime Best Practice)

```typescript
// Client-side
const { messages, setMessages } = useChat({...})

// Keep only last 10 messages
useEffect(() => {
  if (messages.length > 10) {
    setMessages(messages.slice(-10))
  }
}, [messages])

// Server-side
export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  // Keep only last 15 messages (memory optimization)
  const recentMessages = messages.slice(-15)

  const result = streamText({
    model: openai('gpt-4o-mini'),
    messages: convertToModelMessages(recentMessages)
  })

  return result.toUIMessageStreamResponse()
}
```

### Supabase Persistence

```typescript
// app/api/chat/route.ts
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { messages, conversationId } = await req.json()
  const supabase = createClient()

  const result = streamText({
    model: openai('gpt-4o-mini'),
    messages: convertToModelMessages(messages),
    onFinish: async ({ text }) => {
      // Save assistant message to Supabase
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: text
      })
    }
  })

  return result.toUIMessageStreamResponse()
}
```

## Performance Optimization

### Edge Runtime Best Practices

```typescript
// ✅ GOOD: Cached client (singleton)
let cachedClient: OpenAI | null = null
export function getOpenAI() {
  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return cachedClient
}

// ✅ GOOD: Stream for perceived speed
const result = streamText({
  model: openai('gpt-4o-mini'),  // Faster model
  prompt,
  maxTokens: 512,                 // Limit output
  experimental_transform: smoothStream()  // Reduce jitter
})

// ❌ BAD: Large context in Edge Runtime
const result = streamText({
  model: openai('gpt-4o'),
  messages: last100Messages,  // 128MB memory limit!
  maxTokens: 4096             // May timeout (300s limit)
})
```

### Streaming Optimizations

```typescript
import { smoothStream } from 'ai'

const result = streamText({
  model: openai('gpt-4o'),
  prompt: 'Write a long story...',
  experimental_transform: smoothStream({
    delayInMs: 10  // Reduce jittery updates
  })
})
```

### Token Budgeting

```typescript
const result = streamText({
  model: openai('gpt-4o-mini'),
  prompt,
  maxTokens: 512,  // Limit output for cost control

  onFinish: ({ usage, text }) => {
    const cost = (usage.promptTokens * 0.15 + usage.completionTokens * 0.60) / 1_000_000
    console.log(`Cost: $${cost.toFixed(6)}`)

    // Track in DB for budget management
    trackUsage({ tokens: usage.totalTokens, cost })
  }
})
```

## Error Handling Patterns

### generateText (Throws)

```typescript
try {
  const { text } = await generateText({
    model: openai('gpt-4o'),
    prompt: 'Hello!'
  })
} catch (error) {
  if (error instanceof Error && error.message.includes('rate limit')) {
    // Retry with backoff
    await delay(1000)
    return generateText({...})
  }
  throw error
}
```

### streamText (Callbacks)

```typescript
const result = streamText({
  model: openai('gpt-4o'),
  prompt: 'Hello!',

  onError: (error) => {
    console.error('Stream error:', error)
    // Log to monitoring (won't crash server)
    logError({ error, context: 'streamText' })
  },

  onFinish: ({ text, finishReason }) => {
    if (finishReason === 'error') {
      console.error('Generation failed')
    }
  }
})

try {
  for await (const chunk of result.textStream) {
    process.stdout.write(chunk)
  }
} catch (error) {
  // Stream errors also thrown here
  console.error('Consumption error:', error)
}
```

### React Error Handling

```typescript
const { messages, error, reload, status } = useChat({...})

if (error) {
  return (
    <div>
      <p>Error: {error.message}</p>
      <button onClick={() => reload()}>Retry</button>
    </div>
  )
}

if (status === 'error') {
  return <div>Failed to load chat</div>
}
```

## Real-World Examples (Neero Patterns)

**WhatsApp Bot** (Edge, streaming, fire-and-forget):
```typescript
export const runtime = 'edge'
export async function POST(req: Request) {
  const { message, from } = await req.json()
  const history = await getConversationHistory(from, 10)

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: 'WhatsApp assistant, <300 words',
    messages: [...history, { role: 'user', content: message }],
    maxTokens: 512,
    onFinish: async ({ text }) => {
      await sendWhatsAppMessage(from, text)
      await saveMessages(from, [message, text])
    }
  })

  consumeStream(result.textStream)  // Fire-and-forget
  return new Response('OK')
}
```

**Receipt Analysis**: Use `generateObject` with vision (see 03-structured-output.md, 05-multi-modal.md)

## Next Steps

- [Structured Output](./03-structured-output.md) - Type-safe data extraction
- [Tool Calling](./04-tool-calling.md) - Function calling, agents
- [Multi-Modal](./05-multi-modal.md) - Vision, audio, embeddings
- [Providers](./06-providers.md) - OpenAI, Groq detailed setup

## Related Documentation

- [AI SDK Overview](./01-ai-sdk-overview.md)
- [Edge Runtime Performance](../EDGE-RUNTIME/02-performance.md)
- [WhatsApp Integration](../INTEGRATIONS/whatsapp-business.md)

---

Token Count: ~1,300 tokens | Lines: 534 | Format: Tables > Code > Lists (token-efficient)
