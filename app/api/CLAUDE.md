---
title: "API Routes - Semantic Map"
summary: "Next.js 16 Edge Runtime API routes: /bird (main), /test-*, /embeddings. <9s timeout."
description: "API route handlers for all endpoints"
version: "1.0"
date: "2026-01-18"
updated: "2026-01-19 11:45"
tags: ["api","routes","edge-runtime","next.js"]
scope: "project"
module: "app/api"
---

## Purpose

API route handlers for all endpoints

**IMPORTANT**: This is a semantic map of the `app/api/` codebase. All files are documented with @file headers. Claude Code should read this map to understand the module structure without exploring individual files.

---

## Files (Auto-generated from headers)

| File | @file | @exports | Lines |
|------|-------|----------|-------|
| agent/inbound/route.ts | Route | POST, runtime | 244 |
| agent/route.ts | Route | POST, runtime | 287 |
| bird/health/route.ts | Bird Actions Health Check Endpoint | GET, runtime | 94 |
| bird/route.ts | Bird Actions API Endpoint v3.0 | POST, runtime | 344 |
| contacts/update/route.ts | POST /api/contacts/update | POST, runtime | 285 |

**Read headers**: All files have complete @file/@description/@module/@exports headers. Read file headers before reading full file contents.

---

## Quick Start

```typescript
// Import from module
import { ... } from '@/app/api';

// Basic usage example
// TODO: Add specific usage examples
```



---

**Token Budget**: ~269 tokens
**Last Updated**: 2026-01-19
