# Contact Update API

> Purpose: Update Bird CRM contact attributes with validation, cleaning, and verification
> Updated: 2025-12-20 | Tokens: ~900 | Edge Compatible: Yes

---

## Overview

Custom API endpoint for Eva Valoración (Bird AI Employee) to update patient contact data with automatic validation, name cleaning, and post-update verification.

**Use Cases:**
- Eva updates patient data via WhatsApp conversation
- Manual contact updates via API
- Batch updates with validation

**Key Features:**
- Pre-update validation (email, phone, country, displayName)
- Automatic name cleaning (emoji removal, proper capitalization)
- Dual-field update strategy (system fields + attributes)
- Post-update verification
- Before/after transparency
- Specific error codes

**Authentication:** Optional API key (`X-API-Key` header)

**Constraints:**
- Response time: <9 seconds (Bird timeout)
- Edge Runtime compatible (Web APIs only)
- File size: ~340 lines

---

## Endpoint

### POST `/api/contacts/update`

Updates contact attributes in Bird CRM with validation and cleaning.

**URL:** `https://api.neero.ai/api/contacts/update`

**Method:** POST

**Content-Type:** `application/json`

**Headers:**
```
X-API-Key: YOUR_API_KEY (optional)
```

**Timeout:** 9 seconds

---

## Request Schema

```typescript
{
  context: {
    conversationId: string (uuid),      // Required - Bird conversation ID
    contactPhone: string (E.164),       // Required - Phone for lookup
    contactName?: string                // Optional - For logging
  },
  updates: {
    displayName?: string (1-100 chars), // Optional - Full name
    email?: string (valid email),       // Optional - Email address
    phone?: string (E.164),             // Optional - New phone
    country?: string (ISO alpha-2)      // Optional - Country code
  }
}
```

**Requirements:**
- `context.conversationId` - Required (Bird conversation UUID)
- `context.contactPhone` - Required (E.164 format: `+573001234567`)
- `updates` - At least one field must be provided

**Validation Rules:**
- `displayName`: Min 1 char, max 100, must contain letter/number
- `email`: RFC 5322 format (`[email protected]`)
- `phone`: E.164 format (`+[country][number]`)
- `country`: ISO 3166-1 alpha-2 (`CO`, `MX`, `US`, etc.)

---

## Response Schema

### Success Response (200)

```typescript
{
  success: true,
  message: "Contact updated and verified successfully",
  data: {
    contactId: string (uuid),
    before: {
      displayName?: string,
      email?: string,
      phone?: string,
      country?: string
    },
    after: {
      displayName?: string,  // Cleaned (emojis removed, proper caps)
      email?: string,
      phone?: string,
      country?: string (converted to full name)
    },
    updatedFields: string[],  // e.g., ["displayName", "firstName", "lastName", "jose"]
    verified: boolean         // true if GET confirmed update
  },
  processingTime: "3.4s"
}
```

### Error Response (4xx/5xx)

```typescript
{
  success: false,
  error: string,           // Human-readable error message
  code: ErrorCode,         // Specific error code (see below)
  details?: {              // Field-specific errors (VALIDATION_ERROR only)
    [field: string]: string
  },
  processingTime?: "1.2s"
}
```

---

## Error Codes

| Code | HTTP Status | Description | Eva Response |
|------|-------------|-------------|--------------|
| `VALIDATION_ERROR` | 400 | Field format errors | "Por favor verifica el formato de tu [field]" |
| `CONTACT_NOT_FOUND` | 404 | Phone not in Bird CRM | "No encontré tu contacto. ¿Podrías verificar tu teléfono?" |
| `UPDATE_ERROR` | 500 | Bird API failure | "Hubo un error al actualizar. Te transfiero con un asesor." |
| `VERIFICATION_ERROR` | 500 | Post-update GET failed | "Actualización guardada (verificación pendiente)" |
| `TIMEOUT_ERROR` | 408 | Processing >9s | "El sistema tardó mucho. Intenta de nuevo." |
| `UNAUTHORIZED` | 401 | Invalid API key | Internal error (not shown to user) |

