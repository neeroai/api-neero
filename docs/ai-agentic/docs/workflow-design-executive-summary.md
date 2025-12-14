# Plastic Surgery Workflow Design - Executive Summary

Version: 1.0 | Date: 2025-12-14 | Owner: Business Analyst | Status: Draft

---

## Purpose

This executive summary provides a quick overview of the comprehensive patient workflow analysis for Dr. Andrés Durán's plastic surgery practice. Use this to understand key findings and prioritize implementation.

**Full Document:** `/docs/api-bird/plastic-surgery-workflow-design.md` (1,425 lines, ~6,800 tokens)

---

## Key Findings

### Current State Pain Points

**1. Response Time Bottleneck (CRITICAL)**
- Current: 2-4 hour manual WhatsApp response during business hours
- Impact: Patients contact competitors while waiting (40% potential lead loss)
- After-hours: Zero coverage (6pm-9am inquiries ignored until next day)

**2. Photo Quality Crisis (HIGH IMPACT)**
- 50% of patient photos unusable (poor lighting, wrong angles, filters)
- Staff wastes 30 min/day re-requesting photos with verbal instructions
- Delays valoración scheduling by 2-5 days average

**3. Manual Data Collection (EFFICIENCY)**
- 15 min per inquiry (back-and-forth WhatsApp messages)
- No systematic CRM capture (conversations lost in WhatsApp threads)
- Coordinator spends 3+ hours/day on repetitive questions

**4. Inconsistent Follow-Up (REVENUE LEAK)**
- No systematic nurture sequence during Decision Period (3-30 days)
- Ad-hoc post-op check-ins (depends on staff remembering)
- No complication early warning system (reactive, not proactive)

---

## 10-Stage Patient Journey

```
1. INITIAL CONTACT → WhatsApp/IG inquiry
2. INFORMATION GATHERING → Data + photo collection
3. VALORACIÓN SELECTION → Pre-consulta / Virtual / Presencial
4. APPOINTMENT SCHEDULING → Calendar + payment
5. VALORACIÓN → Dr. Durán evaluation (HUMAN-CRITICAL)
6. DECISION PERIOD → 3-30 days reflection
7. PRE-PROCEDURE → Labs, clearances, payment
8. PROCEDURE DAY → Surgery (HUMAN-CRITICAL)
9. POST-PROCEDURE → Day 1, 7, 30, 90 follow-ups
10. LONG-TERM RELATIONSHIP → Repeat patients, referrals
```

**Total Journey Duration:** 7-60 days (inquiry → surgery)
**Critical Automation Stages:** 1, 2, 4, 7, 9 (60% of staff time)
**Human-Critical Stages:** 5, 8 (medical judgment, legal liability)

---

## Top 10 Automation Opportunities (ROI Ranked)

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
**Annual Cost Savings:** ~$30-40K USD (reinvest in growth, not overtime)

---

## Valoración Types (Decision Framework)

| Type | Duration | Cost | When to Recommend |
|------|----------|------|-------------------|
| **Pre-consulta** | 15 min | [TBD] | Exploring options, simple facial, remote international |
| **Virtual** | 30 min | [TBD] | Complex facial, out-of-city Colombia, international planning |
| **Presencial** | 60 min | [TBD] | Body procedures, breast, local Barranquilla/Bogotá |

**AI Recommendation Logic:**
- Body procedures (Lipo, BBL, abdominoplasty) → ALWAYS Presencial
- Facial (rhinoplasty, blepharoplasty) → Presencial if local, Virtual if remote
- Minimally invasive (lipo papada, bichectomy) → Pre-consulta if exploring, Virtual if ready

---

## Critical Configuration Changes (Eva Agent)

**Current Issues:**
1. `disableImageSupport: true` → MUST change to `false` (enable photo analysis)
2. `maxOutputTokens: 2000` → Reduce to 500-800 (conversational, not essay)
3. `disableWaitMessages: false` → Change to `true` (no "typing..." feels robotic)

**New Actions Needed:**
- `process_media_surgery` → Photo quality evaluation (lighting, angle, filters)
- Returns: `{ usable: boolean, score: 0-100, issues: [], suggestions: [] }`

**Response Format Changes:**
- Current: Long paragraphs (100+ words)
- Target: Short, scannable (20-30 words), bullet points, buttons

---

## Success Metrics (6-Month Targets)

