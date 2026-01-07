# Multi-Modal Capabilities with AI SDK

Last Updated: 2025-11-11 | AI SDK Version: 5.x

## Overview

Multi-modal capabilities enable AI models to process and generate content beyond text: images, audio, and vector embeddings.

**Supported Modalities**:
- **Vision**: Image analysis with generateText/streamText
- **Audio Transcription**: Speech-to-text with transcribe()
- **Text-to-Speech**: Voice synthesis with generateSpeech()
- **Embeddings**: Vector representations with embed()

## Vision (Image Analysis)

### Basic Image Analysis

```typescript
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

const { text } = await generateText({
  model: openai('gpt-4o'),
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'What is in this image?' },
        { type: 'image', image: 'https://example.com/image.jpg' }
      ]
    }
  ]
})

console.log(text)  // "This image shows a sunset over the ocean..."
```

### Multiple Images

```typescript
const { text } = await generateText({
  model: openai('gpt-4o'),
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Compare these two images' },
        { type: 'image', image: imageUrl1 },
        { type: 'image', image: imageUrl2 }
      ]
    }
  ]
})
```

### Image from File (Base64)

```typescript
// Convert file to base64 data URL
const imageBuffer = await readFile('receipt.jpg')
const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`

const { text } = await generateText({
  model: openai('gpt-4o-mini'),
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Analyze this receipt' },
        { type: 'image', image: base64Image }
      ]
    }
  ]
})
```

### Vision with Structured Output

```typescript
import { generateObject } from 'ai'
import { z } from 'zod'

const schema = z.object({
  merchant: z.string(),
  total: z.number(),
  date: z.string(),
  items: z.array(z.object({
    name: z.string(),
    price: z.number()
  }))
})

const { object } = await generateObject({
  model: openai('gpt-4o-mini'),
  schema,
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Extract receipt data' },
        { type: 'image', image: receiptImageUrl }
      ]
    }
  ]
})

// Type-safe receipt data
console.log(object.total)      // number
console.log(object.items[0].name)  // string
```

### Supported Vision Models

| Provider | Model | Cost | Best For |
|----------|-------|------|----------|
| OpenAI | gpt-4o-mini | $0.002/img | **Recommended**: Receipts, OCR, documents |
| OpenAI | gpt-4o | $0.002/img | Complex scenes, detailed analysis |
| Anthropic | claude-sonnet-4 | $0.003/img | Document analysis |
| Google | gemini-2.0-flash | Free tier | Fast, cost-effective |

### Receipt OCR (Neero Pattern)

```typescript
export const runtime = 'edge'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'

export async function POST(req: Request) {
  const { imageUrl, userId } = await req.json()

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
      { type: 'text', text: 'Extract expense data' },
      { type: 'image', image: imageUrl }
    ]}],
    temperature: 0
  })

  await saveExpense(userId, object)
  return Response.json({ success: true, expense: object })
}
```

**ID Card Verification**: Similar pattern with `fullName`, `idNumber`, `dateOfBirth`, `expiryDate`, `isExpired` schema

## Audio Transcription

### Basic Transcription

```typescript
import { transcribe } from 'ai'
import { openai } from '@ai-sdk/openai'

const { text } = await transcribe({
  model: openai.transcriptionModel('whisper-1'),
  audioBuffer: audioFileBuffer  // ArrayBuffer or Uint8Array
})

console.log(text)  // "Hello, this is a voice message..."
```

### Transcription with Language

```typescript
const { text } = await transcribe({
  model: openai.transcriptionModel('whisper-1'),
  audioBuffer: audioFileBuffer,
  language: 'es',  // Spanish
  prompt: 'Medical consultation transcript'  // Context hint
})
```

### Supported Providers

| Provider | Model | Cost | Languages | Best For |
|----------|-------|------|-----------|----------|
| OpenAI | whisper-1 | $0.006/min | 50+ | General transcription |
| Groq | whisper-large-v3 | $0.00083/min | 50+ | 93% cheaper, faster |
| Deepgram | nova-2 | $0.0043/min | 30+ | Real-time streaming |
| AssemblyAI | best | $0.00025/min | 5+ | Ultra-low cost |

### WhatsApp Voice Message (Neero Pattern)

```typescript
// app/api/whatsapp/voice/route.ts
export const runtime = 'edge'

