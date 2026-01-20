# Bird Action: Complete Patient Data Configuration Guide

Version: 1.0 | Date: 2025-12-23 | Owner: Neero Integration Team | Status: Draft

---

## Overview

Step-by-step guide to configure the **Complete Patient Data** Action in Bird Dashboard, allowing your AI Employee to automatically extract and update patient demographic information during WhatsApp conversations.

**Time to Complete:** 30-45 minutes
**Difficulty:** Intermediate

---

## Prerequisites

Before starting, ensure you have:

- [x] **Bird Workspace Admin Access** (required)
- [x] **AI Employee Created** in Bird Dashboard
- [x] **Actions Feature Enabled** for your AI Employee
- [x] **NEERO_API_KEY** (optional but recommended)
- [x] **Production API Deployed** at `https://api.neero.ai` OR
- [x] **Local Testing** using ngrok tunnel

---

## Configuration Steps

### Step 1: Navigate to AI Employee Actions

1. Log in to **Bird Dashboard**: https://dashboard.bird.com
2. Navigate to **AI Employees** in the left sidebar
3. Select your AI Employee (e.g., "Eva - Valoración")
4. Click the **"Actions"** tab at the top

**Screenshot Location:** (Top navigation: Workspace → AI Employees → [Your Employee] → Actions tab)

---

### Step 2: Create New HTTP Action

1. Click **"Add Action"** button (top right)
2. Select **"HTTP Request"** from the action type dropdown
3. Fill in basic information:
   - **Name:** `complete_patient_data`
   - **Display Name:** "Complete Patient Data"
   - **Description:** "Extract and update patient demographic data using NER from conversation history"

**Important:** Use exact name `complete_patient_data` (snake_case, no spaces)

---

### Step 3: Configure HTTP Request

Fill in the HTTP request details:

**URL:**
```
https://api.neero.ai/api/bird/complete-patient-data
```

**For Local Testing** (using ngrok):
```
https://your-ngrok-id.ngrok.io/api/bird/complete-patient-data
```

**Method:** `POST`

**Content-Type:** `application/json`

**Headers Section:**
Click "Add Header" and enter:
- **Key:** `X-API-Key`
- **Value:** `{{env.NEERO_API_KEY}}`

**Notes:**
- Use `{{env.NEERO_API_KEY}}` to reference environment variable
- DO NOT hardcode API key in header
- See Step 8 for setting environment variable

---

### Step 4: Define Arguments

Click **"Arguments"** tab to define which data the Action needs.

Add **1 argument**:

| Argument Name | Type | Description | Required | Default Value |
|---------------|------|-------------|----------|---------------|
| `conversationId` | string | Current conversation UUID | Yes | - |

**How to Fill:**
1. Click **"Add Argument"**
2. **Name:** `conversationId` (exact, camelCase)
3. **Type:** Select `string` from dropdown
4. **Description:** "Current conversation UUID"
5. **Required:** Check the box ✅
6. **Default Value:** Leave empty

---

### Step 5: Configure Request Body

Click **"Request Body"** tab.

Select **"JSON"** format from dropdown.

**Body Template:**
```json
{
  "conversationId": "{{conversationId}}"
}
```

**Important:**
- Use variable syntax: `{{conversationId}}`
- Bird automatically populates this from conversation context
- Do NOT use `{{messageId}}` or other variables

**How Variable Picker Works:**
1. Type `{{` in the JSON editor
2. Variable picker dropdown appears automatically
3. Select `conversationId` from the list
4. Bird auto-completes to `{{conversationId}}`

**Common Mistake:**
```json
// ❌ WRONG - Manual typing
{"conversationId": "{{conversationId}}"}

// ✅ CORRECT - Use variable picker
{
  "conversationId": "{{conversationId}}"
}
```

---

### Step 6: Configure Response Handling

Click **"Response"** tab.

**Expected Status Codes:**
- `200 OK` - Success OR Partial data
- `400 Bad Request` - Validation error
- `404 Not Found` - Conversation not found
- `408 Timeout` - Processing timeout
- `500 Internal Server Error` - Processing error

**Response Mapping:**

The Action returns JSON in two formats:

**Success Response:**
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
  "fields": ["displayName", "firstName", "lastName", "country", "gender", "city"]
}
```

**Partial Response:**
```json
{
  "success": false,
  "reason": "insufficient_data",
  "marked": "PENDIENTE DATOS"
}
```

**How AI Employee Uses Response:**
- Access `{{actionResponse.success}}` to check if successful
- Use `{{actionResponse.updated.firstName}}` in conversation
- Check `{{actionResponse.marked}}` for data completeness status

---

### Step 7: AI Employee Instructions

Update your AI Employee's **Instructions** to use the Action.

**Navigate to:** AI Employees → [Your Employee] → **"Instructions"** tab

**Add this section:**

```markdown
## Patient Data Collection

