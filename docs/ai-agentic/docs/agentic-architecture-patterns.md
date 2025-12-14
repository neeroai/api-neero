# Agentic Architecture Patterns for Medical AI

**Version:** 1.0 | **Date:** 2025-12-14 | **Owner:** Systems Architect | **Status:** Production

## Overview

Edge Runtime-compatible agentic patterns for building tool-based AI functions within Vercel's 9-second Bird Actions constraint. Combines Vercel AI SDK 5.0 tool calling with budget-aware timeout management, stateless conversation design, and cost-optimized model selection for plastic surgery AI agents.

**Key Principles:**
- Synchronous tool execution (<9s total response time)
- Web APIs only (no Node.js dependencies)
- Budget-aware timeout propagation across tool chains
- Stateless design with Bird Conversations API state reconstruction
- Cost optimization through intelligent model routing

---

## Edge Runtime Tool Functions

### Pattern 1: Synchronous Tools (<9s)

Single-turn operations with strict timeout enforcement.

```typescript
// /app/api/bird/photo-analysis/route.ts
export const runtime = 'edge';

import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { TimeBudget } from '@/lib/ai/timeout';
import { validateApiKey } from '@/lib/auth/api-key';

const SurgicalPhotoAnalysisSchema = z.object({
  quality: z.enum(['excellent', 'good', 'poor']),
  qualityScore: z.number().min(0).max(100),
  procedureArea: z.enum([
    'face.rhinoplasty',
    'face.blepharoplasty',
    'breast.augmentation',
    'body.liposuction',
    'other'
  ]),
  anatomicalLandmarks: z.object({
    detected: z.array(z.string()).max(20),
    missing: z.array(z.string()).max(10)
  }),
  readyForSurgeonReview: z.boolean(),
  patientGuidance: z.string().max(500).optional()
});

export async function POST(request: Request): Promise<Response> {
  const startTime = Date.now();
  const budget = new TimeBudget(8500); // 8.5s max (0.5s buffer)

  try {
    // 1. Validate API key (optional for Bird Actions)
    if (!validateApiKey(request)) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const { conversationId, photoUrl } = body;

    budget.checkBudget();

    // 3. Process with AI (synchronous, structured output)
    const result = await generateObject({
      model: google('gemini-2.5-flash-exp', {
        structuredOutputs: true
      }),
      schema: SurgicalPhotoAnalysisSchema,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Analyze this surgical photo for quality and anatomical landmarks. Respond in Spanish for patient guidance.'
          },
          { type: 'image', image: photoUrl }
        ]
      }],
      abortSignal: AbortSignal.timeout(budget.getRemainingMs() - 500),
      temperature: 0 // Deterministic for medical analysis
    });

    budget.checkBudget();

    // 4. Return structured response
    return Response.json({
      success: true,
      data: result.object,
      processingTime: `${((Date.now() - startTime) / 1000).toFixed(1)}s`
    });
  } catch (error) {
    if (error instanceof TimeoutBudgetError) {
      return Response.json(
        { success: false, error: 'TIMEOUT_ERROR', message: error.message },
        { status: 408 }
      );
    }

    return Response.json(
      {
        success: false,
        error: 'PROCESSING_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
```

**Key Points:**
- Initialize `TimeBudget` immediately (8.5s processing + 0.5s safety buffer)
- Check budget before each major operation (`budget.checkBudget()`)
- Use `AbortSignal.timeout()` with remaining budget for AI calls
- Return synchronous JSON response (Bird Actions requirement)
- Use `temperature: 0` for deterministic medical analysis

---

### Pattern 2: Multi-Stage Processing

Operations requiring multiple AI calls with dynamic timeout allocation.

