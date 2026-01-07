# Bird Conversation Closure Guide

Version: 1.0 | Date: 2026-01-06 15:30 | Owner: Neero | Status: Active

> Comprehensive guide for automatic conversation closure using Bird native Template Flows

---

## Overview

This guide explains how to automatically close inactive WhatsApp conversations in Bird using the official "Nudge and Close Idle Conversations" template flow.

**Problem:** Bird Abandonment settings only send nudges and mark conversations as "abandoned" internally - they do NOT close conversations.

**Solution:** Use Bird's native Template Flow for automatic closure.

---

## The Problem: Abandonment ≠ Closure

### What Abandonment DOES:
- Detects conversation inactivity
- Sends nudge messages at configured intervals
- Marks conversations as "abandoned" internally

### What Abandonment DOES NOT:
- Change conversation status to "closed"
- Remove conversations from active Inbox
- Trigger any cleanup actions

**Result:** Inbox becomes saturated with inactive conversations that stay "open" forever.

---

## The Solution: Template Flow

Bird provides an official Template Flow that solves this:

**Name:** "Nudge and Close Idle Conversations"
**Location:** Bird Dashboard → Workflows → Flows → Templates → Customer Service
**Type:** 100% UI-based, no code required

### Flow Architecture

```
Trigger: Message received (or Conversation created)
   ↓
Wait: 5 minutes (configurable)
   ↓
Condition: Did user respond?
   ├─ YES → END (conversation stays open)
   └─ NO → Continue
   ↓
Send Message: "¿Sigues ahí?"
   ↓
Wait: 3 minutes (configurable)
   ↓
Condition: Did user respond?
   ├─ YES → END
   └─ NO → Continue
   ↓
Send Message: "Esta conversación se cerrará"
   ↓
Action: Close Conversation
```

---

## Configuration Guide

### Step 1: Access Template Flows

**Navigation:**
```
Bird Dashboard → Workflows → Flows → Templates (tab) → Customer Service
```

**Action:** Click "Use this template" on "Nudge and Close Idle Conversations"

### Step 2: Configure Trigger

**Option A - Message Received:**
- Timer resets with each new message
- Recommended for transactional AI Employees

**Option B - Conversation Created:**
- Timer starts once at conversation start
- Recommended for consultative AI Employees

### Step 3: Configure Wait Periods

| AI Employee Type | First Wait | Second Wait | Total Time |
|------------------|------------|-------------|------------|
| Transactional | 5 min | 3 min | 8 min |
| Consultative | 30 min | 10 min | 40 min |
| Mixed | 10 min | 5 min | 15 min |

### Step 4: Configure Messages

**First Nudge (Reactivation):**
```
¿Sigues ahí? Estoy aquí para ayudarte con cualquier duda.
```

**Second Message (Pre-closure):**
```
Gracias por contactarnos. Esta conversación se cerrará por inactividad.
Puedes escribirnos cuando quieras para continuar.
```

