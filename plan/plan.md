# plan.md - Cost-Optimized Multimodal API

**Project:** api-neero | **Version:** 2.2.2 | **Updated:** 2025-12-11

---

## Current Status: Phase 5 DEPLOYED ✓

**Build:** PASSING | **Lint:** PASSING (1 warning) | **Deploy:** LIVE
**Production:** https://api-neero.vercel.app

All sub-phases complete:
- 5.1: Critical Fixes (Groq timeout + audio budget)
- 5.2: AI SDK Migration (Groq REST to SDK)
- 5.3: Text Post-Processing (llama-3.1-8b-instant)
- 5.4: Research Validation (optimal model selection)

---

## Architecture Stack

**Runtime:** Vercel Edge (V8 isolates, Web APIs only)
**AI Vision:** Gemini 2.0/2.5 Flash via AI Gateway
**AI Audio:** Groq Whisper v3 + OpenAI fallback
**Cost:** ~$8.40/month (10K img + 10K audio) - 89% cheaper than Claude

---

## Latest Updates (2025-12-05)

**BUG-001 RESOLVED:**
- [x] Identified root cause: Field name mapping issue (HTTP Request body)
- [x] Solution: Map `conversationMessageType` → `type`, `messageImage` → `mediaUrl`
- [x] Updated bugs.md with correct diagnosis and resolution
- [x] Updated setup guide with corrected HTTP Request body configuration
- [x] Custom Function alternative documented as fallback

**Documentation:**
- [x] WhatsApp → Bird media flow documentation
- [x] Bird AI Employee Actions setup guide updated
- [x] WhatsApp media payload structure (api-v23-guide.md)
- [x] Bird media conversion process (bird-media-handling.md)

**Files Updated:**
- `/plan/bugs.md` - BUG-001 marked as RESOLVED with correct solution
- `/docs/bird/bird-ai-employees-setup-guide.md` - Section 4.4 HTTP Request body corrected
- `/docs/bird/bird-whatsapp-media-flow.md` - Complete media flow (150 lines)

**Maintenance (2025-12-11):**
- [x] **Safety:** Added 25MB limit to `lib/bird/media.ts` to prevent Edge Runtime OOM
- [x] **Version:** Bumped to v2.2.2

---

## Next Phase: 4 (Integration & Monitoring)

- [ ] `/api/bird/health` health check
- [ ] Per-route metrics and cost tracking
- [ ] Structured logging with telemetry

---

## Key Constraints

- **9-second timeout:** Return error if exceeded
- **Bird Actions:** Synchronous JSON response
- **Edge Runtime:** Web APIs only (no Node.js modules)
- **File limits:** 5MB images, 25MB audio
- **Language:** Spanish default

---

**Status:** Phase 5 DEPLOYED - Live on Vercel Production | **Lines:** 50
