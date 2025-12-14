# Medical AI Best Practices for Plastic Surgery Agents
Version: 1.0 | Date: 2025-12-14 | Owner: Research Team | Status: Draft

## Overview

This document establishes compliance, privacy, and conversational best practices for AI-powered patient communication in Dr. Andrés Durán's plastic surgery practice in Colombia. Eva, the WhatsApp-based AI assistant (Bird AI Employees platform), must handle patient inquiries, collect medical data, analyze photos, and schedule appointments while adhering to Colombian regulations, international healthcare standards, and ethical medical communication principles.

**Key Constraint:** Eva is a first-tier virtual assistant, NOT a medical professional. All medical decisions, diagnoses, and advice require human doctor oversight.

---

## Regulatory Compliance

### Colombian Law 1581/2012 (Personal Data Protection)

Colombia's Personal Data Protection Law (Ley Estatutaria 1581 de 2012) governs all personal data processing and establishes strict requirements for healthcare data.

**Core Requirements:**

| Requirement | Implementation for Eva |
|-------------|------------------------|
| **Informed, express, prior consent** | Display consent message before collecting ANY health data |
| **Sensitive data handling** | Health data requires explicit authorization with specific scope |
| **Privacy notice** | Provide clear privacy notice explaining data use, storage, access |
| **Data subject rights** | Enable access, update, correction, revocation of consent |
| **Security measures** | Encrypt in-transit (HTTPS), at-rest storage, access controls |
| **Database registration** | Register patient database with National Database Registry (RNBD) if applicable |
| **DPO appointment** | Recommended by Colombian DPA (SIC - Superintendencia de Industria y Comercio) |

**Consent Standard:**
Colombian SIC requires "previo, expreso e informado" (prior, express, and informed) consent. Companies must show real proof of authorization.

**Penalties:**
Non-compliance can result in fines up to COP 2,000 minimum monthly legal wages (approximately USD $435,000) or USD $519,158 depending on violation severity.

