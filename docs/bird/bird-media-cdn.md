# Bird Media CDN

**Last Updated:** 2026-01-22

---

## Overview

Bird stores WhatsApp media files on their CDN. Media URLs are S3 presigned URLs that include authentication in query parameters.

---

## CRITICAL: Presigned URLs (2026-01-22)

Bird media URLs are **S3 presigned URLs** that include authentication in query parameters (`X-Amz-Algorithm`, `X-Amz-Credential`, `X-Amz-Signature`, etc.).

**DO NOT add Authorization header:**

```typescript
// WRONG - causes AWS error: "Only one auth mechanism allowed"
fetch(mediaUrl, {
  headers: { 'Authorization': `AccessKey ${key}` }
});

// CORRECT - presigned URL handles auth via query params
fetch(mediaUrl);
```

**Error if header added:**
```xml
<Code>InvalidArgument</Code>
<Message>Only one auth mechanism allowed; only the X-Amz-Algorithm query parameter,
Signature query string parameter or the Authorization header should be specified</Message>
```

**Reference:** Bird Conversations API returns S3 presigned URLs in `Location` header (see `bird-conversations-api-capabilities.md` L134).

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

### Presigned URLs (Current)

Bird Conversations API returns **S3 presigned URLs** that include authentication in query parameters. No Authorization header needed.

**Example URL:**
```
https://media.api.bird.com/workspaces/{id}/messages/{id}/media/{id}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...&X-Amz-Signature=...
```

**Correct fetch:**
```bash
curl https://media.api.bird.com/workspaces/.../media/...?X-Amz-Algorithm=...
```

### Legacy Access Key (Deprecated)

Older media URLs (non-presigned) may require `Authorization` header. Current API (2026-01-22) uses presigned URLs exclusively.

---

## Implementation (Edge Runtime)

### Download Media

```typescript
async function downloadMedia(mediaUrl: string): Promise<ArrayBuffer> {
  // No Authorization header - presigned URLs handle auth via query params
  const response = await fetch(mediaUrl);

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
