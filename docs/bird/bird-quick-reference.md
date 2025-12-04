# Bird Integration Quick Reference

**Cheat Sheet for CrediAS Development**
**Date**: December 2, 2025

---

## 1. Bird Platform Overview

```
Bird (formerly MessageBird)
├─ Omnichannel Platform (WhatsApp, SMS, Email, Voice)
├─ Flows (No-code automation engine)
├─ AI Employees (LLM-powered agents)
├─ Conversations API (Inbound/outbound messaging)
└─ Webhooks (Event notifications + incoming triggers)
```

---

## 2. WhatsApp Media Message Variables

### Quick Access Table

| Media Type | Trigger Variable | Example Value |
|-----------|------------------|---|
| Image | `{{messageImage}}` | `https://media.nest.messagebird.com/.../img.jpg` |
| Video | `{{messageVideo}}` | `https://media.nest.messagebird.com/.../video.mp4` |
| Audio | `{{messageAudio}}` | `https://media.nest.messagebird.com/.../audio.ogg` |
| Document | `{{messageFile}}` | `https://media.nest.messagebird.com/.../doc.pdf` |
| Message Type | `{{conversationMessageType}}` | `"image"`, `"file"`, `"audio"`, `"text"` |

---

## 3. HTTP Action Essentials

### Basic HTTP Request (Fetch Variables)

```yaml
Method: POST
URL: https://api.service.com/endpoint
Headers:
  Content-Type: application/json
  Authorization: Bearer {{env.API_KEY}}
Body:
  imageUrl: {{messageImage}}
  customerId: {{customerId}}
```

### Custom Function Template

```javascript
exports.handler = async function (context, variables) {
  const { input1, input2 } = variables;
  const apiKey = context.env.MY_API_KEY;

  try {
    const axios = require('axios');
    const response = await axios.post(
      'https://api.example.com/process',
      { input1, input2 },
      { headers: { 'Authorization': `Bearer ${apiKey}` } }
    );

    return {
      success: true,
      output: response.data.result
    };
  } catch (error) {
    return { error: true, message: error.message };
  }
};
```

---

## 4. Webhook Security (HMAC-SHA256)

```javascript
const crypto = require('crypto');

function verifySignature(body, signature, timestamp, key) {
  const message = timestamp + '\n' + body;
  const calculated = crypto
    .createHmac('sha256', key)
    .update(message)
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(calculated)
  );
}
```

---

## 5. AI Employees

```yaml
Action: LLM Bot
Agent ID: {{env.AI_EMPLOYEE_ID}}
Message: "Customer says: {{conversationMessageContent}}"
```

---

## 6. Common Integration Patterns

### Vision API
```yaml
Action: Fetch Variables
Method: POST
URL: https://api.openai.com/v1/vision/analyze
Body:
  image_url: {{messageImage}}
  prompt: "Extract text from image"
```

### Speech-to-Text
```yaml
Action: Fetch Variables
Method: POST
URL: https://api.deepgram.com/v1/listen
Headers:
  Authorization: Token {{env.DEEPGRAM_API_KEY}}
Body: {{messageAudio}}
```

### Update CRM
```yaml
Action: Fetch Variables
Method: POST
URL: {{env.CRM_API_URL}}/customers/{{customerId}}
Body:
  verificationStatus: "completed"
  timestamp: {{currentTime}}
```

---

## 7. Debugging

```
Flow Builder → Test
├─ Simulate trigger data
├─ Execute flow
└─ View {{variable}} values at each step
```

**Common Issues:**
| Problem | Solution |
|---------|----------|
| {{variable}} empty | Check previous step executed |
| HTTP 401 | Verify API key in Environment Variables |
| Timeout >30s | Use async flow + polling |
| Image URL 404 | Media URLs expire in 30 days |

---

## 8. Environment Variables

```
Settings → Environment Variables

OPENAI_API_KEY
DEEPGRAM_API_KEY
AZURE_VISION_KEY
EXPERIAN_API_KEY
DOCUSIGN_API_KEY
CRM_API_URL
CRM_API_KEY
WEBHOOK_SECRET
AI_EMPLOYEE_ID
```

---

## 9. Essential Documentation

- [Bird Flows](https://docs.bird.com/applications/automation/flows)
- [Custom Functions](https://docs.bird.com/connectivity-platform/advanced-functionalities/create-and-use-custom-functions-in-flow-builder)
- [HTTP Requests](https://developers.messagebird.com/tutorials/http-request-in-flow-builder)
- [OAuth Setup](https://docs.bird.com/connectivity-platform/how-to-guides/set-up-a-generic-oauth-integration)

---

**Version**: 1.0 | **Updated**: December 2, 2025