import { transcribe } from 'ai'
import { groq } from '@ai-sdk/groq'  // 93% cheaper than OpenAI

export async function POST(req: Request) {
  const { audioUrl, userId } = await req.json()

  // Download audio from WhatsApp
  const audioResponse = await fetch(audioUrl)
  const audioBuffer = await audioResponse.arrayBuffer()

  // Transcribe (Groq Whisper)
  const { text } = await transcribe({
    model: groq.transcriptionModel('whisper-large-v3'),
    audioBuffer: new Uint8Array(audioBuffer),
    language: 'es'  // Spanish for LATAM users
  })

  // Process with AI
  const response = await generateText({
    model: openai('gpt-4o-mini'),
    prompt: text,
    system: 'You are a helpful WhatsApp assistant'
  })

  // Send response
  await sendWhatsAppMessage(userId, response.text)

  return Response.json({ success: true })
}
```

## Text-to-Speech (TTS)

### Basic Speech Generation

```typescript
import { generateSpeech } from 'ai'
import { openai } from '@ai-sdk/openai'

const { audio } = await generateSpeech({
  model: openai.speechModel('tts-1'),
  voice: 'alloy',
  text: 'Hello, this is a voice message from your AI assistant.'
})

// audio is ArrayBuffer - save or stream to user
await writeFile('output.mp3', Buffer.from(audio))
```

### TTS Models & Voices

| Model | Cost | Voices | Use Case |
|-------|------|--------|----------|
| tts-1 | $15/1M chars | alloy, echo, fable, onyx, **nova (LATAM)**, shimmer | **Recommended**: Real-time |
| tts-1-hd | $30/1M chars | Same | Premium voiceovers |
| ElevenLabs | $0.30/1K chars | Custom | Professional audio |

**WhatsApp Voice Response**:
```typescript
const { audio } = await generateSpeech({
  model: openai.speechModel('tts-1'),
  voice: 'nova',  // Female, Latin American accent
  text: aiResponse
})
await sendWhatsAppAudio(userPhone, Buffer.from(audio))
```

## Embeddings

### Single Embedding

```typescript
import { embed } from 'ai'
import { openai } from '@ai-sdk/openai'

const { embedding } = await embed({
  model: openai.textEmbeddingModel('text-embedding-3-small'),
  value: 'The weather is nice today'
})

console.log(embedding)  // [0.021, -0.154, 0.089, ...]  (1536 dimensions)
```

### Batch Embeddings

```typescript
import { embedMany } from 'ai'

const { embeddings } = await embedMany({
  model: openai.textEmbeddingModel('text-embedding-3-small'),
  values: [
    'Document 1 content',
    'Document 2 content',
    'Document 3 content'
  ],
  maxParallelCalls: 5  // Process 5 at once
})

// embeddings is array of vectors
console.log(embeddings.length)  // 3
```

### Semantic Search with Supabase

```typescript
import { embed, cosineSimilarity } from 'ai'
import { openai } from '@ai-sdk/openai'

// Store
const { embedding } = await embed({
  model: openai.textEmbeddingModel('text-embedding-3-small'),
  value: content
})
await supabase.from('message_embeddings').insert({ message_id, embedding, content })