---

## Examples

### Example 1: Update Display Name (with emoji removal)

**Request:**
```bash
curl -X POST https://api.neero.ai/api/contacts/update \
  -H "Content-Type: application/json" \
  -H "X-API-Key: nro_prod_abc123..." \
  -d '{
    "context": {
      "conversationId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "contactPhone": "+573001234567"
    },
    "updates": {
      "displayName": "MARIA 😊 GARCIA"
    }
  }'
```

**Response (200):**
```json
{
  "success": true,
  "message": "Contact updated and verified successfully",
  "data": {
    "contactId": "89f5ae96-ed30-4741-b6cb-ca40a2b92220",
    "before": {
      "displayName": "MARIA 😊 GARCIA"
    },
    "after": {
      "displayName": "Maria Garcia"
    },
    "updatedFields": ["displayName", "firstName", "lastName", "jose"],
    "verified": true
  },
  "processingTime": "2.1s"
}
```

### Example 2: Update Multiple Fields

**Request:**
```bash
curl -X POST https://api.neero.ai/api/contacts/update \
  -H "Content-Type: application/json" \
  -H "X-API-Key: nro_prod_abc123..." \
  -d '{
    "context": {
      "conversationId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "contactPhone": "+573001234567"
    },
    "updates": {
      "displayName": "Juan Perez",
      "email": "[email protected]",
      "country": "CO"
    }
  }'
```

**Response (200):**
```json
{
  "success": true,
  "message": "Contact updated and verified successfully",
  "data": {
    "contactId": "89f5ae96-ed30-4741-b6cb-ca40a2b92220",
    "before": {
      "displayName": "Juan",
      "email": "[email protected]",
      "country": null
    },
    "after": {
      "displayName": "Juan Perez",
      "email": "[email protected]",
      "country": "Colombia"
    },
    "updatedFields": ["displayName", "firstName", "lastName", "jose", "email", "country"],
    "verified": true
  },
  "processingTime": "3.2s"
}
```

### Example 3: Validation Error (invalid email)

**Request:**
```bash
curl -X POST https://api.neero.api/contacts/update \
  -H "Content-Type: application/json" \
  -H "X-API-Key: nro_prod_abc123..." \
  -d '{
    "context": {
      "conversationId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "contactPhone": "+573001234567"
    },
    "updates": {
      "email": "invalidemail"
    }
  }'
```

**Response (400):**
```json
{
  "success": false,
  "error": "Invalid request body: updates.email: Invalid email",
  "code": "VALIDATION_ERROR",
  "processingTime": "0.0s"
}
```

### Example 4: Contact Not Found

**Request:**
```bash
curl -X POST https://api.neero.ai/api/contacts/update \
  -H "Content-Type: application/json" \
  -H "X-API-Key: nro_prod_abc123..." \
  -d '{
    "context": {
      "conversationId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "contactPhone": "+573009999999"
    },
    "updates": {
      "displayName": "Juan Perez"
    }
  }'
```

**Response (404):**
```json
{
  "success": false,
  "error": "Contact with phone *********9999 not found",
  "code": "CONTACT_NOT_FOUND",
  "processingTime": "0.5s"
}
```

---

## Display Name Cleaning

Automatic transformations applied to `displayName`:

| Input | Output | Transformation |
|-------|--------|----------------|
| `Juan 😊` | `Juan` | Emoji removed |
| `MARIA GARCIA` | `Maria Garcia` | Proper capitalization |
| `jose   luis` | `Jose Luis` | Whitespace normalized |
| `D. Fernando` | `D. Fernando` | Single letter preserved |
| `😊😊😊` | `Unknown` | No valid chars → placeholder |
| `José María` | `José María` | Accents preserved |
| `🌻TheFloRG🌻` | `Theflorg` | Emojis removed + proper caps |

**Algorithm:**
1. Remove emojis (Unicode ranges: 1F600-1F64F, 1F300-1F5FF, etc.)
2. Normalize whitespace (multiple spaces → single space)
3. Apply proper capitalization (first letter uppercase, rest lowercase)
4. Handle edge cases (single letters, dots, accents)