```typescript
// /lib/ai/surgical-photo-pipeline.ts
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import {
  checkTimeout,
  getRemaining,
  startTimeTracking,
  type TimeTracker
} from '@/lib/ai/timeout';

const PhotoQualitySchema = z.object({
  score: z.number().min(0).max(100),
  issues: z.array(z.string()).max(10),
  improvementSuggestions: z.array(z.string()).max(5)
});

const ProcedureAreaSchema = z.enum([
  'face.rhinoplasty',
  'face.blepharoplasty',
  'face.facelift',
  'breast.augmentation',
  'breast.lift',
  'breast.reduction',
  'body.liposuction',
  'body.abdominoplasty',
  'body.bbl',
  'skin.rejuvenation',
  'other'
]);

const SurgicalAnalysisSchema = z.object({
  landmarks: z.array(z.string()).max(20),
  symmetry: z.object({
    score: z.number().min(0).max(100),
    notes: z.string().max(200).optional()
  }),
  recommendations: z.string().max(500)
});

export async function processSurgicalPhoto(
  imageUrl: string,
  options: {
    timeoutMs?: number;
    procedureArea?: typeof ProcedureAreaSchema._type;
    skipQualityCheck?: boolean;
  } = {}
): Promise<{
  quality: 'excellent' | 'good' | 'poor';
  procedureArea: typeof ProcedureAreaSchema._type;
  analysis?: typeof SurgicalAnalysisSchema._type;
  readyForReview: boolean;
  guidance?: string;
}> {
  const tracker = startTimeTracking(options.timeoutMs ?? 8500);

  // Stage 1: Quality check (2s) - Skip if quality known to be good
  if (!options.skipQualityCheck) {
    checkTimeout(tracker);

    const quality = await generateObject({
      model: google('gemini-2.0-flash-exp'),
      schema: PhotoQualitySchema,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: 'Assess photo quality for surgical documentation. Check lighting, focus, angle, and resolution.' },
          { type: 'image', image: imageUrl }
        ]
      }],
      abortSignal: AbortSignal.timeout(Math.min(2000, getRemaining(tracker) - 1000)),
      temperature: 0
    });

    if (quality.object.score < 50) {
      // Poor quality → return guidance immediately (save time/cost)
      return {
        quality: 'poor',
        procedureArea: 'other',
        readyForReview: false,
        guidance: `Mejora la calidad de la foto: ${quality.object.improvementSuggestions.join(', ')}`
      };
    }
  }

  // Stage 2: Procedure area classification (1.5s) - Skip if provided
  checkTimeout(tracker);

  const procedureArea = options.procedureArea ?? (await generateObject({
    model: google('gemini-2.0-flash-exp'),
    schema: z.object({ area: ProcedureAreaSchema }),
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: 'Classify the procedure area shown in this photo.' },
        { type: 'image', image: imageUrl }
      ]
    }],
    abortSignal: AbortSignal.timeout(Math.min(1500, getRemaining(tracker) - 1000)),
    temperature: 0
  })).object.area;

  // Stage 3: Detailed analysis (3-4s depending on remaining time)
  checkTimeout(tracker);

  const analysis = await generateObject({
    model: google('gemini-2.5-flash-exp'), // Higher accuracy for medical
    schema: SurgicalAnalysisSchema,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'text',
          text: `Analyze this ${procedureArea} photo. Identify anatomical landmarks, assess symmetry, and provide recommendations in Spanish.`
        },
        { type: 'image', image: imageUrl }
      ]
    }],
    abortSignal: AbortSignal.timeout(getRemaining(tracker) - 500),
    temperature: 0
  });

  return {
    quality: 'excellent',
    procedureArea,
    analysis: analysis.object,
    readyForReview: true
  };
}
```

**Budget-Aware Timeouts:**
- Each stage gets dynamic timeout based on remaining budget
- Early termination if quality poor (save time/cost)
- Safety buffers (`getRemaining(tracker) - 500ms`) prevent timeout at last moment
- Skip optional stages if time running low

---

### Pattern 3: Fallback Chains

Operations with primary + fallback providers (existing pattern from audio).

```typescript
// /lib/ai/transcribe.ts (existing pattern, documented for reference)
import { transcribeAudio as transcribeGroq } from './groq';
import { transcribeAudioOpenAI } from './openai-whisper';
import {
  getAudioTimeout,
  shouldAttemptAudioFallback,
  type TimeTracker
} from './timeout';

export async function transcribeWithFallback(
  audioBuffer: ArrayBuffer,
  options: { language?: string; prompt?: string } = {},
  timeTracker?: TimeTracker
): Promise<{
  text: string;
  provider: 'groq' | 'openai';
  fallbackUsed: boolean;
}> {
  // Calculate dynamic timeout for Groq if budget tracking enabled
  const groqTimeout = timeTracker ? getAudioTimeout(timeTracker, 'groq') : 3000;

  try {
    // Primary: Groq Whisper v3 ($0.67/1K min, faster)
    const text = await transcribeGroq(audioBuffer, {
      ...options,
      timeoutMs: groqTimeout
    });

    return { text, provider: 'groq', fallbackUsed: false };
  } catch (groqError) {
    // Check if enough time for fallback
    if (timeTracker && !shouldAttemptAudioFallback(timeTracker)) {
      throw new Error(
        `Groq failed, insufficient time for OpenAI fallback. Error: ${groqError.message}`
      );
    }

    // Fallback: OpenAI Whisper ($6/1K min, slower but more reliable)
    const openaiTimeout = timeTracker ? getAudioTimeout(timeTracker, 'openai') : 3000;

    const text = await transcribeAudioOpenAI(audioBuffer, {
      ...options,
      timeoutMs: openaiTimeout
    });

    return { text, provider: 'openai', fallbackUsed: true };
  }
}
```

