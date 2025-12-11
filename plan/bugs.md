# bugs.md - Known Issues

**Project:** api-neero | **Updated:** 2025-12-05

---

## Open Bugs

### BUG-001: AI Employee Actions Variable Scope

**Reported:** 2025-12-05
**Updated:** 2025-12-05
**Severity:** Low (Configuration issue)
**Status:** RESOLVED

**Description:**
Bird AI Employee Actions HTTP Request sends raw argument variables (`conversationMessageType`, `messageImage`) but api-neero expects different field names (`type`, `mediaUrl`).

**Symptoms:**
- API receives: `conversationMessageType: "image"`, `messageImage: "https://..."`
- API expects: `type: "image"`, `mediaUrl: "https://..."`
- Error: `"type: Required, mediaUrl: Required"`

**Root Cause:**
Field name mapping issue. HTTP Request body was not transforming Bird's native variable names to API's expected field names.

**Solution:**
Configure HTTP Request body to map Bird variable names to API field names:

```json
{
  "type": "{{conversationMessageType}}",
  "mediaUrl": "{{messageImage}}",
  "context": {
    "conversationId": "{{conversationId}}",
    "contactName": "{{name}}"
  }
}
```

**Alternative (if HTTP Request still fails):**
Use Custom Function instead of HTTP Request step:

```javascript
exports.handler = async function (context, variables) {
  const axios = require('axios');

  const mediaUrl = variables.messageImage ||
                   variables.messageAudio ||
                   variables.messageFile;

  const response = await axios.post('https://api.neero.ai/api/bird', {
    type: variables.conversationMessageType,
    mediaUrl,
    context: {
      conversationId: variables.conversationId,
      contactName: variables.contact?.name,
      timestamp: new Date().toISOString()
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

**Documentation:**
- `/docs/bird/bird-ai-employees-setup-guide.md` - Section 4.4 (HTTP Request configuration)

---

## Closed Bugs

None yet.

---

**Lines:** 75
