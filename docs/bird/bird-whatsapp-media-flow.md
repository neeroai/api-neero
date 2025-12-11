# WhatsApp → Bird Media Flow

> LLM-optimized reference for multimedia message processing | Updated: 2025-12-05

---

## Overview

WhatsApp sends media with `id` → Bird converts to CDN URL → Exposes via variables

```
WhatsApp Webhook      Bird Platform         AI Employee/Flow
     ↓                      ↓                       ↓
{ image: { id } }    Convert media_id      {{messageImage}}
                     to CDN URL            = "https://media..."
```

---

## WhatsApp Webhook Payload Structure

WhatsApp Cloud API v23.0 sends media with `id` field, **NOT direct URLs**:

| Type | Webhook Fields | Example Value |
|------|----------------|---------------|
| Image | `{ id, mime_type, sha256, caption? }` | `{ id: "1234567890123456", mime_type: "image/jpeg" }` |
| Audio | `{ id, mime_type }` | `{ id: "9876543210987654", mime_type: "audio/ogg; codecs=opus" }` |
| Document | `{ id, filename, mime_type }` | `{ id: "1111222233334444", filename: "factura.pdf", mime_type: "application/pdf" }` |

**Example webhook:**
```json
{
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "5491123456789",
          "id": "wamid.xxx",
          "type": "image",
          "image": {
            "id": "1234567890123456",
            "mime_type": "image/jpeg",
            "sha256": "abc123..."
          }
        }]
      }
    }]
  }]
}
```

---

## Bird Conversion Process

Bird automatically converts WhatsApp media IDs to CDN URLs:

| Step | Action | Details |
|------|--------|---------|
| 1. Receive | WhatsApp webhook with media `id` | `{ image: { id: "123..." } }` |
| 2. Fetch | Call Meta Graph API: `GET /{media_id}` | Returns temporary download URL |
| 3. Download | Fetch file from Meta's servers | Max 5-30 days expiry |
| 4. Upload | Store in Bird CDN | `media.nest.messagebird.com/workspaces/{wsId}/media/{mediaId}` |
| 5. Expose | Make available via variables | `{{messageImage}}` = CDN URL |

**Timeline:** Happens within milliseconds, transparent to your code.

---

## Bird Variables Reference

After Bird's conversion, these variables contain **full CDN URLs**:

| Variable | Type | Value Format | Example |
|----------|------|--------------|---------|
| `{{messageImage}}` | string | `https://media.nest.messagebird.com/...` | Image URL (JPEG, PNG, WEBP) |
| `{{messageAudio}}` | string | `https://media.nest.messagebird.com/...` | Audio URL (OGG, MP3, M4A) |
| `{{messageFile}}` | string | `https://media.nest.messagebird.com/...` | Document URL (PDF, DOCX) |
| `{{conversationMessageType}}` | string | `"image"`, `"audio"`, `"file"`, `"text"` | Message type identifier |
| `{{conversationId}}` | string | UUID format | Conversation identifier |
| `{{contact.name}}` | string | Text | Contact display name |

**Usage Pattern:**
```javascript
// Only ONE variable will have value per message
const mediaUrl = variables.messageImage ||  // Image message
                 variables.messageAudio ||  // Audio message
                 variables.messageFile;     // Document message

// Type indicates which one has value
const type = variables.conversationMessageType; // "image", "audio", or "file"
```

---

## AI Employee Actions vs Flow Builder

### Flow Builder (Works)
Variables accessible directly in HTTP Request step via dropdown.

### AI Employee Actions (Scope Issue)
**Problem:** HTTP Request step may not have access to variables.

**Symptoms:**
- Variables defined in Arguments Configuration ✓
- Variables selected from dropdown ✓
- API receives empty values ✗ (`"type: Required, mediaUrl: Required"`)

**Solution:** Use Custom Function instead of HTTP Request.

#### Custom Function Example

```javascript
exports.handler = async function (context, variables) {
  const axios = require('axios');

  // Custom Function has DIRECT access to variables object
  const mediaUrl = variables.messageImage ||
                   variables.messageAudio ||
                   variables.messageFile;

  const type = variables.conversationMessageType;

  // Call api-neero with full URLs
  const response = await axios.post('https://api.neero.ai/api/bird', {
    type,        // "image", "audio", or "file"
    mediaUrl,    // Full CDN URL ready to download
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
    timeout: 9000  // 9 second max for Bird Actions
  });

  return {
    success: true,
    data: response.data
  };
};
```

**Advantages:**
- Direct `variables` object access
- No interpolation issues
- Works reliably with AI Employee Actions

---

## Downloading Media from Bird CDN

### Authentication

Bird CDN **may** require AccessKey (test if needed):

```typescript
const response = await fetch(mediaUrl, {
  headers: {
    'Authorization': `AccessKey ${process.env.BIRD_ACCESS_KEY}`
  }
});

const buffer = await response.arrayBuffer();
```

**Test both:**
1. Without auth header (may work for recent media)
2. With AccessKey (if 401/403 error)

### File Size Limits

| Type | WhatsApp Limit | Bird CDN | api-neero |
|------|----------------|----------|-----------|
| Image | 16 MB | 16 MB | 5 MB recommended |
| Audio | 16 MB | 16 MB | 25 MB max |
| Document | 100 MB | 100 MB | 10 MB recommended |

---

## Related Documentation

- `/docs/bird/bird-ai-employees-setup-guide.md` - Full AI Employee setup
- `/docs/bird/bird-media-cdn.md` - CDN download details
- `/plan/bugs.md` - BUG-001: AI Employee Actions variable scope
- `/docs-global/platforms/whatsapp/api-v23-guide.md` - WhatsApp webhook format

---

**Format:** LLM-optimized | **Lines:** 150 | **Token Budget:** ~900 tokens
