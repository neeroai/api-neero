---
title: "Bird CRM Client - Semantic Map"
summary: "Bird.com CRM integration: contacts, conversations, messages, media download, handover, service windows."
description: "Client library for Bird CRM API integration"
version: "1.0"
date: "2026-01-18"
updated: "2026-01-19 11:45"
tags: ["bird-crm","client","api-integration"]
scope: "project"
module: "lib/bird"
---

## Purpose

Client library for Bird CRM API integration

**IMPORTANT**: This is a semantic map of the `lib/bird/` codebase. All files are documented with @file headers. Claude Code should read this map to understand the module structure without exploring individual files.

---

## Files (Auto-generated from headers)

| File | @file | @exports | Lines |
|------|-------|----------|-------|
| client.ts | Client | birdFetch | 53 |
| contacts.ts | Bird Contacts API | BirdContact, BirdContactUpdate, addEmailIdentifier, fetchContactById, listAllContacts, searchContactByPhone, updateContact, updateIdentifierSubscription | 221 |
| conversations.ts | Bird Conversations API functions | findConversationByPhone, getConversationMessages | 97 |
| env.ts | Env | BIRD_API_BASE, getBirdConfig, getOptionalChannelId, getWebhookSecret | 66 |
| fetch-latest-media.ts | Bird Conversations API - Media Extraction | ExtractedMedia, fetchLatestMediaFromConversation | 203 |
| handover.ts | Handover | HandoverPayload, notifyHandover | 62 |
| leads.ts | Leads | LeadPayload, registerLead | 72 |
| media.ts | Bird Media Download | bufferToBase64, downloadMedia, getMimeType | 147 |
| messages.ts | Messages | SendTemplateParams, SendTextParams, sendTemplateMessage, sendTextMessage | 133 |
| service-window.ts | Service Window | ServiceWindowResult, ServiceWindowState, checkServiceWindow | 64 |
| types.ts | Bird Actions API Types | AudioData, AudioDataSchema, BirdActionContext, BirdActionContextSchema, BirdActionErrorResponse, BirdActionErrorResponseSchema, BirdActionRequest, BirdActionRequestSchema, BirdActionResponse, BirdActionResponseSchema, BirdActionSuccessResponse, BirdActionSuccessResponseSchema, BirdContact, BirdContactAttributes, BirdContactIdentifier, BirdContactUpdate, BirdConversation, BirdConversationParticipant, BirdConversationsResponse, BirdMessage, BirdMessageBody, BirdMessagesResponse, ContactUpdateErrorCode, ContactUpdateErrorCodeSchema, ContactUpdateErrorResponse, ContactUpdateErrorResponseSchema, ContactUpdateRequest, ContactUpdateRequestSchema, ContactUpdateResponse, ContactUpdateResponseSchema, ContactUpdateSuccessResponse, ContactUpdateSuccessResponseSchema, DocumentData, DocumentDataSchema, ErrorCode, ErrorCodeSchema, ImageData, ImageDataSchema, MediaType, MediaTypeSchema, ResponseData, ResponseDataSchema, isErrorResponse, isSuccessResponse | 375 |

**Read headers**: All files have complete @file/@description/@module/@exports headers. Read file headers before reading full file contents.

---

## Quick Start

```typescript
// Import from module
import { ... } from '@/lib/bird';

// Basic usage example
// TODO: Add specific usage examples
```



---

**Token Budget**: ~730 tokens
**Last Updated**: 2026-01-19
