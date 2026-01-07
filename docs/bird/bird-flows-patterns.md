# Bird Flows Patterns

Version: 1.0 | Date: 2026-01-06 15:40 | Owner: Neero | Status: Active

> Reusable Flow patterns for Bird AI Employee automation

---

## Overview

This document provides proven Flow patterns for common Bird automation scenarios. All patterns are UI-configurable without code.

**Access Flows:** Bird Dashboard → Workflows → Flows

---

## Pattern 1: Nudge and Close Idle Conversations

**Use Case:** Automatically close conversations after inactivity with user notification

**Template:** "Nudge and Close Idle Conversations" (Customer Service category)

### Architecture

```
Trigger: Message received (AI Employee specific)
   ↓
Wait: 5 minutes
   ↓
Condition: Contact responded?
   ├─ YES → END
   └─ NO → Continue
   ↓
Send Message: "¿Sigues ahí? Estoy aquí para ayudarte."
   ↓
Wait: 3 minutes
   ↓
Condition: Contact responded?
   ├─ YES → END
   └─ NO → Continue
   ↓
Send Message: "Gracias. Esta conversación se cerrará por inactividad."
   ↓
Action: Close Conversation
```

### Configuration

| Parameter | Transactional | Consultative |
|-----------|---------------|--------------|
| Trigger | Message received | Message received |
| Wait 1 | 5 min | 30 min |
| Wait 2 | 3 min | 10 min |
| Total time | 8 min | 40 min |

### Variables

| Variable | Type | Source | Usage |
|----------|------|--------|-------|
| `{{conversation.id}}` | string | Bird | Close Conversation action |
| `{{contact.name}}` | string | Bird | Personalize messages |

### Testing

1. Start conversation
2. Wait for total time without responding
3. ✓ Conversation closes automatically
4. ✓ User receives 2 messages before closure

**Reference:** `/docs/bird/bird-conversation-closure-guide.md`

---

## Pattern 2: Conditional Routing Based on Inactivity

**Use Case:** Route to different actions based on conversation context after inactivity

### Architecture

```
Trigger: Message received
   ↓
Wait: 10 minutes
   ↓
Condition: Contact responded?
   ├─ YES → END
   └─ NO → Continue
   ↓
Condition: Conversation has media?
   ├─ YES → Wait 15 min more → Close
   └─ NO → Continue
   ↓
Condition: High-value contact?
   ├─ YES → Handoff to Human
   └─ NO → Close Conversation
```

### Use Cases

**By Media Type:**
- Image/audio → Wait longer (user may be processing)
- Text only → Standard closure

**By Contact Segment:**
- Premium → Handoff to human
- Standard → Auto-close

**By Conversation Content:**
- Contains "urgent" → Handoff
- Normal → Close

### Implementation

**Step 1 - Media Detection:**
```
Condition: {{message.type}} equals "image"
OR {{message.type}} equals "audio"
```

**Step 2 - Contact Value:**
```
Condition: {{contact.attributes.tier}} equals "premium"
```

---

## Pattern 3: Handoff to Human After N Nudges

**Use Case:** Escalate to human agent if user doesn't respond to multiple nudges

### Architecture

```
Trigger: Message received
   ↓
Wait: 5 minutes
   ↓
Condition: Contact responded?
   ├─ YES → END
   └─ NO → Continue
   ↓
Send Message: "¿Sigues ahí? (1/3)"
   ↓
Wait: 5 minutes
   ↓
Condition: Contact responded?
   ├─ YES → END
   └─ NO → Continue
   ↓
Send Message: "¿Necesitas ayuda? (2/3)"
   ↓
Wait: 5 minutes
   ↓
Condition: Contact responded?
   ├─ YES → END
   └─ NO → Continue
   ↓
Send Message: "Transfiriendo a un asesor humano..."
   ↓
Action: Handoff to Human Agent Queue
```

### Variables

**For Handoff:**
- `{{conversation.id}}` - Conversation to transfer
- Target queue: "Support" | "Sales" | "Priority"

### Use Case

