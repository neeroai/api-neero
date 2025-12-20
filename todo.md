# todo.md - EVA AI Employee (Cirugía Plástica)

**Version:** 1.1 | **Date:** 2025-12-20 20:45 | **Status:** Active

---

## TODO

### Phase 1: Eva KB Deployment [NEXT - READY]
- [ ] Review executive summary with stakeholder
- [ ] Upload Knowledge Base files to Bird Dashboard (15 min)
- [ ] Update Additional Instructions in Bird Dashboard (10 min)
- [ ] Run smoke tests (3 messages via WhatsApp)
- [ ] Configure monitoring alerts (3 alerts)
- [ ] Execute 6 test cases from testing guide
- [ ] Monitor metrics for 7 days
- [ ] Validate ROI on Day 7 (4/4 metrics must pass)

### Phase 2: F003 Implementation [BLOCKING API PRODUCTION]
- [ ] Decide implementation approach (prompt-based 15min or code-based 2hrs)
- [ ] Implement location triage for Bogotá (auto-respond)
- [ ] Implement escalation for other cities (Medellín, Cali, etc.)
- [ ] Test with location inquiries (10 test cases)
- [ ] Validate 95% accuracy target
- [ ] Update feature_list.json status

### Phase 3: Staging Deployment [After F003]
- [ ] Create Vercel staging project (api-neero-staging)
- [ ] Create Neon PostgreSQL staging database
- [ ] Run database migrations on staging
- [ ] Configure environment variables in Vercel
- [ ] Deploy to staging and verify build
- [ ] Run validation scripts against staging
- [ ] Manual E2E tests with Bird AI Employee

---

## DOING

Nothing currently in progress.

---

---

## BLOCKED

### F003: Location Triage [CRITICAL]
- **Blocker:** Implementation decision needed
- **Impact:** 28% of conversations (310/1,106)
- **Options:** Prompt (15 min) vs Code (2 hours)
- **Blocks:** Staging + Production deployment

---

## DONE

### Eva Knowledge Base Optimization [2025-12-20]
- [x] Fase 1: Content classification (DINÁMICO vs ESTÁTICO)
- [x] Fase 2: Create Knowledge Base files (procedimientos, ubicaciones, faqs)
- [x] Fase 3: Reduce Additional Instructions (9,000 → 3,260 tokens)
- [x] Fase 4: Create testing guide (6 test cases)
- [x] Fase 5: Create deployment guide (30-45 min procedure)
- [x] Create executive summary (ROI: $24,300/year, 12-day payback)
- [x] Git commits (3 commits: cbd114b, b7b2174, eb6eb98)

**Results:**
- Token reduction: -64% (9,000 → 3,260)
- Expected cost reduction: -48% ($4,095 → $2,070/month)
- Expected latency reduction: -22% (3.2s → 2.5s)
- Files created: 8 (3 KB + 4 docs + 1 script)

### RAG Implementation [2025-12-15]
- [x] Enable pgvector extension in Neon database
- [x] Create medicalKnowledge table with vector embeddings
- [x] Implement Google Gemini text-embedding-004 integration
- [x] Build semantic search with pgvector (HNSW index)
- [x] Create retrieveKnowledge tool for Eva
- [x] Seed knowledge base (14 documents)
- [x] Validation tests (semantic search + end-to-end)

### v1.0 Feature Validation [2025-12-14 to 2025-12-15]
- [x] Created validation scripts (F001-F006) - 1,130 lines total
- [x] F001: Data Collection - VALIDATED (all tests passed)
- [x] F002: Price Inquiry Handover - VALIDATED (with documented limitation)
- [x] F003: Location Triage - VALIDATED AS MISSING (not implemented)
- [x] F004: Photo Quality Analysis - VALIDATED (3103ms, within budget)
- [x] F005: Audio Transcription - VALIDATED (config confirmed)
- [x] F006: Guardrails Compliance - VALIDATED (all tests passed)
- [x] Created validation reports (6 reports, 1 summary)
- [x] Fixed git push issue (removed conversations/ with patient data)
- [x] Merged docs/optimize-llm-format → main
- [x] Created Vercel staging deployment plan

**Status:** 5/6 features CODE COMPLETE (83%)
**Scripts:** scripts/validate-f001.ts through validate-f006.ts
**Reports:** validation-reports/f001 through f006 + v1.0-validation-summary.md

### Git Housekeeping [2025-12-15]
- [x] Fixed .gitignore to exclude .claude/ (lowercase)
- [x] Commit: 391e413

---

**Lines:** 47