**Fallback Logic:**
- Try cheaper/faster provider first
- Check time budget before attempting fallback (`shouldAttemptAudioFallback`)
- Return metadata (which provider succeeded, fallback used?)
- Fail fast if insufficient time remaining

---

## Conversation State Management

### Bird Conversations API as State Store

Stateless function design: reconstruct context on each request.

```typescript
// /lib/bird/conversation-state.ts
import { z } from 'zod';

const MessageSchema = z.object({
  id: z.string().uuid(),
  sender: z.object({
    type: z.enum(['contact', 'bot']),
    displayName: z.string()
  }),
  body: z.object({
    type: z.enum(['text', 'image', 'file']),
    text: z.object({
      text: z.string()
    }).optional(),
    image: z.object({
      mediaUrl: z.string().url()
    }).optional(),
    file: z.object({
      files: z.array(z.object({
        mediaUrl: z.string().url(),
        contentType: z.string(),
        filename: z.string().optional()
      }))
    }).optional()
  }),
  createdAt: z.string().datetime()
});

const MessagesResponseSchema = z.object({
  results: z.array(MessageSchema),
  nextPageToken: z.string().optional()
});

export interface ConversationContext {
  conversationId: string;
  patientData: {
    age?: number;
    procedureInterest?: string;
    photoCount: number;
  };
  messageCount: number;
  lastActivity: string;
}

export async function getConversationContext(
  conversationId: string
): Promise<ConversationContext> {
  // Fetch last 20 messages (enough for context, not too expensive)
  const response = await fetch(
    `https://api.bird.com/workspaces/${process.env.BIRD_WORKSPACE_ID}/conversations/${conversationId}/messages?limit=20`,
    {
      headers: {
        Authorization: `AccessKey ${process.env.BIRD_ACCESS_KEY}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch conversation: ${response.status}`);
  }

  const data = await response.json();
  const messages = MessagesResponseSchema.parse(data);

  // Extract patient data from previous AI responses
  const patientData = extractPatientDataFromMessages(messages.results);

  // Extract procedure interest from conversation
  const procedureInterest = extractProcedureInterest(messages.results);

  // Count photos sent by user
  const photoCount = messages.results.filter(
    m => m.sender.type === 'contact' &&
         (m.body.type === 'image' ||
          (m.body.type === 'file' && m.body.file?.files[0]?.contentType.startsWith('image/')))
  ).length;

  return {
    conversationId,
    patientData: {
      age: patientData.age,
      procedureInterest: procedureInterest ?? patientData.procedureInterest,
      photoCount
    },
    messageCount: messages.results.length,
    lastActivity: messages.results[0]?.createdAt ?? new Date().toISOString()
  };
}

function extractPatientDataFromMessages(messages: typeof MessageSchema._type[]): {
  age?: number;
  procedureInterest?: string;
} {
  // Parse bot responses for structured data (JSON in text messages)
  for (const msg of messages) {
    if (msg.sender.type === 'bot' && msg.body.type === 'text') {
      const text = msg.body.text?.text ?? '';

      // Look for JSON data blocks (e.g., "```json\n{...}\n```")
      const jsonMatch = text.match(/```json\n([\s\S]+?)\n```/);
      if (jsonMatch) {
        try {
          const data = JSON.parse(jsonMatch[1]);
          if (data.age || data.procedureInterest) {
            return {
              age: data.age,
              procedureInterest: data.procedureInterest
            };
          }
        } catch {
          // Invalid JSON, continue
        }
      }
    }
  }

  return {};
}

