# todo.md - EVA AI Employee (Cirugía Plástica)

**Version:** 1.0 | **Date:** 2025-12-15 16:35 | **Status:** Active

---

## TODO

### Phase 1: F003 Implementation [NEXT - BLOCKING PRODUCTION]
- [ ] Decide implementation approach (prompt-based 15min or code-based 2hrs)
- [ ] Implement location triage for Bogotá (auto-respond)
- [ ] Implement escalation for other cities (Medellín, Cali, etc.)
- [ ] Test with location inquiries (10 test cases)
- [ ] Validate 95% accuracy target
- [ ] Update feature_list.json status

### Phase 2: Staging Deployment [After F003]
- [ ] Create Vercel staging project (api-neero-staging)
- [ ] Create Neon PostgreSQL staging database
- [ ] Run database migrations on staging
- [ ] Configure environment variables in Vercel
- [ ] Deploy to staging and verify build
- [ ] Run validation scripts against staging
- [ ] Manual E2E tests with Bird AI Employee

---

## DOING

### Documentation Update [Completed 2025-12-15 16:45]
- [x] Create codebase-guide.md (quick navigation reference)
- [x] Update plan.md with RAG implementation
- [x] Update todo.md with completed RAG work
- [x] Update claude-progress.md with latest session
- [x] Update CLAUDE.md with RAG section
- [x] Update feature_list.json with F012

---

## BLOCKED

### F003: Location Triage [CRITICAL]
- **Blocker:** Implementation decision needed
- **Impact:** 28% of conversations (310/1,106)
- **Options:** Prompt (15 min) vs Code (2 hours)
- **Blocks:** Staging + Production deployment

---

## DONE

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
