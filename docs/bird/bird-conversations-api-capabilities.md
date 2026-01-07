# Bird Conversations API - Capabilities & Testing Report

**Version:** 1.0 | **Date:** 2025-12-13 | **Status:** Verified

**Purpose:** Document tested capabilities of Bird Conversations API for monitoring and intervention in AI Employee conversations.

---

## ✅ Verified Credentials

```bash
BIRD_ACCESS_KEY: your_api_key_here
BIRD_WORKSPACE_ID: your_api_key_here
BIRD_ORGANIZATION_ID: your_api_key_here
```

**Security:** DO NOT publish these credentials. Keep in environment variables only.

---

## 🧪 API Testing Results

### Test 1: List Conversations ✅

**Endpoint:** `GET /workspaces/{id}/conversations`

**Request:**
```bash
curl -s -X GET 'https://api.bird.com/workspaces/5cce71bc-a8f5-4201-beeb-6df0aef3cfc8/conversations?limit=5' \
  -H 'Authorization: AccessKey your_api_key_here'
```

**Result:**
- Status: 200 OK
- Conversations returned: 5
- Total active conversations: 20+
- Response includes: conversation metadata, participants, last message, timestamps

**Key Fields:**
- `id` - Conversation UUID
- `status` - "active" | "closed"
- `featuredParticipants[]` - Contact + Bot info
- `lastMessage` - Latest message details
- `attributes.llmbotIds` - AI Employee ID
- `lastMessageIncomingAt` - Last user message time
- `lastMessageOutgoingAt` - Last bot message time

---

### Test 2: Get Conversation Messages ✅

**Endpoint:** `GET /workspaces/{id}/conversations/{convId}/messages`

**Request:**
```bash
curl -s -X GET 'https://api.bird.com/workspaces/5cce71bc-a8f5-4201-beeb-6df0aef3cfc8/conversations/ea4679c2-bba7-4e78-bdb7-2b8b4210d2e6/messages?limit=10' \
  -H 'Authorization: AccessKey your_api_key_here'
```

**Result:**
- Status: 200 OK
- Messages returned: 10
- Includes: sender info, body content, media URLs, timestamps

**Message Types Found:**
- `type: "text"` - Text messages
- `type: "file"` - Documents, audio files
- `type: "image"` - Images (separate type)

**Media Access:**
- Excel file: `body.file.files[].mediaUrl`
- Audio file: `body.file.files[].mediaUrl`
- Content types: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `audio/ogg`

---

### Test 3: Get Conversation Details ✅

**Endpoint:** `GET /workspaces/{id}/conversations/{convId}`

**Result:**
- Status: 200 OK
- Full conversation object with:
  - Participant details (contact + AI Employee)
  - Channel ID
  - Conversation attributes
  - Last message preview
  - Timestamps (created, updated, last message)

**AI Employee Detection:**
```json
{
  "featuredParticipants": [
    {
      "id": "03725e24-c835-4dfa-980c-ec8a01b5f71c",
      "type": "bot",
      "displayName": "multimodal"
    }
  ],
  "attributes": {
    "llmbotIds": "03725e24-c835-4dfa-980c-ec8a01b5f71c"
  }
}
```

---

### Test 4: Media Download Access ✅

**Endpoint:** Media CDN URLs with AccessKey header

**Request:**
```bash
curl -s -I 'https://media.api.bird.com/workspaces/.../messages/.../media/...' \
  -H 'Authorization: AccessKey your_api_key_here'
```

**Result:**
- Status: 200 OK
- Returns S3 presigned URL in `Location` header
- File downloadable for 900 seconds (15 minutes)
- Example: 68KB Excel file successfully accessible

---

### Test 5: List Participants ✅

**Endpoint:** `GET /workspaces/{id}/conversations/{convId}/participants`

**Result:**
```json
{
  "results": [
    {
      "id": "eda0fcff-73a9-4950-9dde-dcfda2d76a9e",
      "type": "contact",
      "displayName": "Javier Polo",
      "contact": {
        "identifierValue": "+573114242222"
      }
    },
    {
      "id": "03725e24-c835-4dfa-980c-ec8a01b5f71c",
      "type": "bot",
      "displayName": "multimodal"
    }
  ]
}
```

---

### Test 6: Filter by AI Employee ✅

**Method:** Client-side filtering on `featuredParticipants[].displayName`

**Result:**
- Total conversations: 50
- Conversations with "multimodal" AI: 8
- Filter works correctly