function extractProcedureInterest(messages: typeof MessageSchema._type[]): string | null {
  // Look for keywords in user messages
  const keywords: Record<string, string> = {
    'rinoplastia': 'face.rhinoplasty',
    'nariz': 'face.rhinoplasty',
    'senos': 'breast.augmentation',
    'pecho': 'breast.augmentation',
    'liposuccion': 'body.liposuction',
    'abdominoplastia': 'body.abdominoplasty',
    'abdomen': 'body.abdominoplasty'
  };

  for (const msg of messages) {
    if (msg.sender.type === 'contact' && msg.body.type === 'text') {
      const text = (msg.body.text?.text ?? '').toLowerCase();

      for (const [keyword, procedure] of Object.entries(keywords)) {
        if (text.includes(keyword)) {
          return procedure;
        }
      }
    }
  }

  return null;
}
```

**Stateless Function Design:**
- Each API call is self-contained (no server-side session)
- Reconstruct context from Bird Conversations API on each request
- Cache-friendly (same conversationId → same context for ~5 min)
- Efficient: limit=20 messages balances context vs performance

---

### Context Serialization

Compact patient data into Action arguments (limited by Bird's ~10KB argument size).

```typescript
// Bird Action arguments (passed from AI Employee to API)
interface PatientIntakeAction {
  conversationId: string;
  contactName: string;
  patientData?: {
    age?: number;
    medicalHistory?: string; // JSON string (compact)
    procedureInterest?: string;
    photoUrls?: string[]; // URLs only, not base64
  };
}

// API deserializes and validates
const PatientDataSchema = z.object({
  age: z.number().int().min(18).max(100).optional(),
  medicalHistory: z.string().max(2000).optional(), // Prevent huge payloads
  procedureInterest: z.enum([
    'face.rhinoplasty',
    'breast.augmentation',
    'body.liposuction',
    'other'
  ]).optional(),
  photoUrls: z.array(z.string().url()).max(10).optional()
});

export async function POST(request: Request): Promise<Response> {
  const body = await request.json();
  const patientData = PatientDataSchema.parse(body.patientData);

  // Use validated data...
}
```

**Trade-offs:**
- **Pros:** Simple, stateless, no database needed
- **Cons:** Limited by Bird Action argument size (~10KB)
- **Strategy:** Store large data (photos) by reference (URL), not by value (base64)

---

## Structured Output Schemas for Medical Data

### Zod Schema Design Patterns

**Pattern 1: Nested Medical Data**

```typescript
// /lib/ai/schemas/patient-intake.ts
import { z } from 'zod';

export const MedicalHistorySchema = z.object({
  previousSurgeries: z.boolean(),
  surgeryDetails: z.array(z.string()).max(10).optional(),
  chronicConditions: z.array(z.enum([
    'diabetes',
    'hypertension',
    'heart_disease',
    'asthma',
    'thyroid_disorder',
    'bleeding_disorder',
    'autoimmune_disease',
    'other'
  ])).max(5),
  allergies: z.array(z.string()).max(20),
  currentMedications: z.array(z.string()).max(30),
  smoking: z.boolean(),
  pregnancyOrBreastfeeding: z.boolean()
});

export const PatientIntakeSchema = z.object({
  age: z.number().int().min(18).max(100),
  medicalHistory: MedicalHistorySchema,
  expectations: z.string().max(1000),
  consentGiven: z.boolean(),
  photoQuality: z.enum(['excellent', 'good', 'poor']).optional()
});

export type MedicalHistory = z.infer<typeof MedicalHistorySchema>;
export type PatientIntake = z.infer<typeof PatientIntakeSchema>;
```

**Validation Rules:**
- Use `.max()` to prevent data injection attacks
- Use `.enum()` for controlled vocabularies (medical conditions)
- Use `.min()/.max()` for numeric ranges (age 18-100)
- Use `.optional()` for non-critical fields

---

**Pattern 2: Surgical Photo Analysis**

```typescript
// /lib/ai/schemas/surgical-photo.ts
import { z } from 'zod';

export const ProcedureAreaSchema = z.enum([
  'face.rhinoplasty',
  'face.blepharoplasty',
  'face.facelift',
  'face.otoplasty',
  'breast.augmentation',
  'breast.lift',
  'breast.reduction',
  'body.liposuction',
  'body.abdominoplasty',
  'body.bbl',
  'skin.rejuvenation',
  'other'
]);

export const SurgicalPhotoAnalysisSchema = z.object({
  quality: z.enum(['excellent', 'good', 'poor']),
  qualityScore: z.number().min(0).max(100),
  procedureArea: ProcedureAreaSchema,
  confidence: z.number().min(0).max(1),
  anatomicalLandmarks: z.object({
    detected: z.array(z.string()).max(20),
    missing: z.array(z.string()).max(10)
  }),
  recommendations: z.object({
    lighting: z.string().max(200).optional(),
    angle: z.string().max(200).optional(),
    resolution: z.string().max(200).optional(),
    distance: z.string().max(200).optional()
  }).optional(),
  readyForSurgeonReview: z.boolean(),
  patientGuidance: z.string().max(500).optional() // Spanish message
});

