# PRD - api-neero

**Version:** 3.0.0 | **Date:** 2024-12-24 15:30 | **Owner:** Javier Polo | **Status:** Active
**Scope:** Cost-optimized multimodal API + EVA AI Employee for Dr. Andres Duran
**Last Updated:** 2024-12-24 15:30

---

## Executive Summary

**Product:** api-neero is a dual-purpose platform serving as (1) a cost-optimized multimodal API for Bird.com AI Employees processing WhatsApp media, and (2) EVA AI Employee - a conversational agentic system for plastic surgery consultation automation.

**Market Position:**
- **Region:** LATAM (Colombia primary - Barranquilla, Bogota)
- **Target:** Corporate clients using Bird.com WhatsApp Business platform
- **Primary Use Case:** Dr. Andres Duran Plastic Surgery Practice

**Value Proposition:**
- **Cost Savings:** 89-99% cheaper than Claude/OpenAI alternatives ($2.50 vs $75+/10K images)
- **Performance:** <9 second synchronous response (CRITICAL constraint)
- **Architecture:** Conversational agentic with tool-calling vs traditional Q&A bots
- **Compliance:** Ley 1581/2012 Colombia, medical guardrails, consent management

**Current Status:**
- **Multimodal API:** Production (v3.0.0) - https://api.neero.ai
- **EVA AI Employee:** 83% complete (5/6 features CODE COMPLETE)
- **Critical Blocker:** F003 Location Triage NOT implemented (affects 28% of conversations)
- **Next Steps:** Fix F003 → Complete Phase 5 & 6 → Production deployment

**Validation:** Based on 1,106 real WhatsApp conversations, automated validation scripts (1,130 lines), comprehensive feature testing.

---

## Table of Contents

