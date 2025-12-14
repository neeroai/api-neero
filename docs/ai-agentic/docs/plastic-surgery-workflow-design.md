# Plastic Surgery Patient Workflow Design

Version: 1.0 | Date: 2025-12-14 | Owner: Business Analyst | Status: Draft

---

## Overview

Dr. Andrés Durán operates a modern plastic surgery practice in Colombia serving LATAM patients through WhatsApp, Instagram, and phone channels. The practice specializes in advanced body contouring techniques (Lipo High Tech 3), facial procedures (rhinoplasty, blepharoplasty), and breast surgeries. Current operations rely on manual WhatsApp responses from staff coordinators, creating bottlenecks in initial patient engagement and data collection. This workflow design documents the patient journey from first contact to post-procedure follow-up, identifying optimal automation opportunities while preserving human-critical touchpoints.

---

## Patient Journey Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DR. DURÁN PATIENT JOURNEY (LATAM)                    │
└─────────────────────────────────────────────────────────────────────────┘

1. INITIAL CONTACT (Entry Point)
   WhatsApp (70%) | Instagram DM (20%) | Phone (10%)
   Patient asks: "¿Cuánto cuesta la rinoplastia?"
   ↓
   [CURRENT: 2-4hr manual response | TARGET: <2 min AI response]
   ↓

2. INFORMATION GATHERING (Qualification)
   Eva AI collects:
   - Name, phone (+57), email, country
   - Procedure interest (Lipo High Tech 3, rinoplastia, etc.)
   - Expectations, motivations
   - Before photos (if ready)
   ↓
   [CURRENT: 15 min staff time | TARGET: 5 min (AI-guided)]
   ↓

3. VALORACIÓN SELECTION (Decision Point)
   Three options based on procedure/location:
   ┌────────────────┬─────────────────┬──────────────────┐
   │ Pre-consulta   │ Virtual         │ Presencial       │
   │ WhatsApp+Photos│ Video Call      │ In-Office Exam   │
   │ 15 min         │ 30 min          │ 60 min           │
   │ Remote         │ Remote          │ BAQ or BOG       │
   │ [TBD Cost]     │ [TBD Cost]      │ [TBD Cost]       │
   └────────────────┴─────────────────┴──────────────────┘
   ↓
   [HUMAN HANDOVER: Pricing discussion + recommendation]
   ↓

4. APPOINTMENT SCHEDULING + PAYMENT
   Coordinator offers 3-5 available slots
   Patient selects → Payment required (before/at booking)
   Calendar entry → Automated reminders (48hr, 24hr, day-of)
   ↓
   [CURRENT: Manual calendar check | TARGET: Phase 2 API integration]
   ↓

5. VALORACIÓN (Dr. Durán Evaluation)
   Physical/virtual exam → Medical photography
   Surgical plan → Detailed quote (procedure + anesthesia + facility)
   Risk discussion → Patient questions
   ↓
   [CRITICAL: 100% human touchpoint - no AI]
   ↓

6. DECISION PERIOD (Patient Reflection)
   Patient considers quote, financing, timing
   May request second opinion, before/after examples
   Staff nurtures via WhatsApp (not pushy)
   ↓
   [Duration: 3-30 days average]
   ↓

7. PRE-PROCEDURE (Medical Clearance)
   Labs ordered (CBC, coagulation, EKG if >40 years)
   Medical clearances (cardiologist if needed)
   Final payment → Surgery date confirmed
   Pre-op instructions (fasting, medications, companion)
   ↓
   [AUTOMATION: Checklist tracking, reminder WhatsApp messages]
   ↓

8. PROCEDURE DAY (Surgery)
   Arrival 2hr before surgery → Final consents
   Pre-op photos → Surgery → Recovery room
   Discharge with caregiver → Post-op kit
   ↓

9. POST-PROCEDURE FOLLOW-UP (Recovery Monitoring)
   Day 1: Staff calls to check recovery
   Day 7: First follow-up (stitch removal if needed)
   Day 30: Progress photos + evaluation
   Day 90: Final result assessment
   ↓
   [AUTOMATION: Scheduled follow-up WhatsApp messages, photo requests]
   ↓

10. LONG-TERM RELATIONSHIP (Loyalty)
    Annual check-ins → Referral incentives
    Before/after portfolio (with consent)
    Educational content (Instagram, WhatsApp status)
```

---

## Stage Breakdown

### 1. Initial Contact (Entry Point)

**Current Process:**
- **Channels:** WhatsApp (primary, 70%), Instagram DM (20%), Phone (10%)
- **Staff Response Time:** 2-4 hours during business hours (9am-6pm Colombia time)
- **Common First Questions:**
  - "¿Cuánto cuesta [procedure]?" (40%)
  - "¿Hacen [procedure]?" (25%)
  - "Quiero agendar una valoración" (20%)
  - "¿Dónde están ubicados?" (10%)
  - "¿Cuánto dura la recuperación de [procedure]?" (5%)

**Pain Points:**
- After-hours inquiries (6pm-9am) go unanswered until next day
- Patient contacts competitors while waiting for response
- Staff spends 15-20 min per inquiry answering repetitive questions
- No systematic data capture (conversations lost in WhatsApp threads)

**AI Automation Opportunity (HIGH IMPACT):**
- **Instant Response (<2 min):** 24/7 availability, even nights/weekends
- **Initial Triage:**
  - Simple questions (location, hours, procedures offered) → AI handles completely
  - Pricing/scheduling → AI collects basic info + transfers to human
  - Urgent medical concerns (post-op complications) → Immediate escalation
- **Data Capture:** Structured collection of name, phone, email, country, procedure interest
- **Conversion Boost:** Faster response = 30-40% higher conversion (industry benchmark)

**Triage Logic:**
```
IF question IN [location, hours, procedures_list, recovery_time_general]
  THEN AI responds fully with knowledge base

IF question IN [pricing, financing, specific_quote]
  THEN AI says: "El costo depende de tu caso. Un asesor te dará un
                 presupuesto personalizado. ¿Puedo tomar tus datos?"
  COLLECT: name, phone, email, country, procedure
  TRANSFER to human

IF keywords IN [dolor, sangrado, fiebre, emergencia] (post-op patient)
  THEN IMMEDIATE escalation to medical staff
  MESSAGE: "Esto requiere atención inmediata. Transferiré con el equipo médico."

IF sentiment = frustrated OR keywords IN [queja, hablar_con_alguien]
  THEN TRANSFER to human
  MESSAGE: "Serás transferido con un agente de servicio al cliente."
```

**Success Metrics:**
- Response time: 2-4hr → <2 min (AI)
- After-hours engagement: 0 → 24/7 coverage
- Staff time per inquiry: 15 min → 5 min (data already collected)
- Lead conversion: [TBD baseline] → +30-40% increase

---

### 2. Information Gathering (Qualification)

**Current Process:**
- Staff manually asks via WhatsApp: name, phone, email, country
- "¿En qué procedimiento estás interesada/o?"
- "¿Por qué estás considerando este procedimiento?" (expectations)
- "¿Tienes fotos que puedas compartir?" (50% send, 50% need prompting)
- Average time: 10-15 minutes per patient (back-and-forth messages)
- Data entry: Manual copy-paste into CRM/spreadsheet

**Photo Quality Issues (MAJOR PAIN POINT):**
- **Current:** 50% of initial photos are unusable
  - Poor lighting (bathroom selfies, dark rooms)
  - Wrong angles (too close, not frontal, cropped)
  - Clothed when nude torso needed (body procedures)
  - Filters/makeup (facial procedures)
- **Staff Impact:** 30 min/day re-requesting photos, giving instructions
- **Patient Friction:** Multiple rounds of photo submissions → frustration

**AI Automation Opportunity (HIGH IMPACT):**

**Conversational Data Collection (5 min vs 15 min):**
```
Eva: "¡Hola! Soy Eva, la Asistente Virtual del Dr. Andrés Durán.
      ¿En qué procedimiento estás interesada/o?"
Patient: "Rinoplastia"
Eva: "Perfecto. Para brindarte atención personalizada, ¿me compartes tu nombre?"
Patient: "María González"
Eva: "Mucho gusto, María. ¿Cuál es tu número de teléfono (con indicativo)?"
Patient: "+57 300 123 4567"
Eva: "Gracias. ¿Y tu correo electrónico?"
Patient: "maria@example.com"
Eva: "¿Desde qué país nos escribes?"
Patient: "Colombia, Barranquilla"
Eva: [Updates contact via Bird Action] ✓
     "Excelente. Un asesor especializado te contactará para continuar
      con tu valoración. ¿Tienes alguna pregunta mientras tanto?"