**Implementation:**
```typescript
conversations.filter(c =>
  c.featuredParticipants.some(p =>
    p.type === 'bot' && p.displayName === 'multimodal'
  )
)
```

---

### Test 7: Count Active Conversations ✅

**Query:** `GET /conversations?status=active&limit=20`

**Result:** 20 active conversations

---

## 📊 Discovered Conversation Data

### Sample Conversation Object

```json
{
  "id": "ea4679c2-bba7-4e78-bdb7-2b8b4210d2e6",
  "status": "active",
  "channelId": "f33977c7-1f94-5107-998b-8fb04853afa6",
  "featuredParticipants": [
    {
      "type": "contact",
      "displayName": "Javier Polo",
      "contact": {
        "identifierValue": "+573114242222"
      }
    },
    {
      "type": "bot",
      "displayName": "multimodal"
    }
  ],
  "lastMessage": {
    "type": "text",
    "preview": {
      "text": "No puedo acceder al archivo. Intenta reenviarlo."
    },
    "sender": {
      "type": "bot"
    },
    "createdAt": "2025-12-13T03:27:11.889Z",
    "status": "delivered"
  },
  "attributes": {
    "llmbotIds": "03725e24-c835-4dfa-980c-ec8a01b5f71c",
    "typingStatus": "end"
  },
  "lastMessageIncomingAt": "2025-12-13T03:27:09.677Z",
  "lastMessageOutgoingAt": "2025-12-13T03:27:11.889Z"
}
```

### Sample Message Object

```json
{
  "id": "c2c6db5b-9ffa-4b0c-af44-42062f29062c",
  "conversationId": "ea4679c2-bba7-4e78-bdb7-2b8b4210d2e6",
  "sender": {
    "type": "contact",
    "displayName": "Javier Polo"
  },
  "body": {
    "type": "file",
    "file": {
      "text": "Responde con la url de este archivo antes de procesarlo",
      "files": [{
        "contentType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "mediaUrl": "https://media.api.bird.com/workspaces/.../media/...",
        "filename": "Malla plataforma Crea .xlsx"
      }]
    }
  },
  "status": "delivered",
  "createdAt": "2025-12-13T03:27:09.677Z",
  "meta": {
    "extraInformation": {
      "timestamp": "1765596423",
      "whatsapp.media.type": "document"
    }
  }
}
```

---

## 🎯 Monitoring Capabilities

| Capability | Available | Endpoint |
|------------|-----------|----------|
| **List all conversations** | ✅ | `GET /conversations` |
| **Filter by status** | ✅ | `?status=active\|closed` |
| **Filter by AI Employee** | ✅ | Client-side on `llmbotIds` |
| **Get conversation details** | ✅ | `GET /conversations/{id}` |
| **List messages** | ✅ | `GET /conversations/{id}/messages` |
| **Get participants** | ✅ | `GET /conversations/{id}/participants` |
| **Download media files** | ✅ | Media URLs + AccessKey |
| **See typing status** | ⚠️ | `attributes.typingStatus` | Observed in 1 response, not explicitly tested |
| **Last message times** | ✅ | `lastMessageIncomingAt`, `lastMessageOutgoingAt` |
| **Pagination** | ✅ | `limit` + `nextPageToken` |

---

## 🔧 Intervention Capabilities

| Action | Endpoint | Tested | Notes |
|--------|----------|--------|-------|
| **Send message** | `POST /conversations/{id}/messages` | ⏳ Not tested | Available per docs |
| **Update conversation** | `PATCH /conversations/{id}` | ⏳ Not tested | Available per docs |
| **Close conversation** | `PATCH /conversations/{id}` | ⏳ Not tested | Set `status: "closed"` |
| **Add participant** | `POST /conversations/{id}/participants` | ⏳ Not tested | Available per docs |

---

## 🔍 Use Cases Identified

### 1. Real-Time Monitoring Dashboard

**What to monitor:**
- Active conversations with specific AI Employees
- Last message timestamps
- Typing status
- Message delivery status

**Polling frequency:** 5-10 seconds

**Endpoints:**
```bash
GET /conversations?status=active&limit=50
```

Filter client-side by `llmbotIds`.

---

### 2. Conversation History Analysis

**Purpose:** Understand AI Employee performance

**Data available:**
- Complete message thread
- Response times (outgoing - incoming)
- Message types (text, file, image)
- User engagement (message count, duration)