// Search (pgvector cosine similarity)
const { embedding: queryEmbedding } = await embed({ model, value: query })
const { data } = await supabase.rpc('search_messages', {
  query_embedding: queryEmbedding,
  match_threshold: 0.7,
  match_count: 5
})
```

**Cosine Similarity**: `cosineSimilarity(embedding1, embedding2)` returns 0-1 (higher = more similar)

### Supported Models

| Provider | Model | Dimensions | Cost (per 1M tokens) | Use Case |
|----------|-------|------------|---------------------|----------|
| OpenAI | text-embedding-3-small | 1536 | $0.020 | General semantic search |
| OpenAI | text-embedding-3-large | 3072 | $0.130 | High-precision RAG |
| Google | text-embedding-004 | 768 | Free | Cost-effective |
| Mistral | mistral-embed | 1024 | $0.100 | Multilingual |
| Cohere | embed-english-v3.0 | 1024 | $0.100 | RAG optimized |

### RAG Pattern (Retrieval-Augmented Generation)

```typescript
// 1. Index: Generate embeddings + store in vector DB
const { embeddings } = await embedMany({
  model: openai.textEmbeddingModel('text-embedding-3-small'),
  values: documents.map(d => d.content)
})
for (let i = 0; i < documents.length; i++) await storeEmbedding(documents[i].id, embeddings[i])

// 2. Query: Search similar docs + generate response with context
async function ragQuery(userQuestion: string) {
  const relevantDocs = await searchSimilarMessages(userQuestion, 3)
  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    messages: [
      { role: 'system', content: `Context:\n\n${relevantDocs.map(d => d.content).join('\n\n')}` },
      { role: 'user', content: userQuestion }
    ]
  })
  return text
}
```

## Edge Runtime Considerations

### Vision

✅ **Fully compatible** - Use image URLs (not file buffers)

```typescript
// ✅ GOOD: Use URLs
const { text } = await generateText({
  model: openai('gpt-4o-mini'),
  messages: [{
    role: 'user',
    content: [
      { type: 'text', text: 'Analyze' },
      { type: 'image', image: 'https://example.com/image.jpg' }
    ]
  }]
})

// ❌ BAD: Large base64 strings (memory limit 128MB)
const base64Image = `data:image/jpeg;base64,${largeBuffer.toString('base64')}`
```

### Audio Transcription

✅ **Compatible** - Download audio first, then transcribe

```typescript
// Edge-friendly pattern
const audioResponse = await fetch(audioUrl)
const audioBuffer = await audioResponse.arrayBuffer()
const { text } = await transcribe({
  model: groq.transcriptionModel('whisper-large-v3'),
  audioBuffer: new Uint8Array(audioBuffer)
})
```

### TTS

✅ **Compatible** - Generate audio, upload to storage

```typescript
const { audio } = await generateSpeech({
  model: openai.speechModel('tts-1'),
  voice: 'nova',
  text: response
})

// Upload to S3/R2 or send directly
await uploadAudio(Buffer.from(audio))
```

### Embeddings

✅ **Fully compatible** - Lightweight operations

```typescript
const { embedding } = await embed({
  model: openai.textEmbeddingModel('text-embedding-3-small'),
  value: message
})
```

## Performance Tips

### Vision Optimization

- Use URLs instead of base64 (faster, less memory)
- Use gpt-4o-mini for receipts/OCR (95% accuracy, 50x cheaper than gpt-4o)
- Limit image size (<5MB recommended)
- Temperature 0 for structured extraction

### Audio Optimization

- Use Groq Whisper (93% cheaper than OpenAI)
- Pre-download audio from URLs (don't stream in Edge)
- Keep audio files <10MB for Edge Runtime

### Embedding Optimization

- Batch with embedMany (faster than multiple embed calls)
- Use text-embedding-3-small (5x cheaper than large, sufficient for most use cases)
- Cache embeddings in database (don't regenerate)

## Next Steps

- [Providers](./06-providers.md) - OpenAI, Groq detailed setup
- [Edge Compatibility](./07-edge-compatibility.md) - Multi-modal in Edge Runtime
- [Structured Output](./03-structured-output.md) - Combine vision with schemas

## Related Documentation

- [Text Generation](./02-text-generation.md)
- [WhatsApp Integration](../INTEGRATIONS/whatsapp-business.md)
- [Supabase Integration](../INTEGRATIONS/supabase.md)

---

Token Count: ~1,000 tokens | Lines: 478 | Format: Code > Tables > Lists (multi-modal focused)
