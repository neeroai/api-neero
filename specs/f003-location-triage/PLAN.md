# SDD Implementation Plan: F003 Location Triage

Version: 1.0 | Date: 2025-12-24 12:40 | Owner: Neero Team | Status: Draft

---

## Reference

**SPEC:** /Users/mercadeo/neero/api-neero/specs/f003-location-triage/SPEC.md
**ADR:** TBD (optional - depends on implementation approach)
**PRD:** /Users/mercadeo/neero/api-neero/prd.md (Section 7.4)

---

## Stack Validated

**Framework:** Next.js 16.0.10
**Language:** TypeScript 5.9.3 (strict mode)
**Runtime:** Vercel Edge Functions
**AI:** Vercel AI SDK 5.0 (EVA AI Employee)
**Integration:** Bird AI Employees Actions

**Validation Checklist:**
- [x] Stack matches docs-global/stack/nextjs/
- [x] NO INVENTAR protocol applied (all dependencies verified)
- [x] ClaudeCode&OnlyMe filter passed (2-person team, real today)
- [x] Dependencies: Bird Actions integration (existing)
- [x] Known limitations: Fuzzy matching requires testing with real typos

**Sources:**
- Next.js 16: /Users/mercadeo/neero/docs-global/stack/nextjs/
- Vercel Edge: /Users/mercadeo/neero/docs-global/platforms/vercel/
- Bird Actions: /Users/mercadeo/neero/docs-global/platforms/bird/

---

## Implementation Steps

### S001: Define Location Detection Schema
**Deliverable:** Zod schema for location detection types and responses
**Dependencies:** None
**Acceptance:**
- LocationTriage type with barranquilla/bogota/colombia_other/outside_colombia
- Schema validates all required fields per SPEC contracts
- Exported from lib/agent/types.ts

**Files:**
- lib/agent/types.ts (add LocationTriageSchema, LocationTriageResult)

### S002: Create Location Detection Utility
**Deliverable:** Location extraction and classification logic
**Dependencies:** S001 (types)
**Acceptance:**
- detectLocationIntent(message): boolean - Returns true if location query
- extractLocation(message): {city, country, confidence} - NLP extraction
- classifyLocation(city, country): LocationType - Maps to barranquilla/bogota/other/outside
- Handles fuzzy matching for typos (80% similarity threshold)
- Bilingual support (Spanish/English)

**Files:**
- lib/agent/location.ts (new)
- lib/utils/fuzzy-match.ts (new - optional, if needed)

### S003: Implement Location Triage Tool
**Deliverable:** Tool definition for EVA to call when location query detected
**Dependencies:** S002 (detection logic)
**Acceptance:**
- Tool name: handleLocationInquiry
- Input: conversationId (uuid)
- Output: LocationTriageResult (address, response_text, requires_escalation, etc.)
- Integrates with createTicket for outside_colombia escalation
- Logs location_type to message_logs metadata

**Files:**
- lib/agent/tools/location.ts (new)
- lib/agent/tools/index.ts (export new tool)

**Implementation Options (ADR Decision Needed):**
- **Option A: Prompt-based (15 min)** - Add location instructions to EVA prompt, no code tool
- **Option B: Code-based tool (2h)** - Full tool implementation with handleLocationInquiry
- **Recommendation:** Option B for better observability, testing, and control

### S004: Update EVA Tool Registry
**Deliverable:** Register handleLocationInquiry tool with EVA
**Dependencies:** S003 (tool implementation)
**Acceptance:**
- Tool added to EVA's available tools array
- Tool description clear for AI to know when to invoke
- Priority handling: Location before pricing (if both mentioned)

**Files:**
- lib/agent/conversation.ts (add tool to registry)
- app/api/agent/inbound/route.ts (verify tool execution)

### S005: Write Unit Tests
**Deliverable:** Comprehensive test suite with 80%+ coverage
**Dependencies:** S002, S003 (implementation complete)
**Acceptance:**
- Test all 5 business rules from SPEC
- Test all 6 edge cases from SPEC
- Mock Bird API calls (no real API requests)
- Coverage: statements, branches, functions, lines ≥80%
- All tests passing in CI

**Files:**
- tests/lib/agent/location.test.ts (unit tests for detection logic)
- tests/lib/agent/tools/location.test.ts (unit tests for tool)

### S006: Create Integration Tests
**Deliverable:** E2E tests for full location triage flow
**Dependencies:** S004 (EVA integration complete)
**Acceptance:**
- 10 test cases covering all location types
- Test with typos, English queries, ambiguous names
- Mock Bird Actions requests
- Verify correct escalation for outside_colombia
- All tests passing in CI

**Files:**
- tests/integration/location-triage.test.ts (E2E tests)

### S007: Update Observability
**Deliverable:** Logging, metrics, and traces per SPEC
**Dependencies:** S003 (tool implementation)
**Acceptance:**
- Logs: info (detected, response_type), warn (ambiguous), error (failed)
- Metrics: location_queries_total, location_triage_latency_ms, virtual_offer_acceptance_rate
- Traces: detect_location_intent, extract_city_country, generate_response spans
- messageLogs table captures all location tool calls

**Files:**
- lib/agent/tools/location.ts (add logging/metrics)
- lib/db/schema.ts (verify messageLogs supports location metadata)

---

## Milestones

**M1 - Core Logic:** [S001-S002] | Target: Day 1 (2 hours)
- Location detection schema and utility functions complete
- Fuzzy matching tested with common typos

**M2 - Tool Integration:** [S003-S004] | Target: Day 1 (1.5 hours)
- Tool implemented and registered with EVA
- Ready for manual testing

**M3 - Testing & Validation:** [S005-S007] | Target: Day 2 (3 hours)
- All tests written and passing
- 80%+ coverage achieved
- Observability implemented

**Total Estimated Time:** 6.5 hours

---

## Risk Mitigation

| Risk | Mitigation | Owner |
|------|-----------|-------|
| **Fuzzy matching generates false positives** | Use 80% similarity threshold + manual test with 50 real conversation samples | Neero Team |
| **AI doesn't invoke tool reliably** | Clear tool description + priority handling in prompt + fallback to manual escalation | Neero Team |
| **English queries not detected** | Bilingual keyword list + test with English queries from real conversations | Neero Team |
| **Performance >1s latency** | Optimize fuzzy matching with early exit + cache common city names | Neero Team |
| **Conversation state bloat** | Minimal metadata in messageLogs (location_type only, no full message duplication) | Neero Team |

---

## Notes

**Implementation Approach Decision (ADR Needed):**
- **Option A: Prompt-based** - Fast (15 min) but less testable, no observability
- **Option B: Code-based tool** - Slower (6.5 hours) but testable, observable, maintainable
- **Recommendation:** Option B for SDD methodology demonstration and long-term maintainability

**Critical Context:**
- F003 is BLOCKER affecting 28% of conversations (310/1,106)
- Must complete before v1.0 MVP production deployment
- No architectural changes to database schema required
- Leverages existing createTicket tool for escalation
- First feature to use full SDD lifecycle in api-neero

**Previous ADRs:** None (first feature using SDD methodology)

**Assumptions:**
- EVA prompt has capacity for 1 additional tool (verify token budget)
- Bird Actions API stable (no breaking changes expected)
- messageLogs.metadata jsonb field can store location_type

---

**Last updated:** 2025-12-24 12:40 | Maintained by: Neero Team