**When NOT to use Pattern 1 (Close):**
- Medical consultations (need human review)
- High-value leads (sales opportunity)
- Complaints (require human empathy)

---

## Pattern 4: Business Hours Closure vs Off-Hours Snooze

**Use Case:** Close during business hours, snooze outside business hours

### Architecture

```
Trigger: Message received
   ↓
Wait: 10 minutes
   ↓
Condition: Contact responded?
   ├─ YES → END
   └─ NO → Continue
   ↓
Condition: Current time in business hours? (9AM-6PM COT)
   ├─ YES → Close Conversation
   └─ NO → Snooze until 9AM next day
```

### Business Hours Configuration

**Option A - Simple (Weekday Detection):**
```
Condition: {{current.day}} NOT equals "Saturday"
AND {{current.day}} NOT equals "Sunday"
AND {{current.hour}} >= 9
AND {{current.hour}} < 18
```

**Option B - Advanced (Holiday Detection):**
```
Condition: Custom function isBusinessHours()
// Returns true if business day + hours
```

### Messages

**During Business Hours:**
```
"Gracias. Esta conversación se cerrará. Horario: Lun-Vie 9AM-6PM."
```

**Outside Business Hours:**
```
"Estamos fuera de horario. Responderemos mañana a las 9AM."
```

---

## Pattern 5: Multi-Stage Engagement Recovery

**Use Case:** Progressive engagement attempts before giving up

### Architecture

```
Trigger: Message received
   ↓
Wait: 2 minutes (quick check)
   ↓
Condition: Contact responded?
   ├─ YES → END
   └─ NO → Continue
   ↓
Send Message: "¿Olvidaste algo?" (soft nudge)
   ↓
Wait: 5 minutes
   ↓
Condition: Contact responded?
   ├─ YES → END
   └─ NO → Continue
   ↓
Send Message: "¿Necesitas ayuda con algo específico?" (value offer)
   ↓
Wait: 10 minutes
   ↓
Condition: Contact responded?
   ├─ YES → END
   └─ NO → Continue
   ↓
Send Message: "Última oportunidad antes de cerrar" (FOMO)
   ↓
Wait: 5 minutes
   ↓
Condition: Contact responded?
   ├─ YES → END
   └─ NO → Close Conversation
```

### Psychological Triggers

| Stage | Trigger Type | Example |
|-------|--------------|---------|
| 1 | Gentle reminder | "¿Olvidaste algo?" |
| 2 | Value offer | "¿Necesitas ayuda?" |
| 3 | FOMO (scarcity) | "Última oportunidad" |

**Total Time:** 22 minutes
**Use Case:** Sales funnels, lead nurturing

---

## Pattern 6: Dynamic Wait Based on Context

**Use Case:** Adjust wait time based on conversation context

### Architecture

```
Trigger: Message received
   ↓
Condition: Message contains "espera" OR "un momento"
   ├─ YES → Wait 15 minutes (user asked to wait)
   └─ NO → Continue
   ↓
Condition: Message type = image/document
   ├─ YES → Wait 10 minutes (processing time)
   └─ NO → Continue
   ↓
Wait: 5 minutes (default)
   ↓
[Continue with standard closure logic]
```

### NLP Patterns (Spanish)

**User Requesting Wait:**
- "espera"
- "un momento"
- "dame un segundo"
- "ya te respondo"

**Implementation:**
```
Condition: {{message.text}} contains "espera"
OR {{message.text}} contains "momento"
OR {{message.text}} contains "segundo"
```

---

## Pattern 7: Conversation Quality Scoring Before Close

**Use Case:** Collect feedback before closing conversation

### Architecture

```
Trigger: Message received
   ↓
Wait: 10 minutes
   ↓
Condition: Contact responded?
   ├─ YES → END
   └─ NO → Continue
   ↓
Send Message: "¿Cómo fue tu experiencia? 1-5 estrellas"
   ↓
Wait: 3 minutes
   ↓
Condition: Contact sent rating?
   ├─ YES → Store rating → Thank user → Close
   └─ NO → Close Conversation (no rating)
```

### Rating Collection

