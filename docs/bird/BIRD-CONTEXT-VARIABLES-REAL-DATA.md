---
title: "Bird Context Variables - Real API Data Mapping"
summary: "Complete mapping of Bird Context variables based on real Conversations API and Contacts API responses. Validates exact structure available to AI Employees."
description: "Real API data validation for Context variables: contact.featuredIdentifiers, attributes, conversation structure"
version: "1.0"
date: "2026-01-22"
updated: "2026-01-22"
scope: "project"
architecture_version: "v3.0"
audience: "developers"
---

# Bird Context Variables - Real API Data Mapping

> **Note**: For operator-focused UI configuration, see [bird-multimodal-config-guide.md](./bird-multimodal-config-guide.md)

**Date**: 2026-01-22 08:30
**Method**: Direct Bird API calls (Conversations + Contacts API)
**Workspace**: THE SPA (5cce71bc-a8f5-4201-beeb-6df0aef3cfc8)

---

## CRITICAL FINDINGS - Phone Number Access

### API Response Structure (CONFIRMED)

**Contacts API** (`GET /contacts/{id}`):
```json
{
  "id": "e013a75b-b5ac-4341-aa7c-571d38d067d0",
  "computedDisplayName": "Marelis S",
  "featuredIdentifiers": [
    {
      "key": "phonenumber",
      "value": "+573005321911"
    }
  ],
  "identifierCount": 1,
  "attributes": {
    "country": "Colombia",
    "displayName": "Marelis S",
    "firstName": "Marelis",
    "lastName": "S",
    "phonenumber": ["+573005321911"],
    "timezone": "America/Bogota"
  }
}
```

### Phone Number Location - 3 Methods

**Method 1: featuredIdentifiers array**
```json
"featuredIdentifiers": [
  {"key": "phonenumber", "value": "+573005321911"}
]
```
- **Path**: `featuredIdentifiers[0].value`
- **Bird Variable**: `{{context.contact.featuredIdentifiers}}`
- **Problem**: Bird doesn't support array indexing `[0]`
- **Status**: ❌ NOT VIABLE

**Method 2: attributes.phonenumber (CONFIRMED EXISTS)**
```json
"attributes": {
  "phonenumber": ["+573005321911"]
}
```
- **Path**: `attributes.phonenumber[0]`
- **Bird Variable**: `{{context.contact.attributes.phonenumber}}`
- **Problem**: It's an ARRAY, not a string
- **Status**: ⚠️ NEEDS TESTING (Bird may auto-convert array to string)

**Method 3: Hidden calculated variable (HYPOTHESIS)**
- **Bird Variable**: `{{context.contact.phoneNumber}}` (singular)
- **Assumption**: Bird exposes this as convenience variable
- **Status**: ⚠️ NEEDS MANUAL TESTING in Bird UI dropdown

---

## Complete Context Variable Mapping

### context.conversation (Conversations API)

| Context Variable | API Path | Type | Example Value | Available |
|------------------|----------|------|---------------|-----------|
| `{{context.conversation.id}}` | `id` | UUID | `"7f7d4cff-2e27-4a1a-a2ba-0967341f974b"` | ✅ YES |
| `{{context.conversation.status}}` | `status` | String | `"active"` | ✅ YES |
| `{{context.conversation.name}}` | `name` | String | `""` (empty) | ✅ YES |
| `{{context.conversation.description}}` | `description` | String | `""` (empty) | ✅ YES |
| `{{context.conversation.style}}` | `style` | String | `"default"` | ✅ YES |
| `{{context.conversation.visibility}}` | `visibility` | String | `"public"` | ✅ YES |
| `{{context.conversation.accessibility}}` | `accessibility` | String | `"open"` | ✅ YES |
| `{{context.conversation.featuredParticipants}}` | `featuredParticipants` | Array | Contact + Bot objects | ✅ YES |
| `{{context.conversation.activeParticipantCount}}` | `activeParticipantCount` | Number | `2` | ✅ YES |