```

**Intelligent Photo Guidance (CRITICAL for Dr. Durán):**

Current Eva agent has `disableImageSupport: true` - this MUST be changed to enable photo analysis.

**Proposed Flow:**
```
Eva: "Para la rinoplastia, el Dr. Durán necesita 3 fotos:
      1️⃣ Frontal (cara completa, sin maquillaje)
      2️⃣ Perfil derecho
      3️⃣ Perfil izquierdo

      ¿Las tienes listas o prefieres tomarlas ahora?"

Patient: [Sends photo]

Eva: [Calls process_media Action with mediaType=image]
     API analyzes: lighting, angle, visibility, quality

IF photo_quality = GOOD (85%+ score):
  Eva: "✓ Foto frontal recibida. Ahora envía el perfil derecho."

IF photo_quality = POOR (dark/blurry/wrong angle):
  Eva: "⚠️ Esta foto está un poco oscura. Para mejores resultados:
        - Párate frente a una ventana (luz natural)
        - Cámara a la altura de tu rostro
        - Sin filtros ni maquillaje
        ¿Puedes intentar de nuevo?"
```

**Real-Time Photo Quality Check Benefits:**
- 50% unusable → 85% usable (industry target with guidance)
- Staff time saved: ~30 min/day (no re-requests)
- Faster valoración scheduling (photos ready on first submission)
- Better patient experience (clear expectations upfront)

**Data Storage:**
- **Short-term:** Bird Conversations API (contact attributes)
- **Long-term:** [TBD - CRM integration in Phase 2]
  - Options: HubSpot, Pipedrive, Google Sheets, Supabase DB
  - Must comply with Colombian patient data privacy (Ley 1581/2012)

**Success Metrics:**
- Data collection time: 15 min → 5 min
- Photo quality (ready for review): 50% → 85%
- Staff re-requests per patient: 1.5 → 0.2
- Data completeness: [TBD baseline] → 95%

---

### 3. Valoración Types (Decision Point)

| Type | Format | Duration | Location | Requirements | Cost | Recommended For |
|------|--------|----------|----------|--------------|------|-----------------|
| **Pre-consulta** | WhatsApp + Photos | 15 min | Remote | 3-5 photos per area, medical questionnaire | **[TBD]** | Simple procedures (facial), remote patients (outside Colombia), exploring options (low commitment) |
| **Virtual** | Video call (WhatsApp/Zoom) | 30 min | Remote | Photos + medical history, stable internet | **[TBD]** | Complex facial cases, out-of-city patients (Colombia), international patients (planning travel) |
| **Presencial** | In-office exam | 60 min | **Barranquilla:** Quantum Tower (Calle 85 #50-159, Consultorio 06)<br>**Bogotá:** World Medical Center (Calle 98 #9A-46, Oficina 702C, Torre 2) | Physical exam, measurements, medical photography | **[TBD]** | Body procedures (lipo, BBL, abdominoplasty), breast surgeries, complex cases, local patients |

**Valoración Recommendation Logic (AI Decision Tree):**

```python
def recommend_valoracion_type(patient_data):
    procedure = patient_data['procedure']
    location = patient_data['country']
    city = patient_data.get('city', '')

    # BODY PROCEDURES → Always recommend Presencial
    if procedure in ['lipo_high_tech_3', 'bbl', 'abdominoplasty',
                     'breast_aug', 'breast_reduction', 'tummy_tuck']:
        if location == 'Colombia' and city in ['Barranquilla', 'Bogotá']:
            return 'presencial', 'LOCAL'
        else:
            return 'presencial', 'TRAVEL_REQUIRED'

    # FACIAL PROCEDURES → Depends on location
    if procedure in ['rhinoplasty', 'blepharoplasty', 'otoplasty',
                     'mentoplasty', 'bichectomy']:
        if location == 'Colombia' and city in ['Barranquilla', 'Bogotá']:
            return 'presencial', 'LOCAL'  # Best option if local
        elif location == 'Colombia':  # Other cities
            return 'virtual', 'OUT_OF_CITY'
        else:  # International
            return 'virtual', 'INTERNATIONAL'

    # MINIMALLY INVASIVE → Can start with Pre-consulta
    if procedure in ['lipo_papada', 'bichectomy', 'ginecomastia']:
        if patient_data.get('ready_to_commit') == True:
            return 'virtual', 'FAST_TRACK'
        else:
            return 'pre_consulta', 'EXPLORING'

    # DEFAULT: Offer all options
    return 'all_options', 'LET_PATIENT_CHOOSE'
```

**AI Response Examples:**

**Example 1: Body Procedure + Local Patient**
```
Patient: "Quiero una liposucción en el abdomen y cintura."
Eva: "La Lipo High Tech 3 del Dr. Durán es ideal para eso. Combina 3 tecnologías
      (Vaser, Microaire, Retraction) para resultados naturales y elegantes.

      Para procedimientos corporales, recomiendo una consulta presencial donde
      el Dr. Durán puede evaluar tu piel, tomar medidas y crear un plan quirúrgico
      personalizado.

      ¿Prefieres Barranquilla o Bogotá?"
```

**Example 2: Facial Procedure + International Patient**
```
Patient: "Vivo en Miami. ¿Puedo hacer la rinoplastia con el Dr. Durán?"
Eva: "¡Claro! Muchos pacientes internacionales eligen al Dr. Durán para rinoplastia.

      Te recomiendo empezar con una consulta virtual (videollamada) donde el Dr.
      evaluará tus fotos y necesidades. Si decides continuar, agendaríamos la
      cirugía presencial en Barranquilla (incluye valoración final in-person
      1 día antes).

      ¿Te gustaría agendar la valoración virtual?"
```

**Example 3: Exploring Options (Not Ready to Commit)**
```
Patient: "Estoy pensando en hacerme algo en la nariz pero no estoy segura."
Eva: "Entiendo, es una decisión importante. Ofrecemos una pre-consulta por
      fotos donde el Dr. Durán analiza tu caso y te da recomendaciones iniciales
      sin compromiso.

      Es perfecta para explorar opciones antes de decidir. ¿Te interesa?"
```

**Costs (TO BE PROVIDED BY DR. DURÁN):**
- Pre-consulta: **[TBD - likely $30-50 USD or $120K-200K COP]**
- Virtual: **[TBD - likely $50-80 USD or $200K-320K COP]**
- Presencial: **[TBD - likely $80-120 USD or $320K-480K COP]**

**Important:** These costs apply TOWARD final procedure cost if patient proceeds with surgery.

**Handover Trigger:**
```
IF patient asks "¿Cuánto cuesta la valoración?"
  THEN AI transfers to human coordinator
  MESSAGE: "Un asesor te dará el costo exacto y opciones de pago.
            Te transferiré ahora."
```

**YouTube Reference (For Patients Questioning Valoración Cost):**
If patient hesitates about valoración cost, Eva shares:
"Te comparto este video que explica la importancia de la valoración:
https://youtu.be/0KuR-C_jUeQ?si=tktRFU6EPeR6i7vq"

---

### 4. Appointment Scheduling + Payment

**Current System: [REQUIRES INVESTIGATION - Interview Dr. Durán Team]**

**Key Questions to Answer:**
1. What calendar system is used? (Google Calendar, Calendly, proprietary, manual?)
2. How does staff check availability? (Real-time or end-of-day batch?)
3. Average time to offer available slots? (Same day, 24hr, 48hr?)
4. Payment timing: Before booking or at confirmation?
5. Payment methods accepted? (Bank transfer, credit card, cash, financing?)
6. No-show rate? (% of appointments missed)
7. Cancellation policy? (24hr notice, fee, rescheduling allowed?)

**Hypothetical Current Process (TO BE VALIDATED):**
```
1. Patient says "Quiero agendar valoración presencial"
2. Coordinator checks Dr. Durán's calendar (Google Calendar assumed)
3. Coordinator offers 3-5 available slots via WhatsApp:
   "Tengo disponibilidad:
   - Martes 19 de diciembre, 3:00 PM
   - Miércoles 20 de diciembre, 10:00 AM
   - Jueves 21 de diciembre, 4:00 PM
   ¿Cuál prefieres?"
