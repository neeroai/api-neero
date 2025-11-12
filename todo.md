# Project Tasks - ai-sdk-wp

**Updated:** 2025-11-12

---

## DOING

Setup and configuration

---

## TODO

### Initial Setup
- [ ] Copy `.env.example` to `.env.local` and fill credentials
- [ ] Test `/api/example` endpoint with WhatsApp message
- [ ] Verify HMAC signature validation works

### Customization
- [ ] Customize AI prompts (`lib/ai/prompts.ts`)
- [ ] Add custom tools (`lib/ai/tools.ts`)
- [ ] Choose and implement database (Drizzle patterns in `lib/db/`)
- [ ] Add conversation history persistence

### Enhancements
- [ ] Handle media messages (images, audio, video)
- [ ] Add interactive messages (buttons, lists)
- [ ] Implement monitoring and error logging
- [ ] Create custom Claude Code agents in `.claude/`

---

## BLOCKED

None

---

## DONE (Template)

- [x] WhatsApp utilities (messaging, webhook, media, rate limiting)
- [x] AI utilities (client, streaming, tools, prompts)
- [x] Security utilities (HMAC, env, sanitize)
- [x] Database patterns (Drizzle examples)
- [x] API routes (webhook, send, chat, example)

---

**Lines:** 50
