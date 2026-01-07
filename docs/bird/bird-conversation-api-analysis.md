# Bird Conversation API - Real Data Analysis

**Version:** 2.0 | **Date:** 2025-12-13 | **Status:** Comprehensive Reference

> Analysis of real Bird API responses to understand timing, message ordering, and ALL media types

---

## Executive Summary

**Problem Confirmed:** AI Employee sends acknowledgment messages BEFORE calling the action, causing `limit=1` to fetch bot messages instead of user media.

**Evidence from 2 real conversations:**
1. **Conversation 1 (ef146edd):** Simple image timing issue - 4.5s gap between user image and bot response
2. **Conversation 2 (5e5d970a):** ALL media types tested - consistent 6-10s gap across image, sticker, audio, PDF, video

**Key Findings:**
- Bot timing consistent across ALL media types (6-10 second response delay)
- Images use dedicated `body.type: "image"` structure
- All other media (audio, video, PDF, stickers) use `body.type: "file"` with `contentType` discrimination
- Stickers unique: NO `whatsapp.media.type` in extraInformation (only `image/webp` contentType)

**Solution:** Use `limit=5` and filter for contact media messages (works for ALL media types).

---

## Real Conversation Timeline

### Conversation ID: `ef146edd-eff1-460d-b968-af87d1b63d62`

**Messages in chronological order (oldest → newest):**

#### Message 1: User greeting (text)
```json
{
  "id": "d6f8bab8-9f2f-49f6-a990-ad3a6555742b",
  "createdAt": "2025-12-13T08:43:46.146Z",
  "sender": {
    "type": "contact",
    "displayName": "Javier Polo"
  },
  "body": {
    "type": "text",
    "text": {
      "text": "hi"
    }
  }
}
```

#### Message 2: Bot greeting (text)
```json
{
  "id": "d6747247-7264-4d73-bc48-36586a70621b",
  "createdAt": "2025-12-13T08:43:52.368Z",
  "sender": {
    "type": "bot",
    "displayName": "multimodal"
  },
  "body": {
    "type": "text",
    "text": {
      "text": "👋 ¡Hola! Soy Multimodal. ¿En qué puedo ayudarte hoy?"
    }
  }
}
```

#### Message 3: **User sends IMAGE** ✅ This is what we need to process
```json
{
  "id": "4964195c-8f61-4062-9520-93022d2e005e",
  "createdAt": "2025-12-13T08:44:07.189Z",
  "sender": {
    "type": "contact",
    "displayName": "Javier Polo"
  },
  "body": {
    "type": "image",
    "image": {
      "images": [{
        "mediaUrl": "https://media.api.bird.com/workspaces/.../media/..."
      }]
    }
  },
  "meta": {
    "extraInformation": {
      "whatsapp.media.type": "image"
    }
  }
}
```

#### Message 4: **Bot acknowledgment** ⚠️ PROBLEMA - Sent BEFORE action call
```json
{
  "id": "5b082ec1-52f7-420f-8e47-9f8c43ef8562",
  "createdAt": "2025-12-13T08:44:11.782Z",
  "sender": {
    "type": "bot",
    "displayName": "multimodal"
  },
  "body": {
    "type": "text",
    "text": {
      "text": "📸 Procesando tu imagen..."
    }
  }
}
```

**⏱️ Time gap: 4.5 seconds between image and acknowledgment**

#### Message 5: Bot error response (after action fails)
```json
{
  "id": "2dd7cc0e-3a00-42a9-9a4d-ac3858d6f6aa",
  "createdAt": "2025-12-13T08:44:18.053Z",
  "sender": {
    "type": "bot",
    "displayName": "multimodal"
  },
  "body": {
    "type": "text",
    "text": {
      "text": "⚠️ Hubo un error al procesar. ¿Podrías enviar la imagen de nuevo, por favor?"
    }
  }
}
```

---

## Problem Analysis

### What Happens with `limit=1`

