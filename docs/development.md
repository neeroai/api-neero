# Development Guide

**Version:** 1.0 | **Date:** 2025-12-12

Developer guide for local development and contribution to api-neero.

---

## Installation

### Prerequisites

- Node.js 18+ (20+ recommended)
- pnpm 9.15+
- Git

### Clone and Install

```bash
git clone https://github.com/neero/api-neero.git
cd api-neero
pnpm install
```

---

## Environment Setup

Copy `.env.example` to `.env.local`:

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

**Getting API Keys:**
- AI Gateway: https://vercel.com/docs/ai-gateway
- Groq: https://console.groq.com
- OpenAI: https://platform.openai.com

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
│   ├── bird/             Bird Actions guides
│   └── development.md    This file
├── plan/                 Tracking files
│   ├── plan.md           Architecture, phases
│   ├── todo.md           Task tracking
│   └── prd.md            Product requirements
└── CHANGELOG.md          Version history
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

**Key Dependencies:**
- `@ai-sdk/google` - Gemini models via AI SDK
- `@ai-sdk/groq` - Groq Whisper integration
- `@ai-sdk/openai` - OpenAI Whisper fallback
- `zod` - Runtime type validation
- `biome` - Linting and formatting
- `next` - Framework

---

## Local Development

### Start Development Server

```bash
pnpm dev
```

Server starts at `http://localhost:3000`

### Test Endpoints Locally

**Health check:**
```bash
curl http://localhost:3000/api/bird
```

**Test image processing:**
```bash
curl -X POST http://localhost:3000/api/bird \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-test-key" \
  -d '{
    "type": "image",
    "mediaUrl": "https://example.com/test-image.jpg",
    "context": {
      "conversationId": "test-123",
      "contactName": "Test User"
    }
  }'
```

**Test audio processing:**
```bash
curl -X POST http://localhost:3000/api/bird \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-test-key" \
  -d '{
    "type": "audio",
    "mediaUrl": "https://example.com/test-audio.ogg",
    "context": {
      "conversationId": "test-123",
      "contactName": "Test User"
    }
  }'
```

---

## Edge Runtime Constraints

All API routes use `export const runtime = 'edge'`:

**Restrictions:**
- NO Node.js APIs (fs, crypto.createHmac, Buffer)
- USE Web APIs (crypto.subtle, ReadableStream, fetch)
- Timeouts: 25s default, 300s for streaming responses
- Memory: 128MB limit

**See:** `lib/security/crypto.ts` for Web Crypto HMAC implementation

---

## Key File Relationships

**Bird Actions Flow:**
```
/api/bird/route.ts → API key validation (optional)
    → bird/media.ts (download from CDN)
    → Process based on type: image/document/audio
    → Return JSON response
```

**Multimodal Processing:**
```
Image: bird/media.ts → lib/ai/classify.ts → lib/ai/router.ts → processor
        (download)       Gemini 2.0 Flash    Route table       Type-specific
                                                               (photo/invoice/document)

Document: bird/media.ts → Gemini PDF → extracted text
Audio: bird/media.ts → lib/ai/transcribe.ts (Groq → OpenAI fallback) → transcription
```

**Image Routing Files:**
- `lib/ai/classify.ts` - Classification with Gemini 2.0 Flash
- `lib/ai/router.ts` - Model routing table
- `lib/ai/pipeline.ts` - Two-stage orchestration
- `lib/ai/processors/*.ts` - Type-specific processors
- `lib/ai/schemas/*.ts` - Zod output schemas

**Type Safety:**
- `lib/bird/types.ts` - Bird webhook and API types (Zod schemas)
- Import via `@/lib/bird/types` path alias

**Path Aliases (tsconfig.json:22-26):**
- `@/*` → root
- `@/lib/*` → lib directory
- `@/app/*` → app directory
- `@/types/*` → lib/types

---

## Testing

### Type Checking

```bash
pnpm typecheck
```

TypeScript strict mode enabled with:
- `noUncheckedIndexedAccess`
- `noUnusedLocals`
- `strict: true`

### Linting

```bash
pnpm lint        # Check
pnpm lint:fix    # Auto-fix
```

Biome configuration: `biome.json`

### Build Validation

```bash
pnpm build
```

Runs type checking automatically before build.

---

## Code Standards

**TypeScript/JavaScript:**
- TypeScript strict mode ALWAYS
- Functional > OOP
- Async/await over promises
- Early returns
- Single responsibility

**Style:**
- 2 spaces
- 100 chars max
- Single quotes (JSX double)
- Semicolons always
- Trailing commas

**Naming:**
```typescript
// GOOD
const isUserAuthenticated = true
const fetchUserById = async (id: string) => {}

// BAD
const isAuth = true  // too abbreviated
const getUserById = async (id: string) => {}  // unclear
```

**File Operations:**
- ALWAYS edit existing files (never create unless necessary)
- Keep files <600 lines
- NO EMOJIS in code/configs

---

## Critical Constraints

1. **9-Second Timeout:** MAX 9 seconds processing or return error immediately (CRITICAL)
2. **Bird Actions:** Synchronous JSON response, no background processing
3. **Edge Runtime:** Web APIs only, no Node.js modules (fs, Buffer, crypto.createHmac)
4. **Media Download:** May require `Authorization: AccessKey {BIRD_ACCESS_KEY}` (test needed)
5. **Authentication:** Optional API key (`X-API-Key` header, no HMAC)
6. **File Limits:** 5MB images, 25MB audio (WhatsApp constraints)
7. **Cost Optimization:** Gemini 2.0 Flash primary, avoid Claude (too expensive)
8. **TypeScript Strict:** noUncheckedIndexedAccess, noUnusedLocals enabled

---

## Documentation

**Project Docs (`/docs`):**
- [Architecture](architecture.md) - System design, Actions pattern, Edge Runtime
- [Codebase Guide](codebase-guide.md) - LLM-optimized reference (24 files)
- [Bird Actions](bird/bird-actions-architecture.md) - Primary implementation guide
- [AI Integration](ai-integration.md) - Gemini, Groq, OpenAI via AI SDK
- [Deployment](deployment.md) - Vercel deployment, environment config

**Reference:**
- Vercel AI SDK: https://ai-sdk.dev
- Google Gemini: https://ai.google.dev/gemini-api/docs
- Groq: https://groq.com/groqcloud
- Bird: https://bird.com/docs
- Next.js: https://nextjs.org/docs

---

**Lines:** ~180 | **Last Updated:** 2025-12-12
