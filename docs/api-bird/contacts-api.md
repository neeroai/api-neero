# Bird Contacts API

> Purpose: Contact lookup and service window management for message routing
> Updated: 2025-12-13 | Tokens: ~330 | Edge Compatible: Yes

---

## Overview

Contacts API provides contact information and channel-specific metadata needed for conversation and message management.

**Use Cases:**
- Check WhatsApp 24-hour service window expiry
- Resolve contact identifiers (phone number to contact ID)
- Get contact details from conversation participants

**Auth:** AccessKey header

---

## Endpoints

| Method | Path | Purpose | Rate Limit |
|--------|------|---------|------------|
| GET | /workspaces/{id}/channels/{channelId}/contacts/{contactId} | Get channel contact info (service window) | Not documented |
| GET | /workspaces/{id}/contacts/{contactId} | Get contact details | Not documented |

**Base URL:** `https://api.bird.com`

---

## GET /channels/{channelId}/contacts/{contactId}

**Purpose:** Check WhatsApp service window expiry (CRITICAL for template vs normal message decision)

**Params:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| contactIdentifierValue | string | yes | Phone number (e.g., +573114242222) |

**Response Schema:**
```yaml
serviceWindowExpireAt: timestamp | null   # When 24h window closes
isPermanentSession: boolean | null        # Always-open session (rare)
metadata: object | null                   # Platform-specific data
```

**Edge Runtime Example:**
```typescript
const res = await fetch(
  `https://api.bird.com/workspaces/${wsId}/channels/${channelId}/contacts/${contactId}?contactIdentifierValue=${encodeURIComponent(phoneNumber)}`,
  {headers: {'Authorization': `AccessKey ${key}`}}
);

const {serviceWindowExpireAt} = await res.json();

// Determine message type
const now = new Date();
const windowExpires = serviceWindowExpireAt ? new Date(serviceWindowExpireAt) : null;

if (!windowExpires || windowExpires < now) {
  // Window closed - use template
  return 'template';
} else {
  // Window open - can send normal message
  return 'normal';
}
```

**Errors:** 401 (invalid AccessKey) | 404 (contact or channel not found)

---

## GET /contacts/{contactId}

**Purpose:** Get full contact details including all identifiers

**Response Schema:**
```yaml
id: uuid
identifiers:
  - identifierKey: phonenumber | email | custom
    identifierValue: string
displayName: string
attributes: object                # Custom contact fields
createdAt: timestamp
updatedAt: timestamp
```

**Use Case:** Resolve contact ID from conversation participant info

---

## Contact Identifiers

**Standard Keys:**
- `phonenumber` - Phone number (+573114242222 format)
- `email` - Email address
- Custom keys defined in workspace settings

**Resolution Pattern:**
```typescript
// From conversation participant
const participant = {
  type: 'contact',
  contact: {
    identifierValue: '+573114242222'
  }
};

// Lookup contact details if needed
const res = await fetch(
  `https://api.bird.com/workspaces/${wsId}/contacts?identifierValue=${participant.contact.identifierValue}`,
  {headers: {'Authorization': `AccessKey ${key}`}}
);
```

---

## Service Window Logic

**WhatsApp 24-Hour Rule:**
- Window opens: When user sends any message to business
- Window duration: 24 hours from last user message
- Window closed: Use templates only
- Window open: Can send normal messages + templates

**Service Window States:**
| `serviceWindowExpireAt` | Meaning | Action |
|-------------------------|---------|--------|
| `null` | No active window | Use template |
| Future timestamp | Window open | Can send normal message |
| Past timestamp | Window expired | Use template |

---

## Integration with Conversations API

**Pattern:**
```typescript
// 1. Get conversation
const conv = await fetch(
  `https://api.bird.com/workspaces/${wsId}/conversations/${convId}`,
  {headers: {'Authorization': `AccessKey ${key}`}}
).then(r => r.json());

// 2. Extract contact info
const contact = conv.featuredParticipants.find(p => p.type === 'contact');
const phoneNumber = contact.contact.identifierValue;

// 3. Check service window
const channelInfo = await fetch(
  `https://api.bird.com/workspaces/${wsId}/channels/${conv.channelId}/contacts/${contact.id}?contactIdentifierValue=${encodeURIComponent(phoneNumber)}`,
  {headers: {'Authorization': `AccessKey ${key}`}}
).then(r => r.json());

// 4. Decide message type
const useTemplate = !channelInfo.serviceWindowExpireAt ||
  new Date(channelInfo.serviceWindowExpireAt) < new Date();
```

---

## Edge Runtime Notes

All operations use Web APIs only:
- `fetch()` for GET requests (no Node.js http)
- `encodeURIComponent()` for phone number encoding
- `Date` object for timestamp comparisons

**Vercel Edge Functions:**
- Fast lookups (<1s typical response time)
- No special handling needed
- Cache results if making repeated checks

**Full API Reference:** https://docs.bird.com/api/contacts-api/api-reference

---

**Lines:** 70 / 100 | **Tokens:** ~330
