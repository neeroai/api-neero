# Bird Variables Reference

**Version:** 1.0 | **Date:** 2025-12-11 | **Status:** Active

**Purpose:** Authoritative reference for Bird.com variables in Flow Builder and AI Employee Actions

---

## Overview

Bird.com provides variables in different contexts. Understanding what's available where is critical for correct Action configuration.

**Key Principle:** Bird native variables (`{{messageImage}}`) are available to AI Employees but NOT automatically in Actions. Actions use Task Arguments that must be manually defined and populated.

---

## Bird Native Variables

### Media Variables

Available in Flow Builder triggers and accessible by AI Employees:

| Variable | Type | Example | Context |
|----------|------|---------|---------|
| `{{messageImage}}` | URL (string) | `https://media.nest.messagebird.com/.../photo.jpg` | Flow Builder, AI Employee |
| `{{messageFile}}` | URL (string) | `https://media.nest.messagebird.com/.../doc.pdf` | Flow Builder, AI Employee |
| `{{messageAudio}}` | URL (string) | `https://media.nest.messagebird.com/.../voice.ogg` | Flow Builder, AI Employee |
| `{{messageVideo}}` | URL (string) | `https://media.nest.messagebird.com/.../video.mp4` | Flow Builder, AI Employee |
| `{{messageFileName}}` | String | `"cedula-123.pdf"` | Flow Builder, AI Employee |

### Conversation Variables

| Variable | Type | Example | Context |
|----------|------|---------|---------|
| `{{conversationId}}` | UUID (string) | `"550e8400-e29b-41d4-a716-446655440000"` | Flow Builder, AI Employee |
| `{{conversationMessageContent}}` | String | `"Hola, necesito ayuda"` | Flow Builder, AI Employee |

### Contact Variables

| Variable | Type | Example | Context |
|----------|------|---------|---------|
| `{{contact.name}}` | String | `"Juan Perez"` | Flow Builder, AI Employee |
| `{{contact.email}}` | Email (string) | `"juan@example.com"` | Flow Builder, AI Employee (if available) |
| `{{contact.phoneNumber}}` | String | `"+57 300 123 4567"` | Flow Builder, AI Employee |

### System Variables

| Variable | Type | Example | Context |
|----------|------|---------|---------|
| `{{currentTime}}` | ISO 8601 | `"2025-12-11T10:30:00Z"` | Universal |
| `{{env.VARIABLE_NAME}}` | String | Secure secret value | Universal (Environment Variables) |

---

## Variables That DO NOT Exist

**CRITICAL:** These variables do NOT exist in Bird's documentation but may appear in outdated examples:

| Non-Existent Variable | Why It Doesn't Exist | Use Instead |
|----------------------|---------------------|-------------|
| `{{conversationMessageType}}` | Not a Bird variable | Task Argument `mediaType` (you define it) |
| `{{messageType}}` | Not a Bird variable | Task Argument `mediaType` (you define it) |
| `{{mediaUrl}}` | Not a Bird variable | Task Argument `mediaUrl` (you define it) |

---

## Task Arguments (Custom Variables)

Task Arguments are **manually defined** in Action Configuration and must be **populated by the AI Employee** before calling the Action.

### Recommended Task Arguments for api-neero

| Argument Name | Type | Description | Populated From |
|--------------|------|-------------|----------------|
| `mediaType` | string | Media type: "image", "document", or "audio" | AI Employee logic |
| `mediaUrl` | string | Extracted media URL | `{{messageImage}}` or `{{messageFile}}` or `{{messageAudio}}` |
| `conversationId` | string | Conversation identifier | `{{conversationId}}` |
| `contactName` | string | Contact display name | `{{contact.name}}` |

### Optional Context Arguments

| Argument Name | Type | Description |
|--------------|------|-------------|
| `email` | string | User email address |
| `pais` | string | Country |
| `telefono` | string | Phone number |

---

## How AI Employees Access Variables

### What AI Employees CAN Do

1. **Access Bird native variables:**
   ```
   AI Employee can read {{messageImage}}, {{conversationId}}, etc.
   ```

2. **Determine context from conversation:**
   ```
   AI Employee knows if user sent image, document, or audio
   ```

3. **Set Task Arguments programmatically:**
   ```
   If user sent image:
     - Set mediaType = "image"
     - Set mediaUrl = value of {{messageImage}}
   ```

4. **Call Actions with populated arguments:**
   ```
   Call process_media Action with:
     - mediaType: "image"
     - mediaUrl: "https://..."
   ```

### What AI Employees CANNOT Do

1. **Automatically pass Bird variables to Actions:**
   - Bird variables are NOT automatically available in Action HTTP Request
   - Must be explicitly passed via Task Arguments

2. **Access variables that don't exist:**
   - `{{conversationMessageType}}` doesn't exist in Bird
   - Can't use undefined variables

---

## Variable Verification Process

### How to Check Available Variables

1. **Open Bird Dashboard** → AI Employee → Action → Edit
2. **Click in Request Body field** (HTTP Request step)
3. **Type `{{`** - dropdown appears
4. **Review available variables** - these are EXACTLY what's available
5. **Use dropdown to select** - don't manually type variable names

### Example Verification

```
In Bird UI HTTP Request body field:
1. Type: {{
2. Dropdown shows:
   - Arguments.mediaType
   - Arguments.mediaUrl
   - Arguments.conversationId
   - Arguments.contactName
   - env.NEERO_API_KEY
3. Select from dropdown (e.g., click "Arguments.mediaType")
4. Result: {{Arguments.mediaType}} or {{mediaType}} (depending on Bird version)
```

