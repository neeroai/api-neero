# Bird Media CDN

**Last Updated:** 2026-01-22

---

## Overview

Bird stores WhatsApp media files on their CDN. Media URLs are S3 presigned URLs that include authentication in query parameters.

---

## CRITICAL: Two-Step Media Download (2026-01-22)

Bird uses a **two-step process** for media downloads (see `bird-conversations-api-capabilities.md` L134):

### Step 1: Bird Media URL (needs auth)
```
https://media.api.bird.com/workspaces/{id}/messages/{id}/media/{id}
```
- Requires `Authorization: AccessKey {key}` header
- Returns 200 OK with `Location` header
- Location contains S3 presigned URL

### Step 2: S3 Presigned URL (no auth header)
```
https://...s3.amazonaws.com/...?X-Amz-Algorithm=...&X-Amz-Signature=...
```
- Has auth in query parameters (`X-Amz-Algorithm`, `X-Amz-Signature`, etc.)
- NO Authorization header needed
- Causes 400 error if Authorization header added

### Implementation

**Detect presigned URLs and conditionally add auth:**

```typescript
const isPresignedUrl = url.includes('X-Amz-Algorithm') || url.includes('X-Amz-Signature');

const headers: Record<string, string> = {};
if (!isPresignedUrl && process.env.BIRD_ACCESS_KEY) {
  headers.Authorization = `AccessKey ${process.env.BIRD_ACCESS_KEY}`;
}

const response = await fetch(url, { headers });
```

**Why this works:**
- Bird media URLs → Authorization header added → 200 OK with redirect
- S3 presigned URLs → No Authorization header → Downloads directly
- Fetch automatically follows redirects and drops Authorization header when crossing origins

**Reference:** `bird-conversations-api-capabilities.md` L134

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

## Implementation (Edge Runtime)

### Download Media with Auto-Detection

```typescript
async function downloadMedia(mediaUrl: string): Promise<ArrayBuffer> {
  // Detect if URL is presigned (has AWS signature in query params)
  const isPresignedUrl =
    mediaUrl.includes('X-Amz-Algorithm') ||
    mediaUrl.includes('X-Amz-Signature');

  const headers: Record<string, string> = {};

  // Only add Authorization header for non-presigned Bird media URLs
  if (!isPresignedUrl && process.env.BIRD_ACCESS_KEY) {
    headers.Authorization = `AccessKey ${process.env.BIRD_ACCESS_KEY}`;
  }

  const response = await fetch(mediaUrl, { headers });

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
