# PRD - ai-sdk-wp Template

**Version:** 1.0.0 | **Updated:** 2025-11-12

---

## Executive Summary

Generic PRD for AI-powered WhatsApp assistants. Template provides complete utilities for WhatsApp messaging, OpenAI integration, and Edge Runtime deployment.

---

## Business Goals

1. Automate customer interactions via WhatsApp
2. Provide instant AI responses 24/7
3. Scale without adding headcount
4. Reduce response time to seconds

---

## Target Users

**Primary:** End users interacting with assistant (need instant answers, prefer WhatsApp)
**Secondary:** Operators managing assistant (monitor, customize, analyze)

---

## Core Features (Pre-Built)

### 1. WhatsApp Message Handling
Webhook with HMAC validation, deduplication, rate limiting
**Files:** `/api/whatsapp/webhook`, `lib/whatsapp/`

### 2. AI-Powered Responses
OpenAI with streaming and tool calling
**Files:** `/api/chat`, `/api/example`, `lib/ai/`

### 3. Tool/Function Calling
AI executes functions (getCurrentTime example)
**Files:** `lib/ai/tools.ts`

### 4. Security & Validation
Env validation, HMAC verification, sanitization
**Files:** `lib/security/` (Edge compatible)

### 5. Database Patterns
Conversation/user persistence examples
**Files:** `lib/db/` (Drizzle ORM)

---

## User Flow

1. User sends WhatsApp message
2. Webhook validates (HMAC, dedup)
3. Rate limiter processes
4. AI generates response (streaming/tools)
5. Response sent (< 5 sec)

---

## Technical Stack

**AI:** GPT-4o-mini/4o, streaming (`/api/chat`), tools (`lib/ai/tools.ts`), temp 0.7
**WhatsApp:** v23.0 Cloud API, text/buttons/lists, HMAC-SHA256, 250 msg/sec, 60s dedup
**Performance:** < 5 sec response, Edge Runtime, auto-scaling
**Security:** Env validation, HMAC, sanitization, HTTPS, no secret logs

---

## Success Metrics

- Response Time: < 5 sec avg
- Availability: 99.9%
- Satisfaction: Feedback-based
- Completion: % resolved without human
- Errors: < 1%

---

## Customization Checklist

1. Prompts: `lib/ai/prompts.ts`
2. Tools: `lib/ai/tools.ts`
3. Database: `lib/db/`
4. Message logic: `/api/example`
5. Monitoring: Add tracking

---

**Lines:** 100
