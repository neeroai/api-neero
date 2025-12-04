# Bird AI Employees

**For:** api-neero AI-powered conversations
**Purpose:** AI Employee configuration and integration
**Last Updated:** 2025-12-03

---

## What Are AI Employees?

LLM-powered autonomous conversational agents that handle customer interactions. Key features:

- **LLM reasoning** (Claude, GPT-4, custom models)
- **Knowledge base integration** (RAG for grounded responses)
- **Extensible tasks** (API integrations for actions)
- **Natural escalation** to humans with full context

---

## Core Components

| Component | Purpose | Configuration |
|-----------|---------|---------------|
| LLM Provider | Generate responses | Claude 3.5, GPT-4, custom |
| Knowledge Base | Ground responses in facts | PDF, docs, URLs |
| Tasks | Execute actions (API calls) | Custom integrations |
| Guardrails | Safety + compliance | Rules, filters |
| Channels | Communication platforms | WhatsApp, SMS, Email |

---

## LLM Configuration

| Setting | Options | Recommendation |
|---------|---------|----------------|
| Provider | Anthropic, OpenAI, Custom | Claude 3.5 Sonnet |
| Temperature | 0.0 - 1.0 | 0.3 (conservative) |
| Max tokens | 256 - 4096 | 1024 |
| System prompt | Custom instructions | Spanish, professional tone |

---

## Knowledge Base Structure

```
knowledge-base/
  products/
    personal-credit.md
    business-microcredit.md
    payroll-credit.md
  requirements/
    documents-required.md
    eligibility-criteria.md
  faq/
    general-questions.md
    payment-methods.md
  policies/
    privacy-policy.md
    terms-conditions.md
```

**Limits:**
- File size: ~500 KB recommended
- Update: Manual or scheduled
- Formats: PDF, DOCX, TXT, URLs

---

## Task Configuration

Tasks allow AI Employees to execute API actions:

```json
{
  "name": "check_credit_bureau",
  "description": "Query Datacredito for credit history",
  "type": "http",
  "config": {
    "method": "POST",
    "url": "https://api.example.com/v1/credit-check",
    "headers": {
      "Authorization": "Bearer {{env.API_KEY}}"
    },
    "body": {
      "documentNumber": "{{customer.documentId}}",
      "documentType": "CC"
    }
  }
}
```

---

## Webhook Integration

### Inbound Message Event
```json
{
  "service": "channels",
  "event": "whatsapp.inbound",
  "payload": {
    "id": "msg-uuid",
    "sender": {
      "contact": { "identifierValue": "+573001234567" }
    },
    "body": {
      "type": "text",
      "text": { "text": "message content" }
    }
  }
}
```

### Webhook Setup
```
POST /organizations/{orgId}/workspaces/{wsId}/webhook-subscriptions
```

```json
{
  "service": "channels",
  "event": "whatsapp.inbound",
  "url": "https://your.server/webhook",
  "signingKey": "your-secret-key",
  "eventFilters": [
    { "key": "channelId", "value": "channel-uuid" }
  ]
}
```

---

## Human Escalation

### Triggers

| Trigger | Description |
|---------|-------------|
| Confidence threshold | AI uncertain (<70% confidence) |
| Keyword detection | "hablar con humano", "agente" |
| Complex request | Loan approval, complaints |
| Customer frustration | Negative sentiment detected |
| Manual task config | Specific task types |

### Handoff Flow
```
AI Employee detects escalation trigger
    ↓
Gather conversation summary + media context
    ↓
Transfer to human agent queue
    ↓
Human sees full conversation + AI recommendations
```

---

## Security & Compliance

### Data Protection

| Requirement | Implementation |
|-------------|----------------|
| Encryption at rest | Supabase encrypted storage |
| Encryption in transit | HTTPS/TLS 1.3 |
| PII handling | Masked in logs |
| Audit logs | All interactions logged |
| Data retention | 7+ years (Colombian law) |

### Colombian Regulations

| Law | Requirement |
|-----|-------------|
| Law 1581/2012 | Data protection consent |
| Law 2300/2023 | Consumer protection |
| Circular 007/2018 | AML/KYC compliance |

---

## Sources

- [AI Employees Introduction](https://bird.com/en-us/knowledge-base/ai/introduction-to-ai-employees)
- [Knowledge Bases](https://docs.bird.com/applications/ai-features/ai-agents/concepts/knowledge-bases)
- [Tasks Configuration](https://docs.bird.com/applications/ai-features/ai-agents/concepts/tasks)
- [Webhook Subscriptions](https://docs.bird.com/api/notifications-api/api-reference/webhook-subscriptions)