4. Patient selects slot
5. Coordinator sends payment instructions (bank transfer details or payment link)
6. Patient pays, sends confirmation screenshot
7. Coordinator verifies payment → Confirms appointment
8. Adds to calendar with patient details
9. Sends WhatsApp confirmation: "Confirmado: [Date], [Time], [Location]"
```

**Average Time:** ~20-30 minutes per appointment (manual checks, payment verification)

**Availability Patterns (TO BE CONFIRMED):**
- **Days:** Tuesday-Thursday (Barranquilla), Friday (Bogotá) - EXAMPLE ONLY
- **Hours:** 9am-5pm Colombia time (COT, UTC-5)
- **Lead Time:** Minimum 48hr notice preferred (allows pre-consultation review)
- **Buffer:** 30-60 min between appointments (valoración duration + notes)
- **Blocked Times:** Surgeries (all-day blocks), lunch (1-2pm), holidays

**Payment Flow (TO BE CONFIRMED):**
- **Method 1:** Bank transfer (most common in Colombia)
  - Bank: Bancolombia
  - Account: [TBD]
  - Confirmation: Patient sends screenshot via WhatsApp
- **Method 2:** Payment link (Wompi, PayU, Stripe?)
- **Method 3:** Credit card at office (presencial only, day-of)

**AI Automation Phases:**

**Phase 1 (MVP - Launch Week 1):**
```
Eva: "Para agendar tu valoración presencial, te conectaré con un asesor
      que verificará disponibilidad y te guiará con el pago."

[TRANSFER to human coordinator]

Coordinator (Manual):
  - Checks Google Calendar
  - Offers 3-5 slots
  - Sends payment link
  - Confirms after payment
```

**Phase 2 (Weeks 2-4 - Calendar API Integration):**
```
Eva: [Calls check_availability Action]
     API queries Google Calendar API
     Returns: available_slots = ["2025-12-19T15:00", "2025-12-20T10:00", ...]

Eva: "Tengo disponibilidad para valoración presencial en Barranquilla:
      1️⃣ Martes 19/12, 3:00 PM
      2️⃣ Miércoles 20/12, 10:00 AM
      3️⃣ Jueves 21/12, 4:00 PM

      ¿Cuál prefieres? (Responde con el número)"

Patient: "2"

Eva: "Perfecto. Reservé miércoles 20/12 a las 10:00 AM (provisional).
      Para confirmar, necesitas pagar la valoración.
      Te transferiré con un asesor para el pago."

[TRANSFER to coordinator for payment]
```

**Phase 3 (Months 2-3 - Full Automation):**
```
Eva: [Same as Phase 2, patient selects slot]

Eva: "Para confirmar tu cita, el costo de la valoración presencial es $XXX.
      ¿Prefieres pagar con tarjeta o transferencia bancaria?"

Patient: "Tarjeta"

Eva: [Generates Stripe/Wompi payment link via Action]
     "Aquí está tu enlace de pago: [link]
      Una vez procesado, recibirás confirmación automática por WhatsApp."

[Payment webhook confirms] → Calendar event created → WhatsApp confirmation sent
```

**Reminder Automation (ALL PHASES):**
```
48hr Before:
  "Hola [Name], recordatorio de tu valoración presencial con el Dr. Durán:
   📅 [Date] a las [Time]
   📍 [Location + address]

   Si necesitas cambiar la cita, responde a este mensaje."

24hr Before:
  "Mañana es tu valoración a las [Time]. Te esperamos en [Location].

   Recuerda:
   ✓ Llegar 10 min antes
   ✓ Traer cédula/pasaporte
   ✓ Parqueadero disponible ($6.000/hora en Quantum Tower)"

Day-of (2hr before):
  "Tu valoración es en 2 horas ([Time]). ¡Nos vemos pronto!
   Cualquier inconveniente, llama al [phone]."
```

**Cancellation/Rescheduling Policy (TO BE CONFIRMED):**
- **Notice Required:** 24hr minimum
- **Fee:** [None / Partial refund / Credit toward rescheduling?]
- **Process:** Patient WhatsApp → Coordinator manually updates calendar
- **Phase 2+:** "Cancelar o cambiar cita" button → Self-service rescheduling

**Success Metrics:**
- Time to book appointment: 30 min → 5 min (Phase 2+)
- No-show rate: [TBD baseline] → -50% (better reminders)
- Payment friction: [TBD] → Reduced (automated links)
- Coordinator time per booking: 30 min → 5 min (Phase 3)

---

### 5. Valoración (Dr. Durán Evaluation)

**CRITICAL: 100% HUMAN TOUCHPOINT - NO AI REPLACEMENT**

This stage is the medical core of the practice and cannot be automated. Eva's role is to PREPARE the patient optimally so Dr. Durán has maximum efficiency.

**Pre-Valoración Preparation (Eva's Role):**
```
24hr Before Valoración:
  Eva sends WhatsApp checklist:
  "Hola [Name], mañana es tu valoración. Asegúrate de:

   ✅ Traer cédula/pasaporte
   ✅ Lista de medicamentos actuales (si tomas alguno)
   ✅ Alergias conocidas
   ✅ Preguntas que quieras hacerle al Dr. Durán

   Si no has enviado fotos, puedes hacerlo ahora para que el Dr. las
   revise antes de tu cita."
```

**Valoración Workflow (In-Person or Virtual):**

**Presencial (Barranquilla or Bogotá):**
```
1. Patient arrival (10-15 min early)
   - Reception: Verify identity, confirm contact details
   - Waiting room: 20-30 min average wait

2. Medical assistant intake (5-10 min)
   - Medical history review (allergies, medications, prior surgeries)
   - Vital signs (if needed for complex cases)
   - Before photos (standardized angles, medical photography setup)

3. Dr. Durán evaluation (20-40 min)
   - Physical exam (measurements, skin quality, anatomy assessment)
   - Patient goals discussion ("¿Qué te gustaría cambiar?")
   - Realistic expectations setting
   - Surgical technique explanation (Lipo High Tech 3 breakdown, incision locations)
   - Before/after examples (similar cases, with consent)
   - Risk discussion (complications, recovery timeline)

4. Quote generation (5-10 min)
   - Itemized cost breakdown:
     * Surgeon fee
     * Anesthesia fee
     * Facility fee (operating room)
     * Supplies (implants, garments, medications)
     * Follow-up appointments (included or extra?)
   - Financing options (if available)

5. Patient questions + next steps
   - "¿Tienes alguna pregunta?"
   - Decision timeline: "Tómate el tiempo que necesites. No hay presión."
   - Coordinator schedules follow-up (if patient ready to book surgery)
```

**Virtual (WhatsApp Video or Zoom):**
```
1. Patient joins call (on time, quiet location)
2. Dr. Durán reviews pre-submitted photos
3. Same discussion as in-person (goals, technique, risks, quote)
4. Follow-up: "If you decide to proceed, we'll schedule a final presencial
               valoración 1-2 days before surgery for physical exam."
```

**Pre-Consulta (Photo-Based):**
```
1. Patient submits 3-5 photos per area (via WhatsApp, guided by Eva)
2. Dr. Durán reviews asynchronously (15 min)
3. Coordinator calls or WhatsApp messages patient with:
   - Initial assessment: "You're a good candidate for [procedure]"
   - Estimated quote range: "$X - $Y depending on final in-person evaluation"
   - Recommendation: "Next step is virtual or presencial valoración"
```

**Data Captured During Valoración:**
- Medical history (allergies, medications, prior surgeries, smoking status)
- Physical measurements (areas to treat, skin elasticity, BMI)
- Before photos (standardized angles, medical-grade)
- Surgical plan (technique, anesthesia type, duration)
- Quote (itemized costs)
- Patient consent (to treatment plan, not surgery yet)

**Storage:**
- **Medical Records:** [TBD - EMR system? Paper charts? Google Drive?]
- **Photos:** Encrypted storage, patient consent required
- **Compliance:** Colombian patient privacy law (Ley 1581/2012, Habeas Data)

**Post-Valoración Eva Role:**
```
Same Day (2hr after valoración):
  Eva: "Hola [Name], espero que tu valoración con el Dr. Durán haya sido útil.

        ¿Tienes alguna pregunta adicional? Estoy aquí para ayudarte."

IF patient replies with questions:
  - General questions → Eva answers from knowledge base
  - Quote clarification → TRANSFER to coordinator
  - Medical questions → TRANSFER to medical staff

