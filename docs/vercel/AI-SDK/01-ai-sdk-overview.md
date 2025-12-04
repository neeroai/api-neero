# Vercel AI SDK Overview

Last Updated: 2025-11-11 | AI SDK Version: 5.x (stable) | AI SDK 6: Beta

## What is Vercel AI SDK?

TypeScript toolkit for building AI-powered applications with a unified interface across 20+ providers.

**Key Benefits**:
- Single API for all providers (OpenAI, Anthropic, Google, xAI, Groq, etc.)
- Edge Runtime compatible (Vercel Edge Functions)
- Built-in streaming, tool calling, structured output
- Framework-agnostic (React, Next.js, Vue, Svelte, Node.js)
- Type-safe end-to-end with TypeScript

**Architecture**:
- **AI SDK Core**: Unified API for text generation, structured objects, tool calls, agents
- **AI SDK UI**: Framework-agnostic hooks for chat and generative UIs (useChat, useCompletion)

## Supported Providers (20+)

| Provider | Package | Key Models/Specialty | Strengths | Edge |
|----------|---------|---------------------|-----------|------|
| **OpenAI** | @ai-sdk/openai | GPT-5, GPT-4o, o1, Whisper | Best general-purpose, multimodal | ✅ |
| **Anthropic** | @ai-sdk/anthropic | Claude Opus 4, Sonnet 4, 3.5 | Long context, reasoning, vision | ✅ |
| **Groq** | @ai-sdk/groq | Llama 3.1, Whisper | Ultra-fast (50x), 93% cheaper audio | ✅ |
| **Google** | @ai-sdk/google | Gemini 2.0 Flash, 1.5 Pro | Fast, multimodal, long context | ✅ |
| **xAI** | @ai-sdk/xai | Grok 4, 3, 2 | Real-time data | ✅ |
| **Mistral** | @ai-sdk/mistral | Pixtral, Large, Medium | European, multilingual | ✅ |
| **Azure OpenAI** | @ai-sdk/azure | GPT-4o, GPT-4 | Enterprise, compliance | ✅ |
| **Amazon Bedrock** | @ai-sdk/amazon-bedrock | Claude, Titan, Llama | AWS ecosystem | ✅ |
| **ElevenLabs** | @ai-sdk/elevenlabs | TTS | High-quality voice | ✅ |
| **AssemblyAI** | @ai-sdk/assemblyai | STT | Advanced transcription | ✅ |
| **Ollama** | @ai-sdk/ollama | Local models | Privacy, offline | ✅ |

**14+ more providers**: Cohere, DeepSeek, Cerebras, Fireworks, Together.ai, Google Vertex, Deepgram, Fal AI, Luma AI, Portkey, Cloudflare, OpenRouter
Full list: https://ai-sdk.dev/providers/ai-sdk-providers

## Core APIs

### Text Generation

| API | Use Case | Returns | Streaming | Edge Compatible |
|-----|----------|---------|-----------|-----------------|
| `generateText` | Sync text generation | `Promise<string>` | ❌ | ✅ |
| `streamText` | Streaming responses | `ReadableStream` | ✅ | ✅ |

### Structured Output

| API | Use Case | Returns | Streaming | Edge Compatible |
|-----|----------|---------|-----------|-----------------|
| `generateObject` | Type-safe structured data | `Promise<T>` | ❌ | ✅ |
| `streamObject` | Streaming structured data | `ReadableStream<T>` | ✅ | ✅ |

### Additional APIs

| API | Use Case | Edge Compatible |
|-----|----------|-----------------|
| `embed` | Generate embeddings | ✅ |
| `generateImage` | Image generation | ✅ |
| `transcribe` | Audio-to-text | ✅ |
| `generateSpeech` | Text-to-speech | ✅ |

## Installation

```bash
npm install ai @ai-sdk/openai zod  # Core + OpenAI + validation
npm install @ai-sdk/groq           # Optional: 93% cheaper audio
```

## Quick Start

```typescript
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

const { text } = await generateText({
  model: openai('gpt-4o-mini'),
  prompt: 'Explain Edge Functions in 2 sentences'
})
```

**See detailed examples in:**
- [Text Generation](./02-text-generation.md) - generateText, streamText, useChat
- [Structured Output](./03-structured-output.md) - generateObject, schemas
- [Tool Calling](./04-tool-calling.md) - Function calling, agents

## AI SDK 5 Key Features

| Feature | Description | Example |
|---------|-------------|---------|
| **Typed Messages** | Separates UI/Model messages for type safety | `UIMessage` → `ModelMessage` conversion |
| **Enhanced Tool Calling** | Dynamic tools, lifecycle hooks | `maxToolRoundtrips`, `stopWhen`, `prepareStep` |
| **Speech APIs** | TTS/STT support | `generateSpeech()`, `transcribe()` |
| **SSE Streaming** | Server-Sent Events (more stable than WebSockets) | `.toDataStreamResponse()` |
| **Global Providers** | String-based model references | `model: 'openai/gpt-4o'` |

See detailed docs in sections below for implementation examples.

## Edge Runtime Compatibility

**Fully Compatible**: All core APIs (generateText, streamText, generateObject, streamObject, tool calling, embeddings), all providers, React hooks

**Limits & Workarounds**:

| Limit | Value | Workaround |
|-------|-------|------------|
| Streaming timeout | 300s | Use Node.js runtime for >5min ops |
| Memory | 128 MB | Limit history (10-15 messages), use streaming |
| File system | Not available | Use URLs for media |
| Large files | >10MB | Stream or use Node.js runtime |

**Best Practices**: Use streaming, optimize context, URLs for media, cache clients
See [Edge Compatibility](./07-edge-compatibility.md) for details.

## AI SDK vs Native SDKs

| Factor | AI SDK | Native SDKs |
|--------|--------|-------------|
| **Use When** | Chat UIs, multi-provider, streaming, structured output, agents | Provider-specific features, max control, minimal bundle |
| **Bundle Size** | ~150KB | ~50-100KB |
| **API Cost** | Same (uses provider APIs) | Same |
| **DX** | Better (unified interface) | Provider-specific APIs |
| **Neero Recommendation** | ✅ New projects | Legacy projects only |

## Next Steps

- [Text Generation](./02-text-generation.md) - generateText, streamText, useChat
- [Structured Output](./03-structured-output.md) - generateObject, Zod schemas
- [Tool Calling](./04-tool-calling.md) - Function calling, multi-step agents
- [Multi-Modal](./05-multi-modal.md) - Vision, audio, embeddings
- [Providers](./06-providers.md) - OpenAI, Groq detailed setup
- [Edge Compatibility](./07-edge-compatibility.md) - Edge Runtime patterns

## Related Documentation

- [Platform Overview](../platform-vercel.md)
- [Edge Runtime Best Practices](../EDGE-RUNTIME/01-edge-essentials.md)
- [Supabase Integration](../INTEGRATIONS/supabase.md)

## Resources

- **Official Docs**: https://ai-sdk.dev/docs
- **GitHub**: https://github.com/vercel/ai
- **Provider List**: https://ai-sdk.dev/providers/ai-sdk-providers
- **Examples**: https://github.com/vercel/ai/tree/main/examples
- **Discord**: https://discord.gg/vercel

---

Token Count: ~1,200 tokens | Lines: 391 | Format: Tables > YAML > Lists (token-efficient)
