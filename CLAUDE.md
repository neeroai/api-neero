# CLAUDE.md - ai-sdk-wp Template

**Scope:** Template repository for Vercel AI SDK + WhatsApp Business API projects
**Type:** Configuration-only template (clone and customize)
**Last Updated:** 2025-11-11

---

## 4-Level Hierarchy Reference

This file follows Neero's 4-level configuration hierarchy:

1. **USER** - ~/.claude/CLAUDE.md (personal preferences)
2. **COMPANY** - /Users/mercadeo/neero/CLAUDE.md (Neero standards)
3. **GLOBAL** - /Users/mercadeo/neero/docs-global/ (shared documentation)
4. **PROJECT** - This file (project-specific context)

Load order: USER overrides COMPANY, COMPANY overrides GLOBAL, GLOBAL overrides PROJECT

---

## Project Overview

This is a template repository for projects that integrate:
- Vercel AI SDK for AI-powered conversations
- WhatsApp Business API for messaging

Clone this repo to start a new project with validated configuration.

---

## Tech Stack (Validated Sources)

### Core Framework
- **Next.js 16.0** - App Router, Edge Runtime, Turbopack
- **React 19.2** - Server Components, Suspense
- **TypeScript 5.9** - Strict mode, path aliases
- Source: https://nextjs.org/docs

### AI Integration
- **Vercel AI SDK 5.0** - Streaming, tool calling, structured outputs
- **OpenAI SDK 2.0** - GPT-4 Turbo, function calling
- **Zod 3.23** - Schema validation
- Source: https://sdk.vercel.ai/docs

### WhatsApp Business API
- **API Version:** v23.0 (Cloud API)
- **Features:** Text, interactive messages, media, webhooks
- **Limits:** 1000 free conversations/month
- Source: https://developers.facebook.com/docs/whatsapp/cloud-api

### Development Tools
- **Biome 2.3** - Linter and formatter (replaces ESLint + Prettier)
- **Tailwind CSS 4.1** - Utility-first styling
- **pnpm 9.15** - Fast, efficient package manager

---

## Stack Deviations

None. This template follows Neero standards exactly.

---

## File Structure

```
ai-sdk-wp/
├── .claude/              (empty - add custom agents as needed)
├── app/
│   └── api/              (empty - implement your routes here)
├── lib/
│   └── types/
│       ├── whatsapp.ts   (WhatsApp API types)
│       └── ai.ts         (AI SDK types)
├── public/               (empty - add static assets)
├── .env.example          (copy to .env.local)
├── CLAUDE.md             (this file)
├── README.md             (usage instructions)
├── plan.md               (architecture template)
├── todo.md               (tasks template)
├── prd.md                (requirements template)
└── [config files]
```

---

## Environment Variables

See `.env.example` for complete list. Required variables:

**OpenAI:**
- OPENAI_API_KEY

**WhatsApp:**
- WHATSAPP_TOKEN
- WHATSAPP_PHONE_ID
- WHATSAPP_VERIFY_TOKEN
- WHATSAPP_APP_SECRET

**App:**
- NEXT_PUBLIC_APP_URL

---

## How to Customize

1. Clone this repo: `git clone /Users/mercadeo/neero/ai-sdk-wp your-project`
2. Update package.json name and description
3. Copy .env.example to .env.local and fill in credentials
4. Update CLAUDE.md with your project context
5. Update plan.md with your architecture decisions
6. Implement your routes in app/api/
7. Add your business logic in lib/

---

## For Claude Code

**Rules:**
- This is a template repo. Users clone it to start new projects.
- Do NOT install dependencies here. Users do that after cloning.
- Do NOT create application code. Only configuration and types.
- Follow Neero standards: 100-line limit, NO EMOJIS, ClaudeCode&OnlyMe philosophy
- Validation Protocol: NO INVENTAR - verify with docs-global/

**Directories:**
- /Users/mercadeo/neero/docs-global/platforms/vercel/ - AI SDK documentation
- /Users/mercadeo/neero/docs-global/platforms/whatsapp/ - WhatsApp API documentation

---

## Links

**Documentation:**
- Vercel AI SDK: https://sdk.vercel.ai/docs
- WhatsApp Cloud API: https://developers.facebook.com/docs/whatsapp/cloud-api
- Next.js: https://nextjs.org/docs

**Neero Resources:**
- Global docs: /Users/mercadeo/neero/docs-global/
- Company CLAUDE.md: /Users/mercadeo/neero/CLAUDE.md

---

**Token Tracking:** ~580 tokens | Context: 0.29% of 200K | Lines: 95
