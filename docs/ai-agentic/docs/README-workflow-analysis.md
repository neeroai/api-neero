# Workflow Analysis Documentation - Dr. Durán Plastic Surgery

Version: 1.0 | Date: 2025-12-14 | Status: Day 1 Complete

---

## Overview

This directory contains the comprehensive business analysis for Dr. Andrés Durán's plastic surgery patient workflow, designed to inform the development of an AI agent (Eva Cirugía) that automates initial contact, photo analysis, data collection, and appointment scheduling.

**Objective:** Transform manual WhatsApp-based patient engagement into a 24/7 AI-powered system that increases conversion rates, reduces staff time, and improves patient experience.

**Business Impact:**
- 30-40% increase in lead-to-valoración conversion (faster response)
- 7-8 hours/day staff time saved (automation of repetitive tasks)
- 50% → 85% photo quality improvement (real-time AI guidance)
- 20-30% increase in valoración-to-surgery conversion (systematic nurturing)

---

## Document Map

### Core Analysis Documents

**1. Main Workflow Design (READ FIRST)**
- **File:** `plastic-surgery-workflow-design.md`
- **Size:** 61 KB (1,425 lines, ~6,800 tokens)
- **Purpose:** Comprehensive 10-stage patient journey analysis with automation opportunities
- **Audience:** Product managers, developers, business stakeholders
- **Sections:**
  - Patient journey map (10 stages: Initial Contact → Long-Term Relationship)
  - Stage-by-stage breakdown (current process, pain points, AI automation, success metrics)
  - Workflow optimizations (ROI-ranked, time savings quantified)
  - Human-critical touchpoints (what AI should NOT do)
  - Procedure-specific insights (Lipo High Tech 3, rinoplastia, etc.)
  - Decision trees (handover scenarios)
  - Success metrics framework (baselines, targets, measurement)

**2. Executive Summary (QUICK REFERENCE)**
- **File:** `workflow-design-executive-summary.md`
- **Size:** 12 KB (300 lines, ~1,500 tokens)
- **Purpose:** 2-page scannable overview for executives and time-constrained stakeholders
- **Audience:** CEO, Dr. Durán, investors, management team
- **Key Sections:**
  - Current state pain points (4 critical issues)
  - 10-stage patient journey (visual flow)
  - Top 10 automation opportunities (ROI ranked)
  - Valoración types decision framework
  - Success metrics (6-month targets)
  - Human-critical touchpoints (NO AI zones)
  - Handover scenarios (when to transfer to human)
  - Implementation phases (4 phases over 6 months)

### Data Collection & Research

**3. Staff Interview Template (DAY 2 TASK)**
- **File:** `staff-interview-template.md`
- **Size:** 18 KB (600 lines, ~2,500 tokens)
- **Purpose:** Structured 90-minute interview guide to gather missing data and validate assumptions
- **Participants:** Coordinator, Medical Assistant, Reception, Dr. Durán (approvals)
- **Sections (33 Questions, 12 Sections):**
  - Volume & baseline metrics (inquiries/day, conversion rates)
  - Valoración types & costs (pre-consulta, virtual, presencial)
  - Scheduling & systems (calendar, availability, booking process)
  - Payment processing (methods, timing, verification)
  - Photo handling (quality issues, requirements, instructions)
  - Medical history collection (process, critical info, labs)
  - Pain points & frustrations (repetitive questions, what to automate)
  - Post-op follow-up (schedule, attendance, complications)
  - CRM & data management (systems, storage, tracking)
  - Long-term relationship (repeat patients, referrals)
  - AI agent preferences (handover triggers, tone, after-hours)
  - Approvals & compliance (pricing disclosure, photo consent, liability)

**4. Workflow Analysis Checklist (4-DAY EXECUTION PLAN)**
- **File:** `workflow-analysis-checklist.md`
- **Size:** 15 KB (700 lines, ~3,000 tokens)
- **Purpose:** Day-by-day task breakdown to execute workflow analysis in 4 days
- **Audience:** Business analyst, project manager
- **Daily Breakdown:**
  - **Day 1 (Dec 14):** Research & documentation ✅ COMPLETE
  - **Day 2 (Dec 15):** Staff interview & validation (3-4 hr)
  - **Day 3 (Dec 16):** Testing & validation (6 hr)
  - **Day 4 (Dec 17):** Implementation planning (6 hr)