export type ProcedureArea = z.infer<typeof ProcedureAreaSchema>;
export type SurgicalPhotoAnalysis = z.infer<typeof SurgicalPhotoAnalysisSchema>;
```

**Cost-Efficient Prompt Engineering:**
- Limit array sizes (`.max(20)` for landmarks)
- Cap string lengths (`.max(500)` for guidance text)
- Use enums over free text where possible
- Reduce token usage in Gemini responses

---

## Cost & Latency Optimization

### Model Selection Strategy

| Task | Model | Avg Latency | Cost per Call | Rationale |
|------|-------|-------------|---------------|-----------|
| Photo quality check | Gemini 2.0 Flash | 2s | $0.000085 | Fast, cheaper, quality assessment doesn't need highest accuracy |
| Procedure area classification | Gemini 2.0 Flash | 1.5s | $0.000085 | Fast classification, high confidence |
| Detailed surgical photo analysis | Gemini 2.5 Flash | 5.5s | $0.00017 | Medical context requires highest accuracy |
| Patient conversation (text) | Gemini 2.0 Flash | 1s | $0.000075 | Fast responses, lower cost for chat |
| Audio transcription (primary) | Groq Whisper v3 | 2s | $0.00067 | 10x cheaper than OpenAI, fast |
| Audio transcription (fallback) | OpenAI Whisper | 2.5s | $0.006 | Reliable fallback when Groq fails |

**Decision Tree:**
```
IF task = photo_analysis AND procedure_area = complex (body/face)
  THEN use Gemini 2.5 Flash (accuracy critical)

IF task = photo_quality_check
  THEN use Gemini 2.0 Flash (speed + cost matter)

IF task = text_generation AND length < 500 tokens
  THEN use Gemini 2.0 Flash (fast, cheap)

IF task = audio_transcription
  THEN try Groq first, fallback to OpenAI if fails
```

---

### Caching Strategies

Short-lived cache for repeated operations (Edge Runtime limitation: no Redis).

```typescript
// In-memory cache (survives across Edge function invocations for ~5 min)
const classificationCache = new Map<string, {
  result: ClassificationResult;
  timestamp: number
}>();

export async function classifyProcedureArea(
  imageUrl: string
): Promise<ProcedureArea> {
  // Check cache (5-minute TTL)
  const cached = classificationCache.get(imageUrl);
  if (cached && Date.now() - cached.timestamp < 300000) {
    return cached.result.procedureArea;
  }

  // Call Gemini (not cached)
  const result = await generateObject({
    model: google('gemini-2.0-flash-exp'),
    schema: z.object({ procedureArea: ProcedureAreaSchema }),
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: 'Classify the procedure area in this photo.' },
        { type: 'image', image: imageUrl }
      ]
    }],
    abortSignal: AbortSignal.timeout(2000)
  });

  // Store in cache
  classificationCache.set(imageUrl, {
    result: result.object,
    timestamp: Date.now()
  });

  return result.object.procedureArea;
}

// Auto-cleanup (run periodically or on cache size threshold)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of classificationCache.entries()) {
    if (now - value.timestamp > 300000) {
      classificationCache.delete(key);
    }
  }
}, 60000); // Cleanup every minute
```

**Limitations:**
- Edge Runtime: No Redis, no persistent cache
- In-memory Map survives ~5-10 min between cold starts
- Only cache small objects (classification results, not full analysis)

---

### Streaming vs Synchronous

**Bird Actions Constraint:** MUST return synchronous JSON (no streaming).

```typescript
// ❌ WRONG: Streaming not supported by Bird Actions
export async function POST(request: Request) {
  const stream = await streamText({
    model: google('gemini-2.0-flash-exp'),
    messages
  });
  return stream.toDataStreamResponse(); // Bird can't handle this
}

// ✅ CORRECT: Synchronous JSON response
export async function POST(request: Request) {
  const result = await generateObject({
    model: google('gemini-2.0-flash-exp'),
    schema: ResponseSchema,
    messages
  });
  return Response.json(result.object);
}
```

**Workaround for long responses:**
- Summarize output (don't return full transcripts, return summaries)
- Use structured output (Gemini returns JSON faster than prose)
- Split into multiple Actions if needed (Action 1: analyze, Action 2: get details)

---

## Multi-Channel Design

### Unified Message Schema

```typescript
// /lib/channels/message-schema.ts
import { z } from 'zod';