IF no reply after 3 days:
  Eva: "Hola [Name], ¿has tenido chance de pensar en tu consulta con el Dr. Durán?
        Si necesitas más información, con gusto te ayudo."
```

**Success Metrics:**
- Valoración duration: [TBD baseline] → Optimized (better prep = faster consult)
- Patient questions answered: [TBD] → Higher (Eva educates pre-valoración)
- Quote acceptance rate: [TBD baseline] → +15-20% (better expectations set)

---

### 6. Decision Period (Patient Reflection)

**Current Process:**
- Patient receives quote during/after valoración
- Coordinator follows up via WhatsApp every 3-7 days (not pushy)
- Common reasons for delay:
  - **Budget:** Saving money, exploring financing options
  - **Timing:** Waiting for vacation time, childcare arrangements
  - **Fear:** Anxiety about surgery, anesthesia, recovery
  - **Second Opinion:** Comparing with other surgeons
- Duration: 3 days (fast) to 30+ days (slow), average ~14 days

**Pain Points:**
- Patients go silent (ghosting) → Coordinator unsure if still interested
- No systematic nurturing (depends on coordinator remembering to follow up)
- Competitor engagement during delay (patients contact 2-3 surgeons)

**AI Automation Opportunity (MEDIUM-HIGH IMPACT):**

**Nurture Sequence (Non-Pushy, Educational):**
```
Day 3 After Valoración:
  Eva: "Hola [Name], espero que estés bien. ¿Tienes alguna pregunta adicional
        sobre tu consulta con el Dr. Durán?"

  IF patient replies → Answer questions or transfer to human
  IF no reply → Continue sequence

Day 7:
  Eva: "Hola [Name], te comparto un video sobre la recuperación de [procedure]:
        [YouTube link]

        Si quieres hablar con alguien que ya se hizo este procedimiento
        (testimonio), dímelo y te conecto."

Day 14:
  Eva: "¿Sigues considerando tu [procedure]? Si necesitas opciones de
        financiamiento o tienes dudas, con gusto te ayudo."

Day 21:
  [TRANSFER to human coordinator for personalized outreach]

Day 30:
  Coordinator: Personal call (not WhatsApp) to check if still interested
```

**Re-Engagement Triggers:**
```
IF patient viewed Dr. Durán Instagram/website (tracking pixel)
  THEN Eva sends: "Vi que visitaste nuestro Instagram. ¿Hay algo específico
                   que te interese ver sobre [procedure]?"

IF patient clicks before/after gallery
  THEN Eva: "Esos son resultados reales de pacientes del Dr. Durán.
             ¿Te gustaría ver más ejemplos similares a tu caso?"
