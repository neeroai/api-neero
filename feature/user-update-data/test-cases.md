# Test Cases: Complete Patient Data Endpoint

Version: 1.0 | Date: 2025-12-23 | Owner: Neero QA Team | Status: Draft

---

## Test Environment

**Endpoints:**
- **Production:** `https://api.neero.ai/api/bird/complete-patient-data`
- **Local:** `http://localhost:3000/api/bird/complete-patient-data`

**Authentication:**
- API Key: `${NEERO_API_KEY}` (from .env.local or environment)

**Prerequisites:**
- Bird workspace with test conversations
- Valid conversationId UUIDs
- Bird CRM access to verify updates

---

## Test Cases

### TC001: Success - Full Data Extraction

**Priority:** High
**Category:** Happy Path
**Scenario:** Patient provides full name and city in conversation

**Test Data:**
- conversationId: Valid UUID with conversation containing:
  ```
  Patient: "Hola, soy Juan Perez de Bogotá"
  Agent: "Hola Juan, ¿en qué te puedo ayudar?"
  Patient: "Necesito información sobre cirugías"
  ```
- Patient phone: +573001234567 (Colombia)

**Input:**
```bash
curl -X POST http://localhost:3000/api/bird/complete-patient-data \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "conv-full-data-uuid"
  }'
```

**Expected Output:**
```json
{
  "success": true,
  "contactId": "contact-uuid",
  "updated": {
    "displayName": "Juan Perez",
    "firstName": "Juan",
    "lastName": "Perez",
    "country": "Colombia",
    "gender": "M",
    "city": "Bogotá"
  },
  "fields": ["displayName", "firstName", "lastName", "country", "gender", "city"],
  "processingTime": "3.2s"
}
```

**HTTP Status:** 200 OK

**Verify in Bird CRM:**
1. Navigate to Contacts → Search for +573001234567
2. Verify fields:
   - ✅ `displayName` = "Juan Perez"
   - ✅ `firstName` = "Juan"
   - ✅ `lastName` = "Perez"
   - ✅ `country` = "Colombia" (from phone code +57)
   - ✅ `gender` = "M"
   - ✅ `city` = "Bogotá"

**Pass Criteria:**
- Response status = 200
- `success` = true
- All fields in `updated` object
- Bird CRM shows updated data within 5 seconds

---

### TC002: Partial - Only firstName Extracted

**Priority:** High
**Category:** Partial Success
**Scenario:** Patient only says "Soy Juan" (no lastName mentioned)

**Test Data:**
- conversationId: Valid UUID with conversation:
  ```
  Patient: "Hola, soy Juan"
  Agent: "¿Juan qué más?"
  Patient: "Necesito una cita"
  ```
- Patient phone: +573005555555

**Input:**
```bash
curl -X POST http://localhost:3000/api/bird/complete-patient-data \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "conv-partial-data-uuid"
  }'
```

**Expected Output:**
```json
{
  "success": false,
  "contactId": "contact-uuid",
  "reason": "insufficient_data",
  "extracted": {
    "firstName": "Juan",
    "country": "Colombia"
  },
  "marked": "PENDIENTE DATOS",
  "processingTime": "2.8s"
}
```

**HTTP Status:** 200 OK

**Verify in Bird CRM:**
1. Navigate to Contacts → Search for +573005555555
2. Verify fields:
   - ✅ `firstName` = "Juan" (saved)
   - ✅ `country` = "Colombia" (from phone)
   - ✅ `estatus` = "PENDIENTE DATOS"
   - ❌ `displayName` unchanged (insufficient data)
   - ❌ `lastName` empty

**Pass Criteria:**
- Response status = 200
- `success` = false
- `reason` = "insufficient_data"
- `marked` = "PENDIENTE DATOS"
- Bird CRM shows `estatus` = "PENDIENTE DATOS"

---

### TC003: Country Inference from Phone Code

**Priority:** High
**Category:** Phone Code Logic
**Scenario:** Phone +507... (Panama), patient doesn't mention country in conversation

**Test Data:**
- conversationId: Valid UUID with conversation:
  ```
  Patient: "Hola, soy Diana Carvajal"
  Agent: "Hola Diana, ¿en qué te puedo ayudar?"
  ```
- Patient phone: +50766251676 (Panama)
- **Important:** Patient never mentions "Panama" in conversation

**Input:**
```bash
curl -X POST http://localhost:3000/api/bird/complete-patient-data \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "conv-panama-phone-uuid"
  }'
```

**Expected Output:**
```json
{
  "success": true,
  "contactId": "contact-uuid",
  "updated": {
    "displayName": "Diana Carvajal",
    "firstName": "Diana",
    "lastName": "Carvajal",
    "country": "Panama"
  },
  "fields": ["displayName", "firstName", "lastName", "country"],
  "processingTime": "3.1s"
}
```

