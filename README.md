# api-neero

Cost-optimized multimodal API for Bird.com AI employees with intelligent image routing. Processes images, documents, and audio from WhatsApp in MAX 9 seconds.

**Version:** 2.2.3 | **Status:** Deployed to Production | **Cost:** 89% cheaper than Claude

**Production:** https://api.neero.ai

---

## Features

### Intelligent Image Routing
Two-stage pipeline for optimal model selection based on image type:

| Type | Model | Timeout | Use Case |
|------|-------|---------|----------|
| photo | Gemini 2.0 Flash | 4s | People, objects, scenes |
| invoice | Gemini 2.0 Flash | 5s | Invoices, receipts, OCR |
| document | Gemini 2.5 Flash | 5.5s | Cedulas, contracts, policies |
| unknown | Gemini 2.5 Flash | 5.5s | Fallback (complex) |

**Pipeline:** Image → Classify (2s) → Route (<10ms) → Process (4-5.5s) → Response

### Image Processing
- ID documents: Extract name, ID number, expiry date
- Invoices/receipts: Extract totals, items, dates, tax (IVA aware)
- Clothing/products: Describe, categorize
- LATAM-optimized: Spanish prompts, Colombian formats (NIT, CC)

### Document Processing
- Multi-page PDF extraction (Gemini PDF native)
- Scanned document OCR
- Cedula recognition

### Audio Processing
- Voice note transcription (Spanish primary)
- Groq Whisper v3 Turbo ($0.67/1K minutes, primary)
- OpenAI Whisper fallback ($6.00/1K minutes)
- 228x realtime processing

### Bird Actions Integration
- HTTP POST from Bird AI Employees (not webhooks)
- Optional API key authentication
- 9-second timeout enforcement
- Synchronous JSON responses

---

## Quick Start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Required environment variables:

```bash
# AI Services (REQUIRED)
AI_GATEWAY_API_KEY=xxx             # Vercel AI Gateway (Gemini models)
GROQ_API_KEY=xxx                   # Groq Whisper v3

# Optional
OPENAI_API_KEY=xxx                 # OpenAI Whisper fallback
BIRD_ACCESS_KEY=xxx                # If Bird CDN requires auth
NEERO_API_KEY=xxx                  # API authentication
```

### 3. Start development

```bash
pnpm dev
```

### 4. Test endpoints

```bash
# Health check
curl http://localhost:3000/api/bird

# Test with Bird Actions payload
curl -X POST http://localhost:3000/api/bird \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-key" \
  -d @test-payload.json
```

---

## Tech Stack

**Runtime:** Vercel Edge (V8 isolates, Web APIs only, 128MB memory)
**Framework:** Next.js 16 + React 19 + TypeScript 5.9
**AI SDK:** Vercel AI SDK 5.0 (`@ai-sdk/google`, `@ai-sdk/groq`, `@ai-sdk/openai`)
**Vision:** Google Gemini 2.0 Flash ($0.17/1K images), Gemini 2.5 Flash (complex docs)
**Audio:** Groq Whisper Large v3 ($0.67/1K min, primary) + OpenAI Whisper (fallback)
**Validation:** Zod 3.23
**Dev Tools:** Biome 2.3 + Tailwind CSS 4.1 + pnpm 9.15

---

## Development Commands

```bash
pnpm dev              # Start dev server (localhost:3000) with Turbopack
pnpm build            # Production build (checks types automatically)
pnpm start            # Start production server
pnpm lint             # Check code with Biome
pnpm lint:fix         # Auto-fix linting issues
pnpm format           # Format code with Biome
pnpm typecheck        # TypeScript type checking (no emit)
```

---

## Project Structure