**Tips:**
- Use friendly, helpful tone
- Make closure explicit (don't surprise users)
- Offer continuity ("puedes escribirnos cuando quieras")

### Step 5: Configure Close Action

**Action:** Close Conversation
**Conversation ID:** `{{conversation.id}}` (Bird native variable)

### Step 6: Apply to AI Employee

**Recommended:** Apply to specific AI Employee only
```
Flow Settings → Trigger → Apply to: Specific AI Employees
└─ Select: [Your AI Employee Name]
```

**Alternative:** Apply to all AI Employees
```
Flow Settings → Trigger → Apply to: All AI Employees
```

### Step 7: Publish and Activate

1. Click "Save"
2. Click "Publish"
3. Toggle "Active" = ON
4. Confirm activation

---

## Configuration Recipes

### Recipe 1: Fast Transactional (8 minutes)

```
Trigger: Message received (specific AI Employee)
Wait 1: 5 minutes
Nudge 1: "¿Sigues ahí? Estoy aquí para ayudarte."
Wait 2: 3 minutes
Nudge 2: "Gracias. Esta conversación se cerrará."
Action: Close Conversation
```

**Use Case:** Quick support queries, transactional interactions

### Recipe 2: Patient Consultative (40 minutes)

```
Trigger: Message received
Wait 1: 30 minutes
Nudge 1: "¿Necesitas más información?"
Wait 2: 10 minutes
Nudge 2: "Quedamos atentos. Cerramos esta conversación."
Action: Close Conversation
```

**Use Case:** Complex inquiries, medical consultations

### Recipe 3: Silent Closure (10 minutes)

```
Trigger: Message received
Wait 1: 10 minutes
Action: Close Conversation (no messages)
```

**Use Case:** After-hours, automated responses only

---

## Testing

### Test 1: No Response (Full Flow)

**Steps:**
1. Start conversation with AI Employee
2. Send initial message
3. Wait 8+ minutes without responding
4. ✓ Expected: Receive 2 nudges, conversation closes

**Verification:**
- Bird Inbox → Conversation status = "Closed"
- Workflows → Flow Execution History → Success

### Test 2: Response to First Nudge

**Steps:**
1. Start conversation
2. Wait 5 minutes (receive first nudge)
3. Respond immediately
4. ✓ Expected: Flow ends, conversation stays open

### Test 3: Response to Second Nudge

**Steps:**
1. Start conversation
2. Wait 5 minutes (first nudge)
3. Do NOT respond
4. Wait 3 minutes (second nudge)
5. Respond before closure
6. ✓ Expected: Conversation does NOT close

### Test 4: Reopening After Closure

**Steps:**
1. Let conversation close automatically
2. Send new message
3. ✓ Expected: New conversation opens

---

## Monitoring

### Execution History

**Location:** Workflows → Flows → [Your Flow] → Execution History

**Metrics:**
- Conversations processed
- Step where failures occurred (if any)
- Successful closures count

### Key Metrics

| Metric | Target | Action if Below |
|--------|--------|-----------------|
| Daily closures | >0 | Check Flow is active |
| Response rate after 1st nudge | >15% | Improve nudge message |
| Response rate after 2nd nudge | >5% | Extend Wait 2 period |
| Flow execution errors | 0% | Review logs, contact Bird support |

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Flow not executing | Flow not active | Check toggle in Flow settings |
| Conversations not closing | Wrong AI Employee selected | Verify Flow is applied to correct AI Employee |
| Users complaining about closure | Too aggressive timing | Increase wait periods |
| Too many open conversations | Flow not catching all | Check trigger type (Message received vs Conversation created) |

---

## Integration with Abandonment

You can combine Template Flow with Abandonment settings:

**Option A - Flow Only (Recommended):**
- Disable Abandonment nudges
- Use Flow for both nudges and closure

**Option B - Combined:**
- Abandonment sends first nudges
- Flow monitors and closes

**Timeline Example (Combined):**
```
T+0:    User stops responding
T+5min: Abandonment sends nudge 1
T+5min: Flow starts Wait 1
T+8min: Abandonment sends nudge 2
T+8min: Flow checks response
        └─ NO → Send closure message → Close Conversation
```

---

## Limitations

1. **No media type detection:** Closes even if user sent image/audio recently
2. **No NLP for "wait" detection:** Cannot detect "un momento" in messages
3. **Minute-level granularity:** Cannot configure seconds (minimum: 1 minute)
4. **24/7 execution:** Runs outside business hours unless configured with conditions

### Workarounds

**For media messages:**
- Create parallel Flow with condition "If message type = media → Wait 15 min"

**For "wait" messages:**
- AI Employee can detect intent and keep conversation alive

**For business hours:**
- Add condition in Flow: "If business hours → Close, Else → Snooze"

---

## Comparison: Flow vs Code

| Aspect | Template Flow | Vercel Cron Job |
|--------|---------------|-----------------|
| Configuration | Bird UI (visual) | TypeScript code |
| Real-time | Yes (immediate) | No (polling intervals) |
| Debugging | Execution History | Vercel logs |
| Maintenance | No code changes | Requires dev |
| Cost | Included in Bird | Vercel free tier |
| Recommendation | ⭐ RECOMMENDED | Only if Flow insufficient |

---

## References

**Bird Documentation:**
- [Nudge and close idle conversations](https://bird.com/en-us/knowledge-base/support/managing-tickets-conversations/how-to-nudge-and-close-idle-conversations)
- [Flows Documentation](https://docs.bird.com/applications/automation/flows)
- [Conversation Actions API](https://docs.bird.com/applications/automation/flows/concepts/actions/bird-api-actions/conversation-actions-or-api)

**Local Documentation:**
- `/docs/bird/bird-abandonment-explained.md` - Abandonment deep dive
- `/docs/bird/bird-flows-patterns.md` - More Flow patterns
- `/docs/bird/bird-ai-employees-setup-guide.md` - General AI Employee setup

---

**Lines:** 297 | **Tokens:** ~1,400 | **Format:** LLM-optimized