| Metric | Current | 6-Month Target | Impact |
|--------|---------|----------------|--------|
| Response time | 2-4hr | <1 min | +30-40% leads |
| Photo quality | 50% usable | 85% usable | -5 days scheduling delay |
| Staff time/inquiry | 15 min | 5 min | 2x inquiry capacity |
| No-show rate | [TBD] | -50% | Reduced OR waste |
| Valoración → Surgery | [TBD] | +20-30% | $XXK revenue/year |
| Patient satisfaction | [TBD] | 70+ NPS | Higher referrals |
| Repeat patient rate | [TBD] | +30% | Lifetime value +40% |

**Measurement Dashboard:** [TBD - Looker, Google Data Studio, or custom]
**Data Sources:** Bird API, Google Calendar, CRM, manual audits

---

## Human-Critical Touchpoints (NO AI)

**Medical Judgment:**
- Surgical technique selection (Dr. Durán expertise)
- "Can I do 3 procedures at once?" → Requires human evaluation
- Complication management (post-op issues)

**Pricing & Negotiation:**
- Quote generation (nuanced, case-specific)
- Financing discussions (empathy, flexibility)
- Discount approvals (coordinator discretion)

**Emotional Support:**
- Anxious patients (pre-surgery jitters)
- Post-op emotional swings (common in cosmetic surgery)
- Complaints (human de-escalation)

**Legal & Ethical:**
- Informed consent (human accountability)
- Before/after photo usage (sensitive)

**AI Role:** Prepare, educate, triage, remind → NEVER replace human judgment

---

## Handover Scenarios

### Instant Transfer (No AI Answer)
- Pricing: "¿Cuánto cuesta [procedure]?"
- Medical advice: "¿Puedo hacer X + Y juntos?"
- Urgent symptoms: "Tengo dolor + fiebre + pus" (POST-OP ALERT)
- Frustration: "Nadie me responde, esto es un asco"

### AI Handles Fully
- Procedure info: "¿Qué es Lipo High Tech 3?"
- Location: "¿Dónde están ubicados?"
- Recovery time: "¿Cuánto dura recuperación de rinoplastia?"
- Hours: "¿Qué horario tienen?"

### AI Collects Data → Transfer
- Patient ready to book: "Quiero agendar valoración"
- Eva collects: name, phone, email, country, procedure
- Eva updates Bird Contact → Transfers to coordinator

---

## Implementation Phases

**Phase 1: MVP (Week 1 - Day 3-4)**
- ✓ Instant response (24/7)
- ✓ Data collection + update_contact Action
- ✓ Handover triggers (pricing, medical, urgency)
- ✓ Photo processing enabled
- ✓ Test with 10 real conversations

**Phase 2: Enhanced (Week 2-3)**
- Photo quality guidance (real-time feedback)
- Valoración recommendation logic
- Appointment reminders (48hr, 24hr, 2hr)
- Post-op check-ins (Day 1, 3, 7, 30, 90)

**Phase 3: Full Automation (Month 2-3)**
- Calendar API integration (booking)
- Payment links (Stripe/Wompi)
- Pre-op checklist tracker
- Nurture sequence (Decision Period)

**Phase 4: Optimization (Month 4-6)**
- A/B testing (messages, timing)
- Sentiment analysis (detect frustration)
- CRM integration (HubSpot/Pipedrive)

---

## Procedure-Specific Insights

**Top 5 Requested (Estimated):**
1. Lipo High Tech 3 (35%) - $4K-8K USD - Presencial required
2. Rinoplastia (25%) - $3.5K-6K USD - Virtual OK if remote
3. Mamoplastia aumento (20%) - $4.5K-6.5K USD - Presencial required
4. BBL (10%) - $5K-8K USD - Presencial required
5. Blefaroplastia (5%) - $2.5K-4K USD - Virtual OK if simple

**Seasonal Demand:**
- HIGH: Nov-Dec (pre-summer), Feb-Mar (post-holidays), Jun-Jul (vacation)
- LOW: Aug-Sep (back-to-school), Dec 20-Jan 5 (holidays)

**Photo Requirements (AI Guidance):**
- **Body:** 6 angles (frontal, posterior, lateral L/R, oblique L/R)
- **Facial:** 5 angles (frontal, lateral L/R, base nasal, frontal smile)
- **Quality Criteria:** Natural light, neutral background, no filters, full area visible

---

## Next Steps (Action Items)

