# Bird Channels API - Receiving Messages

> Purpose: Inbound message structures from WhatsApp via Bird Channels API
> Updated: 2025-12-13 | Tokens: ~400 | Edge Compatible: Yes

---

## Message Type Detection

| User Sends | Bird `body.type` | Detection Logic | `contentType` | `filename` |
|------------|------------------|-----------------|---------------|------------|
| Image | `image` | `body.image?.images[]` exists | N/A | No |
| Audio | `file` | `contentType.startsWith('audio/')` | `audio/ogg` | No |
| PDF | `file` | `contentType === 'application/pdf'` | `application/pdf` | Yes |
| Video | `file` | `contentType.startsWith('video/')` | `video/mp4` | No |
| Sticker | `file` | `contentType === 'image/webp'` | `image/webp` | No |
| Text | `text` | `body.type === 'text'` | N/A | No |
| Location | `location` | `body.type === 'location'` | N/A | No |

**Key Insight:** Images are ONLY media type with dedicated `body.type: "image"`. All other media use `body.type: "file"` with `contentType` discrimination.

**Sticker Detection:** NO `whatsapp.media.type` in `meta.extraInformation` (unique to stickers). Detect via `contentType: "image/webp"` only.

---

## Type-Safe Detection (Edge Runtime)

```typescript
// From lib/bird/types.ts
if (body.type === 'image' && body.image?.images?.[0]) {
  const mediaUrl = body.image.images[0].mediaUrl;
  // Process image
}

if (body.type === 'file' && body.file?.files?.[0]) {
  const file = body.file.files[0];
  const contentType = file.contentType;

  if (contentType.startsWith('audio/')) { /* Voice note */ }
  if (contentType === 'application/pdf') { /* Document */ }
  if (contentType.startsWith('video/')) { /* Video */ }
  if (contentType === 'image/webp') { /* Sticker */ }
}
```

---

## Image Messages

**Schema:**
```yaml
body:
  type: image
  image:
    images:
      - mediaUrl: string
        altText: string          # Optional
meta:
  extraInformation:
    whatsapp.media.type: image
```

**Example:**
```json
{
  "body": {
    "type": "image",
    "image": {
      "images": [{
        "mediaUrl": "https://media.api.bird.com/workspaces/{wsId}/messages/{msgId}/media/{mediaId}"
      }]
    }
  }
}
```

---

## File Messages (Audio, PDF, Video, Stickers)

**Schema:**
```yaml
body:
  type: file
  file:
    files:
      - mediaUrl: string
        contentType: string       # audio/ogg | application/pdf | video/mp4 | image/webp
        filename: string          # Optional, PDFs have it
        metadata:                 # Optional
          isAnimated: boolean     # For stickers only
meta:
  extraInformation:
    whatsapp.media.type: audio | document | video
    # NOTE: Stickers have NO whatsapp.media.type field
```

**Audio (Voice Note):**
```json
{
  "body": {
    "type": "file",
    "file": {
      "files": [{
        "contentType": "audio/ogg",
        "mediaUrl": "https://media.api.bird.com/..."
      }]
    }
  }
}
```

**PDF Document:**
```json
{
  "body": {
    "type": "file",
    "file": {
      "files": [{
        "contentType": "application/pdf",
        "mediaUrl": "https://media.api.bird.com/...",
        "filename": "document.pdf"
      }]
    }
  }
}
```

**Sticker (Animated WebP):**
```json
{
  "body": {
    "type": "file",
    "file": {
      "files": [{
        "contentType": "image/webp",
        "mediaUrl": "https://media.api.bird.com/...",
        "metadata": {
          "isAnimated": true
        }
      }]
    }
  }
}
```

---

## Text Messages

**Schema:**
```yaml
body:
  type: text
  text:
    text: string
```

---

## Interactive Message Replies

**Button Click:**
```yaml
body:
  type: text
  text:
    text: "Button label"
meta:
  extraInformation:
    whatsapp.interactive.type: button_reply
    whatsapp.interactive.button_reply.id: button_1
```

**List Selection:**
Same structure as button, but `whatsapp.interactive.type: list_reply`.

---

## Location Messages

**Schema:**
```yaml
body:
  type: location
  location:
    coordinates:
      latitude: number
      longitude: number
    location:              # Optional
      address: string
      label: string
```

**Note:** Not processable by multimodal API (no AI analysis). Filter out with `body.type !== 'location'`.

---

## Media Download (Edge Runtime)

**Authorization Required:** All `mediaUrl` fields require AccessKey header.

**Download Pattern:**
```typescript
// Edge Runtime compatible
const buffer = await fetch(mediaUrl, {
  headers: {'Authorization': `AccessKey ${key}`}
}).then(r => r.arrayBuffer());

// Or stream for large files
const stream = await fetch(mediaUrl, {
  headers: {'Authorization': `AccessKey ${key}`}
}).then(r => r.body); // ReadableStream
```

**Media URL Format:**
```
https://media.api.bird.com/workspaces/{wsId}/messages/{msgId}/media/{mediaId}
```

**Expiration:** Presigned S3 URLs expire after 15 minutes. Download immediately or re-fetch.

---

## Complete Message Object (Channels API)

**Common Fields:**
```yaml
id: uuid
channelId: uuid
sender:
  contact:
    id: uuid
    identifierKey: phonenumber
    identifierValue: string       # Phone number
receiver:
  connector:
    id: uuid
body: # See schemas above
status: delivered | read
direction: incoming | outgoing
createdAt: timestamp
updatedAt: timestamp
```

**Conversations API Structure:** See `/docs/api-bird/conversations-api.md` for different structure (sender.type, sender.displayName).

---

## Edge Runtime Notes

All media handling uses Web APIs only:
- `fetch()` for downloads (no Node.js http module)
- `arrayBuffer()` or `ReadableStream` for media (no Buffer or fs)
- `crypto.subtle` for validation (no crypto.createHmac)

**Vercel Edge Functions:**
- 25s timeout for non-streaming (sufficient for media download <16MB)
- 128MB memory limit (handle large files via streaming)
- No file system access (buffer in memory or stream to external service)

---

**Lines:** 85 / 100 | **Tokens:** ~400
