# Bird HMAC Validation

**Last Updated:** 2025-12-03

---

## Overview

Bird.com uses HMAC-SHA256 to sign webhook requests. This is DIFFERENT from WhatsApp's HMAC algorithm.

---

## Algorithm

### Signature Calculation

```typescript
// 1. Extract headers
const signature = headers.get('messagebird-signature');
const timestamp = headers.get('messagebird-request-timestamp');

// 2. Build payload
const payload = `${timestamp}\n${url}\n${sha256(body)}`;

// 3. Compute HMAC
const expectedSignature = base64(hmac_sha256(signingKey, payload));

// 4. Compare
if (signature === expectedSignature) {
  // Valid
}
```

### Step-by-Step

1. **Extract Headers:**
   - `messagebird-signature`: Base64-encoded HMAC signature
   - `messagebird-request-timestamp`: Unix timestamp (seconds)

2. **Build Payload String:**
   ```
   {timestamp}\n{url}\n{sha256(body)}
   ```
   Example:
   ```
   1701648000
   https://api.neero.ai/api/bird/webhook
   a3d8f7e2c1b4...
   ```

3. **Compute HMAC-SHA256:**
   ```typescript
   const key = utf8Encode(BIRD_SIGNING_KEY);
   const data = utf8Encode(payload);
   const hmac = hmac_sha256(key, data);
   const signature = base64Encode(hmac);
   ```

4. **Compare Signatures:**
   Use constant-time comparison to prevent timing attacks.

---

## Edge Runtime Implementation

### Using Web Crypto API

```typescript
async function verifyBirdSignature(
  body: string,
  signature: string,
  timestamp: string,
  url: string,
  signingKey: string
): Promise<boolean> {
  // 1. SHA-256 hash of body
  const bodyHash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(body)
  );
  const bodyHashHex = Array.from(new Uint8Array(bodyHash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // 2. Build payload
  const payload = `${timestamp}\n${url}\n${bodyHashHex}`;

  // 3. Import key
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(signingKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // 4. Sign
  const signatureBytes = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payload)
  );

  // 5. Base64 encode
  const expectedSignature = btoa(
    String.fromCharCode(...new Uint8Array(signatureBytes))
  );

  // 6. Constant-time comparison
  return signature === expectedSignature;
}
```

---

## Security Best Practices

1. **Timestamp Validation:**
   - Reject requests older than 5 minutes
   - Prevents replay attacks

2. **Constant-Time Comparison:**
   - Use `===` (JavaScript engines optimize)
   - Or use `crypto.timingSafeEqual` if available

3. **Error Handling:**
   - Return generic 401 on validation failure
   - Don't reveal specifics (prevents enumeration)

---

## Differences from WhatsApp HMAC

| Aspect | Bird | WhatsApp |
|--------|------|----------|
| Header | `messagebird-signature` | `X-Hub-Signature-256` |
| Payload | `timestamp + url + sha256(body)` | `sha256=` + `hmac(body)` |
| Encoding | Base64 | Hex |
| Timestamp | Required in header | Optional |

---

## Implementation

See `lib/bird/crypto.ts:verifyBirdSignature`

---

**Source:** https://bird.com/docs (verify before implementation)
