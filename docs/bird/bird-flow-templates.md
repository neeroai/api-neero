# Bird Flow Templates

**For:** api-neero implementation examples
**Purpose:** Top 3 flow patterns for multimodal processing
**Last Updated:** 2025-12-03

---

## Flow 1: Document ID Verification

**Purpose:** Verify customer identity using document photo
**Type:** Synchronous (3-5 seconds)
**Triggers:** Omnichannel message with image
**External Service:** Claude Vision API

### Configuration

```yaml
Flow Name: "Verify Customer ID"

# Step 1: Check Message Type
Action: Branch
Condition: {{mediaType}} == "image"  # ⚠️ Use Task Argument mediaType, NOT {{conversationMessageType}} (doesn't exist)
- If false → send "Please send a photo of your ID"

# Step 2: Extract Media URL
Action: Set Variables
- mediaUrl: {{messageImage}}
- conversationId: {{conversationId}}
- customerId: {{conversation.participantId}}

# Step 3: Call Vision API
Action: Fetch Variables
Method: POST
URL: https://api.anthropic.com/v1/messages
Headers:
  Content-Type: application/json
  x-api-key: {{env.CLAUDE_API_KEY}}
Body:
  model: "claude-3-5-sonnet-20241022"
  max_tokens: 1024
  messages:
    - role: user
      content:
        - type: text
          text: "Extract: full name, ID number, date of birth, expiration date, validity. Return JSON."
        - type: image
          source:
            type: url
            url: {{mediaUrl}}

# Step 4: Extract Response
Action: Set Variables
- idAnalysis: {{fetchVariablesResult}}
- idNumber: {{fetchVariablesResult.id_number}}
- isValid: {{fetchVariablesResult.is_valid}}

# Step 5: Validate Expiration
Action: Branch
Condition: {{isValid}} == true
- If true → continue to credit check
- If false → send "Your document has expired"

# Step 6: Query Credit Bureau
Action: Fetch Variables
Method: POST
URL: https://api.experian.com/v1/credit-inquiry
Headers:
  Authorization: Bearer {{env.EXPERIAN_API_KEY}}
Body:
  idNumber: {{idNumber}}
  fullName: {{fetchVariablesResult.full_name}}

# Step 7: Store Verification
Action: Fetch Variables
Method: POST
URL: {{env.CRM_API_URL}}/customers/{{customerId}}/verification
Body:
  idVerified: true
  documentType: "government_id"
  extractedData: {{idAnalysis}}
  creditCheckResult: {{fetchVariablesResult}}

# Step 8: Send Response
Action: Send Message
Message: "✅ ID verified! Hi {{fetchVariablesResult.full_name}}, you're eligible for up to COP {{creditCheckResult.preQualifiedAmount}}."
```

---

## Flow 2: Bank Statement OCR Analysis

**Purpose:** Extract income from bank statement
**Type:** Asynchronous (5-15 seconds background)
**Triggers:** Omnichannel message with PDF file
**External Service:** AWS Textract (OCR)

### Configuration

