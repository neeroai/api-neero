# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Scope:** Cost-optimized multimodal API for Bird.com AI employees
**Type:** Production API - 89% cheaper than Claude-based alternatives
**Last Updated:** 2025-12-14 10:07

---

## 4-Level Hierarchy

Load order: USER → COMPANY → GLOBAL → PROJECT
1. USER: ~/.claude/CLAUDE.md
2. COMPANY: /Users/mercadeo/neero/CLAUDE.md
3. GLOBAL: /Users/mercadeo/neero/docs-global/
4. PROJECT: This file

---

## Project Overview

Cost-optimized multimodal API for Bird.com AI employees (corporate clients):
- **Image Processing:** Gemini 2.0/2.5 Flash - ID docs, cedulas, invoices, clothing, products
- **Image Routing:** Intelligent classification → Optimal model selection (photo/invoice/document)
- **Document Processing:** Gemini PDF native - Multi-page PDFs, scanned docs
- **Audio Processing:** Groq Whisper v3 (primary) + OpenAI Whisper (fallback) - Voice notes (Spanish primary)
- **Cost:** $2.50/10K images (with routing) vs $75+ with Claude
- **Constraint:** MAX 9 seconds response or immediate error

Processes multimedia from WhatsApp via Bird AI Employees Actions using Vercel AI SDK.

---

## TRACKING FILES (Update EVERY interaction)
| File | Purpose | Format | Max |
|------|---------|--------|-----|
| plan.md | Architecture, stack, phase | Markdown | 50 lines |
| todo.md | [TODO\|DOING\|DONE] tasks | Markdown | 50 lines |
| prd.md | Requirements, features | Markdown | 100 lines |
| feature_list.json | Feature tracking (Anthropic) | JSON | No limit |
| claude-progress.md | Session handoff (Anthropic) | Markdown | Rolling |

**Frequency**: Update EVERY interaction
**Templates**: `/Users/mercadeo/neero/docs-global/templates/tracking/`

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

**Test endpoints locally:**
- `curl http://localhost:3000/api/example` - Echo bot example
- `curl http://localhost:3000/api/chat` - AI streaming endpoint

---

## Quality Gates & Testing

**Framework:** Vitest + Edge Runtime VM
**Coverage Target:** 60%+ (statements, branches, functions, lines)
**CI Pipeline:** GitHub Actions (5 sequential gates)

### Quality Gates (CI)

| Gate | Tool | Command | Pass Criteria |
|------|------|---------|---------------|
| Format | Biome | `pnpm run format --check` | Exit 0 |
| Lint | Biome | `pnpm run lint` | Exit 0 |
| Types | TypeScript | `pnpm run typecheck` | Exit 0 |
| Tests | Vitest | `pnpm run test` | All pass |
| Build | Next.js | `pnpm run build` | Exit 0 |

**Protocol:** ALL gates must pass before merge to main

### Edge Runtime Testing

**Critical Constraints:**
- Use Web APIs only: `fetch`, `crypto.subtle`, `ReadableStream`
- NO Node.js APIs: `fs`, `Buffer`, `crypto.createHmac`
- Mock AI SDK calls (avoid real API requests)
- Use `@edge-runtime/vm` for testing environment

**Test Commands:**
```bash
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm test:ui           # Visual UI
pnpm test:coverage     # Coverage report
```

### SDD Tracking Files

| File | Purpose | Update Frequency |
|------|---------|------------------|
| plan.md | Architecture + phases | Phase milestones |
| todo.md | [TODO\|DOING\|DONE] | Every session |
| feature_list.json | Feature tracking | Feature completion |
| claude-progress.md | Session handoff | Session end |

**Templates:** `/Users/mercadeo/neero/docs-global/templates/sdd/`
**Methodology:** `/Users/mercadeo/neero/docs-global/workflows/sdd-methodology.md`

---

## SDD (Spec-Driven Development)

