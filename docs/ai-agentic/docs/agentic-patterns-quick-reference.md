# Agentic Patterns Quick Reference

**Version:** 1.0 | **Date:** 2025-12-14 | **Status:** Production

**Full Guide:** `/docs/api-bird/agentic-architecture-patterns.md` (1,282 lines)

---

## Decision Matrix: When to Use Each Pattern

| Scenario | Pattern | Timeout | Model | Example |
|----------|---------|---------|-------|---------|
| Single AI call (photo quality) | Pattern 1: Synchronous Tools | 2-3s | Gemini 2.0 Flash | Quality check, classification |
| Multi-stage (quality → classify → analyze) | Pattern 2: Multi-Stage Processing | 6-8s | 2.0 Flash → 2.5 Flash | Surgical photo pipeline |
| Provider fallback (audio) | Pattern 3: Fallback Chains | 4-6s | Groq → OpenAI | Transcription with retry |
| Conversational (collect data) | AI SDK Tool Calling | 5-7s | Gemini 2.0 Flash | Patient intake, scheduling |

---

## 3-Step Implementation Checklist

### 1. Setup (5 minutes)

```typescript
// Create route file
// /app/api/bird/your-function/route.ts
export const runtime = 'edge';

import { TimeBudget } from '@/lib/ai/timeout';
import { validateApiKey } from '@/lib/auth/api-key';

export async function POST(request: Request): Promise<Response> {
  const startTime = Date.now();
  const budget = new TimeBudget(8500); // 8.5s max

  try {
    // 1. Validate API key
    if (!validateApiKey(request)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request
    const body = await request.json();

    budget.checkBudget();

    // 3. Process (your logic here)

    budget.checkBudget();

    // 4. Return response
    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof TimeoutBudgetError) {
      return Response.json({ error: 'TIMEOUT' }, { status: 408 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

---

### 2. Create Schema (10 minutes)

```typescript
// /lib/ai/schemas/your-schema.ts
import { z } from 'zod';

export const YourResponseSchema = z.object({
  // Medical data validation
  field1: z.string().max(500), // Limit token usage
  field2: z.enum(['option1', 'option2']), // Controlled vocab
  field3: z.number().min(0).max(100), // Numeric constraints
  confidence: z.number().min(0).max(1).optional()
});

export type YourResponse = z.infer<typeof YourResponseSchema>;
```

---

### 3. Process with AI (15 minutes)

```typescript
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';

const result = await generateObject({
  model: google('gemini-2.0-flash-exp'), // or 'gemini-2.5-flash-exp'
  schema: YourResponseSchema,
  messages: [{
    role: 'user',
    content: [
      { type: 'text', text: 'Your prompt here' },
      { type: 'image', image: imageUrl } // Optional
    ]
  }],
  abortSignal: AbortSignal.timeout(budget.getRemainingMs() - 500),
  temperature: 0 // Deterministic for medical
});

return Response.json({ data: result.object });
```

---

## Model Selection Cheatsheet

| Use Case | Model | Why |
|----------|-------|-----|
| Quality check | Gemini 2.0 Flash | Fast (2s), cheap ($0.000085) |
| Classification | Gemini 2.0 Flash | Fast (1.5s), high confidence |
| Detailed medical analysis | Gemini 2.5 Flash | Accurate (5.5s), critical decisions |
| Chat/conversation | Gemini 2.0 Flash | Fast (1s), low cost |
| Audio (primary) | Groq Whisper v3 | 10x cheaper, fast (2s) |
| Audio (fallback) | OpenAI Whisper | Reliable when Groq fails |

---

## Timeout Budget Examples

```typescript
// Single operation (simple)
const budget = new TimeBudget(8500);
budget.checkBudget(); // Before each major step

// Multi-stage with dynamic allocation
const tracker = startTimeTracking(8500);

// Stage 1: Quality check (2s)
checkTimeout(tracker);
await qualityCheck(imageUrl, {
  timeoutMs: Math.min(2000, getRemaining(tracker) - 1000)
});

// Stage 2: Classification (1.5s)
checkTimeout(tracker);
await classify(imageUrl, {
  timeoutMs: Math.min(1500, getRemaining(tracker) - 1000)
});