**HTTP Status:** 200 OK

**Verify in Bird CRM:**
1. Navigate to Contacts → Search for +50766251676
2. Verify:
   - ✅ `country` = "Panama" (inferred from +507 code)
   - **NOT** from NER (patient didn't mention "Panama")

**Pass Criteria:**
- Response status = 200
- `country` = "Panama"
- Country inferred from phone code (+507) NOT from conversation

**Test Variations:**
- +57 → Colombia
- +52 → Mexico
- +1 → United States
- +54 → Argentina

---

### TC004: Validation Error - Missing conversationId

**Priority:** High
**Category:** Error Handling
**Scenario:** Request body missing required conversationId field

**Input:**
```bash
curl -X POST http://localhost:3000/api/bird/complete-patient-data \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Output:**
```json
{
  "success": false,
  "error": "Invalid request: conversationId is required",
  "code": "VALIDATION_ERROR",
  "processingTime": "0.1s"
}
```

**HTTP Status:** 400 Bad Request

**Pass Criteria:**
- Response status = 400
- `code` = "VALIDATION_ERROR"
- Error message mentions "conversationId"
- Response time < 1 second (validation only)

---

### TC005: Conversation Not Found

**Priority:** Medium
**Category:** Error Handling
**Scenario:** Valid UUID format but conversation doesn't exist

**Input:**
```bash
curl -X POST http://localhost:3000/api/bird/complete-patient-data \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "00000000-0000-0000-0000-000000000000"
  }'
```

**Expected Output:**
```json
{
  "success": false,
  "error": "Conversation not found",
  "code": "CONVERSATION_NOT_FOUND",
  "processingTime": "1.2s"
}
```

**HTTP Status:** 404 Not Found

**Pass Criteria:**
- Response status = 404
- `code` = "CONVERSATION_NOT_FOUND"
- Error message clear and user-friendly

---

### TC006: Timeout Handling

**Priority:** High
**Category:** Performance
**Scenario:** Processing should complete in < 9 seconds or return timeout error

**Test Methods:**
1. **Normal case:** Verify typical processing time
2. **Slow case:** Large conversation (50+ messages)
3. **Timeout case:** Mock slow Claude API response

**Input:**
```bash
curl -X POST http://localhost:3000/api/bird/complete-patient-data \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "conv-with-many-messages-uuid"
  }'
```

**Expected Behavior:**
- **If completes in < 9s:** Return success/partial response
- **If exceeds 8.5s:** Return timeout error

**Timeout Response:**
```json
{
  "success": false,
  "error": "Processing timeout after 8.5s",
  "code": "TIMEOUT_ERROR",
  "processingTime": "8.5s"
}
```

**HTTP Status:** 408 Request Timeout

**Pass Criteria:**
- Response time < 9 seconds (always)
- If > 8.5s → Returns 408 error (doesn't hang)
- Budget checks prevent infinite loops

**Test Variations:**
- Small conversation (10 messages): < 3s
- Medium conversation (30 messages): < 4s
- Large conversation (50 messages): < 6s
- Very large (70+ messages): Should timeout gracefully

---

### TC007: Gender Validation

**Priority:** Medium
**Category:** Data Validation
**Scenario:** NER extracts gender - validate it's 'M' or 'F'

**Test Case A: Valid Gender**

**Conversation:**
```
Patient: "Hola, soy Juan Perez, hombre, de Bogotá"
```

**Expected Output:**
```json
{
  "updated": {
    "gender": "M"
  }
}
```

**Test Case B: Invalid Gender (Should Discard)**

**Scenario:** NER returns invalid value (e.g., "masculino", "male", "hombre")

**Mock NER Response:**
```json
{"gender": "masculino"}
```

**Expected Behavior:**
- Validation discards invalid gender
- `gender` field NOT included in update
- Other fields still processed normally

**Pass Criteria:**
- Only 'M' or 'F' accepted
- Other values discarded (not saved to CRM)
- No error thrown (graceful handling)

---

### TC008: Edge Runtime Compatibility

**Priority:** High
**Category:** Deployment
**Scenario:** Endpoint runs successfully on Vercel Edge Runtime

**Test Steps:**
1. Deploy to Vercel
2. Verify deployment successful
3. Call production endpoint
4. Verify no Node.js API errors

**Validation:**
- ✅ No `fs` module usage
- ✅ No `crypto.createHmac` (use crypto.subtle)
- ✅ No `Buffer` (use ArrayBuffer + TextEncoder)
- ✅ Only Web APIs (fetch, crypto.subtle, ReadableStream)

**Expected:**
- Deploys successfully to Vercel Edge
- No runtime errors in production
- Response time < 9s in Edge Runtime

**Pass Criteria:**
- Vercel build succeeds
- `export const runtime = 'edge'` in route.ts
- Production call returns 200 OK

---

### TC009: Performance Budget Compliance

**Priority:** High
**Category:** Performance
**Scenario:** Full processing completes well within 9 second budget

**Test Steps:**
1. Start timer
2. Call endpoint with typical conversation
3. Measure total time
4. Verify breakdown matches budget

**Expected Budget Breakdown:**
| Phase | Target | Actual | Status |
|-------|--------|--------|--------|
| Conversation fetch | 1s | ~500ms | ✅ |
| Text filtering | 100ms | ~50ms | ✅ |
| NER extraction | 3s | 2-3s | ✅ |
| Country inference | 50ms | ~10ms | ✅ |
| Contact update | 1s | ~500ms | ✅ |
| Buffer | 500ms | - | ✅ |
| **Total** | **< 9s** | **~3.5s** | ✅ |

**Pass Criteria:**
- Total time < 8.5s (with 0.5s buffer)
- `processingTime` in response reflects actual time
- No phase exceeds individual budget

**Test Variations:**
- Best case: ~3.0s (all APIs fast)
- Typical case: ~3.5s (normal latency)
- Worst case: ~8.0s (slow APIs, acceptable)
- Timeout case: 8.5s (returns 408 error)

---

### TC010: Idempotency

**Priority:** Medium
**Category:** Data Integrity
**Scenario:** Calling endpoint twice with same conversationId should update safely

**Test Steps:**
1. First call: Update contact
2. Second call: Same conversationId
3. Verify: No errors, data updated (not duplicated)

**Input:**
```bash
# First call
curl -X POST http://localhost:3000/api/bird/complete-patient-data \
  -H "Content-Type: application/json" \
  -d '{"conversationId": "conv-123"}'

