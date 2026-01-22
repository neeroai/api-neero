---
title: "Bird HTTP Request Variables - Analysis from UI Screenshots"
summary: "Analysis of Bird AI Employee HTTP Request configuration capabilities based on actual UI screenshots. Confirms custom headers ARE supported, documents variable interpolation patterns, and corrects previous documentation errors."
description: "Bird Actions HTTP Request variable access, headers configuration, and body structure patterns"
version: "1.0"
date: "2026-01-22"
updated: "2026-01-22 01:30"
scope: "project"
---

# Bird HTTP Request Variables - UI Analysis

**Date**: 2026-01-22 01:30
**Source**: Bird UI Screenshots (app.bird.com)
**Action**: `actualizacion de datos` (Published version)

---

## CRITICAL DISCOVERY: Custom Headers ARE Supported

**Previous documentation ERROR**: `plan.md` stated "Bird UI NO permite custom headers"

**CORRECTED**: Bird UI **DOES support custom headers** via "+ Add header" button

**Evidence**: Screenshot shows configured header:
```
X-API-Key: AlzaSyBpZNB6QrYDjtlskBkWQAas0QOAmS9s\
```

### Impact on Architecture

This discovery means:
- `/api/contacts/update` CAN use required authentication (X-API-Key header)
- NO need for optional authentication fallback
- Security can be enforced properly
- Phase 3 of plan.md needs to be updated

---

## HTTP Request Configuration Structure

### URL
```
https://api.neero.ai/api/contacts/update
```

### Method
```
POST
```

### Headers
**Configurable via "+ Add header" button**

Current configuration:
```
X-API-Key: AlzaSyBpZNB6QrYDjtlskBkWQAas0QOAmS9s\
```

**Variable interpolation available**: Likely supports `{{env.VARIABLE_NAME}}` syntax

---

## Request Body Structure

### Current Implementation (Nested)

```json
{
  "context": {
    "contactName": "{{arguments.contactName}}",
    "contactPhone": "{{arguments.contactPhone}}",
    "conversationId": "{{arguments.conversationId}}"
  },
  "updates": {
    "country": "{{arguments.country}}",
    "displayName": "{{arguments.displayName}}",
    "email": "{{arguments.email}}"
  }
}
```

**UI shows**: 6 fields total, all using `{{arguments.xxx}}` syntax

---

## Variable Types Observed

### 1. Arguments Variables

**Syntax**: `{{arguments.fieldName}}`

**Purpose**: Task-level arguments configured in Bird Action

**Examples from screenshots**:
- `{{arguments.contactName}}`
- `{{arguments.contactPhone}}`
- `{{arguments.conversationId}}`
- `{{arguments.country}}`
- `{{arguments.displayName}}`
- `{{arguments.email}}`

**Characteristics**:
- Explicitly defined in Action configuration
- AI Employee must provide these values when calling Action
- Type: "string or variable" (per UI dropdown)

### 2. Header Variables

**Syntax**: Likely `{{env.VARIABLE_NAME}}` or similar

**Evidence**: X-API-Key configured with hardcoded value, but environment variable interpolation likely supported

**Testing needed**: Confirm `{{env.NEERO_API_KEY}}` syntax works

### 3. Context Variables (Not shown in screenshots, but documented)

**Known from documentation**:
- `{{context.conversation.id}}`
- `{{context.contact.phoneNumber}}`
- `{{context.contact.computedDisplayName}}`
- `{{context.contact.attributes.xxx}}`

**Question**: Can these replace Arguments variables? (Needs testing)

---

## Configuration Settings

### Timeout
```
10 seconds
```

**Note**: Our endpoint target is <9s, so 10s timeout is acceptable

### Content Type
```
application/json
```

### Follow Redirect
```
Disabled (unchecked)
```

### Enable Retry
```
Disabled (unchecked)
```

---

## Variable Interpolation Patterns

### Observed Patterns

| Pattern | Example | Usage |
|---------|---------|-------|
| Arguments | `{{arguments.fieldName}}` | Task-level fields AI provides |
| Headers | `{...}` | Likely environment or global variables |
| Context (assumed) | `{{context.conversation.id}}` | Bird native conversation/contact data |

### Placeholder Syntax

UI shows placeholder pattern:
- Left side: Field name in body (`contactPhone`)
- Right side: Placeholder/example (`telefono`)

**Example**:
```
contactPhone : telefono
```

Suggests UI provides hints for what data to map.

---

## Comparison: Current vs Proposed v2.0

### Current (Nested Structure)