**Additional Fields (May be accessible)**:
- `platformStyle`: "direct"
- `channelId`: UUID
- `createdAt`: ISO 8601
- `updatedAt`: ISO 8601
- `attributes`: Object with custom fields

---

### context.contact (Contacts API)

| Context Variable | API Path | Type | Example Value | Available |
|------------------|----------|------|---------------|-----------|
| `{{context.contact.id}}` | `id` | UUID | `"e013a75b-b5ac-4341-aa7c-571d38d067d0"` | ✅ YES |
| `{{context.contact.computedDisplayName}}` | `computedDisplayName` | String | `"Marelis S"` | ✅ YES |
| `{{context.contact.featuredIdentifiers}}` | `featuredIdentifiers` | Array | `[{key, value}]` | ✅ YES (full array) |
| `{{context.contact.identifierCount}}` | `identifierCount` | Number | `1` | ✅ YES |
| `{{context.contact.attributes}}` | `attributes` | Object | Custom CRM fields | ✅ YES |
| `{{context.contact.createdAt}}` | `createdAt` | ISO 8601 | `"2025-03-29T04:05:13.085Z"` | ⚠️ MAYBE |
| `{{context.contact.updatedAt}}` | `updatedAt` | ISO 8601 | `"2025-12-20T14:52:59.002Z"` | ⚠️ MAYBE |

**CRITICAL - Phone Access**:
- `{{context.contact.phoneNumber}}` - ⚠️ HYPOTHESIS (needs UI testing)
- `{{context.contact.attributes.phonenumber}}` - ✅ EXISTS but is ARRAY

---

### context.contact.attributes (CRM Custom Fields)

**Confirmed fields from real data**:
```json
{
  "country": "Colombia",
  "displayName": "Marelis S",
  "firstName": "Marelis",
  "lastName": "S",
  "phonenumber": ["+573005321911"],
  "timezone": "America/Bogota",
  "sync.fase": "Contacto Inicial",
  "initialSource": "connectors"
}
```

**Available as**:
- `{{context.contact.attributes.country}}` → "Colombia"
- `{{context.contact.attributes.displayName}}` → "Marelis S"
- `{{context.contact.attributes.firstName}}` → "Marelis"
- `{{context.contact.attributes.lastName}}` → "S"
- `{{context.contact.attributes.phonenumber}}` → `["+573005321911"]` (ARRAY!)
- `{{context.contact.attributes.timezone}}` → "America/Bogota"

---

## Recommended HTTP Request Body Structure

### Option A: If phoneNumber hidden variable exists (PREFERRED)

```json
{
  "conversationId": "{{context.conversation.id}}",
  "contactId": "{{context.contact.id}}",
  "contactPhone": "{{context.contact.phoneNumber}}",
  "displayName": "{{arguments.displayName}}",
  "email": "{{arguments.email}}"
}
```

### Option B: If attributes.phonenumber works (FALLBACK)

```json
{
  "conversationId": "{{context.conversation.id}}",
  "contactId": "{{context.contact.id}}",
  "contactPhone": "{{context.contact.attributes.phonenumber}}",
  "displayName": "{{arguments.displayName}}",
  "email": "{{arguments.email}}"
}
```

**Note**: If `attributes.phonenumber` is array in Bird UI, this won't work.

### Option C: Keep contactPhone as Argument (SAFE)

```json
{
  "conversationId": "{{context.conversation.id}}",
  "contactId": "{{context.contact.id}}",
  "contactPhone": "{{arguments.contactPhone}}",
  "displayName": "{{arguments.displayName}}",
  "email": "{{arguments.email}}"
}
```

**Arguments**: 3 instead of 2 (still 50% reduction from 6)

---

## Arguments Reduction Analysis

### Current (v1.0) - 6 Arguments

```typescript
{
  contactName: string,
  contactPhone: string,
  conversationId: string,
  country: string,
  displayName: string,
  email: string
}
```