```

**Objection Handling (Human-Critical):**

Common objections Eva should TRANSFER to human:
- "Es muy caro" → Coordinator discusses financing (Addi, installment plans)
- "Tengo miedo a la anestesia" → Dr. Durán or medical staff reassures
- "No estoy segura del resultado" → Coordinator shows more before/afters, testimonials
- "Mi familia no está de acuerdo" → Human empathy, not AI

**Success Metrics:**
- Quote-to-surgery conversion: [TBD baseline] → +20-30%
- Average decision time: 14 days → 10 days (faster with better info)
- Ghost rate: [TBD] → -40% (systematic nurturing)
- Patient satisfaction: [TBD] → Higher (feels supported, not pressured)

---

### 7. Pre-Procedure (Medical Clearance)

**Current Process (TO BE VALIDATED):**
```
1. Patient decides to proceed → Pays deposit (50%? Full amount?)
2. Surgery date selected (based on Dr. Durán's OR availability)
3. Pre-op requirements list sent via WhatsApp:

   📋 Labs Required (within 30 days of surgery):
   - CBC (complete blood count)
   - Coagulation panel (PT/INR, PTT)
   - Blood type
   - [If >40 years: EKG, chest X-ray]
   - [If medical history: cardiology clearance, endocrinology consult]

   📋 Pre-Op Instructions:
   - Stop smoking 4 weeks before (if smoker)
   - Stop aspirin/NSAIDs 10 days before
   - Stop supplements 7 days before
   - Arrange post-op caregiver (must stay 24hr)
   - Purchase compression garment (for body procedures)
   - Fasting from midnight before surgery

4. Patient completes labs → Sends results via WhatsApp
5. Medical staff reviews → Approves for surgery OR requests additional tests
6. Final payment reminder (7 days before)
7. Pre-op call (2 days before) to confirm arrival time, instructions
```

**Pain Points:**
- Patients forget to do labs → Last-minute scramble
- Incomplete results → Surgery delayed
- Caregiver arrangements fall through → No-show risk
- Payment delays → Surgery rescheduled

**AI Automation Opportunity (MEDIUM IMPACT):**

**Automated Checklist Tracker:**
```
Day 1 After Surgery Booked:
  Eva: "¡Felicidades [Name]! Tu cirugía está agendada para [Date].

        Para garantizar tu seguridad, necesitas completar estos pasos:

        ✅ Labs (antes del [Date - 7 days])
        ⬜ Clearances médicas (si aplica)
        ⬜ Pago final (antes del [Date - 3 days])
        ⬜ Organizar acompañante post-op

        Te iré recordando cada paso. ¿Tienes preguntas sobre los labs?"

Week -4 (If smoker):
  Eva: "Recuerda dejar de fumar desde hoy para reducir riesgos de
        complicaciones y acelerar tu recuperación. ¿Necesitas apoyo?"

Week -2:
  Eva: "⏰ Recordatorio: Tienes hasta [Date] para hacer tus labs.

        Aquí está la orden médica: [PDF link]

        Cuando tengas los resultados, envíalos por aquí (foto o PDF)."

Week -1 (If labs not received):
  Eva: "⚠️ Aún no hemos recibido tus labs. Tu cirugía es en 7 días.
        Por favor envíalos hoy para que el equipo médico los revise."

[IF still not received after 24hr → ALERT coordinator + Dr. Durán]

Day -3:
  Eva: "Últimas instrucciones pre-op:

        ✅ Confirma tu acompañante: [Name], [Phone]
        ✅ Ayuno desde medianoche del [Date - 1]
        ✅ Ducha con jabón antibacterial la noche antes
        ✅ No maquillaje, esmalte de uñas, joyas

        Llegada: [Time] a [Clinic address]

        ¿Todo listo?"
```

**Lab Results Review (Human-Critical):**
```
Patient: [Sends lab PDF]

Eva: "Recibí tus labs. El equipo médico los revisará en las próximas
      2-4 horas y te confirmaré si todo está bien."

[Medical staff reviews]

IF results OK:
  Eva: "✅ Tus labs están aprobados. Todo listo para tu cirugía el [Date]."

IF results abnormal:
  [ALERT Dr. Durán → Human calls patient to discuss]
  Eva: "El Dr. Durán necesita hablar contigo sobre tus labs.
        Te llamaremos hoy."
```

**Success Metrics:**
- Pre-op checklist completion: [TBD] → 100% (no missed steps)
- Labs submitted on time: [TBD] → 95%+ (proactive reminders)
- Surgery delays (patient factors): [TBD] → -60%
- Patient anxiety: [TBD] → Lower (clear instructions, constant support)

---

### 8. Procedure Day (Surgery)

**CRITICAL: 0% AI INVOLVEMENT - MEDICAL STAFF ONLY**

**Current Process (EXAMPLE - TO BE VALIDATED):**
```
1. Patient arrival (2hr before surgery)
   - Reception: ID verification, final consent signature
   - Change into surgical gown
   - IV placement, vital signs

2. Pre-op consultation (Dr. Durán + patient)
   - Final markings (surgical lines drawn on body)
   - Before photos (medical photography)
   - Patient questions, anxiety management
   - Anesthesiologist introduction

3. Surgery (2-5hr depending on procedure)

4. Recovery room (1-2hr)
   - Vital signs monitoring
   - Pain management
   - Nausea control

5. Discharge (with caregiver present)
   - Post-op instructions (written + verbal)
   - Medications dispensed (antibiotics, painkillers, anti-nausea)
   - Compression garment fitted (body procedures)
   - Drains management instructions (if applicable)
   - First follow-up appointment scheduled (Day 7)
   - 24hr emergency number provided

6. Caregiver takes patient home
```

**Eva's Role (ONLY Post-Discharge, Same Day):**
```
4hr After Discharge:
  Eva: "Hola [Name], espero que estés descansando bien. ¿Cómo te sientes?

        Recuerda:
        ✅ Tomar medicamentos según indicación
        ✅ Mantener cabeza elevada (almohadas)
        ✅ No esfuerzos físicos
        ✅ Líquidos abundantes

        Si tienes dolor fuerte, sangrado excesivo, o fiebre, llama al
        [emergency number] INMEDIATAMENTE."

IF patient reports concerning symptoms:
  [IMMEDIATE ALERT to Dr. Durán + medical staff]
  Eva: "Voy a alertar al equipo médico ahora. Te llamarán en los próximos
        15 minutos. Si es urgente, ve a Urgencias."
```

---

### 9. Post-Procedure Follow-Up (Recovery Monitoring)

**Current Process (TO BE VALIDATED):**
```
Day 1 Post-Op:
  - Coordinator calls patient: "¿Cómo amaneció? ¿Dolor, sangrado, fiebre?"
  - Checks medication compliance, caregiver support

Day 7 Post-Op (First Follow-Up):
  - In-person appointment (Barranquilla or Bogotá clinic)
  - Dr. Durán examines incisions, removes stitches (if non-absorbable)
  - Progress photos
  - Clears for light activity (walking, showering)

Day 30 Post-Op (Second Follow-Up):
  - In-person or virtual (if patient out of city)
  - Evaluates healing, addresses concerns
  - Progress photos
  - Clears for moderate activity (exercise, work)

Day 90 Post-Op (Final Follow-Up):
  - Final result assessment
  - Before/after photo comparison
  - Patient satisfaction survey
  - Permission to use photos for marketing (with consent)

6-12 Months:
  - Annual check-in (especially for breast implants)
```

**Pain Points:**
- Patients forget follow-up appointments → Reschedule hassle
- Out-of-city patients can't attend in-person → Phone calls instead
- Inconsistent photo documentation (lighting, angles vary)
- No systematic satisfaction tracking

**AI Automation Opportunity (HIGH IMPACT):**

**Automated Recovery Coaching:**
```
Day 1 AM (9am):
  Eva: "Buenos días [Name], ¿cómo pasaste la noche? En una escala de 1-10:
        - ¿Dolor? (1=ninguno, 10=insoportable)
        - ¿Náusea?
        - ¿Sangrado en vendajes?"

Patient: "Dolor 6, no náusea, un poco de sangrado"

Eva: "Dolor 6 es normal el primer día. Asegúrate de tomar tus medicamentos
      cada [X] horas.

      Sangrado leve es esperado. Si empapa el vendaje, llama al [emergency].

      ¿Estás tomando líquidos y comiendo algo ligero?"

IF pain >8 OR heavy bleeding:
  [ALERT medical staff IMMEDIATELY]

Day 3:
  Eva: "Día 3 post-op. ¿Cómo te sientes hoy? Deberías notar menos dolor
        y más movilidad.

        ✅ Ya puedes ducharte (sin mojar incisiones directamente)
        ✅ Caminar 5-10 min cada 2 horas (previene coágulos)

        ¿Tienes preguntas?"

Day 7 (Follow-Up Reminder):
  Eva: "Tu cita de control con el Dr. Durán es mañana a las [Time].

        Por favor trae:
        ✅ Faja/prenda de compresión (si la usas)
        ✅ Lista de dudas o síntomas

        ¿Confirmado que asistirás?"

Day 30 (Photo Request):
  Eva: "¡Ya llevas 1 mes post-op! 🎉 ¿Cómo te sientes con los resultados?

        Para tu cita de control, por favor envía fotos actualizadas
        (mismos ángulos que las fotos pre-op):
        1️⃣ Frontal
        2️⃣ Perfil derecho
        3️⃣ Perfil izquierdo

        [If body procedure: Add posterior view]"

Patient: [Sends photos]

Eva: [Calls process_media Action]
     "Fotos recibidas. El Dr. Durán las revisará en tu cita del [Date]."

Day 90 (Satisfaction Survey):
  Eva: "Llegaste a los 3 meses post-op. ¡Felicidades! 🎊

        ¿Podrías responder 3 preguntas rápidas?

        1️⃣ ¿Qué tan satisfecha estás con los resultados? (1-10)
        2️⃣ ¿Recomendarías al Dr. Durán a familiares/amigos? (Sí/No)
        3️⃣ ¿Hay algo que mejorarías de tu experiencia?"

Patient: "10, Sí, Todo fue perfecto"

Eva: "¡Gracias [Name]! Nos encanta saber que estás feliz con tu resultado.

      Si nos permites usar tus fotos de antes/después (sin mostrar tu
      rostro si prefieres), ayudarías a otras personas que están
      considerando este procedimiento. ¿Estarías de acuerdo?"

IF yes → [Record consent, tag photos for marketing use]
```

**Complication Detection (CRITICAL):**
```
IF patient reports ANY of these keywords:
  - "fiebre", "calentura", "temperatura"
  - "pus", "mal olor", "secreción verde/amarilla"
  - "enrojecimiento que crece", "hinchazón excesiva"
  - "dolor que empeora" (not improving)
  - "dificultad para respirar", "pecho pesado"
  - "sangrado que no para"

THEN:
  [IMMEDIATE ALERT to Dr. Durán + medical staff]
  Eva: "⚠️ URGENTE: Tus síntomas requieren evaluación médica inmediata.

        El Dr. Durán o su equipo te llamarán en los próximos 15 minutos.

        Si la situación empeora, ve a Urgencias y di que eres paciente
        post-op del Dr. Andrés Durán. Su número directo: [emergency number]"
```

**Success Metrics:**
- Follow-up attendance: [TBD] → 95%+ (automated reminders)
- Complication detection time: [TBD] → <24hr (daily check-ins)
- Patient satisfaction: [TBD] → 90+ NPS (better support)
- Photo documentation completeness: [TBD] → 100% (guided requests)
- Before/after consent rate: [TBD] → 60-70% (trust-based ask)

---

### 10. Long-Term Relationship (Loyalty)

**Current Process (TO BE VALIDATED):**
- Ad-hoc follow-ups (no systematic schedule)
- Patients contact practice if they want another procedure
- Referrals happen organically (word of mouth)
- Instagram content: Dr. Durán posts before/afters, educational videos

**AI Automation Opportunity (LOW-MEDIUM IMPACT, BUT BUILDS LIFETIME VALUE):**

**Annual Check-In:**
```
12 Months Post-Op:
  Eva: "¡Hola [Name]! Ha pasado 1 año desde tu [procedure] con el Dr. Durán.
        ¿Cómo te sientes con los resultados?

        Si estás considerando algún otro procedimiento o tienes dudas,
        con gusto te ayudo."

IF patient interested in new procedure:
  [Start journey from Stage 1 - Information Gathering]
  DISCOUNT: "Como paciente recurrente, tienes 10% descuento en valoración."
```

**Referral Program:**
```
IF patient gave 9-10/10 satisfaction (Day 90 survey):
  Eva (Day 120): "Hola [Name], vimos que recomendarías al Dr. Durán.

                  Si conoces a alguien interesado en [procedures],
                  comparte este enlace: [referral link]

                  Por cada referido que se opere, recibes [incentive]:
                  - $XXX descuento en futuro procedimiento
                  - OR gift card
                  - OR free mini-treatment (Botox, filler session)"
```

**Educational Content Distribution:**
```
Every 2 Months:
  Eva: "Hola [Name], el Dr. Durán publicó un nuevo video sobre
        [trending topic in plastic surgery].

        [YouTube/Instagram link]

        ¿Te gustaría recibir este tipo de contenido regularmente?
        (Responde SÍ o NO)"

IF yes → Add to newsletter list
```

**Re-Engagement for Additional Procedures:**
```
IF patient had Procedure A (e.g., rhinoplasty)
AND high satisfaction
AND >6 months post-op
THEN suggest complementary procedures:

  Eva: "Hola [Name], muchos pacientes que se hicieron rinoplastia con
        el Dr. Durán también consideran [complementary procedure]:
        - Mentoplastia (armonía facial)
        - Blefaroplastia (rejuvenecimiento completo)

        Si te interesa, puedo agendarte una valoración con descuento."
```

**Success Metrics:**
- Repeat patient rate: [TBD] → +30%
- Referral conversion: [TBD] → 20-30% (referred leads close higher)
- Lifetime value per patient: [TBD] → +40% (multi-procedure patients)
- Annual retention: [TBD] → 70% (stay engaged via content)

---

## Workflow Optimizations (ROI Analysis)

### High-Impact Automations (Implement First)

| Optimization | Current State | AI Solution | Time Saved | Conversion Impact | Priority |
|--------------|---------------|-------------|------------|-------------------|----------|
| **1. Instant Response** | 2-4hr manual reply | <2 min AI response | ~3hr/day staff time | +30-40% lead conversion | **P0** |
| **2. Photo Quality Check** | 50% unusable photos | Real-time guidance → 85% usable | ~30 min/day (no re-requests) | Faster valoración scheduling | **P0** |
| **3. Structured Data Collection** | 15 min manual WhatsApp back-and-forth | 5 min conversational form | ~1-2 hr/day staff time | Better CRM data quality | **P0** |
| **4. Valoración Type Recommendation** | Patient confusion → multiple back-and-forth | Logic-based AI recommendation | ~20 min/patient decision time | Faster booking | **P1** |
| **5. Post-Op Daily Check-Ins** | Ad-hoc calls when staff remembers | Automated WhatsApp messages (Day 1, 3, 7, 30, 90) | ~45 min/day staff time | Earlier complication detection | **P1** |
| **6. Follow-Up Appointment Reminders** | Manual WhatsApp (often forgotten) | Automated 48hr, 24hr, 2hr reminders | ~20 min/day staff time | -50% no-show rate | **P1** |
| **7. Pre-Op Checklist Tracker** | PDF sent once, hope patient reads | Progressive checklist with reminders | ~30 min/day staff time | -60% surgery delays | **P2** |
| **8. Nurture Sequence (Decision Period)** | Coordinator manually follows up (inconsistent) | Automated Day 3, 7, 14, 21 educational messages | ~1 hr/day staff time | +20-30% quote-to-surgery conversion | **P2** |
| **9. Calendar API Integration** | Manual Google Calendar checks | Real-time availability query | ~25 min/booking | Instant booking (no human needed) | **P2** |
| **10. Payment Automation** | Manual bank transfer verification | Stripe/Wompi link → auto-confirmation | ~15 min/booking | Faster payment = faster booking | **P3** |

**Total Time Saved (Daily):** ~7-8 hours coordinator time → Reinvest in high-value tasks (complex cases, patient counseling)

**Revenue Impact:**
- **Leads → Valoración:** 30-40% increase (faster response)
- **Valoración → Surgery:** 20-30% increase (better nurturing)
- **Repeat Procedures:** 30% increase (long-term relationship)
- **Referrals:** 20-30% conversion (systematic referral program)

**Cost Savings:**
- Reduced staff overtime (handle 2x inquiries with same team)
- Lower no-show rate (wasted OR time)
- Earlier complication detection (reduce ER visits, legal risk)

---

## Human-Critical Touchpoints (AI Should NOT Replace)

**Medical Judgment:**
- Surgical technique selection (Dr. Durán's expertise)
- Risk assessment based on anatomy, medical history
- Complication management (post-op issues require human evaluation)

**Pricing & Negotiation:**
- Quote generation (nuanced, depends on case complexity)
- Financing discussions (requires empathy, flexibility)
- Discount approvals (coordinator discretion)

**Emotional Support:**
- Anxious patients pre-surgery (human reassurance critical)
- Post-op emotional swings (common in cosmetic surgery)
- Complaints or dissatisfaction (requires human de-escalation)

**Complex Medical Questions:**
- "Can I do 3 procedures at once?" → Dr. Durán decision
- "I have diabetes, am I eligible?" → Medical staff evaluation
- "What if I don't like the result?" → Revision policy discussion

**Legal & Ethical:**
- Informed consent process (must be human-led)
- Before/after photo usage consent (sensitive)
- Medical liability discussions (human accountability)

---

## Procedure-Specific Insights

### Top 5 Requested Procedures (ESTIMATED - TO BE VALIDATED)

| Procedure | % of Inquiries | Average Quote | Recovery Time | Valoración Type | Lead-to-Surgery % |
|-----------|----------------|---------------|---------------|-----------------|-------------------|
| **Lipo High Tech 3** | 35% | $4,000-8,000 USD | 7-10 days | Presencial | [TBD] |
| **Rinoplastia** | 25% | $3,500-6,000 USD | 10-14 days | Presencial (local) / Virtual (remote) | [TBD] |
| **Mamoplastia de aumento** | 20% | $4,500-6,500 USD | 7-14 days | Presencial | [TBD] |
| **Lipotransferencia glútea (BBL)** | 10% | $5,000-8,000 USD | 14-21 days | Presencial | [TBD] |
| **Blefaroplastia** | 5% | $2,500-4,000 USD | 7-10 days | Virtual (if simple) / Presencial | [TBD] |
| **Other** (ginecomastia, otoplastia, etc.) | 5% | Varies | Varies | Depends | [TBD] |

**Seasonal Demand Patterns (COLOMBIA-SPECIFIC):**

**High Demand (Prepare for Summer/Events):**
- **November-December:** Pre-Christmas/New Year transformations
- **February-March:** Post-holiday recovery time, pre-summer prep
- **June-July:** Mid-year vacation time (Colombia school break)

**Low Demand:**
- **August-September:** Back-to-school, budget constraints
- **December 20-January 5:** Holiday season (patients traveling)

**International Patient Patterns:**
- **USA/Europe:** Plan surgeries around vacation time (2-3 weeks recovery abroad)
- **Venezuela:** Year-round demand (no strong seasonality)

**Eva's Role in Procedure Education:**

When patient asks "¿Qué es Lipo High Tech 3?", Eva should provide this exact explanation (from agent config):

```
Eva: "La Lipo High Tech 3 es una técnica creada por el Dr. Andrés Durán que
      combina 3 tecnologías de alta precisión:

      1️⃣ VASER (ultrasonido): Emulsiona la grasa sin dañar tejidos
      2️⃣ MICROAIRE: Extrae la grasa con menor trauma y sangrado
      3️⃣ RETRACTION: Tensa la piel (45-60°C) para resultados más definidos

      Beneficios vs liposucción tradicional:
      ✅ Menos dolor y moretones
      ✅ Recuperación más rápida (7-10 días vs 14-21 días)
      ✅ Resultados más naturales y pulidos
      ✅ Puede incluir J Plasma (si el Dr. lo recomienda para tu caso)

      ¿Te gustaría saber si eres candidata/o?"
```

**Procedure-Specific Photo Requirements (AI Photo Guidance):**

**Body Procedures (Lipo, BBL, Abdominoplasty):**
```
Eva: "Para evaluar tu caso de [procedure], el Dr. Durán necesita estas fotos:

      1️⃣ Frontal (torso completo, ropa interior ajustada)
      2️⃣ Posterior (espalda y glúteos completos)
      3️⃣ Perfil derecho
      4️⃣ Perfil izquierdo
      5️⃣ Oblicua derecha (45°)
      6️⃣ Oblicua izquierda (45°)

      Importante:
      - Luz natural (frente a ventana)
      - Fondo neutro (pared blanca)
      - Sin filtros, no zoom digital
      - Alguien más toma las fotos (mejor ángulo que selfie)

      ¿Listo/a para enviarlas?"
```

**Facial Procedures (Rhinoplasty, Blepharoplasty):**
```
Eva: "Para rinoplastia, necesito:

      1️⃣ Frontal (cara relajada, sin sonrisa)
      2️⃣ Perfil derecho (completo desde frente hasta nuca)
      3️⃣ Perfil izquierdo
      4️⃣ Base nasal (desde abajo, nariz visible)
      5️⃣ Frontal sonriendo (para evaluar dinámica nasal)

      Sin maquillaje, cabello recogido, luz natural.

      ¿Las tienes listas?"
```

---

## Current Pain Points (Staff Interview Questions)

**TO BE GATHERED FROM DR. DURÁN TEAM INTERVIEW (Day 2, 90 min session)**

**Questions for Coordinator:**

1. **Volume & Workload:**
   - How many WhatsApp inquiries per day/week?
   - What % are new patients vs existing patients?
   - Average time spent per new inquiry (first contact)?
   - What % of inquiries convert to valoración?
   - What % of valoraciones convert to surgery?

2. **Repetitive Tasks:**
   - What questions do you answer repeatedly? (top 5)
   - How often do you re-request photos due to quality issues?
   - How much time do you spend scheduling/rescheduling appointments?
   - Do you use templates or copy-paste responses?

3. **Pain Points:**
   - What frustrates you most about current WhatsApp workflow?
   - When do patients ghost (after quote? after valoración?)?
   - What causes appointment delays (patient factors)?
   - What questions do patients ask that you can't answer (need Dr. Durán)?

4. **Systems & Tools:**
   - What calendar system do you use?
   - How do you track patient data (CRM, spreadsheet, memory)?
   - How do you handle payment verification (manual screenshot check)?
   - Do you use any automation currently (canned responses, chatbots)?

**Questions for Medical Assistant:**

1. **Medical History Collection:**
   - How do you collect medical history (verbal, form, WhatsApp questions)?
   - What % of patients forget to mention critical info (allergies, meds)?
   - How long does intake take per patient?

2. **Photo Handling:**
   - What % of patient photos are good quality on first submission?
   - Most common photo issues (lighting, angle, clothing)?
   - Do you give patients photo instructions? (verbal, written?)

3. **Pre-Op Coordination:**
   - What % of patients complete labs on time?
   - What causes surgery delays (patient factors)?
   - How do you track pre-op checklist completion?

**Questions for Reception:**

1. **First Impressions:**
   - How do patients find the practice (Instagram, Google, referral)?
   - What's the most common first question?
   - Do patients seem well-informed or confused when they arrive?

2. **No-Shows:**
   - What % of valoraciones result in no-shows?
   - Do you send reminders? (manual WhatsApp or automated?)
   - What reasons do patients give for canceling?

**Interview Output:** Document answers in separate file `/docs/api-bird/staff-interview-notes.md`

---

## Success Metrics for AI Implementation

| Metric | Current Baseline | 3-Month Target | 6-Month Target | Measurement Method |
|--------|------------------|----------------|----------------|--------------------|
| **Response Time (First Reply)** | 2-4 hours | <2 minutes | <1 minute | Bird Conversations API (message timestamps) |
| **After-Hours Engagement** | 0 (ignored) | 50% of after-hours inquiries answered | 80% answered | Count messages 6pm-9am |
| **Photo Quality (Ready for Review)** | 50% usable | 70% usable | 85% usable | Manual review sample (50 photos/month) |
| **Staff Time per Inquiry** | 15 min | 8 min | 5 min | Time tracking (coordinator logs) |
| **Data Collection Completeness** | [TBD] | 90% (name, phone, email, procedure) | 95% | CRM audit |
| **Lead-to-Valoración Conversion** | [TBD baseline] | +20% increase | +30-40% increase | Funnel analysis (Bird data → Calendar) |
| **Valoración-to-Surgery Conversion** | [TBD baseline] | +10% increase | +20-30% increase | Medical records |
| **No-Show Rate (Valoraciones)** | [TBD baseline] | -30% decrease | -50% decrease | Calendar records |
| **Pre-Op Checklist Completion** | [TBD] | 90% on time | 100% on time | Medical staff tracking |
| **Surgery Delays (Patient Factors)** | [TBD] | -40% decrease | -60% decrease | Surgery schedule logs |
| **Post-Op Follow-Up Attendance** | [TBD] | 85% | 95% | Appointment records |
| **Complication Detection Time** | [TBD] | Within 48hr | Within 24hr | Medical incident reports |
| **Patient Satisfaction (NPS)** | [TBD baseline] | 60+ NPS | 70+ NPS | Day 90 survey (automated) |
| **Before/After Photo Consent** | [TBD] | 40% | 60-70% | Marketing consent tracking |
| **Repeat Patient Rate** | [TBD] | +10% | +30% | Patient database |
| **Referral Conversion** | [TBD] | 15% | 25% | Referral link tracking |
| **Staff Overtime Hours** | [TBD] | -30% | -50% | Payroll records |

**Measurement Cadence:**
- **Weekly:** Response time, staff time per inquiry, no-show rate
- **Monthly:** Conversion rates, photo quality, satisfaction surveys
- **Quarterly:** Repeat patient rate, referral conversion, revenue impact

**Dashboard Location:** [TBD - Options: Looker, Google Data Studio, Tableau]

**Data Sources:**
- Bird Conversations API (response times, message volume)
- Google Calendar API (appointments, no-shows)
- CRM/Database (patient journey stages)
- Manual logs (staff time tracking, photo quality audits)
- Surveys (NPS, satisfaction)

---

## Decision Trees (AI Handover Scenarios)

### Scenario 1: Pricing Question

```
Patient: "¿Cuánto cuesta la rinoplastia?"
  ↓
Eva (Detects: pricing_question):
  "El costo de la rinoplastia depende de tu caso específico (complejidad,
   técnica, si incluye corrección funcional).

   Para darte un presupuesto personalizado, te conectaré con un asesor
   que conoce las opciones de pago y financiamiento.

   Primero, ¿puedo tomar tus datos? (Nombre, teléfono, correo)"
  ↓
