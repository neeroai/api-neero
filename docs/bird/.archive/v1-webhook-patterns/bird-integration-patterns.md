# Bird Integration Patterns

**For:** api-neero external AI service integration
**Purpose:** Vision, STT, and OCR integration patterns
**Last Updated:** 2025-12-03

---

## Integration Methods

| Method | Use Case | Complexity |
|--------|----------|------------|
| Flow Builder HTTP | Simple API calls | Low |
| Custom Functions | Complex logic | Medium |
| Webhook Handler | Full control | High |

---

## Recommended Services

| Capability | Service | Cost | Accuracy |
|------------|---------|------|----------|
| Vision (ID docs) | Claude 3.5 Vision | $0.001/image | 98% |
| Speech-to-Text | Deepgram | $0.004/min | 95%+ |
| OCR (documents) | AWS Textract | $0.015/page | 99% |

---

## Pattern 1: Vision AI (Claude)

**Use Case:** Extract data from ID cards, documents, images

```javascript
// Custom Function: analyzeImage
async function analyzeImage(context, data) {
  const { imageUrl } = data;

  // Download image
  const imageBuffer = await fetch(imageUrl, {
    headers: { 'Authorization': `AccessKey ${context.env.BIRD_ACCESS_KEY}` }
  }).then(r => r.arrayBuffer());

  const base64Image = Buffer.from(imageBuffer).toString('base64');

  // Call Claude Vision
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': context.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64Image } },
          { type: 'text', text: 'Extract: full name, ID number, expiration date. Return JSON.' }
        ]
      }]
    })
  });

  const result = await response.json();
  return { success: true, data: JSON.parse(result.content[0].text) };
}
```

---

## Pattern 2: Speech-to-Text (Deepgram)

**Use Case:** Transcribe voice notes to text

```javascript
// Custom Function: transcribeAudio
async function transcribeAudio(context, data) {
  const { audioUrl } = data;

  // Download audio
  const audioBuffer = await fetch(audioUrl, {
    headers: { 'Authorization': `AccessKey ${context.env.BIRD_ACCESS_KEY}` }
  }).then(r => r.arrayBuffer());

  // Call Deepgram
  const response = await fetch('https://api.deepgram.com/v1/listen?language=es&model=nova-2', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${context.env.DEEPGRAM_API_KEY}`,
      'Content-Type': 'audio/ogg'
    },
    body: audioBuffer
  });

  const result = await response.json();
  const transcript = result.results.channels[0].alternatives[0].transcript;

  return { success: true, transcription: transcript };
}
```

---

## Pattern 3: Document OCR (AWS Textract)

**Use Case:** Extract text from PDFs, invoices, documents

```javascript
// Custom Function: extractTextFromPDF
const { TextractClient, AnalyzeDocumentCommand } = require('@aws-sdk/client-textract');

async function extractTextFromPDF(context, data) {
  const { pdfUrl } = data;

  // Download PDF
  const pdfBuffer = await fetch(pdfUrl, {
    headers: { 'Authorization': `AccessKey ${context.env.BIRD_ACCESS_KEY}` }
  }).then(r => r.arrayBuffer());

  // Initialize Textract
  const textract = new TextractClient({
    region: 'us-east-1',
    credentials: {
      accessKeyId: context.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: context.env.AWS_SECRET_ACCESS_KEY
    }
  });

  // Analyze document
  const result = await textract.send(new AnalyzeDocumentCommand({
    Document: { Bytes: new Uint8Array(pdfBuffer) },
    FeatureTypes: ['FORMS', 'TABLES']
  }));

  // Extract text
  const rawText = result.Blocks
    .filter(b => b.BlockType === 'LINE')
    .map(b => b.Text)
    .join('\n');

  return { success: true, text: rawText };
}
```

---

## Error Handling Pattern

**Retry with Exponential Backoff:**

```javascript
async function withRetry(fn, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  throw lastError;
}

// Usage
const result = await withRetry(() => analyzeImage(imageUrl));
```

**Fallback to Human:**

```javascript
async function processWithFallback(context, data) {
  try {
    return await processMedia(data);
  } catch (error) {
    console.error('Processing failed:', error);
    return {
      success: false,
      action: 'escalate',
      message: 'Lo siento, no pudimos procesar tu documento. Un agente te ayudará pronto.'
    };
  }
}
```

---

## Security Best Practices

### Environment Variables

```
BIRD_ACCESS_KEY=xxx
ANTHROPIC_API_KEY=xxx
DEEPGRAM_API_KEY=xxx
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
CREDIAS_API_KEY=xxx
```

### Webhook Signature Verification

```typescript
function verifyBirdWebhook(req: Request, signingKey: string): boolean {
  const signature = req.headers['messagebird-signature'];
  const timestamp = req.headers['messagebird-request-timestamp'];

  if (!signature || !timestamp) return false;

  const bodyHash = crypto.createHash('sha256').update(req.body).digest();
  const payload = `${timestamp}\n${req.url}\n${bodyHash.toString('binary')}`;
  const computed = crypto.createHmac('sha256', signingKey).update(payload).digest();
  const decoded = Buffer.from(signature, 'base64');

  return crypto.timingSafeEqual(computed, decoded);
}
```

---

## Performance Guidelines

| Metric | Target | Strategy |
|--------|--------|----------|
| Response time | < 5s | Async processing |
| Media download | < 2s | CDN proximity |
| AI processing | < 3s | Fast models |
| Database updates | < 500ms | Indexed queries |

### Async Pattern for Long Processing

```javascript
// Immediate acknowledgment
await sendMessage(phone, "Recibido. Procesando tu documento...");

// Process in background
setTimeout(async () => {
  const result = await processMedia(mediaUrl);
  await sendMessage(phone, `Listo: ${result.summary}`);
}, 0);
```

---

## Cost Optimization

| Strategy | Savings |
|----------|---------|
| Cache repeated queries | 30-50% |
| Use smaller models first | 40-60% |
| Batch similar documents | 20-30% |
| Compress before upload | 10-20% |

### Model Selection Logic

```javascript
function selectModel(documentType, complexity) {
  if (documentType === 'id_card' && complexity === 'standard') {
    return 'claude-3-haiku'; // $0.0003/image
  } else if (documentType === 'bank_statement') {
    return 'claude-3-5-sonnet'; // $0.001/image
  } else {
    return 'claude-3-opus'; // Complex cases
  }
}
```

---

## Sources

- [Bird Flows Documentation](https://docs.bird.com/applications/automation/flows)
- [Custom Functions](https://docs.bird.com/connectivity-platform/advanced-functionalities/create-and-use-custom-functions-in-flow-builder)
- [HTTP Requests in Flow Builder](https://developers.messagebird.com/tutorials/http-request-in-flow-builder)
- [Google Vision Integration](https://bird.com/en-us/blog/how-to-use-flowbuilder-with-google-vision-api-and-google-cloud-functions)
- [Multimedia Content Handling](https://docs.bird.com/connectivity-platform/how-to-guides/dealing-with-multimedia-content-in-messages-using-flow-builder)
- [Anthropic Claude Vision](https://docs.anthropic.com/en/docs/vision)
- [Deepgram API](https://developers.deepgram.com/)
- [AWS Textract](https://docs.aws.amazon.com/textract/)