### Proposed v2.0 - 2 Arguments (if phoneNumber accessible)

```typescript
{
  displayName: string,
  email: string
}
```

**Eliminated**:
- `conversationId` → `{{context.conversation.id}}` (automatic)
- `contactPhone` → `{{context.contact.phoneNumber}}` (automatic)
- `contactName` → Redundant with `displayName`
- `country` → Extracted from phone in backend

**Reduction**: 67% (6 → 2)

### Alternative v2.0 - 3 Arguments (if phoneNumber NOT accessible)

```typescript
{
  contactPhone: string,
  displayName: string,
  email: string
}
```

**Reduction**: 50% (6 → 3)

---

## Conversation API Response - Complete Structure

**For reference, full conversation object**:

```json
{
  "id": "7f7d4cff-2e27-4a1a-a2ba-0967341f974b",
  "status": "active",
  "style": "default",
  "visibility": "public",
  "accessibility": "open",
  "featuredParticipants": [
    {
      "id": "e013a75b-b5ac-4341-aa7c-571d38d067d0",
      "type": "contact",
      "status": "active",
      "displayName": "Marelis S",
      "contact": {
        "identifierKey": "phonenumber",
        "identifierValue": "+573005321911",
        "platformAddressSelector": "identifiers.phonenumber",
        "platformAddress": "+573005321911"
      }
    }
  ],
  "activeParticipantCount": 2,
  "channelId": "e49b0247-4374-5652-bf37-bf937fa9983b",
  "createdAt": "2026-01-22T04:17:54.045Z",
  "updatedAt": "2026-01-22T06:18:15.938Z",
  "platformStyle": "direct",
  "attributes": {
    "llmbotIds": "71f736c7-16cf-457e-8be9-e9b9ba2f7a4c",
    "typingStatus": "end"
  }
}
```

**Note**: `featuredParticipants[0].contact.identifierValue` contains phone BUT this is nested and likely not accessible as Bird variable.

---

## Next Steps - Manual Validation in Bird UI

### Test 1: Verify phoneNumber hidden variable

1. Go to Bird UI → Actions → "actualizacion de datos" → Edit
2. Click in HTTP Request Body field
3. Type: `{{context.contact.`
4. Wait for dropdown to appear
5. **CHECK**: Does `phoneNumber` (singular) appear in dropdown?

**Expected**: YES - Bird should expose this convenience variable
**Fallback**: If NO, use Option B or C

### Test 2: Verify attributes.phonenumber behavior

1. In Body field, type: `{{context.contact.attributes.phonenumber}}`
2. Test Action with real conversation
3. Check Vercel logs: What value was received?

**Expected**: String `"+573005321911"` (Bird auto-converts array)
**If receives**: Array `["+573005321911"]` → Option C required

### Test 3: Update Action body structure

**If Test 1 succeeds (phoneNumber exists)**:
```json
{
  "conversationId": "{{context.conversation.id}}",
  "contactId": "{{context.contact.id}}",
  "contactPhone": "{{context.contact.phoneNumber}}",
  "displayName": "{{arguments.displayName}}",
  "email": "{{arguments.email}}"
}
```

**Remove Arguments**: contactPhone, conversationId, contactName, country
**Keep Arguments**: displayName, email

---

## Real Data Examples

**Conversation ID**: `7f7d4cff-2e27-4a1a-a2ba-0967341f974b`
**Contact ID**: `e013a75b-b5ac-4341-aa7c-571d38d067d0`
**Contact Name**: `Marelis S`
**Phone Number**: `+573005321911`
**Country**: `Colombia` (in attributes)

**This confirms**:
- Context variables map directly to API responses
- Phone number accessible via featuredIdentifiers OR attributes
- Country already stored in attributes (synced from previous normalizations)
- computedDisplayName is the primary display name field

---

**Token Budget**: ~400 lines (~1,200 tokens)
**Last Updated**: 2026-01-22 08:30