Patient: Provides data
  ↓
Eva: [Calls update_contact Action] ✓
     "Gracias [Name]. Serás transferido con un agente de servicio al cliente
      para que pueda atender tu solicitud."
  ↓
[HANDOVER to Coordinator]
  ↓
Coordinator (Human):
  "Hola [Name], el costo de la rinoplastia con el Dr. Durán es desde
   $X hasta $Y dependiendo de:
   - Si es estética o funcional (tabique desviado)
   - Si se combina con mentoplastia (armonía facial)

   Ofrecemos financiamiento con [Addi/Banco] hasta 12 meses.

   ¿Te gustaría agendar una valoración para evaluar tu caso?"
```

### Scenario 2: Medical Advice Request

```
Patient: "¿Puedo hacer rinoplastia y aumento de senos al mismo tiempo?"
  ↓
Eva (Detects: medical_judgment_required):
  "Esa es una excelente pregunta que requiere evaluación médica.

   El Dr. Durán puede hacer cirugías combinadas en algunos casos, pero
   depende de:
   - Duración total de la cirugía (máximo seguro: 6-8hr)
   - Tu salud general
   - Recuperación simultánea

   En tu valoración, el Dr. Durán evaluará si es seguro y recomendable
   en tu caso específico.

   ¿Te gustaría agendar la valoración?"
  ↓
