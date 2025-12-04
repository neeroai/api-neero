# Bird Media CDN

**Last Updated:** 2025-12-03

---

## Overview

Bird stores WhatsApp media files on their CDN. Downloading requires authentication with AccessKey.

---

## Media URL Format

```
https://media.nest.messagebird.com/workspaces/{workspaceId}/media/{mediaId}
```

**Example:**
```
https://media.nest.messagebird.com/workspaces/ws-abc123/media/media-xyz789
```

---

## Authentication

### Access Key

Download requests require `Authorization` header:

```
Authorization: AccessKey {BIRD_ACCESS_KEY}
```

**Example:**
```bash
curl -H "Authorization: AccessKey live_12345abc" \
  https://media.nest.messagebird.com/workspaces/ws-abc123/media/media-xyz789
```

---

## Implementation (Edge Runtime)

### Download Media

```typescript
async function downloadMedia(mediaUrl: string): Promise<ArrayBuffer> {
  const response = await fetch(mediaUrl, {
    headers: {
      'Authorization': `AccessKey ${process.env.BIRD_ACCESS_KEY}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status}`);
  }

  return await response.arrayBuffer();
}
```

### Convert to Base64 (for AI APIs)

```typescript
async function downloadMediaAsBase64(mediaUrl: string): Promise<string> {
  const buffer = await downloadMedia(mediaUrl);
  const bytes = new Uint8Array(buffer);

  // Edge Runtime: use btoa
  return btoa(String.fromCharCode(...bytes));
}
```

---

## Supported Content Types

### Images
- `image/jpeg`
- `image/png`
- `image/webp`

### Documents
- `application/pdf`
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (DOCX)

### Audio
- `audio/ogg` (WhatsApp voice notes)
- `audio/mpeg` (MP3)
- `audio/wav`

---

## File Size Limits

| Type | WhatsApp Limit | Bird Processing | Claude Vision | Deepgram |
|------|---------------|-----------------|---------------|----------|
| Image | 16 MB | 16 MB | 5 MB | N/A |
| Document | 100 MB | 100 MB | 10 MB | N/A |
| Audio | 16 MB | 16 MB | N/A | 2 hours |

**Note:** If file exceeds AI service limits, implement chunking or compression.

---

## Error Handling

### 401 Unauthorized
```json
{
  "error": "Invalid AccessKey"
}
```
**Fix:** Check `BIRD_ACCESS_KEY` environment variable.

### 404 Not Found
```json
{
  "error": "Media not found"
}
```
**Cause:** Media expired (Bird CDN TTL ~30 days) or invalid ID.

### 403 Forbidden
```json
{
  "error": "Workspace access denied"
}
```
**Cause:** AccessKey doesn't have permission for this workspace.

---

## Edge Runtime Considerations

1. **No Filesystem:**
   - Can't save to disk
   - Process in-memory only
   - Use ArrayBuffer → Base64 for AI APIs

2. **Memory Limit:**
   - 128 MB total
   - Large files (>50 MB) may cause OOM
   - Implement streaming for large files if needed

3. **Timeout:**
   - 25 seconds default
   - Download + processing must complete within limit

---

## Implementation

See `lib/bird/media.ts:downloadMedia`

---

**Source:** https://bird.com/docs (verify before implementation)
