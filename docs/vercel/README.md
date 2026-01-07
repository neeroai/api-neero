# Vercel Platform Documentation

Last Updated: 2025-11-11 | Comprehensive Vercel deployment guides for Neero projects

## Overview

Token-efficient documentation for deploying AI-powered applications on Vercel, with focus on Edge Runtime, AI SDK, and WhatsApp integrations.

**Coverage**:
- Vercel AI SDK 5.x (text generation, structured output, tool calling, multi-modal)
- Edge Runtime optimization (performance, security, observability)
- WhatsApp Business Cloud API integration
- Real-world patterns from Neero projects

**Target Audience**: Neero developers building on Vercel platform (26 projects)

---

## Documentation Structure

### AI SDK (7 files)

Comprehensive Vercel AI SDK documentation with OpenAI and Groq providers:

| File | Lines | Coverage |
|------|-------|----------|
| [01-ai-sdk-overview.md](./AI-SDK/01-ai-sdk-overview.md) | 391 | Overview, installation, 20+ providers |
| [02-text-generation.md](./AI-SDK/02-text-generation.md) | 534 | generateText, streamText, React hooks |
| [03-structured-output.md](./AI-SDK/03-structured-output.md) | 509 | generateObject, Zod schemas, type safety |
| [04-tool-calling.md](./AI-SDK/04-tool-calling.md) | 585 | Function calling, agentic workflows |
| [05-multi-modal.md](./AI-SDK/05-multi-modal.md) | 478 | Vision, audio, TTS, embeddings |
| [06-providers.md](./AI-SDK/06-providers.md) | 429 | OpenAI + Groq setup, cost optimization |
| [07-edge-compatibility.md](./AI-SDK/07-edge-compatibility.md) | 508 | Edge Runtime patterns, memory limits |

**Total: 3,434 lines | ~900 tokens**

### Edge Runtime (4 files)

Edge Functions optimization, security, and observability:

| File | Lines | Coverage |
|------|-------|----------|
| [01-edge-essentials.md](./EDGE-RUNTIME/01-edge-essentials.md) | 348 | Setup, Web APIs, limitations |
| [02-performance.md](./EDGE-RUNTIME/02-performance.md) | 550 | Memory, cold starts, caching |
| [03-security.md](./EDGE-RUNTIME/03-security.md) | 680 | HMAC validation, rate limiting |
| [04-observability.md](./EDGE-RUNTIME/04-observability.md) | 850 | Monitoring, error handling, debugging |

**Total: 2,428 lines | ~850 tokens**

### Integrations (1 file)

Platform integrations with real-world patterns:

| File | Lines | Coverage |
|------|-------|----------|
| [whatsapp-business.md](./INTEGRATIONS/whatsapp-business.md) | 950 | WhatsApp Cloud API, webhooks, AI patterns |

**Total: 950 lines | ~300 tokens**

---

## Quick Start

```bash
npm install ai @ai-sdk/openai @ai-sdk/groq zod
npm i -g vercel
vercel --prod  # Deploy to production
```

**Environment variables**: Set in Vercel Dashboard
- `OPENAI_API_KEY`, `GROQ_API_KEY` (AI)
- `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET` (WhatsApp)
- `SUPABASE_URL`, `SUPABASE_KEY` (Database)

**Basic Edge Function**:
```typescript
export const runtime = 'edge'
export async function POST(req: Request) {
  const { messages } = await req.json()
  const result = streamText({ model: openai('gpt-4o-mini'), messages })
  return result.toDataStreamResponse()
}
```

See [platform-vercel.md](./platform-vercel.md) for comprehensive setup guide.

---

## Deployment Checklist

### Pre-Deployment

- [ ] TypeScript compiles (`npm run typecheck`)
- [ ] Tests passing (`npm test`)
- [ ] Bundle size <1.5 MB (gzipped)
- [ ] Static imports only (no dynamic imports)
- [ ] Environment variables configured
- [ ] Edge runtime compatibility verified
- [ ] Signature validation enabled (WhatsApp)

### Post-Deployment

- [ ] Cold start <200ms (P95)
- [ ] Memory usage <100 MB
- [ ] Error rate <0.1%
- [ ] Vercel Observability enabled
- [ ] Health check endpoint responding
- [ ] Logs searchable by requestId

### Monitoring

**Vercel Observability** (October 2024 release):
- CPU throttling
- Memory usage
- TTFB (Time to First Byte)
- Cold starts
- Request tracing

**Dashboard:** https://vercel.com/dashboard/[project]/analytics

---

## Common Issues

### High Memory Usage

**Symptoms:** Function crashes, OOM errors

**Solutions:**
1. Check cache sizes with TTL cleanup
2. Avoid loading large datasets in memory
3. Use streaming for large responses
4. Limit conversation history (10-15 messages)

### Slow Cold Starts

**Symptoms:** First request takes >500ms

**Solutions:**
1. Reduce bundle size (<1.5 MB)
2. Minimize top-level code
3. Use static imports only
4. Enable Fluid Compute (Vercel Pro+)

### Rate Limit Errors

**Symptoms:** 429 errors from WhatsApp/OpenAI

**Solutions:**
1. Implement token bucket rate limiting
2. Add request deduplication
3. Use response caching
4. Monitor API usage

---

## Provider Recommendations

### For Neero Projects

| Use Case | Provider | Model | Cost |
|----------|----------|-------|------|
| Chat | OpenAI | gpt-4o-mini | $0.15/$0.60 per 1M |
| Transcription | Groq | whisper-large-v3 | $0.00083/min (93% savings) |
| Vision | OpenAI | gpt-4o-mini | $0.002/image |
| Embeddings | OpenAI | text-embedding-3-small | $0.020/1M tokens |

**Cost Optimization:**
- Use gpt-4o-mini by default (not gpt-4o)
- Use Groq for audio transcription (93% cheaper)
- Limit maxTokens to prevent runaway costs
- Cache responses where possible

---

## Rollback

If deployment fails:

```bash
# Option 1: Revert to previous deployment (Vercel Dashboard)
# Navigate to: Deployments → [Previous Deployment] → Promote to Production

# Option 2: Redeploy last working commit
git revert HEAD
git push origin main

# Option 3: Vercel CLI
vercel rollback [deployment-url]
```

---

## Resources

### Official Documentation

- **Vercel AI SDK:** https://sdk.vercel.ai/docs
- **Vercel Edge Runtime:** https://vercel.com/docs/functions/edge-functions
- **WhatsApp Cloud API:** https://developers.facebook.com/docs/whatsapp/cloud-api
- **OpenAI API:** https://platform.openai.com/docs
- **Groq API:** https://console.groq.com/docs

### Neero Documentation

- **Platform Overview:** [platform-vercel.md](./platform-vercel.md)
- **AI SDK Overview:** [AI-SDK/01-ai-sdk-overview.md](./AI-SDK/01-ai-sdk-overview.md)
- **Edge Runtime Essentials:** [EDGE-RUNTIME/01-edge-essentials.md](./EDGE-RUNTIME/01-edge-essentials.md)
- **WhatsApp Integration:** [INTEGRATIONS/whatsapp-business.md](./INTEGRATIONS/whatsapp-business.md)

---

Token Count: ~500 tokens | Last Updated: 2025-11-11 | Format: Tables > Lists > Code
