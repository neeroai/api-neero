# TASKS - F003 Location Triage

Version: 1.0 | Date: 2025-12-24 12:45 | Owner: Neero Team | Status: Active

---

## Reference
- SPEC: /Users/mercadeo/neero/api-neero/specs/f003-location-triage/SPEC.md
- PLAN: /Users/mercadeo/neero/api-neero/specs/f003-location-triage/PLAN.md
- Feature List: /Users/mercadeo/neero/api-neero/feature_list.json (F003)

---

## DOING (Current)
| ID | Task | DoD | Est |
|----|------|-----|-----|
| - | No active tasks yet | - | - |

---

## TODO (Priority Order)
| ID | Task | DoD | Est |
|----|------|-----|-----|
| T001 | Define location detection Zod schemas | LocationTriageSchema exported from lib/agent/types.ts, all types validated | 0.5h |
| T002 | Create location detection utility functions | detectLocationIntent(), extractLocation(), classifyLocation() implemented in lib/agent/location.ts | 2h |
| T003 | Implement fuzzy matching for typos | 80% similarity threshold, handles common Spanish typos (Bogta, Baranquilla) | 1h |
| T004 | Add bilingual support (ES/EN) | English queries detected and handled, responses in user's language | 1h |
| T005 | Create handleLocationInquiry tool | Tool definition in lib/agent/tools/location.ts, returns LocationTriageResult | 1.5h |
| T006 | Integrate createTicket for outside_colombia | Escalation to coordinator for international queries working | 0.5h |
| T007 | Register tool with EVA | Tool added to EVA's registry in lib/agent/conversation.ts, description clear | 0.5h |
| T008 | Write unit tests for detection logic | tests/lib/agent/location.test.ts, 5 business rules + 6 edge cases tested | 2h |
| T009 | Write unit tests for tool | tests/lib/agent/tools/location.test.ts, mocked Bird API, ≥80% coverage | 1.5h |
| T010 | Create E2E integration tests | tests/integration/location-triage.test.ts, 10 test cases, all passing | 2h |
| T011 | Add logging and metrics | info/warn/error logs, location_queries_total counter, latency histogram | 1h |
| T012 | Add traces for observability | detect_location_intent, extract_city_country, generate_response spans | 0.5h |
| T013 | Manual testing with real conversations | Test with 50 samples from 310 location queries, validate accuracy | 1h |
| T014 | Update documentation | EVA tool description, SPEC.md finalized, PLAN.md updated | 0.5h |
| T015 | Deploy to staging | Vercel staging deployment, smoke test 10 scenarios | 0.5h |

**Total Estimated Time:** 16 hours (split across 2 days)

---

## BLOCKED
| ID | Task | Blocker | Assigned |
|----|------|---------|----------|
| - | No blocked tasks | - | - |

---

## DONE (Last 5)
| ID | Task | Closed | Commit |
|----|------|--------|--------|
| - | No completed tasks yet | - | - |

---

## Notes

**Task Breakdown Strategy:**
- M1 (Core Logic): T001-T004 (~4.5 hours)
- M2 (Tool Integration): T005-T007 (~2.5 hours)
- M3 (Testing & Validation): T008-T015 (~9 hours)

**Dependencies:**
- T002 depends on T001 (schemas must exist first)
- T005 depends on T002-T004 (detection logic must be complete)
- T006 depends on T005 (tool must exist to integrate escalation)
- T007 depends on T005 (tool must exist to register)
- T008-T010 depend on T002-T007 (implementation complete)
- T011-T012 depend on T005 (tool must exist to add observability)

**Priority Notes:**
- T001-T007: Critical path (core implementation)
- T008-T010: Quality gates (80%+ coverage requirement)
- T011-T012: Observability (production readiness)
- T013-T015: Validation & deployment

**Sync to Root todo.md:**
- Copy DOING tasks to /Users/mercadeo/neero/api-neero/todo.md DOING section
- Update DONE tasks in root when completing here

---

**Last updated:** 2025-12-24 12:45 | Maintained by: Neero Team
