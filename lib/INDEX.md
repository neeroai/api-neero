# lib - Index

Version: 1.0 | Date: 2026-01-07 05:52

## Purpose

Core library for api-neero multimodal API - Cost-optimized Bird.com AI employees backend

## Structure (Subdirectories)

| Directory | Purpose | Key Exports |
|-----------|---------|-------------|
| **ai/** | Image classify/route, transcribe, embeddings | classify, routeImage, transcribe, embed |
| **bird/** | Media download, Zod schemas | downloadMedia, birdSchemas |
| **db/** | Drizzle schema, pgvector semantic search | db, schema, searchKnowledge |
| **agent/tools/** | RAG tool (retrieveKnowledge) | tools, retrieveKnowledge |
| **auth/** | Authentication | authMiddleware |
| **security/** | Security utilities | validateApiKey |
| **utils/** | General utilities | formatters, validators |
| **types/** | TypeScript types | BirdAction, ImageType |
| **normalization/** | Data normalization | normalize |
| **errors/** | Error handling | AppError, errorHandler |

## Dependencies

**Internal:** None (root library)
**External:** Vercel AI SDK, Drizzle ORM, Zod, Gemini, Groq
**Used by:** /app/api/bird (main entrypoint)

## Critical Patterns

- **9-second timeout** on all operations (CRITICAL)
- **Image routing pipeline:** Classify (2s) → Route (<10ms) → Process (4-5.5s)
- **RAG architecture:** pgvector HNSW, 0.65 similarity threshold
- **Edge Runtime only:** Web APIs, NO Node.js APIs
- **Cost optimization:** Gemini 2.0 Flash (89% cheaper than Claude)

## Environment Variables

- `AI_GATEWAY_API_KEY` (required) - Vercel AI Gateway (Gemini)
- `GROQ_API_KEY` (required) - Groq Whisper v3
- `OPENAI_API_KEY` (optional) - OpenAI Whisper fallback
- `BIRD_ACCESS_KEY` (optional) - Bird CDN auth
- `NEERO_API_KEY` (optional) - Custom API key

## Quick Start

```typescript
// Image processing
import { classify, routeImage } from '@/lib/ai';
const type = await classify(imageUrl);
const model = routeImage(type);

// RAG search
import { searchKnowledge } from '@/lib/db';
const results = await searchKnowledge(query, threshold);

// Bird Actions
import { downloadMedia } from '@/lib/bird';
const buffer = await downloadMedia(url);
```