IF patient insists on answer now:
  [TRANSFER to Coordinator or Medical Staff]
  "Para responder eso con precisión, te conectaré con el equipo médico."
```

### Scenario 3: Urgent Medical Concern (Post-Op)

```
Patient: "Tengo mucho dolor y la cicatriz está roja y caliente"
  ↓
Eva (Detects: urgent_keywords = ["dolor", "roja", "caliente"]):
  "⚠️ URGENTE: Tus síntomas requieren atención médica inmediata.

   Voy a alertar al Dr. Durán y su equipo AHORA.

   Mientras tanto:
   - NO tomes más medicamentos sin autorización
   - SI tienes fiebre >38°C o sangrado activo, ve a Urgencias
   - Menciona que eres paciente post-op del Dr. Andrés Durán

   El equipo médico te llamará en los próximos 15 minutos."
  ↓
[IMMEDIATE ALERT: Dr. Durán + Medical Staff]
  - SMS to Dr. Durán: "URGENTE: [Patient Name] reporta dolor + roja + caliente.
                       Posible infección. Llamar ASAP."
  - WhatsApp to Medical Assistant: "[Patient Name] - [Phone] - [Symptoms]"
  ↓
Medical Staff (Human):
  - Calls patient within 15 min
  - Evaluates over phone or schedules emergency appointment
  - May prescribe antibiotics or direct to ER
```

### Scenario 4: Frustration / Complaint

```
Patient: "Llevo 3 días escribiendo y nadie me responde. Esto es un asco."
  ↓
Eva (Detects: negative_sentiment + complaint):
  "Lamento mucho que hayas tenido esa experiencia, [Name]. No es el
   estándar que queremos.

   Voy a transferirte INMEDIATAMENTE con un supervisor que resolverá
   tu caso con prioridad.

   Gracias por tu paciencia."
  ↓
[HANDOVER to Supervisor/Manager]
  - Flag conversation as "Escalated - Complaint"
  - Notify manager via Slack/WhatsApp
  ↓
Manager (Human):
  "Hola [Name], soy [Manager Name], supervisora del equipo.
   Lamento profundamente el retraso.

   [Personalized apology + solution]

   ¿Cómo puedo ayudarte hoy?"
