# Bird Channels - Platform-Specific Patterns

> Purpose: Platform-specific constraints and patterns for WhatsApp, Instagram, Messenger, ChatWeb
> Updated: 2025-12-13 | Tokens: ~600 | Edge Compatible: Yes

---

## WhatsApp

**Primary platform for Bird AI Employees Actions v3.0**

### 24-Hour Customer Care Window

**Rule:** Can only send non-template messages within 24 hours of last user message.

**Window States:**
| State | Allowed Messages | Use Case |
|-------|------------------|----------|
| Open (< 24h) | Text, images, files, interactive | Normal conversation |
| Closed (> 24h) | Templates only | Re-engagement, notifications |

**Check Window:** Use Contacts API `/channels/{id}/contacts/{contactId}?contactIdentifierValue={phone}`

**Response:**
- `serviceWindowExpireAt: null` → Use template
- `serviceWindowExpireAt: future` → Can send normal message
- `serviceWindowExpireAt: past` → Use template

---

### Templates

**Approval Required:** 1-24 hours for new templates (plan ahead)

**Template Types:**
| Type | Purpose | Opt-In Required |
|------|---------|-----------------|
| Utility | Account updates, order status, delivery | No |
| Marketing | Promotions, offers, campaigns | Yes (explicit) |
| Authentication | OTP, 2FA codes | No |

**Locale:** Use 2-letter codes (es, en, pt, etc.)

**Variables:** Substitute via `variables: {"1": "value"}` format

**Example:**
```json
{
  "template": {
    "name": "order_shipped",
    "locale": "es",
    "variables": {
      "1": "Juan",
      "2": "ABC123"
    }
  }
}
```

---

### Interactive Messages

**Buttons (Quick Replies):**
- Max: 3 buttons per message
- Character limit: 20 characters per button
- Alternative: Use lists for >3 options

**Lists:**
- Max: 10 rows per list
- Sections: Up to 10 sections
- Description: 72 characters max

**Carousel:**
- Max: 10 cards
- Each card: Image + text + buttons
- Limited platform support

---

### Media Constraints

| Type | Max Size | Formats | Notes |
|------|----------|---------|-------|
| Image | 5MB | JPG, PNG | Recommended: <1MB for fast delivery |
| Audio | 16MB | MP3, OGG, AMR | Voice notes: OGG codec |
| Video | 16MB | MP4, 3GPP | H.264 codec recommended |
| Document | 100MB | PDF, DOC, XLS, PPT | PDFs most common |
| Sticker | 500KB | WebP (static/animated) | 512x512px recommended |

---

### WhatsApp-Specific Fields

**Link Preview:**
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

**Interactive Reply Metadata:**
```json
{
  "meta": {
    "extraInformation": {
      "whatsapp.interactive.type": "button_reply",
      "whatsapp.interactive.button_reply.id": "btn_1"
    }
  }
}
```

---

## Instagram

**Integration:** Instagram Direct Messages via Bird Channels

### Message Types

**Supported:**
- Text messages
- Images (JPG, PNG)
- Story replies (incoming only)
- Quick replies (limited to 13 characters)

**Not Supported:**
- Templates (no 24h window constraint)
- Files/documents
- Audio messages
- Carousel

---

### Story Replies

**Detection:**
```json
{
  "body": {
    "type": "image",
    "image": {
      "metadata": {
        "storyType": "mention" | "reply"
      }
    }
  }
}
```

**Use Case:** User replies to Instagram Story mentioning your business

---

### Instagram-Specific Constraints

| Feature | Limit | Notes |
|---------|-------|-------|
| Quick reply buttons | 13 chars | Shorter than WhatsApp |
| Image size | 8MB | Larger than WhatsApp |
| Text message | 1000 chars | Standard limit |

---

## Messenger (Facebook)

**Integration:** Facebook Messenger via Bird Channels

### Message Types

**Supported:**
- Text messages
- Images, files
- Quick replies (max 13 buttons)
- Generic templates
- Button templates

**Not Supported:**
- WhatsApp-style templates
- 24h window (different messaging window rules)

---

### Quick Replies

**Format:**
```json
{
  "body": {
    "type": "text",
    "text": {
      "text": "Choose an option:",
      "actions": [
        {
          "type": "reply",
          "reply": {
            "text": "Option 1"
          }
        }
      ]
    }
  }
}
```

**Limits:**
- Max: 13 quick replies
- Character limit: 20 characters per button

---

### Handover Protocol

**Use Case:** Transfer conversation to human agent

**Implementation:** Via Messenger platform settings (not Bird API)

---

## ChatWeb

**Integration:** Bird's web chat widget

### Message Types

**Supported:**
- Text messages
- Images, files
- Rich media (carousel, cards)
- Custom actions

**Advantages:**
- No 24h window constraint
- Full control over UI
- No template approval needed

---

### Widget Integration

**Embed:**
```html
<script src="https://cdn.bird.com/chat-widget.js"></script>
<script>
  BirdChat.init({
    channelId: 'your-channel-id',
    workspaceId: 'your-workspace-id'
  });
</script>
```

**Session Management:**
- Sessions persist across page loads
- Optional: Authenticate users via JWT

---

## Platform Comparison

| Feature | WhatsApp | Instagram | Messenger | ChatWeb |
|---------|----------|-----------|-----------|---------|
| **24h Window** | Yes | No | Different rules | No |
| **Templates** | Required (>24h) | No | No | No |
| **Template Approval** | 1-24 hours | N/A | N/A | N/A |
| **Max Buttons** | 3 | - | 13 | Unlimited |
| **Button Chars** | 20 | 13 | 20 | Flexible |
| **Image Size** | 5MB | 8MB | 25MB | Flexible |
| **Audio** | Yes (16MB) | No | Yes (25MB) | Yes |
| **Documents** | Yes (100MB) | No | Yes (25MB) | Yes |
| **Stickers** | Yes (WebP) | No | Yes | No |
| **Link Preview** | Yes (opt-in) | Yes | Yes | Yes |
| **Read Receipts** | Yes | Yes | Yes | Yes |

---

## Cross-Platform Best Practices

**Media Optimization:**
- Images: Compress to <1MB for fast delivery (all platforms)
- Videos: Use H.264 codec, <10MB recommended
- Documents: PDFs preferred over DOC/XLS

**Message Timing:**
- WhatsApp: Check service window before sending
- Instagram/Messenger: No window constraints
- ChatWeb: Send anytime

**Templates:**
- WhatsApp: Pre-approve all templates, test with locale variants
- Others: Not applicable

**Interactive Messages:**
- Design for 3 buttons max (WhatsApp constraint)
- Use lists for >3 options (WhatsApp/Messenger)
- ChatWeb: Full flexibility

---

## Edge Runtime Compatibility

All platform-specific operations use Web APIs only:
- `fetch()` for API calls (no Node.js http)
- Standard `Date` for timestamp comparisons
- No platform-specific native dependencies

**Vercel Edge Functions:**
- All platforms supported
- No special handling needed for platform detection
- Use `channelId` from conversation to determine platform

---

**Lines:** 120 / 150 | **Tokens:** ~600