1. [Product Overview & Vision](#1-product-overview--vision)
2. [Problem Statement](#2-problem-statement)
3. [Solution Architecture](#3-solution-architecture)
4. [Current Features (Implemented)](#4-current-features-implemented)
5. [Planned Features (Roadmap)](#5-planned-features-roadmap)
6. [Technical Specifications](#6-technical-specifications)
7. [User Flows](#7-user-flows)
8. [Compliance & Privacy](#8-compliance--privacy)
9. [Success Criteria & Metrics](#9-success-criteria--metrics)
10. [Appendix](#10-appendix)

---

## 1. Product Overview & Vision

### 1.1 Dual Product Definition

**Product 1: Multimodal API**
- Cost-optimized processing API for Bird.com AI Employees
- Processes images, documents, audio via WhatsApp
- 89% cheaper than Claude alternatives ($2.50 vs $75+ per 10K images)
- <9 second synchronous response time (CRITICAL constraint)
- Production URL: https://api.neero.ai

**Product 2: EVA AI Employee**
- Conversational agentic system for plastic surgery consultations
- Full customer journey automation (greeting → data collection → scheduling → handover)
- Tool-calling architecture with 6+ tools (CRM, media analysis, escalation)
- Validated against 1,106 real WhatsApp conversations
- 83% complete (5/6 features CODE COMPLETE)

### 1.2 Market & Target Users

| Aspect | Details |
|--------|---------|
| **Geographic Market** | LATAM (Colombia primary - Barranquilla, Bogota) |
| **Platform** | Bird.com WhatsApp Business |
| **Primary Client** | Dr. Andres Duran - Plastic Surgery Practice |
| **User Personas** | Leads (procedure inquiries), Existing patients, Coordinators, Surgeons |
| **Language** | Spanish (primary), English (secondary) |

### 1.3 Key Differentiators

| Differentiator | api-neero | Traditional Alternatives |
|----------------|-----------|-------------------------|
| **Cost** | $2.50/10K images | $75-750/10K (Claude/OpenAI) |
| **Architecture** | Conversational agentic (tool-calling) | Q&A chatbots |
| **Processing** | Intelligent routing (classify → route → process) | Single-model processing |
| **Compliance** | Ley 1581/2012, medical guardrails, consent | Generic compliance |
| **Performance** | <9s synchronous | 15-30s typical |
| **Spanish/LATAM** | Optimized prompts, Colombian context | Generic international |

### 1.4 Success Metrics (Validated with 1,106 Conversations)

| Metric | Current Baseline | v1.0 Target | v1.1 Target |
|--------|------------------|-------------|-------------|
| **Lead → Appointment Conversion** | Variable | +30% | +40% |
| **Time to Response p95** | 2min-8h | <10s | <5s |
| **Escalation to Human** | 47% | 40% | 35% |
| **Contact Info Shared** | 19% | 30% | 40% |
| **Photo Quality Usable** | ~50% | 70% | 85% |

---

## 2. Problem Statement

### 2.1 Pain Points (Validated with 1,106 Conversations)

**1. High Cost of Multimodal AI (89% gap)**
- Claude Vision: $75+/10K images
- OpenAI GPT-4o: $150+/10K images
- api-neero: $2.50/10K images (intelligent routing)

**2. Poor User Experience (47% abandon before sharing data)**
- No immediate responses (2min-8h delay)
- Generic bot responses (no LATAM context)
- No photo quality guidance (50% photos unusable)
- No location awareness (28% ask location first, then abandon)

**3. Compliance Risk**
- No Ley 1581/2012 consent management
- Medical diagnosis from bots (legal liability)
- Price commitments without specialist approval
- No data retention policies

**4. Inefficient Operations**
- Manual coordinator follow-up for every lead
- No automated reminders (T-72h, T-24h, T-3h)
- No CRM integration (manual data entry)
- No conversation context preservation

### 2.2 Market Opportunity

**LATAM Plastic Surgery Market:**
- Growing demand (middle-class expansion)
- WhatsApp-first communication (95% penetration)
- Spanish language optimization needed
- Local regulations (Ley 1581/2012 Colombia)

**Dr. Andres Duran Practice:**
- 2 locations (Barranquilla, Bogota)
- 1,106 conversations analyzed (Dec 2024)
- 19% conversion baseline (significant growth opportunity)
- High coordinator workload (manual follow-up)

### 2.3 Conversation Analysis Findings

| Finding | Impact | Source |
|---------|--------|--------|
| **28% ask location FIRST** | Lost leads outside coverage | 310/1,106 conversations |
| **50% ask price** | 47% abandon after price question | Price inquiry pattern analysis |
| **95% conversations end with patient** | No proactive closure or follow-up | Message flow analysis |
| **19% share contact info** | Low data collection rate | Lead capture analysis |
| **50% photos unusable quality** | Manual retake coordination needed | Photo quality assessment |

---

## 3. Solution Architecture

### 3.1 Bird Actions Pattern (NOT Webhooks)

**Architecture Flow:**
```
User WhatsApp → Bird AI Employee → HTTP POST /api/agent/inbound
  → Fetch latest media from Bird Conversations API
  → Process with AI (<9s)
  → Return JSON response
  → Bird AI Employee continues conversation
```

**Key Characteristics:**
- Synchronous JSON response (NOT background processing)
- No HMAC validation needed (Actions, not webhooks)
- Conditional CDN auth with `BIRD_ACCESS_KEY`
- Optional API key authentication (`X-API-Key` header)
- CRITICAL: MAX 9 seconds or immediate error

**v3.0 Breaking Changes (2025-12-13):**
- Removed `mediaUrl` from request (unreliable Bird variable extraction)
- API now fetches latest media via Bird Conversations API
- Auto-detects media type from message structure
- 100% reliable media URL extraction (single source of truth)

### 3.2 Intelligent Image Routing Pipeline

**Two-Stage Architecture:**
```
Image → Classify (2s) → Route (<10ms) → Process (4-5.5s) → Response
         Gemini 2.0 Flash  Route table    Type-specific model
```

**Model Selection Table:**

| Type | Model | Timeout | Use Case |
|------|-------|---------|----------|
| **photo** | Gemini 2.0 Flash | 4s | People, objects, scenes, general images |
| **invoice** | Gemini 2.0 Flash | 5s | Invoices, receipts, OCR text extraction |
| **document** | Gemini 2.5 Flash | 5.5s | Cedulas, contracts, policies, complex docs |
| **unknown** | Gemini 2.5 Flash | 5.5s | Fallback for unclassified images |

**Key Features:**
- Dynamic timeout adjustment if classification is slow
- `forceType` parameter to skip classification (saves 2s)
- Spanish-optimized prompts for LATAM documents
- Fallback to fast path if remaining time <3s

### 3.3 RAG (Retrieval-Augmented Generation) Architecture

**Knowledge Base Pipeline:**
```
User Query → retrieveKnowledge tool → Generate embedding
  → pgvector HNSW search → Results (similarity >0.65)
  → EVA uses in response OR escalate to human
```

**Components:**
- **Embeddings:** Google Gemini text-embedding-004 (768 dimensions, $0.025/1M tokens)
- **Database:** Neon PostgreSQL + pgvector v0.8.1 extension
- **Index:** HNSW (Hierarchical Navigable Small World) - 1.5ms query time @ 58K records
- **Similarity:** Cosine distance, threshold 0.65 (balanced precision/recall)
- **Knowledge:** 14 validated documents (Dr. Andres Duran approval)

**Performance:**
- RAG overhead: ~472ms (5.2% of 9s budget)
- Embedding generation: ~470ms per query
- HNSW query: 1.5ms (AWS benchmark)
- Auto-escalate if similarity <0.65 (no hallucination risk)

### 3.4 Tool-Calling Conversational Agent

**EVA Architecture:**
```
WhatsApp Message → Bird AI Employee → /api/agent/inbound
  → Reconstruct conversation context (messageLogs)
  → Gemini 2.0 Flash with tool definitions
  → Execute tools (analyzePhoto, upsertLead, createTicket, etc.)
  → Validate with guardrails (66 keywords, 3 severity levels)
  → Return response to Bird
```

**Tool Ecosystem (6+ tools):**
1. `analyzePhoto` - Photo quality analysis with consent
2. `transcribeAudio` - Spanish audio transcription (Groq → OpenAI fallback)
3. `upsertLead` - CRM lead management (create/update)
4. `checkServiceWindow` - WhatsApp 24h window verification
5. `sendMessage` - WhatsApp message sending (text, buttons, templates)
6. `createTicket` - Escalate to human with reason/priority
7. `retrieveKnowledge` - RAG semantic search (implied)

### 3.5 Edge Runtime Constraints

**All API routes use `export const runtime = 'edge'`:**

| Constraint | Implication |
|------------|-------------|
| **NO Node.js APIs** | Cannot use: fs, crypto.createHmac, Buffer |
| **USE Web APIs** | Must use: crypto.subtle, ReadableStream, fetch |
| **Timeouts** | 25s default, 300s for streaming responses |
| **Memory** | 128MB limit (25MB media download safety check) |
| **Implementation** | `/lib/security/crypto.ts` (Web Crypto HMAC) |

---

## 4. Current Features (Implemented)

### 4.1 Multimodal Processing (Production v3.0.0)

**✅ Intelligent Image Routing (v2.2.0)**
- Two-stage pipeline: Classify (2s) → Route (<10ms) → Process (4-5.5s)
- Type-specific processors for photo/invoice/document
- Spanish-optimized prompts for LATAM documents
- Force type override (skips classification, saves 2s)
- Dynamic timeout adjustment
- Implementation: `/lib/ai/classify.ts`, `/lib/ai/router.ts`, `/lib/ai/pipeline.ts`

**✅ Audio Transcription (v2.1.0)**
- Primary: Groq Whisper v3 Turbo ($0.67/1K min, 95% of requests)
- Fallback: OpenAI Whisper ($6.00/1K min, 5% of requests)
- 228x realtime processing speed
- Spanish language optimization
- Optional post-processing with Groq text model (feature flag)
- Implementation: `/lib/ai/transcribe.ts`, `/lib/ai/groq.ts`

**✅ Document Processing (v1.0.0)**
- Multi-page PDF extraction (Gemini PDF native)
- Scanned documents with OCR
- Colombian cedula recognition
- Contract and policy analysis

### 4.2 EVA AI Employee Features (v1.0 MVP - 83% Complete)

**✅ F001: Data Collection (1 Message) - CODE COMPLETE**
- Collects 5 fields: name, phone, email, country, procedure interest
- Accepts free-form format (87% completion in 1 message target)
- `upsertLeadTool` with insert + update logic
- Database: `leads` table with conversation_id unique index
- Validation: Automated script (165 lines) - ALL TESTS PASSING

**✅ F002: Price Inquiry Handover - CODE COMPLETE**
- Two-layer architecture: proactive AI + reactive guardrails
- 14 pricing keywords detection
- `createTicket` tool with reason="pricing"
- Safe fallback: "Los precios varian segun tu caso..."
- Known limitation: Guardrails only detect responses with "$", relies on AI for questions
- Validation: Automated script (210 lines) - ALL TESTS PASSING

**❌ F003: Location Triage - NOT IMPLEMENTED (CRITICAL BLOCKER)**
- **Status:** Marked DONE but NO code exists
- **Impact:** 28% of conversations (310/1,106) ask location first
- **Users:** Don't get immediate location answers
- **Risk:** Lost leads outside Barranquilla/Bogota coverage
- **Recommendation:** Implement ASAP (15 min prompt-based OR 2h code-based)
- **Validation:** No automated script (feature not implemented)

**✅ F004: Photo Quality Analysis - CODE COMPLETE**
- `analyzePhotoTool` with consent checking
- Gemini 2.0 Flash processing
- Quality feedback: lighting, angle, distance, focus
- Processing time: 3.1s (within 6s budget)
- NO medical diagnosis (guardrails enforced)
- Validation: Automated script (160 lines) - ALL TESTS PASSING

**✅ F005: Audio Transcription - CODE COMPLETE**
- `transcribeAudioTool` integration
- Groq Whisper primary + OpenAI fallback
- Spanish language optimization
- Transcript enhancement via Groq text model
- Validation: Automated script (235 lines) - ALL TESTS PASSING

**✅ F006: Guardrails Compliance - CODE COMPLETE**
- Pre-send validation with 66 keywords across 3 severity levels
- Violation detection: diagnosis, prescription, guarantees, pricing
- Automatic handover on critical violations
- Implementation: `/lib/agent/guardrails.ts`
- Validation: Automated script (360 lines) - ALL TESTS PASSING

**Overall Status:** 5/6 features CODE COMPLETE (83%)
**Blocking Issue:** F003 implementation required before production deployment

### 4.3 Bird Integration (Production v3.0.0)

**✅ Bird Conversations API Integration**
- Fetch latest message with limit=1 for efficiency
- Extract media URL from message structure automatically
- No HMAC validation needed (Actions, not webhooks)
- Conditional CDN auth with `BIRD_ACCESS_KEY`
- Implementation: `/lib/bird/conversations.ts`, `/lib/bird/media.ts`

**✅ Bird Contacts API Integration**
- Update CRM after upsertLead (sync lead data to Bird Contact)
- Create new contacts if not exist
- Implementation: `/lib/bird/contacts.ts`

**✅ Bird Actions Pattern**
- HTTP POST from AI Employee → `/api/bird` or `/api/agent/inbound`
- Auto-detection of media type from message structure
- Synchronous JSON response (<9s or immediate error)
- Optional API key authentication (`X-API-Key` header)

### 4.4 RAG Knowledge Base (Ready for Deployment)

**✅ EVA Knowledge Base Optimization**
- Reduced Additional Instructions: 9,000 → 3,260 tokens (-64%)
- Tokens per message: ~9,100 → ~4,600 (-49%)
- Estimated cost: $4,095/month → $2,070/month (-48%)
- Annual savings: $24,300
- Payback period: 12 days
- Files: `docs/knowledge-base/procedimientos.md`, `ubicaciones.md`, `faqs.md`
- Deployment guide: `docs/eva-kb-optimization-deployment-guide.md`

**✅ RAG Architecture**
- 14 validated documents (Dr. Andres Duran approval)
- Categories: procedures (5), faqs (5), policies (3), locations (1)
- Similarity threshold: 0.65 (auto-escalate if lower)
- HNSW index: 1.5ms query time
- Implementation: `/lib/db/queries/knowledge.ts`, `/lib/ai/embeddings.ts`

### 4.5 Database Schema (Neon PostgreSQL)

**7 Tables:**
1. `leads` - Patient data (conversation_id unique, stage tracking)
2. `consents` - GDPR/Ley 1581 compliance (type: photo_analysis, audio_transcription)
3. `appointments` - Scheduling (type, location, status, reminders)
4. `message_logs` - Conversation history (direction, tool_calls, tokens)
5. `conversation_state` - Current state (stage, requires_human, handover_reason)
6. `medical_knowledge` - RAG knowledge base (vector(768), category)
7. `contact_normalizations` - Bird CRM data quality (status, confidence)

**Key Indexes:**
- `conversation_id` (unique on leads, primary on conversation_state)
- `lead_id` (foreign keys on consents, appointments)
- HNSW vector index on medical_knowledge.embedding

**Schema:** `/lib/db/schema.ts` (179 lines)

---

## 5. Planned Features (Roadmap)

### 5.1 v1.0 MVP - TODO (20% Remaining)

**🔴 CRITICAL BLOCKER: F003 Location Triage (15 min - 2h)**
- **Problem:** 28% of conversations ask location first (310/1,106)
- **Solution Options:**
  - Option 1: Prompt-based (15 min) - Add location instructions to EVA prompt
  - Option 2: Code-based tool (2h) - Create `checkLocation` tool with escalation logic
- **Acceptance:** Bogota/Barranquilla responses, escalate other cities, offer virtual for outside Colombia
- **Priority:** P0 - Blocks production deployment

**Phase 5: Outbound Endpoint (4-6 hours)**
- Vercel Cron Jobs for appointment reminders
- Templates: T-72h, T-24h, T-3h
- WhatsApp template approval (utility category)
- Implementation: `/app/api/cron/reminders/route.ts`

**Phase 6: Production Deployment (5-7 hours)**
- Sentry integration for monitoring
- Integration testing in Bird sandbox
- Production Go/No-Go validation
- Deployment runbook documentation

### 5.2 v1.1 Proactive Engagement (Weeks 5-6, 9-13 hours)

Based on 1,106 conversation analysis:

| Feature | Effort | Data-Driven Rationale |
|---------|--------|----------------------|
| **Proactive closure CTA** | 2-3h | 95% conversations end with patient (no bot closure) |
| **Price/value explanation** | 4-6h | 50% ask price, 47% abandon after price question |
| **Dynamic location triage enhancement** | 3-4h | 28% ask location, improve with specific city responses |
| **Appointment management** | 16-20h | Google Calendar API + double-booking prevention |
| **Reminder templates** | 8-12h | WhatsApp utility templates (T-72h, T-24h, T-3h) |
| **Payment links** | 12-16h | Stripe/Wompi integration for deposits |

### 5.3 v1.2 Advanced Features (Weeks 7-8, 40-48 hours)

| Feature | Effort | Business Value |
|---------|--------|----------------|
| **Procedure-specific photo kits** | 12-16h | Lipo: front/side/back | 70→85% quality improvement |
| **Pre-op checklists** | 8-12h | Automated patient preparation by procedure |
| **Reputation management** | 12-16h | Day-90 review request if CSAT≥4 |
| **Metrics dashboard** | 8-12h | Conversions, handovers, tool usage, costs |
| **A/B testing framework** | 8-12h | Prompt optimization with statistical significance |

---

## 6. Technical Specifications

### 6.1 Core Stack

| Component | Technology | Version | Rationale |
|-----------|-----------|---------|-----------|
| **Runtime** | Next.js | 16.0.10 | React 19 support, Turbopack |
| **Framework** | React | 19.2.0 | Latest stable, performance improvements |
| **Language** | TypeScript | 5.9.3 | Strict type safety, noUncheckedIndexedAccess |
| **Platform** | Vercel Edge Functions | - | <10ms cold start, global CDN |
| **Database** | Neon PostgreSQL | - | Serverless, ~50ms p95 latency |
| **ORM** | Drizzle ORM | 0.29.0 | ~7KB vs 50KB Prisma |

### 6.2 AI Framework & Models

| Component | Technology | Cost | Use Case |
|-----------|-----------|------|----------|
| **AI Framework** | Vercel AI SDK | 5.0.87 | Tool calling, streaming, Zod validation |
| **AI Gateway** | Vercel AI Gateway | 0% markup | Automatic failover, caching |
| **Vision (general)** | Gemini 2.0 Flash | $0.17/1K images | Photos, invoices (90% of images) |
| **Vision (complex)** | Gemini 2.5 Flash | $0.30/1K images | Cedulas, contracts (10% of images) |
| **Audio (primary)** | Groq Whisper v3 Turbo | $0.67/1K min | Spanish transcription (95% of audio) |
| **Audio (fallback)** | OpenAI Whisper | $6.00/1K min | Fallback when Groq fails (5% of audio) |
| **Text (post-processing)** | Groq Llama 3.1 8B | $0.05/1M tokens | Transcript enhancement (optional) |
| **Embeddings** | Gemini text-embedding-004 | $0.025/1M tokens | RAG semantic search (768 dims) |

### 6.3 Integration & APIs

| Component | Purpose | Authentication |
|-----------|---------|----------------|
| **Bird Conversations API** | Fetch messages, media URLs | `Authorization: AccessKey {BIRD_ACCESS_KEY}` |
| **Bird Contacts API** | Update CRM after lead creation | `Authorization: AccessKey {BIRD_ACCESS_KEY}` |
| **Bird Channels API** | Send messages, templates | `Authorization: AccessKey {BIRD_ACCESS_KEY}` |
| **Vercel AI Gateway** | Gemini proxy (0% markup) | `Authorization: Bearer {AI_GATEWAY_API_KEY}` |
| **Groq** | Whisper v3 audio transcription | `Authorization: Bearer {GROQ_API_KEY}` |
| **OpenAI** | Whisper fallback | `Authorization: Bearer {OPENAI_API_KEY}` |
| **Neon** | PostgreSQL serverless | HTTP-based (Edge compatible) |

### 6.4 Critical Constraints

| Constraint | Requirement | Implication |
|------------|-------------|-------------|
| **9-Second Timeout** | MAX 9 seconds or immediate error | CRITICAL - All processing <9s |
| **Edge Runtime** | Web APIs only (no Node.js) | Cannot use: fs, Buffer, crypto.createHmac |
| **File Size Limits** | Images: 5MB, Audio: 25MB, Docs: 100MB | WhatsApp constraints + Edge OOM prevention |
| **Rate Limiting** | WhatsApp: 250 msg/sec per phone number | Token bucket implementation |
| **TypeScript Strict** | noUncheckedIndexedAccess, noUnusedLocals | Prevents common bugs |
| **RAG Threshold** | Similarity <0.65 → Auto-escalate | No hallucination risk |
| **Message Deduplication** | 60-second window tracking | Prevent duplicate processing on retries |

### 6.5 Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Image Processing (photo)** | 4-5s typical, 9s max | p95 latency |
| **Image Processing (invoice)** | 5-6s typical, 9s max | p95 latency |
| **Image Processing (document)** | 5.5-7s typical, 9s max | p95 latency |
| **Audio Transcription** | 3-5s typical, 9s max | p95 latency |
| **RAG Query** | ~472ms (5.2% of 9s budget) | Embedding (470ms) + HNSW (1.5ms) |
| **Database Query** | <50ms p95 | Neon PostgreSQL serverless |
| **Cold Start** | <10ms | Vercel Edge Functions |

### 6.6 Cost Targets

**Current Performance (10K images + 10K audio min/month):**

| Service | Model | Rate | Monthly Cost | Usage |
|---------|-------|------|--------------|-------|
| Image (general) | Gemini 2.0 Flash | $0.17/1K | $1.53 | 90% |
| Image (complex) | Gemini 2.5 Flash | $0.30/1K | $0.30 | 10% |
| Audio (primary) | Groq Whisper | $0.67/1K min | $6.70 | 95% |
| Audio (fallback) | OpenAI Whisper | $6.00/1K min | $0.30 | 5% |
| **TOTAL** | - | - | **$8.83/month** | - |

**Comparison:** Claude Vision ~$75+/month (89% savings)

**EVA AI Employee (1,000 conversations/month):**
- Gemini conversation: $0.75
- Gemini photos: $0.05
- Groq audio: $0.07
- Neon DB: $0.00 (free tier)
- Vercel Edge: $0.00 (free tier)
- **Total:** $0.87/month
- **vs Claude Opus 4:** $150/month (99.4% savings)

---

## 7. User Flows

### 7.1 Flow 1: New Lead (Info Request)

```
1. User: "Hola, quiero info sobre rinoplastia"
2. EVA: Greeting + procedure overview (from RAG knowledge base)
3. EVA: Request 5 data fields (name, phone, email, country, procedure)
4. User: Provides all in 1 message (60% success rate)
5. EVA: Calls upsertLeadTool → Saves to DB + Updates Bird Contact
6. EVA: "Perfecto [Name]. Para continuar..."
7. EVA: Offers valoracion presencial/virtual
8. If pricing question → createTicket (handover)
9. Otherwise → Continue conversation
```

**Implementation:** `/app/api/agent/inbound/route.ts`, `/lib/agent/tools/crm.ts`

### 7.2 Flow 2: Photo Quality Analysis (with Consent)

```
1. User: Sends photo for evaluation
2. EVA: Check consent (photoCount === 0?)
3. If NO consent:
   - Request explicit consent (sensitive data processing)
   - Record in consents table (type: photo_analysis, method: whatsapp_text)
4. EVA: Calls analyzePhotoTool(conversationId, checkConsent=true)
5. API: Download from Bird CDN → Gemini 2.0 Flash → Quality analysis
6. EVA: Feedback (lighting, angle, distance, focus) - NO diagnosis
7. If poor quality: Suggest retake with specific improvements
8. If good quality: "La foto es adecuada para evaluacion"
```

**Consent Enforcement:**
- Block processing if `photoCount === 0` AND no consent
- Record consent with timestamp + method
- Data retention: Photos NOT stored (process in memory, discard)

**Implementation:** `/lib/agent/tools/media.ts`, `/lib/agent/consent.ts`

### 7.3 Flow 3: Price Inquiry Handover (50% of Conversations)

```
1. User: "Cuanto cuesta?" / "Precio de rinoplastia"
2. EVA: Detect pricing intent (Layer 1: AI proactive detection)
3. Guardrails: Validate response (Layer 2: keyword detection for "$")
4. EVA: Calls createTicket(reason="pricing", summary="...", priority="medium")
5. EVA: "Los precios varian segun tu caso. Te transferire a un especialista"
6. Update conversation_state: requiresHuman=true, handoverReason="pricing"
7. Human coordinator receives structured ticket
```

**Two-Layer Architecture:**
- Layer 1 (Proactive): AI detects pricing questions in user message
- Layer 2 (Reactive): Guardrails detect "$" in AI response

**Known Limitation:** Guardrails only detect responses with "$", relies on AI for detecting questions

**Implementation:** `/lib/agent/guardrails.ts`, `/lib/agent/tools/crm.ts`

### 7.4 Flow 4: Location Triage (NOT IMPLEMENTED - BLOCKER)

```
Expected (v1.1):
1. User: "Donde estan ubicados?"
2. EVA: Detect location intent
3. If Barranquilla: Provide address (Cra 52 #82-110) + offer valoracion
4. If Bogota: Provide address + offer valoracion
5. If other city in Colombia: "Actualmente solo atendemos Bogota y Barranquilla. Te gustaria valoracion virtual?"
6. If outside Colombia: Escalate to coordinator
```

**Current Status:** BLOCKER - Feature marked DONE but NO code exists
**Impact:** 28% of conversations (310/1,106)
**Recommendation:** Implement ASAP (15 min prompt-based OR 2h code-based)

### 7.5 Flow 5: Audio Transcription

```
1. User: Sends voice note in Spanish
2. EVA: Calls transcribeAudioTool(conversationId)
3. API: Download from Bird CDN → Groq Whisper v3 → Transcription
4. If Groq fails: Fallback to OpenAI Whisper
5. Optional: Post-process with Groq text model (punctuation, intent)
6. EVA: "Entiendo que [transcription summary]..."
7. EVA: Respond to content
```

**Fallback Strategy:**
- Primary: Groq Whisper v3 Turbo (95% success rate)
- Fallback: OpenAI Whisper (5% when Groq fails)
- Budget-aware: Adjust timeout based on remaining time budget

**Implementation:** `/lib/ai/transcribe.ts`, `/lib/ai/groq.ts`, `/lib/ai/openai-whisper.ts`

### 7.6 Flow 6: RAG Knowledge Retrieval

```
1. User: "Cuanto dura la recuperacion de abdominoplastia?"
2. EVA: Calls retrieveKnowledge("recuperacion abdominoplastia")
3. API: Generate embedding (Gemini text-embedding-004)
4. DB: pgvector HNSW search (cosine similarity)
5. If similarity ≥0.65: Return validated content
6. EVA: Use knowledge in response
7. If similarity <0.65: Auto-escalate to human (no hallucination risk)
```

**Knowledge Base:**
- 14 validated documents (Dr. Andres Duran approval)
- Categories: procedures (5), faqs (5), policies (3), locations (1)
- Similarity threshold: 0.65 (balanced precision/recall)

**Implementation:** `/lib/agent/tools/retrieve-knowledge.ts`, `/lib/db/queries/knowledge.ts`

---

## 8. Compliance & Privacy

### 8.1 Ley 1581/2012 Colombia (GDPR-equivalent)

**Consent Management:**

| Consent Type | Trigger | Required Fields | TTL |
|-------------|---------|-----------------|-----|
| `photo_analysis` | First photo upload (photoCount === 0) | sensitiveDataOptIn, method='whatsapp_text' | Indefinite |
| `audio_transcription` | First audio upload | method='whatsapp_text' | Indefinite |
| `document_processing` | First document upload | method='whatsapp_text' | Indefinite |
| `appointment_booking` | Scheduling appointment | method='whatsapp_text' | Indefinite |

**Consent Workflow:**
1. User sends media (photo/audio/document)
2. Check `photoCount` or equivalent in conversation state
3. If first time → Request explicit consent
4. Record in `consents` table with timestamp + method
5. Block processing if no consent
6. Grant access for future media of same type

**Data Retention:**

| Data Type | Storage | TTL | Legal Basis |
|-----------|---------|-----|-------------|
| Photos | NOT stored (process in memory, discard) | N/A | Ley 1581 Art. 17 |
| Photo metadata | JSON only (quality metrics) | 90 days (non-patient) | Performance monitoring |
| Transcriptions | Text only (NO audio file) | 90 days (non-patient) | Conversation context |
| Patient data | Full history in `leads` table | Indefinite | Resolucion 839/2017 (medical records) |
| Message logs | All conversation history | Indefinite (patient), 90 days (non-patient) | Context reconstruction |

### 8.2 Medical Guardrails (Safety & Compliance)

**Prohibited Actions:**
- ❌ Clinical diagnosis
- ❌ Prescriptions or personalized medical advice
- ❌ Final pricing (ranges OK → specialist confirms)
- ❌ Result promises ("100% garantizado")
- ❌ Urgent medical advice (red flags → handover + "busca urgencias")

**Guardrails Implementation:**
- Pre-send validation with 66 keywords across 3 severity levels
- Violation detection: diagnosis, prescription, guarantees, pricing
- Automatic handover on critical violations
- Implementation: `/lib/agent/guardrails.ts`

**Severity Levels:**

| Level | Keyword Count | Action | Examples |
|-------|---------------|--------|----------|
| **Critical** | 22 | Auto-handover + log | diagnosis, prescribo, garantizo 100% |
| **High** | 24 | Auto-handover + log | precio final $, toma este medicamento |
| **Medium** | 20 | Warning + log | probablemente, seguramente, deberia ser |

**Validation:** Automated script (360 lines) - ALL TESTS PASSING

### 8.3 WhatsApp Business Policies

**24-Hour Service Window:**
- Free-form messages ONLY within 24h of last user message
- Outside 24h: Utility category templates REQUIRED
- Hard gate in `sendMessageTool` (check BEFORE sending)
- Implementation: `/lib/agent/tools/whatsapp.ts`

**Rate Limiting:**
- WhatsApp: 250 messages/second per phone number
- Token bucket implementation: `/lib/whatsapp/rate-limit.ts`
- In-memory Map with automatic expiration

**Message Deduplication:**
- WhatsApp may retry webhooks if response slow
- 60-second window tracking: `/lib/whatsapp/webhook.ts:isDuplicateMessage`
- In-memory Map with message IDs + auto-expire

---

## 9. Success Criteria & Metrics

### 9.1 Technical Go/No-Go (v1.0 MVP)

| Criterion | Status | Evidence |
|-----------|--------|----------|
| p95 latency <10s in staging | ✅ PASS | Validated in production |
| 0 guardrails violations in 100-conversation test | ✅ PASS | Automated validation script (360 lines) |
| 0 messages sent outside 24h window without template | ✅ PASS | Hard gate in sendMessageTool |
| 100% tool executions logged | ✅ PASS | messageLogs table captures all tool calls |
| Database migrations successful | ✅ PASS | Drizzle schema deployed to Neon |
| All environment variables configured | ✅ PASS | Vercel dashboard + Bird environment |
| **F003 Location Triage implemented** | ❌ FAIL | **BLOCKER - Not implemented** |

### 9.2 Functional Go/No-Go

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Lead completes: info → data collection → handover | ✅ PASS | F001 automated validation |
| Photo quality analysis E2E (consent → analyze → feedback) | ✅ PASS | F004 automated validation |
| Audio transcription with fallback (Groq → OpenAI) | ✅ PASS | F005 automated validation |
| Handover creates structured ticket | ✅ PASS | createTicket tool implementation |
| Bird Contact updated after upsertLead | ✅ PASS | Contacts API integration |
| Conversation context persists across messages | ✅ PASS | messageLogs + conversation_state |

### 9.3 Compliance Go/No-Go

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Explicit consent requested before photo processing | ✅ PASS | F004 consent validation |
| No medical diagnosis in any bot response (audit 100 convos) | ✅ PASS | F006 guardrails validation |
| No price commitments without specialist | ✅ PASS | F002 pricing handover validation |
| Warm handoff message for all escalations | ✅ PASS | createTicket implementation |
| Data retention policy documented | ✅ PASS | Section 8.1 above |

### 9.4 Quantitative Targets

Based on 1,106 conversation analysis:

| Metric | Baseline | v1.0 Target | v1.1 Target | Current Status |
|--------|----------|-------------|-------------|----------------|
| **TTR p95** | 2min-8h | <10s | <5s | ⏳ Pending production |
| **Lead→Cita conversion** | Variable | +30% | +40% | ⏳ Pending production |
| **% escalate to human** | 47% | 40% | 35% | ⏳ Pending production |
| **% share contact info** | 19% | 30% | 40% | ⏳ Pending production |
| **Photo quality usable** | ~50% | 70% | 85% | ⏳ Pending production |

### 9.5 EVA KB Optimization Targets (READY FOR DEPLOYMENT)

| Metric | Target | Status |
|--------|--------|--------|
| Tokens per message | ≤4,600 (-50%) | ☐ Pending deployment |
| Latency | ≤2.5s (-20%) | ☐ Pending deployment |
| Quality | ≥95% (maintain) | ☐ Pending deployment |
| Handover rate | 35-40% (maintain) | ☐ Pending deployment |

**Impact:**
- Annual cost savings: $24,300
- Payback period: 12 days
- Token reduction: 9,000 → 3,260 (-64%)

---

## 10. Appendix

### 10.1 Database Schema Reference

**7 Tables - Complete Schema:**

See `/lib/db/schema.ts` for full implementation.

**Table 1: leads**
```typescript
{
  leadId: uuid (PK),
  conversationId: uuid (UNIQUE),
  name: text,
  phone: varchar(20),
  email: varchar(255),
  country: varchar(100),
  city: varchar(100),
  procedureInterest: text,
  stage: varchar(50) DEFAULT 'new',
  source: varchar(50) DEFAULT 'whatsapp',
  metadata: jsonb,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Table 2: consents**
```typescript
{
  consentId: uuid (PK),
  leadId: uuid (FK → leads.leadId),
  conversationId: uuid,
  consentType: varchar(50), // photo_analysis, audio_transcription, etc.
  granted: boolean DEFAULT false,
  method: varchar(50), // whatsapp_text
  ipAddress: varchar(45),
  userAgent: text,
  metadata: jsonb,
  createdAt: timestamp
}
```

**Table 3: appointments**
```typescript
{
  appointmentId: uuid (PK),
  leadId: uuid (FK → leads.leadId),
  conversationId: uuid,
  appointmentType: varchar(50), // valoracion_presencial, valoracion_virtual
  scheduledAt: timestamp,
  location: varchar(255), // Barranquilla, Bogota
  status: varchar(50) DEFAULT 'scheduled',
  remindersSent: jsonb, // [{ type: '72h', sentAt: timestamp }]
  metadata: jsonb,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Table 4: message_logs**
```typescript
{
  messageId: uuid (PK),
  conversationId: uuid,
  direction: varchar(20), // inbound, outbound
  text: text,
  attachmentsMeta: jsonb, // { type, url, mimeType }
  toolCalls: jsonb, // [{ name, arguments, result }]
  model: varchar(100), // gemini-2.0-flash
  tokensUsed: jsonb, // { prompt, completion, total }
  processingTimeMs: jsonb,
  metadata: jsonb,
  createdAt: timestamp
}
```

**Table 5: conversation_state**
```typescript
{
  conversationId: uuid (PK),
  leadId: uuid (FK → leads.leadId),
  currentStage: varchar(50) DEFAULT 'greeting', // greeting, data_collection, photo_analysis, etc.
  lastMessageAt: timestamp,
  messagesCount: jsonb, // { inbound: 5, outbound: 4 }
  requiresHuman: boolean DEFAULT false,
  handoverReason: text, // pricing, medical_advice, location_outside_coverage
  context: jsonb, // { photoCount: 2, audioCount: 1, consentGranted: true }
  metadata: jsonb,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Table 6: medical_knowledge**
```typescript
{
  knowledgeId: uuid (PK),
  content: text,
  embedding: vector(768), // pgvector HNSW index
  category: varchar(50), // procedures, faqs, policies, locations
  subcategory: text, // rinoplastia, abdominoplastia, etc.
  metadata: jsonb,
  validatedBy: varchar(100), // Dr. Andres Duran
  validatedAt: timestamp,
  version: integer DEFAULT 1,
  active: boolean DEFAULT true,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Table 7: contact_normalizations**
```typescript
{
  id: serial (PK),
  contactId: text, // Bird Contact ID
  conversationId: text,
  status: varchar(20), // success, needs_review, error
  confidence: real, // 0.0-1.0
  extractedData: jsonb, // { name, phone, email, country }
  before: jsonb, // Contact data before normalization
  after: jsonb, // Contact data after normalization
  errorMessage: text,
  createdAt: timestamp
}
```

### 10.2 API Endpoints Reference

**Production Base URL:** https://api.neero.ai

**Endpoint 1: POST /api/bird (v2.x - DEPRECATED)**
```typescript
// DEPRECATED - Use /api/agent/inbound instead
Request: {
  type: 'image' | 'document' | 'audio',
  mediaUrl: string,
  context: { conversationId, contactName, email? }
}
Response: {
  success: boolean,
  data: Record<string, unknown>,
  type: string,
  model: string,
  processingTime: string
}
```

**Endpoint 2: POST /api/agent/inbound (v3.0+)**
```typescript
Request: AgentInboundRequestSchema {
  context: {
    conversationId: string (uuid),
    contactName?: string,
    contactId?: string,
    channelId?: string
  },
  message?: {
    text?: string,
    attachments?: Array<{
      type: 'image' | 'audio' | 'document' | 'video',
      url: string,
      mimeType?: string
    }>
  }
}

Response: AgentInboundResponseSchema {
  reply: string,
  channelOps?: Array<{
    type: 'sendMessage' | 'sendTemplate' | 'createTicket',
    payload: Record<string, unknown>
  }>,
  status: 'resolved' | 'handover' | 'error' | 'continued',
  handoverReason?: string,
  metadata?: Record<string, unknown>
}
```

**Endpoint 3: POST /api/agent/outbound (PLANNED - Phase 5)**
```typescript
Request: AgentOutboundRequestSchema {
  type: 'reminder_72h' | 'reminder_24h' | 'reminder_3h' | 'followup',
  appointmentId?: string (uuid),
  conversationId?: string (uuid)
}

Response: {
  success: boolean,
  messageSent: boolean,
  timestamp: string
}
```

### 10.3 Tool Specifications

**6+ Tools Implemented:**

**Tool 1: analyzePhoto**
```typescript
Parameters: {
  conversationId: string (uuid),
  checkConsent: boolean (default: true)
}
Response: {
  quality: {
    lighting: 'good' | 'adequate' | 'poor',
    angle: 'good' | 'adequate' | 'poor',
    distance: 'good' | 'adequate' | 'poor',
    focus: 'good' | 'adequate' | 'poor'
  },
  recommendations?: string[],
  consentRequired: boolean
}
```

**Tool 2: transcribeAudio**
```typescript
Parameters: {
  conversationId: string (uuid)
}
Response: {
  transcript: string,
  language: 'es' | 'en',
  model: 'groq-whisper-v3' | 'openai-whisper',
  processingTime: number
}
```

**Tool 3: upsertLead**
```typescript
Parameters: {
  conversationId: string (uuid),
  name?: string,
  phone?: string,
  email?: string,
  country?: string,
  procedureInterest?: string,
  stage?: string
}
Response: {
  leadId: string (uuid),
  created: boolean,
  birdContactUpdated: boolean
}
```

**Tool 4: createTicket**
```typescript
Parameters: {
  conversationId: string (uuid),
  reason: 'pricing' | 'medical_advice' | 'location_outside_coverage' | 'tool_failure',
  summary: string,
  priority: 'low' | 'medium' | 'high' | 'urgent'
}
Response: {
  ticketId: string,
  handoverMessage: string
}
```

**Tool 5: checkServiceWindow**
```typescript
Parameters: {
  conversationId: string (uuid)
}
Response: {
  state: 'open' | 'closed',
  lastInteractionAt?: Date,
  expiresAt?: Date,
  canSendFreeform: boolean
}
```

**Tool 6: sendMessage**
```typescript
Parameters: {
  conversationId: string (uuid),
  text?: string,
  buttons?: Array<{ id, title }>,
  templateName?: string,
  templateParams?: Record<string, string>
}
Response: {
  messageId: string,
  sent: boolean,
  withinServiceWindow: boolean
}
```

### 10.4 Integration Points

**Bird.com Platform:**
- Conversations API: Fetch messages, media URLs (`/conversations/{id}/messages`)
- Contacts API: Update CRM after lead creation (`/contacts/{id}`)
- Channels API: Send messages, templates (`/channels/{id}/messages`)
- Actions: HTTP POST integration (AI Employee → API)
- Environment Variables: Secure secrets in Bird dashboard
- Authentication: `Authorization: AccessKey {BIRD_ACCESS_KEY}`

**Vercel Platform:**
- Edge Functions: Deploy API routes with `runtime = 'edge'`
- AI Gateway: 0% markup, automatic failover, caching
- Environment Variables: Production/preview/development
- Deployment: GitHub integration, automatic builds
- Monitoring: Structured JSON logging → Vercel Logs → Sentry (planned)

**Neon PostgreSQL:**
- Connection: HTTP-based (Edge compatible)
- Extensions: pgvector v0.8.1 for semantic search
- Migrations: Drizzle Kit (`pnpm drizzle-kit push:pg`)
- Schema: `/lib/db/schema.ts` (7 tables)
- Queries: `/lib/db/queries/knowledge.ts` (RAG search)

**AI Services:**
- Gemini: Via Vercel AI Gateway (`@ai-sdk/google`) - 0% markup
- Groq: Direct API (`@ai-sdk/groq`) - Whisper v3 Turbo
- OpenAI: Direct API (`@ai-sdk/openai`) - Whisper fallback
- All: Unified interface via Vercel AI SDK 5.0

### 10.5 Cost Analysis & Projections

**Current Costs (10K images + 10K audio min/month):**
- Images: $1.83/month (90% @ $0.17, 10% @ $0.30)
- Audio: $7.00/month (95% @ $0.67, 5% @ $6.00)
- **Total:** $8.83/month

**EVA AI Employee (1,000 conversations/month):**
- Gemini conversation: $0.75
- Gemini photos: $0.05
- Groq audio: $0.07
- Neon DB: $0.00 (free tier)
- Vercel Edge: $0.00 (free tier)
- **Total:** $0.87/month

**Comparison:**
- Claude Vision alternative: ~$75+/month (89% savings)
- Claude Opus 4 alternative: $150/month (99.4% savings for EVA)

**Projections (10x scale - 100K images + 100K audio min/month):**
- Images: $18.30/month
- Audio: $70.00/month
- **Total:** $88.30/month (still <$100)

**EVA KB Optimization Impact:**
- Current: $4,095/month (9,000 tokens/message)
- Optimized: $2,070/month (3,260 tokens/message)
- Savings: $24,300/year
- Payback: 12 days

### 10.6 Version History

| Version | Date | Changes | Breaking |
|---------|------|---------|----------|
| **3.0.0** | 2025-12-13 | Bird Conversations API integration, auto-detect media type, remove mediaUrl | ✅ YES |
| **2.2.3** | 2025-12-11 | Fixed Bird Actions docs (BUG-001), Task Arguments pattern | ❌ NO |
| **2.2.2** | 2025-12-11 | Media download safety check (25MB limit), timeout adjustments | ❌ NO |
| **2.2.1** | 2025-12-04 | Vercel deployment fixes, .vercelignore added | ❌ NO |
| **2.2.0** | 2025-12-04 | Intelligent image routing, Groq audio transcription | ❌ NO |
| **2.1.0** | 2025-12-03 | Audio transcription with fallback | ❌ NO |
| **2.0.0** | 2025-12-02 | Bird Actions architecture, removed webhooks | ✅ YES |
| **1.0.0** | 2025-11-12 | Initial project setup | N/A |

**See:** `/CHANGELOG.md` for detailed version history (250 lines)

### 10.7 References & Documentation

**Official Documentation:**
- Vercel AI SDK: https://ai-sdk.dev
- Google Gemini: https://ai.google.dev/gemini-api/docs
- Groq: https://groq.com/groqcloud
- Bird: https://bird.com/docs
- Next.js: https://nextjs.org/docs

**Internal Documentation:**
- `/docs/bird/bird-actions-architecture.md` - Bird Actions pattern
- `/docs/bird/bird-ai-employees-setup-guide.md` - Complete setup (45-60 min)
- `/docs/eva-kb-optimization-executive-summary.md` - KB optimization results
- `/docs/development.md` - Local development guide
- `/docs/deployment.md` - Vercel deployment guide
- `/CHANGELOG.md` - Complete version history

**Validation Scripts:**
- `/scripts/validate-f001.ts` - Data Collection (165 lines)
- `/scripts/validate-f002.ts` - Price Inquiry Handover (210 lines)
- `/scripts/validate-f004.ts` - Photo Quality Analysis (160 lines)
- `/scripts/validate-f005.ts` - Audio Transcription (235 lines)
- `/scripts/validate-f006.ts` - Guardrails Compliance (360 lines)

**Validation Reports:**
- `/validation-reports/v1.0-validation-summary.md` - Executive summary (380 lines)

---

**Document Stats:**
- **Lines:** ~850 (within flexibility for PRD complexity)
- **Sections:** 10 core + appendix
- **Tables:** 40+ (LLM-optimized format)
- **Code Blocks:** 15+ (technical specifications)
- **Status:** ACTIVE - Update on every major version change

**Last Review:** 2024-12-24 by Javier Polo
**Next Review:** On v1.0 MVP completion (after F003 implementation)
