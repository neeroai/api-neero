# Bird Conversations API

> Purpose: Fetch conversation history for monitoring and media extraction via Bird Actions v3.0
> Updated: 2025-12-13 | Tokens: ~450 | Edge Compatible: Yes

---

## Overview

Conversations API tracks WhatsApp chat history with Bird AI Employees. Use to extract media from user messages, monitor conversation context, and analyze performance.

**Use Cases:**
- Extract media URLs from user messages (v3.0 Actions pattern)
- Monitor conversation context and status
- Fetch message history for analytics

**Auth:** AccessKey header (no HMAC validation required)

---

## Endpoints

| Method | Path | Purpose | Rate Limit |
|--------|------|---------|------------|
| GET | /workspaces/{id}/conversations | List all conversations | Not documented (monitor 429) |
| GET | /workspaces/{id}/conversations/{id} | Get conversation details | Not documented (monitor 429) |
| GET | /workspaces/{id}/conversations/{id}/messages | Fetch messages (CRITICAL for media extraction) | Not documented (monitor 429) |

**Base URL:** `https://api.bird.com`

---

## GET /conversations/{id}/messages

**Purpose:** Fetch conversation messages for media extraction (CRITICAL for v3.0 Actions pattern)

**Params:**
| Name | Type | Required | Default | Notes |
|------|------|----------|---------|-------|
| limit | number | no | 10 | Max: 100, use 5 for latest media |
| offset | number | no | 0 | Pagination (deprecated, use pageToken) |
| pageToken | string | no | - | For pagination beyond 100 results |
| direction | string | no | desc | asc=oldest first, desc=newest |

**Response Schema:**
```yaml
results:
  - id: uuid
    conversationId: uuid
    sender:
      type: contact | bot
      displayName: string
    body:
      type: text | image | file | location
      image:                           # Only for type=image
        images:
          - mediaUrl: string
      file:                            # For audio, PDF, video, stickers
        files:
          - mediaUrl: string
            contentType: string        # audio/ogg, application/pdf, video/mp4, image/webp
            filename: string           # Optional, PDFs have it
    createdAt: timestamp
    status: delivered | read
count: number
nextPageToken: string                  # For pagination
```

**Edge Runtime Example:**
```typescript
const res = await fetch(
  `https://api.bird.com/workspaces/${wsId}/conversations/${convId}/messages?limit=5`,
  {headers: {'Authorization': `AccessKey ${key}`}}
);
const {results} = await res.json();
```

**Filtering for Media (v3.0 Pattern):**
```typescript
// Get latest media message (skip bot acknowledgments)
const contactMedia = results
  .filter(m => m.sender.type === 'contact')
  .filter(m => m.body.type === 'image' || m.body.type === 'file')
  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

const latestMedia = contactMedia[0]; // Most recent user media
```

**Why limit=5:** Bird AI Employee sends acknowledgment messages BEFORE calling action (4-10s gap). Use limit=5 and filter to skip bot messages.

**Errors:** 401 (invalid AccessKey) | 404 (conversation not found) | 429 (rate limit)

---

## GET /conversations

**Purpose:** List conversations filtered by status or AI Employee

**Params:**
| Name | Type | Required | Default | Notes |
|------|------|----------|---------|-------|
| limit | number | no | 10 | Max: 100 |
| status | string | no | - | active | closed |
| pageToken | string | no | - | For pagination |

**Response Schema:**
```yaml
results:
  - id: uuid
    status: active | closed
    channelId: uuid
    featuredParticipants:
      - type: contact | bot
        displayName: string
        contact:                      # Only for type=contact
          identifierValue: string     # Phone number
    lastMessage:
      type: text | image | file
      preview:
        text: string
      sender:
        type: contact | bot
      createdAt: timestamp
      status: delivered | read
    attributes:
      llmbotIds: uuid                 # AI Employee ID
      typingStatus: start | end
    lastMessageIncomingAt: timestamp  # Last user message
    lastMessageOutgoingAt: timestamp  # Last bot message
count: number
nextPageToken: string
```

**Client-Side AI Employee Filter:**
```typescript
conversations.filter(c =>
  c.featuredParticipants.some(p =>
    p.type === 'bot' && p.displayName === 'multimodal'
  )
)
```

---

## GET /conversations/{id}

**Purpose:** Get full conversation details including participants and channel

**Response:** Same structure as single conversation object from GET /conversations (see above)

**Use Case:** Verify conversation belongs to correct AI Employee before processing

---

## Media Download

**Media URLs:** All mediaUrl fields require AccessKey authorization

**Download Pattern:**
```typescript
// Edge Runtime compatible
const buffer = await fetch(mediaUrl, {
  headers: {'Authorization': `AccessKey ${key}`}
}).then(r => r.arrayBuffer());
```

**Media URL Expiration:** Presigned S3 URLs expire after 900 seconds (15 minutes). Download immediately or re-fetch.

**CDN URL Format:**
```
https://media.api.bird.com/workspaces/{wsId}/messages/{msgId}/media/{mediaId}
```

---

## Message Structure Reference

See `/docs/api-bird/channels-receiving.md` for complete message body schemas and media type detection patterns.

**Quick Reference:**
- Images: `body.type: "image"` with `body.image.images[]`
- All other media: `body.type: "file"` with `body.file.files[]` and `contentType` discrimination
- Stickers: `contentType: "image/webp"` (unique - no `whatsapp.media.type` field)

---

## Edge Runtime Notes

All endpoints use standard `fetch()` with Web APIs only:
- Authorization: AccessKey header (no crypto.createHmac needed)
- Media download: `ReadableStream` or `arrayBuffer()`
- No Node.js dependencies (fs, Buffer, crypto module)

**Compatible with Vercel Edge Functions:**
- 25s default timeout (sufficient for API calls)
- 128MB memory limit (handle media download carefully)
- No file system access (stream or buffer media in memory)

---

**Lines:** 93 / 100 | **Tokens:** ~450
