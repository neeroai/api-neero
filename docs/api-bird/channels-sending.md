# Bird Channels API - Sending Messages

> Purpose: Send messages via WhatsApp, Instagram, Messenger, ChatWeb channels
> Updated: 2025-12-13 | Tokens: ~420 | Edge Compatible: Yes

---

## Core Endpoint

**POST** `/workspaces/{wsId}/channels/{channelId}/messages`

**Auth:** AccessKey header
**Rate Limit:** Not documented (monitor for 429 responses)

---

## Message Patterns

| Pattern | Use When | Field |
|---------|----------|-------|
| **Body** | Within 24h customer care window | `body: {...}` |
| **Template** | After 24h or initiating conversation | `template: {...}` |

**CRITICAL:** WhatsApp 24-hour window - use templates after 24h since last user message. Check service window expiry before sending.

---

## Message Types

| WhatsApp API Type | Channels API Type | Body Field |
|-------------------|-------------------|------------|
| text | text | `body.text.text` |
| image, sticker | image | `body.image.images[]` |
| audio, document, video | file | `body.file.files[]` |
| location | location | `body.location.coordinates` |
| interactive button | text + actions | `body.text.actions[]` |
| interactive list | list | `body.list` |
| interactive carousel | carousel | `body.carousel` |
| template | template | `template.name` |

**Note:** See `/docs/api-bird/platform-specifics.md` for platform-specific constraints (buttons, media sizes, etc.)

---

## Text Messages

**Basic:**
```json
{
  "receiver": {
    "contacts": [{
      "identifierKey": "phonenumber",
      "identifierValue": "+573114242222"
    }]
  },
  "body": {
    "type": "text",
    "text": {
      "text": "Your message here"
    }
  }
}
```

**With Link Preview (WhatsApp):**
```json
{
  "body": {
    "type": "text",
    "text": {
      "text": "Check this: https://example.com",
      "metadata": {
        "whatsapp": {
          "previewUrl": true
        }
      }
    }
  }
}
```

---

## Image Messages

**Schema:**
```json
{
  "body": {
    "type": "image",
    "image": {
      "images": [{
        "mediaUrl": "https://your-cdn.com/image.jpg"
      }]
    }
  }
}
```

**Constraints (WhatsApp):**
- Max size: 5MB
- Formats: JPG, PNG
- See platform-specifics.md for other platforms

---

## File Messages (Audio, Video, PDF)

**Schema:**
```json
{
  "body": {
    "type": "file",
    "file": {
      "files": [{
        "mediaUrl": "https://your-cdn.com/file.pdf",
        "contentType": "application/pdf",
        "filename": "document.pdf"
      }]
    }
  }
}
```

**Constraints (WhatsApp):**
| Type | Max Size | Formats |
|------|----------|---------|
| Audio | 16MB | MP3, OGG, AMR |
| Video | 16MB | MP4, 3GPP |
| Document | 100MB | PDF, DOC, XLS, PPT |

---

## Templates (After 24h Window)

**Schema:**
```json
{
  "receiver": {
    "contacts": [{
      "identifierValue": "+573114242222"
    }]
  },
  "template": {
    "name": "hello_world",
    "locale": "es",
    "variables": {
      "1": "John"
    }
  }
}
```

**Requirements:**
- Templates must be pre-approved by WhatsApp (1-24 hours)
- Use `locale` for language (es, en, pt, etc.)
- Variable substitution via `variables` object

**Template Types:**
- Utility: Account updates, delivery notifications
- Marketing: Promotional messages (requires opt-in)
- Authentication: OTP, verification codes

---

## Media Upload (Presigned URLs)

**NOT NEEDED for Bird Actions v3.0** - Media downloaded from conversation via Conversations API.

**For sending media:** Upload to your CDN first, then reference via `mediaUrl`.

**Edge Runtime Example:**
```typescript
// Upload to external CDN (e.g., Cloudinary, S3)
const formData = new FormData();
formData.append('file', buffer);

const upload = await fetch('https://your-cdn.com/upload', {
  method: 'POST',
  body: formData
});

const {url} = await upload.json();

// Use in message
const message = {
  body: {
    type: 'image',
    image: {
      images: [{mediaUrl: url}]
    }
  }
};
```

---

## Service Window Check

**Endpoint:** GET `/workspaces/{wsId}/channels/{channelId}/contacts/{contactId}`

**Query Params:**
| Name | Required | Description |
|------|----------|-------------|
| contactIdentifierValue | yes | Phone number (e.g., +573114242222) |

**Response:**
```yaml
serviceWindowExpireAt: timestamp | null
isPermanentSession: boolean | null
```

**Usage:**
```typescript
const res = await fetch(
  `https://api.bird.com/workspaces/${wsId}/channels/${channelId}/contacts/${contactId}?contactIdentifierValue=%2B573114242222`,
  {headers: {'Authorization': `AccessKey ${key}`}}
);

const {serviceWindowExpireAt} = await res.json();

if (!serviceWindowExpireAt || new Date(serviceWindowExpireAt) < new Date()) {
  // Use template
} else {
  // Can send normal message
}
```

---

## Edge Runtime Notes

All sending operations use Web APIs only:
- `fetch()` for POST requests (no Node.js http)
- `FormData` for media uploads (if needed)
- No crypto.createHmac (AccessKey is plain header)

**Vercel Edge Functions:**
- 25s timeout (sufficient for message send)
- No file system access (upload media to external CDN)
- Memory limit: 128MB

**Full API Reference:** https://docs.bird.com/api/channels-api

---

**Lines:** 90 / 100 | **Tokens:** ~420