When API calls:
```
GET /conversations/ef146edd.../messages?limit=1
```

**Returns:** Message 5 (bot error) or Message 4 (bot acknowledgment)
**Expected:** Message 3 (user image)

### Timeline Breakdown

```
T+0s:   User sends image (message 3)
T+4.5s: Bot sends "Procesando..." (message 4)
        ↓
        Bot calls process_media action
        ↓
        API fetches limit=1 → Gets message 4 (bot)
        ↓
        Error: "Latest message is not from contact"
        ↓
T+11s:  Bot sends error message (message 5)
```

### Why This Happens

**Bird AI Employee Workflow:**
1. Receives user message
2. **Processes message and decides to send acknowledgment**
3. **Sends acknowledgment to user** (creates bot message)
4. **Then calls action**

Step 3 creates a bot message BEFORE step 4 calls the action.

---

## Solution: Filter for Contact Media

### Current Logic (BROKEN)
```typescript
// Fetch limit=1
const url = `.../messages?limit=1`;
const response = await fetch(url);
const data = await response.json();

// Get first message
const latestMessage = data.results[0];  // ❌ Might be bot message

if (latestMessage.sender.type !== 'contact') {
  throw new Error('Latest message is not from contact');  // 💥 ERROR
}
```

### Fixed Logic (WORKS)
```typescript
// Fetch limit=5 (handle bot responses)
const url = `.../messages?limit=5`;
const response = await fetch(url);
const data = await response.json();

// Filter for contact media messages
const contactMediaMessages = data.results
  .filter(msg => msg.sender.type === 'contact')
  .filter(msg => msg.body.type !== 'text' && msg.body.type !== 'location')
  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

if (contactMediaMessages.length === 0) {
  throw new Error('No media messages from contact found');
}

// Get most recent contact media message
const latestContactMedia = contactMediaMessages[0];  // ✅ Message 3 (user image)
```

---

## Message Structure Validation

### Image Message Structure (CONFIRMED CORRECT)

From Message 3:
```json
{
  "body": {
    "type": "image",
    "image": {
      "images": [{
        "mediaUrl": "https://media.api.bird.com/workspaces/5cce71bc-a8f5-4201-beeb-6df0aef3cfc8/messages/4964195c-8f61-4062-9520-93022d2e005e/media/39eb27d0-ad54-454e-a488-c91770af7bda"
      }]
    }
  }
}
```

**Our Schema:** ✅ CORRECT
```typescript
image: z.object({
  images: z.array(z.object({
    mediaUrl: z.string()
  }))
}).optional()
```

---

## Complete Media Type Reference

### Conversation: `5e5d970a-841c-4f08-9949-ba99d225f159` (All Media Types)

This conversation demonstrates ALL WhatsApp media types processed by Bird API. Each media type shows the same timing issue: bot responds BEFORE calling action.

#### 1. Sticker (Animated WebP)

**Timeline:** User sends sticker (09:24:29) → Bot responds (09:24:36) - 7s gap

```json
{
  "id": "160a2292-bdf5-455d-9ab4-8aac22aaf0b0",
  "createdAt": "2025-12-13T09:24:29.474Z",
  "sender": {
    "type": "contact",
    "displayName": "Javier Polo"
  },
  "body": {
    "type": "file",
    "file": {
      "files": [{
        "contentType": "image/webp",
        "mediaUrl": "https://media.api.bird.com/workspaces/5cce71bc-a8f5-4201-beeb-6df0aef3cfc8/messages/160a2292-bdf5-455d-9ab4-8aac22aaf0b0/media/1abb2ddf-7c94-4a7e-9497-d23a2300ee9b",
        "metadata": {
          "isAnimated": true
        }
      }]
    }
  },
  "meta": {
    "extraInformation": {
      "timestamp": "1765617864",
      "user_locale": "es-CO"
    }
  }
}
```

**Key Findings:**
- `body.type`: `"file"` (NOT "sticker")
- `contentType`: `"image/webp"`
- Special field: `metadata.isAnimated: true` for animated stickers
- **NO** `whatsapp.media.type` in extraInformation (unique to stickers)

