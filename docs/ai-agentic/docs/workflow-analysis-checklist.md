# Workflow Analysis Checklist - 4-Day Plan

Version: 1.0 | Date: 2025-12-14 | Owner: Business Analyst | Status: Active

---

## Overview

This checklist guides the 4-day execution of Dr. Durán's plastic surgery workflow analysis and AI agent design (Workstream B).

**Goal:** Deliver actionable workflow design that product and development teams can implement immediately.

**Documents Created:**
1. ✅ `/docs/api-bird/plastic-surgery-workflow-design.md` (1,425 lines - complete analysis)
2. ✅ `/docs/api-bird/workflow-design-executive-summary.md` (300 lines - quick reference)
3. ✅ `/docs/api-bird/staff-interview-template.md` (600 lines - data collection)
4. ✅ `/docs/api-bird/workflow-analysis-checklist.md` (this file)

---

## Day 1 (Today - Dec 14): Research & Documentation ✅

**Status:** COMPLETE

### Morning (3 hours)
- [x] Read existing Eva Valoración agent configuration
- [x] Analyze Bird Actions architecture
- [x] Review multimodal API integration
- [x] Study existing workflow design doc

### Afternoon (4 hours)
- [x] Draft 10-stage patient journey map
- [x] Document automation opportunities (ROI analysis)
- [x] Create decision trees (handover scenarios)
- [x] Write success metrics framework
- [x] Prepare staff interview questions

### Evening (1 hour)
- [x] Write executive summary (2-page scannable version)
- [x] Create interview template (90-min session)
- [x] Prepare this checklist

**Deliverables:**
- [x] Comprehensive workflow design doc (1,425 lines)
- [x] Executive summary (300 lines)
- [x] Staff interview template (33 questions, 12 sections)
- [x] 4-day execution plan

---

## Day 2 (Dec 15): Staff Interview & Validation

**Status:** PENDING

**Time Required:** 3-4 hours total (90 min interview + 2 hr documentation)

### Morning (Prepare - 30 min)
- [ ] Review interview template (`/docs/api-bird/staff-interview-template.md`)
- [ ] Print or have digital copy ready for note-taking
- [ ] Test recording setup (Zoom, Google Meet, or phone recording)
- [ ] Send calendar invite with Zoom link to staff:
  - Coordinator (REQUIRED)
  - Medical Assistant (REQUIRED)
  - Reception (REQUIRED)
  - Dr. Durán (last 15 min for approvals - OPTIONAL)

### Interview Session (90 min)
**Attendees:** Coordinator + Medical Assistant + Reception (+ Dr. Durán optional)

**Section Order (Optimized for Flow):**

**Coordinator Focus (30 min):**
- [ ] Section 1: Volume & Baseline Metrics (Q1-Q4)
- [ ] Section 2: Valoración Types & Costs (Q5-Q6) ← CRITICAL
- [ ] Section 3: Scheduling & Systems (Q7-Q10)
- [ ] Section 4: Payment Processing (Q11-Q13)

**Medical Assistant Focus (20 min):**
- [ ] Section 5: Photo Handling (Q14-Q15) ← HIGH IMPACT
- [ ] Section 6: Medical History Collection (Q16-Q17)
- [ ] Section 8: Post-Op Follow-Up (Q21-Q23)

**All Staff (20 min):**
- [ ] Section 7: Pain Points & Frustrations (Q18-Q20)
- [ ] Section 9: CRM & Data Management (Q24)
- [ ] Section 10: Long-Term Relationship (Q25-Q26)

**Dr. Durán (15 min - if available):**
- [ ] Section 11: AI Agent Preferences (Q27-Q29)
- [ ] Section 12: Approvals & Compliance (Q30-Q33) ← REQUIRED FOR LAUNCH

**Wrap-Up (5 min):**
- [ ] Summarize top 3 pain points heard
- [ ] Confirm next steps (documentation review, Phase 1 timeline)
- [ ] Thank participants

### Afternoon (Document Findings - 2 hr)
- [ ] Transcribe interview recording (or use AI transcription: Otter.ai, Rev.com)
- [ ] Create `/docs/api-bird/staff-interview-notes.md` (structured findings)
- [ ] Extract baseline metrics (volume, conversion rates, time spent)
- [ ] Validate assumptions in workflow design doc (update TBD sections)
- [ ] Highlight discrepancies (if interview findings differ from draft)

### Critical Data to Extract

