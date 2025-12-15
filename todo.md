# todo.md - EVA AI Employee (Cirugía Plástica)

**Version:** 1.0 | **Date:** 2025-12-15 15:00 | **Status:** Active

---

## TODO

### Phase 1: Staging Deployment [NEXT]
- [ ] Create Vercel staging project (`api-neero-staging`)
- [ ] Create Neon PostgreSQL staging database
- [ ] Run database migrations on staging
- [ ] Configure environment variables in Vercel
- [ ] Verify staging domain configuration
- [ ] Deploy to staging and verify build
- [ ] Run validation scripts against staging
- [ ] Manual E2E tests with Bird AI Employee

### Phase 2: F003 Implementation [BLOCKED - After Staging]
- [ ] Decide implementation approach (prompt-based or code-based)
- [ ] Implement location triage for Bogotá
- [ ] Test with location inquiries (Bogotá, Medellín, Cali)
- [ ] Validate 95% accuracy target
- [ ] Update feature_list.json status

---

## DOING

None (checkpoint pause)

---

## BLOCKED

### F003: Location Triage
- **Blocker:** Implementation decision needed (prompt-based vs code-based)
- **Impact:** 28% of conversations (310/1,106 users)
- **Options:** 15 min (prompt) or 2 hours (code)

---

## DONE

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
