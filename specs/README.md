# SDD Methodology Guide: api-neero

Version: 1.0 | Date: 2025-12-24 12:55 | Status: Active

---

## Overview

This directory contains feature specifications following Spec-Driven Development (SDD) methodology. SDD ensures features are specified, validated, and planned before implementation to reduce rework, maintain quality, and provide session continuity for 2-person teams.

**Reference:** `/Users/mercadeo/neero/docs-global/workflows/sdd-methodology.md`

---

## When to Use SDD

**Use SDD for:**
- Features touching 3+ files
- API integrations (Bird, AI models, external services)
- Database schema changes
- Authentication or security features
- Performance-critical paths (<9s Edge Function constraint)
- Features with unclear requirements
- Long-term features (6+ months maintenance)
- Client-deliverable features

**Skip SDD for:**
- Single file bug fixes (<50 lines)
- UI tweaks (styling, copy changes)
- Documentation-only changes
- Refactoring with no behavior change
- Hotfixes (create retroactive SPEC after)
- Prototypes or experiments
- Changes merging in <1 hour

**Rule of Thumb:** "Can I explain this in 3 months?" YES = SDD | NO = Skip

---

## 8-Step Feature Lifecycle

| Step | Deliverable | Gate | Location |
|------|------------|------|----------|
| 1. SPEC | SPEC.md | Problem + Contracts clear | specs/<feature-slug>/SPEC.md |
| 2. PLAN | PLAN.md | Stack validated, steps defined | specs/<feature-slug>/PLAN.md |
| 3. TASKS | TASKS.md | Granular tasks in todo.md | specs/<feature-slug>/TASKS.md |
| 4. ADR | ADR.md (optional) | 4/4 YES (ClaudeCode&OnlyMe) | specs/<feature-slug>/ADR.md |
| 5. TESTPLAN | TESTPLAN.md | >80% coverage critical paths | specs/<feature-slug>/TESTPLAN.md |
| 6. IMPLEMENT | Code + Tests | All gates pass | Various files |
| 7. REVIEW | PR approved | CI green, manual QA | GitHub PR |
| 8. SHIP | Deployed + verified | Smoke test pass | Production |

**Gates:**
- 1→2: SPEC approved by team
- 4: ADR requires 4/4 YES on ClaudeCode&OnlyMe questions (if applicable)
- 5→6: TESTPLAN approved, coverage >80% planned
- 6→7: All quality gates passing (format, lint, types, tests, build)
- 7→8: Smoke test passed on staging

---

## Directory Structure

```
specs/
├── README.md (this file)
├── f003-location-triage/
│   ├── SPEC.md           # Problem, contracts, rules, DoD
│   ├── PLAN.md           # Stack validation, implementation steps
│   ├── TASKS.md          # Granular tasks (TODO/DOING/DONE)
│   ├── TESTPLAN.md       # Test strategy, coverage targets
│   └── ADR.md            # Architecture decisions (optional)
└── _archive/
    └── <completed-features>/  # Moved here after 3+ months stable
```

**Naming Convention:** `<feature-id>-<slug>` (e.g., `f003-location-triage`)

**Feature IDs:** Track in `/feature_list.json` (Anthropic format)

---

## Template Usage

### 1. Create Feature Directory

```bash
mkdir -p specs/<feature-slug>
```

### 2. Copy Templates

```bash
cp /Users/mercadeo/neero/docs-global/templates/sdd/SPEC.md specs/<feature-slug>/
cp /Users/mercadeo/neero/docs-global/templates/sdd/PLAN.md specs/<feature-slug>/
cp /Users/mercadeo/neero/docs-global/templates/sdd/TASKS.md specs/<feature-slug>/
cp /Users/mercadeo/neero/docs-global/templates/sdd/TESTPLAN.md specs/<feature-slug>/
# Optional: cp docs-global/templates/sdd/ADR.md specs/<feature-slug>/
```

### 3. Customize Each File

**SPEC.md:**
- Problem: 1-2 sentences (data-driven if possible)
- Objective: Measurable outcome + success metrics
- Scope: In/Out table (what's included, what's not)
- Contracts: Input/Output tables (API contract)
- Business Rules: Condition → Action format
- Edge Cases: Scenario | Handling | Notes
- Observability: Logs, metrics, traces
- DoD: Checklist with 80%+ test coverage requirement

**PLAN.md:**
- Reference: Links to SPEC, PRD, ADR
- Stack Validated: NO INVENTAR checklist (verify docs-global/)
- Implementation Steps: S001-S007 (5-15 steps)
- Milestones: Group steps into 2-4 milestones
- Risk Mitigation: Risks + how to prevent/handle

**TASKS.md:**
- Break steps into 1-4hr tasks
- TODO: Priority order
- DOING: Current work (max 1 task at a time)
- DONE: Last 5 completed
- Sync with root /todo.md