**Volume & Baselines:**
- Daily WhatsApp inquiry volume: ___________
- Lead → Valoración conversion: ___________
- Valoración → Surgery conversion: ___________
- No-show rate: ___________
- Ghost rate: ___________

**Costs (Patient-Facing):**
- Pre-consulta: ___________ USD / COP
- Virtual: ___________ USD / COP
- Presencial: ___________ USD / COP
- Applies toward surgery? [ ] Yes [ ] No

**Time Savings Potential:**
- Current staff time per inquiry: ___________ min
- Photo re-request time: ___________ min/day
- Repetitive questions: ___________ hr/day
- **TOTAL TIME SAVED (with AI):** ___________ hr/day

**Photo Quality Baseline:**
- Current usable rate: ___________ %
- Target with AI guidance: 85%

**Approvals Checklist:**
- [ ] Can AI share valoración pricing? (Yes/No/Ranges)
- [ ] Can AI mention financing? (Yes/No)
- [ ] Can AI request photo consent at Day 90? (Yes/No)
- [ ] Emergency contact number: ___________
- [ ] Data privacy compliance: [ ] Yes [ ] Partial [ ] Unsure

### End-of-Day Deliverable
- [ ] `/docs/api-bird/staff-interview-notes.md` created
- [ ] Update workflow design doc (replace all [TBD] sections with real data)
- [ ] Create prioritized action items list for Day 3

---

## Day 3 (Dec 16): Testing & Validation

**Status:** PENDING

**Time Required:** 6 hours

### Morning (Photo Quality Analysis - 3 hr)

**Objective:** Test AI photo quality evaluation with real patient samples

**Requirements:**
- [ ] Collect 20 sample patient photos (anonymized, with consent)
  - 10 "good quality" examples
  - 10 "poor quality" examples (current 50% unusable rate)
- [ ] Process through Gemini API with photo quality prompt
- [ ] Document results in `/docs/api-bird/photo-quality-test-results.md`

**Photo Categories to Test:**
- [ ] Body procedures (frontal, lateral, posterior angles)
- [ ] Facial procedures (frontal, profile, base nasal)
- [ ] Common issues (dark lighting, blurry, filtered, wrong angle)

**Test Criteria:**
```
For each photo, record:
1. Procedure type: (Lipo, Rinoplastia, etc.)
2. Expected angle: (frontal, perfil, etc.)
3. Gemini score: (0-100)
4. Gemini usability: (true/false)
5. Gemini issues detected: (array)
6. Gemini suggestions: (array)
7. Human evaluation: (usable yes/no)
8. Agreement: (AI matches human? yes/no)
```

**Success Criteria:**
- AI agrees with human evaluation: >85% of cases
- False positives (AI says usable, human says no): <10%
- False negatives (AI says unusable, human says yes): <5%

**Deliverable:**
- [ ] Create `/docs/api-bird/photo-quality-test-results.md`
- [ ] Include accuracy metrics, sample outputs, recommendations

### Afternoon (Workflow Validation - 3 hr)

**Task 1: Valoración Cost Research (1 hr)**
If costs not provided by Dr. Durán in interview:
- [ ] Research Colombia plastic surgery market (Google, Instagram, competitor websites)
- [ ] Estimate ranges based on market average (cite sources)
- [ ] Document in workflow design doc with [ESTIMATED] tag

**Task 2: Calendar System Investigation (1 hr)**
- [ ] Confirm calendar system (Google Calendar, Calendly, other?)
- [ ] Research API integration options:
  - Google Calendar API (read-only for Phase 2, write for Phase 3)
  - Calendly API (if applicable)
  - Custom integration (if proprietary system)
- [ ] Document in `/docs/api-bird/calendar-integration-options.md`

**Task 3: Payment Gateway Research (1 hr)**
- [ ] Identify current payment method (bank transfer, Wompi, Stripe, PayU?)
- [ ] Research API integration options for automated payment links
- [ ] Document in `/docs/api-bird/payment-integration-options.md`

### End-of-Day Deliverable
- [ ] Photo quality test results documented (20 samples analyzed)
- [ ] Calendar integration options (feasibility assessment)
- [ ] Payment gateway options (API capabilities)
- [ ] Update workflow design doc with validation findings

---

## Day 4 (Dec 17): Implementation Planning

**Status:** PENDING

**Time Required:** 6 hours

### Morning (Eva Agent Configuration - 3 hr)