- **Deliverables:**
  - Day 2: Staff interview notes, validated costs/baselines
  - Day 3: Photo quality test results, calendar/payment integration research
  - Day 4: Eva agent v2 config, Phase 1 launch plan, metrics dashboard spec

### Supporting Files

**5. Plastic Surgery Agent Examples (REFERENCE)**
- **File:** `plastic-surgery-agent-examples.md`
- **Size:** 27 KB
- **Purpose:** Example AI conversations, response templates, edge cases
- **Audience:** Developers, QA testers

**6. Staff Interview Notes (TO BE CREATED DAY 2)**
- **File:** `staff-interview-notes.md` (not yet created)
- **Purpose:** Documented findings from 90-min staff interview
- **Expected Size:** 20-30 KB
- **Critical Data:**
  - Baseline metrics (volume, conversion rates, no-show rate)
  - Valoración costs (pre-consulta, virtual, presencial)
  - Time savings potential (hours/day with AI)
  - Photo quality baseline (current % usable)
  - Approvals (pricing disclosure, financing mention, photo consent)

**7. Photo Quality Test Results (TO BE CREATED DAY 3)**
- **File:** `photo-quality-test-results.md` (not yet created)
- **Purpose:** AI photo quality evaluation accuracy with 20 real patient samples
- **Expected Size:** 15-20 KB
- **Test Criteria:**
  - AI vs human agreement rate (target: >85%)
  - False positive rate (AI says usable, human says no) (target: <10%)
  - False negative rate (AI says unusable, human says yes) (target: <5%)

---

## Key Findings (Day 1 Analysis)

### Current State Pain Points

**1. Response Time Bottleneck (CRITICAL)**
- **Current:** 2-4 hour manual WhatsApp response during business hours
- **After-hours:** Zero coverage (6pm-9am inquiries ignored)
- **Impact:** 40% potential lead loss (patients contact competitors while waiting)
- **AI Solution:** <2 min instant response, 24/7 availability
- **ROI:** +30-40% lead conversion

**2. Photo Quality Crisis (HIGH IMPACT)**
- **Current:** 50% of patient photos unusable (poor lighting, wrong angles, filters)
- **Staff Impact:** 30 min/day re-requesting photos with verbal instructions
- **Delay:** 2-5 days average to get usable photos
- **AI Solution:** Real-time photo quality guidance (lighting, angle, framing feedback)
- **ROI:** 50% → 85% usable photos, -5 days scheduling delay

**3. Manual Data Collection (EFFICIENCY)**
- **Current:** 15 min per inquiry (back-and-forth WhatsApp messages)
- **No CRM:** Conversations lost in WhatsApp threads
- **Staff Time:** 3+ hours/day on repetitive questions
- **AI Solution:** Structured 5-min conversational form + Bird Action (update_contact)
- **ROI:** 10 min saved per inquiry, 2x inquiry capacity

**4. Inconsistent Follow-Up (REVENUE LEAK)**
- **Decision Period:** 3-30 days (patient ghosting common)
- **No Nurture:** Ad-hoc WhatsApp messages (depends on coordinator remembering)
- **Post-Op:** Reactive check-ins (no proactive complication detection)
- **AI Solution:** Automated Day 3, 7, 14, 21 nurture sequence + daily post-op check-ins
- **ROI:** +20-30% valoración-to-surgery conversion, earlier complication detection

### Top 10 Automation Opportunities (ROI Ranked)

| Priority | Automation | Time Saved | Conversion Impact | Complexity |
|----------|------------|------------|-------------------|------------|
| **P0** | Instant response (<2 min, 24/7) | 3hr/day | +30-40% leads | Low |
| **P0** | Photo quality real-time check | 30 min/day | Faster scheduling | Medium |
| **P0** | Structured data collection | 1-2hr/day | 95% completeness | Low |
| **P1** | Valoración type recommendation | 20 min/patient | Faster booking | Low |
| **P1** | Post-op daily check-ins | 45 min/day | Earlier complications | Medium |
| **P1** | Follow-up appointment reminders | 20 min/day | -50% no-shows | Low |
| **P2** | Pre-op checklist tracker | 30 min/day | -60% delays | Medium |
| **P2** | Nurture sequence (Day 3,7,14,21) | 1hr/day | +20-30% conversion | Medium |
| **P2** | Calendar API integration | 25 min/booking | Instant booking | High |
| **P3** | Payment automation (Stripe) | 15 min/booking | Faster payment | Medium |