---

### 3. Human Intervention System

**Trigger conditions:**
- AI Employee sends error message
- User frustrated (repeated messages)
- Complex query detected

**Intervention:**
```bash
POST /conversations/{id}/messages
{
  "type": "text",
  "text": {
    "text": "Hola, soy un agente humano. ¿En qué puedo ayudarte?"
  }
}
```

---

### 4. Media Content Analysis

**Access files sent by users:**
1. List conversation messages
2. Find messages with `body.type === "file"`
3. Extract `body.file.files[].mediaUrl`
4. Download with AccessKey header
5. Process/analyze content

**Example:** Download invoices, receipts, ID documents for verification.

---

## 🚨 Limitations & Constraints

### Rate Limits

**Status:** Not documented, not tested

**Recommendation:**
- Implement request caching
- Use pagination for large datasets
- Monitor for 429 responses

---

### Media URL Expiration

**TTL:** Presigned S3 URLs expire (observed: 900 seconds = 15 minutes)

**Implication:**
- Download critical files immediately
- Don't store media URLs long-term
- Re-fetch URLs if needed later

---

### Pagination

**Max results per request:** 100 (default: 10)

**Navigation:** Use `nextPageToken` from response

**Example:**
```bash
GET /conversations?limit=100&pageToken=WyJ3b3...
```

---

## 🏗️ Implementation Recommendations

### 1. TypeScript Client

Create strongly-typed client:
- `lib/bird/conversations-client.ts`
- Zod schemas for validation
- Error handling
- Retry logic for 5xx errors

---

### 2. Monitoring Endpoints

**Endpoints to create:**

```
GET  /api/bird/conversations
GET  /api/bird/conversations/:id
GET  /api/bird/conversations/:id/messages
POST /api/bird/conversations/:id/intervene
GET  /api/bird/monitor (polling endpoint)
```

---

### 3. Real-Time Updates

**Options:**

**A) Polling (Simple)**
- Poll every 5-10 seconds
- Filter by `lastUpdatedAt > lastPollTime`

**B) Server-Sent Events (Advanced)**
- Stream updates to dashboard
- Lower latency
- More complex implementation

---

### 4. Environment Variables

Add to `.env.local`:
```bash
BIRD_ACCESS_KEY=your_api_key_here
BIRD_WORKSPACE_ID=5cce71bc-a8f5-4201-beeb-6df0aef3cfc8
BIRD_ORGANIZATION_ID=bde1be61-2e41-4122-8d86-7c1ea72c1dc3
```

---

## 📝 Next Steps

### Phase 1: Client Implementation (2-3 hours)

- [ ] Create `lib/bird/conversations-client.ts`
- [ ] Define TypeScript interfaces
- [ ] Implement core methods
- [ ] Add error handling
- [ ] Write unit tests

---

### Phase 2: API Endpoints (2-3 hours)

- [ ] `/api/bird/conversations/route.ts`
- [ ] `/api/bird/conversations/[id]/route.ts`
- [ ] `/api/bird/conversations/[id]/messages/route.ts`
- [ ] `/api/bird/conversations/[id]/intervene/route.ts`

---

### Phase 3: Monitoring System (2-4 hours)

- [ ] Polling endpoint `/api/bird/monitor`
- [ ] Dashboard UI (optional)
- [ ] Alert system (optional)
- [ ] Analytics tracking

---

## 🔒 Security Considerations

1. **Never expose `BIRD_ACCESS_KEY` in client-side code**
2. **Use Edge Runtime for all Bird API calls**
3. **Validate all user inputs** before sending to Bird API
4. **Don't log sensitive data** (phone numbers, media URLs)
5. **Implement rate limiting** on monitoring endpoints
6. **Consider API key authentication** for monitoring dashboard

---

## 📚 Documentation Sources

- [Bird Conversations API](https://docs.bird.com/api/conversations-api)
- [List Conversations](https://docs.bird.com/api/conversations-api/api-reference/conversations-management/list-conversations)
- [Get Conversation Message](https://docs.bird.com/api/conversations-api/api-reference/conversations-messaging/get-conversation-message)
- [Create Conversation Message](https://docs.bird.com/api/conversations-api/api-reference/conversations-messaging/create-conversation-message)

---

**Testing Completed:** 2025-12-13 04:34 UTC
**Total Tests:** 7/7 passed
**Status:** Ready for implementation