```
api-neero/
├── app/api/bird/         Bird Actions endpoint
├── lib/
│   ├── ai/               AI processing core
│   │   ├── classify.ts   Image classification (Stage 1)
│   │   ├── router.ts     Model routing table
│   │   ├── pipeline.ts   Two-stage orchestration
│   │   ├── gateway.ts    Gemini model config
│   │   ├── groq.ts       Groq Whisper (primary)
│   │   ├── openai-whisper.ts  OpenAI Whisper (fallback)
│   │   ├── transcribe.ts Fallback orchestration
│   │   ├── timeout.ts    Time budget manager
│   │   ├── processors/   Type-specific processors
│   │   ├── schemas/      Zod validation schemas
│   │   └── prompts/      LATAM-optimized prompts
│   ├── auth/             API key validation
│   ├── bird/             Bird integration
│   │   ├── types.ts      Bird Actions schemas
│   │   └── media.ts      CDN media download
│   ├── security/         Crypto, sanitization, env
│   └── types/            TypeScript types
├── docs/                 Documentation
│   ├── codebase-guide.md LLM reference (24 files)
│   ├── architecture.md   System design
│   ├── ai-integration.md AI SDK details
│   └── bird/             Bird Actions guides
├── plan/                 Tracking files
│   ├── plan.md           Architecture, phases
│   ├── todo.md           Task tracking
│   └── prd.md            Product requirements
└── CHANGELOG.md          Version history
```

---

## Documentation

**Project Docs (`/docs`):**
- [Architecture](docs/architecture.md) - System design, Actions pattern, Edge Runtime
- [Codebase Guide](docs/codebase-guide.md) - LLM-optimized reference (24 files)
- [Bird Actions](docs/bird/bird-actions-architecture.md) - Primary implementation guide
- [AI Integration](docs/ai-integration.md) - Gemini, Groq, OpenAI via AI SDK
- [Deployment](docs/deployment.md) - Vercel deployment, environment config

**Reference:**
- Vercel AI SDK: https://ai-sdk.dev
- Google Gemini: https://ai.google.dev/gemini-api/docs
- Groq: https://groq.com/groqcloud
- Bird: https://bird.com/docs
- Next.js: https://nextjs.org/docs

---

## Bird AI Employee Setup

**Complete Guide:** See [Bird AI Employees Setup Guide](docs/bird/bird-ai-employees-setup-guide.md) (45-60 min setup)

**Quick Start:**

1. **Define Task Arguments** in Bird Action Configuration:
   - `mediaType`, `mediaUrl`, `conversationId`, `contactName`

2. **Configure HTTP Request:**
   - URL: `https://api.neero.ai/api/bird`
   - Method: POST
   - Headers: `X-API-Key: {{env.NEERO_API_KEY}}` (optional)
   - Body: See [setup guide](docs/bird/bird-ai-employees-setup-guide.md#44-http-request-configuration)

3. **Configure AI Employee** to populate arguments before calling Action

4. **Test** with WhatsApp media (image/document/audio)

**Important:** Bird native variables (`{{messageImage}}`, etc.) are NOT automatically passed to Actions. The AI Employee must populate Task Arguments. See [Bird Variables Reference](docs/bird/bird-variables-reference.md).

---

## Key Constraints

1. **9-Second Timeout:** MAX 9 seconds processing or return error immediately (CRITICAL)
2. **Bird Actions:** Synchronous JSON response, no background processing
3. **Edge Runtime:** Web APIs only, no Node.js modules (fs, Buffer, crypto.createHmac)
4. **File Limits:** 5MB images, 25MB audio (WhatsApp constraints)
5. **Cost Optimization:** Gemini 2.0 Flash primary, avoid Claude (too expensive)

---

## Cost Analysis

**Monthly Cost (10K images + 10K audio minutes):**

| Service | Model | Rate | Monthly | Notes |
|---------|-------|------|---------|-------|
| Image (90%) | Gemini 2.0 Flash | $0.17/1K | $1.53 | General images |
| Image (10%) | Gemini 2.5 Flash | $0.30/1K | $0.30 | Complex docs |
| Audio | Groq Whisper v3 | $0.67/1K min | $6.70 | Primary (95%) |
| Audio | OpenAI Whisper | $6.00/1K min | $0.30 | Fallback (5%) |
| **TOTAL** | - | - | **$8.83** | 89% cheaper than Claude |

**Comparison:** Claude-based alternative would cost ~$75+/month for same workload.

---

## Versioning

**Current:** 2.2.3 (Semantic Versioning)
**See:** [CHANGELOG.md](CHANGELOG.md) for version history

---

**Version:** 2.2.3 | **Last Updated:** 2025-12-11 | **Lines:** ~230