---

## Dual-Field Update Strategy

**Problem:** Bird's `computedDisplayName` may not reflect updates if only attributes are updated.

**Solution:** Update BOTH system fields AND attributes:

```typescript
// Update payload sent to Bird API
{
  // System fields (affect computedDisplayName in Bird UI)
  firstName: "Juan",
  lastName: "Perez",

  attributes: {
    // Custom attributes (direct storage)
    displayName: "Juan Perez",
    firstName: "Juan",
    lastName: "Perez",
    jose: "Juan Perez",        // Custom full name field
    email: "[email protected]",
    country: "Colombia"
  }
}
```

**Proven working:** Tested with 115/115 successful updates in CSV script.

---

## Integration with Eva Valoración

### Eva Workflow

1. **User requests update** - "Quiero actualizar mi email"

2. **Eva asks for details** - "¿Qué email quieres usar?"

3. **User provides data** - "[email protected]"

4. **Eva validates format** - Confirms format with user

5. **Eva constructs JSON:**
```javascript
{
  conversationId: "{{conversation.id}}",
  contactPhone: "+573001234567",  // From context or asks user
  updateData: {
    "email": "[email protected]"
  }
}
```

6. **Eva calls action** - `update_contact_data`

7. **Eva processes response:**
- `success=true` → "Email actualizado: [before] → [after] ✓ Verificado"
- `VALIDATION_ERROR` → "Por favor verifica el formato de tu email"
- `CONTACT_NOT_FOUND` → "No encontré tu contacto. ¿Podrías verificar tu teléfono?"

### Eva Instructions

See `/feature/eva-valoracion/eva-valoracion.agent.json` for complete instructions.

