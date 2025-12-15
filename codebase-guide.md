# Codebase Navigation Guide

**Version:** 1.0 | **Date:** 2025-12-15 16:30
**Purpose:** Quick reference for finding functionality in the codebase

---

## Core API Endpoints

- Bird AI Actions endpoint: `app/api/agent/inbound/route.ts`
- Multimodal processing: `app/api/bird/route.ts` (deprecated, use inbound)
- Health checks: (not implemented yet)

## Eva AI Agent

- System prompt: `lib/agent/prompts/eva-system.ts` (195 lines)
- Conversation management: `lib/agent/conversation.ts`
- Guardrails validation: `lib/agent/guardrails.ts`
- Consent handling: `lib/agent/consent.ts`

## Agent Tools

- CRM (upsertLead): `lib/agent/tools/crm.ts`
- Handover (createTicket): `lib/agent/tools/handover.ts`
- Media processing: `lib/agent/tools/media.ts` (analyzePhoto, transcribeAudio, extractDocument)
- WhatsApp messaging: `lib/agent/tools/whatsapp.ts`
- **RAG (retrieveKnowledge):** `lib/agent/tools/retrieve-knowledge.ts`

## RAG / Knowledge Base

- Vector embeddings: `lib/ai/embeddings.ts` (Gemini text-embedding-004)
- Semantic search: `lib/db/queries/knowledge.ts` (pgvector, HNSW index)
- Database schema: `lib/db/schema.ts` (medicalKnowledge table)
- Seed data: `data/knowledge-base.json` (14 documents)
- Seed script: `scripts/seed-knowledge.ts`
- Test scripts: `scripts/test-search.ts`, `scripts/test-eva-rag.ts`

## Multimodal AI Pipeline

- Image classification: `lib/ai/classify.ts` (Gemini 2.0 Flash)
- Model routing: `lib/ai/router.ts`
- Two-stage pipeline: `lib/ai/pipeline.ts`
- Audio transcription: `lib/ai/transcribe.ts` (Groq Whisper v3 + OpenAI fallback)
- Type-specific processors: `lib/ai/processors/{photo,invoice,document}.ts`
- Output schemas: `lib/ai/schemas/*.ts`
- Prompts by type: `lib/ai/prompts/*.ts`

## Bird Integration

- REST client: `lib/bird/client.ts`
- Media download (CDN): `lib/bird/media.ts`
- Message operations: `lib/bird/messages.ts`
- CRM leads: `lib/bird/leads.ts`
- Handover (escalation): `lib/bird/handover.ts`
- Type definitions: `lib/bird/types.ts` (Zod schemas)

## Database

- Neon connection: `lib/db/client.ts` (serverless)
- Drizzle schema: `lib/db/schema.ts` (medicalKnowledge, conversationState, leads, etc.)
- Queries: `lib/db/queries/knowledge.ts` (RAG), `lib/db/queries/*.ts`
- Migrations: `drizzle/` directory
- Migration config: `drizzle.config.ts`

## Security & Auth

- API key validation: `lib/auth/api-key.ts`
- Web Crypto HMAC: `lib/security/crypto.ts` (Edge Runtime compatible)
- Input sanitization: `lib/security/sanitize.ts`
- Environment validation: `lib/security/env.ts`

## Configuration

- Next.js config: `next.config.ts`
- TypeScript config: `tsconfig.json` (strict mode, path aliases)
- Linting: `biome.json` (Biome 2.3)
- Tailwind: `tailwind.config.ts`
- Package manager: pnpm 9.15

## Documentation

- Architecture: `docs/architecture.md`
- Bird Actions pattern: `docs/bird/bird-actions-architecture.md` (PRIMARY)
- Bird setup guide: `docs/bird/bird-ai-employees-setup-guide.md`
- AI integration: `docs/ai-integration.md`
- Deployment: `docs/deployment.md`
- Complete Bird docs: `docs/bird/` (12+ guides)
- Vercel docs: `docs/vercel/` (Edge Runtime, AI SDK)

## Feature Documentation

- Eva AI Employee: `feature/ai-agentic/` (PRD, user stories, plan, decisions)
- Feature validation: `validation-reports/` (f001-f006 + summary)

## Planning & Tracking

- Product requirements: `plan/prd.md`
- Architecture decisions: `plan/architecture.md`
- Known bugs: `plan/bugs.md`
- Current plan: `plan.md`
- Tasks: `todo.md`
- Features: `feature_list.json` (12 features)
- Session handoff: `claude-progress.md`

## Testing & Validation

- Feature validation: `scripts/validate-f001.ts` through `validate-f006.ts`
- RAG semantic search: `scripts/test-search.ts`
- End-to-end RAG: `scripts/test-eva-rag.ts`
- Database verification: `scripts/verify-table.ts`
- Migration script: `scripts/apply-migration.ts`
- Debug tools: `scripts/debug-similarity.ts`

## Development Utilities

- Environment: `.env.local` (copy from `.env.example`)
- Dev server: `pnpm dev` (localhost:3000)
- Build: `pnpm build`
- Lint: `pnpm lint` (Biome)
- Type check: `pnpm typecheck`

## Common Tasks

**Add new knowledge to RAG:**
1. Add document to `data/knowledge-base.json`
2. Run: `npx tsx scripts/seed-knowledge.ts`
3. Test: `npx tsx scripts/test-search.ts`

**Add new agent tool:**
1. Create tool in `lib/agent/tools/`
2. Register in `app/api/agent/inbound/route.ts` (tools object)
3. Document in `lib/agent/prompts/eva-system.ts`

**Add new Bird endpoint:**
1. Create route in `app/api/`
2. Update `docs/bird/bird-actions-architecture.md`

**Run feature validation:**
```bash
npx tsx scripts/validate-f001.ts  # Data Collection
npx tsx scripts/validate-f002.ts  # Price Handover
npx tsx scripts/validate-f004.ts  # Photo Analysis
npx tsx scripts/validate-f005.ts  # Audio Transcription
npx tsx scripts/validate-f006.ts  # Guardrails
```

**Database migrations:**
1. Update `lib/db/schema.ts`
2. Generate: `pnpm drizzle-kit generate`
3. Apply: `npx tsx scripts/apply-migration.ts` (or drizzle-kit push if env vars work)

---

**Lines:** 152 | **Purpose:** Quick reference for developers