**Arguments**: 6 fields
- contactName
- contactPhone
- conversationId
- country
- displayName
- email

**Body**: Nested (context + updates)

**Headers**: X-API-Key (hardcoded value)

### Proposed v2.0 (FLAT Structure)

**Arguments**: 2 fields
- displayName (required)
- email (optional)

**Body**: FLAT
```json
{
  "conversationId": "{{context.conversation.id}}",
  "contactPhone": "{{context.contact.phoneNumber}}",
  "displayName": "{{arguments.displayName}}",
  "email": "{{arguments.email}}"
}
```

**Headers**: X-API-Key with environment variable
```
X-API-Key: {{env.NEERO_API_KEY}}
```

**Changes**:
- Reduce Arguments 6 → 2 (67% reduction)
- Use Context variables instead of Arguments for conversationId and contactPhone
- Use environment variable for API key (not hardcoded)
- FLAT structure instead of nested

---

## Questions for Further Investigation

### 1. Context Variables Access

**Question**: Can HTTP Request body directly use `{{context.conversation.id}}`?

**Test**: Try replacing `{{arguments.conversationId}}` with `{{context.conversation.id}}`

**Expected**: Should work (Bird native variables should be accessible)

### 2. Environment Variables in Headers

**Question**: Does `{{env.NEERO_API_KEY}}` syntax work in headers?

**Test**: Replace hardcoded API key with `{{env.NEERO_API_KEY}}`

**Expected**: Should work (common pattern in API platforms)

### 3. Variable Scope

**Question**: What's the full list of available variables?

**Known**:
- `arguments.*` (configured in Action)
- `context.conversation.*` (Bird native)
- `context.contact.*` (Bird native)
- `env.*` (likely environment variables)

**Unknown**:
- Global variables?
- Flow run variables?
- Step variables?

### 4. Validation

**Question**: Does Bird validate variable interpolation before saving?

**Test**: Try using non-existent variable `{{arguments.nonExistent}}`

**Expected**: May show warning or allow (runtime error if used)

---

## Recommendations for Phase 3

Based on screenshots analysis:

### 1. Update plan.md

**CRITICAL**: Correct error about headers

**Before**:
> Bird UI NO permite custom headers

**After**:
> Bird UI DOES support custom headers via "+ Add header" button

### 2. Configure Headers with Environment Variable

**Step**:
1. Go to Bird Dashboard
2. Workspace settings → Environment Variables
3. Add `NEERO_API_KEY` with actual API key value
4. In Action HTTP Request → Headers → X-API-Key
5. Set value to: `{{env.NEERO_API_KEY}}`

**Benefit**: Secure, not hardcoded, can rotate without changing Action

### 3. Test Context Variables

**Before simplifying Arguments**, test if these work:

```json
{
  "conversationId": "{{context.conversation.id}}",
  "contactPhone": "{{context.contact.phoneNumber}}"
}
```

**If successful**: Can eliminate conversationId and contactPhone from Arguments

### 4. Implement FLAT Structure

**Body change**:
```json
{
  "conversationId": "{{context.conversation.id}}",
  "contactPhone": "{{context.contact.phoneNumber}}",
  "displayName": "{{arguments.displayName}}",
  "email": "{{arguments.email}}"
}
```

**Arguments change**: Remove contactName, contactPhone, conversationId, country (keep only displayName, email)

---

## Files to Update

| File | Change Required | Priority |
|------|----------------|----------|
| `plan.md` | Correct headers section | CRITICAL |
| `docs/eva-ai-employee/GUIA-ACTUALIZACION-EVA-BIRD-UI.md` | Update Phase 3 with header config | HIGH |
| `docs/eva-ai-employee/RESUMEN-SIMPLIFICACION-V2.md` | Correct headers limitation | HIGH |
| `app/api/contacts/update/route.ts` | NO CHANGE (already supports X-API-Key) | N/A |

---

## Next Steps

1. **Verify environment variables in Bird**
   - Check if workspace has env vars feature
   - Test `{{env.VARIABLE_NAME}}` syntax

2. **Test Context variables in HTTP Request**
   - Clone current Action
   - Replace `{{arguments.conversationId}}` → `{{context.conversation.id}}`
   - Test with real conversation

3. **Update documentation**
   - Correct plan.md Phase 3
   - Update implementation guides
   - Document environment variable setup

4. **Implement v2.0 changes**
   - Follow updated Phase 3 instructions
   - Use environment variable for API key
   - Test end-to-end

---

**Token Budget**: ~450 lines (~1,350 tokens)
**Last Updated**: 2026-01-22 01:30