**Day 2 (TODAY):**
1. ⬜ Schedule 90-min staff interview (Coordinator + Medical Assistant + Reception)
2. ⬜ Prepare interview questions (copy from main doc Section 9)
3. ⬜ Request access to:
   - Google Calendar (or current scheduling system)
   - CRM/patient database (if exists)
   - Payment system (Wompi, Stripe, bank details)

**Day 3:**
1. ⬜ Document interview findings → `/docs/api-bird/staff-interview-notes.md`
2. ⬜ Validate valoración costs (pre-consulta, virtual, presencial)
3. ⬜ Confirm calendar availability patterns (days, hours, buffer times)
4. ⬜ Test photo quality analysis with 20 sample patient photos

**Day 4:**
1. ⬜ Update Eva agent configuration (fix `disableImageSupport`, etc.)
2. ⬜ Implement `process_media_surgery` Action
3. ⬜ Test with 10 real patient conversations (controlled rollout)
4. ⬜ Measure baselines (response time, photo quality, staff time)

**Week 2:**
1. ⬜ Launch Phase 1 MVP (24/7 instant response)
2. ⬜ Monitor metrics daily (Bird dashboard, staff feedback)
3. ⬜ Iterate based on real patient conversations
4. ⬜ Begin Phase 2 development (photo guidance, reminders)

---

## Questions for Dr. Durán Team Interview

**Critical Questions (90-min session):**

**Volume & Baseline Metrics:**
1. How many WhatsApp inquiries per day/week?
2. Current lead → valoración conversion rate?
3. Current valoración → surgery conversion rate?
4. Average no-show rate for valoraciones?

**Costs (Patient-Facing):**
5. Pre-consulta cost? ($ USD or COP)
6. Virtual valoración cost?
7. Presencial valoración cost?
8. Do costs apply toward surgery if patient proceeds?

**Scheduling & Systems:**
9. What calendar system? (Google Calendar, Calendly, manual?)
10. Average time to offer appointment slots (same day, 24hr, 48hr?)
11. Payment methods (bank transfer, Stripe, Wompi, cash)?
12. Payment timing (before booking or at confirmation)?

**Pain Points:**
13. What frustrates staff most about current WhatsApp workflow?
14. What % of photos are good quality on first submission?
15. What % of patients complete pre-op labs on time?
16. When do patients ghost (after quote? after valoración? random)?

**Other:**
17. Most common first questions from patients? (top 5)
18. Emergency contact number for post-op complications?
19. CRM or patient database currently used?
20. Financing options offered (Addi, installment plans)?

---

## Document Map

**Main Document (1,425 lines):**
- `/docs/api-bird/plastic-surgery-workflow-design.md`

**Sections:**
1. Overview (100 lines) - Patient journey map, stage breakdown
2. Stage Breakdown (800 lines) - 10 stages detailed, automation opportunities
3. Workflow Optimizations (150 lines) - ROI analysis, time savings
4. Human-Critical Touchpoints (100 lines) - What AI should NOT do
5. Procedure-Specific Insights (100 lines) - Top 5 procedures, photo requirements
6. Decision Trees (100 lines) - Handover scenarios, AI logic
7. Success Metrics (75 lines) - Baselines, targets, measurement

**Supporting Documents (To Be Created):**
- `/docs/api-bird/staff-interview-notes.md` (Day 2)
- `/docs/api-bird/photo-quality-test-results.md` (Day 3)
- `/docs/api-bird/eva-agent-configuration-v2.json` (Day 4)

---

## Approvals Needed Before Phase 1 Launch

**From Dr. Durán:**
- ✓ Valoración pricing (can share with patients via AI?)
- ✓ Emergency contact number (post-op alert scenarios)
- ✓ Financing options (OK for AI to mention Addi, installments?)
- ✓ Before/after photo usage consent (AI can request at Day 90?)

**From Team:**
- ✓ Coordinator: Handover protocol (when to transfer from AI?)
- ✓ Medical Assistant: Photo quality criteria (what's "usable"?)
- ✓ Reception: After-hours expectations (AI handles inquiries, staff follows up next day?)

**From Legal/Compliance:**
- ✓ Patient data privacy (Colombian Ley 1581/2012 compliance)
- ✓ Medical liability (AI disclaimers for non-medical advice)
- ✓ WhatsApp Business API terms (healthcare use case)

---

**Lines:** 300 | **Tokens:** ~1,500 | **Last Updated:** 2025-12-14
**Status:** Draft (awaiting staff interview + approvals)
