# Bird Webhook Format

**Last Updated:** 2025-12-03

---

## Overview

Bird.com sends webhooks for inbound WhatsApp messages containing multimedia content (images, documents, audio).

---

## Webhook Payload Structure

### Text Message
```json
{
  "service": "channels",
  "event": "whatsapp.inbound",
  "payload": {
    "id": "msg-uuid-12345",
    "sender": {
      "contact": {
        "identifierValue": "+573001234567"
      }
    },
    "body": {
      "type": "text",
      "text": {
        "text": "Hello from WhatsApp"
      }
    }
  }
}
```

### Image Message
```json
{
  "service": "channels",
  "event": "whatsapp.inbound",
  "payload": {
    "id": "msg-uuid-12345",
    "sender": {
      "contact": {
        "identifierValue": "+573001234567"
      }
    },
    "body": {
      "type": "image",
      "image": {
        "images": [
          {
            "mediaUrl": "https://media.nest.messagebird.com/workspaces/{wsId}/media/{mediaId}",
            "contentType": "image/jpeg",
            "caption": "ID document front"
          }
        ]
      }
    }
  }
}
```

### Document Message
```json
{
  "service": "channels",
  "event": "whatsapp.inbound",
  "payload": {
    "id": "msg-uuid-12345",
    "sender": {
      "contact": {
        "identifierValue": "+573001234567"
      }
    },
    "body": {
      "type": "file",
      "file": {
        "files": [
          {
            "mediaUrl": "https://media.nest.messagebird.com/workspaces/{wsId}/media/{mediaId}",
            "contentType": "application/pdf",
            "filename": "invoice.pdf"
          }
        ]
      }
    }
  }
}
```

### Audio Message
```json
{
  "service": "channels",
  "event": "whatsapp.inbound",
  "payload": {
    "id": "msg-uuid-12345",
    "sender": {
      "contact": {
        "identifierValue": "+573001234567"
      }
    },
    "body": {
      "type": "audio",
      "audio": {
        "audios": [
          {
            "mediaUrl": "https://media.nest.messagebird.com/workspaces/{wsId}/media/{mediaId}",
            "contentType": "audio/ogg"
          }
        ]
      }
    }
  }
}
```

---

## Key Fields

| Field | Description | Example |
|-------|-------------|---------|
| `service` | Always "channels" | "channels" |
| `event` | Event type | "whatsapp.inbound" |
| `payload.id` | Message ID | "msg-uuid-12345" |
| `payload.sender.contact.identifierValue` | Phone number | "+573001234567" |
| `payload.body.type` | Content type | "image", "file", "audio", "text" |
| `mediaUrl` | Bird CDN URL | Requires AccessKey auth |

---

## Implementation

See `lib/bird/webhook.ts` for parsing logic.
See `lib/bird/types.ts` for Zod schemas.

---

**Source:** https://bird.com/docs (verify before implementation)
