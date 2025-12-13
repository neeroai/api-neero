# WhatsApp Message Structures via Bird API

**Version:** 1.0 | **Date:** 2025-12-13 | **Status:** Reference

> Complete documentation of WhatsApp message structures as received via Bird Conversations API

---

## Overview

WhatsApp sends different message structures depending on media type. All structures documented here are from actual Bird API responses (`/docs/api-bird/receiving-messages.md`).

**Key Finding:** Audio, video, stickers, and documents all use `type: "file"` with different `contentType` values.

---

## Message Type Classification

| User Sends | WhatsApp Type | Bird `body.type` | Detection Method |
|------------|---------------|------------------|------------------|
| Image | `image` | `"image"` | `body.image.images[]` exists |
| Document/PDF | `document` | `"file"` | `contentType: "application/pdf"` |
| Audio/Voice | `audio` | `"file"` | `contentType: "audio/ogg"` |
| Video | `video` | `"file"` | `contentType: "video/mp4"` |
| Sticker | `sticker` | `"file"` | `contentType: "image/webp"` |
| Location | `location` | `"location"` | `body.location` exists |
| Text | `text` | `"text"` | `body.type === "text"` |

---

## Image Messages

**Structure** (from `docs/api-bird/receiving-messages.md` lines 70-79):

```json
{
  "id": "msg_uuid",
  "conversationId": "conv_uuid",
  "sender": {
    "type": "contact"
  },
  "body": {
    "type": "image",
    "image": {
      "images": [{
        "mediaUrl": "https://media.nest.messagebird.com/workspaces/xxx/media/xxx"
      }]
    }
  },
  "createdAt": "2025-12-13T12:00:00Z"
}
```

**Key Fields:**
- `body.type`: Always `"image"`
- `body.image.images[]`: Array of images (WhatsApp allows multiple)
- `body.image.images[0].mediaUrl`: CDN URL for download

**Detection:**
```typescript
if (message.body.type === 'image' && message.body.image?.images?.[0]?.mediaUrl) {
  // Process as image
}
```

---

## Document Messages

**Structure** (from `docs/api-bird/receiving-messages.md` lines 116-127):

```json
{
  "body": {
    "type": "file",
    "file": {
      "files": [{
        "contentType": "application/pdf",
        "mediaUrl": "https://media.nest.messagebird.com/workspaces/xxx/media/xxx",
        "filename": "factura.pdf"
      }]
    }
  }
}
```

**Key Fields:**
- `body.type`: Always `"file"` (NOT "document")
- `body.file.files[]`: Array of files
- `body.file.files[0].contentType`: `"application/pdf"` or similar
- `body.file.files[0].filename`: Original filename (optional)

**Detection:**
```typescript
if (message.body.type === 'file') {
  const contentType = message.body.file?.files?.[0]?.contentType;
  if (contentType?.startsWith('application/') || contentType?.startsWith('video/')) {
    // Process as document
  }
}
```

---

## Audio Messages (Voice Notes)

**Structure** (from `docs/api-bird/receiving-messages.md` lines 311-320):

```json
{
  "body": {
    "type": "file",
    "file": {
      "files": [{
        "contentType": "audio/ogg; codecs=opus",
        "mediaUrl": "https://media.nest.messagebird.com/workspaces/xxx/media/xxx"
      }]
    }
  }
}
```

**Key Fields:**
- `body.type`: Always `"file"` (NOT "audio")
- `body.file.files[0].contentType`: `"audio/ogg"`, `"audio/mpeg"`, etc.
- No `filename` for voice notes

**Detection:**
```typescript
if (message.body.type === 'file') {
  const contentType = message.body.file?.files?.[0]?.contentType;
  if (contentType?.startsWith('audio/')) {
    // Process as audio
  }
}
```

---

## Video Messages

**Structure** (from `docs/api-bird/receiving-messages.md` lines 215-224):

```json
{
  "body": {
    "type": "file",
    "file": {
      "files": [{
        "contentType": "video/mp4",
        "mediaUrl": "https://media.nest.messagebird.com/workspaces/xxx/media/xxx"
      }]
    }
  }
}
```

**Key Fields:**
- `body.type`: Always `"file"` (NOT "video")
- `body.file.files[0].contentType`: `"video/mp4"` or similar

---

## Sticker Messages

**Structure** (from `docs/api-bird/receiving-messages.md` lines 166-177):

```json
{
  "body": {
    "type": "file",
    "file": {
      "files": [{
        "contentType": "image/webp",
        "mediaUrl": "https://media.nest.messagebird.com/workspaces/xxx/media/xxx"
      }]
    }
  }
}
```

