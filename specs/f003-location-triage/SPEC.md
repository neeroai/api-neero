# SPEC: F003 Location Triage

Version: 1.0 | Date: 2025-12-24 12:35 | Owner: Neero Team | Status: Draft

---

## Problem

28% of conversations (310/1,106) ask about location first, then abandon when no immediate response is provided. Leads outside Barranquilla/Bogotá coverage are not efficiently filtered or offered virtual alternatives.

---

## Objective

**Primary Goal:** Provide immediate location-based responses to reduce abandonment rate and qualify leads by geographic coverage.

**Success Metrics:**
- 100% of location inquiries receive immediate response (<5s)
- 28% of conversations (310/1,106) get location guidance
- Reduce abandonment rate for location questions from current baseline
- Virtual valoración conversion rate for outside-coverage leads tracked

---

## Scope

| In | Out |
|---|---|
| Barranquilla address response + valoración offer | Specific directions/maps |
| Bogotá address response + valoración offer | Office hours/availability |
| Other Colombia cities: virtual offer | Pricing information |
| Outside Colombia: coordinator escalation | Procedure-specific location requirements |
| Spanish and English queries | Multiple locations per conversation |
| Ambiguous city names, typos handling | Historical conversation analysis |

---

## Contracts

### Input

| Parameter | Type | Required | Notes |
|-----------|------|----------|-------|
| user_message | string | Y | User's raw text message |
| conversation_id | uuid | Y | Current conversation context |
| detected_location | string | N | AI-extracted location (city/country) |

### Output

| Field | Type | Condition | Notes |
|-------|------|-----------|-------|
| response_text | string | Always | Location-specific response |
| location_type | enum | Always | 'barranquilla' \| 'bogota' \| 'colombia_other' \| 'outside_colombia' |
| address | string | On Barranquilla/Bogotá | Physical office address |
| requires_escalation | boolean | Always | true if outside Colombia |
| virtual_offer | boolean | Always | true if colombia_other or outside_colombia |

---

## Business Rules

**Rule 1: Barranquilla Detection**
- IF user mentions "Barranquilla" OR "B/quilla" OR "BAQ"
- THEN provide: "Nuestra clínica en Barranquilla está ubicada en Cra 52 #82-110. ¿Te gustaría agendar una valoración presencial?"

**Rule 2: Bogotá Detection**
- IF user mentions "Bogotá" OR "Bogota" OR "BOG"
- THEN provide: "Tenemos consultorios en Bogotá. ¿Te gustaría agendar una valoración presencial?"

**Rule 3: Other Colombia Cities**
- IF user mentions Colombian city NOT in [Barranquilla, Bogotá]
- THEN provide: "Actualmente nuestras clínicas físicas están en Bogotá y Barranquilla. Sin embargo, ofrecemos valoraciones virtuales. ¿Te gustaría agendar una?"

**Rule 4: Outside Colombia**
- IF user mentions non-Colombian country OR international city
- THEN escalate to coordinator via createTicket(reason="international_inquiry")
- AND provide: "Veo que estás consultando desde [país]. Permíteme conectarte con un coordinador que te puede ayudar con opciones internacionales."

**Rule 5: Ambiguous Queries**
- IF query is "¿Dónde están?" OR "ubicación" without city mention
- THEN provide: "Tenemos clínicas en Barranquilla y Bogotá. ¿Desde qué ciudad nos escribes?"

---

## Edge Cases

| Scenario | Handling | Notes |
|----------|----------|-------|
| Typo: "Bogta", "Baranquilla" | Fuzzy matching with 80% similarity threshold | Common Spanish typos |
| English queries: "Where are you located?" | Detect language, respond in English | Bilingual support |
| Multiple cities mentioned | Prioritize first mentioned city | Rare case |
| Ambiguous names: "Santiago" (Chile vs Colombia) | Ask for clarification: "¿Te refieres a Santiago de Cali?" | Context-dependent |
| Location + pricing in same message | Handle location first, then escalate pricing | Sequential processing |
| Virtual consultation already mentioned | Skip location triage, continue flow | Conversation state check |

---

## Observability

**Logs:**
- info: Location detected with city/country extraction
- info: Response type selected (barranquilla/bogota/colombia_other/outside_colombia)
- warn: Ambiguous location requiring clarification
- error: Location detection failed (fallback to manual escalation)

**Metrics:**
- location_queries_total (counter by type: barranquilla/bogota/other/outside)
- location_triage_latency_ms (histogram)
- virtual_offer_acceptance_rate (gauge)
- escalation_rate_international (gauge)

**Traces:**
- span: detect_location_intent (latency target: <100ms)
- span: extract_city_country (latency target: <200ms)
- span: generate_response (latency target: <500ms)

---

## Definition of Done

- [ ] Code review approved
- [ ] All business rules tested (5 rules)
- [ ] All edge cases tested (6 scenarios)
- [ ] Observability implemented (logs + metrics)
- [ ] Performance validated (<1s total latency)
- [ ] 80%+ test coverage (unit + integration)
- [ ] Fuzzy matching tested with common typos
- [ ] Bilingual support validated (Spanish + English)
- [ ] Documentation updated (EVA prompt or tool description)
- [ ] Deployed to staging
- [ ] Smoke test passed with 10 test cases

---

**Related:** /Users/mercadeo/neero/api-neero/prd.md (Section 7.4) | **Dependencies:** EVA AI Employee, Bird Actions integration
