# Bird Abandonment System Explained

Version: 1.0 | Date: 2026-01-06 15:35 | Owner: Neero | Status: Active

> Technical reference on Bird's Abandonment feature and its relationship with conversation closure

---

## Overview

Bird's Abandonment system is a **conversation monitoring feature** that detects inactivity and sends nudges - but it does NOT close conversations.

**Key Insight:** Abandonment and Closure are separate concepts in Bird.

---

## What Abandonment Does

### 1. Inactivity Detection

**Mechanism:** Tracks time since last user message
**Threshold:** Configurable (e.g., PT5M = 5 minutes, PT295S = 295 seconds)
**Scope:** Per conversation

### 2. Internal Status Marking

**Action:** Marks conversation as "abandoned" in Bird's internal state
**Visibility:** Not visible to end users, only to Bird system
**Effect:** No change in conversation status (still "active")

### 3. Nudge Messages

**Trigger:** When inactivity threshold is reached
**Delivery:** Automatic message sent via AI Employee
**Frequency:** Can configure multiple nudges (e.g., first at 5 min, second at 8 min)

**Example Configuration:**
```
Inactivity timeout: PT5M (5 minutes)
Enable nudge: ✓
Nudge message: "¿Sigues ahí? Estoy aquí para ayudarte."
```

---

## What Abandonment Does NOT Do

### ❌ Does NOT Close Conversations

**What users expect:** "Abandoned" = "Closed"
**Reality:** Conversation status remains "active"
**Result:** Inbox fills with inactive conversations still marked as "open"

### ❌ Does NOT Trigger Any Actions

**No automatic:**
- Status changes
- Workflow executions
- Transfers to human agents
- Cleanup operations

### ❌ Does NOT Integrate with Flows (directly)

**Limitation:** Abandonment status is not exposed as a Flow trigger
**Workaround:** Use Flow Wait steps to detect inactivity independently

---

## Abandonment vs Conversation Status

Bird has different conversation states:

| State | Description | How to Achieve |
|-------|-------------|----------------|
| active | Conversation is ongoing | Default when created |
| abandoned | Internally marked as inactive | Abandonment threshold reached |
| closed | Officially closed, removed from active Inbox | Template Flow "Close Conversation" action |
| archived | Long-term storage | Manual action by agent |
| snoozed | Temporarily hidden | Snooze action in Inbox |

**Critical:** A conversation can be BOTH "abandoned" AND "active" simultaneously.

---

## Nudge Configuration

### Time Format (ISO 8601 Duration)

Bird uses ISO 8601 duration format for timeouts:

| Format | Meaning | Example |
|--------|---------|---------|
| PTnM | n minutes | PT5M = 5 minutes |
| PTnS | n seconds | PT295S = 295 seconds (4 min 55 sec) |
| PTnH | n hours | PT1H = 1 hour |

**Common Values:**
- PT5M = 5 minutes (transactional)
- PT10M = 10 minutes (standard)
- PT30M = 30 minutes (consultative)

### Multiple Nudges

**Configuration in Bird UI:**
```
First nudge: PT5M → "¿Sigues ahí?"
Second nudge: PT8M → "Quedo atento a tus dudas..."
```

**Behavior:**
- Independent timers
- Both count from last user message
- No automatic closure after any nudge

---

## Integration with Template Flows

Abandonment and Flows can work together:

### Strategy 1: Abandonment + Flow Closure (Combined)

```
Abandonment Settings:
├─ Inactivity: PT5M
├─ Nudge 1: "¿Sigues ahí?"
└─ Nudge 2 (PT8M): "Quedo atento..."

Template Flow "Nudge and Close":
├─ Wait: 10 minutes
├─ Condition: User responded?
└─ NO → Close Conversation
```

**Result:** Abandonment handles nudges, Flow handles closure

### Strategy 2: Flow Only (Recommended)

```
Abandonment Settings:
└─ Enable nudge: ❌ DISABLED

Template Flow "Nudge and Close":
├─ Wait 1: 5 min → Nudge 1
├─ Wait 2: 3 min → Nudge 2
└─ Action: Close Conversation
```

**Result:** Flow handles everything, simpler architecture

---

## Abandonment API Access

### Can You Close via Abandonment API?

**No.** Bird's Conversations API provides conversation closure via PATCH, but this is NOT part of Abandonment.