**Task 1: Update Eva Agent Config (1.5 hr)**
- [ ] Create `/docs/api-bird/eva-agent-configuration-v2.json` (updated from v1)
- [ ] Fix critical issues:
  - `disableImageSupport: false` (enable photo processing)
  - `maxOutputTokens: 500-800` (shorter responses)
  - `disableWaitMessages: true` (no typing indicators)
- [ ] Add new instructions from workflow design:
  - Valoración type recommendation logic
  - Photo quality guidance prompts
  - Handover triggers (pricing, medical advice, urgency)
- [ ] Create `process_media_surgery` Action (photo quality evaluation)

**Task 2: API Endpoint Design (1.5 hr)**
- [ ] Update `/app/api/bird/route.ts` specification
- [ ] Add photo quality analysis logic (Gemini prompt)
- [ ] Define response schema for surgical photos:
  ```typescript
  {
    success: true,
    data: {
      photoQuality: {
        usable: boolean,
        score: number,
        issues: string[],
        suggestions: string[]
      },
      procedureType: string,
      photoAngle: string
    }
  }
  ```
- [ ] Document in `/docs/api-bird/surgical-photo-api-spec.md`

### Afternoon (Phase 1 Launch Plan - 3 hr)

**Task 1: Create Phase 1 Rollout Plan (1.5 hr)**
- [ ] Create `/docs/api-bird/phase-1-launch-plan.md` with:
  - Pre-launch checklist (approvals, config, testing)
  - Launch day checklist (deployment, monitoring, rollback plan)
  - Post-launch checklist (metrics tracking, iteration)
  - Success criteria (response time, photo quality, conversion rate)

**Phase 1 Scope (MVP - Week 1):**
```
✓ Instant response (<2 min, 24/7)
✓ Structured data collection (name, phone, email, country, procedure)
✓ Bird Action: update_contact (saves to Bird CRM)
✓ Photo processing enabled (process_media_surgery Action)
✓ Photo quality guidance (real-time feedback loop)
✓ Handover triggers (pricing, medical advice, urgency, frustration)
✓ Procedure information (Lipo High Tech 3, rinoplastia, etc.)
✓ Valoración type recommendation logic
✓ Test with 10 real patient conversations (controlled rollout)
```

**Task 2: Create Test Plan (1 hr)**
- [ ] Create `/docs/api-bird/phase-1-test-plan.md` with:
  - 10 test scenarios (pricing question, photo submission, urgent symptom, etc.)
  - Expected AI behavior for each
  - Success criteria (response time, accuracy, handover trigger)
  - Rollback triggers (if errors >10%, manual override)

**Test Scenarios:**
1. New patient inquiry (general interest)
2. Pricing question (must transfer to human)
3. Photo submission (good quality) → AI confirms
4. Photo submission (poor quality) → AI requests retake with guidance
5. Medical advice request (transfer to human)
6. Urgent post-op symptom (immediate alert)
7. Frustration/complaint (transfer to supervisor)
8. After-hours inquiry (11pm message)
9. Repeat patient (already in system)
10. Multi-procedure question (requires human judgment)

**Task 3: Create Metrics Dashboard Spec (30 min)**
- [ ] Create `/docs/api-bird/metrics-dashboard-spec.md` with:
  - Data sources (Bird Conversations API, Google Calendar, manual logs)
  - Key metrics to track (response time, photo quality, conversion rates)
  - Dashboard tools (Looker, Google Data Studio, custom)
  - Update frequency (daily, weekly, monthly)

### End-of-Day Deliverable
- [ ] Eva agent v2 configuration ready for implementation
- [ ] API endpoint specification (surgical photo analysis)
- [ ] Phase 1 launch plan (pre/during/post-launch checklists)
- [ ] Test plan (10 scenarios, success criteria)
- [ ] Metrics dashboard specification
- [ ] **FINAL:** Workflow analysis complete, ready for handoff to dev team

---

## Handoff to Development Team (Day 5+)

**Status:** PENDING

**Documents to Provide:**

**Business Analysis (Complete):**
1. ✅ `/docs/api-bird/plastic-surgery-workflow-design.md` (1,425 lines)
2. ✅ `/docs/api-bird/workflow-design-executive-summary.md` (300 lines)
3. ⬜ `/docs/api-bird/staff-interview-notes.md` (Day 2)
4. ⬜ `/docs/api-bird/photo-quality-test-results.md` (Day 3)