export const UnifiedMessageSchema = z.object({
  conversationId: z.string().uuid(),
  channel: z.enum(['whatsapp', 'instagram', 'messenger']),
  contactName: z.string(),
  media: z.object({
    type: z.enum(['image', 'audio', 'document']),
    url: z.string().url(),
    contentType: z.string(),
    sizeBytes: z.number()
  }).optional(),
  text: z.string().optional()
});

export type UnifiedMessage = z.infer<typeof UnifiedMessageSchema>;

// Channel-specific adapters
export function whatsappToBird(whatsappMessage: WhatsAppMessage): UnifiedMessage {
  return {
    conversationId: whatsappMessage.conversation.id,
    channel: 'whatsapp',
    contactName: whatsappMessage.contact.displayName,
    media: whatsappMessage.media ? {
      type: detectMediaType(whatsappMessage.media),
      url: whatsappMessage.media.url,
      contentType: whatsappMessage.media.contentType,
      sizeBytes: whatsappMessage.media.size
    } : undefined,
    text: whatsappMessage.body.type === 'text'
      ? whatsappMessage.body.text.text
      : undefined
  };
}
```

---

### Channel-Specific Constraints

| Channel | Image Limit | Audio Limit | Features |
|---------|-------------|-------------|----------|
| WhatsApp | 5MB | 16MB (3min max) | Buttons, lists, location |
| Instagram | 8MB | 25MB | Stories, reels (limited in DM) |
| Messenger | 25MB | 25MB | Quick replies, generic templates |

**Adaptation Pattern:**
```typescript
export function adaptResponseForChannel(
  response: AIResponse,
  channel: 'whatsapp' | 'instagram' | 'messenger'
): ChannelResponse {
  switch (channel) {
    case 'whatsapp':
      return {
        text: response.text,
        buttons: response.buttons?.slice(0, 3), // WhatsApp max 3 buttons
        replyButtons: true
      };

    case 'instagram':
      return {
        text: response.text,
        // IG DMs don't support buttons well
        quickReplies: response.buttons?.map(b => b.label)
      };

    case 'messenger':
      return {
        text: response.text,
        quickReplies: response.buttons?.map(b => ({
          content_type: 'text',
          title: b.label,
          payload: b.action
        }))
      };
  }
}
```

---

## Performance Constraints & Mitigation

### 9-Second Hard Deadline

**Enforcement:**
```typescript
// /lib/ai/timeout.ts (existing implementation)
export class TimeBudget {
  constructor(
    private totalBudgetMs = 8500, // 8.5s (9s - 0.5s safety)
    private startTime = Date.now()
  ) {}

  checkBudget(): void {
    if (this.isExceeded()) {
      const elapsed = this.getElapsedMs();
      throw new TimeoutBudgetError(
        `Time budget exceeded: ${elapsed}ms > ${this.totalBudgetMs}ms`
      );
    }
  }

  getRemainingMs(): number {
    return Math.max(0, this.totalBudgetMs - this.getElapsedMs());
  }

  isExceeded(): boolean {
    return this.getElapsedMs() > this.totalBudgetMs;
  }

  private getElapsedMs(): number {
    return Date.now() - this.startTime;
  }
}
```

---

### 128MB Memory Limit

**Mitigation:**
- Stream large files (don't load entirely into memory)
- Delete `ArrayBuffer` immediately after use
- Compress images before sending to Gemini (if >2MB)
- Reject files exceeding platform limits (5MB for WhatsApp images)

```typescript
// /lib/bird/media.ts (existing pattern)
export async function downloadMedia(url: string): Promise<ArrayBuffer> {
  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB (Edge limit)

  const response = await fetch(url, {
    signal: AbortSignal.timeout(1000) // 1s max download
  });

  // Check size before downloading
  const contentLength = response.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
    throw new Error(`File exceeds 25MB limit`);
  }

  const buffer = await response.arrayBuffer();

  // Safety check after download
  if (buffer.byteLength > MAX_FILE_SIZE) {
    throw new Error(`File exceeds 25MB limit`);
  }

  return buffer;
}
```

---

### File Size Optimization

```typescript
// /lib/media/optimize.ts
export function shouldCompressImage(sizeBytes: number): boolean {
  return sizeBytes > 2 * 1024 * 1024; // Compress if >2MB
}