**Detection Pattern:**
```typescript
if (msg.body.type === 'file' && msg.body.file?.files?.[0]) {
  const file = msg.body.file.files[0];
  if (file.contentType === 'image/webp') {
    // This is a sticker
    // Check file.metadata?.isAnimated for animated stickers
  }
}
```

#### 2. Audio (Voice Note)

**Timeline:** User sends audio (09:25:02) → Bot responds (09:25:09) - 7s gap

```json
{
  "id": "8022f15c-7ae6-48a1-aeb7-68df05c37f05",
  "createdAt": "2025-12-13T09:25:02.418Z",
  "sender": {
    "type": "contact",
    "displayName": "Javier Polo"
  },
  "body": {
    "type": "file",
    "file": {
      "files": [{
        "contentType": "audio/ogg",
        "mediaUrl": "https://media.api.bird.com/workspaces/5cce71bc-a8f5-4201-beeb-6df0aef3cfc8/messages/8022f15c-7ae6-48a1-aeb7-68df05c37f05/media/98815480-eea2-446b-be1f-be829e055013"
      }]
    }
  },
  "meta": {
    "extraInformation": {
      "timestamp": "1765617896",
      "user_locale": "es-CO",
      "whatsapp.media.type": "audio"
    }
  }
}
```

**Key Findings:**
- `body.type`: `"file"` (NOT "audio")
- `contentType`: `"audio/ogg"` for WhatsApp voice notes
- **NO** `filename` field for voice notes
- `whatsapp.media.type`: `"audio"` in extraInformation

**Detection Pattern:**
```typescript
if (msg.body.type === 'file' && msg.body.file?.files?.[0]) {
  const file = msg.body.file.files[0];
  if (file.contentType.startsWith('audio/')) {
    // This is audio (voice note)
    // No filename for voice notes
  }
}
```

#### 3. Document (PDF with Filename)

**Timeline:** User sends PDF (09:25:25) → Bot responds (09:25:35) - 10s gap

```json
{
  "id": "ca5c7955-630a-490a-ac3c-e86db5372de9",
  "createdAt": "2025-12-13T09:25:25.107Z",
  "sender": {
    "type": "contact",
    "displayName": "Javier Polo"
  },
  "body": {
    "type": "file",
    "file": {
      "files": [{
        "contentType": "application/pdf",
        "mediaUrl": "https://media.api.bird.com/workspaces/5cce71bc-a8f5-4201-beeb-6df0aef3cfc8/messages/ca5c7955-630a-490a-ac3c-e86db5372de9/media/21364550-351a-4b02-a4e7-d850b22a4b87",
        "filename": "Mentoria Christus Sinergía.pdf"
      }]
    }
  },
  "meta": {
    "extraInformation": {
      "timestamp": "1765617918",
      "user_locale": "es-CO",
      "whatsapp.media.type": "document"
    }
  }
}
```

**Key Findings:**
- `body.type`: `"file"` (NOT "document")
- `contentType`: `"application/pdf"`
- **HAS** `filename` field (original user filename with special characters)
- `whatsapp.media.type`: `"document"` in extraInformation

**Detection Pattern:**
```typescript
if (msg.body.type === 'file' && msg.body.file?.files?.[0]) {
  const file = msg.body.file.files[0];
  if (file.contentType === 'application/pdf') {
    // This is a PDF document
    // file.filename contains original name (may have special chars)
  }
}
```

#### 4. Video

**Timeline:** User sends video (09:26:50) → Bot responds (09:26:59) - 9s gap

