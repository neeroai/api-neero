# AI Providers: OpenAI & Groq

Last Updated: 2025-11-11 | AI SDK: 5.x

## Provider Selection

| Provider | Best For | Cost | Speed |
|----------|----------|------|-------|
| **OpenAI** | General-purpose, vision, embeddings | Medium | Fast |
| **Groq** | Transcription (93% savings), real-time chat | Low-High | Ultra-fast (50x) |

---

## OpenAI Setup

```bash
npm install @ai-sdk/openai
```

```typescript
import { openai } from '@ai-sdk/openai'
// OPENAI_API_KEY=sk-... (env var)
```

### Models

#### Chat

| Model | Input | Output | Best For | Context |
|-------|-------|--------|----------|---------|
| **gpt-4o-mini** | $0.15/1M | $0.60/1M | **General (RECOMMENDED)** | 128K |
| gpt-4o | $2.50/1M | $10.00/1M | Complex reasoning, vision | 128K |
| o1 | $15.00/1M | $60.00/1M | Advanced reasoning | 200K |

#### Other

| Type | Model | Cost | Use Case |
|------|-------|------|----------|
| **Embeddings** | text-embedding-3-small | $0.020/1M | General RAG |
| **Vision** | gpt-4o-mini | $0.002/image | Receipts, OCR |
| **Transcription** | whisper-1 | $0.006/min | Voice messages |
| **TTS** | tts-1 | $15.00/1M chars | Voice responses |

### Usage

```typescript
// Chat
const { text } = await generateText({
  model: openai('gpt-4o-mini'),
  prompt: 'Hello!'
})

// Vision
const { text } = await generateText({
  model: openai('gpt-4o-mini'),
  messages: [{
    role: 'user',
    content: [
      { type: 'text', text: 'Analyze' },
      { type: 'image', image: imageUrl }
    ]
  }]
})

// Embeddings
const { embedding } = await embed({
  model: openai.textEmbeddingModel('text-embedding-3-small'),
  value: 'Document content'
})

// Transcription
const { text } = await transcribe({
  model: openai.transcriptionModel('whisper-1'),
  audioBuffer
})
```

### Cost Optimization

| Strategy | Implementation | Savings |
|----------|----------------|---------|
| **Use gpt-4o-mini** | Default to mini, upgrade only if needed | 16x cheaper than gpt-4o |
| **Limit maxTokens** | `maxTokens: 512` | Prevent runaway costs |
| **Monitor usage** | Track tokens, calculate cost | Cost control |
| **Use temperature: 0** | Deterministic responses | No wasted retries |

```typescript
// Monitor costs
const { text, usage } = await generateText({
  model: openai('gpt-4o-mini'),
  prompt,
  maxTokens: 512,
  temperature: 0
})

const cost = (usage.promptTokens * 0.15 + usage.completionTokens * 0.60) / 1_000_000
console.log(`Cost: $${cost.toFixed(6)}`)
```

### Rate Limits (Tier 1)

| Model | RPM | TPM |
|-------|-----|-----|
| gpt-4o-mini | 500 | 200K |
| gpt-4o | 500 | 30K |
| whisper-1 | 50 | - |
| embeddings | 500 | 1M |

**Upgrade:** https://platform.openai.com/settings/organization/limits

---

## Groq Setup

```bash
npm install @ai-sdk/groq
```

```typescript
import { groq } from '@ai-sdk/groq'
// GROQ_API_KEY=gsk_... (env var)
```

### Models

| Model | Input | Output | Speed | Context |
|-------|-------|--------|-------|---------|
| **llama-3.1-70b-versatile** | $0.59/1M | $0.79/1M | Ultra-fast | 128K |
| llama-3.1-8b-instant | $0.05/1M | $0.08/1M | Fastest | 128K |
| **whisper-large-v3** | $0.00083/min | - | Ultra-fast | - |

**93% cheaper transcription:** $0.00083/min (Groq) vs $0.006/min (OpenAI)

### Usage

```typescript
// Chat
const { text } = await generateText({
  model: groq('llama-3.1-70b-versatile'),
  prompt: 'Hello!'
})

// Transcription (93% savings)
const { text } = await transcribe({
  model: groq.transcriptionModel('whisper-large-v3'),
  audioBuffer,
  language: 'es'
})
```

### Pros & Cons

| Aspect | Rating | Notes |
|--------|--------|-------|
| **Speed** | ✅ 50x faster | 10-50x more tokens/sec than OpenAI |
| **Transcription cost** | ✅ 93% savings | $0.00083/min vs $0.006/min |
| **Free tier** | ✅ Generous | 14,400 requests/day |
| **Vision** | ❌ Not available | Use OpenAI |
| **TTS** | ❌ Not available | Use OpenAI |
| **Embeddings** | ❌ Not available | Use OpenAI |

---

## Multi-Provider Strategy

### Cost-Optimized Selection

```typescript
function selectModel(useCase: 'chat' | 'transcription' | 'vision') {
  switch (useCase) {
    case 'chat':
      return openai('gpt-4o-mini')  // Best cost/quality
    case 'transcription':
      return groq.transcriptionModel('whisper-large-v3')  // 93% savings
    case 'vision':
      return openai('gpt-4o-mini')  // Only provider with vision
  }
}
```

### Fallback Pattern

```typescript
async function generateWithFallback(prompt: string) {
  try {
    return await generateText({
      model: groq('llama-3.1-70b-versatile'),  // Try Groq first (faster)
      prompt
    })
  } catch (error) {
    console.warn('Groq failed, fallback to OpenAI')
    return await generateText({
      model: openai('gpt-4o-mini'),  // Fallback to OpenAI (reliable)
      prompt
    })
  }
}
```

---

## Edge Compatibility

### OpenAI

| Feature | Edge | Notes |
|---------|------|-------|
| Chat | ✅ | Full support |
| Vision | ✅ | Use image URLs |
| Whisper | ✅ | Download audio first |
| TTS | ✅ | Generate + upload |
| Embeddings | ✅ | Full support |

### Groq

| Feature | Edge | Notes |
|---------|------|-------|
| Chat | ✅ | Ultra-fast |
| Whisper | ✅ | 93% cheaper |

**All providers use `fetch` internally** (Web Standards compatible)

---

## Quick Reference

### When to Use OpenAI
- General-purpose chat (gpt-4o-mini)
- Vision/OCR (receipts, documents)
- Text-to-speech
- Embeddings/RAG

### When to Use Groq
- Transcription (93% cost savings)
- Real-time chat (50x faster)
- High-volume requests (free tier)

### Hybrid Approach (Neero Pattern)
```typescript
// Transcription: Groq (cost)
// Vision: OpenAI (only option)
// Chat: OpenAI (quality)
// Real-time: Groq (speed)
```

See [WhatsApp Integration](../INTEGRATIONS/whatsapp-business.md) for complete multi-provider example.

---

## Resources

- **OpenAI Pricing:** https://openai.com/api/pricing/
- **OpenAI Rate Limits:** https://platform.openai.com/settings/organization/limits
- **Groq Pricing:** https://groq.com/pricing/
- **Groq Models:** https://console.groq.com/docs/models

## Related Docs

- [Edge Compatibility](./07-edge-compatibility.md)
- [Multi-Modal](./05-multi-modal.md)
- [Tool Calling](./04-tool-calling.md)
- [WhatsApp Integration](../INTEGRATIONS/whatsapp-business.md)

---

**Token Count:** ~250 tokens | **Lines:** 235 | **Format:** Tables > Code > Lists
