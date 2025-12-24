# api-neero: Architecture & Implementation Plan

Version: 1.0 | Date: 2025-12-24 12:30 | Owner: Neero Team | Status: Active

---

## Architecture

**Type:** Cost-optimized multimodal API for Bird AI Employees
**Stack:** Next.js 16 + React 19 + TypeScript 5.9 + Vercel Edge Runtime
**Database:** Neon PostgreSQL + Drizzle ORM + pgvector (HNSW)
**AI:** Gemini 2.0/2.5 Flash + Groq Whisper v3 + Vercel AI SDK 5.0
**Integration:** Bird Actions (HTTP) + WhatsApp Business API

**Validated Stack (NO INVENTAR):**
- Next.js 16: ✅ docs-global/stack/nextjs/
- Vercel Edge: ✅ docs-global/platforms/vercel/
- Bird Actions: ✅ docs-global/platforms/bird/
- Gemini Vision: ✅ docs-global/stack/ai/gemini.md
- pgvector RAG: ✅ docs-global/stack/supabase/pgvector.md

---

## Current Phase: SDD Implementation Complete

**Status:** All 4 Phases Complete ✅

**Completed:**
- ✅ Phase 1: /specs/ directory structure created
- ✅ Phase 1: Root tracking files created (plan.md, todo.md, feature_list.json)
- ✅ Phase 2: specs/f003-location-triage/ directory created
- ✅ Phase 2: F003 SDD templates populated (SPEC, PLAN, TASKS, TESTPLAN)
- ✅ Phase 3: specs/README.md process guide created
- ✅ Phase 3: CLAUDE.md updated with SDD section
- ✅ Phase 4: Directory structure validated, typecheck passing

**Next Steps:**
1. Review SDD implementation with user
2. Begin F003 Location Triage implementation using SDD lifecycle
3. Create git commit for SDD infrastructure

---

## Critical Constraints

- 9-second timeout (Edge Functions)
- Web APIs only (no Node.js)
- 60%+ test coverage requirement
- RAG similarity threshold: 0.65

---

**Lines:** 44/50 | Updated: 2025-12-24 12:30
