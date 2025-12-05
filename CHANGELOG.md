# Changelog

All notable changes to this project will be documented in this file.

Format: [Keep a Changelog](https://keepachangelog.com)
Versioning: [Semantic Versioning](https://semver.org)

## [2.2.1] - 2025-12-04

### Fixed
- Removed invalid secret references from vercel.json (OPENAI_API_KEY, WhatsApp variables)
- Simplified vercel.json - runtime now managed by Next.js route exports
- Added .vercelignore to exclude documentation and dev tooling from deployment

### Deployment
- Successfully deployed to Vercel Production
- Production URL: https://api-neero-eeivwqwa9-neero.vercel.app
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