**TESTPLAN.md:**
- Test Strategy: Unit, Integration, E2E (if applicable)
- Coverage Target: 80%+ (statements, branches, functions, lines)
- Business Rules: Test all rules from SPEC.md
- Edge Cases: Test all edge cases from SPEC.md
- Quality Gates: Format, Lint, Types, Tests, Build
- Manual Testing: Checklist for production readiness

**ADR.md (Optional):**
- Only if architectural decision with long-term consequences
- Requires ClaudeCode&OnlyMe 4-question validation (ALL YES)
- Rejected if ANY NO: Real today? Simplest? 2 people? Works if never grow?

---

## Integration with Existing Workflows

### NO INVENTAR Protocol
- Read docs-global/stack/ BEFORE writing SPEC
- Verify APIs exist and are accessible
- Cite sources in PLAN.md (file:line format)
- PLAN.md references docs-global/ for validation

### ClaudeCode&OnlyMe Philosophy
- ADR.md requires 4-question validation if architectural decision
- Reject dependencies for teams 5+ developers
- Build for who we ARE (2 people), not who we MIGHT become

### Git Workflow
- Branch: `feature/<feature-slug>`
- Commits: `feat(spec):`, `feat(plan):`, `feat(<slug>):`
- PR: Link to specs/<feature-slug>/SPEC.md in description

### Tracking Files (Update EVERY session)
- /todo.md ← sync from TASKS.md (DOING/DONE)
- /plan.md ← update current phase from PLAN.md
- /feature_list.json ← update feature/step status
- /claude-progress.md ← session handoff notes

---

## Quality Gates

All features MUST pass quality gates before merge to main:

| Gate | Tool | Command | Pass Criteria |
|------|------|---------|---------------|
| Format | Biome | `pnpm run format --check` | 100% |
| Lint | Biome | `pnpm run lint` | 0 errors |
| Types | tsc | `pnpm run typecheck` | 0 errors |
| Tests | Vitest | `pnpm run test` | 80%+ coverage |
| Build | Next.js | `pnpm run build` | Exit 0 |

**CI Pipeline:** GitHub Actions runs all gates on every PR

**Pre-commit:** Format + Lint (future enhancement)

---

## Archive Policy

**When to Archive:**
- Feature shipped to production AND stable for 3+ months
- No active development planned
- All related PRs closed

**How to Archive:**
```bash
mv specs/<feature-slug> specs/_archive/
```

**Note:** Keep _archive/ out of search results (configured in .gitignore or IDE settings)

---

## Example: F003 Location Triage

See `specs/f003-location-triage/` for complete reference implementation:
- **Problem:** 28% of conversations (310/1,106) ask location first, then abandon
- **Solution:** Immediate location responses for Bogotá/Barranquilla, virtual offer for other cities
- **Impact:** Reduce abandonment rate, qualify leads by geography
- **Status:** SPEC complete, ready for implementation

**Files:**
- `SPEC.md`: Problem, contracts, 5 business rules, 6 edge cases
- `PLAN.md`: 7 implementation steps, 3 milestones, 5 risk mitigations
- `TASKS.md`: 15 tasks (1-4hr each), 16hr total estimate
- `TESTPLAN.md`: 41 unit tests, 5 integration tests, 80%+ coverage target

---

## Quick Start

```bash
# 1. Create feature directory
mkdir -p specs/f004-your-feature

# 2. Copy templates
cp /Users/mercadeo/neero/docs-global/templates/sdd/*.md specs/f004-your-feature/

# 3. Customize SPEC.md
# - Fill in problem, objective, contracts, rules

# 4. Validate stack (NO INVENTAR)
# - Read docs-global/stack/
# - Verify APIs and dependencies

# 5. Fill PLAN.md
# - Stack validated checklist
# - Implementation steps (S001-S007)
# - Risks and mitigations

# 6. Create TASKS.md
# - Break steps into 1-4hr tasks
# - Prioritize in TODO section

# 7. Write TESTPLAN.md
# - 80%+ coverage strategy
# - Test all business rules and edge cases

# 8. Update tracking files
# - /feature_list.json: Add feature with steps
# - /todo.md: Copy tasks from TASKS.md

# 9. Implement!
```

---

## Related Documentation

- **SDD Methodology:** `/Users/mercadeo/neero/docs-global/workflows/sdd-methodology.md`
- **Templates:** `/Users/mercadeo/neero/docs-global/templates/sdd/`
- **NO INVENTAR:** `/Users/mercadeo/neero/docs-global/workflows/no-inventar-validation-checklist.md`
- **ClaudeCode&OnlyMe:** `/Users/mercadeo/neero/docs-global/workflows/claudecode-onlyme.md`
- **Quality Gates:** `/Users/mercadeo/neero/docs-global/workflows/quality-gates.md`
- **Feature Tracking:** `/feature_list.json` (Anthropic format)

---

**Maintained by:** Neero Team (ClaudeCode&OnlyMe)
**Philosophy:** Rigorous enough for quality, lightweight enough for velocity
**Token Tracking:** ~950 tokens | Context: 0.48% of 200K