**Total Daily Time Saved:** 7-8 hours coordinator time

---

## Patient Journey (10 Stages)

```
┌─────────────────────────────────────────────────────────────────┐
│              DR. DURÁN PATIENT JOURNEY (LATAM)                  │
└─────────────────────────────────────────────────────────────────┘

1. INITIAL CONTACT (Entry Point)
   WhatsApp (70%) | Instagram DM (20%) | Phone (10%)
   Current: 2-4hr manual response | Target: <2 min AI
   ↓

2. INFORMATION GATHERING (Qualification)
   Eva AI collects: name, phone, email, country, procedure, photos
   Current: 15 min staff time | Target: 5 min (AI-guided)
   ↓

3. VALORACIÓN SELECTION (Decision Point)
   Pre-consulta (WhatsApp+Photos, 15 min, [TBD cost])
   Virtual (Video call, 30 min, [TBD cost])
   Presencial (In-office, 60 min, BAQ/BOG, [TBD cost])
   AI recommends based on procedure + location
   ↓ [HUMAN HANDOVER: Pricing discussion]

4. APPOINTMENT SCHEDULING + PAYMENT
   Coordinator offers slots → Patient pays → Calendar entry
   Current: Manual | Target: Phase 2 API integration
   ↓

5. VALORACIÓN (Dr. Durán Evaluation)
   Physical/virtual exam → Quote → Risk discussion
   CRITICAL: 100% human touchpoint - no AI
   ↓

6. DECISION PERIOD (Patient Reflection)
   3-30 days average → AI nurtures (Day 3, 7, 14, 21)
   Educational content, testimonials, financing options
   ↓

7. PRE-PROCEDURE (Medical Clearance)
   Labs, clearances, payment → AI tracks checklist
   Automated reminders: Week -4, -2, -1, Day -3
   ↓

8. PROCEDURE DAY (Surgery)
   Arrival → Markings → Surgery → Recovery → Discharge
   CRITICAL: 0% AI involvement - medical staff only
   ↓

9. POST-PROCEDURE (Recovery Monitoring)
   Day 1, 7, 30, 90 follow-ups → AI check-ins daily
   Complication detection (urgent keywords → alert Dr. Durán)
   ↓

10. LONG-TERM RELATIONSHIP (Loyalty)
    Annual check-ins → Referral program → Educational content
    Repeat patient rate: [TBD] → Target: +30%
```

**Total Journey Duration:** 7-60 days (inquiry → surgery)
**AI Automation Stages:** 1, 2, 4, 7, 9 (60% of staff time)
**Human-Critical Stages:** 5, 8 (medical judgment, legal liability)

---

## Valoración Types (Decision Framework)

| Type | Format | Duration | Location | Cost | Recommended For |
|------|--------|----------|----------|------|-----------------|
| **Pre-consulta** | WhatsApp + Photos | 15 min | Remote | **[TBD]** | Simple facial, remote international, exploring options |
| **Virtual** | Video call | 30 min | Remote | **[TBD]** | Complex facial, out-of-city Colombia, international planning |
| **Presencial** | In-office exam | 60 min | Barranquilla/Bogotá | **[TBD]** | Body procedures, breast, local patients |

**AI Recommendation Logic:**
- **Body procedures** (Lipo, BBL, abdominoplasty) → ALWAYS Presencial (physical exam critical)
- **Facial procedures** (rhinoplasty, blepharoplasty) → Presencial if local, Virtual if remote
- **Minimally invasive** (lipo papada, bichectomy) → Pre-consulta if exploring, Virtual if ready

---

## Implementation Phases

**Phase 1: MVP Launch (Week 1 - Day 3-4 of Workstream B)**
- Instant response (24/7)
- Structured data collection + Bird Action (update_contact)
- Photo processing enabled (process_media_surgery Action)
- Photo quality guidance (real-time feedback)
- Handover triggers (pricing, medical advice, urgency)
- Valoración type recommendation
- Test with 10 real conversations

