---
title: "Database Layer - Semantic Map"
summary: "Database schema and client for Neon PostgreSQL with pgvector. Drizzle ORM, semantic search."
description: "Database schema and query utilities"
version: "1.0"
date: "2026-01-18"
updated: "2026-01-18 22:31"
tags: ["database","postgresql","pgvector","drizzle"]
scope: "project"
module: "lib/db"
---

## Purpose

Database schema and query utilities

**IMPORTANT**: This is a semantic map of the `lib/db/` codebase. All files are documented with @file headers. Claude Code should read this map to understand the module structure without exploring individual files.

---

## Files (Auto-generated from headers)

| File | @file | @exports | Lines |
|------|-------|----------|-------|
| client.ts | Client | db, sql | 60 |
| queries/knowledge.ts | Knowledge | KnowledgeSearchResult, deactivateKnowledge, getKnowledgeById, insertKnowledge, insertKnowledgeBatch, searchKnowledge, updateKnowledge | 251 |
| schema.ts | Schema | Appointment, Consent, ContactNormalization, ConversationState, Lead, MedicalKnowledge, MessageLog, NewAppointment, NewConsent, NewContactNormalization, NewConversationState, NewLead, NewMedicalKnowledge, NewMessageLog, appointments, consents, contactNormalizations, conversationState, leads, medicalKnowledge, messageLogs | 185 |

**Read headers**: All files have complete @file/@description/@module/@exports headers. Read file headers before reading full file contents.

---

## Quick Start

```typescript
// Import from module
import { ... } from '@/lib/db';

// Basic usage example
// TODO: Add specific usage examples
```



---

**Token Budget**: ~329 tokens
**Last Updated**: 2026-01-18
