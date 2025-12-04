# Image Routing Specification

**Version:** 2.0.0 | **Updated:** 2025-12-04

---

## Overview

Two-stage intelligent image routing system using Vercel AI Gateway. Classifies incoming images and routes them to the optimal Gemini model, maintaining <9 second response time.

**AI Stack:** Vercel AI Gateway → Gemini 2.0/2.5 Flash

---

## Architecture

```
Image Input (Uint8Array)
         |
         v
+---------------------+
| withTimeout(2000ms) |
+---------------------+
         |
         v
+---------------------+
| Stage 1: Classify   |
| AI Gateway          |
| google/gemini-2.0   |
+---------------------+
         |
         v
+---------------------+
| routeToModel()      |
| (in-memory, <10ms)  |
+---------------------+
         |
    +----+----+----+
    |         |    |
    v         v    v
 photo    invoice  document
    |         |    |
    v         v    v
 2.0       2.0    2.5
 Flash     Flash  Flash
(4s max) (5s max) (5.5s max)
```

---

## AI Gateway Client

```typescript
// lib/ai/gateway.ts
import { createOpenAI } from '@ai-sdk/openai';

export const gateway = createOpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});

// Model shortcuts
export const GEMINI_FAST = 'google/gemini-2.0-flash';
export const GEMINI_PRO = 'google/gemini-2.5-flash';
```

---

## Model Router

```typescript
// lib/ai/router.ts
import { gateway, GEMINI_FAST, GEMINI_PRO } from './gateway';
import type { Classification } from './schemas/classification';

interface RouteConfig {
  model: string;
  timeout: number;
  prompt: string;
}

const ROUTE_TABLE: Record<Classification['type'], RouteConfig> = {
  photo: {
    model: GEMINI_FAST,
    timeout: 4000,
    prompt: 'photo'
  },
  invoice: {
    model: GEMINI_FAST,
    timeout: 5000,
    prompt: 'invoice'
  },
  document: {
    model: GEMINI_PRO,
    timeout: 5500,
    prompt: 'document'
  },
  unknown: {
    model: GEMINI_FAST,
    timeout: 4000,
    prompt: 'photo'
  }
};

export function routeToModel(classification: Classification): RouteConfig {
  return ROUTE_TABLE[classification.type];
}
```

---

## Classification

```typescript
// lib/ai/classify.ts
import { generateObject } from 'ai';
import { gateway, GEMINI_FAST } from './gateway';
import { ClassificationSchema } from './schemas/classification';
import { CLASSIFICATION_PROMPT } from './prompts/classify';

export async function classifyImage(image: Uint8Array): Promise<Classification> {
  const { object } = await generateObject({
    model: gateway(GEMINI_FAST),
    schema: ClassificationSchema,
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: CLASSIFICATION_PROMPT },
        { type: 'image', image },
      ],
    }],
  });

  return object;
}
```

---

## Zod Schemas

### Classification Schema

```typescript
// lib/ai/schemas/classification.ts
import { z } from 'zod';

export const ImageType = z.enum(['photo', 'invoice', 'document', 'unknown']);
export type ImageType = z.infer<typeof ImageType>;

export const ClassificationSchema = z.object({
  type: ImageType,
  confidence: z.number().min(0).max(1),
  subtype: z.string().optional(),
  language: z.enum(['es', 'en', 'other']).default('es')
});

export type Classification = z.infer<typeof ClassificationSchema>;
```

### Output Schemas

```typescript
// lib/ai/schemas/photo.ts
export const PhotoOutputSchema = z.object({
  description: z.string(),
  objects: z.array(z.string()),
  people: z.object({ count: z.number() }).optional(),
  confidence: z.number().min(0).max(1)
});

// lib/ai/schemas/invoice.ts
export const InvoiceOutputSchema = z.object({
  vendor: z.string().optional(),
  invoiceNumber: z.string().optional(),
  date: z.string().optional(),
  items: z.array(z.object({
    description: z.string(),
    total: z.number().optional()
  })),
  total: z.number(),
  currency: z.string().default('COP'),
  confidence: z.number().min(0).max(1)
});

// lib/ai/schemas/document.ts
export const DocumentOutputSchema = z.object({
  documentType: z.string(),
  fullName: z.string().optional(),
  idNumber: z.string().optional(),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  extractedText: z.string().optional(),
  confidence: z.number().min(0).max(1)
});
```

---

## Processing Pipeline

```typescript
// lib/ai/pipeline.ts
import { classifyImage } from './classify';
import { routeToModel } from './router';
import { processPhoto, processInvoice, processDocument } from './processors';
import { withTimeout, getRemainingTime } from './timeout';

export async function processImage(
  image: Uint8Array,
  forceType?: Classification['type']
): Promise<PipelineResult> {
  const startTime = Date.now();

  // Stage 1: Classify (skip if forceType)
  let classification: Classification;
  if (forceType) {
    classification = { type: forceType, confidence: 1.0, language: 'es' };
  } else {
    classification = await withTimeout(classifyImage(image), 2000);
  }

  // If low time remaining, use fast path
  const remainingTime = getRemainingTime(startTime);
  if (remainingTime < 3000) {
    classification.type = 'unknown';
  }

  // Stage 2: Route and process
  const route = routeToModel(classification);
  const processTimeout = Math.min(route.timeout, remainingTime - 500);

  let data: unknown;
  switch (classification.type) {
    case 'photo':
    case 'unknown':
      data = await withTimeout(processPhoto(image), processTimeout);
      break;
    case 'invoice':
      data = await withTimeout(processInvoice(image), processTimeout);
      break;
    case 'document':
      data = await withTimeout(processDocument(image), processTimeout);
      break;
  }

  return {
    classification,
    data,
    processingTime: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
    model: route.model
  };
}
```

---

## Request/Response Format

### Request

```json
{
  "mediaUrl": "https://cdn.bird.com/media/xxx.jpg",
  "forceType": "invoice",
  "context": { "customerEmail": "user@example.com" }
}
```

### Success Response

```json
{
  "success": true,
  "classification": { "type": "invoice", "confidence": 0.95 },
  "data": { "vendor": "Exito", "total": 125000, "currency": "COP" },
  "processingTime": "3.2s",
  "model": "google/gemini-2.0-flash"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Processing timeout",
  "code": "TIMEOUT",
  "processingTime": "8.5s"
}
```

---

## Edge Cases

| Case | Handling |
|------|----------|
| Classification timeout | Default to 'unknown', use Gemini 2.0 Flash |
| Low confidence (<0.5) | Log warning, proceed |
| Remaining time <3s | Force 'unknown' fast path |
| Download timeout | Return immediate error |
| Empty/corrupt image | Return 'INVALID_IMAGE' error |

---

## Cost Estimate

| Stage | Model | Cost/Request | Monthly (10K) |
|-------|-------|--------------|---------------|
| Classify | google/gemini-2.0-flash | $0.00008 | $0.80 |
| Photo | google/gemini-2.0-flash | $0.00017 | $1.70 |
| Invoice | google/gemini-2.0-flash | $0.00020 | $2.00 |
| Document | google/gemini-2.5-flash | $0.00035 | $3.50 |

**Average (with routing):** ~$0.00025/request = $2.50/10K

---

**Lines:** 200