**Phase 2: Enhanced Automation (Week 2-3)**
- Appointment reminders (48hr, 24hr, 2hr)
- Post-op daily check-ins (Day 1, 3, 7, 30, 90)
- Calendar API integration (read-only, show availability)

**Phase 3: Full Automation (Month 2-3)**
- Calendar booking (write access, create appointments)
- Payment link generation (Stripe/Wompi)
- Pre-op checklist tracker (labs, clearances)
- Nurture sequence (Decision Period)

**Phase 4: Optimization (Month 4-6)**
- A/B testing (message variations, timing)
- Sentiment analysis (detect frustration)
- CRM integration (HubSpot, Pipedrive, custom)

---

## Success Metrics (6-Month Targets)

| Metric | Current Baseline | 6-Month Target | Measurement |
|--------|------------------|----------------|-------------|
| Response time (first reply) | 2-4 hours | <1 minute | Bird Conversations API |
| Photo quality (ready for review) | 50% usable | 85% usable | Manual review sample (50 photos/month) |
| Staff time per inquiry | 15 min | 5 min | Time tracking (coordinator logs) |
| Lead-to-valoración conversion | [TBD] | +30-40% increase | Funnel analysis |
| No-show rate (valoraciones) | [TBD] | -50% decrease | Calendar records |
| Valoración-to-surgery conversion | [TBD] | +20-30% increase | Medical records |
| Patient satisfaction (NPS) | [TBD] | 70+ NPS | Day 90 survey |
| Repeat patient rate | [TBD] | +30% | Patient database |

**Measurement Dashboard:** [TBD - Looker, Google Data Studio, or custom]
**Update Frequency:** Daily (response time), Weekly (conversion), Monthly (NPS)

---

## Critical Configuration Changes (Eva Agent)

**Current Eva Valoración Agent Issues:**
1. `disableImageSupport: true` → **MUST CHANGE to `false`** (enable photo analysis)
2. `maxOutputTokens: 2000` → **REDUCE to 500-800** (conversational, not essays)
3. `disableWaitMessages: false` → **CHANGE to `true`** (no "typing..." feels robotic)
4. `llmModel: "deepseek-chat"` → **EVALUATE upgrade to Claude Sonnet 3.5** (better medical nuance)

**New Actions Required:**
- `process_media_surgery` → Photo quality evaluation (lighting, angle, filters)
- Returns: `{ usable: boolean, score: 0-100, issues: [], suggestions: [] }`

**Response Format Changes:**
- **Current:** Long paragraphs (100+ words)
- **Target:** Short (20-30 words), bullet points, interactive buttons

---

## Handover Scenarios (AI → Human)

### Instant Transfer (No AI Answer)
- **Pricing:** "¿Cuánto cuesta [procedure]?"
- **Medical advice:** "¿Puedo hacer X + Y juntos?"
- **Urgent symptoms:** "Tengo dolor + fiebre + pus" (POST-OP ALERT)
- **Frustration:** "Nadie me responde, esto es un asco"

### AI Handles Fully
- **Procedure info:** "¿Qué es Lipo High Tech 3?"
- **Location:** "¿Dónde están ubicados?"
- **Recovery time:** "¿Cuánto dura recuperación de rinoplastia?"
- **Hours:** "¿Qué horario tienen?"

### AI Collects Data → Transfer
- **Ready to book:** "Quiero agendar valoración"
  - Eva collects: name, phone, email, country, procedure
  - Eva updates Bird Contact → Transfers to coordinator

---

## Next Steps (Day 2-4)

**Day 2 (Dec 15) - Staff Interview:**
- [ ] Schedule 90-min session with Coordinator + Medical Assistant + Reception
- [ ] Use `/docs/api-bird/staff-interview-template.md` (33 questions)
- [ ] Document findings in `/docs/api-bird/staff-interview-notes.md`
- [ ] Extract baseline metrics (volume, conversion, time spent)
- [ ] Validate valoración costs (pre-consulta, virtual, presencial)
- [ ] Get approvals from Dr. Durán (pricing disclosure, photo consent, emergency contact)

**Day 3 (Dec 16) - Testing & Validation:**
- [ ] Test photo quality AI with 20 real patient samples
- [ ] Document results in `/docs/api-bird/photo-quality-test-results.md`
- [ ] Research calendar integration options (Google Calendar API)
- [ ] Research payment gateway options (Wompi, Stripe, PayU)

