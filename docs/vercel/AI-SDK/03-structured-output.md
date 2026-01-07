# Structured Output with AI SDK

Last Updated: 2025-11-11 | AI SDK Version: 5.x

## Overview

Generate type-safe structured data from unstructured text using schema validation.

**APIs**:
- **generateObject**: Synchronous structured generation
- **streamObject**: Streaming structured generation

**Schema Libraries**:
- Zod (recommended)
- Valibot
- JSON Schema

## Quick Comparison

| Feature | generateObject | streamObject |
|---------|---------------|-------------|
| **Response** | Complete object | Progressive partial objects |
| **Use Case** | Data extraction, forms | Interactive UIs, large arrays |
| **Type Safety** | ✅ Full | ✅ Full (partial until complete) |
| **Edge Compatible** | ✅ Yes | ✅ Yes |
| **Error Handling** | Throws | Embeds in stream |

## generateObject API

### Basic Usage

```typescript
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

const schema = z.object({
  name: z.string(),
  age: z.number(),
  email: z.string().email()
})

const { object } = await generateObject({
  model: openai('gpt-4o'),
  schema,
  prompt: 'Extract: "John Smith is 30 years old, email john@example.com"'
})

// object is type-safe
console.log(object.name)   // "John Smith"
console.log(object.age)    // 30
console.log(object.email)  // "john@example.com"
```

### Parameters

```typescript
const result = await generateObject({
  // Required
  model: openai('gpt-4o'),
  schema: z.object({...}),

  // Input (pick one)
  prompt: 'Extract data from: ...',
  // OR
  messages: [
    { role: 'system', content: 'You extract structured data' },
    { role: 'user', content: 'Extract: ...' }
  ],
  system: 'System instructions',

  // Schema metadata (helps model understand)
  schemaName: 'Person',
  schemaDescription: 'A person with contact information',

  // Generation control
  temperature: 0,             // 0 recommended for structured output
  maxTokens: 1024,
  seed: undefined,            // Deterministic output

  // Error repair (experimental)
  experimental_repairText: true  // Attempt to fix malformed JSON
})
```

### Return Values

```typescript
interface GenerateObjectResult<T> {
  object: T                   // Type-safe generated object
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  finishReason: 'stop' | 'length' | 'error' | 'other'
  reasoning?: string          // Model's thought process (if available)
  response: {
    id: string
    model: string
    timestamp: Date
  }
}
```

### Zod Schema Patterns

| Pattern | Example |
|---------|---------|
| **Basic types** | `z.string()`, `z.number()`, `z.boolean()`, `z.string().email()`, `z.string().date()` |
| **Arrays** | `z.array(z.string())`, `z.array(z.object({...}))` |
| **Nested objects** | `z.object({ person: z.object({ address: z.object({...}) }) })` |
| **Descriptions** | `z.string().describe('Full legal name')` |
| **Union types** | `z.union([z.literal('a'), z.literal('b')])` |
| **Optional** | `z.string().optional()`, `z.string().nullable()`, `z.string().default('fallback')` |

## streamObject API

### Basic Usage

```typescript
import { streamObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

const schema = z.object({
  recipe: z.object({
    name: z.string(),
    ingredients: z.array(z.object({
      name: z.string(),
      amount: z.string()
    })),
    steps: z.array(z.string())
  })
})

const result = streamObject({
  model: openai('gpt-4o'),
  schema,
  prompt: 'Generate a lasagna recipe'
})

// Stream partial objects
for await (const partialObject of result.partialObjectStream) {
  console.log('Partial:', partialObject)
  // { recipe: { name: "Las" } }
  // { recipe: { name: "Lasagna", ingredients: [...] } }
  // ...complete object
}
```

### Array Streaming (elementStream)

```typescript
const schema = z.object({
  users: z.array(z.object({
    id: z.number(),
    name: z.string(),
    email: z.string()
  }))
})

const result = streamObject({
  model: openai('gpt-4o'),
  schema,
  prompt: 'Generate 100 user profiles'
})

// Stream individual array elements (memory efficient)
for await (const element of result.elementStream) {
  console.log('User:', element)
  // { id: 1, name: "Alice", email: "alice@example.com" }
  // { id: 2, name: "Bob", email: "bob@example.com" }
  // ...
}
```

### Callbacks

```typescript
const result = streamObject({
  model: openai('gpt-4o'),
  schema,
  prompt: 'Extract data',

  onError: (error) => {
    console.error('Stream error:', error)  // Won't crash server
  },

  onFinish: ({ object, usage, finishReason }) => {
    console.log('Final object:', object)
    console.log('Tokens used:', usage.totalTokens)
  }
})
```

### React Integration (useObject)

```typescript
'use client'

import { useObject } from '@ai-sdk/react'
import { z } from 'zod'

const schema = z.object({
  notifications: z.array(z.object({
    title: z.string(),
    body: z.string()
  }))
})

export default function Notifications() {
  const { object, submit, isLoading } = useObject({
    api: '/api/generate-notifications',
    schema
  })

  return (
    <div>
      <button onClick={() => submit('Generate my notifications')}>
        Generate
      </button>

      {isLoading && <div>Generating...</div>}

      {object?.notifications?.map((notif, i) => (
        <div key={i}>
          <h3>{notif.title}</h3>
          <p>{notif.body}</p>
        </div>
      ))}
    </div>
  )
}
```

## Common Use Cases