When a patient provides their personal information (name, location), automatically complete their CRM profile:

1. **Trigger:** Patient mentions "Soy [nombre]" or provides name/location
2. **Action:** Call action `complete_patient_data` with `{{conversationId}}`
3. **Success Response:**
   - Confirm: "Gracias {{updated.firstName}}, confirmé tus datos en el sistema"
   - Proceed with conversation naturally
4. **Partial Response:**
   - Ask: "¿Cuál es tu apellido completo para completar tu registro?"
   - Retry action after patient responds
5. **Error Response:**
   - Don't block conversation
   - Note internally and continue (data will be marked PENDIENTE DATOS)

**Important:**
- Don't ask for data already in CRM (check `{{contact.displayName}}` first)
- Be casual and conversational (not robotic)
- Never expose technical errors to patient
```

**Example Conversation Flow:**

```
Patient: "Hola, soy Juan Perez de Bogotá"
AI Employee: [Calls complete_patient_data action]
AI Employee: "Hola Juan! 👋 Perfecto, ya tengo tus datos. ¿En qué te puedo ayudar hoy?"

---

Patient: "Soy María"
AI Employee: [Calls complete_patient_data action]
AI Employee: [Receives partial response]
AI Employee: "Hola María! ¿Me podrías dar tu apellido completo para completar tu registro?"
Patient: "María García"
AI Employee: [Calls action again with updated conversation]
AI Employee: "Perfecto María García! ¿En qué te puedo ayudar?"
```

---

### Step 8: Set Environment Variables

Navigate to **Workspace Settings** → **Environment Variables**

**Add Variable:**
- **Key:** `NEERO_API_KEY`
- **Value:** (your API key from Neero team)
- **Scope:** Workspace (applies to all AI Employees)

**Security Notes:**
- Never commit API key to git
- Use different keys for staging/production
- Rotate keys every 90 days

**If You Don't Have an API Key:**
- Action will still work (API key is optional in initial version)
- Contact Neero team for production API key

---

### Step 9: Test the Action

**Test in Bird Dashboard:**

1. Click **"Test Action"** button (top right of Actions page)
2. Enter test data:
   ```json
   {
     "conversationId": "95fb9a8d-0125-4687-985b-f14ef932ac21"
   }
   ```
3. Click **"Run Test"**
4. Verify response:
   - Status: 200 OK
   - Response contains `success: true` or `success: false`
   - `processingTime` < 9 seconds

**Expected Test Results:**

✅ **Success:**
```json
{
  "success": true,
  "updated": {
    "displayName": "Patient Name",
    "country": "Colombia"
  }
}
```

⚠️ **Partial:**
```json
{
  "success": false,
  "reason": "insufficient_data",
  "marked": "PENDIENTE DATOS"
}
```

❌ **Error:**
```json
{
  "success": false,
  "error": "Conversation not found",
  "code": "CONVERSATION_NOT_FOUND"
}
```

---

### Step 10: Test in Live Conversation

**Start WhatsApp Test:**

1. Send WhatsApp message to your AI Employee's number
2. Provide name in conversation:
   ```
   Patient: "Hola, soy Juan Perez"
   ```
3. AI Employee should:
   - Call `complete_patient_data` action automatically
   - Respond with confirmation using patient's name
   - Continue conversation naturally

**Verify in Bird CRM:**

1. Navigate to **Contacts** in Bird Dashboard
2. Search for the patient's phone number
3. Verify updated fields:
   - ✅ `displayName` = "Juan Perez"
   - ✅ `firstName` = "Juan"
   - ✅ `lastName` = "Perez"
   - ✅ `country` = "Colombia" (from phone +57...)

**If Not Working:**
- Check Bird Dashboard → Actions → Logs
- Look for Action execution and error messages
- Verify conversationId is being passed correctly
- Check API logs at api.neero.ai

---

## Troubleshooting

### Issue: Action Not Triggering

**Symptoms:**
- AI Employee doesn't call action when patient provides name
- No entries in Actions → Logs

**Solutions:**
1. ✅ Verify Instructions include action call logic
2. ✅ Check action name matches exactly: `complete_patient_data`
3. ✅ Ensure AI Employee has Actions feature enabled
4. ✅ Test manually using "Test Action" button first

---

### Issue: 400 Validation Error

**Symptoms:**
```json
{
  "error": "Invalid request: conversationId is required",
  "code": "VALIDATION_ERROR"
}
```

**Solutions:**
1. ✅ Verify request body has `conversationId` field
2. ✅ Check variable syntax: `{{conversationId}}` (not `{{messageId}}`)
3. ✅ Use variable picker (don't manually type)

---

### Issue: 404 Conversation Not Found

**Symptoms:**
```json
{
  "error": "Conversation not found",
  "code": "CONVERSATION_NOT_FOUND"
}
```

**Solutions:**
1. ✅ Verify conversationId is valid UUID
2. ✅ Check workspace ID matches API configuration
3. ✅ Ensure conversation exists and isn't deleted

---

### Issue: 408 Timeout Error

**Symptoms:**
```json
{
  "error": "Processing timeout after 8.5s",
  "code": "TIMEOUT_ERROR"
}
```

**Solutions:**
1. ⚠️ Large conversation (>50 messages) - Expected behavior
2. ⚠️ Bird API slow response - Retry action
3. ⚠️ Check api.neero.ai server status

---

### Issue: Action Returns success: false

**Symptoms:**
```json
{
  "success": false,
  "reason": "insufficient_data",
  "marked": "PENDIENTE DATOS"
}
```

**This is NOT an error!** This is expected when:
- Patient only provides firstName (no lastName)
- Conversation too short for NER extraction
- Patient doesn't mention name explicitly

**What Happens:**
- Contact is flagged with `estatus='PENDIENTE DATOS'`
- AI Employee should ask for missing data
- Retry action after patient provides more info

---

## Advanced Configuration

### Custom Response Handling

**Use Action Response in Conversation:**

```
AI Employee Instructions:

