---
title: "api-neero - Bird.com Multimodal AI API"
summary: "Cost-optimized multimodal API for Bird.com AI employees. Handles image classification, document OCR, audio transcription with 9s timeout. Uses Gemini 2.0 Flash (89% cheaper than Claude). Includes contact normalization with hybrid extraction (regex+AI). Next.js 16 Edge Runtime."
description: "Next.js 16 Edge Runtime API: image/document/audio processing, RAG with pgvector, Bird CRM integration"
version: "3.0"
date: "2025-12-27"
updated: "2026-01-20 00:15"
tags: ["api", "edge-runtime", "multimodal", "bird-crm", "ai-integration", "next.js-16"]
scope: "project"
---

# CLAUDE.md

**Project**: api-neero | **Type**: API | **Stack**: Next.js 16 + Vercel Edge + Gemini + Groq + Whisper
**Purpose**: Cost-optimized multimodal API for Bird.com AI employees - 89% cheaper than Claude alternatives
**Last Updated**: 2026-01-19 11:45

---

## Commands

```bash
pnpm dev              # Dev server (localhost:3000, Turbopack)
pnpm build            # Production build (auto type-check)
pnpm start            # Production server
pnpm lint             # Biome check
pnpm lint:fix         # Auto-fix
pnpm format           # Format code
pnpm typecheck        # TypeScript (no emit)
pnpm test             # Run tests (Vitest)
pnpm test:watch       # Watch mode
pnpm test:coverage    # Coverage report (60%+ target)
```

---

## Recent Security Updates

**2026-01-19**: Upgraded to Next.js 16.0.10 & React 19.2.3
- Fixed CVE-2025-55182 (React2Shell) - CVSS 10.0 critical RCE
- Upgraded from Next.js 16.0.10 + React 19.2.0
- All quality gates passing
- Deployed to Vercel (commit 6d12ccc)

---

## Structure

- `/app/api/bird/route.ts` - Bird Actions entrypoint (HTTP POST, <9s)
- `/lib/ai` - Image classify/route, transcribe, embeddings, processors
- `/lib/bird` - Media download, Zod schemas
- `/lib/db` - Drizzle schema, pgvector semantic search
- `/lib/agent/tools` - RAG tool (retrieveKnowledge)
- `/__tests__` - Edge Runtime VM, mock AI SDK

---

## Module Map

**IMPORTANT**: All modules have CLAUDE.md semantic maps. Read module CLAUDE.md to understand module structure without exploring individual files.

| Module | CLAUDE.md | Purpose | Files |
|--------|-----------|---------|-------|
| lib/ | lib/CLAUDE.md | Core library overview | - |
| lib/ai/ | lib/ai/CLAUDE.md | Image classify/route, transcribe, embeddings | 23 |
| lib/bird/ | lib/bird/CLAUDE.md | Bird CRM client + media download | 11 |
| lib/db/ | lib/db/CLAUDE.md | Database schema + pgvector search | 3 |
| lib/normalization/ | lib/normalization/CLAUDE.md | Contact data extraction | 9 |
| lib/agent/ | lib/agent/CLAUDE.md | Agent orchestration + tools | 10 |
| app/api/ | app/api/CLAUDE.md | API routes + handlers | 5 |

**Navigation Protocol**:
1. Read root CLAUDE.md (this file) for project overview
2. Read module CLAUDE.md for module structure
3. Read file @file headers before reading full file
4. Only read full file if header insufficient

---

## Tech Stack

Next.js 16 + React 19 + TypeScript 5.9 + Vercel Edge Runtime + Vercel AI SDK 5.0 + Zod 3.23 + Gemini 2.0/2.5 Flash + Groq Whisper v3 + OpenAI Whisper + Neon PostgreSQL + Drizzle ORM + pgvector v0.8.1 + Bird API + Biome 2.3 + Tailwind 4.1 + pnpm 9.15

---

## Standards

**TypeScript**: Strict mode, noUncheckedIndexedAccess, noUnusedLocals, path aliases `@/*`
**Style**: Functional > OOP, early returns, 2 spaces, 100 chars, single quotes, semicolons, files <600 lines
**Edge Runtime**: Web APIs only (fetch, crypto.subtle, ReadableStream), NO Node.js APIs (fs, Buffer)
**Quality Gates**: Format → Lint → Types → Tests (60%+) → Build (ALL must pass)

---

## File Headers

**Coverage**: 62/62 files (100%)