```json
{
  "id": "429161f2-729f-4b11-9bde-5ce52c0df2ac",
  "createdAt": "2025-12-13T09:26:50.178Z",
  "sender": {
    "type": "contact",
    "displayName": "Javier Polo"
  },
  "body": {
    "type": "file",
    "file": {
      "files": [{
        "contentType": "video/mp4",
        "mediaUrl": "https://media.api.bird.com/workspaces/5cce71bc-a8f5-4201-beeb-6df0aef3cfc8/messages/429161f2-729f-4b11-9bde-5ce52c0df2ac/media/827d132b-7d7a-4d16-abca-d67f02eb00d9"
      }]
    }
  },
  "meta": {
    "extraInformation": {
      "timestamp": "1765618003",
      "user_locale": "es-CO",
      "whatsapp.media.type": "video"
    }
  }
}
```

**Key Findings:**
- `body.type`: `"file"` (NOT "video")
- `contentType`: `"video/mp4"`
- **NO** `filename` field for videos
- `whatsapp.media.type`: `"video"` in extraInformation

**Detection Pattern:**
```typescript
if (msg.body.type === 'file' && msg.body.file?.files?.[0]) {
  const file = msg.body.file.files[0];
  if (file.contentType.startsWith('video/')) {
    // This is a video
  }
}
```

#### 5. Image (Confirmed from Multiple Examples)

**Timeline:** User sends image (09:26:00) → Bot responds (09:26:06) - 6s gap

```json
{
  "id": "a636a099-18f8-44ca-9490-c3a176ca0543",
  "createdAt": "2025-12-13T09:26:00.929Z",
  "sender": {
    "type": "contact",
    "displayName": "Javier Polo"
  },
  "body": {
    "type": "image",
    "image": {
      "images": [{
        "mediaUrl": "https://media.api.bird.com/workspaces/5cce71bc-a8f5-4201-beeb-6df0aef3cfc8/messages/a636a099-18f8-44ca-9490-c3a176ca0543/media/351dee0e-5ce5-443a-ab15-28036d19ebef"
      }]
    }
  },
  "meta": {
    "extraInformation": {
      "timestamp": "1765617955",
      "user_locale": "es-CO",
      "whatsapp.media.type": "image"
    }
  }
}
```

**Key Findings:**
- `body.type`: `"image"` (ONLY media type with dedicated type)
- Structure: `body.image.images[]` array
- `whatsapp.media.type`: `"image"` in extraInformation

**Detection Pattern:**
```typescript
if (msg.body.type === 'image' && msg.body.image?.images?.[0]) {
  // This is an image
  const mediaUrl = msg.body.image.images[0].mediaUrl;
}
```

### Media Type Summary Table

| User Sends | WhatsApp Type | Bird `body.type` | `contentType` | `filename` | `whatsapp.media.type` |
|------------|---------------|------------------|---------------|------------|----------------------|
| Image | image | `"image"` | N/A | ❌ | `"image"` ✅ |
| Sticker | sticker | `"file"` | `"image/webp"` | ❌ | ❌ (missing!) |
| Audio/Voice | audio | `"file"` | `"audio/ogg"` | ❌ | `"audio"` ✅ |
| Document/PDF | document | `"file"` | `"application/pdf"` | ✅ | `"document"` ✅ |
| Video | video | `"file"` | `"video/mp4"` | ❌ | `"video"` ✅ |

### Critical Insights

1. **Images are special:** ONLY media type with dedicated `body.type: "image"` instead of `"file"`
2. **Everything else uses file:** Audio, video, documents, stickers all use `body.type: "file"`
3. **Stickers are unique:** NO `whatsapp.media.type` in extraInformation (detection via `image/webp`)
4. **Filename only for documents:** PDFs have `filename`, voice notes/videos don't
5. **Animated stickers:** Have `metadata.isAnimated: true` field
6. **Bot timing consistent:** 6-10 second gap between user media and bot response across ALL types

### Filter Logic for All Media Types

```typescript
function isContactMediaMessage(msg: BirdMessage): boolean {
  if (msg.sender.type !== 'contact') return false;

  const type = msg.body.type;

  // Exclude text and location
  if (type === 'text' || type === 'location') return false;

  // Include images (dedicated type)
  if (type === 'image' && msg.body.image?.images?.[0]?.mediaUrl) return true;

  // Include all file types (audio, video, PDF, stickers)
  if (type === 'file' && msg.body.file?.files?.[0]?.mediaUrl) return true;

  return false;
}
```