# Second call (immediately after)
curl -X POST http://localhost:3000/api/bird/complete-patient-data \
  -H "Content-Type: application/json" \
  -d '{"conversationId": "conv-123"}'
```

**Expected Behavior:**
- **First call:** Updates contact with extracted data
- **Second call:** Updates again (overwrites with same/new data)
- **NO:** Duplication, errors, or conflicts

**Pass Criteria:**
- Both calls return 200 OK
- Bird CRM has single contact (not duplicated)
- Data matches second call result
- No race conditions

---

## Manual Testing Checklist

Before production deployment, manually verify:

- [ ] **TC001:** Full data extraction (success case)
- [ ] **TC002:** Partial data + PENDIENTE DATOS marking
- [ ] **TC003:** Country inference from phone code
- [ ] **TC004:** Missing conversationId validation
- [ ] **TC005:** Conversation not found (404)
- [ ] **TC006:** Timeout < 9 seconds
- [ ] **TC007:** Gender validation ('M' or 'F')
- [ ] **TC008:** Edge Runtime deployment
- [ ] **TC009:** Performance budget compliance
- [ ] **TC010:** Idempotency (safe re-execution)

---

## Test Data Management

### Test Conversations

Create test conversations in Bird with known data:

| Conversation ID | Patient Data | Expected Result |
|-----------------|--------------|-----------------|
| `conv-full-123` | "Juan Perez, Bogotá" | Success (full) |
| `conv-partial-456` | "Soy María" | Partial (no lastName) |
| `conv-panama-789` | Phone +507, "Diana Carvajal" | Country = Panama |
| `conv-empty-000` | No personal info | Partial/Skip |

**Setup Script:** `/scripts/setup-test-conversations.ts`

---

## Test Results Template

**Date:** YYYY-MM-DD
**Tester:** Name
**Environment:** Production/Staging/Local

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC001 | ✅ Pass | Response time: 3.2s |
| TC002 | ✅ Pass | PENDIENTE DATOS marked |
| TC003 | ✅ Pass | Panama inferred from +507 |
| TC004 | ✅ Pass | 400 error as expected |
| TC005 | ✅ Pass | 404 error as expected |
| TC006 | ✅ Pass | Completed in 5.8s |
| TC007 | ✅ Pass | Gender validated correctly |
| TC008 | ✅ Pass | Deployed to Edge successfully |
| TC009 | ✅ Pass | Total time: 3.5s |
| TC010 | ✅ Pass | Idempotent updates work |

**Overall Result:** ✅ All tests passed

---

## Related Documents

- **Deployment Guide:** `deployment-guide.md` - Implementation reference
- **Bird Config:** `bird-action-setup-guide.md` - Setup guide
- **Archive:** `_archive/hallazgos-y-aprendizajes.md` - Script learnings (historical)
- **Archive:** `_archive/002-adr-patient-data-completion-endpoint.md` - Architecture decisions (historical)

---

**Lines:** 100 | **Token Budget:** ~500 tokens
