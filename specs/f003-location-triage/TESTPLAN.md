# Test Plan: F003 Location Triage

Version: 1.0 | Date: 2025-12-24 12:50 | Owner: Neero Team | Status: Draft

---

## Reference

**SPEC Version:** 1.0
**Feature:** F003 Location Triage
**Scope:** Unit + Integration (no E2E - Bird Actions integration)
**Coverage Target:** 80%+ critical paths (statements, branches, functions, lines)

---

## Test Strategy

**Philosophy:** 80% coverage on location detection logic and tool execution. Unit tests verify business rules and edge cases. Integration tests verify EVA tool invocation and Bird API interactions.

**Approach:**
- Unit: Test detection logic, fuzzy matching, classification in isolation (Vitest)
- Integration: Test full tool execution with mocked Bird API calls (Vitest + Edge Runtime VM)
- Manual: Test with 50 real conversation samples from 310 location queries

**Constraints:**
- Edge Runtime VM required (no Node.js APIs)
- Mock Bird Actions requests (no real API calls in tests)
- Spanish primary, English secondary language support

---

## Unit Tests

| Module | Test Cases | Tool | Status |
|--------|-----------|------|--------|
| lib/agent/location.ts::detectLocationIntent | 10 cases: "¿Dónde están?", "ubicación", "Where are you?", non-location queries | Vitest | TODO |
| lib/agent/location.ts::extractLocation | 8 cases: Barranquilla, Bogotá, Medellín, international cities, ambiguous, typos | Vitest | TODO |
| lib/agent/location.ts::classifyLocation | 5 cases: barranquilla, bogota, colombia_other, outside_colombia, null handling | Vitest | TODO |
| lib/utils/fuzzy-match.ts | 6 cases: 80% threshold, common typos (Bogta, Baranquilla), exact matches | Vitest | TODO |
| lib/agent/tools/location.ts::handleLocationInquiry | 12 cases: All 5 business rules + escalation + logging | Vitest | TODO |

**Total Unit Test Cases:** 41

---

## Integration Tests

| Component | Test Cases | Tool | Status |
|-----------|-----------|------|--------|
| EVA Tool Invocation | Location query → handleLocationInquiry called, correct response returned | Vitest + Edge Runtime VM | TODO |
| createTicket Integration | outside_colombia → createTicket(reason="international_inquiry") executed | Vitest + Mocked Bird API | TODO |
| messageLogs Metadata | location_type saved to messageLogs.metadata after tool execution | Vitest + Mocked DB | TODO |
| Bilingual Support | English query → English response, Spanish query → Spanish response | Vitest | TODO |
| Error Handling | Detection failure → Fallback to manual escalation | Vitest | TODO |

**Total Integration Test Cases:** 5

---

## Business Rules Coverage (from SPEC.md)

| Rule | Test Cases | Coverage Target |
|------|-----------|-----------------|
| **Rule 1: Barranquilla** | "Barranquilla", "B/quilla", "BAQ" → Address provided | 100% |
| **Rule 2: Bogotá** | "Bogotá", "Bogota", "BOG" → Address offered | 100% |
| **Rule 3: Other Colombia** | "Medellín", "Cali", "Cartagena" → Virtual offer | 100% |
| **Rule 4: Outside Colombia** | "Miami", "Madrid", "Buenos Aires" → Escalation | 100% |
| **Rule 5: Ambiguous** | "¿Dónde están?" → Ask clarification | 100% |

**Target:** All 5 business rules tested with 100% coverage

---

## Edge Cases Coverage (from SPEC.md)

| Scenario | Test Cases | Expected Outcome |
|----------|-----------|------------------|
| **Typo Handling** | "Bogta", "Baranquilla", "Bogotha" | Fuzzy match with 80% similarity |
| **English Queries** | "Where are you located?", "Address?" | Detect language, respond in English |
| **Multiple Cities** | "Barranquilla y Bogotá" | Prioritize first mentioned (Barranquilla) |
| **Ambiguous Names** | "Santiago" (Chile vs Colombia) | Ask clarification: "¿Santiago de Cali?" |
| **Location + Pricing** | "¿Cuánto cuesta en Bogotá?" | Handle location first, then escalate pricing |
| **Already Virtual** | Conversation state shows virtual_consultation=true | Skip location triage |

**Target:** All 6 edge cases tested

---

## Quality Gates CI

| Gate | Tool | Command | Target | Status |
|------|------|---------|--------|--------|
| Format | Biome | `pnpm run format --check` | 100% | TODO |
| Lint | Biome | `pnpm run lint` | 0 errors | TODO |
| Types | tsc | `pnpm run typecheck` | 0 errors | TODO |
| Unit | Vitest | `pnpm run test` | 80%+ | TODO |
| Build | Next.js | `pnpm run build` | Exit 0 | TODO |

**Enforcement:** All gates must pass before merge to main

---

## Performance Testing

| Metric | Target | Test Method | Status |
|--------|--------|-------------|--------|
| detectLocationIntent latency | <100ms | Benchmark with 100 iterations | TODO |
| extractLocation latency | <200ms | Benchmark with 100 iterations | TODO |
| handleLocationInquiry total | <1s | Integration test measurement | TODO |
| Fuzzy matching latency | <50ms | Benchmark with 50 typo samples | TODO |

---

## Manual Testing Checklist

**Sample Dataset:** 50 conversations from 310 location queries (prd.md analysis)

- [ ] Test all 5 business rules with real conversation samples
- [ ] Test all 6 edge cases with real conversation samples
- [ ] Validate fuzzy matching with 20+ typo examples
- [ ] Test bilingual support with 10 English queries
- [ ] Verify escalation flow for international queries
- [ ] Check messageLogs.metadata saves location_type
- [ ] Confirm no false positives (non-location queries)
- [ ] Verify observability: logs, metrics, traces appear

**Acceptance:**
- 95%+ accuracy on 50 sample conversations
- Zero false positives (non-location queries triggering tool)
- All edge cases handled correctly

---

## Test Coverage Breakdown

**Files to Cover:**
- lib/agent/location.ts (NEW - 100% target)
- lib/agent/tools/location.ts (NEW - 100% target)
- lib/utils/fuzzy-match.ts (NEW - 100% target)
- lib/agent/conversation.ts (Modified - tool registration only)

**Coverage Target by File:**
- Core logic (location.ts, fuzzy-match.ts): 100% coverage
- Tool implementation (tools/location.ts): 100% coverage
- Integration points (conversation.ts): 80% coverage (only test new code)

**Overall:** 80%+ coverage (statements, branches, functions, lines)

---

## Sign-off

**QA Lead:** Neero Team | **Date:** TBD | **Status:** [ ] Ready | [ ] Blocked

**Notes:**
- No Playwright E2E tests (Bird Actions integration, not browser-based)
- Edge Runtime VM required for all tests (no Node.js mocking)
- Manual testing critical for validating fuzzy matching accuracy
- 50 real conversation samples ensure production readiness

---

**Token-efficient format:** 108 lines | Comprehensive coverage | Actionable targets