**Methodology:** Spec-first approach ensuring features are specified, validated, and planned before implementation.

### When to Use SDD

**Use for:**
- Features touching 3+ files
- API integrations (Bird, AI models)
- Database schema changes
- Auth/security features
- Performance-critical paths (<9s constraint)
- Features with unclear requirements

**Skip for:**
- Single file bug fixes (<50 lines)
- UI tweaks, docs-only changes
- Refactoring with no behavior change
- Hotfixes (create retroactive SPEC)

**Rule:** "Can I explain this in 3 months?" YES = SDD | NO = Skip

### 8-Step Lifecycle

| Step | Deliverable | Gate |
|------|------------|------|
| 1. SPEC | SPEC.md | Problem + Contracts clear |
| 2. PLAN | PLAN.md | Stack validated, steps defined |
| 3. TASKS | TASKS.md | Granular tasks in todo.md |
| 4. ADR | ADR.md (optional) | 4/4 YES (ClaudeCode&OnlyMe) |
| 5. TESTPLAN | TESTPLAN.md | >80% coverage planned |
| 6. IMPLEMENT | Code + Tests | All gates pass |
| 7. REVIEW | PR approved | CI green, manual QA |
| 8. SHIP | Deployed | Smoke test pass |

### Directory Structure

```
specs/
├── README.md              # SDD process guide
├── f003-location-triage/  # Example feature
│   ├── SPEC.md           # Problem, contracts, rules, DoD
│   ├── PLAN.md           # Stack, steps, risks
│   ├── TASKS.md          # TODO/DOING/DONE
│   ├── TESTPLAN.md       # Test strategy, 80%+ coverage
│   └── ADR.md            # Optional: Architecture decisions
└── _archive/             # Completed features (3+ months)
```

### Quick Start

```bash
# 1. Create feature directory
mkdir -p specs/<feature-slug>

# 2. Copy templates
cp /Users/mercadeo/neero/docs-global/templates/sdd/*.md specs/<feature-slug>/

# 3. Fill SPEC.md → PLAN.md → TASKS.md → TESTPLAN.md

# 4. Update tracking files
# - /feature_list.json: Add feature
# - /todo.md: Copy tasks from TASKS.md
```

**Full Guide:** `/specs/README.md`
**Example:** `/specs/f003-location-triage/` (complete reference)

---

## Tech Stack

**Core:** Next.js 16 + React 19 + TypeScript 5.9 + Vercel Edge Runtime
**AI SDK:** Vercel AI SDK 5.0 (`@ai-sdk/google`, `@ai-sdk/groq`, `@ai-sdk/openai`) + Zod 3.23
**Vision:** Google Gemini 2.0 Flash ($0.17/1K images, PDF native)
**Audio:** Groq Whisper Large v3 ($0.67/1K minutes, primary) + OpenAI Whisper ($6.00/1K minutes, fallback)
**Database:** Neon PostgreSQL (serverless) + Drizzle ORM
**RAG:** pgvector v0.8.1 (HNSW index) + Gemini text-embedding-004 (768 dims)
**Integration:** Bird AI Employees Actions + Media CDN (conditional auth)
**Dev Tools:** Biome 2.3 + Tailwind CSS 4.1 + pnpm 9.15

**Sources:**
- https://ai-sdk.dev (Vercel AI SDK)
- https://ai.google.dev/gemini-api/docs
- https://groq.com/groqcloud
- https://bird.com/docs
- https://nextjs.org/docs

---

## Stack Deviations

None. Template follows Neero standards exactly.

---

## Architecture Patterns

### Bird Actions Pattern (HTTP Requests)
Bird AI Employees call our API directly via HTTP Actions (not webhooks). Implementation:
1. Bird AI Employee triggers Action → HTTP POST to `/api/bird` with conversationId
2. API fetches latest message from conversation via Bird Conversations API (limit=1)
3. Auto-detects media type from message structure and contentType
4. Downloads media from Bird CDN (conditional `BIRD_ACCESS_KEY`)
5. Processes with AI (Gemini/Groq/OpenAI) - synchronous, < 9 seconds
6. Returns JSON response to Bird AI Employee
7. Bird AI Employee continues conversation with data

