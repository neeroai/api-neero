# bugs.md - Known Issues

**Project:** api-neero | **Updated:** 2025-12-11

---

## Open Bugs

### BUG-001: AI Employee Actions Invalid Variable Error

**Reported:** 2025-12-05
**Updated:** 2025-12-11
**Severity:** Medium (Documentation error + Configuration issue)
**Status:** RESOLVED

**Description:**
Bird AI Employee Actions returns error: `"invalid variable: conversationMessageType"`. Root cause was documentation error - `conversationMessageType` does NOT exist in Bird's native variables.

**Symptoms:**
- Error when testing Action: `"invalid variable: conversationMessageType"`
- OR: API validation error: `"type: Required, mediaUrl: Required"`
- Action configuration followed old documentation

**Root Cause (Updated Understanding):**
1. **Documentation Error:** `conversationMessageType` is NOT a Bird native variable
2. **Confusion:** Mixed API JSON fields (backend) with Flow Builder variables (frontend)
3. **Architecture Misunderstanding:** Bird native variables (`{{messageImage}}`) are available to AI Employee but NOT automatically passed to Actions

**Bird Native Variables (Confirmed):**
- `{{messageImage}}` - Image URL
- `{{messageFile}}` - Document URL
- `{{messageAudio}}` - Audio URL
- `{{conversationId}}` - Conversation ID
- `{{contact.name}}` - Contact name

**NOT Bird Variables:**
- `{{conversationMessageType}}` - Does NOT exist

**Solution (Task Arguments Pattern):**

1. **Define Task Arguments** in Arguments Configuration:
   - `mediaType` (string) - AI Employee sets to "image", "document", or "audio"
   - `mediaUrl` (string) - AI Employee extracts from Bird native variables
   - `conversationId` (string) - From `{{conversationId}}`
   - `contactName` (string) - From `{{contact.name}}`

2. **Configure AI Employee** to populate task arguments before calling Action:
   ```
   If user sends image:
     - Set mediaType = "image"
     - Set mediaUrl = {{messageImage}}

   If user sends document:
     - Set mediaType = "document"
     - Set mediaUrl = {{messageFile}}

   If user sends audio:
     - Set mediaType = "audio"
     - Set mediaUrl = {{messageAudio}}
   ```

3. **HTTP Request Body** uses task arguments:
   ```json
   {
     "type": "{{mediaType}}",
     "mediaUrl": "{{mediaUrl}}",
     "context": {
       "conversationId": "{{conversationId}}",
       "contactName": "{{contactName}}"
     }
   }
   ```

**Alternative (if HTTP Request still fails):**
Use Custom Function with direct variable access:

```javascript
exports.handler = async function (context, variables) {
  const axios = require('axios');

  // Determine type and URL from available variables
  let type, mediaUrl;
  if (variables.messageImage) {
    type = 'image';
    mediaUrl = variables.messageImage;
  } else if (variables.messageFile) {
    type = 'document';
    mediaUrl = variables.messageFile;
  } else if (variables.messageAudio) {
    type = 'audio';
    mediaUrl = variables.messageAudio;
  }

  const response = await axios.post('https://api.neero.ai/api/bird', {
    type,
    mediaUrl,
    context: {
      conversationId: variables.conversationId,
      contactName: variables.contact?.name
    }
  }, {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': context.env.NEERO_API_KEY
    },
    timeout: 9000
  });

  return { success: true, data: response.data };
};
```

**Lessons Learned:**
- Always verify variables in Bird UI dropdown (type `{{` to check)
- Distinguish between Bird native variables (what Bird provides) and Task Arguments (what you define)
- Bird Conversations API JSON fields are NOT the same as Flow Builder variables
- AI Employee can access Bird native variables to populate Task Arguments

**Documentation Updates:**
- `/docs/bird/bird-ai-employees-setup-guide.md` - Section 4.3 (Task Arguments), 4.4 (HTTP Request), 4.6 (AI Employee config)
- `/docs/bird/bird-actions-architecture.md` - Updated to Task Arguments pattern
- `/docs/bird/bird-variables-reference.md` - New authoritative reference (created 2025-12-11)

---

## Closed Bugs

None yet.

---

**Lines:** 75