**Correct Approach:**
```typescript
// Close conversation via Conversations API (not Abandonment)
PATCH /workspaces/{wsId}/conversations/{convId}
{
  "status": "closed"
}
```

**Reference:** `/docs/api-bird/conversations-api.md`

---

## Common Misconceptions

### Misconception 1: "Abandonment Closes Conversations"

**Truth:** Abandonment only sends nudges. Closure requires separate action (Flow or API call).

### Misconception 2: "Over Conversation Closes Inactive Chats"

**Truth:** "Over Conversation" transfers to human agents. Does NOT close.

### Misconception 3: "Handovers = Closure"

**Truth:** Handovers transfer between AI Employees or to humans. Does NOT close.

---

## Best Practices

### 1. Choose Your Architecture Early

**Decision Matrix:**

| If... | Then... |
|-------|---------|
| You want UI-only configuration | Use Template Flow for both nudges and closure |
| You need complex custom logic | Use Conversations API + Vercel cron job |
| You have simple needs | Use Template Flow "Nudge and Close" |

### 2. Don't Overlap Nudges

**Avoid:**
```
Abandonment: Nudge at 5 min
Flow: Nudge at 5 min
→ User receives 2 identical messages
```

**Better:**
```
Abandonment: DISABLED
Flow: Handles all nudges + closure
```

### 3. Monitor Abandonment Metrics

Even if not using Abandonment for closure, track:
- How many conversations reach "abandoned" state
- Response rates to nudges
- Average time to abandonment

**Use for:** Optimizing Flow wait times

---

## Migration Guide

### From: Abandonment Only

**Before:**
```
Abandonment Settings:
├─ Inactivity: PT5M
└─ Nudge: "¿Sigues ahí?"

Result: Nudges sent, conversations never close
```

**After:**
```
Abandonment: DISABLED

Template Flow:
├─ Wait 1: 5 min → Nudge
├─ Wait 2: 3 min
└─ Close Conversation

Result: Nudges sent, conversations close automatically
```

### From: Custom Code

**Before:**
```typescript
// Vercel cron job checking every 5 min
// Complex logic, requires maintenance
```

**After:**
```
Template Flow "Nudge and Close"
// No code, visual configuration
```

**Benefit:** 90% less maintenance

---

## Debugging Abandonment

### Check If Abandonment Is Working

**Test:**
1. Start conversation with AI Employee
2. Wait for inactivity threshold (e.g., 5 min)
3. ✓ Expected: Receive nudge message

**Logs:**
- Bird Dashboard → Logs → Filter by AI Employee
- Look for: Nudge message delivery

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| No nudges sent | Abandonment disabled | Enable in Settings → Options |
| Wrong nudge timing | Incorrect PT format | Verify PTnM format |
| Nudges sent to bot | Wrong participant detection | Check conversation logs |

---

## Relationship Diagram

```
Bird Conversation Lifecycle:

[Created] → [Active]
              ↓
          (no user message for threshold)
              ↓
          [Active + Abandoned] ← Abandonment marks this
              ↓ (nudge sent)
          (still no response)
              ↓
          [Active + Abandoned] ← Still open!
              ↓
          Template Flow triggered
              ↓
          [Closed] ← Only Flow can do this
```

---

## Summary Table

| Feature | Abandonment | Template Flow |
|---------|-------------|---------------|
| Detects inactivity | ✅ Yes | ✅ Yes (via Wait) |
| Sends nudges | ✅ Yes | ✅ Yes |
| Closes conversations | ❌ No | ✅ Yes |
| UI configuration | ✅ Yes | ✅ Yes |
| Requires code | ❌ No | ❌ No |
| Real-time | ✅ Yes | ✅ Yes |
| Debugging | ⚠️ Limited | ✅ Execution History |
| Recommendation | Use for monitoring metrics only | Use for nudges + closure |

---

## References

**Bird Documentation:**
- [Nudge Settings](https://bird.com/en-us/knowledge-base/support/managing-tickets-conversations/how-to-nudge-and-close-idle-conversations)
- [Conversation States](https://docs.bird.com/applications/inbox/inbox/agent-guide/4.-manage-conversations)

**Local Documentation:**
- `/docs/bird/bird-conversation-closure-guide.md` - How to close conversations
- `/docs/bird/bird-flows-patterns.md` - Flow patterns
- `/docs/api-bird/conversations-api.md` - API reference

---

**Lines:** 329 | **Tokens:** ~1,500 | **Format:** Technical reference