---

## Common Mistakes

### Mistake 1: Assuming Bird Variables Auto-Pass to Actions

**Wrong:**
```json
{
  "type": "{{conversationMessageType}}",
  "mediaUrl": "{{messageImage}}"
}
```

**Why it fails:**
- `conversationMessageType` doesn't exist
- Even if using `messageImage`, it won't auto-pass to Action

**Correct:**
```json
{
  "type": "{{mediaType}}",
  "mediaUrl": "{{mediaUrl}}"
}
```
Where `mediaType` and `mediaUrl` are Task Arguments populated by AI Employee.

### Mistake 2: Manually Typing Variable Names

**Wrong:**
```
Manually type: {{mediaType}}
```

**Why it fails:**
- Typos are not caught
- May use wrong variable scope

**Correct:**
```
1. Click in field
2. Type {{
3. Select from dropdown: Arguments.mediaType
```

### Mistake 3: Confusing API Fields with Flow Variables

**Conversations API (Backend JSON):**
```json
{
  "conversationId": "...",
  "message": {
    "body": {
      "type": "image"
    }
  }
}
```

**Flow Builder Variables (Frontend):**
```
{{conversationId}}
{{messageImage}}
```

These are DIFFERENT systems. API fields are NOT Flow variables.

---

## Variable Naming Conventions

### Bird Native Variables

- **Format:** `{{variableName}}`
- **Examples:** `{{messageImage}}`, `{{conversationId}}`
- **Scope:** Flow Builder, AI Employee

### Task Arguments

- **Format:** `{{argumentName}}` or `{{Arguments.argumentName}}`
- **Examples:** `{{mediaType}}`, `{{Arguments.mediaUrl}}`
- **Scope:** Defined in Action Arguments Configuration

### Environment Variables

- **Format:** `{{env.VARIABLE_NAME}}`
- **Examples:** `{{env.NEERO_API_KEY}}`, `{{env.BIRD_ACCESS_KEY}}`
- **Scope:** Universal (configured in Bird Settings)

---

## Variable Sources

### From Triggers (SMS, WhatsApp, Webhook)

- `{{Sender}}` - Phone number (SMS)
- `{{Recipient}}` - Your number (SMS)
- `{{Incoming message}}` - SMS content
- `{{messageImage}}`, `{{messageAudio}}`, `{{messageFile}}` - Media URLs (WhatsApp)

### From Previous Steps

- Variables defined in earlier Flow steps
- Custom Function return values
- HTTP Response data

### From Task Arguments

- Manually defined in Arguments Configuration
- Populated by AI Employee or manually in test mode

---

## API vs Flow Variables Matrix

| Concept | API (Backend) | Flow Builder (Frontend) | AI Employee Actions |
|---------|---------------|------------------------|---------------------|
| **Message Type** | `message.body.type` (JSON field) | No direct variable | Task Argument `mediaType` |
| **Image URL** | `message.content.image.url` | `{{messageImage}}` | Task Argument `mediaUrl` from `{{messageImage}}` |
| **Conversation ID** | `conversationId` (JSON field) | `{{conversationId}}` | `{{conversationId}}` or Task Argument |
| **Contact Name** | `contact.displayName` | `{{contact.name}}` | `{{contact.name}}` or Task Argument |

---

## Testing Variables

### Test in Bird UI

1. **Arguments Step:**
   - Define test values for each argument
   - Click "Test arguments" section

2. **HTTP Request Step:**
   - Click "Test" button
   - Verify variables are replaced with values
   - Check JSON sent to API

### Test with cURL

```bash
# Simulate what Bird sends to your API
curl -X POST https://api.neero.ai/api/bird \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_KEY" \
  -d '{
    "type": "image",
    "mediaUrl": "https://example.com/test.jpg",
    "context": {
      "conversationId": "test-123"
    }
  }'
```

---

## Documentation Sources

**Official Bird Documentation:**
- [Available Variables FAQ](https://docs.bird.com/connectivity-platform/faq/what-are-available-variables)
- [Fetching Variables in Flow Builder](https://docs.bird.com/connectivity-platform/steps-catalogue/fetching-variable-steps-in-flow-builder)
- [Bird AI Employees](https://bird.com/en-us/knowledge-base/ai/introduction-to-ai-employees)
- [HTTP Request in Flow Builder](https://developers.messagebird.com/tutorials/http-request-in-flow-builder)

**api-neero Documentation:**
- `/docs/bird/bird-ai-employees-setup-guide.md` - Complete setup guide
- `/docs/bird/bird-actions-architecture.md` - Architecture overview
- `/plan/bugs.md` - BUG-001 details on variable issues

---

## Summary Table

| Category | Available in Flow Builder | Available in AI Employee | Available in Actions (Auto) | Available in Actions (Task Arguments) |
|----------|---------------------------|-------------------------|----------------------------|-------------------------------------|
| `{{messageImage}}` | Yes | Yes | No | Via Task Argument |
| `{{messageFile}}` | Yes | Yes | No | Via Task Argument |
| `{{messageAudio}}` | Yes | Yes | No | Via Task Argument |
| `{{conversationId}}` | Yes | Yes | Yes | Yes |
| `{{contact.name}}` | Yes | Yes | Yes | Yes |
| `{{conversationMessageType}}` | **NO** | **NO** | **NO** | **NO** - doesn't exist |
| `mediaType` (Task Arg) | No | No | No | Yes (if defined) |
| `mediaUrl` (Task Arg) | No | No | No | Yes (if defined) |

---

**Lines:** 150 | **Token Budget:** ~900 tokens