**Critical:** Must return JSON response in < 9 seconds or immediate error.

**No HMAC validation needed** - Actions don't use webhook signatures.

**v3.0 Architecture:**
- Media URL extraction via Bird Conversations API (not from webhook variables)
- Auto-detection of media type from WhatsApp message structure
- Processes ONLY the most recent message (efficient limit=1 query)

### Intelligent Image Routing
Two-stage pipeline for optimal model selection based on image type:

**Pipeline:**
```
Image → Classify (2s) → Route (<10ms) → Process (4-5.5s) → Response
         Gemini 2.0 Flash  Route table    Type-specific
```

**Model Selection:**

| Type | Model | Timeout | Use Case |
|------|-------|---------|----------|
| photo | Gemini 2.0 Flash | 4s | People, objects, scenes |
| invoice | Gemini 2.0 Flash | 5s | Invoices, receipts, OCR |
| document | Gemini 2.5 Flash | 5.5s | Cedulas, contracts, policies |
| unknown | Gemini 2.5 Flash | 5.5s | Fallback (complex) |

**Key Features:**
- Dynamic timeout adjustment if classification is slow
- `forceType` parameter to skip classification (saves 2s)
- Spanish-optimized prompts for LATAM documents
- Fallback to fast path if remaining time <3s

**Implementation:** See `plan/image-routing-spec.md` for complete specification.

### Edge Runtime Constraints
All API routes use `export const runtime = 'edge'`:
- **NO Node.js APIs** (fs, crypto.createHmac, Buffer)
- **USE Web APIs** (crypto.subtle, ReadableStream, fetch)
- **Timeouts:** 25s default, 300s for streaming responses
- **Memory:** 128MB limit
- **See:** `lib/security/crypto.ts` for Web Crypto HMAC implementation

### Rate Limiting Strategy
WhatsApp API: 250 messages/sec per phone number.
- **Implementation:** Token bucket (`lib/whatsapp/rate-limit.ts`)
- **Storage:** In-memory Map (survives across requests in same Edge Function instance)
- **Pattern:** Check bucket → Consume token → Process or reject

### Message Deduplication
WhatsApp may retry webhooks if response slow.
- **Pattern:** 60-second window tracking (`lib/whatsapp/webhook.ts:isDuplicateMessage`)
- **Storage:** In-memory Map with message IDs
- **Cleanup:** Auto-expire after 60 seconds

### RAG (Retrieval-Augmented Generation) Architecture

Eva uses semantic search to retrieve validated medical information from the knowledge base:

**Pipeline:**
```
User Query → retrieveKnowledge tool → searchKnowledge() → pgvector → Gemini Embedding → Eva Response
```

**Components:**
- **Embeddings:** Google Gemini text-embedding-004 (768 dimensions, $0.025/1M tokens)
- **Database:** Neon PostgreSQL + pgvector v0.8.1 extension
- **Index:** HNSW (Hierarchical Navigable Small World) - 1.5ms query time @ 58K records
- **Similarity:** Cosine distance, threshold 0.65 (balanced precision/recall)

**Key Files:**
- `lib/ai/embeddings.ts` - Embedding generation with Gemini
- `lib/db/queries/knowledge.ts` - Semantic search with pgvector
- `lib/agent/tools/retrieve-knowledge.ts` - RAG tool for Eva
- `lib/db/schema.ts` - medicalKnowledge table (vector(768))
- `data/knowledge-base.json` - Seed data (14 documents)

**Knowledge Base:**
- 14 validated documents (Dr. Andrés Durán)
- Categories: procedures (5), faqs (5), policies (3), locations (1)
- Automatic failover: similarity < 0.65 → escalate to human

