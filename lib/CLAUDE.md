---
title: "Core Library - Semantic Map"
summary: "Core library modules for api-neero: AI processing, Bird CRM integration, database, normalization, agent tools"
description: "Root library containing all core modules"
version: "1.0"
date: "2026-01-18"
updated: "2026-01-19 11:45"
tags: ["library","core","api-neero"]
scope: "project"
module: "lib"
---

## Purpose

Root library containing all core modules

**IMPORTANT**: This is a semantic map of the `lib/` codebase. All files are documented with @file headers. Claude Code should read this map to understand the module structure without exploring individual files.

---



---

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


---

## Critical Patterns

- **9-second timeout** on all operations (CRITICAL)
- **Image routing pipeline:** Classify (2s) → Route (<10ms) → Process (4-5.5s)
- **RAG architecture:** pgvector HNSW, 0.65 similarity threshold
- **Edge Runtime only:** Web APIs, NO Node.js APIs
- **Cost optimization:** Gemini 2.0 Flash (89% cheaper than Claude)

---

**Token Budget**: ~269 tokens
**Last Updated**: 2026-01-19
