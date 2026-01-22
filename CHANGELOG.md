# Changelog

All notable changes to this project will be documented in this file.

Format: [Keep a Changelog](https://keepachangelog.com)
Versioning: [Semantic Versioning](https://semver.org)

## [Unreleased]

### Changed
- **Simplified `/api/contacts/update` endpoint (v2.0):**
  - Changed request structure from nested (context + updates) to FLAT
  - Auto-extract country from phone number country code (+57 → CO, +52 → MX, +1 → US)
  - Reduced required fields: only `displayName` required (country extracted from phone)
  - Updated estatus logic: `datosok` = displayName + email (country not required)
  - Removed redundant fields: `contactName`, `phone` from request
  - Added `extractCountryFromPhone()` utility function with LATAM + common countries support
  - Updated 3 tests to reflect new validation logic (28 tests total, all passing)

### Added
- **Bird Action `process_media` configuration guide (v3.0):**
  - Complete step-by-step configuration guide in `docs/bird/bird-actions-process-media.md`
  - Documents minimal schema (zero arguments required)
  - Backend v3.0 automatically extracts mediaUrl from conversationId via Bird Conversations API
  - Backend auto-detects mediaType from message contentType
  - 10-minute configuration time (UI only, no code changes)
  - Includes troubleshooting, performance benchmarks, cost analysis
  - Replaces incorrect v1.0 schema (arguments.conversationId → context.conversation.id)
- Automated validation scripts for v1.0 features (F001-F006) - 1,130 lines total
  - `scripts/validate-f001.ts` - Data Collection validation (165 lines)
  - `scripts/validate-f002.ts` - Price Inquiry Handover validation (210 lines)
  - `scripts/validate-f004.ts` - Photo Quality Analysis validation (160 lines)
  - `scripts/validate-f005.ts` - Audio Transcription validation (235 lines)
  - `scripts/validate-f006.ts` - Guardrails Compliance validation (360 lines)
- Comprehensive validation reports in `validation-reports/`
  - Individual feature reports (f001-f006)
  - Executive summary: `v1.0-validation-summary.md` (380 lines)
- Vercel staging deployment plan (ready for execution)
- Added `.claude/` (lowercase) to `.gitignore` for proper exclusion

### Fixed
- **CRITICAL: Bird Media Download 400 Error - Manual Redirect Handling:**
  - Fixed "Only one auth mechanism allowed" error in production media downloads
  - Root cause (confirmed via testing conversationId 36261f66-7507-4056-aebe-c24a56e970e3):
    1. `media.api.bird.com` NEVER serves files directly - ALWAYS returns 302 redirect to S3
    2. Initial request to Bird requires `Authorization: AccessKey` header (401 without it)
    3. Bird returns 302 redirect with Location header containing S3 presigned URL
    4. S3 presigned URL has auth in query params (`X-Amz-Algorithm`, `X-Amz-Signature`, etc.)
    5. fetch() with `redirect: 'follow'` automatically follows redirect AND carries Authorization header
    6. S3 rejects requests with BOTH query param auth AND header auth (400 "Only one auth mechanism allowed")
  - Solution implemented in `lib/bird/media.ts`:
    - Added `redirect: 'manual'` to prevent automatic redirect following
    - Manual redirect detection (status 302/307) and Location header extraction
    - Follow redirect WITHOUT Authorization header (S3 presigned URL handles auth via query params)
    - Preserves presigned URL detection as fallback for direct S3 URLs
  - Testing methodology documented: Real API calls with conversationId confirmed Bird's redirect behavior
  - Removed debug logging from `lib/bird/media.ts` and `lib/bird/fetch-latest-media.ts`
  - Updated `docs/bird/bird-media-cdn.md` with redirect flow documentation
  - Resolves production issue preventing media processing in Bird Actions (commits 478ceeb, f10f4eb failures)
- **Bird API Contact Update - Email Attribute Error (422):**
  - Fixed `/api/contacts/update` endpoint sending `email` as attribute when Bird treats it as identifier
  - Removed `payload.attributes.email` from update payload (app/api/contacts/update/route.ts:211)
  - Email now handled exclusively via `addEmailIdentifier()` call (existing working implementation)
  - Updated verification logic to not check `attributes.email` (identifiers verified via separate API call)
  - Commented out misleading `email?: string` in `BirdContactAttributes` interface (lib/bird/types.ts:182)
  - Resolves Bird API 422 error: "attribute definition not found for email"
- Git push issue with sensitive patient data in `conversations/` directory
  - Removed 3.2MB file with patient data before push
  - Added `conversations/` to `.gitignore` permanently
- Consent schema validation in F005 tests (added missing required fields)
- Pricing pattern detection in F006 tests (adjusted to match keyword patterns)
- **Bird Action request body validation (flexible conversationId placement):**
  - Backend now accepts `conversationId` at both root level and inside `context` object
  - Normalizes root-level `conversationId` to `context.conversationId` before validation
  - Maintains backward compatibility with v3.0 recommended format (context.conversationId)
  - Unblocks Bird UI configurations where conversationId is placed at root level

### Changed
- Updated `todo.md` to reflect v1.0 validation completion and staging deployment plan
- Branch `docs/optimize-llm-format` merged into `main`
- **Consolidated Bird documentation (40% reduction):**
  - Created comprehensive multimodal config guide (`docs/bird/bird-multimodal-config-guide.md`, 800 lines)
  - Merged 2 operator guides into single authoritative source (bird-ai-employees-setup-guide.md + bird-actions-process-media.md)
  - Archived 8 obsolete files to `docs/bird/.archive/` (webhook patterns, v1.0/v2.0 docs)
  - Added v3.0 migration guide with before/after code samples
  - Added troubleshooting section with error code reference and timeout solutions
  - Added version markers (`architecture_version: "v3.0"`) to all active files
  - Reduced active documentation from 25 → 15 files (40% reduction)
  - Created archive README explaining historical context and migration path
  - Updated 6 files with frontmatter and cross-references to new guide
  - Rewritten README.md with clear operator vs developer paths

### Validated
- F001 (Data Collection): ✅ PASSED - All database, schema, and tool tests passing
- F002 (Price Inquiry Handover): ✅ PASSED - Two-layer architecture validated
- F003 (Location Triage): ⚠️ NOT IMPLEMENTED - Marked DONE but no code exists (28% impact)
- F004 (Photo Quality Analysis): ✅ PASSED - 3103ms processing time (within 6s budget)
- F005 (Audio Transcription): ✅ PASSED - Groq + OpenAI fallback configuration confirmed
- F006 (Guardrails Compliance): ✅ PASSED - 66 keywords across 3 severity levels working

**Overall Status:** 5/6 features CODE COMPLETE (83%)
**Blocking Issue:** F003 implementation required before production deployment

## [3.0.1] - 2025-12-23

### Changed
- Optimized Vercel deployments with enhanced `.vercelignore` v2.0
- Excluded dev/docs files: scripts/ (340KB), feature/ (164KB), validation-reports/ (72KB), drizzle/ (60KB), results/ (64KB), data/ (16KB), knowledge-base/ (16KB)
- Categorized structure for maintainability (8 sections: Documentation, Development, Archives, Temporary, Configuration, Symlinks, Environment, Build Artifacts)
- Estimated 5.4MB reduction (70% smaller uploads)
- Verified with side-by-side comparison of .vercelignore changes

### Technical Details
- Before: ~7.7MB upload size (including docs, scripts, feature specs)
- After: ~2.3MB upload size (only runtime-required files)
- Deployment speed: +70% faster uploads
- Build time: Unchanged (files already excluded from processing)

## [3.0.0] - 2025-12-13

### BREAKING CHANGES

**API Redesign:** Complete redesign of `/api/bird` endpoint to eliminate unreliable `mediaUrl` extraction

#### Changed
- **Request Schema Breaking Changes:**
  - Renamed `type` → `mediaType` (more descriptive, avoids TypeScript keyword conflict)
  - **REMOVED** `mediaUrl` field (AI Employee cannot obtain it reliably)
  - Made `context` object REQUIRED (was optional)
  - Made `context.conversationId` REQUIRED (was optional)

- **Bird Actions Configuration (REQUIRED UPDATE):**
  ```json
  // OLD (v2.x)
  {
    "type": "{{Arguments.type}}",
    "mediaUrl": "{{messageImage}}",
    "context": { "conversationId": "{{conversationId}}" }
  }

  // NEW (v3.0)
  {
    "mediaType": "{{Arguments.mediaType}}",
    "context": { "conversationId": "{{conversationId}}" }
  }
  ```

#### Added
- `/lib/bird/fetch-latest-media.ts` - PRIMARY flow to extract media from Bird Conversations API
- Bird Conversations API integration for reliable media URL extraction
- Error code `MEDIA_EXTRACTION_ERROR` for media extraction failures
- Environment variables:
  - `BIRD_ACCESS_KEY` (REQUIRED) - Bird API access key for Conversations API
  - `BIRD_WORKSPACE_ID` (REQUIRED) - Bird workspace UUID
- Auto-detection of media type from conversation message structure (more reliable than AI Employee hint)

#### Fixed
- **Root Cause:** AI Employee inconsistently extracts Bird variables (`{{messageImage}}`, `{{messageFile}}`, `{{messageAudio}}`)
- **Solution:** API now ALWAYS fetches latest media message from conversation via Bird Conversations API
- Eliminates dependency on unreliable Bird variable extraction
- 100% reliable media URL extraction (single source of truth: Conversations API)

#### Migration Guide
1. Update Bird Action configuration in Bird dashboard (see "Changed" section above)
2. Remove `mediaUrl` from Task Arguments
3. Add `BIRD_ACCESS_KEY` and `BIRD_WORKSPACE_ID` to environment variables
4. Deploy new version
5. Test with real WhatsApp conversations

#### Documentation
- Created `/docs/bird/bird-conversations-api-capabilities.md` - Complete API testing results
- Updated architecture docs with v3.0 changes

## [2.2.3] - 2025-12-11

### Documentation
- Fixed Bird Actions configuration error documentation (BUG-001)
- Replaced invalid `conversationMessageType` variable with Task Arguments pattern
- Added comprehensive Bird Variables Reference (`docs/bird/bird-variables-reference.md`)
- Updated `docs/bird/bird-ai-employees-setup-guide.md`:
  - Section 4.3: Task Arguments Configuration (mediaType, mediaUrl, conversationId, contactName)
  - Section 4.6: AI Employee configuration for argument population
  - Updated troubleshooting for invalid variable errors
  - Clarified Bird native variables vs Task Arguments distinction
- Updated `docs/bird/bird-actions-architecture.md`:
  - Task Arguments pattern with AI Employee population logic
  - Clarified media handling and variable availability
- Updated `plan/bugs.md`:
  - BUG-001 updated with root cause analysis
  - Added lessons learned about variable verification
  - Custom Function alternative with auto-detection logic

### Fixed
- Documentation error: `{{conversationMessageType}}` does NOT exist in Bird (use `mediaType` Task Argument instead)
- Clarified that Bird native variables (`{{messageImage}}`, etc.) are NOT automatically passed to Actions
- Explained AI Employee role in populating Task Arguments

## [2.2.2] - 2025-12-11

### Fixed
- Added safety check for media downloads (25MB limit) to prevent Edge Runtime OOM errors
- Validates `Content-Length` header before download
- Validates final buffer size after download
- Increased unknown type timeout from 4s to 5.5s to handle complex invoices
- Upgraded unknown type from Gemini 2.0 Flash to 2.5 Flash for better quality
- Fixed timeout errors when classification fails on complex invoices

## [2.2.1] - 2025-12-04

### Fixed
- Removed invalid secret references from vercel.json (OPENAI_API_KEY, WhatsApp variables)
- Simplified vercel.json - runtime now managed by Next.js route exports
- Added .vercelignore to exclude documentation and dev tooling from deployment

### Deployment
- Successfully deployed to Vercel Production
- Production URL: https://api.neero.ai
- Edge Runtime confirmed working
- Environment variables configured via Vercel dashboard

## [2.2.0] - 2025-12-04

### Added
- Intelligent image routing pipeline (classify → route → process)
- Type-specific processors (photo, invoice, document)
- Zod schemas for all AI outputs (classification, photo, invoice, document)
- Spanish-optimized prompts for LATAM documents
- codebase-guide.md for LLM reference (24 files documented)
- Time budget management system (8.5s internal, 500ms buffer)
- Dynamic timeout adjustment based on classification performance
- Groq text post-processing (llama-3.1-8b-instant) for transcript enhancement
- Audio transcription with Groq Whisper v3 Turbo + OpenAI fallback
- Budget-aware timeout management for audio processing
- Feature flag for post-processing (AUDIO_POSTPROCESS_ENABLED)

### Changed
- Migrated to Gemini 2.0/2.5 Flash via AI Gateway
- Two-stage pipeline: classify (2s) + process (4-5.5s)
- Model routing: photo→2.0, invoice→2.0, document→2.5
- Migrated Groq from REST to AI SDK transcribe()

### Research & Validation
- Comprehensive model selection research (Groq, Gemini, OpenAI comparison)
- Validated current stack as optimal for LATAM/Spanish market
- Confirmed 83-88% cost savings vs Claude/OpenAI alternatives
- Evaluated Groq Llama 4 Scout vision (preview only, not production-ready)
- Cost analysis: ~$92/10K requests vs $600-750+ for alternatives

### Technical
- lib/ai/classify.ts - Image classification with Gemini 2.0 Flash
- lib/ai/router.ts - Model routing table
- lib/ai/pipeline.ts - Two-stage orchestration
- lib/ai/processors/ - Type-specific processors
- lib/ai/schemas/ - Zod validation for outputs
- lib/ai/prompts/ - LATAM-optimized prompts
- lib/ai/timeout.ts - Time budget manager with audio support
- lib/ai/groq.ts - Groq Whisper integration via AI SDK
- lib/ai/groq-text.ts - Groq text model gateway
- lib/ai/post-process.ts - Transcript enhancement
- lib/ai/transcribe.ts - Fallback orchestration with budget awareness

## [2.1.0] - 2025-12-03

### Added
- Audio transcription with Groq Whisper v3 Turbo (primary)
- OpenAI Whisper fallback for audio ($0.67 vs $6.00 per 1K minutes)
- Bird media download with conditional auth (BIRD_ACCESS_KEY)
- transcribeWithFallback orchestration

### Technical
- lib/ai/groq.ts - Groq Whisper integration
- lib/ai/openai-whisper.ts - OpenAI Whisper fallback
- lib/ai/transcribe.ts - Fallback orchestration
- lib/bird/media.ts - CDN media download with auth

## [2.0.0] - 2025-12-02

### Added
- Bird Actions architecture (HTTP POST, not webhooks)
- AI Gateway integration for Gemini (0% markup, automatic failover)
- Edge Runtime compatibility (Web APIs only, no Node.js)
- Optional API key authentication (X-API-Key header)

### Changed
- **BREAKING:** Removed webhook pattern, now Actions-only
- **BREAKING:** Removed HMAC validation (not needed for Actions)
- **BREAKING:** Environment variables changed (removed BIRD_SIGNING_KEY)

### Technical
- app/api/bird/route.ts - Unified Actions endpoint
- lib/bird/types.ts - Bird Actions schemas
- lib/auth/api-key.ts - API key validation
- lib/security/crypto.ts - Web Crypto HMAC (Edge compatible)

## [1.0.0] - 2025-11-12

### Added
- Initial project setup from ai-sdk-wp template
- Next.js 16 + React 19 + TypeScript 5.9
- Project structure and configuration
- Basic documentation (architecture, deployment, AI integration)
- Tracking files (plan.md, todo.md, prd.md)

### Technical
- Next.js 16.2 with Turbopack
- Biome 2.3 for linting/formatting
- Tailwind CSS 4.1
- pnpm 9.15