After calling complete_patient_data:

IF {{actionResponse.success}} == true:
  → "Perfecto {{actionResponse.updated.firstName}}! Ya tengo tus datos."

ELSE IF {{actionResponse.reason}} == "insufficient_data":
  → "¿Cuál es tu apellido completo?"

ELSE:
  → "Disculpa, hubo un problema. Sigamos con la conversación."
```

---

### Conditional Action Calls

**Only call if data is missing:**

```
AI Employee Instructions:

Before calling complete_patient_data, check:

IF {{contact.displayName}} is empty OR {{contact.displayName}} starts with "+":
  → Call action (data needs completion)

ELSE:
  → Skip action (data already complete)
  → Use existing data: "Hola {{contact.firstName}}!"
```

---

### Retry Logic

**Handle partial data and retry:**

```
AI Employee Instructions:

1. First attempt: Call complete_patient_data
2. If partial response → Ask for missing data
3. Patient responds with lastName
4. Second attempt: Call complete_patient_data again
5. Success → Confirmed data updated
```

---

## Testing Checklist

Before deploying to production, verify:

- [ ] Action configured with correct URL
- [ ] Request body uses `{{conversationId}}` variable
- [ ] Environment variable `NEERO_API_KEY` set
- [ ] "Test Action" button returns 200 OK
- [ ] Live WhatsApp test triggers action
- [ ] Bird CRM shows updated contact data
- [ ] AI Employee responds with patient's name
- [ ] Partial data cases marked `PENDIENTE DATOS`
- [ ] Error cases don't block conversation

---

## Monitoring

### Bird Dashboard Logs

**Where:** Actions → Action Name → **Logs** tab

**What to Monitor:**
- Action execution count (calls per day)
- Success rate (200 OK responses)
- Error rate (4xx/5xx responses)
- Average response time (should be < 5s)

**Alerts:**
- Success rate < 60% → Investigate NER quality
- Response time > 8s → Timeout risk
- Error rate > 10% → Check API status

---

### API Logs (api.neero.ai)

**Where:** Vercel Dashboard → Logs

**Search Filters:**
- `path:/api/bird/complete-patient-data`
- `status:200` - Successful updates
- `status:408` - Timeouts
- `status:500` - Server errors

---

## Related Documents

- **API Specification:** `api-specification.md` - Request/response details
- **ADR:** `002-adr-patient-data-completion-endpoint.md` - Architecture decisions
- **Test Cases:** `test-cases.md` - Testing guide
- **Bird Actions Architecture:** `/docs/bird/bird-actions-architecture.md` - General Actions guide

---

## Support

**Issues:**
- GitHub: https://github.com/neero/api-neero/issues
- Email: [email protected]

**Documentation Updates:**
- Submit PR to `/feature/user-update-data/bird-action-setup-guide.md`

---

**Lines:** 150 | **Token Budget:** ~750 tokens
