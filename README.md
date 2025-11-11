# ai-sdk-wp Template

Template repository for building AI-powered WhatsApp bots using Vercel AI SDK and WhatsApp Business API.

---

## Purpose

This is a configuration-only template that provides:
- Validated tech stack for AI + WhatsApp integration
- Type-safe TypeScript configuration
- Production-ready project structure
- Neero company standards compliance

Clone this repo to start a new AI WhatsApp project in minutes instead of hours.

---

## What's Included

### Utility Libraries
- **lib/whatsapp/** - Complete WhatsApp API integration (messaging, webhooks, media, rate limiting)
- **lib/ai/** - OpenAI client, streaming, tools, prompts, context management
- **lib/security/** - HMAC validation, env validation, input sanitization (Edge Runtime)
- **lib/db/** - Drizzle ORM patterns for conversations and users
- **lib/types/** - Complete TypeScript types for WhatsApp & AI SDK

### API Routes (Working Examples)
- **app/api/whatsapp/webhook/** - Webhook handler (verification + message receiving)
- **app/api/whatsapp/send/** - Send messages (text, buttons, lists)
- **app/api/chat/** - AI chat endpoint with streaming
- **app/api/example/** - Complete echo bot example with tool calling

### Configuration
- Edge Runtime compatible (Web Crypto API)
- Environment variables pre-configured
- TypeScript strict mode with path aliases
- Biome for linting and formatting
- Vercel deployment ready

---

## Quick Start

### 1. Clone this template

```bash
cd /Users/mercadeo/neero
git clone ai-sdk-wp your-project-name
cd your-project-name
```

### 2. Initialize as new repo

```bash
rm -rf .git
git init
git add .
git commit -m "feat: initial commit from ai-sdk-wp template"
```

### 3. Install dependencies

```bash
pnpm install
```

### 4. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

### 5. Start development

```bash
pnpm dev
```

---

## Stack Overview

**Runtime:** Next.js 16 + React 19 + TypeScript 5.9
**AI:** Vercel AI SDK 5.0 + OpenAI 2.0
**Messaging:** WhatsApp Business API v23.0
**Styling:** Tailwind CSS 4.1
**Tooling:** Biome 2.3 + pnpm 9.15

All dependencies are pinned to validated versions.

---

## Directory Structure

```
your-project/
├── app/api/              API routes (webhook, send, chat, example)
│   ├── chat/            AI streaming endpoint
│   ├── example/         Complete echo bot example
│   └── whatsapp/        Webhook + send message routes
├── lib/
│   ├── ai/              OpenAI client, streaming, tools, prompts
│   ├── db/              Drizzle ORM examples (conversation, user)
│   ├── security/        HMAC validation, env, sanitization
│   ├── types/           TypeScript types (WhatsApp, AI SDK)
│   └── whatsapp/        Messaging, webhook, media, rate limiting
├── .claude/             Add custom Claude Code agents
├── public/              Static assets
└── [config files]       Pre-configured, ready to use
```

---

## Next Steps

After cloning and setup:

1. **Test the example bot** - Send a message to your WhatsApp number to test `/api/example`
2. **Customize for your use case:**
   - Add custom tools in `lib/ai/tools.ts`
   - Modify prompts in `lib/ai/prompts.ts`
   - Add conversation persistence using `lib/db/` patterns
   - Handle media messages with `lib/whatsapp/media.ts`
3. **Update project files:**
   - `plan.md` - Your architecture decisions
   - `todo.md` - Implementation tasks
   - `prd.md` - Product requirements
4. **Deploy to Vercel** - See `.env.example` for webhook configuration

See CLAUDE.md for detailed project context and guidelines.

---

## Resources

**Documentation:**
- Vercel AI SDK: https://sdk.vercel.ai/docs
- WhatsApp Cloud API: https://developers.facebook.com/docs/whatsapp/cloud-api
- Next.js: https://nextjs.org/docs

**Neero Standards:**
- Global docs: /Users/mercadeo/neero/docs-global/
- Company CLAUDE.md: /Users/mercadeo/neero/CLAUDE.md

---

**Version:** 1.0.0 | **Last Updated:** 2025-11-11 | **Lines:** 149