Key points:
- Ask WHAT data to update (don't assume all fields)
- Validate with patient BEFORE calling action
- Construct `updateData` JSON with ONLY fields to change
- Handle response codes with specific messages
- Show before/after changes for transparency

---

## Validation Details

### Email Validation
- **Format:** RFC 5322 simplified (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- **Max length:** 254 chars
- **Valid:** `[email protected]`, `user+tag@domain.co`
- **Invalid:** `abc@`, `[email protected]`, `user @domain.com`

### Phone Validation
- **Format:** E.164 (`/^\+[1-9]\d{1,14}$/`)
- **Must start with:** `+` followed by country code
- **Valid:** `+573001234567`, `+12025551234`
- **Invalid:** `3001234567`, `+0123456789`, `+57 300 1234567`

### Country Validation
- **Format:** ISO 3166-1 alpha-2 (`/^[A-Z]{2}$/`)
- **Supported:** CO, MX, US, AR, CL, PE, EC, VE, ES, NL
- **Valid:** `CO`, `MX`, `US`
- **Invalid:** `Colombia`, `co`, `ABC`, `COL`

**Conversion to Full Name:**
- `CO` → `Colombia`
- `MX` → `Mexico`
- `US` → `United States`
- `AR` → `Argentina`
- etc.

### Display Name Validation
- **Min length:** 1 char (after trim)
- **Max length:** 100 chars
- **Must contain:** At least one letter or number
- **Valid:** `Juan Perez`, `D. Fernando`, `José María`
- **Invalid:** `   ` (empty), `😊😊😊` (no alphanumeric)

---

## Update Flow

```
Request
  ↓
1. Validate API Key (optional)
  ↓
2. Parse Request (Zod schema validation)
  ↓
3. Validate Fields (email, phone, country, displayName)
  ↓
4. Search Contact by Phone
  ├─ NOT FOUND → 404 CONTACT_NOT_FOUND
  └─ FOUND
       ↓
5. Clean Display Name (remove emojis, proper caps)
  ↓
6. Build Update Payload (dual-field strategy)
  ↓
7. Update Contact (PATCH /contacts/{id})
  ↓
8. Add Email Identifier (if email updated, non-critical)
  ↓
9. Verify Update (GET /contacts/{id})
  ↓
10. Return Success Response (with before/after/verified)
```

**Total Time:** ~3.4s average (well under 9s budget)

---

## Performance

**Measured Times (local testing):**
- Validation errors: 0.0-0.2s (immediate)
- Contact not found: 0.5s
- Real contact updates: 1.5-2.3s
- P95: <5s (target)
- P99: <7s (target)

**Budget Breakdown:**
- Parse: 10ms
- Validate: 50ms
- Search: 800ms
- Clean: 10ms
- Update: 1000ms
- Email identifier: 500ms
- Verify: 1000ms
- **Total: ~3.4s** (5.6s safety margin)

---

## Security

### Input Validation
- Zod strict type checking (no HTML, no XSS)
- Email format validation (RFC 5322)
- Phone format validation (E.164)
- Country code whitelist (ISO alpha-2)
- Display name sanitization (emoji removal)

### Authentication
- Optional API key (`X-API-Key` header)
- Environment variable: `NEERO_API_KEY`
- No authentication if `NEERO_API_KEY` not configured

### Data Privacy
- Only basic contact data (GDPR compliant)
- NO medical history
- NO financial data
- Phone masking in logs (`+573001234567` → `*********4567`)

---

## Error Handling

### Client Errors (4xx)

**400 VALIDATION_ERROR:**
- Trigger: Invalid field format
- Response: Field-specific errors in `details`
- Eva action: Guide user to correct format

**401 UNAUTHORIZED:**
- Trigger: Invalid or missing API key
- Response: Generic unauthorized message
- Eva action: Internal error (not shown to user)

**404 CONTACT_NOT_FOUND:**
- Trigger: Phone not in Bird CRM
- Response: Masked phone in error message
- Eva action: Ask user to verify phone

### Server Errors (5xx)

**408 TIMEOUT_ERROR:**
- Trigger: Processing >9s
- Response: Timeout message with processing time
- Eva action: Ask user to try again

**500 UPDATE_ERROR:**
- Trigger: Bird API failure
- Response: Error message from Bird
- Eva action: Transfer to human agent

**500 VERIFICATION_ERROR:**
- Trigger: Post-update GET failed
- Response: Warning (update may have succeeded)
- Eva action: Inform user update saved but verification pending

---

## Monitoring

### Logs (Vercel)
- `console.log` - Normal flow (search, update, verify)
- `console.warn` - Verification failures (non-critical)
- `console.error` - Errors (validation, update, timeout)

### Metrics (Vercel Analytics)
- Request count per day
- Error rate by code
- P50/P95/P99 response times
- Timeout rate

### Recommended Alerts
- **Critical:** Error rate >10% (5 min), Timeout rate >5% (5 min)
- **Warning:** Verification failures >20%, Response time >5s (P95)

---

## Implementation Files

| File | Purpose | Lines |
|------|---------|-------|
| `/app/api/contacts/update/route.ts` | Main endpoint handler | ~340 |
| `/lib/utils/contact-validation.ts` | Validation utilities | ~250 |
| `/lib/utils/name-cleaning.ts` | Name cleaning utilities | ~170 |
| `/lib/bird/types.ts` | Zod schemas + types | ~370 |
| `/lib/bird/contacts.ts` | Bird API client (reused) | ~400 |

**Total:** ~1,530 lines (all utilities included)

---

## Related Documentation

- `/docs/bird/bird-ai-employees-setup-guide.md` - Bird UI configuration
- `/docs/eva-executive-summary.md` - Non-technical summary for stakeholders
- `/feature/eva-valoracion/eva-valoracion.agent.json` - Eva instructions
- `/Users/mercadeo/.claude/plans/zesty-booping-charm.md` - Implementation plan

---

## Testing

See testing section in `/Users/mercadeo/.claude/plans/zesty-booping-charm.md` for:
- 7 curl test cases
- Expected responses
- Verification checklist

---

**Format:** LLM-optimized | **Lines:** ~450 | **Token Budget:** ~2,100 tokens