export async function optimizeImageForGemini(
  imageUrl: string,
  sizeBytes: number
): Promise<string> {
  // Option 1: Send URL instead of base64 (let Gemini fetch)
  // This is the BEST option for Edge Runtime (no Canvas API available)
  if (sizeBytes < 5 * 1024 * 1024) {
    return imageUrl; // Pass URL directly, Gemini handles compression
  }

  // Option 2: Reject if too large
  throw new Error(`Image too large: ${(sizeBytes / 1024 / 1024).toFixed(1)}MB (max 5MB)`);
}
```

---

## AI SDK Tool Calling Integration

### Basic Tool Pattern

```typescript
// /app/api/bird/conversational-intake/route.ts
export const runtime = 'edge';

import { generateText, tool } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { getConversationContext } from '@/lib/bird/conversation-state';

export async function POST(request: Request): Promise<Response> {
  const startTime = Date.now();
  const budget = new TimeBudget(8500);

  try {
    const body = await request.json();
    const { conversationId, userMessage } = body;

    // Reconstruct context from conversation history
    const context = await getConversationContext(conversationId);

    budget.checkBudget();

    // Define tools for patient intake
    const tools = {
      collectPatientData: tool({
        description: 'Collect patient demographic and medical history data',
        parameters: z.object({
          field: z.enum(['age', 'medicalHistory', 'procedureInterest']),
          value: z.string()
        }),
        execute: async ({ field, value }) => {
          // Store in conversation state (next message will see it)
          return {
            success: true,
            message: `${field} guardado: ${value}`
          };
        }
      }),

      scheduleSurgeonConsultation: tool({
        description: 'Schedule a consultation with the surgeon (valoración)',
        parameters: z.object({
          preferredDate: z.string().optional(),
          urgency: z.enum(['low', 'medium', 'high'])
        }),
        execute: async ({ preferredDate, urgency }) => {
          // Integration with scheduling system
          return {
            success: true,
            message: 'Consulta agendada. Te enviaremos confirmación por WhatsApp.'
          };
        }
      })
    };

    // Generate response with tools
    const result = await generateText({
      model: google('gemini-2.0-flash-exp'),
      system: `Eres un asistente médico virtual para una clínica de cirugía plástica.
Ayudas a pacientes a agendar consultas y recopilar información médica inicial.
Contexto del paciente: ${JSON.stringify(context.patientData)}`,
      messages: [{
        role: 'user',
        content: userMessage
      }],
      tools,
      maxToolRoundtrips: 2, // Limit to 2 iterations (prevent timeout)
      abortSignal: AbortSignal.timeout(budget.getRemainingMs() - 500)
    });

    budget.checkBudget();

    return Response.json({
      success: true,
      message: result.text,
      toolsUsed: result.steps.flatMap(s => s.toolCalls.map(tc => tc.toolName)),
      processingTime: `${((Date.now() - startTime) / 1000).toFixed(1)}s`
    });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

**Key Points:**
- `maxToolRoundtrips: 2` prevents timeout from too many iterations
- Tools execute synchronously (Bird Actions constraint)
- Use `abortSignal` with remaining budget
- Return tool usage metadata for debugging

---

### Multi-Step Tool Execution

```typescript
// Complex workflow: Photo collection → Quality check → Schedule consultation
const tools = {
  requestMorePhotos: tool({
    description: 'Request additional photos from patient if quality is insufficient',
    parameters: z.object({
      angles: z.array(z.string()),
      reason: z.string()
    }),
    execute: async ({ angles, reason }) => {
      return {
        message: `Por favor envía fotos desde estos ángulos: ${angles.join(', ')}. Razón: ${reason}`
      };
    }
  }),

  checkPhotoQuality: tool({
    description: 'Check if submitted photos meet quality standards',
    parameters: z.object({
      conversationId: z.string()
    }),
    execute: async ({ conversationId }) => {
      // Fetch latest photos from conversation
      const context = await getConversationContext(conversationId);

      if (context.patientData.photoCount < 3) {
        return {
          sufficient: false,
          message: 'Necesitas al menos 3 fotos (frontal, lateral, perfil)'
        };
      }

      return { sufficient: true };
    }
  }),

  scheduleConsultation: tool({
    description: 'Schedule surgeon consultation after photo review',
    parameters: z.object({
      urgency: z.enum(['standard', 'urgent'])
    }),
    execute: async ({ urgency }) => {
      // Integration with calendar API
      return {
        scheduled: true,
        date: '2025-12-20',
        message: 'Consulta agendada para 20 de diciembre'
      };
    }
  })
};

const result = await generateText({
  model: google('gemini-2.0-flash-exp'),
  system: 'Guía al paciente a través del proceso: fotos → revisión → agendar consulta.',
  messages,
  tools,
  maxToolRoundtrips: 3, // Allow up to 3 tool chains
  abortSignal: AbortSignal.timeout(budget.getRemainingMs() - 500)
});
```

**Workflow:**
1. AI checks photo quality (tool call)
2. If insufficient → Request more photos (tool call)
3. If sufficient → Schedule consultation (tool call)

---

## Error Handling Patterns

### Tool Execution Errors

```typescript
const tools = {
  checkAvailability: tool({
    description: 'Check surgeon availability for consultation',
    parameters: z.object({
      date: z.string()
    }),
    execute: async ({ date }) => {
      try {
        const response = await fetch(`https://calendar.api/availability?date=${date}`);

        if (!response.ok) {
          // Return error to model (let it handle gracefully)
          return {
            available: false,
            error: `No pudimos verificar disponibilidad. Intenta otra fecha.`
          };
        }

        const data = await response.json();
        return { available: data.available, slots: data.slots };
      } catch (error) {
        // Don't throw - return structured error for model to use
        return {
          available: false,
          error: 'Servicio de calendario temporalmente no disponible'
        };
      }
    }
  })
};
```

**Pattern:** Return structured errors instead of throwing. Let the AI model handle gracefully.

---

### Timeout Recovery

```typescript
import { TimeoutBudgetError } from '@/lib/ai/timeout';

