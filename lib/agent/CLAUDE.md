---
title: "Agent Orchestration - Semantic Map"
summary: "Agent tools and orchestration: guardrails, consent management, RAG (retrieveKnowledge), prompts."
description: "Agent tools and conversation management"
version: "1.0"
date: "2026-01-18"
updated: "2026-01-18 22:31"
tags: ["agent","tools","rag","orchestration"]
scope: "project"
module: "lib/agent"
---

## Purpose

Agent tools and conversation management

**IMPORTANT**: This is a semantic map of the `lib/agent/` codebase. All files are documented with @file headers. Claude Code should read this map to understand the module structure without exploring individual files.

---

## Files (Auto-generated from headers)

| File | @file | @exports | Lines |
|------|-------|----------|-------|
| consent.ts | Consent | checkConsent, getConsentRequestMessage, getLeadConsents, recordConsent, requiresConsentRequest, revokeConsent | 164 |
| conversation.ts | Conversation | markForHandover, reconstructContext, requiresHandover, saveMessage, updateConversationState | 164 |
| guardrails.ts | Guardrails | auditConversation, extractMetadata, getSafeFallback, validateResponse | 399 |
| prompts/eva-system.ts | Eva System Prompt | EVA_SYSTEM_PROMPT | 201 |
| tools/crm.ts | Crm | upsertLeadTool | 159 |
| tools/handover.ts | Handover | createTicketTool, executeHandover | 104 |
| tools/media.ts | Media | analyzePhotoTool, extractDocumentTool, transcribeAudioTool | 285 |
| tools/retrieve-knowledge.ts | Retrieve Knowledge | retrieveKnowledgeTool | 125 |
| tools/whatsapp.ts | Whatsapp | sendMessageTool | 163 |
| types.ts | Types | AgentInboundRequest, AgentInboundRequestSchema, AgentInboundResponse, AgentInboundResponseSchema, AgentOutboundRequest, AgentOutboundRequestSchema, ConsentType, ConversationContext, ConversationContextSchema, GuardrailsValidation, GuardrailsValidationSchema, MediaAnalysisRequest, MediaAnalysisRequestSchema, MediaAnalysisResponse, MediaAnalysisResponseSchema, MessageMetadata, MessageMetadataSchema, ServiceWindowStatus, ServiceWindowStatusSchema, ToolCallResult, ToolCallResultSchema | 207 |

**Read headers**: All files have complete @file/@description/@module/@exports headers. Read file headers before reading full file contents.

---

## Quick Start

```typescript
// Import from module
import { ... } from '@/lib/agent';

// Basic usage example
// TODO: Add specific usage examples
```



---

**Token Budget**: ~522 tokens
**Last Updated**: 2026-01-18
