# Project Tasks - ai-sdk-wp Template

**Last Updated:** [Date]

---

## DOING

- Setup and configuration

---

## TODO

### High Priority - Initial Setup
- [ ] Copy .env.example to .env.local
- [ ] Fill in OpenAI API key
- [ ] Fill in WhatsApp credentials (Token, Phone ID, App Secret, Verify Token)
- [ ] Test /api/example endpoint with WhatsApp message
- [ ] Verify webhook signature validation works

### Medium Priority - Customization
- [ ] Review and customize AI prompts in lib/ai/prompts.ts
- [ ] Add custom tools in lib/ai/tools.ts for your use case
- [ ] Decide on database solution (Drizzle patterns ready in lib/db/)
- [ ] Customize message handling in /api/example/route.ts
- [ ] Add conversation history persistence

### Low Priority - Enhancements
- [ ] Handle media messages (images, audio, video)
- [ ] Add interactive messages (buttons, lists)
- [ ] Implement rate limiting monitoring
- [ ] Add error logging and monitoring
- [ ] Create custom Claude Code agents in .claude/

---

## BLOCKED

None

---

## DONE (Template Completed)

- [x] WhatsApp utility libraries created (messaging, webhook, media, rate limiting)
- [x] AI utility libraries created (OpenAI client, streaming, tools, prompts)
- [x] Security utilities created (HMAC validation, env validation, sanitization)
- [x] Database patterns created (Drizzle examples for conversations and users)
- [x] API routes created (webhook, send, chat, example)

---

## Notes

- Keep this file updated as you work
- Move tasks between sections
- Archive older DONE tasks when list grows
- Add blockers immediately when encountered
