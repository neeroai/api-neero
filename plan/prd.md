# PRD - Cost-Optimized Multimodal API for Bird.com

**Version:** 2.2.3 | **Updated:** 2025-12-11

---

## Executive Summary

Cost-optimized multimodal API for Bird.com AI employees with intelligent image routing. Processes images, documents, and audio from WhatsApp. Returns structured responses in MAX 9 seconds.

**Cost:** 89% cheaper than Claude-based alternatives (~$8.40 vs ~$75+ monthly)
**AI Stack:** Vercel AI Gateway (vision) + Groq directo (audio)

---

## Business Goals

1. Process visual content (ID docs, cedulas, invoices, clothing, products)
2. Intelligently route images to optimal model for cost/accuracy
3. Extract text from PDFs and scanned documents
4. Transcribe voice notes (Spanish primary)
5. Respond within 9 seconds or return error

---

## Target Users

**Primary:** Corporate clients (banks, retail, logistics) using Bird AI employees
**Use Cases:** Customer onboarding (KYC), invoice processing, product identification

---

## Technical Stack

**AI Vision (via AI Gateway):**
- Model: `google/gemini-2.0-flash`, `google/gemini-2.5-flash`
- Endpoint: `https://ai-gateway.vercel.sh/v1`
- Features: 0% markup, automatic failover, single API key

**AI Audio (directo):**
- Model: Groq Whisper Large v3
- Endpoint: Groq API directo
- Reason: AI Gateway no soporta `/audio/transcriptions`

**Infrastructure:**
- Vercel Edge Runtime (128MB, 9s timeout)
- Synchronous processing (no background jobs)

---

## Environment Variables

| Variable | Required | Uso |
|----------|----------|-----|
| `AI_GATEWAY_API_KEY` | Yes | Gemini via AI Gateway |
| `GROQ_API_KEY` | Yes | Whisper audio transcription |
| `BIRD_ACCESS_KEY` | Maybe | Si Bird CDN requiere auth |
| `NEERO_API_KEY` | No | API authentication |

---

## Core Features

### 1. Intelligent Image Routing

**Classification Types:**
| Type | Model | Timeout | Use Case |
|------|-------|---------|----------|
| photo | google/gemini-2.0-flash | 4s | People, objects, scenes |
| invoice | google/gemini-2.0-flash | 5s | Invoices, receipts |
| document | google/gemini-2.5-flash | 5.5s | Cedulas, contracts |
| unknown | google/gemini-2.5-flash | 5.5s | Fallback (complex) |

**Two-Stage Pipeline:**
1. Stage 1: Classify image type (~1-2s)
2. Stage 2: Process with optimal model (~4-5.5s)

### 2. Image Processing (AI Gateway → Gemini)
- ID documents: Extract name, ID number, expiry date
- Invoices/receipts: Extract totals, items, dates, tax
- Clothing/products: Describe, categorize

### 3. Document Processing (AI Gateway → Gemini PDF)
- Multi-page PDF extraction (first 2 pages if timeout risk)
- Scanned document OCR

### 4. Audio Processing (Groq via AI SDK)
- Voice note transcription (Spanish primary)
- 228x realtime processing
- Cost: $0.04/hour = $0.67/1K minutes (9x cheaper than OpenAI)
- OpenAI Whisper fallback ($0.36/hour)
- Budget-aware timeout management

### 5. Text Post-Processing (NEW - Groq)
- Transcript normalization (punctuation, formatting)
- Audio intent classification (question, command, statement)
- Spanish language corrections
- Model: llama-3.1-8b-instant ($0.05/1M input)
- Feature-flagged (optional)

### 6. Bird Actions Integration
- HTTP POST from Bird AI Employees
- Optional API key authentication
- 9-second timeout enforcement with budget tracking

### 7. Research Validation (Phase 5.4)
- Comprehensive model selection research completed
- Validated Groq Whisper + Gemini Flash as optimal for LATAM
- Confirmed 83-88% cost savings vs Claude/OpenAI alternatives
- Groq vision models evaluated (not production-ready)
- Current implementation validated as near-optimal

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Classification accuracy | >90% |
| Response time | <9s (8.5s internal) |
| Error rate | <1% |
| Cost per request | <$0.0005 |

---

## File Size Limits

- Images: 5MB max
- Audio: 25MB max
- PDFs: 10MB recommended

---

**Lines:** 105