| Use Case | Schema Example | Key Settings |
|----------|----------------|--------------|
| **Contact extraction** | `contacts: z.array(z.object({ name, phone, email }))` | gpt-4o-mini |
| **Receipt OCR** | `merchant, total, currency, items[], category` | temperature: 0, vision |
| **Survey generation** | `questions: z.array({ type, question, options? })` | gpt-4o |
| **Support classification** | `category, priority, sentiment, assignTo` | temperature: 0, gpt-4o-mini |
| **Test data** | `users: z.array({ firstName, email, age })` | gpt-4o-mini |

**Receipt OCR (Neero Pattern)**:
```typescript
const schema = z.object({
  merchant: z.string(),
  total: z.number(),
  currency: z.enum(['USD', 'EUR', 'COP']),
  category: z.enum(['food', 'transport', 'utilities', 'entertainment', 'other'])
})

const { object } = await generateObject({
  model: openai('gpt-4o-mini'),
  schema,
  messages: [{ role: 'user', content: [
    { type: 'text', text: 'Extract receipt data' },
    { type: 'image', image: receiptImageUrl }
  ]}],
  temperature: 0
})
```

## Error Handling

### NoObjectGeneratedError

```typescript
import { generateObject, NoObjectGeneratedError } from 'ai'

try {
  const { object } = await generateObject({
    model: openai('gpt-4o'),
    schema,
    prompt: 'Extract data'
  })
} catch (error) {
  if (error instanceof NoObjectGeneratedError) {
    console.error('Generation failed:', error.message)
    console.log('Text generated:', error.text)
    console.log('Cause:', error.cause)
  }
}
```

### Schema Validation Errors

```typescript
const schema = z.object({
  email: z.string().email(),  // Strict validation
  age: z.number().min(0).max(150)
})

try {
  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema,
    prompt: 'Extract: email=invalid, age=200',
    experimental_repairText: true  // Attempt repair
  })
} catch (error) {
  // Schema validation failed
  console.error('Invalid data generated:', error)
}
```

### Streaming Error Handling

```typescript
const result = streamObject({
  model: openai('gpt-4o'),
  schema,
  prompt: 'Extract data',

  onError: (error) => {
    console.error('Stream error:', error)
    logError({ error, context: 'streamObject' })
  }
})

try {
  for await (const partial of result.partialObjectStream) {
    console.log(partial)
  }
} catch (error) {
  console.error('Consumption error:', error)
}
```

## Edge Runtime Patterns

### Receipt Analysis (WhatsApp Bot)

```typescript
// app/api/whatsapp/analyze-receipt/route.ts
export const runtime = 'edge'

import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

export async function POST(req: Request) {
  const { imageUrl, userId } = await req.json()

  const schema = z.object({
    merchant: z.string(),
    total: z.number(),
    currency: z.string(),
    category: z.enum(['food', 'transport', 'utilities', 'other'])
  })

  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Extract receipt data:' },
          { type: 'image', image: imageUrl }
        ]
      }
    ],
    temperature: 0
  })

  // Save to Supabase
  await saveExpense(userId, object)

  return Response.json({ success: true, expense: object })
}
```

### Batch Data Extraction

```typescript
// Stream large datasets (memory efficient)
const schema = z.object({
  products: z.array(z.object({
    name: z.string(),
    price: z.number(),
    category: z.string()
  }))
})

const result = streamObject({
  model: openai('gpt-4o-mini'),
  schema,
  prompt: `Extract all products from this catalog:\n\n${largeCatalog}`
})

// Process elements as they arrive
for await (const product of result.elementStream) {
  await saveProduct(product)
}
```

## Performance Optimization

### Temperature Settings

```typescript
// ✅ GOOD: Use temperature=0 for structured data
const { object } = await generateObject({
  model: openai('gpt-4o-mini'),
  schema,
  prompt: 'Extract financial data',
  temperature: 0  // Deterministic, accurate
})

// ❌ BAD: High temperature for structured output
const { object } = await generateObject({
  model: openai('gpt-4o'),
  schema,
  prompt: 'Extract data',
  temperature: 0.8  // Unpredictable, may fail validation
})
```

### Schema Optimization

```typescript
// ✅ GOOD: Simple, clear schemas
const schema = z.object({
  name: z.string().describe('Full name'),
  age: z.number().describe('Age in years')
})

// ❌ BAD: Over-complicated schemas
const schema = z.object({
  name: z.string().regex(/^[A-Z][a-z]+ [A-Z][a-z]+$/),  // Too strict
  age: z.number().refine(x => x > 0 && x < 150, {
    message: 'Age must be realistic'
  })  // Complex validation
})
```

### Token Budgeting

```typescript
const { object, usage } = await generateObject({
  model: openai('gpt-4o-mini'),  // Cheaper model
  schema,
  prompt: 'Extract data',
  maxTokens: 512  // Limit output
})

// Track cost (GPT-4o-mini: $0.15/$0.60 per 1M tokens)
const cost = (usage.promptTokens * 0.15 + usage.completionTokens * 0.60) / 1_000_000
console.log(`Cost: $${cost.toFixed(6)}`)
```

## Next Steps

- [Tool Calling](./04-tool-calling.md) - Function calling, agents
- [Multi-Modal](./05-multi-modal.md) - Vision, audio, embeddings
- [Providers](./06-providers.md) - OpenAI, Groq setup
- [Edge Compatibility](./07-edge-compatibility.md) - Best practices

## Related Documentation

- [Text Generation](./02-text-generation.md)
- [WhatsApp Integration](../INTEGRATIONS/whatsapp-business.md)
- [Supabase Integration](../INTEGRATIONS/supabase.md)

---

Token Count: ~1,100 tokens | Lines: 509 | Format: Tables > Code > Lists (token-efficient)