**Key Fields:**
- `body.type`: Always `"file"` (NOT "sticker")
- `body.file.files[0].contentType`: `"image/webp"`

**Detection:**
```typescript
if (message.body.type === 'file') {
  const contentType = message.body.file?.files?.[0]?.contentType;
  if (contentType?.startsWith('image/')) {
    // Sticker - treat as image
  }
}
```

---

## Location Messages

**Structure** (from `docs/api-bird/receiving-messages.md` lines 262-274):

```json
{
  "body": {
    "type": "location",
    "location": {
      "coordinates": {
        "latitude": 4.6097,
        "longitude": -74.0817
      },
      "location": {
        "address": "Bogotá, Colombia",
        "label": "Home"
      }
    }
  }
}
```

**Key Fields:**
- `body.type`: Always `"location"`
- `body.location.coordinates`: Latitude/longitude
- `body.location.location.address`: Optional human-readable address

**Note:** Location messages are NOT processable by our API. Return clear error.

---

## Text Messages

**Structure:**

```json
{
  "body": {
    "type": "text",
    "text": {
      "text": "Hola"
    }
  }
}
```

**Key Fields:**
- `body.type`: Always `"text"`
- `body.text.text`: Message content

**Note:** Text messages have no media to process.

---

## Implementation Pattern (v3.0)

### Zod Schema

```typescript
const BirdMessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  sender: z.object({
    type: z.enum(['contact', 'bot']),
  }),
  body: z.object({
    type: z.enum(['text', 'image', 'file', 'location']),

    // Image structure
    image: z.object({
      images: z.array(z.object({
        mediaUrl: z.string(),
      }))
    }).optional(),

    // File structure (documents, audio, video, stickers)
    file: z.object({
      files: z.array(z.object({
        mediaUrl: z.string(),
        contentType: z.string(),
        filename: z.string().optional(),
      }))
    }).optional(),

    // Location structure (not processable)
    location: z.object({
      coordinates: z.object({
        latitude: z.number(),
        longitude: z.number(),
      }),
      location: z.object({
        address: z.string().optional(),
        label: z.string().optional(),
      }).optional(),
    }).optional(),
  }),
  createdAt: z.string(),
});
```

### Extraction Logic

```typescript
function extractMediaFromMessage(message: BirdMessage): ExtractedMedia | null {
  const { type } = message.body;

  // Image
  if (type === 'image' && message.body.image?.images?.[0]?.mediaUrl) {
    return {
      mediaUrl: message.body.image.images[0].mediaUrl,
      mediaType: 'image',
    };
  }

  // File (document, audio, video, sticker)
  if (type === 'file' && message.body.file?.files?.[0]) {
    const file = message.body.file.files[0];

    if (!file.mediaUrl || !file.contentType) {
      return null;
    }

    // Detect media type from contentType
    let mediaType: 'image' | 'document' | 'audio';

    if (file.contentType.startsWith('audio/')) {
      mediaType = 'audio';
    } else if (file.contentType.startsWith('image/')) {
      // Stickers
      mediaType = 'image';
    } else {
      // PDFs, videos, etc.
      mediaType = 'document';
    }

    return { mediaUrl: file.mediaUrl, mediaType };
  }

  return null;
}
```

---

## Common Mistakes

### ❌ Wrong: Assuming audio has separate structure

```typescript
// This is WRONG - audio doesn't have body.audio
if (message.body.type === 'audio' && message.body.audio?.url) {
  // This never executes
}
```

### ✓ Correct: Audio uses file structure

```typescript
if (message.body.type === 'file' && message.body.file?.files?.[0]) {
  const contentType = message.body.file.files[0].contentType;
  if (contentType.startsWith('audio/')) {
    // Correctly detects audio
  }
}
```

### ❌ Wrong: Assuming image has url field

```typescript
// This is WRONG - image uses images[] array
if (message.body.image?.url) {
  // This never executes
}
```

### ✓ Correct: Image uses images[] array

```typescript
if (message.body.image?.images?.[0]?.mediaUrl) {
  // Correctly accesses image URL
}
```

---

## Related Documentation

- `/docs/bird/bird-ai-employees-setup-guide.md` - Setup guide for Bird AI Employees
- `/docs/bird/bird-whatsapp-media-flow.md` - WhatsApp → Bird media flow
- `/docs/bird/bird-conversations-api-capabilities.md` - Bird Conversations API
- `/docs/api-bird/receiving-messages.md` - Source of truth for message structures
- `/lib/bird/fetch-latest-media.ts` - Implementation

---

**Format:** LLM-optimized | **Lines:** ~350 | **Token Budget:** ~2,000 tokens
