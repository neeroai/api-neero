# Feature Decisions - AI Employee Eva

Version: 1.0 | Date: 2025-12-14 10:35 | Owner: Javier Polo | Status: Active

---

## Data Source

**Conversations:** 1,106 | **Messages:** 10,764 | **Period:** 2025-11-12 to 2025-12-14
**Source:** `/conversations/whatsapp-conversations-2025-12-14-reporte.md`

---

## Decision Summary

| Category | IMPLEMENT | DEFER | REJECT | Total |
|----------|-----------|-------|--------|-------|
| Core MVP (v1.0) | 6 | 0 | 0 | 6 |
| Proactive (v1.1) | 3 | 1 | 0 | 4 |
| Advanced (v1.2) | 0 | 2 | 1 | 3 |
| **Total** | **9** | **3** | **1** | **13** |

---

## Feature Decision Matrix

### Core MVP (v1.0) - IMPLEMENT NOW

| Feature | Problem (Conversation Data) | Solution | Decision | Rationale |
|---------|----------------------------|----------|----------|-----------|
| **Data collection (1 message)** | 60% provide all 4 fields in 1 message when prompted with bullets | Prompt: bullet list format | IMPLEMENT | Already working (validated in production) |
| **Price inquiry handover** | 50% ask "cuánto cuesta" within 2-3 messages | Immediate handover to specialist | IMPLEMENT | Already working (validated in 6 of 15 sample convos) |
| **Location triage** | 28% ask city/location before treatment | Bot responds with sede addresses (BAQ/BOG) | IMPLEMENT | Already working (no escalation needed) |
| **Photo quality analysis** | Media processing disconnected (gap identified) | analyzePhoto tool with quality score + consent flow | IMPLEMENT | Phase 3 complete, needs end-to-end validation |
| **Audio transcription** | Voice notes from patients (Spanish primary) | Groq Whisper v3 + OpenAI fallback | IMPLEMENT | Phase 2 complete, tested locally |
| **Guardrails validation** | Medical advice/diagnosis prevention (compliance) | Pre-send keyword detection + verifier layer | IMPLEMENT | Phase 2 complete, 0 violations in testing |

**Status:** 6 features IMPLEMENTED in phases 1-4 (80% complete)

---

### Proactive Engagement (v1.1) - IMPLEMENT NEXT

| Feature | Problem (Conversation Data) | Solution | Decision | Rationale |
|---------|----------------------------|----------|----------|-----------|
| **Proactive closure CTA** | 95% conversations end with patient (no bot closure) | Add final message: "Quedo atento" + reactivation instructions | IMPLEMENT v1.1 | High impact, simple implementation (2-3h) |
| **Price/value explanation** | 50% ask price, 47% never share data after | Pre-handover message explaining why data needed + value prop | IMPLEMENT v1.1 | Reduces friction, improves lead quality (4-6h) |
| **Dynamic location prompts** | 28% ask location, abandons if outside BAQ/BOG | Early question: "¿Desde qué ciudad nos escribes?" + virtual option | IMPLEMENT v1.1 | Reduces back-and-forth (3-4h) |
| **Follow-up reminders (async)** | 26% single-message conversations, 290 cold leads | Queue for email/SMS remarketing (NOT live WhatsApp) | DEFER v1.2 | Requires external tool integration (12h+) |

**Status:** 3 IMPLEMENT (quick wins), 1 DEFER (complex)

---

### Advanced Features (v1.2) - DEFER OR REJECT

| Feature | Problem (Conversation Data) | Solution | Decision | Rationale |
|---------|----------------------------|----------|----------|-----------|
| **Appointment scheduling** | Coordinators handle manually after handover | Google Calendar integration + booking tool | DEFER v1.2 | Requires calendar API, double-booking logic (16-20h). Not critical for MVP. |
| **Payment links** | Payment confirmation handled offline | Stripe/Wompi integration + webhook | DEFER v1.2 | Requires payment provider setup (12-16h). Not blocking conversions. |
| **Reputation management** | Post-op review requests | Day-90 check-in + conditional review ask (CSAT≥4) | REJECT | Too far downstream, low 2-person team ROI. Manual process works. |

**Status:** 2 DEFER (valuable but not urgent), 1 REJECT (low ROI)

---

## Implementation Priority

### NOW (v1.0 MVP) - Complete Phase 5-6

| Priority | Task | Effort | Blocker | Target |
|----------|------|--------|---------|--------|
| P0 | Complete Phase 5: Outbound endpoint + cron | 4-6h | None | 2025-12-16 |
| P0 | Complete Phase 6: Production deployment + monitoring | 2-3h | Phase 5 | 2025-12-18 |
| P0 | End-to-end integration testing (Bird sandbox) | 3-4h | Phase 5 | 2025-12-18 |

---

### NEXT (v1.1) - Proactive Engagement