try {
  const result = await generateText({
    model: google('gemini-2.0-flash-exp'),
    messages,
    tools,
    maxToolRoundtrips: 3,
    abortSignal: AbortSignal.timeout(budget.getRemainingMs() - 500)
  });

  return Response.json({ success: true, message: result.text });
} catch (error) {
  if (error instanceof TimeoutBudgetError) {
    // Graceful timeout response
    return Response.json({
      success: false,
      error: 'TIMEOUT',
      message: 'La operación tomó demasiado tiempo. Intenta de nuevo con una solicitud más simple.',
      partial: true // Indicate partial processing
    }, { status: 408 });
  }

  // Other errors
  throw error;
}
```

---

## Monitoring & Observability

### Structured Logging

```typescript
export async function POST(request: Request): Promise<Response> {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  console.log(JSON.stringify({
    type: 'request_start',
    requestId,
    timestamp: new Date().toISOString(),
    endpoint: '/api/bird/photo-analysis'
  }));

  try {
    // Process request...

    console.log(JSON.stringify({
      type: 'request_success',
      requestId,
      duration: Date.now() - startTime,
      model: 'gemini-2.5-flash-exp'
    }));

    return Response.json({ success: true });
  } catch (error) {
    console.error(JSON.stringify({
      type: 'request_error',
      requestId,
      duration: Date.now() - startTime,
      error: error.message,
      stack: error.stack
    }));

    throw error;
  }
}
```

---

### Performance Timing

```typescript
const budget = new TimeBudget(8500);
const timings: Record<string, number> = {};

// Stage 1
const stage1Start = Date.now();
const quality = await checkPhotoQuality(imageUrl);
timings.qualityCheck = Date.now() - stage1Start;

// Stage 2
const stage2Start = Date.now();
const classification = await classifyProcedureArea(imageUrl);
timings.classification = Date.now() - stage2Start;

// Stage 3
const stage3Start = Date.now();
const analysis = await analyzeSurgicalPhoto(imageUrl);
timings.analysis = Date.now() - stage3Start;

return Response.json({
  success: true,
  data: analysis,
  timings, // { qualityCheck: 2000, classification: 1500, analysis: 4000 }
  totalTime: `${((Date.now() - startTime) / 1000).toFixed(1)}s`
});
```

---

## References

- [Vercel AI SDK 5.0 Documentation](https://ai.sdk.dev)
- [Edge Runtime Specifications](https://edge-runtime.vercel.app/)
- [Bird Conversations API](https://docs.bird.com/api/conversations-api)
- [Gemini API Documentation](https://ai.google.dev/gemini-api)
- [Groq Cloud API](https://groq.com/docs)
- [Local Implementation Files](/Users/mercadeo/neero/api-neero/lib/ai/)

---

**Lines:** ~900 | **Tokens:** ~4,500 | **Last Updated:** 2025-12-14