**Performance:**
- RAG overhead: ~472ms (5.2% of 9s budget)
- Embedding generation: ~470ms per query
- HNSW query: 1.5ms (AWS benchmark)
- Total: Well within 9-second constraint

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

**RAG Pipeline:**
```
User Query: lib/agent/tools/retrieve-knowledge.ts
    → Generate embedding: lib/ai/embeddings.ts (Gemini text-embedding-004)
    → Semantic search: lib/db/queries/knowledge.ts (pgvector HNSW)
    → Results (similarity > 0.65) → Eva uses in response
    → No results → Escalate to human (createTicket)
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

## Environment Setup

Copy `.env.example` to `.env.local`:
```bash
# AI Services (REQUIRED)
AI_GATEWAY_API_KEY=xxx             # Vercel AI Gateway (Gemini models)
GROQ_API_KEY=xxx                   # Groq Whisper v3 (primary audio)

# Optional
OPENAI_API_KEY=xxx                 # OpenAI Whisper (audio fallback)

# Bird Integration (CONDITIONAL - test needed)
BIRD_ACCESS_KEY=xxx                # Only if Bird CDN requires auth

# API Authentication (OPTIONAL)
NEERO_API_KEY=xxx                  # Your custom API key for Bird Actions
```

**Removed:** `BIRD_SIGNING_KEY`, `BIRD_WORKSPACE_ID`, `BIRD_CHANNEL_ID` - Not needed for Actions pattern.

See `/docs/bird/bird-actions-architecture.md` for authentication details.

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
9. **RAG Threshold:** Similarity < 0.65 → Auto-escalate to human (no hallucination risk)

---

## Eva Knowledge Base Optimization

**Status:** Implementation complete, ready for Bird Dashboard deployment
**Impact:** -64% tokens, -48% cost, -22% latency, $24,300/year savings

**Key Files:**
- `knowledge-base/procedimientos.md` - 17 procedures (~4,200 tokens)
- `knowledge-base/ubicaciones.md` - 2 offices + virtual (~400 tokens)
- `knowledge-base/faqs.md` - 6 FAQs (~500 tokens)
- `feature/eva-valoracion/eva-valoracion.agent.json` - Optimized config (3,260 tokens)

**Documentation:**
- `docs/eva-kb-optimization-executive-summary.md` - Executive summary
- `docs/eva-kb-optimization-deployment-guide.md` - Deployment (30-45 min)
- `docs/eva-kb-optimization-testing-guide.md` - Testing (6 test cases)

**Next Step:** Upload KB files to Bird Dashboard + Update Additional Instructions

---

## Documentation

**Project Docs (`/docs`):**
- `architecture.md` - System design, Actions pattern, Edge Runtime
- `bird/bird-actions-architecture.md` - Primary implementation guide (Actions)
- `bird/` - Other Bird docs (webhooks for reference only)
- `ai-integration.md` - Gemini, Groq, OpenAI integration via AI SDK
- `deployment.md` - Vercel deployment, environment configuration
- `eva-kb-optimization-*.md` - Eva optimization guides (3 docs)

**Reference:** /Users/mercadeo/neero/docs-global/platforms/{vercel,bird}/

---

## Bird AI Employee Configuration

**Setup Guide:** See `/docs/bird/bird-ai-employees-setup-guide.md` for complete step-by-step setup (45-60 minutes)

**Quick Reference:**

### Task Arguments (Define in Bird Actions)

**v3.0 - Only 2 REQUIRED arguments (mediaUrl and mediaType removed):**

| Argument | Type | Description | Required |
|----------|------|-------------|----------|
| `conversationId` | string | Conversation UUID | ✓ Required |
| `contactName` | string | Contact display name | ✓ Required |
| `mediaType` | string | "image", "document", or "audio" | ✗ Optional - API auto-detects |

### HTTP Request Configuration

**URL:** `https://api.neero.ai/api/bird`
**Method:** POST
**Content-Type:** application/json
**Headers:** `X-API-Key: {{env.NEERO_API_KEY}}` (optional)