### Expanded Testing Matrix

| Scenario | Media Type | Bot Gap | limit=1 Risk | limit=5 Solution |
|----------|-----------|---------|--------------|------------------|
| User sends image + bot responds | image | 6s | ❌ Gets bot | ✅ Filters to image |
| User sends sticker + bot responds | sticker (webp) | 7s | ❌ Gets bot | ✅ Filters to sticker |
| User sends audio + bot responds | audio (ogg) | 7s | ❌ Gets bot | ✅ Filters to audio |
| User sends PDF + bot responds | document (pdf) | 10s | ❌ Gets bot | ✅ Filters to PDF |
| User sends video + bot responds | video (mp4) | 9s | ❌ Gets bot | ✅ Filters to video |
| User sends 5 different media files | mixed | varies | ❌ Gets last | ✅ Gets most recent contact media |

---

## Additional Findings

### 1. Meta Information

Bird adds extra metadata in `meta.extraInformation`:
```json
{
  "meta": {
    "extraInformation": {
      "timestamp": "1765615442",
      "user_locale": "es-CO",
      "whatsapp.media.type": "image"
    }
  }
}
```

**Usage:** Could use `whatsapp.media.type` as additional validation.

### 2. Media URL Format

All media URLs follow pattern:
```
https://media.api.bird.com/workspaces/{workspaceId}/messages/{messageId}/media/{mediaId}
```

**Note:** No authentication required in testing (public CDN).

### 3. Message Status

All messages have `status: "delivered"` - useful for debugging.

---

## Testing Matrix

| Scenario | limit=1 Result | limit=5 Result | Status |
|----------|----------------|----------------|--------|
| User sends image immediately | ✅ Works | ✅ Works | Both work |
| User sends image, bot responds, then action | ❌ Bot message | ✅ User image | limit=5 REQUIRED |
| User sends text then image | ✅ Works | ✅ Works | Both work |
| User sends multiple images | ⚠️ Last image | ✅ Last image | Both work |
| User sends 6 messages before action | N/A | ⚠️ May miss media | Edge case |

---

## Recommendations

### Immediate Action

1. **Change `limit=1` to `limit=5`** in `lib/bird/fetch-latest-media.ts`
2. **Add contact media filtering** as shown in "Fixed Logic" section
3. **Deploy to production**

### Future Considerations

1. **Monitor `limit=5` coverage:** If users send >5 messages rapidly, may need `limit=10`
2. **Add telemetry:** Log when filtering skips bot messages (indicates timing issue)
3. **Consider caching:** If same conversation called multiple times, cache last media URL

### NOT Recommended

❌ **Use `limit=1` and pray** - Proven to fail
❌ **Scan entire history** - Too slow, inefficient
❌ **Ask AI Employee for messageId** - Not available in Bird variables

---

## Related Files

- `lib/bird/fetch-latest-media.ts` - Needs update
- `docs/bird/bird-whatsapp-message-structures.md` - Already documents structure
- `scripts/bird-api-explorer.sh` - Use for live testing

---

## Usage Examples

### Fetch conversations
```bash
export BIRD_ACCESS_KEY=xxx
export BIRD_WORKSPACE_ID=xxx
./scripts/bird-api-explorer.sh conversations 10
```

### Fetch conversation messages
```bash
# Conversation 1: Simple image timing issue
./scripts/bird-api-explorer.sh messages ef146edd-eff1-460d-b968-af87d1b63d62 10

# Conversation 2: All media types (image, video, PDF, audio, sticker)
./scripts/bird-api-explorer.sh messages 5e5d970a-841c-4f08-9949-ba99d225f159 20
```

---

**Format:** LLM-optimized | **Lines:** 629 | **Token Budget:** ~3,500 tokens