```yaml
Flow Name: "Analyze Bank Statement"

# Step 1: Check Message Type
Action: Branch
Condition: {{mediaType}} == "file" AND contains({{messageFile}}, ".pdf")  # ⚠️ Use Task Argument mediaType, NOT {{conversationMessageType}}
- If false → send "Please send a PDF of your bank statement"

# Step 2: Immediate Response
Action: Send Message
Message: "📊 Analyzing your bank statement... This may take 30-60 seconds."

# Step 3: Extract Media File
Action: Set Variables
- fileUrl: {{messageFile}}
- fileName: {{messageFileName}}

# Step 4: Call Custom Function
Action: Call my function
Function: "AnalyzeBankStatement"
Inputs:
  fileUrl: {{fileUrl}}
  fileName: {{fileName}}
Outputs:
  - monthlyIncome
  - accountBalance
  - riskFactors

# Step 5: Store Results
Action: Fetch Variables
Method: POST
URL: {{env.CRM_API_URL}}/customers/{{customerId}}/income-verification
Body:
  documentType: "bank_statement"
  extractedData:
    monthlyIncome: {{monthlyIncome}}
    accountBalance: {{accountBalance}}
  analysis:
    meetsMinimumIncome: {{monthlyIncome > 2000000}}
    riskScore: {{riskFactors.riskScore}}

# Step 6: Calculate Eligible Amount
Action: Set Variables
- eligibleAmount: {{Math.floor((monthlyIncome * 0.3) / 48)}}
- monthlyPayment: {{Math.floor((monthlyIncome * 0.3) / 48)}}

# Step 7: Send Results
Action: Send Message
Message: "✅ Income verified!\n\nMonthly Income: COP {{monthlyIncome}}\nEligible Amount: COP {{eligibleAmount}}\nMonthly Payment: COP {{monthlyPayment}}"

# Step 8: Invoke AI Employee
Action: LLM Bot
Agent ID: {{env.AI_EMPLOYEE_ID}}
Message: "Customer income verified. Monthly income: {{monthlyIncome}}. Calculate loan options (6, 12, 18, 24-month terms)."
```

### Custom Function: AnalyzeBankStatement

```javascript
const axios = require('axios');

exports.handler = async function (context, variables) {
  const { fileUrl } = variables;
  const AWS_ACCESS_KEY = context.env.AWS_ACCESS_KEY_ID;
  const AWS_SECRET_KEY = context.env.AWS_SECRET_ACCESS_KEY;

  try {
    // Download file
    const response = await axios.get(fileUrl);
    const fileBuffer = Buffer.from(response.data);

    // Call AWS Textract
    const AWS = require('aws-sdk');
    const textract = new AWS.Textract({
      accessKeyId: AWS_ACCESS_KEY,
      secretAccessKey: AWS_SECRET_KEY,
      region: 'us-east-1'
    });

    const result = await textract.analyzeDocument({
      Document: { Bytes: fileBuffer }
    }).promise();

    // Parse text
    let text = '';
    result.Blocks.forEach(block => {
      if (block.BlockType === 'LINE') {
        text += block.Text + '\n';
      }
    });

    // Extract financial data
    const incomeMatch = text.match(/ingresos?:?\s*(?:COP)?\s*([\d,]+)/i);
    const monthlyIncome = incomeMatch
      ? parseInt(incomeMatch[1].replace(/,/g, ''))
      : 0;

    const balanceMatch = text.match(/saldo(?:\s+actual)?:?\s*(?:COP)?\s*([\d,]+)/i);
    const accountBalance = balanceMatch
      ? parseInt(balanceMatch[1].replace(/,/g, ''))
      : 0;

    // Risk factors
    const riskFactors = {
      lowBalance: accountBalance < monthlyIncome,
      negativeTransactions: text.includes('rechazo') || text.includes('reverso'),
      riskScore: (accountBalance < monthlyIncome ? 20 : 0) +
                 (text.includes('rechazo') ? 30 : 0) +
                 (monthlyIncome < 2000000 ? 50 : 0)
    };

    return {
      monthlyIncome,
      accountBalance,
      riskFactors,
      extractionSuccess: true
    };

  } catch (error) {
    return {
      error: true,
      message: error.message,
      monthlyIncome: 0,
      riskFactors: { riskScore: 100 }
    };
  }
};
```

---

## Flow 3: Voice Message Processing

**Purpose:** Handle loan requests via voice note
**Type:** Synchronous (10-20 seconds)
**Triggers:** Omnichannel message with audio
**External Service:** Deepgram (Speech-to-Text)

### Configuration