All .ts/.tsx files have complete @file headers:
- `@file` - Descriptive name
- `@description` - One-line purpose
- `@module` - Relative path from lib/ or app/api/
- `@exports` - All exported functions/types/constants
- `@runtime` - Edge/node (app/api routes only)

**Navigation**: Read file headers before reading full file contents. Headers provide sufficient context for most navigation tasks.

---

## Critical

**9-Second Timeout**: MAX 9 seconds processing or return error immediately (CRITICAL)

**Bird Actions Pattern**:
- Synchronous JSON response (not webhooks)
- Required arguments: `conversationId`, `contactName`
- API auto-detects media type from latest message
- Endpoint: POST `/api/bird` with `X-API-Key` header (optional)

**Image Routing Pipeline**:
```
Image → Classify (2s) → Route (<10ms) → Process (4-5.5s) → Response
        Gemini 2.0       Route table     Type-specific
```

**Model Selection**:
| Type | Model | Timeout | Use Case |
|------|-------|---------|----------|
| photo | Gemini 2.0 Flash | 4s | People, objects, scenes |
| invoice | Gemini 2.0 Flash | 5s | Invoices, receipts, OCR |
| document | Gemini 2.5 Flash | 5.5s | Cedulas, contracts, policies |
| unknown | Gemini 2.5 Flash | 5.5s | Fallback (complex) |

**RAG Architecture**:
- User Query → `retrieveKnowledge` tool → `searchKnowledge()` → pgvector HNSW
- Similarity threshold: 0.65 (below → escalate to human)
- Embedding: Gemini text-embedding-004 (768 dims, ~470ms)
- Query time: ~1.5ms @ 58K records
- Seed data: `data/knowledge-base.json` (14 documents)

**Environment Variables** (see `.env.example`):
```bash
# REQUIRED
AI_GATEWAY_API_KEY=xxx    # Vercel AI Gateway (Gemini)
GROQ_API_KEY=xxx          # Groq Whisper v3

# OPTIONAL
OPENAI_API_KEY=xxx        # OpenAI Whisper (fallback)
BIRD_ACCESS_KEY=xxx       # Bird CDN auth (conditional)
NEERO_API_KEY=xxx         # Custom API key for Actions
```

**File Limits**:
- Images: 5MB (WhatsApp constraint)
- Audio: 25MB (WhatsApp constraint)

**Cost Optimization**:
- Gemini 2.0 Flash primary (89% cheaper than Claude)
- Intelligent routing saves ~30% vs always using 2.5 Flash
- Groq Whisper v3 primary (90% cheaper than OpenAI)

---

## SDD (Spec-Driven Development)

**Use for**: Features touching 3+ files, API integrations, DB schema, auth/security, performance paths
**Skip for**: Bug fixes (<50 lines), UI tweaks, docs-only, refactoring
**Lifecycle**: SPEC → PLAN → TASKS → ADR (optional) → TESTPLAN → IMPLEMENT → REVIEW → SHIP
**Templates**: `/Users/mercadeo/neero/docs-global/templates/sdd/` | **Example**: `/specs/f003-location-triage/`

---

## Tracking Files (Update EVERY interaction)

| File | Purpose | Format | Max |
|------|---------|--------|-----|
| plan.md | Architecture, stack, phase | Markdown | 50 lines |
| todo.md | [TODO\|DOING\|DONE] tasks | Markdown | 50 lines |
| prd.md | Requirements, features | Markdown | 100 lines |
| feature_list.json | Feature tracking (Anthropic) | JSON | No limit |
| claude-progress.md | Session handoff (Anthropic) | Markdown | Rolling |

**Templates**: `/Users/mercadeo/neero/docs-global/templates/tracking/`

---

## Documentation

**Project Docs (`/docs`):**
- `architecture.md` - System design, Actions pattern, Edge Runtime
- `bird/bird-multimodal-config-guide.md` - Primary operator guide (v3.0, 800 lines)
- `bird/README.md` - Documentation index (operator vs developer paths)
- `bird/bird-http-request-variables-analysis.md` - Context variables (developers)
- `bird/BIRD-CONTEXT-VARIABLES-REAL-DATA.md` - API validation data
- `ai-integration.md` - Gemini, Groq, OpenAI via AI SDK
- `deployment.md` - Vercel deployment
- `eva-kb-optimization-*.md` - Eva optimization guides (3 docs)
- `bird/archived-docs/` - Obsolete docs (webhook patterns, v1.0/v2.0, 9 files)

**Global Docs**: `/Users/mercadeo/neero/docs-global/platforms/{vercel,bird}/`

---

**Lines**: 250 | **Token Budget**: ~1,100 tokens