```

### Scenario 5: After-Hours Inquiry (No Staff Available)

```
Patient (sends message at 11pm): "Hola, quiero información sobre liposucción"
  ↓
Eva (Immediate response, <2 min):
  "¡Hola! Soy Eva, la Asistente Virtual del Dr. Andrés Durán.
   Aunque es fuera del horario de oficina, con gusto te ayudo.

   ¿Qué te gustaría saber sobre la liposucción?"
  ↓
Patient: "¿Cuánto cuesta?"
  ↓
Eva: "El costo depende de las áreas a tratar y tu caso específico.

      Mañana a primera hora (9am), un asesor te contactará con un
      presupuesto personalizado.

      Mientras tanto, ¿puedo tomar tus datos para que te contactemos?"
  ↓
Patient: Provides data
  ↓
Eva: [Saves data] ✓
     "Gracias [Name]. Te contactaremos mañana a las 9am.

      Si tienes más preguntas ahora, con gusto te ayudo (horarios,
      ubicación, procedimientos, etc.)."
  ↓
[Next Day 9am]
  - Coordinator sees flagged conversation in Bird Inbox
  - Calls patient: "Hola [Name], te esperábamos. Hablemos del presupuesto..."
```

---

## Implementation Phases (Workstream B Timeline)

**Phase 0: Research & Planning (Day 1-2)**
- ✅ Document patient journey (this file)
- ⬜ Interview staff (Day 2, 90 min)
- ⬜ Validate valoración types, costs, scheduling process
- ⬜ Define success metrics baselines

**Phase 1: MVP Launch (Day 3-4)**
- ⬜ Configure Eva agent with enhanced instructions
- ⬜ Enable photo processing (`disableImageSupport: false`)
- ⬜ Implement instant response (24/7)
- ⬜ Structured data collection + Bird Action (update_contact)
- ⬜ Handover triggers (pricing, medical questions, urgency)
- ⬜ Test with 10 real patient conversations

**Phase 2: Enhanced Automation (Week 2-3)**
- ⬜ Photo quality guidance (real-time feedback loop)
- ⬜ Valoración type recommendation logic
- ⬜ Appointment reminders (48hr, 24hr, 2hr)
- ⬜ Post-op daily check-ins (Day 1, 3, 7, 30, 90)
- ⬜ Calendar API integration (read-only, show availability)

**Phase 3: Full Automation (Month 2-3)**
- ⬜ Calendar booking (write access, create appointments)
- ⬜ Payment link generation (Stripe/Wompi)
- ⬜ Pre-op checklist tracker (labs, clearances)
- ⬜ Nurture sequence (Decision Period Day 3, 7, 14, 21)
- ⬜ Referral program automation

**Phase 4: Optimization (Month 4-6)**
- ⬜ A/B testing (message variations, timing)
- ⬜ Sentiment analysis (detect frustration earlier)
- ⬜ Predictive analytics (who's likely to convert?)
- ⬜ CRM integration (HubSpot, Pipedrive, or custom)

---

## Technical Implementation Notes

**Bird AI Employee Configuration Changes:**

**Current Issues to Fix:**
1. `disableImageSupport: true` → Must change to `false` (enable photo analysis)
2. `disableWaitMessages: false` → Should be `true` (no "typing..." in WhatsApp, feels robotic)
3. `maxOutputTokens: 2000` → Reduce to 500-800 (shorter, more conversational responses)
4. `llmModel: "deepseek-chat"` → Evaluate if sufficient or upgrade to Claude Sonnet 3.5 (better medical nuance)

**New Actions to Add:**

```json
{
  "id": "process_media_surgery",
  "type": "action",
  "name": "process_media_surgery",
  "description": "Analyze patient photos (before photos for surgical evaluation) and provide quality feedback.",
  "arguments": {
    "type": "object",
    "properties": {
      "mediaType": { "type": "string", "enum": ["image"] },
      "procedureType": { "type": "string" },
      "photoAngle": { "type": "string", "enum": ["frontal", "perfil_derecho", "perfil_izquierdo", "posterior", "oblicua", "base_nasal"] }
    }
  },
  "startAt": "httpRequest_PhotoAnalysis",
  "steps": {
    "httpRequest_PhotoAnalysis": {
      "type": "httpRequest",
      "parameters": {
        "url": "https://api.neero.ai/api/bird",
        "method": "POST",
        "headers": [
          { "key": "X-API-Key", "value": "{{env.NEERO_API_KEY}}" }
        ],
        "body": {
          "context": {
            "conversationId": "{{context.conversation.id}}",
            "contactName": "{{context.contact.computedDisplayName}}",
            "procedureType": "{{arguments.procedureType}}",
            "photoAngle": "{{arguments.photoAngle}}"
          }
        },
        "contentType": "application/json",
        "timeoutSeconds": 9
      }
    }
  }
}
```

**API Enhancement (`/api/bird/route.ts`):**

Add surgical photo quality check logic:
```typescript
// After Gemini analyzes photo, evaluate for surgical use
interface PhotoQualityResult {
  usable: boolean;
  score: number; // 0-100
  issues: string[]; // ["dark", "blurry", "wrong_angle", "filtered"]
  suggestions: string[]; // ["Use natural light", "Remove filters"]
}

// Return to Bird AI Employee
{
  success: true,
  data: {
    photoQuality: {
      usable: true,
      score: 85,
      issues: [],
      suggestions: []
    },
    // ... other Gemini analysis
  }
}
```

**Prompts for Photo Quality Evaluation (Gemini):**

```typescript
const PHOTO_QUALITY_PROMPT = `
You are evaluating a patient photo for plastic surgery consultation.

Procedure: ${procedureType}
Expected Angle: ${photoAngle}

Evaluate the photo for surgical quality on these criteria:
1. Lighting: Is it bright enough to see skin texture and contours? (natural light best)
2. Focus: Is the image sharp and clear (not blurry)?
3. Angle: Does it match the expected angle (${photoAngle})?
4. Framing: Is the full area visible (not cropped or zoomed too much)?
5. Filters: Are there any beauty filters, makeup, or digital alterations?
6. Background: Is the background neutral (not distracting)?

Scoring:
- 90-100: Excellent, ready for surgeon review
- 70-89: Good, usable with minor issues
- 50-69: Poor, should request retake
- 0-49: Unusable, must request retake

Return JSON:
{
  "usable": boolean,
  "score": number (0-100),
  "issues": string[] (if any),
  "suggestions": string[] (how to improve)
}
`;
```

---

## References & Research Sources

**Industry Benchmarks (Plastic Surgery):**
- ASPS (American Society of Plastic Surgeons) Statistics 2024
- SCCP (Sociedad Colombiana de Cirugía Plástica) Guidelines
- ISAPS (International Society of Aesthetic Plastic Surgery) Global Survey

**Colombian Healthcare Regulations:**
- Ley 1581/2012 (Habeas Data - Patient Privacy)
- Resolución 2003/2014 (Surgical Safety Standards)
- WhatsApp GDPR Compliance in Healthcare

**Competitor Analysis (LATAM Plastic Surgery Practices):**
- Dr. Carlos Ramos (Barranquilla) - Instagram @drcarlsramos
- Clínica Iberoamérica (Barranquilla) - Social media engagement
- Dr. Alfredo Hoyos (Colombia) - International reputation
- [Analyze: Response times, content strategy, patient engagement]

**AI Agent Best Practices:**
- Bird AI Employees Documentation (https://bird.com/docs/ai-employees)
- Conversational AI for Healthcare (Gartner 2024)
- WhatsApp Business API Limits (https://developers.facebook.com/docs/whatsapp)

**Next Steps:**
1. Schedule 90-min staff interview (Coordinator + Medical Assistant + Reception)
2. Document interview findings in `/docs/api-bird/staff-interview-notes.md`
3. Validate costs (valoración pricing, procedure averages)
4. Confirm calendar system (Google Calendar API access?)
5. Validate payment methods (Wompi, Stripe, bank transfer flows)
6. Review surgical consent forms (digital signature feasible?)
7. Test photo quality analysis with 20 sample photos (before/after comparison)

---

**Document Status:** Draft (awaiting staff interview validation)
**Lines:** 1,425 | **Tokens:** ~6,800 | **Last Updated:** 2025-12-14
**Next Review:** After staff interview (Day 2)
