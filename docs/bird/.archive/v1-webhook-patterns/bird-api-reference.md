# Bird API Reference

**For:** api-neero multimodal capabilities
**Purpose:** Quick API reference for Bird integration
**Last Updated:** 2025-12-03

---

## Media Types & Limits

| Type | Content-Type | Webhook Body Type | Max Size |
|------|--------------|-------------------|----------|
| Image | image/jpeg, image/png, image/webp | `image` | 20 MB |
| Document | application/pdf, application/* | `file` | 20 MB |
| Audio | audio/ogg, audio/mp3, audio/m4a | `file` | 16 MB |
| Video | video/mp4 | `file` | 16 MB |

---

## Webhook Payloads

### Image Message
```json
{
  "service": "channels",
  "event": "whatsapp.inbound",
  "payload": {
    "id": "msg_abc123",
    "sender": {
      "contact": { "identifierValue": "+573001234567" }
    },
    "body": {
      "type": "image",
      "image": {
        "images": [{
          "mediaUrl": "https://media.nest.messagebird.com/workspaces/{wsId}/media/{mediaId}",
          "contentType": "image/jpeg"
        }]
      }
    }
  }
}
```

### Document Message
```json
{
  "payload": {
    "body": {
      "type": "file",
      "file": {
        "files": [{
          "contentType": "application/pdf",
          "mediaUrl": "https://media.nest.messagebird.com/...",
          "filename": "document.pdf"
        }]
      }
    }
  }
}
```

### Audio Message
```json
{
  "payload": {
    "body": {
      "type": "file",
      "file": {
        "files": [{
          "contentType": "audio/ogg",
          "mediaUrl": "https://media.nest.messagebird.com/..."
        }]
      }
    }
  }
}
```

---

## Downloading Media

**Authentication:** All downloads require AccessKey
```
Authorization: AccessKey {your-access-key}
```

**Endpoints:**
```
GET https://media.nest.messagebird.com/workspaces/{wsId}/media/{mediaId}
GET https://media.api.bird.com/workspaces/{wsId}/messages/{msgId}/media/{fileId}
```

**Example:**
```typescript
const response = await fetch(mediaUrl, {
  headers: { 'Authorization': `AccessKey ${accessKey}` }
});
const buffer = await response.arrayBuffer();
```

---

## Uploading Media

**1. Get presigned URL:**
```
POST /workspaces/{wsId}/channels/{channelId}/presigned-upload
Authorization: AccessKey {key}
```

**2. Upload file:**
```typescript
const formData = new FormData();
formData.append('file', new Blob([buffer]));
await fetch(uploadUrl, { method: 'POST', body: formData });
```

---

## Sending Messages

### Send Image
```typescript
const payload = {
  receiver: { contacts: [{ identifierValue: "+573001234567" }] },
  body: {
    type: "image",
    image: {
      images: [{
        altText: "Description",
        mediaUrl: "https://cdn.bird.com/media/{mediaId}"
      }]
    }
  }
};

await fetch(`https://api.bird.com/workspaces/${wsId}/channels/${channelId}/messages`, {
  method: 'POST',
  headers: {
    'Authorization': `AccessKey ${accessKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
});
```

### Send Document
```typescript
body: {
  type: "file",
  file: {
    files: [{
      contentType: "application/pdf",
      mediaUrl: "https://cdn.bird.com/media/{mediaId}",
      filename: "contract.pdf"
    }]
  }
}
```

### Send Audio
```typescript
body: {
  type: "file",
  file: {
    files: [{
      contentType: "audio/ogg",
      mediaUrl: "https://cdn.bird.com/media/{mediaId}",
      filename: "voice.ogg"
    }]
  }
}
```

---

## WhatsApp 24-Hour Rule

**Service Window:**
- Template messages: Anytime
- Non-template messages: Only within 24h of last customer message

**Check window:**
```typescript
const response = await fetch(
  `https://api.bird.com/workspaces/${wsId}/channels/${channelId}/conversations/${convId}`,
  { headers: { 'Authorization': `AccessKey ${key}` } }
);

const { serviceWindowExpireAt } = await response.json();
const isOpen = new Date(serviceWindowExpireAt) > new Date();
```

---

## Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 401 | Invalid AccessKey | Check credentials |
| 404 | Media not found | URL expired, request fresh |
| 413 | Payload too large | File exceeds limit |
| 429 | Rate limit exceeded | Implement backoff |
| 500 | Server error | Retry with exponential backoff |

---

## Sources

- [WhatsApp Sending](https://docs.bird.com/api/channels-api/supported-channels/programmable-whatsapp/sending-whatsapp-messages)
- [WhatsApp Receiving](https://docs.bird.com/api/channels-api/supported-channels/programmable-whatsapp/receiving-messages)
- [File Types](https://docs.bird.com/api/channels-api/message-types/files)
- [Image Types](https://docs.bird.com/api/channels-api/message-types/images)