```yaml
Flow Name: "Process Voice Loan Request"

# Step 1: Check Media Type
Action: Branch
Condition: {{mediaType}} == "audio"  # ⚠️ Use Task Argument mediaType, NOT {{conversationMessageType}} (doesn't exist)

# Step 2: Acknowledge Receipt
Action: Send Message
Message: "🎙️ Processing your message... One moment please."

# Step 3: Convert Speech to Text
Action: Fetch Variables
Method: POST
URL: https://api.deepgram.com/v1/listen?language=es&model=nova-2
Headers:
  Authorization: Token {{env.DEEPGRAM_API_KEY}}
  Content-Type: audio/ogg
Body: {{messageAudio}}

# Step 4: Extract Text
Action: Set Variables
- transcript: {{fetchVariablesResult.results.channels[0].alternatives[0].transcript}}
- confidence: {{fetchVariablesResult.results.channels[0].alternatives[0].confidence}}

# Step 5: Parse Intent
Action: Call my function
Function: "ExtractLoanRequest"
Inputs:
  transcript: {{transcript}}
Outputs:
  - loanAmount
  - loanPurpose
  - preferredTerm

# Step 6: Invoke AI Employee
Action: LLM Bot
Agent ID: {{env.AI_EMPLOYEE_ID}}
Message: "Customer voice request: '{{transcript}}'. Parsed as: COP {{loanAmount}} for {{loanPurpose}}, term {{preferredTerm}} months. Respond conversationally."
```

### Custom Function: ExtractLoanRequest

```javascript
const axios = require('axios');

exports.handler = async function (context, variables) {
  const { transcript } = variables;
  const OPENAI_API_KEY = context.env.OPENAI_API_KEY;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Extract loan request details. Return JSON: loanAmount (number), loanPurpose (string), preferredTerm (months).'
          },
          { role: 'user', content: transcript }
        ],
        temperature: 0.3
      },
      { headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` } }
    );

    const parsed = JSON.parse(response.data.choices[0].message.content);

    return {
      loanAmount: parsed.loanAmount || 0,
      loanPurpose: parsed.loanPurpose || 'Not specified',
      preferredTerm: parsed.preferredTerm || null,
      rawTranscript: transcript
    };

  } catch (error) {
    return {
      error: true,
      message: error.message,
      loanAmount: 0
    };
  }
};
```

---

## Testing

### Test Data

> ⚠️ **DEPRECATED:** These test patterns use old Bird variable names. See `/docs/bird/bird-variables-reference.md` for current variable reference.

```javascript
// Test ID Photo (v2.x pattern - for reference only)
{
  mediaType: "image",  // Use Task Argument instead
  messageImage: "https://media.nest.messagebird.com/test/cedula.jpg"
}

// Test Bank Statement
{
  conversationMessageType: "file",
  messageFile: "https://media.nest.messagebird.com/test/statement.pdf",
  messageFileName: "extracto-bancario.pdf"
}

// Test Voice Note
{
  conversationMessageType: "audio",
  messageAudio: "https://media.nest.messagebird.com/test/voice.ogg"
}
```

---

## Debugging Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Vision API empty results | Image URL inaccessible | Check URL in browser first |
| Custom function timeout | Processing >30s | Use async flow + polling |
| Variables not persisting | Scope issue | Access immediately in next step |
| Media URL 404 | URL expired (30 days) | Process immediately on receipt |

---

## Production Checklist

- [ ] API keys in Environment Variables
- [ ] Webhook secret configured
- [ ] Retry logic (3 attempts, exponential backoff)
- [ ] Customer-friendly error messages
- [ ] Timeout handling (30s default)
- [ ] HTTPS only for data transmission
- [ ] Logging configured
- [ ] Fallback to human agent
- [ ] PII data not logged
- [ ] Load testing completed

---

## Sources

- [Bird Flows](https://docs.bird.com/applications/automation/flows)
- [Custom Functions](https://docs.bird.com/connectivity-platform/advanced-functionalities/create-and-use-custom-functions-in-flow-builder)
- [HTTP Requests](https://developers.messagebird.com/tutorials/http-request-in-flow-builder)
