# Bird.com Integration Documentation

**Last Updated**: 2026-01-22
**Current Version**: v3.0 (multimodal with auto-detection)

---

## Quick Start

**Operators (UI Configuration)**:
- [Bird Multimodal AI Employee - Configuration Guide](./bird-multimodal-config-guide.md) - Complete step-by-step setup with screenshots (45-60 min)

**Developers (API Integration)**:
- [HTTP Request Variables Analysis](./bird-http-request-variables-analysis.md) - Context variables technical analysis
- [Context Variables - Real Data](./BIRD-CONTEXT-VARIABLES-REAL-DATA.md) - API validation data reference

---

## Overview

Complete documentation for Bird.com multimodal API integration using v3.0 architecture.

**Integration Pattern**: Bird AI Employees call our API via **HTTP Actions** (not webhooks).

**Key Features v3.0**:
- Zero arguments required (fully automatic)
- Auto-detects media type from conversation
- Extracts media URL automatically via Bird Conversations API
- < 9 second response time
- 89% cost reduction (Gemini 2.0/2.5 Flash vs Claude alternatives)

---

## Active Documentation

### Primary Guide (v3.0)

**[bird-multimodal-config-guide.md](./bird-multimodal-config-guide.md)** - Complete configuration guide
- Step-by-step UI configuration (45-60 min)
- Zero arguments setup
- Troubleshooting section
- v3.0 migration guide
- Performance benchmarks and cost analysis
- 11 screenshots referenced

### Technical Reference

**[bird-http-request-variables-analysis.md](./bird-http-request-variables-analysis.md)** - Context variables analysis
- v3.0 architecture documentation
- Variable mapping patterns
- Request/response schemas

**[BIRD-CONTEXT-VARIABLES-REAL-DATA.md](./BIRD-CONTEXT-VARIABLES-REAL-DATA.md)** - API validation data
- Real conversation data examples
- Message structure references

### API Documentation

**[bird-conversation-api-analysis.md](./bird-conversation-api-analysis.md)** - Conversations API capabilities
- v3.0 integration patterns
- Message retrieval endpoints

**[bird-conversations-api-capabilities.md](./bird-conversations-api-capabilities.md)** - API reference
- Available endpoints
- Authentication methods

**[bird-whatsapp-message-structures.md](./bird-whatsapp-message-structures.md)** - Message schemas
- WhatsApp message types
- Media structure examples

### Specialized Features

**[eva-contact-update-setup.md](./eva-contact-update-setup.md)** - Contact update Action (v2.0)
- Name cleaning, email validation
- 15-20 min setup guide

---

## Architecture v3.0

### Flow Diagram

```
WhatsApp User → Bird.com → Bird AI Employee
                                  ↓
                         Triggers HTTP Action
                         Body: { context: { conversationId: "..." } }
                                  ↓
                    POST /api/bird (our API)
                                  ↓
           Fetch media from conversation (Bird Conversations API)
                                  ↓
                    Download media from URL
                                  ↓
               ┌──────────────────┼──────────────────┐
               ↓                  ↓                  ↓
        Gemini 2.0 Flash    Gemini 2.5 Flash   Groq Whisper v3
         (simple images)     (complex docs)        (audio)
               ↓                  ↓                  ↓
               └──────────────────┼──────────────────┘
                                  ↓
                      Return JSON response
                                  ↓
                       Bird AI Employee
                                  ↓
               Continue conversation with data
                                  ↓
                          Bird.com → WhatsApp User
```

### Key Constraints

1. **Response Time**: < 9 seconds (synchronous JSON response)
2. **Edge Runtime**: Web APIs only, no Node.js
3. **Authentication**: Optional API key (NEERO_API_KEY)
4. **Media Auth**: BIRD_ACCESS_KEY required for Conversations API
5. **File Limits**: 5MB images, 25MB audio (WhatsApp constraints)

---

## Implementation Files

| File | Purpose |
|------|---------|
| `app/api/bird/route.ts` | Unified Actions endpoint (v3.0) |
| `lib/bird/fetch-latest-media.ts` | Media extraction from conversation |
| `lib/bird/types.ts` | Zod schemas for Actions |
| `lib/bird/media.ts` | CDN downloads with auth |
| `lib/ai/pipeline.ts` | Image classification and routing |
| `lib/ai/transcribe.ts` | Audio transcription (Groq/OpenAI) |
| `app/api/bird/health/route.ts` | Health check endpoint |

---

## Environment Variables

```bash
# AI Services (REQUIRED)
AI_GATEWAY_API_KEY=xxx      # Vercel AI Gateway (Gemini models)
GROQ_API_KEY=xxx            # Groq Whisper v3

# Bird Integration (REQUIRED for v3.0)
BIRD_ACCESS_KEY=xxx         # Bird Conversations API auth
BIRD_WORKSPACE_ID=xxx       # Bird workspace identifier

# Optional
OPENAI_API_KEY=xxx          # OpenAI Whisper fallback
NEERO_API_KEY=xxx           # Custom API key for Actions
```

**Removed in v3.0**: `BIRD_SIGNING_KEY` (HMAC not needed for Actions)

---

## Cost Analysis (v3.0)

**Per 1,000 operations**:
- Gemini 2.0 Flash (simple images): $0.17
- Gemini 2.5 Flash (complex docs): $0.35
- Groq Whisper v3 (audio): $0.01 (free tier)
- **Total**: ~$0.53 per 1K requests

**vs Claude Sonnet 4.5**: 89% cheaper ($24.67 → $2.43 per 1K operations)

---

## Archived Documentation

See [archived-docs/README.md](./archived-docs/README.md) for obsolete documentation:
- **v1-webhook-patterns/**: Webhook-based integration (not used)
- **v1-v2-actions/**: Early Actions pattern (v1.0 - v2.0, superseded by v3.0)

**Why Archived**:
- v3.0 breaking changes: zero arguments, auto-detection
- Webhook patterns replaced by HTTP Actions
- Simplified configuration reduces setup time by 50%

---

## Migration from v1.0/v2.0

See [bird-multimodal-config-guide.md](./bird-multimodal-config-guide.md) Appendix A for complete migration guide.

**Key Changes**:
1. Remove all arguments (mediaUrl, mediaType, etc.)
2. Use `{{context.conversation.id}}` only
3. Configure BIRD_ACCESS_KEY environment variable
4. Test with real media attachments

---

## Support

**Internal**:
- Primary guide: [bird-multimodal-config-guide.md](./bird-multimodal-config-guide.md)
- Technical issues: [email protected]

**External**:
- Bird Documentation: https://bird.com/docs
- Bird Actions: https://docs.bird.com/applications/ai-features/ai/concepts/ai-flow-actions
- Gemini API: https://ai.google.dev/docs
- Groq API: https://console.groq.com/docs

---

**Lines**: 150 | **Token Budget**: ~600 tokens