**Request Body (v3.0 - mediaType optional):**
```json
{
  "context": {
    "conversationId": "{{conversationId}}",
    "contactName": "{{contactName}}"
  }
}
```

**AI Employee Instructions:**

The AI Employee must populate task arguments before calling the Action:
- Ensure `conversationId` and `contactName` are available from conversation context
- Call Action with both required arguments
- API will auto-detect media type from latest message

**v3.0 Changes:**
- Media URL: API extracts automatically from conversation via Bird Conversations API (no need for `{{messageImage}}`, etc.)
- Media Type: API auto-detects from message structure and contentType (no need for AI Employee to guess)
- Only processes MOST RECENT message in conversation (efficient)

**Critical Notes:**
- Bird native variables (`{{messageImage}}`, etc.) are NOT automatically passed to Actions
- Task Arguments must be manually defined in Arguments Configuration
- Use variable picker (type `{{`) in Bird UI - don't manually type variable names
- See `/docs/bird/bird-variables-reference.md` for complete variable reference

---

## Versioning Workflow

**Current Version:** 2.2.3 (Semantic Versioning)

**Version Sources (keep synchronized):**
- `/package.json` - version field
- `/CHANGELOG.md` - latest entry
- `/README.md` - version badge
- `/plan/prd.md` - Version header

**Release Process:**
1. Update CHANGELOG.md with new entries (follow Keep a Changelog format)
2. Bump version in package.json (semantic versioning)
3. Update prd.md version header
4. Update README.md version badge
5. Commit: `chore: release vX.Y.Z`
6. Tag: `git tag vX.Y.Z -m "Release vX.Y.Z: description"`
7. Push: `git push && git push --tags`

**Semantic Versioning (MAJOR.MINOR.PATCH):**
- MAJOR: Breaking changes (API incompatibility)
- MINOR: New features (backwards compatible)
- PATCH: Bug fixes

**Commit Prefixes → Version Bumps:**
| Prefix | Version Bump | Example |
|--------|--------------|---------|
| `feat:` | MINOR | feat: add PDF support |
| `fix:` | PATCH | fix: timeout handling |
| `BREAKING:` or `!` | MAJOR | feat!: new API format |
| `docs:`, `chore:` | No bump | docs: update readme |

**Changelog Format:**
- [Keep a Changelog](https://keepachangelog.com) - Human-readable format
- Sections: Added, Changed, Deprecated, Removed, Fixed, Security
- Group commits by type, summarize user-facing changes
- Include file paths for technical changes

---

## For Claude Code

**Project Philosophy:**
- Production API for Bird.com AI Employees (Actions pattern)
- Process images/documents/audio for corporate clients
- NO INVENTAR: Validate with docs-global/ before implementing
- Edge Runtime compatible (Web APIs only)
- 2-person team optimization (no enterprise bloat)

**When Adding Features:**
1. Use SDD methodology if feature touches 3+ files (see SDD section above)
2. Create specs/<feature-slug>/ with SPEC, PLAN, TASKS, TESTPLAN
3. Check Edge Runtime compatibility (no Node.js APIs)
4. Validate against docs-global/platforms/{bird,vercel}/
5. Maintain < 9 sec synchronous response
6. Test with Bird Actions (HTTP request, not webhooks)
7. Update tracking files (plan.md, todo.md, feature_list.json)
8. Keep files < 600 lines
9. Achieve 80%+ test coverage per TESTPLAN.md
10. See `/docs/bird/bird-actions-architecture.md` for implementation patterns
11. When adding knowledge: Update data/knowledge-base.json → Run scripts/seed-knowledge.ts
12. RAG queries: Use retrieveKnowledge tool, NOT direct searchKnowledge() calls

---

**Lines:** 150 | **Token Budget:** ~720 tokens
