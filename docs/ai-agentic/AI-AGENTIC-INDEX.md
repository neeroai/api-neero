# AI Employee Documentation Index

> Navigation guide for docs/ai-agentic/ | Updated: 2025-12-14

---

## Documents by Purpose

| Document | Purpose | Audience | Lines | Status |
|----------|---------|----------|-------|--------|
| PRD.md | Product specification + requirements | Product, Engineering | 1,347 | Optimized |
| STATUS_TRACKER.md | Real-time implementation progress | Engineering, PM | 145 | Optimized |
| POLICY_GUARDRAILS.md | Clinical safety decision policy | Engineering, Legal | 38 | Complete |
| TOOLS_CONTRACTS.md | Tool specifications (API contracts) | Engineering | 61 | Complete |
| TEST_PLAN_GUARDRAILS_TRIAGE.md | Validation test matrix | QA, Engineering | 50 | Complete |
| RUNBOOK_PILOT.md | Operational runbook (pilot phase) | Operations, Engineering | 28 | Complete |
| VALIDATED_RECOMMENDATIONS.md | ChatGPT suggestions + validation | Product, Engineering | 555 | Needs optimization |
| CONVERSATION_INSIGHTS.md | WhatsApp conversation analysis | Product, UX | 473 | Needs optimization |

**Total:** 2,697 lines | **Optimized:** 1,530 lines (57%) | **Remaining:** 1,028 lines (38%) | **Complete:** 139 lines (5%)

---

## Cross-Reference Matrix

| Topic | Primary Doc | Supporting Docs | Source Code |
|-------|-------------|-----------------|-------------|
| System prompt design | PRD.md (Section 5) | - | `/lib/agent/prompts/eva-system.md` |
| Database schema | PRD.md (Section 6) | STATUS_TRACKER.md | `/lib/db/schema.ts` |
| Guardrails policy | POLICY_GUARDRAILS.md | PRD.md (Section 7), TEST_PLAN | `/lib/agent/guardrails.ts` |
| Tools implementation | TOOLS_CONTRACTS.md | PRD.md (Section 8), STATUS_TRACKER.md | `/lib/agent/tools/*.ts` |
| Conversation patterns | CONVERSATION_INSIGHTS.md | VALIDATED_RECOMMENDATIONS.md | - |
| Progress tracking | STATUS_TRACKER.md | PRD.md (timeline) | - |
| Testing strategy | TEST_PLAN_GUARDRAILS_TRIAGE.md | STATUS_TRACKER.md | - |
| Operations runbook | RUNBOOK_PILOT.md | STATUS_TRACKER.md | - |

---

## Reading Sequence by Role

### Product Manager
1. **PRD.md** - Complete product vision, requirements, and conversational design
2. **VALIDATED_RECOMMENDATIONS.md** - Roadmap priorities and ChatGPT validation
3. **CONVERSATION_INSIGHTS.md** - Real user behavior patterns from 15 conversations
4. **STATUS_TRACKER.md** - Current progress and next milestones

### Engineer (Implementation)
1. **PRD.md** - Technical requirements and architecture
2. **TOOLS_CONTRACTS.md** - Tool specifications and API contracts
3. **POLICY_GUARDRAILS.md** - Safety constraints and compliance rules
4. **STATUS_TRACKER.md** - What's built, what's pending, environment setup

### Engineer (Testing)
1. **TEST_PLAN_GUARDRAILS_TRIAGE.md** - Test matrix with 8 categories (A-H)
2. **POLICY_GUARDRAILS.md** - Expected guardrails behavior
3. **CONVERSATION_INSIGHTS.md** - Real-world test scenarios
4. **PRD.md (Section 11)** - Edge cases and error handling

### Operations
1. **RUNBOOK_PILOT.md** - Incident playbooks and monitoring alerts
2. **POLICY_GUARDRAILS.md** - Handover rules and escalation triggers
3. **STATUS_TRACKER.md** - Environment configuration and deployment status
4. **PRD.md (Section 10)** - Compliance requirements (Ley 1581/2012)

---

## Quick Links to Source Files

| Documentation | Source Code | Lines |
|---------------|-------------|-------|
| System prompt (PRD.md Section 5) | `/lib/agent/prompts/eva-system.md` | 240 |
| Database schema (PRD.md Section 6) | `/lib/db/schema.ts` | 150 |
| Tools specs (TOOLS_CONTRACTS.md) | `/lib/agent/tools/media.ts` | 180 |
| | `/lib/agent/tools/crm.ts` | 45 |
| | `/lib/agent/tools/whatsapp.ts` | 65 |
| | `/lib/agent/tools/handover.ts` | 50 |
| Guardrails (POLICY_GUARDRAILS.md) | `/lib/agent/guardrails.ts` | 85 |
| Consent management | `/lib/agent/consent.ts` | 60 |
| Conversation context | `/lib/agent/conversation.ts` | 120 |
| Test cases (TEST_PLAN) | `/tests/guardrails/*.test.ts` | TBD |

---

## Optimization Summary

**Phase 1 Complete (2025-12-14):**
- PRD.md: 1,710 → 1,347 lines (21% reduction)
- STATUS_TRACKER.md: 548 → 145 lines (74% reduction)
- **Total:** 3,463 → 2,697 lines (22% overall reduction)

**Optimization Techniques Applied:**
- Removed code duplication (system prompt, schema) → Reference source files
- Converted narrative to tables (phase progress, environment config, timeline)
- Active voice where applicable
- Removed redundant architecture descriptions

**Remaining Optimization Opportunities:**
- VALIDATED_RECOMMENDATIONS.md: 555 lines → ~450 target (remove duplicates, table format)
- CONVERSATION_INSIGHTS.md: 473 lines → ~200 target (compress to table, appendix for JSON)

---

## Document Standards Applied

| Standard | Applied | Notes |
|----------|---------|-------|
| NO EMOJIS | Partial | Found in: STATUS_TRACKER.md (✅), POLICY_GUARDRAILS.md (needs replacement) |
| Active voice | Yes | Converted in PRD.md summaries, STATUS_TRACKER.md |
| Tables over prose | Yes | STATUS_TRACKER.md is 100% tables |
| Code → References | Yes | PRD.md now references source files instead of embedding |
| Hard limits | N/A | Not enforced retroactively on existing docs |

---

## Version History

| Version | Date | Changes | Lines Changed |
|---------|------|---------|---------------|
| 1.0 | 2025-12-14 | Initial index creation | +110 |
| 1.0 | 2025-12-14 | PRD.md optimization (phase 1) | -363 |
| 1.0 | 2025-12-14 | STATUS_TRACKER.md replacement | -403 |

---

**Lines:** 110 | **Purpose:** Navigation + optimization tracking | **Optimized for LLM**
