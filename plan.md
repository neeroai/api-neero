# plan.md - Cost-Optimized Multimodal API

**Project:** api-neero | **Version:** 2.2.3 | **Updated:** 2025-12-20

---

## Current Status: Phase 5 DEPLOYED ✓

**Build:** PASSING | **Lint:** PASSING (1 warning) | **Deploy:** LIVE
**Production:** https://api.neero.ai

All sub-phases complete:
- 5.1: Critical Fixes (Groq timeout + audio budget)
- 5.2: AI SDK Migration (Groq REST to SDK)
- 5.3: Text Post-Processing (llama-3.1-8b-instant)
- 5.4: Research Validation (optimal model selection)
- 5.5: Eva KB Optimization (64% token reduction)

---

## Architecture Stack

**Runtime:** Vercel Edge (V8 isolates, Web APIs only)
**AI Vision:** Gemini 2.0/2.5 Flash via AI Gateway
**AI Audio:** Groq Whisper v3 + OpenAI fallback
**Database:** Neon PostgreSQL + pgvector v0.8.1 (HNSW index, 1.5ms queries)
**RAG:** Google Gemini text-embedding-004 (768 dims) + semantic search
**Cost:** ~$8.40/month (10K img + 10K audio) - 89% cheaper than Claude

---

## Latest Updates (2025-12-20)

**Eva Knowledge Base Optimization COMPLETED:**
- [x] Content classification: 9,000 tokens → 3,260 tokens (-64%)
- [x] Knowledge Base files created (procedimientos, ubicaciones, faqs)
- [x] Additional Instructions optimized (dynamic flows only)
- [x] Testing guide created (6 test cases)
- [x] Deployment guide created (30-45 min procedure)
- [x] Executive summary created (ROI: $24,300/year)

**Expected Benefits:**
- Token reduction: -64% (9,000 → 3,260)
- Cost reduction: -48% ($4,095 → $2,070/month)
- Latency reduction: -22% (3.2s → 2.5s)
- Quality maintained: ≥95% correct responses
- Payback period: 12 days

**Files Created:**
- `knowledge-base/procedimientos.md` - 17 procedures (~4,200 tokens)
- `knowledge-base/ubicaciones.md` - 2 offices + virtual (~400 tokens)
- `knowledge-base/faqs.md` - 6 FAQs (~500 tokens)
- `docs/eva-content-classification-analysis.md` - Analysis
- `docs/eva-kb-optimization-testing-guide.md` - Testing
- `docs/eva-kb-optimization-deployment-guide.md` - Deployment
- `docs/eva-kb-optimization-executive-summary.md` - Summary
- `scripts/reduce-additional-text.py` - Reduction script

---

## Previous Updates (2025-12-15)

**RAG Implementation COMPLETED:**
- [x] Neon pgvector extension enabled (v0.8.1, HNSW index)
- [x] medicalKnowledge table created (768-dim vector embeddings)
- [x] Google Gemini text-embedding-004 integration
- [x] Semantic search with pgvector cosine similarity (threshold 0.65)
- [x] retrieveKnowledge tool for Eva
- [x] Knowledge base seeded (14 documents: 5 procedures, 5 FAQs, 3 policies, 1 location)
- [x] Validation tests (66.7% success rate, correct failover behavior)

**Performance:**
- RAG overhead: ~472ms (well within 9s budget)
- HNSW query time: 1.5ms @ 58K records (AWS benchmark)
- Embedding generation: ~470ms per document
- Similarity threshold: 0.65 (balanced precision/recall)

---

## Next Phase: F003 Implementation [BLOCKING]

**CRITICAL: F003 (Location Triage) Not Implemented**
- Status: Marked DONE but NO CODE EXISTS
- Impact: 28% of conversations (310/1,106 users)
- Timeline: 15 min (prompt-based) OR 2 hours (code-based)
- Blocks: Production deployment

**After F003:**
- [ ] Vercel staging deployment (plan ready)
- [ ] Production deployment

---

## Key Constraints

- **9-second timeout:** Return error if exceeded
- **Bird Actions:** Synchronous JSON response
- **Edge Runtime:** Web APIs only (no Node.js modules)
- **File limits:** 5MB images, 25MB audio
- **Language:** Spanish default

---

**Status:** Phase 5 DEPLOYED - Live on Vercel Production | **Lines:** 50