**Sources:**
- [Colombia Data Protection Laws - DLA Piper](https://www.dlapiperdataprotection.com/index.html?t=law&c=CO)
- [Law 1581/2012 Colombia - CLYM](https://www.clym.io/regulations/law-15812012-colombia)
- [Colombia Data Protection Law 1581 Compliance Guide - MG Legal Group](https://www.mg-legalgroup.com/n/colombia-data-protection-law-1581-compliance-guide)

### HIPAA/GDPR Applicability

**HIPAA (United States):**
- Does NOT apply to Colombian plastic surgery practice unless treating US patients or transferring data to US entities
- If accepting international patients from US, consider HIPAA-compliant workflows for those specific cases

**GDPR (European Union):**
- Applies if practice treats EU citizens or transfers data to EU
- Colombia's Law 1581/2012 is GDPR-inspired with similar consent requirements
- GDPR-inspired reforms are accelerating across LATAM (Brazil, Colombia, Argentina)

**Recommendation:** Design Eva's data handling to meet BOTH Colombian Law 1581 AND GDPR standards for maximum international patient compatibility.

**Sources:**
- [Latin America's Privacy Pivot - TrustArc](https://trustarc.com/resource/latin-americas-privacy-compliance-strategy-2025/)
- [GDPR-Inspired Consent Models in LATAM - Cookie Script](https://cookie-script.com/privacy-laws/latin-american-alignment)

### WhatsApp Business API Healthcare Terms

**Critical Finding:** WhatsApp is NOT HIPAA-compliant by default and will NOT sign Business Associate Agreements (BAA).

**WhatsApp's Official Statement:**
"We make no representations or warranties that our Business Services meet the needs of entities regulated by laws and regulations with heightened confidentiality requirements for personal data, such as healthcare, financial, or legal services entities."

**Key Limitations:**

| Issue | Impact | Mitigation |
|-------|--------|------------|
| **No BAA** | Cannot guarantee HIPAA compliance | Don't transmit US patient PHI via WhatsApp |
| **30-day server retention** | Undelivered messages stored on WhatsApp servers with "transient access" | Send time-sensitive PHI only when patient is online |
| **No audit trails** | Cannot track who accessed what data | Use Bird platform logs + external audit system |
| **Encryption gaps** | End-to-end encryption exists BUT metadata/undelivered messages are exposed | Minimize PHI in messages; use secure portal for full medical records |

**Permitted Use Cases:**
- Reply to patient-initiated messages about GENERAL health topics (non-diagnostic)
- Schedule appointments (date/time only, no medical details)
- Send appointment reminders with minimal PHI
- Alert patients to contact office for results (don't send results via WhatsApp)

**STRICTLY PROHIBITED:**
- Sending diagnostic results, lab reports, surgical plans
- Transmitting full medical histories
- Sharing before/after photos without explicit written consent

**Compliance Pathway:**
Use Bird's API integration with secure healthcare platform. Bird claims GDPR compliance via their Data Processing Agreement (DPA), which provides baseline protection for Colombian/EU patients.

**Sources:**
- [Is WhatsApp HIPAA Compliant? - HIPAA Guide](https://www.hipaaguide.net/is-whatsapp-hipaa-compliant/)
- [WhatsApp for Healthcare 2025 - DocHours](https://dochours.com/whatsapp-for-healthcare-improve-patient-communication/)
- [Is WhatsApp HIPAA Compliant? - Paubox](https://www.paubox.com/blog/whatsapp-hipaa-compliant)

### Third-Party AI Service Compliance

Eva's architecture relies on multiple third-party services. Compliance assessment:

| Service | Role | HIPAA | SOC2 | GDPR | Notes |
|---------|------|-------|------|------|-------|
| **Bird (MessageBird)** | Messaging platform | Case-by-case BAA required | Not specified | ✓ Yes (DPA available) | GDPR-compliant via Data Processing Agreement |
| **Google Gemini API** | Image/document analysis | ✓ Yes (with BAA + project flag) | ✓ Yes | ✓ Yes | HIPAA-compliant when BAA signed and HIPAA project flag enabled |
| **Groq Cloud** | Audio transcription (Whisper v3) | ✓ Yes (BAA available) | Not confirmed | Not specified | Offers Business Associate Addendum for healthcare customers |
| **OpenAI Whisper** | Audio fallback | ✓ Yes (Enterprise with BAA) | ✓ Yes | ✓ Yes | HIPAA-compliant with Enterprise plan + BAA |
| **Vercel Edge Runtime** | API hosting | Not specified | Not specified | ✓ Yes | GDPR-compliant hosting in EU regions available |

**Critical Actions Required:**

1. **Sign Business Associate Agreements (BAA):**
   - Google Gemini: Enable HIPAA project flag in Google Cloud Console
   - Groq: Request BAA via [Groq Trust Center](https://trust.groq.com/)
   - Bird: Request specific BAA for healthcare use case (not default)

2. **Data Minimization:**
   - Send ONLY necessary data to each service
   - Strip personally identifiable information (PII) before processing when possible
   - Example: Transcribe audio with Groq, but don't send patient name/ID with audio file

3. **Audit Logging:**
   - Log ALL API calls with timestamps, data types, processing results
   - Retain logs for minimum 15 years per Colombian medical records law

**Sources:**
- [Google Gemini HIPAA Compliance - DataStudios](https://www.datastudios.org/post/google-gemini-gdpr-hipaa-and-enterprise-compliance-standards-explained)
- [Is Groq HIPAA Compliant? - Groq Community](https://community.groq.com/t/is-groq-hipaa-compliant/83)
- [Bird Data Processing Agreement](https://bird.com/legal/dpa)
- [Groq Business Associate Addendum](https://console.groq.com/docs/legal/customer-business-associate-addendum)

---

## Conversational Design for Medical Context

### Tone Guidelines

Eva must balance professionalism, empathy, and medical safety. Colombian culture values warmth and personal connection, but healthcare demands clarity and boundaries.

**Tone Attributes:**

| Scenario | Tone | Formality | Example (Spanish) |
|----------|------|-----------|-------------------|
| **Initial greeting** | Warm, professional, welcoming | Neutral (tú/usted flexible) | "¡Hola! Soy Eva, la Asistente Virtual del Dr. Andrés Durán. Estoy aquí para ayudarte con cualquier duda. ¿En qué procedimiento estás interesada/o?" |
| **Medical questions** | Empathetic, cautious, deferential to doctor | Formal (usted) | "Entiendo tu preocupación. Esta información es general; el Dr. Durán evaluará tu caso específico en la valoración y te dará la mejor recomendación según tus necesidades físicas y clínicas." |
| **Poor photo quality** | Helpful, patient, instructional | Neutral | "Para evaluarte mejor, necesito fotos con buena iluminación y que muestren claramente el área que te interesa mejorar. ¿Podrías enviarme nuevas fotos siguiendo estas indicaciones?" |
| **Frustrated patient** | Empathetic, apologetic, solution-oriented | Formal | "Lamento que no haya podido ayudarte como esperabas. Te transferiré con un agente especializado que podrá atender tu solicitud de manera personalizada." |
| **Emergency keywords** | Urgent, directive, immediate escalation | Formal | "Por tu seguridad, necesito que contactes INMEDIATAMENTE al consultorio al [PHONE]. Si es una emergencia médica grave, llama al 123 o acude a urgencias." |

**Cultural Considerations for Colombia:**

- **Warmth matters:** Colombian patients expect friendly, personable service. Avoid robotic/cold tone.
- **Respect formality:** Use "usted" when discussing medical topics; "tú" acceptable for scheduling/general chat.
- **Empathy phrases:**
  - "Entiendo" (I understand)
  - "Me alegro" (I'm glad)
  - "Es normal sentirse así" (It's normal to feel that way)
  - "Estoy aquí para ayudarte" (I'm here to help you)
- **Avoid overconfidence:** Never say "garantizo" (I guarantee), "siempre funciona" (always works)

**Sources:**
- [Expressing Empathy in Spanish - Common Ground International](https://commongroundinternational.com/medical-spanish/expressing-empathy-in-spanish/)
- [Conversational AI in Plastic Surgery - Patient Prism](https://www.patientprism.com/conversational-ai-in-plastic-surgery/)

### Prohibited Topics

Eva MUST NOT engage in the following topics. Violations pose legal, ethical, and patient safety risks.

| Prohibited Topic | Why Prohibited | Eva's Response Template |
|------------------|----------------|-------------------------|
| **Medical advice/diagnosis** | Eva is not a licensed physician; giving medical advice violates Colombian medical practice laws | "La información específica solo la podrá responder el Dr. Durán en consulta, quien te hará la mejor recomendación según tus necesidades físicas y antecedentes médicos." |
| **Surgical outcome guarantees** | No surgeon can guarantee results; promises violate medical ethics | "Cada paciente es diferente. El Dr. Durán te mostrará resultados típicos en tu valoración, pero los resultados individuales dependen de muchos factores." |
| **Pricing/costs** | Prices vary by patient complexity (BMI, surgical time, techniques); AI cannot accurately quote | "Los costos varían según las necesidades únicas de tu cuerpo y el plan quirúrgico. En tu valoración te daremos un presupuesto exacto con todo incluido." [HANDOVER] |
| **Competitor comparisons** | Disparaging other doctors is unethical and legally risky | "El Dr. Durán se especializa en técnicas avanzadas como la Lipo High Tech 3 y protocolos de seguridad certificados. Para obtener más información sobre su experiencia, con gusto te transferiré con un asesor." |
| **Prótesis size recommendations** | Implant sizing requires physical examination, body measurements, patient anatomy | "El tamaño de prótesis adecuado depende de tu anatomía, estilo de vida y preferencias. El Dr. Durán te guiará en la valoración con opciones personalizadas." |
| **Emergency medical triage** | AI cannot assess medical emergencies; delays could cause harm | "Por favor contacta INMEDIATAMENTE al consultorio [PHONE] o llama al 123 si es una emergencia. Tu seguridad es nuestra prioridad." [IMMEDIATE ALERT] |
| **Post-operative complications** | Requires medical evaluation; misdiagnosis via chat is dangerous | "Cualquier síntoma post-operatorio debe ser evaluado por el Dr. Durán o su equipo médico. Por favor llama al consultorio [PHONE] ahora." [IMMEDIATE HANDOVER] |
| **Mental health crisis** | Requires licensed mental health professional; AI not qualified | "Tu bienestar emocional es muy importante. Te recomiendo hablar con un profesional de salud mental. ¿Te puedo ayudar a agendar una valoración con el Dr. Durán para discutir tus inquietudes?" |

**Implementation:**
- **Keyword detection:** Flag messages containing "garantiza", "precio", "costo", "competencia", "otro doctor", "dolor", "sangrado", "infección", "suicidio"
- **Intent classification:** Train LLM to recognize prohibited topic requests and trigger pre-approved deflection responses
- **Guardrails:** Post-generation check ensures Eva's response doesn't accidentally commit to prohibited topics

### Handover Triggers (AI → Human)

Eva is designed to handle 60-70% of initial inquiries. The remaining 30-40% require human expertise. Seamless handover is CRITICAL for patient satisfaction and safety.

**Decision Tree:**

```
Patient Message
    ↓
Intent Classification
    ↓
┌─────────────────────────────────────────────────────────┐
│ LOW COMPLEXITY (Eva Handles)                            │
├─────────────────────────────────────────────────────────┤
│ - General procedure information                         │
│ - Clinic location/hours                                 │
│ - Pre-consultation requirements                         │
│ - Before/after photo upload instructions                │
│ - Appointment confirmation (already scheduled)          │
└─────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────┐
│ MEDIUM COMPLEXITY (Eva with Guardrails)                 │
├─────────────────────────────────────────────────────────┤
│ - Procedure comparisons (Lipo vs Liposucción tradicional)│
│ - Recovery timeline (general info only)                 │
│ - Technology explanations (Vaser, J Plasma)             │
│ - Virtual vs in-person consultation differences         │
│ - Payment methods (general, no specific quotes)         │
└─────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────┐
│ HIGH COMPLEXITY (IMMEDIATE HANDOVER)                     │
├─────────────────────────────────────────────────────────┤
│ - Pricing/cost requests                                 │
│ - Surgical risk/complication questions                  │
│ - Medical history concerns (diabetes, previous surgeries)│
│ - Specific surgical planning (incision location, etc.)  │
│ - Dissatisfaction with previous surgeon                 │
│ - Multi-procedure combinations                          │
│ - Financing/payment plans                               │
│ - Urgent post-op concerns                               │
└─────────────────────────────────────────────────────────┘
    ↓
[HANDOVER TO HUMAN AGENT]
```

**Handover Message Template:**
"Te transferiré con un agente especializado que podrá ayudarte con esa solicitud específica. Un momento por favor."

**Context Preservation:**
When handing over, Bird Flow must pass:
1. Full conversation history (last 10 messages minimum)
2. Patient contact details (name, phone, email)
3. Flagged keywords/concerns
4. Eva's classification reason ("pricing request", "medical concern", etc.)

**Emergency Handover:**
If keywords "dolor intenso", "sangrado", "infección", "fiebre", "mareo" detected:
1. Immediate alert to on-call medical staff
2. Auto-response: "Por tu seguridad, un miembro del equipo médico te contactará en los próximos 10 minutos. Si es urgente, llama al [EMERGENCY PHONE]."
3. Flag conversation as URGENT in Bird inbox

**Sources:**
- [Strategic Guide to Chatbot Escalation 2025 - eesel AI](https://www.eesel.ai/blog/chatbot-escalation)
- [Transforming Healthcare with Chatbots - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC11915287/)

---

## Consent Management Patterns

### Initial Opt-In Script (Spanish)

Display BEFORE collecting ANY personal or health data:

```
¡Hola [Nombre]! 👋

Soy Eva, la Asistente Virtual del Dr. Andrés Durán. Voy a ayudarte
con información sobre procedimientos y agendar tu valoración.

Para brindarte el mejor servicio, necesito tu consentimiento para
recopilar información sobre tu salud, expectativas y datos personales.

📋 ¿Qué información recopilamos?
- Nombre, teléfono, correo, país
- Procedimiento de interés
- Fotografías (solo si tú las compartes voluntariamente)
- Historial médico básico (en la valoración, no en este chat)

🔒 ¿Cómo protegemos tus datos?
- Esta información será utilizada ÚNICAMENTE para tu consulta médica
- Protegida según la Ley 1581 de 2012 de Colombia (Protección de Datos Personales)
- Almacenada de forma segura con cifrado
- NUNCA compartida con terceros sin tu autorización expresa

⏱ Retención de datos:
- Datos de contacto: Hasta que solicites su eliminación
- Historias clínicas: 15 años (requisito legal colombiano)
- Fotos de valoración: 90 días (salvo consentimiento para galería)

👤 Tus derechos:
- Acceder a tus datos en cualquier momento
- Corregir información incorrecta
- Solicitar eliminación de datos (excepto historia clínica por ley)
- Revocar este consentimiento

¿Autorizas que recopilemos y guardemos esta información para tu
valoración médica con el Dr. Andrán Durán?
```

**Interactive Buttons:**
- ✅ Sí, autorizo
- ❌ No, prefiero hablar con un humano
- 📄 Ver Política de Privacidad completa

**Implementation Notes:**
- Store consent timestamp in Bird CRM with conversation ID
- Log consent acceptance in audit trail (ISO 8601 timestamp + user identifier)
- If patient declines: Immediate handover to human agent with message "Paciente requiere explicación personalizada del consentimiento"

### Photo Consent Template

When patient volunteers to send before/after photos:

```
Gracias por compartir tus fotos. Para procesar estas imágenes, necesito
un consentimiento adicional:

📸 Consentimiento para Fotografías Médicas

Autorizo al Dr. Andrés Durán y su equipo a:
✓ Almacenar mis fotografías en mi expediente médico
✓ Analizarlas con tecnología de inteligencia artificial (Google Gemini)
  para evaluar características anatómicas
✓ Compartirlas con el Dr. Durán para su revisión antes de la valoración

Las fotografías serán:
- Cifradas durante transmisión y almacenamiento
- Conservadas por 90 días para fines de valoración quirúrgica
- Eliminadas automáticamente después (salvo que des otro consentimiento)

❌ Tus fotos NO serán:
- Publicadas en redes sociales
- Mostradas a otros pacientes
- Usadas con fines de marketing sin tu autorización SEPARADA y ESCRITA

¿Autorizas el procesamiento de tus fotografías bajo estos términos?
```

**Interactive Buttons:**
- ✅ Sí, autorizo
- ❌ No, prefiero enviarlas en la valoración presencial
- 🔐 Tengo preguntas sobre privacidad

**Technical Implementation:**
- If patient authorizes: Process photos with Gemini, strip EXIF metadata, store encrypted
- If patient declines: Acknowledge and note in CRM "Patient prefers in-person photo review"
- Auto-delete photos after 90 days (cron job in Vercel)

### Data Usage Disclosure

Present in initial opt-in AND available on-demand:

| Data Type | Collection Method | Use | Storage Duration | Access |
|-----------|-------------------|-----|------------------|--------|
| **Nombre completo** | Patient input (chat) | Identification, appointment scheduling | Until deletion requested | Dr. Durán, authorized staff, Eva AI |
| **Teléfono** | WhatsApp contact info | Communication, appointment reminders | Until deletion requested | Dr. Durán, authorized staff |
| **Correo electrónico** | Patient input (chat) | Send appointment confirmations, documents | Until deletion requested | Dr. Durán, authorized staff |
| **País** | Patient input (chat) | Pricing (USD vs COP), legal compliance | Until deletion requested | Dr. Durán, authorized staff |
| **Procedimiento de interés** | Patient input (chat) | Personalize consultation, medical planning | 15 years (medical record) | Dr. Durán, authorized staff |
| **Fotografías médicas** | Patient upload (WhatsApp) | Surgical planning, pre-op evaluation | 90 days default, 15 years if medical record | Dr. Durán, Eva AI (Gemini), authorized staff |
| **Historial médico** | Consultation forms (NOT chat) | Medical safety, surgical planning | 15 years (legal requirement) | Dr. Durán, authorized medical staff ONLY |
| **Conversación con Eva** | Bird platform logs | Quality assurance, AI training | Per Bird DPA policy | Dr. Durán, authorized staff, Bird platform (encrypted) |

**Patient Rights Notice:**
"Puedes ejercer tus derechos de acceso, corrección, actualización y supresión de datos contactando a: [EMAIL/PHONE]. Responderemos en máximo 15 días hábiles según la Ley 1581 de 2012."

---

## Privacy & Security Best Practices

### Data Retention Policy

Based on Colombian medical records law (Resolución 839 de 2017):

| Data Type | Retention Period | Legal Basis | Justification |
|-----------|------------------|-------------|---------------|
| **Medical records (Historia Clínica)** | 15 years minimum from last medical attention | Resolución 839 de 2017 (Colombia) | Legal requirement for all healthcare providers |
| **Storage breakdown** | - Years 1-5: Management archive<br>- Years 6-15: Central archive | Resolución 839 de 2017 | Structured retention per Colombian law |
| **Contact information** | Until patient requests deletion | Law 1581/2012 (patient right to erasure) | Ongoing patient relationship |
| **Before/after photos (valoración)** | 90 days (unless included in medical record) | Practice policy (exceeds minimum requirement) | Surgical planning only; deleted after decision made |
| **Marketing photos** | Indefinite with explicit written consent | Law 1581/2012 + Colombian marketing laws | Requires separate consent form |
| **WhatsApp conversation logs** | Per Bird platform DPA (likely 30-90 days) | Bird Terms of Service | Platform-managed retention |
| **AI processing logs (Vercel)** | 30 days maximum | Practice policy (privacy by design) | Debugging/quality assurance only |
| **Audit logs (security)** | 15 years | ISO 27001 best practice + medical records alignment | Legal defensibility |

**Special Retention Cases:**

1. **Victims of human rights violations or serious infractions of International Humanitarian Law:**
   - Retention period DOUBLED (30 years)

2. **Crimes against humanity:**
   - PERMANENT retention required

**Deletion Workflow:**
1. Patient requests deletion via email/phone
2. Verify patient identity (ID number + phone number match)
3. Delete contact info, photos, non-medical chat logs within 15 business days
4. Retain medical records for 15 years per law (inform patient)
5. Send confirmation email with deletion summary

**Sources:**
- [Resolución 839 de 2017 - ConsultorSalud](https://consultorsalud.com/tiempo-de-retencion-y-conservacion-de-la-historia-clinica-resolucion-839-de-2017/)
- [Colombian Medical Records Retention - ActualiSalud](https://actualisalud.com/resolucion-839-de-2017/)

### PII Minimization

Collect ONLY what's necessary for surgical consultation. Avoid over-collection that increases compliance burden and privacy risks.

**REQUIRED Data:**

- Nombre completo
- Teléfono (with country code)
- Correo electrónico
- País (for pricing/legal compliance)
- Procedimiento de interés

**OPTIONAL Data (collect ONLY if patient volunteers):**

- Edad/fecha de nacimiento (for surgical eligibility, e.g., 18+ for cosmetic procedures)
- Fotografías (before/after for pre-consultation evaluation)
- Historial médico básico (major surgeries, chronic conditions) → **Defer to in-person consultation form**

**PROHIBITED to Collect via Eva:**

- Colombian cédula or ID number (high-risk PII)
- Full medical records
- Insurance information
- Payment card details (use secure payment gateway only)
- Social media passwords/credentials
- Detailed health conditions (diabetes management, medications) → Medical form only

**Data Minimization in AI Processing:**

When sending data to third-party AI services:

| Service | Data Sent | PII Stripped? | Retention |
|---------|-----------|---------------|-----------|
| **Gemini (images)** | Photo pixels only | ✓ Yes - No name, phone, email sent | 24 hours max (Google cache) |
| **Groq (audio)** | Audio file only | ✓ Yes - No patient identifiers sent | No storage per Groq BAA |
| **OpenAI (audio)** | Audio file only | ✓ Yes - No patient identifiers sent | 30 days (Enterprise default) |
| **Bird (conversations)** | Full chat with name/phone | ✗ No - Required for messaging | Per Bird DPA policy |

**Technical Implementation:**
- Strip EXIF metadata from photos before processing (location, device, timestamp)
- Anonymize transcriptions: Replace patient name with "[PATIENT]" placeholder
- Never log base64-encoded image data (high storage cost + privacy risk)

### Secure Media Handling

Before/after photos are the most privacy-sensitive data Eva handles. Multi-layer security required:

**Download Security:**
```typescript
// Secure media download from Bird CDN
const headers = process.env.BIRD_ACCESS_KEY
  ? { Authorization: `AccessKey ${process.env.BIRD_ACCESS_KEY}` }
  : {};

const response = await fetch(mediaUrl, {
  headers,
  // Timeout to prevent hanging requests
  signal: AbortSignal.timeout(5000)
});

if (!response.ok) {
  throw new Error('Media download failed - unauthorized or not found');
}
```

**EXIF Stripping:**
```typescript
// Remove location, device info, timestamps from photos
import sharp from 'sharp'; // Edge Runtime compatible

const imageBuffer = await response.arrayBuffer();
const strippedImage = await sharp(Buffer.from(imageBuffer))
  .rotate() // Auto-rotate based on orientation
  .withMetadata({ exif: {} }) // Strip all EXIF data
  .toBuffer();
```

**Processing Security:**
- Send to Gemini API over HTTPS (TLS 1.3)
- Use temporary file storage (Vercel /tmp directory, auto-deleted after function execution)
- Never store images in Git, logs, or public directories

**Storage Security (if storing >90 days):**
- Encrypt at rest: AES-256 encryption
- Access control: Only Dr. Durán and authorized staff can decrypt
- Audit logging: Track every access with timestamp + user ID

**Deletion Protocol:**
```typescript
// Auto-delete photos after 90 days
// Vercel Cron Job: /api/cron/delete-old-photos

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized execution
  if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90); // 90 days ago

  // Query database for photos older than cutoff
  const oldPhotos = await db.photos.findMany({
    where: { uploadedAt: { lt: cutoffDate }, isInMedicalRecord: false }
  });

  // Delete from storage + database
  for (const photo of oldPhotos) {
    await storage.delete(photo.fileKey);
    await db.photos.delete({ where: { id: photo.id } });
  }

  return Response.json({ deleted: oldPhotos.length });
}
```

**WhatsApp-Specific Risks:**
- Patients may screenshot conversations (no technical prevention possible)
- Solution: Include disclaimer in every photo request: "Las fotos compartidas aquí son confidenciales. No las compartas con terceros."

### Third-Party Service Boundaries

Understanding what data each service accesses and their compliance posture:

| Service | Data Accessed | Data Stored? | Compliance | DPA/BAA Required? | Risk Level |
|---------|---------------|--------------|------------|-------------------|------------|
| **Bird Platform** | Full conversation history, contact info, media URLs | ✓ Yes - Per DPA retention policy | GDPR (DPA available) | ✓ Yes - DPA signed by default | Medium |
| **Google Gemini** | Photo pixels, document PDFs (no patient name/ID) | ✗ No - 24hr cache max | HIPAA (with BAA), GDPR, SOC2 | ✓ Yes - BAA + HIPAA project flag | Low |
| **Groq Whisper** | Audio files (no patient identifiers) | ✗ No - Processed in-memory | HIPAA (BAA available) | ✓ Yes - Request BAA | Low |
| **OpenAI Whisper** | Audio files (no patient identifiers) | ~ Partial - 30 days default | HIPAA (Enterprise BAA), GDPR, SOC2 | ✓ Yes - Enterprise plan required | Medium |
| **Vercel Edge Runtime** | API request/response logs | ~ Partial - 30 days max | GDPR (EU hosting available) | Check Vercel Terms | Medium |

**Data Flow Diagram:**
```
Patient → WhatsApp → Bird Platform → Vercel Edge Function → AI Service → Response
           ↓           ↓                ↓                      ↓
         E2EE      DPA Storage     Temp Logs           No Storage
                   (per policy)    (30 days)          (24hr cache)
```

**Key Safeguards:**

1. **Bird Platform:**
   - Sign Data Processing Agreement (DPA)
   - Enable GDPR compliance features in Bird dashboard
   - Regularly audit Bird's access logs (if available)
   - Ensure Bird does NOT use conversation data for training their AI models

2. **Google Gemini:**
   - Sign Business Associate Agreement (BAA) via Google Cloud
   - Enable "HIPAA project flag" in Google Cloud Console project settings
   - Confirm "Data Residency" is Colombia or EU (not US) if possible
   - Disable "Gemini feedback/training" features that store data

3. **Groq:**
   - Request and sign Business Associate Addendum (BAA) via Groq Trust Center
   - Confirm audio transcriptions are NOT stored beyond request processing
   - Verify Groq's SOC2 status (if pursuing SOC2 compliance)

4. **Vercel:**
   - Review Vercel Terms of Service re: healthcare data
   - Set log retention to 30 days maximum
   - Enable server-side encryption for logs
   - Consider EU/LATAM hosting regions for GDPR alignment

**Breach Notification Protocol:**
If any service reports data breach:
1. Notify Colombian SIC within 15 business days (Law 1581/2012)
2. Notify affected patients within 30 days
3. Document breach response and remediation steps
4. Evaluate continuing relationship with breached service

---

## Quality Assurance Framework

### Human Review Workflows

AI systems require continuous human oversight to maintain quality, safety, and compliance.

**Review Schedule:**

| Review Type | Frequency | Sample Size | Responsible Party | Purpose |
|-------------|-----------|-------------|-------------------|---------|
| **Random conversation audit** | Weekly | 10% of all conversations | Practice manager + Dr. Durán | Detect AI errors, tone issues, missed handovers |
| **Handover conversation audit** | Weekly | 100% of handovers | Practice manager | Understand why AI failed; improve training |
| **Flagged conversations (keywords)** | Daily | 100% of flagged chats | Medical staff | Emergency triage, patient safety |
| **Patient complaint review** | As received | 100% of complaints | Dr. Durán | Legal risk mitigation, service recovery |
| **Consent compliance audit** | Monthly | 20 conversations | Compliance officer | Verify consent obtained before data collection |
| **Photo processing audit** | Monthly | 10 photos | Dr. Durán | Verify Gemini extraction accuracy, EXIF stripping |

**Audit Workflow:**
1. Export conversations from Bird platform (CSV or API)
2. Load into review tool (spreadsheet or dedicated QA software)
3. Flag issues:
   - Medical advice given (CRITICAL)
   - Pricing quoted incorrectly (HIGH)
   - Rude/unprofessional tone (MEDIUM)
   - Handover delay (MEDIUM)
   - Consent not obtained (CRITICAL)
4. Document findings in audit log
5. Update Eva's prompts/knowledge base to prevent recurrence
6. Monthly report to Dr. Durán with trends and recommendations

**Review Questions:**
- Did Eva correctly identify patient intent?
- Was the tone empathetic and professional?
- Did Eva stay within scope (no medical advice)?
- Was handover triggered at the right time?
- Was consent obtained before collecting health data?
- Did Eva provide accurate procedure information?

### Error Escalation

Not all errors are equal. Prioritize response based on severity:

```
┌─────────────────────────────────────────────────────────────┐
│ SEVERITY 1: CRITICAL (Immediate Action Required)           │
├─────────────────────────────────────────────────────────────┤
│ Examples:                                                   │
│ - Eva gave medical diagnosis ("You have lipedema")          │
│ - Eva guaranteed surgical outcome ("100% success")          │
│ - Privacy breach (sent patient A's photo to patient B)     │
│ - Emergency not escalated (patient said "bleeding" → ignored)│
│                                                             │
│ Response:                                                   │
│ 1. IMMEDIATE shutdown of Eva (disable AI Employees agent)  │
│ 2. Contact affected patient(s) within 2 hours              │
│ 3. Incident report to Dr. Durán + legal counsel            │
│ 4. Notify Colombian SIC if privacy breach (15 business days)│
│ 5. Root cause analysis + fix before re-enabling Eva        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ SEVERITY 2: HIGH (Action Required Within 24 Hours)         │
├─────────────────────────────────────────────────────────────┤
│ Examples:                                                   │
│ - Eva quoted incorrect pricing ($5,000 instead of $8,000)   │
│ - Eva mentioned competitor negatively                       │
│ - Inappropriate tone (condescending to patient)             │
│ - Failed to handover for obvious pricing question           │
│                                                             │
│ Response:                                                   │
│ 1. Contact affected patient to correct misinformation       │
│ 2. Flag conversation for Dr. Durán review                   │
│ 3. Update Eva's prompt/knowledge base within 24 hours       │
│ 4. Test fix with 5 similar queries before deploying         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ SEVERITY 3: MEDIUM (Review in Weekly Audit)                │
├─────────────────────────────────────────────────────────────┤
│ Examples:                                                   │
│ - Eva misunderstood patient question (answered about Lipo   │
│   when patient asked about Rinoplastia)                     │
│ - Slightly awkward phrasing in Spanish                      │
│ - Didn't offer handover when patient seemed uncertain       │
│                                                             │
│ Response:                                                   │
│ 1. Log in weekly audit report                               │
│ 2. Batch fix with other similar issues                      │
│ 3. Redeploy improved prompt at next scheduled update        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ SEVERITY 4: LOW (Monitor for Trends)                       │
├─────────────────────────────────────────────────────────────┤
│ Examples:                                                   │
│ - Eva used "usted" when "tú" would be more friendly         │
│ - Response was slightly longer than ideal                   │
│ - Patient asked clarifying question (but got answer 2nd try)│
│                                                             │
│ Response:                                                   │
│ 1. Log in monthly report                                    │
│ 2. If trend emerges (10+ similar cases), create improvement │
│    task for next quarter                                    │
└─────────────────────────────────────────────────────────────┘
```

**Incident Response Template:**
```
INCIDENT REPORT: Eva AI Error
Date: [YYYY-MM-DD]
Severity: [1-4]
Conversation ID: [Bird conversation ID]
Patient: [Name] ([Phone])
Error Description: [What went wrong?]
Root Cause: [Why did it happen?]
Patient Impact: [Was patient harmed? Misinformed?]
Immediate Action: [What was done within 2 hours?]
Preventive Action: [How will we prevent recurrence?]
Responsible Party: [Who is implementing fix?]
Completion Date: [When will fix be deployed?]
Verified By: [Who tested the fix?]
```

### Feedback Loops

Eva improves through continuous learning from real conversations.

**Patient Feedback Collection:**

After Eva resolves a query (no handover), send:
```
¿Te ayudó esta información?

[👍 Sí, muy útil] [👎 No, necesito más ayuda]
```

If patient clicks 👎:
1. Immediate handover to human agent
2. Flag conversation for weekly audit
3. Log feedback with conversation ID for analysis

**Analytics to Track:**

| Metric | Target | Measurement | Action if Below Target |
|--------|--------|-------------|------------------------|
| **Patient satisfaction** | 80%+ thumbs up | Post-conversation survey | Review flagged conversations; identify common complaints |
| **AI containment rate** | 60-70% no handover | % conversations Eva completes without human | If too low (<60%): Eva too conservative; if too high (>80%): Eva may be overstepping |
| **Handover response time** | <5 minutes during business hours | Time from handover trigger to human response | Add staff capacity or extend hours |
| **Medical accuracy** | 100% (zero medical advice incidents) | Weekly audit + complaint tracking | If ANY incident: Immediate review + prompt update |
| **Consent compliance** | 100% | Monthly audit of 20 conversations | If ANY failure: Retrain staff + update consent flow |
| **Average response time (Eva)** | <2 minutes | Vercel logs | Optimize API calls, upgrade Vercel plan if needed |
| **Photo processing accuracy** | 90%+ usable extractions | Dr. Durán review of Gemini outputs | Improve prompts, switch to Gemini 2.5 if needed |

**Improvement Process:**
1. **Weekly:** Review top 3 patient complaints + top 3 handover reasons
2. **Monthly:** Update Eva's knowledge base with new procedures, policy changes, common questions
3. **Quarterly:** Comprehensive prompt optimization based on 3 months of data
4. **Annually:** Third-party compliance audit (Law 1581/2012, medical practice standards)

**Training Data Sources:**
- Anonymized transcripts of successful human agent conversations
- Dr. Durán's FAQs from in-person consultations
- Website content (procedures, technologies, policies)
- Official medical association guidelines (SCCP - Sociedad Colombiana de Cirugía Plástica)

**Prohibited Training Data:**
- Real patient medical records (privacy violation)
- Competitor websites (copyright infringement)
- Unverified medical information from forums/social media
- Conversations where Eva made errors (unless specifically annotated as negative examples)

### Success Metrics

Define clear KPIs to evaluate Eva's performance:

| Category | Metric | Target | Measurement Frequency | Owner |
|----------|--------|--------|-----------------------|-------|
| **Patient Satisfaction** | Post-valoración survey: "How helpful was Eva?" | 80%+ positive | Monthly | Practice manager |
| **Operational Efficiency** | AI handover rate | 30-40% of conversations | Weekly | Practice manager |
| **Patient Safety** | Medical advice incidents | 0 per month | Daily (flagged keywords) | Dr. Durán |
| **Compliance** | Privacy incidents | 0 per quarter | Quarterly audit | Compliance officer |
| **Speed** | Average response time (Eva) | <2 minutes | Real-time (Vercel logs) | Tech team |
| **Accuracy** | Procedure information accuracy | 95%+ correct | Monthly (Dr. Durán review) | Dr. Durán |
| **Engagement** | Conversion: Chat → Scheduled valoración | 40%+ | Monthly | Sales manager |
| **Cost Efficiency** | Cost per conversation (API fees) | <$0.50 USD | Monthly | Finance |

**Dashboard (Monthly Report):**
```
Eva Performance Report - [Month Year]

Patient Satisfaction: 84% ✓ (Target: 80%)
AI Containment: 67% ✓ (Target: 60-70%)
Medical Safety: 0 incidents ✓ (Target: 0)
Privacy Incidents: 0 ✓ (Target: 0)
Avg Response Time: 1.4 min ✓ (Target: <2 min)
Conversion Rate: 43% ✓ (Target: 40%)

Top 3 Handover Reasons:
1. Pricing requests (48%)
2. Surgical risk questions (22%)
3. Post-op concerns (15%)

Top 3 Improvements This Month:
1. Updated Lipo High Tech 3 description (patient confusion reduced 30%)
2. Added empathy phrases for anxious patients (satisfaction +6%)
3. Improved photo upload instructions (re-submission rate down 25%)

Action Items for Next Month:
- [ ] Create FAQ for financing/payment plans (reduce handovers)
- [ ] Train Eva on new "Lifting de Muslos" procedure
- [ ] A/B test: "tú" vs "usted" for initial greeting
```

---

## References

### Colombian Legal Framework
- [Data Protection Laws in Colombia - DLA Piper](https://www.dlapiperdataprotection.com/index.html?t=law&c=CO)
- [Colombia Data Protection Law 1581 Compliance Guide - MG Legal Group](https://www.mg-legalgroup.com/n/colombia-data-protection-law-1581-compliance-guide)
- [Law 1581/2012 Colombia - CLYM](https://www.clym.io/regulations/law-15812012-colombia)
- [Resolución 839 de 2017: Medical Records Retention - ConsultorSalud](https://consultorsalud.com/tiempo-de-retencion-y-conservacion-de-la-historia-clinica-resolucion-839-de-2017/)
- [Colombian Medical Records Retention - ActualiSalud](https://actualisalud.com/resolucion-839-de-2017/)
- [GDPR-Inspired Consent Models in LATAM - Cookie Script](https://cookie-script.com/privacy-laws/latin-american-alignment)
- [Latin America's Privacy Pivot - TrustArc](https://trustarc.com/resource/latin-americas-privacy-compliance-strategy-2025/)

### WhatsApp Business API Healthcare Compliance
- [Is WhatsApp HIPAA Compliant? - HIPAA Guide](https://www.hipaaguide.net/is-whatsapp-hipaa-compliant/)
- [WhatsApp for Healthcare 2025 - DocHours](https://dochours.com/whatsapp-for-healthcare-improve-patient-communication/)
- [Is WhatsApp HIPAA Compliant? - Paubox](https://www.paubox.com/blog/whatsapp-hipaa-compliant)
- [WhatsApp Business API for Healthcare Guide - D7 Networks](https://d7networks.com/blog/whatsapp-business-api-for-healthcare/)
- [Legal Considerations for WhatsApp Business API - ChatArchitect](https://www.chatarchitect.com/news/legal-considerations-for-using-the-whatsapp-business-api-what-businesses-need-to-know)

### Medical Chatbot Best Practices
- [Conversational AI in Plastic Surgery - Patient Prism](https://www.patientprism.com/conversational-ai-in-plastic-surgery/)
- [Top 5 Conversational AI Tools for Plastic Surgery - DezyIT](https://www.dezyit.com/post/top-5-conversational-ai-tools-for-plastic-surgery-clinics)
- [Top 6 AI Chatbots in Healthcare 2025 - Keragon](https://www.keragon.com/blog/ai-chatbots-in-healthcare)
- [Transforming Healthcare Delivery with Conversational AI - Nature](https://www.nature.com/articles/s41746-025-01968-6)
- [Expressing Empathy in Spanish - Common Ground International](https://commongroundinternational.com/medical-spanish/expressing-empathy-in-spanish/)
- [An Empathic GPT-based Chatbot for Spanish Teenagers - arXiv](https://arxiv.org/html/2505.05828v1)

### Healthcare AI Consent & Privacy
- [AI Health Care Digital Transformation in Colombia 2025 - Colombia One](https://colombiaone.com/2025/11/29/ai-health-care-digital-transformation-in-colombia-solutions-from-latam-healthtech-forum-2025/)
- [Consent Management Challenges in Healthcare 2025 - SecurePrivacy](https://secureprivacy.ai/blog/healthcare-data-sharing-challenges-2025)
- [Privacy and AI in Healthcare - BMC Medical Ethics](https://link.springer.com/article/10.1186/s12910-021-00687-3)
- [Patient Consent for Secondary Use of Health Data in AI - PubMed](https://pubmed.ncbi.nlm.nih.gov/40107041/)

### Medical Chatbot Handover & Escalation
- [Strategic Guide to Chatbot Escalation 2025 - eesel AI](https://www.eesel.ai/blog/chatbot-escalation)
- [Transforming Healthcare with Chatbots - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC11915287/)
- [How Medical Chatbots Revolutionize Healthcare - John Snow Labs](https://www.johnsnowlabs.com/why-medical-chatbot-are-essential-in-modern-healthcare/)

### Patient Photography Consent
- [Clinical Photography and Our Responsibilities - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC4292101/)
- [Photography Consent and Legal Issues - PubMed](https://pubmed.ncbi.nlm.nih.gov/20511073/)
- [Legal Ramifications of Publishing Patient Photographs - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC10400045/)
- [Who Owns Patient Photographs? - Plastic and Reconstructive Surgery](https://journals.lww.com/plasreconsurg/fulltext/2020/03000/who_owns_the_patient_s_photographs__consent_and.74.aspx)

### Third-Party AI Service Compliance
- [Google Gemini HIPAA Compliance - DataStudios](https://www.datastudios.org/post/google-gemini-gdpr-hipaa-and-enterprise-compliance-standards-explained)
- [Is Google Gemini HIPAA Compliant? - Nightfall AI](https://www.nightfall.ai/blog/is-google-gemini-hipaa-compliant)
- [Google Workspace and Gemini HIPAA Compliance - UpCurve Cloud](https://upcurvecloud.com/blog/google-workspace-and-gemini-hipaa-compliant-for-healthcare-organizations/)
- [Is Groq HIPAA Compliant? - Groq Community](https://community.groq.com/t/is-groq-hipaa-compliant/83)
- [Groq Business Associate Addendum - GroqDocs](https://console.groq.com/docs/legal/customer-business-associate-addendum)
- [Groq Trust Center](https://trust.groq.com/)
- [Bird Data Processing Agreement](https://bird.com/legal/dpa)
- [Bird Security Overview](https://docs.bird.com/connectivity-platform/data-governance-and-security/messagebird-security-overview)

### FDA & EU AI Regulations
- [FDA Oversight of Health AI Tools - Bipartisan Policy Center](https://bipartisanpolicy.org/issue-brief/fda-oversight-understanding-the-regulation-of-health-ai-tools/)
- [AI Medical Devices Regulation 2025 - IntuitionLabs](https://intuitionlabs.ai/articles/ai-medical-devices-regulation-2025)
- [FDA Guidance on AI-Enabled Devices 2025 - Greenlight Guru](https://www.greenlight.guru/blog/fda-guidance-ai-enabled-devices)
- [Navigating EU AI Act for Healthcare - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC11319791/)
- [EU AI Act Implementation 2025 - Censinet](https://www.censinet.com/perspectives/eu-ai-act-implementation-five-critical-steps-boards-must-take-in-2025)
- [Doctor Chatbot EU Regulatory Prescription - SCUP](https://www.scup.com/doi/10.18261/olr.10.1.1)

---

**Document Metadata:**
- **Lines:** 1,247
- **Tokens:** ~6,500 (estimated)
- **Last Updated:** 2025-12-14
- **Next Review:** 2026-03-14 (Quarterly review recommended)
- **Compliance Verification:** Pending legal counsel review

**Change Log:**
- v1.0 (2025-12-14): Initial draft based on Colombian Law 1581/2012, Resolución 839/2017, WhatsApp Business API terms, and international medical chatbot best practices

---

**IMPLEMENTATION CHECKLIST:**

Before deploying Eva to production:

- [ ] Legal counsel reviews this document for Colombian compliance
- [ ] Sign Bird Data Processing Agreement (DPA)
- [ ] Sign Google Gemini Business Associate Agreement (BAA) + enable HIPAA project flag
- [ ] Request and sign Groq Business Associate Addendum (BAA)
- [ ] Implement consent opt-in flow in Bird AI Employees
- [ ] Configure photo consent template in Eva's prompts
- [ ] Set up 90-day photo deletion cron job in Vercel
- [ ] Train medical staff on handover protocol
- [ ] Create incident response plan for Severity 1 errors
- [ ] Set up weekly audit workflow (practice manager)
- [ ] Configure keyword flagging for emergency terms
- [ ] Test handover triggers with 20 sample conversations
- [ ] Deploy patient feedback buttons (thumbs up/down)
- [ ] Create monthly performance dashboard
- [ ] Schedule quarterly compliance audit with external auditor
