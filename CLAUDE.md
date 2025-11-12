# CLAUDE.md - ai-sdk-wp Template

**Scope:** Full-featured starter kit for Vercel AI SDK + WhatsApp Business API projects
**Type:** Clone and customize for production use
**Last Updated:** 2025-11-12

---

## 4-Level Hierarchy

Load order: USER → COMPANY → GLOBAL → PROJECT
1. USER: ~/.claude/CLAUDE.md
2. COMPANY: /Users/mercadeo/neero/CLAUDE.md
3. GLOBAL: /Users/mercadeo/neero/docs-global/
4. PROJECT: This file

---

## Project Overview

Full-featured template integrating:
- Vercel AI SDK 5.0 (streaming, tool calling, structured outputs)
- WhatsApp Business API v23.0 (Cloud API)
- Complete utilities for production deployment

Clone this repo to start a new AI+WhatsApp project with validated configuration.

---

## Tech Stack

**Core:** Next.js 16 + React 19 + TypeScript 5.9 + Vercel Edge Runtime
**AI:** Vercel AI SDK 5.0 + OpenAI SDK 2.0 + Zod 3.23
**WhatsApp:** Cloud API v23.0 (text, interactive, media, webhooks)
**Dev Tools:** Biome 2.3 + Tailwind CSS 4.1 + pnpm 9.15

**Sources:**
- https://sdk.vercel.ai/docs
- https://developers.facebook.com/docs/whatsapp/cloud-api
- https://nextjs.org/docs

---

## Stack Deviations

None. Template follows Neero standards exactly.

---

## File Structure

```
ai-sdk-wp/
├── app/api/               (webhook, send, chat, example)
├── lib/
│   ├── whatsapp/          (messaging, webhook, media, rate-limit)
│   ├── ai/                (client, streaming, tools, prompts, context)
│   ├── security/          (crypto, env, sanitize)
│   ├── db/                (drizzle examples)
│   └── types/             (whatsapp.ts, ai.ts)
├── docs/                  (complete project documentation)
├── .env.example
└── [tracking files]
```

---

## Environment Setup

Copy `.env.example` to `.env.local` and configure:

```bash
OPENAI_API_KEY=sk-...
WHATSAPP_TOKEN=...
WHATSAPP_PHONE_ID=...
WHATSAPP_VERIFY_TOKEN=...
WHATSAPP_APP_SECRET=...
NEXT_PUBLIC_APP_URL=https://...
```

See `.env.example` for complete list with descriptions.

---

## Quick Start

```bash
git clone /Users/mercadeo/neero/ai-sdk-wp your-project
cd your-project
cp .env.example .env.local   # Fill in credentials
pnpm install
pnpm dev                      # Test /api/example
```

Update: package.json, CLAUDE.md, prd.md, plan.md

---

## For Claude Code

**Template Rules:**
- Full-featured starter kit (NOT configuration-only)
- All implementations completed (utilities + API routes)
- Users customize for specific use cases
- NO INVENTAR: Validate with docs-global/platforms/vercel/ and /whatsapp/
- Line limits: CLAUDE.md ≤100, prd.md ≤100, plan.md ≤50, todo.md ≤50
- See /docs for detailed guides

**Philosophy:** ClaudeCode&OnlyMe (2-person team, no enterprise bloat)

---

**Token Tracking:** ~420 tokens | Context: 0.21% of 200K | Lines: 100