| Priority | Task | Effort | Blocker | Target |
|----------|------|--------|---------|--------|
| P1 | Proactive closure CTA (prompt update) | 2-3h | None | 2025-12-20 |
| P1 | Price/value explanation (prompt + handover message) | 4-6h | None | 2025-12-21 |
| P1 | Dynamic location triage (prompt + conditional responses) | 3-4h | None | 2025-12-22 |
| P2 | Weekly audit script (compliance monitoring) | 4-6h | Database setup | 2025-12-23 |

---

### FUTURE (v1.2+) - Advanced Features

| Priority | Task | Effort | Blocker | Target |
|----------|------|--------|---------|--------|
| P3 | Appointment scheduling (Google Calendar API) | 16-20h | Requires API approval | 2026-Q1 |
| P3 | Payment links (Stripe/Wompi integration) | 12-16h | Requires payment provider | 2026-Q1 |

---

## Rejected Features - Rationale

### 1. Reputation Management (Post-op Reviews)

**Reason:** Fails ClaudeCode&OnlyMe filter
- Question 3: "¿2 personas lo mantienen?" → NO (requires CRM integration, review platform APIs, email templates, multi-week follow-up)
- Question 4: "¿Vale si NUNCA crecemos?" → NO (manual review requests work fine for current scale)

**Alternative:** Manual post-op follow-up by coordinators (current process works)

---

### 2. Multi-Language Support (English, Portuguese)

**Reason:** Not validated by conversation data
- 0% of 1,106 conversations in non-Spanish language
- Would add complexity (prompt translation, language detection)
- Fails Question 1: "¿Resuelve problema REAL HOY?" → NO

**Alternative:** If international demand grows, revisit in v2.0

---

### 3. Cold Lead Re-engagement (Live WhatsApp)

**Reason:** WhatsApp 24h window constraint + template approval overhead
- 26% single-message convos (290 leads)
- Requires 5+ WhatsApp templates (utility category approval ~2-4 weeks)
- Better handled via email/SMS (outside WhatsApp)

**Alternative:** Queue cold leads for email remarketing (external tool, v1.2)

---

## Key Metrics to Track (Post-Launch)

| Metric | Baseline (Report) | v1.0 Target | v1.1 Target | Measurement |
|--------|-------------------|-------------|-------------|-------------|
| % escalate to human | 47% | 40% | 35% | handoverReason logs |
| % ask price without data | 47% | 35% | 25% | Pricing inquiry → data collection rate |
| % share contact info | 19% | 30% | 40% | CRM lead completeness |
| % conversations with closure | 5% | 50% | 70% | Bot sends final message |
| No-show rate | (unknown) | Baseline | -20% | Appointment status (v1.1+) |

---

## Validation Against ClaudeCode&OnlyMe Filter

### All IMPLEMENT Decisions Pass 4-Question Test

| Feature | Q1: Real Problem? | Q2: Simplest? | Q3: 2-Person? | Q4: Never Scale? | Decision |
|---------|-------------------|---------------|---------------|------------------|----------|
| Data collection | YES (60% pattern) | YES (prompt) | YES | YES | IMPLEMENT |
| Price handover | YES (50% ask) | YES (handover) | YES | YES | IMPLEMENT |
| Location triage | YES (28% ask) | YES (FAQs) | YES | YES | IMPLEMENT |
| Photo analysis | YES (gap) | YES (reuse /lib/ai/) | YES | YES | IMPLEMENT |
| Audio transcription | YES (voice notes) | YES (Groq+fallback) | YES | YES | IMPLEMENT |
| Guardrails | YES (compliance) | YES (keywords) | YES | YES | IMPLEMENT |
| Closure CTA | YES (95% no closure) | YES (prompt) | YES | YES | IMPLEMENT v1.1 |
| Price/value explain | YES (50% friction) | YES (prompt) | YES | YES | IMPLEMENT v1.1 |
| Location prompts | YES (28% friction) | YES (prompt) | YES | YES | IMPLEMENT v1.1 |

### All REJECT Decisions Fail at Least 1 Question

| Feature | Q1: Real Problem? | Q2: Simplest? | Q3: 2-Person? | Q4: Never Scale? | Decision |
|---------|-------------------|---------------|---------------|------------------|----------|
| Reputation mgmt | NO (0% demand) | NO (complex) | NO (integrations) | NO (manual OK) | REJECT |
| Multi-language | NO (0% demand) | NO (translation) | YES | NO (overkill) | REJECT |

---

## Next Actions (Ordered)

1. Complete Phase 5: Outbound endpoint + Vercel Cron Jobs (4-6h)
2. Complete Phase 6: Production deployment + Sentry monitoring (2-3h)
3. Integration testing: Bird sandbox end-to-end (3-4h)
4. Update system prompt: Add proactive closure CTA (2-3h)
5. Update system prompt: Price/value explanation (4-6h)
6. Update system prompt: Dynamic location triage (3-4h)

**Total Remaining Work (MVP → v1.1):** ~22-32 hours

---

**Lines:** 148 / 150 target | **Format:** LLM-optimized (tables only) | **Token Budget:** ~900 tokens