**Technical Specifications (Day 4):**
5. ⬜ `/docs/api-bird/eva-agent-configuration-v2.json` (updated config)
6. ⬜ `/docs/api-bird/surgical-photo-api-spec.md` (API endpoint design)
7. ⬜ `/docs/api-bird/calendar-integration-options.md` (Phase 2 prep)
8. ⬜ `/docs/api-bird/payment-integration-options.md` (Phase 3 prep)

**Implementation Guides (Day 4):**
9. ⬜ `/docs/api-bird/phase-1-launch-plan.md` (rollout checklist)
10. ⬜ `/docs/api-bird/phase-1-test-plan.md` (10 test scenarios)
11. ⬜ `/docs/api-bird/metrics-dashboard-spec.md` (tracking framework)

**Handoff Meeting Agenda (60 min):**
- [ ] Present executive summary (10 min)
- [ ] Walk through 10-stage patient journey (15 min)
- [ ] Review top 10 automation opportunities (10 min)
- [ ] Show photo quality test results (10 min)
- [ ] Explain Phase 1 scope and success criteria (10 min)
- [ ] Q&A (5 min)

---

## Success Criteria (Workstream B Complete)

- [x] Comprehensive patient journey documented (10 stages, 1,425 lines)
- [x] Automation opportunities prioritized (ROI ranked, time savings quantified)
- [ ] Staff interview completed (baselines established, costs validated)
- [ ] Photo quality AI tested (85% accuracy with 20 samples)
- [ ] Eva agent v2 configuration ready (implementation-ready JSON)
- [ ] Phase 1 launch plan created (pre/during/post-launch checklists)
- [ ] Metrics tracking framework defined (dashboard spec)
- [ ] Handoff to dev team (all docs delivered, walkthrough complete)

**Estimated Workstream B Completion:** Day 4 (Dec 17, 2025)
**Actual Completion:** [TBD]

---

## Risk Mitigation

**Risk 1: Staff unavailable for interview (Day 2)**
- **Mitigation:** Schedule backup date, offer async questionnaire (Google Form)
- **Impact:** High (baselines needed for metrics)

**Risk 2: Dr. Durán doesn't approve pricing disclosure (Day 2)**
- **Mitigation:** AI says "Te conectaré con asesor para presupuesto" (no pricing shared)
- **Impact:** Low (handover to human is acceptable)

**Risk 3: Photo quality AI accuracy <85% (Day 3)**
- **Mitigation:** Provide human-in-the-loop option (AI suggests, human confirms)
- **Impact:** Medium (slows photo guidance, but still useful)

**Risk 4: No calendar API access (Day 3)**
- **Mitigation:** Phase 1 uses manual scheduling, Phase 2 deferred until API access granted
- **Impact:** Low (manual process acceptable for MVP)

**Risk 5: Development team capacity constraints (Day 5+)**
- **Mitigation:** Prioritize P0 automations (instant response, data collection, photo guidance)
- **Impact:** Medium (delays Phase 2/3, but P0 delivers 60% of value)

---

## Daily Standup Template (Optional)

**Day N Status:**
- **Completed yesterday:** _________
- **Today's goal:** _________
- **Blockers:** _________
- **Help needed:** _________

---

## Notes & Open Questions

**Open Questions (Day 1):**
1. Who conducts staff interview? (Business analyst or project manager?)
2. How to access patient photos for testing? (anonymization, consent)
3. Is Dr. Durán available for 15-min approval section? (critical for pricing disclosure)
4. What CRM/database is currently used? (impacts Phase 2/3 integration)
5. Budget for calendar API integration? (Google Calendar API is free, Calendly paid)

**Answers (Update as resolved):**
1. _________
2. _________
3. _________
4. _________
5. _________

---

## Contact Information

**Dr. Durán Practice:**
- Coordinator: [Name], [Phone], [Email]
- Medical Assistant: [Name], [Phone], [Email]
- Reception: [Name], [Phone], [Email]
- Dr. Andrés Durán: [Phone], [Email]

**Neero Team:**
- Business Analyst: [Name]
- Project Manager: [Name]
- Developer (API): [Name]
- Developer (Bird Config): [Name]

---

**Last Updated:** 2025-12-14 (Day 1 complete)
**Next Review:** Daily (before each day's work)
**Status:** Day 1 ✅ | Day 2 ⬜ | Day 3 ⬜ | Day 4 ⬜