// Stage 3: Analysis (remaining time - 500ms buffer)
checkTimeout(tracker);
await analyze(imageUrl, {
  timeoutMs: getRemaining(tracker) - 500
});
```

---

## Common Pitfalls & Solutions

| Pitfall | Solution |
|---------|----------|
| **Timeout at last moment** | Use 500ms safety buffer: `getRemainingMs() - 500` |
| **Memory overflow (>128MB)** | Use URLs for images, delete ArrayBuffers immediately |
| **Dynamic imports fail** | Use static imports only: `import { x } from 'y'` |
| **Streaming response rejected** | Bird Actions require synchronous JSON, use `generateObject` |
| **Context lost between calls** | Reconstruct from Bird Conversations API (limit=20) |
| **Large Action arguments** | Store by reference (URLs), not value (base64) |
| **No cache between requests** | In-memory Map with 5min TTL (auto-cleanup) |

---

## State Management Pattern

```typescript
// Stateless function - reconstruct context from Bird API
import { getConversationContext } from '@/lib/bird/conversation-state';

export async function POST(request: Request): Promise<Response> {
  const { conversationId } = await request.json();

  // Fetch last 20 messages
  const context = await getConversationContext(conversationId);

  // context.patientData = { age, procedureInterest, photoCount }
  // context.messageCount, context.lastActivity

  // Use context in AI prompt
  const result = await generateText({
    system: `Patient context: ${JSON.stringify(context.patientData)}`,
    messages: [...]
  });
}
```

---

## Tool Calling Pattern

```typescript
import { generateText, tool } from 'ai';
import { z } from 'zod';

const tools = {
  collectPatientData: tool({
    description: 'Collect patient data for intake',
    parameters: z.object({
      field: z.enum(['age', 'medicalHistory', 'procedureInterest']),
      value: z.string()
    }),
    execute: async ({ field, value }) => {
      // Store in conversation state
      return { success: true, message: `${field} saved` };
    }
  })
};

const result = await generateText({
  model: google('gemini-2.0-flash-exp'),
  messages,
  tools,
  maxToolRoundtrips: 2, // Prevent timeout
  abortSignal: AbortSignal.timeout(budget.getRemainingMs() - 500)
});
```

---

## Structured Logging

```typescript
const requestId = crypto.randomUUID();

console.log(JSON.stringify({
  type: 'request_start',
  requestId,
  timestamp: new Date().toISOString(),
  endpoint: '/api/bird/photo-analysis'
}));

// ... process ...

console.log(JSON.stringify({
  type: 'request_success',
  requestId,
  duration: Date.now() - startTime,
  model: 'gemini-2.5-flash-exp',
  timings: { stage1: 2000, stage2: 1500, stage3: 4000 }
}));
```

---

## Performance Targets

| Metric | Target | Monitoring |
|--------|--------|------------|
| Total response time | <9s | `TimeBudget.getElapsedSeconds()` |
| Stage 1 (quality) | ~2s | Log per-stage timing |
| Stage 2 (classify) | ~1.5s | Use `Date.now()` markers |
| Stage 3 (analyze) | ~4-5.5s | Model-dependent |
| Memory usage | <128MB | Monitor file sizes, use URLs |
| Cold start | <100ms | Cache clients (singleton) |

---

## File References

**Full Guide:**
- `/docs/api-bird/agentic-architecture-patterns.md` (1,282 lines, ~4,500 tokens)

**Implementation Files:**
- `/lib/ai/timeout.ts` - Budget management
- `/lib/ai/pipeline.ts` - Multi-stage pattern
- `/lib/ai/transcribe.ts` - Fallback chain pattern
- `/app/api/bird/route.ts` - Main endpoint example
- `/lib/bird/conversation-state.ts` - State reconstruction (create this)

**Schemas:**
- `/lib/ai/schemas/photo.ts` - Photo analysis
- `/lib/ai/schemas/invoice.ts` - Invoice extraction
- `/lib/ai/schemas/patient-intake.ts` - Medical intake (create this)
- `/lib/ai/schemas/surgical-photo.ts` - Surgical analysis (create this)

---

**Lines:** ~200 | **Tokens:** ~900 | **Last Updated:** 2025-12-14