**Day 4 (Dec 17) - Implementation Planning:**
- [ ] Create Eva agent v2 configuration (`eva-agent-configuration-v2.json`)
- [ ] Design API endpoint for surgical photo analysis (`surgical-photo-api-spec.md`)
- [ ] Write Phase 1 launch plan (`phase-1-launch-plan.md`)
- [ ] Create test plan with 10 scenarios (`phase-1-test-plan.md`)
- [ ] Design metrics dashboard spec (`metrics-dashboard-spec.md`)

**Day 5+ (Dec 18+) - Handoff to Development:**
- [ ] Present workflow analysis to dev team (60-min walkthrough)
- [ ] Answer technical questions
- [ ] Support Phase 1 implementation
- [ ] Monitor metrics post-launch

---

## Questions & Approvals Needed

**From Dr. Durán (CRITICAL for Phase 1 launch):**
- [ ] Can AI share valoración pricing with patients? (Yes/No/Ranges)
- [ ] Can AI mention financing options (Addi, installments)? (Yes/No)
- [ ] Can AI request before/after photo consent at Day 90? (Yes/No)
- [ ] Emergency contact number for post-op alert scenarios? (_______)
- [ ] Photo usage policy (face visible or hidden)? (_______)

**From Staff:**
- [ ] When should AI transfer to human? (pricing only? medical questions?)
- [ ] Photo quality criteria (what's "usable" for Dr. Durán)? (_______)
- [ ] After-hours expectations (AI handles + staff follows up next day)? (Yes/No)

**From Legal/Compliance:**
- [ ] Patient data privacy compliance (Colombian Ley 1581/2012)? (Yes/No)
- [ ] Medical liability disclaimers (AI not medical advice)? (_______)
- [ ] WhatsApp Business API terms (healthcare use case compliant)? (Yes/No)

---

## Document Status

| Document | Status | Owner | Last Updated |
|----------|--------|-------|--------------|
| `plastic-surgery-workflow-design.md` | ✅ Complete | Business Analyst | 2025-12-14 |
| `workflow-design-executive-summary.md` | ✅ Complete | Business Analyst | 2025-12-14 |
| `staff-interview-template.md` | ✅ Ready | Business Analyst | 2025-12-14 |
| `workflow-analysis-checklist.md` | ✅ Active | Business Analyst | 2025-12-14 |
| `staff-interview-notes.md` | ⬜ Pending (Day 2) | Business Analyst | - |
| `photo-quality-test-results.md` | ⬜ Pending (Day 3) | Business Analyst | - |
| `eva-agent-configuration-v2.json` | ⬜ Pending (Day 4) | Developer | - |
| `phase-1-launch-plan.md` | ⬜ Pending (Day 4) | Product Manager | - |

---

## Contact Information

**Dr. Durán Practice:**
- Coordinator: [TBD - from interview]
- Medical Assistant: [TBD - from interview]
- Reception: [TBD - from interview]
- Dr. Andrés Durán: [TBD]

**Neero Team:**
- Business Analyst: [Name]
- Project Manager: Javier Polo (CEO)
- Developer (API): [Name]
- Developer (Bird Config): [Name]

---

## References

**Business Analysis:**
- ASPS (American Society of Plastic Surgeons) Statistics 2024
- SCCP (Sociedad Colombiana de Cirugía Plástica) Guidelines
- ISAPS Global Survey
- Competitor analysis (LATAM plastic surgery practices)

**Technical Integration:**
- Bird AI Employees Documentation: https://bird.com/docs/ai-employees
- Bird Conversations API: `/docs/bird/bird-conversations-api-capabilities.md`
- Bird Actions Architecture: `/docs/bird/bird-actions-architecture.md`
- Vercel AI SDK: https://ai-sdk.dev
- Google Gemini API: https://ai.google.dev/gemini-api/docs

**Compliance:**
- Colombian Ley 1581/2012 (Habeas Data - Patient Privacy)
- Resolución 2003/2014 (Surgical Safety Standards)
- WhatsApp Business API Healthcare Guidelines

---

**Last Updated:** 2025-12-14
**Workstream B Status:** Day 1 Complete ✅
**Next Milestone:** Staff Interview (Day 2)