**Message:**
```
¿Cómo fue tu experiencia?
Responde con un número:
1 ⭐ Muy mala
2 ⭐⭐ Mala
3 ⭐⭐⭐ Aceptable
4 ⭐⭐⭐⭐ Buena
5 ⭐⭐⭐⭐⭐ Excelente
```

**Storage:**
```
Action: Update Contact Attribute
  └─ attributes.lastRating = {{message.text}}
```

---

## Flow Building Blocks

### Triggers

| Trigger | When to Use |
|---------|-------------|
| Message received | Reset timer on each message (most common) |
| Conversation created | One-time timer from conversation start |
| Contact attribute changed | React to contact updates |

### Actions

| Action | Purpose | Variables Needed |
|--------|---------|------------------|
| Close Conversation | Mark conversation as closed | `{{conversation.id}}` |
| Handoff to Agent | Transfer to human | Queue name |
| Send Message | Communicate with user | Message text |
| Update Contact | Modify contact attributes | Attribute name, value |
| Wait | Delay execution | Duration (minutes) |

### Conditions

| Condition Type | Example | Usage |
|----------------|---------|-------|
| Time-based | `{{current.hour}} >= 9` | Business hours |
| Message-based | `{{message.text}} contains "urgent"` | Content routing |
| Contact-based | `{{contact.attributes.tier}} == "premium"` | Segmentation |
| Response check | Contact responded in last N minutes? | Inactivity detection |

---

## Best Practices

### 1. Always Provide Clear User Communication

**Bad:**
```
[Close Conversation with no message]
→ User confused why conversation closed
```

**Good:**
```
Send Message: "Esta conversación se cerrará por inactividad."
→ Wait 30 seconds (let user read)
→ Close Conversation
```

### 2. Test All Branches

**Checklist:**
- ✓ User responds at each stage
- ✓ User never responds
- ✓ User responds after first closure message
- ✓ Edge cases (media, urgent keywords)

### 3. Monitor Execution History

**Weekly Review:**
- How many conversations reached closure?
- At which step do most users respond?
- Any errors in execution?

### 4. Version Your Flows

**Pattern:**
```
Flow Name: "Close Idle Conversations v2.1"
Description: "Updated wait times based on metrics (2026-01-06)"
```

### 5. Use Descriptive Step Names

**Bad:**
```
Condition 1, Condition 2, Send Message 3
```

**Good:**
```
"Check if user responded"
"Verify business hours"
"Send goodbye message"
```

---

## Debugging Flows

### Check Execution History

**Location:** Workflows → Flows → [Flow Name] → Execution History

**Look for:**
- Which step failed?
- How many executions per day?
- Success rate

### Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Flow not triggering | Wrong AI Employee selected | Check Flow Settings → Apply to |
| Condition always false | Incorrect variable syntax | Use `{{` dropdown selector |
| Messages not sending | Invalid message template | Test message separately |
| Wait not working | Duration = 0 or missing | Set minimum 1 minute |

---

## Template Checklist

Before publishing a Flow:

- [ ] Trigger configured correctly
- [ ] All Wait steps have duration
- [ ] All Conditions have fallback (ELSE branch)
- [ ] Messages are clear and user-friendly
- [ ] Variables use `{{}}` syntax from dropdown
- [ ] Flow applied to correct AI Employee(s)
- [ ] Tested with real conversation
- [ ] Execution History shows success
- [ ] Documented in this file (if custom pattern)

---

## References

**Bird Documentation:**
- [Flows Documentation](https://docs.bird.com/applications/automation/flows)
- [Flow Actions](https://docs.bird.com/applications/automation/flows/concepts/actions)
- [Available Variables](https://docs.bird.com/connectivity-platform/faq/what-are-available-variables)

**Local Documentation:**
- `/docs/bird/bird-conversation-closure-guide.md` - Pattern 1 detailed guide
- `/docs/bird/bird-abandonment-explained.md` - Abandonment vs Flows
- `/docs/bird/bird-variables-reference.md` - All Bird variables

---

**Lines:** 498 | **Tokens:** ~2,200 | **Format:** Cookbook
