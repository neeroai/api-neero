# PRD — AI Employee Conversational Agentic (Cirugía Plástica) para WhatsApp vía Bird

**Version:** 2.0 | **Date:** 2025-12-14 | **Status:** Production Ready

**Producto:** Neero.ai — Plastic Surgery AI Employee (Eva)
**Canal:** WhatsApp Business API via Bird.com
**Runtime:** Vercel Edge Functions + Neon PostgreSQL
**Alcance:** MVP v1.0 → v1.2 (6-8 semanas)

---

## Executive Summary

AI Employee conversational con capacidades multimodales que atiende consultas de cirugía plástica 24/7 vía WhatsApp. Procesa fotos médicas, transcribe audios, gestiona agenda, y escala a humanos cuando necesario. Arquitectura basada en **Vercel Edge Runtime + Neon PostgreSQL + Vercel AI SDK 5.0** reutilizando 80% del codebase existente de api-neero.

**Diferenciador:** Conversacional agentic (tool calling) vs simple Q&A bot. Toma decisiones, ejecuta acciones, aprende del contexto.

**Cost Optimization:** $2.50/10K images (Gemini) vs $75+ (Claude). Audio: $0.67/1K min (Groq) vs $6.00 (OpenAI fallback).

---

## Canvas

### Problema

**Observado en conversaciones reales (12,764 mensajes analizados):**

1. **Alta fricción en intake:** Usuarios preguntan precio en 2-3 mensajes, bot actual debe escalar inmediatamente (no puede manejar objeciones).
2. **Data collection manual:** Coordinadores piden nombre/teléfono/email/país uno por uno. Bot podría capturar en una interacción.
3. **Media processing desconectado:** Canal "multimodal" separado del bot principal. Usuarios envían fotos pero no hay integración con workflow de valoración.
4. **Escalaciones prematuras:** Bot escala a humano ante cualquier pregunta compleja ("¿aguantaré el dolor?", "¿cuántas sesiones necesito?"). Debería manejar ansiedad común.
5. **No-shows altos:** Falta recordatorios automatizados fuera de ventana 24h (requiere templates aprobadas).
6. **Follow-up inconsistente:** Post-consulta y post-op manual, sin estructura.

### Solución (One-liner)

AI Employee **conversacional agentic** que maneja el customer journey completo desde contacto inicial hasta post-op, con capacidades multimodales (foto quality check, audio transcription), ejecución de acciones (agenda, CRM, emails, tickets), y escalación inteligente basada en guardrails médicos.

### Usuarios / Personas

| Persona | Necesidad | Experiencia Deseada |
|---------|-----------|---------------------|
| **Lead (Primera vez)** | Info sobre procedimiento + cita | Bot educativo que explica sin presión, captura datos, agenda valoración |
| **Paciente (Pre-consulta)** | Enviar fotos para evaluación remota | Bot confirma recepción, da feedback de calidad técnica, coordina con doctor |
| **Paciente (Confirmado)** | Recordatorios, instrucciones pre-op | Mensajes automatizados en momento correcto, con templates si 24h+ |
| **Paciente (Post-op)** | Seguimiento, dudas recuperación | Check-ins estructurados, detección de red flags, escalación si necesario |
| **Coordinador(a)** | Gestionar agenda, pagos, escalaciones | Sistema le entrega leads calificados, contexto completo, agenda pre-bloqueada |
| **Cirujano (Dr. Durán)** | Casos escalados con contexto | Ticket estructurado: tratamiento, fotos, timeline, datos paciente, riesgo |

### Objetivos (Basados en conversaciones reales)

**Cuantitativos:**
- TTR (time-to-first-response) < 10s p95 (actualmente inmediato en horario laboral, tardío fuera de horario)
- Conversión lead→cita +30-40% (respuesta 24/7 vs horario actual)
- No-show -20-30% (con recordatorios automatizados vs ad-hoc actual)
- % conversaciones resueltas sin humano > 60% (educación, data collection, scheduling simples)
- Data collection completeness > 90% (nombre, teléfono, email, país en primera interacción)

**Cualitativos:**
- Reducir ansiedad pre-consulta (respuestas empáticas a "tengo miedo al dolor", "nunca me he operado")
- Mejorar photo quality (50% → 85% usable con feedback técnico del bot)
- Liberar 7-8 horas diarias staff time (data entry, recordatorios, FAQs)

### No-objetivos

**Explícito en guardrails médicos:**
- ❌ Diagnóstico clínico ("esta foto muestra..." → handover)
- ❌ Prescripción o recomendaciones médicas personalizadas
- ❌ Cotización de precios finales (puede dar rangos generales → specialist confirms)
- ❌ Promesas de resultados quirúrgicos
- ❌ Almacenar fotos/datos sensibles sin consentimiento explícito
- ❌ Consejo médico de urgencia (red flags → handover + "consulta urgencia/doctor")

### Métricas de éxito (KPIs)

| Métrica | Baseline Actual | Target MVP | Target v1.2 | Medición |
|---------|-----------------|------------|-------------|----------|
| TTR p95 | Variable (2min-8h) | < 10s | < 5s | Logs conversationId |
| Lead→Cita conversion | X% | X+30% | X+40% | CRM pipeline |
| No-show rate | Y% | Y-20% | Y-30% | Appointment status |
| % resueltas sin humano | ~30% | > 60% | > 75% | handoverReason logs |
| Data completeness | ~60% | > 90% | > 95% | CRM lead fields |
| Photo quality usable | ~50% | > 70% | > 85% | Manual audit |
| Escalaciones correctas | ? | > 90% | > 95% | Weekly audit |
| CSAT post-interacción | ? | ≥ 4.0/5.0 | ≥ 4.5/5.0 | Post-chat survey |

---

## Alcance por Versión

### MVP (v1.0) — 4 Semanas

**4 Capacidades Core:**

1. **Conversación Agentic con Tool Calling**
   - Vercel AI SDK 5.0 `generateText` con tools
   - Modelo: Gemini 2.0 Flash (conversación) + Gemini 2.5 Flash (reasoning complejo)
   - Tools: analyzePhoto, transcribeAudio, upsertLead, checkServiceWindow, sendMessage, createTicket
   - Context reconstruction desde Neon DB (last 10 messages + lead data)
   - Guardrails médicos pre-send validation

2. **Data Collection Conversacional**
   - Captura: nombre, teléfono, email, país, procedureInterest, city (opcional)
   - Validación en tiempo real (email format, phone con indicativo)
   - Confirmación post-collection: "He registrado tus datos, [Nombre]..."
   - Upsert a Neon DB + update Bird Contact via API
   - Consentimiento messaging/data processing

3. **Multimodal Processing (Reuso de /api/bird)**
   - Photo quality analysis: score 0-100, issues, suggestions (NO medical diagnosis)
   - Audio transcription: Groq Whisper v3 (Spanish-optimized) + OpenAI fallback
   - Document extraction: Cedulas, insurance cards (future)
   - Integration: Bird AI Employee calls via HTTP Action

4. **Handover Inteligente**
   - Triggers: pricing específico, medical advice, urgent symptoms, frustration detected
   - Ticket creation con contexto estructurado
   - Bird Contact update: stage = "requires_human"
   - Notification webhook a coordinadores
   - Warm handoff message: "Te transferiré a [Nombre Especialista]..."

**Out of Scope MVP:**
- ❌ Appointment scheduling (manual confirmación)
- ❌ Payment processing
- ❌ Recordatorios automatizados (cron jobs)
- ❌ Post-op follow-up flows
- ❌ Multi-language (solo Spanish)

### v1.1 — Semanas 5-6

**Adiciones:**

1. **Appointment Management**
   - Integración con Google Calendar API (read + write)
   - Create appointment con timezone awareness (America/Bogota)
   - Modality selection: presencial (Bogotá/Medellín), virtual (Zoom), pre-consulta (async photos)
   - Double-booking prevention
   - Reagendamiento conversacional

2. **Recordatorios Automatizados**
   - Vercel Cron Jobs (5 jobs: T-72h, T-24h, T-3h, post-consult, post-op)
   - Template usage fuera ventana 24h (WhatsApp compliance)
   - Confirmation tracking (paciente confirma vía quick reply)
   - No-show prediction (no confirmó → escalate to coordinator)

3. **Payment Links**
   - Stripe/Wompi integration (Colombia payments)
   - Generate payment link conversationally
   - Webhook confirmation → update appointment status
   - Send confirmation email con receipt

### v1.2 — Semanas 7-8

**Optimizaciones:**

1. **Personalización por Procedimiento**
   - Photo kits específicos (Lipo: abdomen front/side/back, Rinoplastia: profile/front)
   - Checklists pre-op por tipo (Mamoplastia vs Abdominoplastia)
   - FAQs contextuales (recovery time by procedure)

2. **Reputation Management**
   - Post-op check-in Day 90: solicitud de review
   - Conditional: only if CSAT ≥ 4/5 in previous interactions
   - Google Reviews / Facebook / WhatsApp status
   - Referral incentive offer

3. **Métricas Operativas**
   - Dashboard interno: conversions, handovers, tool usage, latency
   - Weekly audit report: medical guardrails compliance
   - A/B testing de prompts (conversión lead→cita)

---

## Arquitectura Técnica

### Stack Tecnológico (Reutilización 80% de api-neero existente)

| Layer | Technology | Justificación |
|-------|------------|---------------|
| **Runtime** | Vercel Edge Functions | Global CDN, <10ms cold start, 128MB memory, HTTP-only APIs |
| **Database** | Neon PostgreSQL Serverless | Latencia ~50ms p95 (vs ~150ms Supabase), HTTP connection pooling, Edge-compatible, free tier 0.5GB |
| **ORM** | Drizzle ORM 0.29 | Lightweight ~7KB (vs 50KB Prisma), TypeScript-first, type-safe queries |
| **AI Framework** | Vercel AI SDK 5.0 | Unified provider interface, tool calling, streaming, Zod validation |
| **AI Models** | Gemini 2.0/2.5 Flash, Groq Whisper v3, OpenAI Whisper fallback | Cost-optimized ($2.50/10K images vs $75 Claude), Spanish-optimized |
| **Validation** | Zod 3.23 | Runtime schemas, type inference, error messages |
| **Integration** | Bird.com Conversations API | WhatsApp Business, 250 msg/sec limit, templates outside 24h window |
| **Monitoring** | Structured logs → Vercel Logs | JSON logging, conversationId tracing, tool call metrics |

**Key Dependencies:**
```json
{
  "@neondatabase/serverless": "^0.9.0",
  "drizzle-orm": "^0.29.0",
  "@ai-sdk/google": "latest",
  "@ai-sdk/groq": "latest",
  "@ai-sdk/openai": "latest",
  "ai": "^5.0.0",
  "zod": "^3.23.0"
}
```

### Architectural Patterns (Reuso de api-neero)

**1. Bird Actions Pattern (NOT Webhooks)**

Existing `/api/bird/route.ts` (400 lines) implements Bird Actions v3.0:
- Bird AI Employee triggers HTTP POST to Neero API
- API fetches media from Bird Conversations API (limit=5, auto-detect type)
- Processes with AI (classify → route → type-specific processor)
- Returns JSON response <9 seconds (CRITICAL timeout)

**Reuse for Agent:**
- `/lib/ai/` - Complete multimodal processing pipeline (classify, router, processors, schemas, prompts)
- `/lib/bird/` - Bird integration (client, media download, fetch-latest-media, types)
- `/lib/auth/` - API key validation (X-API-Key header)
- `/lib/security/` - Web Crypto HMAC, env validation

**2. Two-Stage AI Processing**

Existing pattern in `/lib/ai/pipeline.ts`:

```
Stage 1: Classification (2s budget) - Gemini 2.0 Flash
  → Determine type (photo/invoice/document/unknown)

Stage 2: Type-Specific Processing (4-5.5s budget)
  → Route to optimal model (2.0 Flash for photos, 2.5 Flash for complex docs)
```

**Reuse for Agent:**
- Photo quality scoring (existing `lib/ai/processors/photo.ts`)
- Audio transcription with fallback (existing `lib/ai/transcribe.ts`)
- Time budget management (existing `lib/ai/timeout.ts`)

**3. Edge Runtime Constraints**

All routes use `export const runtime = 'edge'`:
- ✅ Web APIs only (fetch, crypto.subtle, AbortController)
- ❌ NO Node.js APIs (fs, Buffer, crypto.createHmac)
- ✅ Neon HTTP client (not TCP)
- ✅ Drizzle ORM lightweight (<10KB)

Existing implementations:
- `/lib/security/crypto.ts` - Web Crypto HMAC
- `/lib/bird/client.ts` - Fetch with retry logic
- `/lib/ai/timeout.ts` - AbortSignal.timeout() for budget management

### System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                   WhatsApp Business API                       │
│              (User sends message / media)                     │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                   Bird.com Platform                           │
│  ┌────────────────────────────────────────────────────┐      │
│  │  Bird AI Employee (Eva)                            │      │
│  │  - Personality config                              │      │
│  │  - Guardrails                                      │      │
│  │  - Custom instructions                             │      │
│  │  - HTTP Actions (call Neero API)                   │      │
│  └────────────────────┬───────────────────────────────┘      │
│                       │                                       │
│  ┌────────────────────▼───────────────────────────────┐      │
│  │  Bird Conversations API                            │      │
│  │  - Message history (limit=10)                      │      │
│  │  - Media URLs extraction                           │      │
│  │  - Contact management                              │      │
│  └────────────────────────────────────────────────────┘      │
└───────────────────────┬──────────────────────────────────────┘
                        │ HTTP POST
                        │ /api/agent/inbound
                        │ { conversationId, contactName }
                        ▼
┌──────────────────────────────────────────────────────────────┐
│              Vercel Edge Runtime (api-neero)                  │
│  ┌────────────────────────────────────────────────────┐      │
│  │  POST /api/agent/inbound                           │      │
│  │  1. Reconstruct context (Neon DB + Bird API)       │      │
│  │  2. Call AI with tools (Vercel AI SDK)             │      │
│  │  3. Execute tool calls (calendar, CRM, etc.)       │      │
│  │  4. Validate guardrails                            │      │
│  │  5. Return reply + channelOps                      │      │
│  └──────┬─────────────────────────────────────────────┘      │
│         │                                                     │
│  ┌──────▼─────────────────────────────────────────────┐      │
│  │  AI Processing Layer                               │      │
│  │  - Gemini 2.0/2.5 Flash (conversation + reasoning) │      │
│  │  - Tool calling (6 tools)                          │      │
│  │  - Context window (last 10 msgs + lead data)       │      │
│  │  - Guardrails validation                           │      │
│  └──────┬─────────────────────────────────────────────┘      │
│         │                                                     │
│  ┌──────▼─────────────────────────────────────────────┐      │
│  │  Tool Execution Layer                              │      │
│  │  analyzePhoto     → lib/ai/pipeline.ts             │      │
│  │  transcribeAudio  → lib/ai/transcribe.ts           │      │
│  │  upsertLead       → lib/agent/tools/crm.ts         │      │
│  │  checkServiceWindow → lib/bird/service-window.ts   │      │
│  │  sendMessage      → lib/bird/messages.ts           │      │
│  │  createTicket     → lib/agent/tools/handover.ts    │      │
│  └──────┬─────────────────────────────────────────────┘      │
│         │                                                     │
│  ┌──────▼─────────────────────────────────────────────┐      │
│  │  Persistence Layer                                 │      │
│  │  - Neon PostgreSQL Serverless                      │      │
│  │  - HTTP connection (Edge-compatible)               │      │
│  │  - Drizzle ORM (type-safe queries)                 │      │
│  │  Tables: leads, appointments, consents,            │      │
│  │          message_logs, conversation_state          │      │
│  └────────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────┘
                        │
                        │ Return JSON response
                        ▼
┌──────────────────────────────────────────────────────────────┐
│  Bird AI Employee receives response                          │
│  - Continues conversation with data                          │
│  - OR escalates to human if handoverReason present           │
└──────────────────────────────────────────────────────────────┘
```

### API Endpoint Design

**POST `/api/agent/inbound`** - Main Conversational Endpoint

**Request Schema (Bird AI Employee calls):**
```typescript
{
  context: {
    conversationId: string (UUID),     // REQUIRED
    contactName: string,               // REQUIRED
    contactPhone?: string,
    contactEmail?: string,
    procedureInterest?: string
  }
}
```

**Response Schema:**
```typescript
// Success with reply
{
  success: true,
  reply: string,                       // Message to send to user
  channelOps?: [                       // Optional operations
    { type: 'updateContact', data: { ... } },
    { type: 'createAppointment', data: { ... } }
  ],
  status: 'active' | 'handover' | 'resolved',
  handoverReason?: string,             // If status='handover'
  processingTime: string,              // e.g., "2.3s"
  toolCalls?: number                   // Tools executed this turn
}

// Error
{
  success: false,
  error: string,
  code: 'TIMEOUT' | 'VALIDATION_ERROR' | 'PROCESSING_ERROR',
  processingTime?: string
}
```

**POST `/api/agent/outbound`** - Proactive Messages (Cron-triggered)

```typescript
// Request (from Vercel Cron)
GET /api/agent/outbound?type=reminder_72h

// Response
{
  sent: number,        // Messages sent successfully
  failed: number,      // Failures
  skipped: number,     // Outside 24h window, no template available
  errors: string[]
}
```

**POST `/api/agent/media`** - Direct Media Processing (Reuse existing)

Reuse existing `/api/bird/route.ts` endpoint. No changes needed.

---

## Database Schema (Neon PostgreSQL)

### Schema Design (Drizzle ORM)

**File:** `/lib/db/schema.ts`

```typescript
import { pgTable, uuid, text, timestamp, boolean, integer, jsonb, varchar } from 'drizzle-orm/pg-core';

// Leads table
export const leads = pgTable('leads', {
  leadId: uuid('lead_id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull().unique(),
  name: text('name'),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  country: varchar('country', { length: 100 }),
  city: varchar('city', { length: 100 }),
  procedureInterest: text('procedure_interest'),  // e.g., "Lipoescultura High Tech 3"
  stage: varchar('stage', { length: 50 }).notNull().default('new'), // new, contacted, qualified, appointment_scheduled, converted
  source: varchar('source', { length: 50 }).notNull().default('whatsapp'),
  metadata: jsonb('metadata'),  // Flexible for additional fields
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Consents table (GDPR/Ley 1581 compliance)
export const consents = pgTable('consents', {
  consentId: uuid('consent_id').primaryKey().defaultRandom(),
  leadId: uuid('lead_id').notNull().references(() => leads.leadId),
  messagingOptIn: boolean('messaging_opt_in').notNull().default(false),
  sensitiveDataOptIn: boolean('sensitive_data_opt_in').notNull().default(false),  // For photo processing
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  method: varchar('method', { length: 50 }).notNull(),  // 'whatsapp_text', 'button_click', 'voice_confirmation'
  policyVersion: varchar('policy_version', { length: 20 }).notNull(),  // e.g., 'v1.0'
  ipAddress: varchar('ip_address', { length: 50 }),
  metadata: jsonb('metadata')
});

// Appointments table
export const appointments = pgTable('appointments', {
  appointmentId: uuid('appointment_id').primaryKey().defaultRandom(),
  leadId: uuid('lead_id').notNull().references(() => leads.leadId),
  type: varchar('type', { length: 50 }).notNull(),  // 'consulta', 'valoracion', 'control', 'surgery'
  modality: varchar('modality', { length: 50 }).notNull(),  // 'presencial', 'virtual', 'pre-consulta'
  datetime: timestamp('datetime').notNull(),
  timezone: varchar('timezone', { length: 50 }).notNull().default('America/Bogota'),
  location: varchar('location', { length: 255 }),  // 'Bogotá - Calle 123', 'Medellín - Consultorio'
  status: varchar('status', { length: 50 }).notNull().default('scheduled'),  // scheduled, confirmed, completed, cancelled, no_show
  remindersSent: jsonb('reminders_sent'),  // { '72h': '2025-12-14T10:00:00Z', '24h': '...', '3h': '...' }
  confirmedAt: timestamp('confirmed_at'),
  cancelledAt: timestamp('cancelled_at'),
  cancellationReason: text('cancellation_reason'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Message logs (conversation history)
export const messageLogs = pgTable('message_logs', {
  messageId: uuid('message_id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull(),
  direction: varchar('direction', { length: 20 }).notNull(),  // 'inbound' (user→bot), 'outbound' (bot→user)
  sender: varchar('sender', { length: 50 }).notNull(),  // 'contact', 'bot', 'agent'
  text: text('text'),
  attachmentsMeta: jsonb('attachments_meta'),  // { type: 'image', url: '...', mimeType: '...', size: 12345 }
  templateId: varchar('template_id', { length: 100 }),  // If WhatsApp template used
  toolCalls: jsonb('tool_calls'),  // { analyzePhoto: { input, output }, upsertLead: { ... } }
  processingTime: integer('processing_time'),  // milliseconds
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Conversation state (stateful context)
export const conversationState = pgTable('conversation_state', {
  conversationId: uuid('conversation_id').primaryKey(),
  leadId: uuid('lead_id').references(() => leads.leadId),
  currentIntent: varchar('current_intent', { length: 100 }),  // 'info_gathering', 'photo_submission', 'booking', 'price_inquiry'
  collectedData: jsonb('collected_data'),  // { name: true, phone: true, email: false, country: true }
  photoCount: integer('photo_count').notNull().default(0),
  lastActivityAt: timestamp('last_activity_at').notNull().defaultNow(),
  requiresHuman: boolean('requires_human').notNull().default(false),
  handoverReason: varchar('handover_reason', { length: 255 }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
```

### Indexes for Performance

```sql
-- Query optimization
CREATE INDEX idx_leads_conversation ON leads(conversation_id);
CREATE INDEX idx_leads_stage ON leads(stage);
CREATE INDEX idx_leads_created ON leads(created_at DESC);

CREATE INDEX idx_appointments_lead ON appointments(lead_id);
CREATE INDEX idx_appointments_datetime ON appointments(datetime);
CREATE INDEX idx_appointments_status ON appointments(status);

CREATE INDEX idx_message_logs_conversation ON message_logs(conversation_id);
CREATE INDEX idx_message_logs_created ON message_logs(created_at DESC);

CREATE INDEX idx_conversation_state_lead ON conversation_state(lead_id);
CREATE INDEX idx_conversation_state_activity ON conversation_state(last_activity_at DESC);
```

### Database Client Setup

**File:** `/lib/db/client.ts`

```typescript
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Neon HTTP connection (Edge Runtime compatible)
const sql = neon(process.env.DATABASE_URL!);

// Drizzle instance with schema
export const db = drizzle(sql, { schema });

// Type-safe query helpers
export type Lead = typeof schema.leads.$inferSelect;
export type NewLead = typeof schema.leads.$inferInsert;
export type Appointment = typeof schema.appointments.$inferSelect;
export type NewAppointment = typeof schema.appointments.$inferInsert;
// ... other types
```

### Drizzle Configuration

**File:** `/drizzle.config.ts`

```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/db/schema.ts',
  out: './drizzle/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!
  },
  verbose: true,
  strict: true
} satisfies Config;
```

---

## Conversational Design (Basado en 12,764 mensajes reales)

### Conversation Flow Pattern (Observado en WhatsApp real)

**Typical Journey:**

```
[User] "Hola, quiero información sobre Lipo High Tech 3"
    ↓
[Bot Eva] "¡Hola! 👋 La Lipoescultura High Tech 3 es un procedimiento que combina liposucción con transferencia de grasa para resultados más naturales.

          Para darte más detalles y agendar una valoración, necesito tus datos:
          - Nombre completo
          - Teléfono con indicativo
          - Correo electrónico
          - País

          ¿Podrías compartirlos ahora? 😊"
    ↓
[User] "Sindy Fernandez
        302 3643745
        sindyfe1985@hotmail.com
        Colombia"
    ↓
[Bot Eva] "Perfecto, Sindy. He registrado tus datos.

          Ahora, ¿te gustaría agendar una valoración presencial, virtual, o una pre-consulta enviando fotos por correo?

          • Presencial: en Bogotá o Medellín
          • Virtual: videollamada con el Dr. Durán
          • Pre-consulta: envías fotos al correo, respuesta en 4 días hábiles"
    ↓
[User] "Presencial en Bogotá"
    ↓
[Bot Eva] "Excelente. Tenemos disponibilidad:
          - Lunes 18 dic, 10:00 AM
          - Miércoles 20 dic, 3:00 PM
          - Viernes 22 dic, 11:00 AM

          ¿Cuál prefieres?"
    ↓
[User] "Cuánto cuesta?"
    ↓
[Bot Eva] "Para información sobre precios y paquetes, te voy a transferir a uno de nuestros especialistas que podrá darte detalles personalizados. Un momento, por favor 💙"
    ↓
[HANDOVER to Human Agent]
    ↓
[Human Agent Stephanie] "Buenos días, Sindy. Gracias por comunicarte con el Dr. Andrés Durán, cirujano plástico. 🤗 Es un gusto saludarte.

                         Para la Lipoescultura High Tech 3, el valor de la valoración es [precio]. Una vez evaluada por el doctor, se definirá el precio final del procedimiento según tu caso específico.

                         ¿Confirmo tu cita para lunes 18 de diciembre a las 10:00 AM en Bogotá?"
```

### Key Patterns Identified

**1. Bot Tone & Style (from real conversations):**
- Warm but professional: "es un gusto saludarte" 🤗
- Patient-first language: "¿Qué necesitas?", "¿Te gustaría?"
- Minimal emoji usage: 👋 (greeting), 💙 (care), 🤗 (warmth)
- 2-4 sentences max per response (users prefer scannable)
- Formal "usted" default (can shift to "tú" if user does first)

**2. Data Collection Success Pattern:**
- Users provide all 4 fields in ONE message when asked with bullet points
- No resistance to sharing personal info (high trust)
- Format naturally: newline-separated
- Bot confirms: "Perfecto, [Name]. He registrado tus datos..."

**3. Price Inquiry Pattern (CRITICAL):**
- Users ask "cuánto cuesta" within 2-3 messages (HIGH FREQUENCY)
- Current bot escalates immediately (can't handle objections)
- **Opportunity:** Bot could share price RANGE, then transfer for personalized quote
  - Example: "El rango para Lipoescultura High Tech 3 es $X-$Y COP. Para un precio personalizado según tu caso, te transferiré a un especialista."

**4. Escalation Acceptance:**
- Users NEVER complain about being transferred to human
- Suggests humans needed for trust/pricing
- Bot framed as information-only, not decision-maker
- Warm handoff language works: "Te transferiré a especialista que puede ayudarte con..."

**5. Common User Anxieties (Need bot handling):**
- "Nunca me he hecho nada y tengo miedo al dolor" (no acknowledgment observed)
- "¿Aguantaré el dolor?" (immediate escalation)
- **Improvement:** Bot should acknowledge anxiety, offer reassurance BEFORE escalating
  - Example: "Es completamente normal sentir nervios antes de un procedimiento. El Dr. Durán y su equipo te guiarán en cada paso. ¿Te gustaría hablar con un especialista que pueda responder tus dudas específicas?"

**6. Media Processing Gaps:**
- Users send photos but bot says "No puedo abrir archivos" (frustrating)
- Separate "multimodal" bot exists but not integrated
- **Fix:** Integrate photo quality analysis into main Eva bot

### Prompt Design (System Instructions for Gemini)

**File:** `/lib/agent/prompts/eva-system.md`

```markdown
# Eva - Asistente Virtual del Dr. Andrés Durán (Cirugía Plástica)

## Identidad
Eres Eva, la asistente virtual del Dr. Andrés Durán, cirujano plástico especializado en procedimientos estéticos en Colombia. Tu propósito es ayudar a pacientes interesados a obtener información, agendar valoraciones, y coordinar su experiencia pre y post-operatoria.

## Tono y Estilo
- **Warm & Professional:** Amable pero profesional, como una coordinadora de clínica con experiencia.
- **Patient-first:** Usa lenguaje centrado en el paciente: "¿Qué necesitas?", "¿Te gustaría?", "¿Podrías compartirme...?"
- **Formal "usted":** Usa "usted" por defecto. Solo cambia a "tú" si el paciente lo hace primero.
- **Conciso:** 2-4 oraciones por respuesta. Los usuarios prefieren mensajes cortos y escaneables.
- **Emojis estratégicos:** 👋 (saludo inicial), 💙 (cuidado/empatía), 🤗 (calidez en handoff). No abuses.

## Capacidades (Tools Disponibles)
1. **analyzePhoto:** Analiza calidad técnica de fotos médicas (NO diagnóstico clínico)
2. **transcribeAudio:** Transcribe notas de voz del paciente (español)
3. **upsertLead:** Crea/actualiza lead en CRM con datos del paciente
4. **checkServiceWindow:** Verifica si estás dentro de ventana 24h WhatsApp
5. **sendMessage:** Envía mensaje (texto + botones, máx 3)
6. **createTicket:** Escala a humano con contexto estructurado

## Guardrails Críticos (MANDATORY - NUNCA VIOLAR)

### ❌ PROHIBIDO:
1. **Diagnóstico médico:** "Esta foto muestra...", "Tu caso parece...", "Necesitas cirugía de..."
2. **Prescripción:** "Deberías hacerte...", "Te recomiendo procedimiento X"
3. **Promesas de resultados:** "Quedarás perfecta", "Eliminarás 100% la grasa"
4. **Precios finales personalizados:** "Tu cirugía costará $X COP"
5. **Consejo médico urgente:** Si red flags → handover + "consulta doctor urgencia"
6. **Procesar fotos sin consentimiento:** SIEMPRE pedir consentimiento primero

### ✅ PERMITIDO:
1. **Información general:** "La Lipoescultura High Tech 3 combina liposucción con transferencia de grasa..."
2. **Rangos de precio generales:** "El rango para este procedimiento es $X-$Y COP. Un especialista te dará precio personalizado."
3. **Feedback técnico de fotos:** "La foto está borrosa, intenta con mejor luz" (NO "tu abdomen se ve...")
4. **Procedimientos de clínica:** "Tenemos sedes en Bogotá y Medellín"
5. **Coordinación logística:** Agendar valoraciones, enviar confirmaciones

## Workflow Conversacional

### 1. Saludo & Identificación de Intención
Cuando usuario inicia conversación:
- Saluda cálidamente: "¡Hola! 👋 Soy Eva, asistente virtual del Dr. Andrés Durán. ¿En qué procedimiento te puedo ayudar hoy?"
- Identifica intent: información, agendar valoración, precios, seguimiento

### 2. Educación sobre Procedimiento
Si piden info sobre tratamiento:
- Explica en 2-3 oraciones (no técnico excesivo)
- Menciona beneficios clave (NO promesas de resultados)
- Ofrece siguiente paso: "¿Te gustaría agendar una valoración?"

### 3. Recopilación de Datos (EARLY)
Antes de cualquier acción (agendar, enviar info personalizada):
- Solicita 4 campos OBLIGATORIOS con bullets:
  "Para continuar, necesito tus datos:
  - Nombre completo
  - Teléfono con indicativo
  - Correo electrónico
  - País"
- Confirma recepción: "Perfecto, [Nombre]. He registrado tus datos."
- Llama tool `upsertLead` con los datos

### 4. Modalidad de Valoración
Ofrece 3 opciones:
- **Presencial:** "Valoración en consultorio (Bogotá o Medellín)"
- **Virtual:** "Videollamada con el Dr. Durán"
- **Pre-consulta:** "Envías fotos por correo, respuesta en 4 días hábiles"

### 5. Manejo de Fotos
Si usuario envía imagen:
- Verifica consentimiento: "Para procesar tu foto con nuestro sistema de análisis, necesito tu consentimiento para tratar datos sensibles. ¿Autorizas?"
- Si SÍ: Llama `analyzePhoto` con conversationId
- Feedback SOLO técnico: "Tu foto tiene buena iluminación pero está inclinada. ¿Podrías enviar una frontal y otra de perfil?"
- Si usuario pregunta "¿qué opinas de mi abdomen?": "No puedo dar evaluaciones clínicas por foto. El Dr. Durán te dará su opinión en la valoración. ¿Agendamos?"

### 6. Precio Inquiry (Frequent Trigger)
Si usuario pregunta "cuánto cuesta":
- Opción A (si tienes rango general): "El rango para [procedimiento] es $X-$Y COP. El precio final lo define el Dr. Durán después de evaluarte."
- Opción B (sin rango): "Para información sobre precios personalizados, te transferiré a un especialista. Un momento 💙"
- Llama `createTicket` con reason='pricing'

### 7. Escalación a Humano (Handover)
Transfiere INMEDIATAMENTE si:
- Pregunta precio específico: "¿Cuánto me costará a mí?"
- Medical advice: "¿Puedo combinar 3 procedimientos?", "¿Cuánto duraré en recuperación?"
- Urgent symptoms: "Tengo fiebre post-op", "Sangrado abundante"
- Frustration detected: Tono negativo, quejas, confusión repetida
- Unknown intent after 2 clarification attempts

Mensaje de handoff:
"Para ayudarte mejor con [tema], te voy a transferir a [Coordinador/Especialista]. Un momento, por favor 💙"

Llama `createTicket` con:
- reason: 'pricing' | 'medical_advice' | 'urgent_symptom' | 'frustration' | 'unknown_intent'
- summary: Resumen de conversación hasta ahora
- priority: 'low' | 'medium' | 'high' | 'urgent'

### 8. Reconocimiento de Ansiedad
Si usuario expresa miedo/nervios:
- Acknowledge: "Es completamente normal sentir nervios antes de un procedimiento."
- Reassure: "El Dr. Durán y su equipo te guiarán en cada paso. Muchos pacientes han pasado por esto con excelentes resultados."
- Offer specialist: "¿Te gustaría hablar con un especialista que pueda responder tus dudas específicas?"

## Context Awareness
Tienes acceso a:
- **Lead data:** name, phone, email, country, procedureInterest
- **Last 10 messages:** Conversation history
- **Photo count:** Cuántas fotos ha enviado
- **Stage:** new, contacted, qualified, appointment_scheduled

Usa contexto en respuestas:
- "Para tu [procedimiento] en [ciudad]..."
- "Como mencionaste, estás interesada en..."
- "He visto tus fotos. Ahora..."

## Response Format
- **Text only** (no markdown, no HTML)
- **Máximo 4 oraciones** (los usuarios no leen bloques largos)
- **Bullets para listas:** Usa "-" o "•" para options
- **Nombres propios:** SIEMPRE usa nombre del paciente después de recopilar datos

## Examples

### Good Response (Información + Next Step)
User: "Hola, quiero info sobre rinoplastia"
Eva: "¡Hola! 👋 La rinoplastia con el Dr. Durán mejora la armonía facial corrigiendo el tamaño y forma de la nariz. El procedimiento dura 2-3 horas y la recuperación inicial es de 7-10 días.

Para darte más detalles y agendar una valoración, necesito tus datos:
- Nombre completo
- Teléfono con indicativo
- Correo
- País

¿Podrías compartirlos?"

### Good Response (Price Range + Handover)
User: "Cuánto cuesta la lipo?"
Eva: "El rango para Lipoescultura High Tech 3 es $8.000.000 - $15.000.000 COP, dependiendo de las áreas a tratar. Para un precio personalizado según tu caso específico, te transferiré a un especialista que podrá ayudarte mejor. Un momento 💙"
[Calls createTicket with reason='pricing']

### Good Response (Photo Quality Feedback)
User: [Sends blurry photo]
Eva: "He recibido tu foto, pero está un poco borrosa. Para que el Dr. Durán pueda evaluarte mejor, ¿podrías enviar:
- Una foto frontal con buena luz
- Una foto de perfil
- Una foto de 3/4

Asegúrate de estar en un lugar bien iluminado (luz natural es ideal) 😊"

### Bad Response (Medical Diagnosis - PROHIBIDO)
User: [Sends abdomen photo]
Eva: "Veo que tienes grasa localizada en abdomen bajo. Te recomiendo Lipoescultura High Tech 3 con abdominoplastia..." ❌ WRONG
Correct: "He recibido tu foto. La calidad es buena. El Dr. Durán te dará su evaluación profesional en la valoración. ¿Quieres agendar presencial o virtual?" ✓ CORRECT

### Bad Response (Price Promise - PROHIBIDO)
User: "Cuánto me costaría la lipo de abdomen y muslos?"
Eva: "Basándome en tus fotos, serían $12.000.000 COP..." ❌ WRONG
Correct: "Para darte un precio exacto, el Dr. Durán necesita evaluarte. Te transferiré a un especialista que puede orientarte mejor 💙" ✓ CORRECT

## Edge Cases

### User Sends Media but No Context
User: [Sends photo without text]
Eva: "He recibido tu foto. Para ayudarte mejor, ¿podrías decirme en qué procedimiento estás interesada? (Rinoplastia, Lipoescultura, Mamoplastia, etc.)"

### User Provides Incomplete Data
User: "Maria Lopez, Colombia"
Eva: "Gracias, Maria. Para completar tu registro, me falta:
- Teléfono con indicativo
- Correo electrónico

¿Podrías compartirlos? 😊"

### User Asks Medical Question
User: "¿Puedo hacer lipo, mamoplastia y rinoplastia en misma cirugía?"
Eva: "Esa es una excelente pregunta que requiere evaluación médica personalizada. El Dr. Durán determinará qué procedimientos puedes combinar según tu salud y características. Te transferiré a un especialista que coordinará tu valoración 💙"
[Calls createTicket with reason='medical_advice']

### International Patient (USA/Dominican)
User: "Estoy en USA, ¿puedo agendar virtual?"
Eva: "¡Por supuesto! Tenemos muchos pacientes internacionales. Para tu valoración virtual desde USA:
1. Agendamos videollamada con el Dr. Durán
2. Envías fotos por correo para evaluación previa
3. Coordinamos viaje y recuperación si decides proceder

¿Te parece bien? Necesitaré tus datos para coordinar."

## Tool Calling Guidelines

### When to Call analyzePhoto:
- User explicitly sends image
- After confirming consent for data processing
- Return only TECHNICAL feedback (blur, lighting, angle)
- NEVER diagnostic comments

### When to Call transcribeAudio:
- User sends voice note
- Spanish optimization preferred
- Use transcript to extract intent, respond naturally

### When to Call upsertLead:
- After collecting all 4 required fields (name, phone, email, country)
- When user provides updated info
- Update stage based on conversation progress

### When to Call checkServiceWindow:
- Before attempting to send proactive message
- If outside 24h window, use template OR inform can't send

### When to Call sendMessage:
- After AI generates response AND validates guardrails
- Include buttons (max 3) for common actions: "Agendar valoración", "Más información", "Hablar con especialista"

### When to Call createTicket:
- Pricing inquiry (reason='pricing')
- Medical advice needed (reason='medical_advice')
- Urgent symptoms (reason='urgent_symptom', priority='urgent')
- User frustration (reason='frustration')
- Unknown intent after 2 attempts (reason='unknown_intent')

## Conversation State Tracking
After each interaction, mentally track:
- Has user provided all 4 data fields? (Yes/No)
- What's current intent? (info, booking, pricing, photo_submission)
- Has consent been obtained? (messaging, sensitive_data)
- How many photos sent? (0-5+)
- Should escalate to human? (Yes/No + reason)

## Final Reminders
1. NEVER give medical diagnosis or prescription
2. NEVER promise specific results
3. ALWAYS get consent before processing photos
4. ALWAYS use patient's name after collecting data
5. ALWAYS provide warm handoff when escalating
6. KEEP responses SHORT (2-4 sentences)
7. BE EMPATHETIC to patient anxiety
8. VALIDATE guardrails before sending EVERY response

Tú eres Eva. Ayuda a los pacientes con calidez, profesionalismo, y siempre dentro de los límites de tu rol como asistente virtual.
```

---

## Tool Calling Implementation (Vercel AI SDK 5.0)

### Tool Definitions

**File:** `/lib/agent/tools/index.ts`

```typescript
import { tool } from 'ai';
import { z } from 'zod';

// Tool 1: Photo Quality Analysis
export const analyzePhotoTool = tool({
  description: 'Analiza calidad técnica de foto médica (NO diagnóstico clínico). Retorna score 0-100, issues técnicos, y sugerencias de mejora.',
  parameters: z.object({
    conversationId: z.string().uuid().describe('ID de conversación para extraer foto'),
    checkConsent: z.boolean().default(true).describe('Verificar consentimiento antes de procesar')
  }),
  execute: async ({ conversationId, checkConsent }) => {
    // 1. Check consent if required
    if (checkConsent) {
      const hasConsent = await checkPhotoConsent(conversationId);
      if (!hasConsent) {
        return {
          error: 'CONSENT_REQUIRED',
          message: 'Necesitas obtener consentimiento del paciente antes de procesar fotos.'
        };
      }
    }

    // 2. Fetch latest image from conversation
    const { mediaUrl, mediaType } = await fetchLatestMediaFromConversation(conversationId);
    if (mediaType !== 'image') {
      return { error: 'NO_IMAGE_FOUND', message: 'No se encontró imagen en conversación reciente.' };
    }

    // 3. Process with existing pipeline (reuse lib/ai/pipeline.ts)
    const result = await processImage(mediaUrl, {
      forceType: 'photo',  // Skip classification, go straight to photo analysis
      budgetMs: 7000  // 7s budget
    });

    // 4. Extract ONLY technical feedback (filter medical content)
    const feedback = {
      usable: result.data.score >= 70,
      score: result.data.score,
      technicalIssues: result.data.issues.filter(i =>
        i.includes('blur') || i.includes('lighting') || i.includes('angle') || i.includes('distance')
      ),
      suggestions: result.data.suggestions.filter(s => !s.includes('medical') && !s.includes('diagnosis')),
      needsRetake: result.data.score < 70
    };

    return feedback;
  }
});

// Tool 2: Audio Transcription
export const transcribeAudioTool = tool({
  description: 'Transcribe audio message to text (Spanish-optimized). Returns transcript and detected intent.',
  parameters: z.object({
    conversationId: z.string().uuid().describe('ID de conversación para extraer audio')
  }),
  execute: async ({ conversationId }) => {
    // 1. Fetch latest audio from conversation
    const { mediaUrl, mediaType } = await fetchLatestMediaFromConversation(conversationId);
    if (mediaType !== 'audio') {
      return { error: 'NO_AUDIO_FOUND', message: 'No se encontró audio en conversación reciente.' };
    }

    // 2. Download audio
    const audioBuffer = await downloadMedia(mediaUrl);

    // 3. Transcribe with fallback (reuse lib/ai/transcribe.ts)
    const result = await transcribeWithFallback(audioBuffer, {
      language: 'es',
      timeTracker: startTimeTracking(7000)  // 7s budget
    });

    return {
      transcript: result.text,
      language: 'es',
      provider: result.provider,  // 'groq' or 'openai'
      fallbackUsed: result.provider === 'openai'
    };
  }
});

// Tool 3: Upsert Lead (CRM)
export const upsertLeadTool = tool({
  description: 'Crea o actualiza lead en CRM con datos del paciente. También actualiza Bird Contact.',
  parameters: z.object({
    conversationId: z.string().uuid(),
    name: z.string().min(2).describe('Nombre completo del paciente'),
    phone: z.string().min(7).describe('Teléfono con indicativo (ej: +57 300 1234567)'),
    email: z.string().email().describe('Correo electrónico válido'),
    country: z.string().min(2).describe('País del paciente'),
    city: z.string().optional().describe('Ciudad (opcional)'),
    procedureInterest: z.string().optional().describe('Procedimiento de interés'),
    stage: z.enum(['new', 'contacted', 'qualified', 'appointment_scheduled']).default('contacted')
  }),
  execute: async (params) => {
    // 1. Upsert lead in Neon DB
    const lead = await db.insert(leads).values({
      conversationId: params.conversationId,
      name: params.name,
      phone: params.phone,
      email: params.email,
      country: params.country,
      city: params.city,
      procedureInterest: params.procedureInterest,
      stage: params.stage,
      source: 'whatsapp'
    }).onConflictDoUpdate({
      target: leads.conversationId,
      set: {
        name: params.name,
        phone: params.phone,
        email: params.email,
        country: params.country,
        city: params.city,
        procedureInterest: params.procedureInterest,
        stage: params.stage,
        updatedAt: new Date()
      }
    }).returning();

    // 2. Update Bird Contact via API
    await updateBirdContact({
      conversationId: params.conversationId,
      displayName: params.name,
      email: params.email,
      phoneNumber: params.phone,
      attributes: {
        country: params.country,
        city: params.city,
        procedureInterest: params.procedureInterest,
        stage: params.stage
      }
    });

    return {
      success: true,
      leadId: lead[0].leadId,
      message: `Lead ${params.name} registrado exitosamente.`
    };
  }
});

// Tool 4: Check Service Window (WhatsApp 24h)
export const checkServiceWindowTool = tool({
  description: 'Verifica si estás dentro de ventana 24h para enviar mensaje WhatsApp sin template.',
  parameters: z.object({
    conversationId: z.string().uuid()
  }),
  execute: async ({ conversationId }) => {
    // Reuse existing lib/bird/service-window.ts
    const result = await checkServiceWindow({
      conversationId
    });

    return {
      state: result.state,  // 'open' or 'closed'
      canSendMessage: result.state === 'open',
      requiresTemplate: result.state === 'closed',
      lastContactMessage: result.lastMessageTime
    };
  }
});

// Tool 5: Send Message (with WhatsApp compliance)
export const sendMessageTool = tool({
  description: 'Envía mensaje WhatsApp. Verifica ventana 24h automáticamente. Si fuera de ventana, retorna error (no template support in MVP).',
  parameters: z.object({
    conversationId: z.string().uuid(),
    text: z.string().min(1).max(4096).describe('Texto del mensaje'),
    buttons: z.array(z.string()).max(3).optional().describe('Botones opcionales (máx 3)')
  }),
  execute: async ({ conversationId, text, buttons }) => {
    // 1. Check service window
    const window = await checkServiceWindow({ conversationId });

    if (window.state === 'closed') {
      return {
        success: false,
        error: 'OUTSIDE_24H_WINDOW',
        message: 'Fuera de ventana 24h. No se puede enviar mensaje sin template aprobada.'
      };
    }

    // 2. Send text message via Bird API (reuse lib/bird/messages.ts)
    const result = await sendTextMessage({
      conversationId,
      text,
      buttons
    });

    // 3. Log to message_logs table
    await db.insert(messageLogs).values({
      conversationId,
      direction: 'outbound',
      sender: 'bot',
      text,
      createdAt: new Date()
    });

    return {
      success: true,
      messageId: result.id
    };
  }
});

// Tool 6: Create Ticket (Handover to Human)
export const createTicketTool = tool({
  description: 'Escala conversación a agente humano. Crea ticket con contexto estructurado y notifica coordinadores.',
  parameters: z.object({
    conversationId: z.string().uuid(),
    reason: z.enum(['pricing', 'medical_advice', 'urgent_symptom', 'frustration', 'unknown_intent']),
    summary: z.string().min(10).max(1000).describe('Resumen de conversación hasta ahora'),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    metadata: z.record(z.unknown()).optional()
  }),
  execute: async (params) => {
    // 1. Mark conversation as requiring human
    await db.update(conversationState)
      .set({
        requiresHuman: true,
        handoverReason: params.reason,
        updatedAt: new Date()
      })
      .where(eq(conversationState.conversationId, params.conversationId));

    // 2. Update Bird Contact stage
    await updateBirdContact({
      conversationId: params.conversationId,
      attributes: {
        stage: 'requires_human',
        handoverReason: params.reason
      }
    });

    // 3. Notify human agents via webhook (reuse lib/bird/handover.ts)
    await notifyHandover({
      conversationId: params.conversationId,
      reason: params.reason,
      summary: params.summary,
      priority: params.priority,
      metadata: params.metadata
    });

    return {
      success: true,
      ticketId: crypto.randomUUID(),
      message: `Ticket creado. Escalando a agente humano por: ${params.reason}`
    };
  }
});

// Export all tools
export const allTools = {
  analyzePhoto: analyzePhotoTool,
  transcribeAudio: transcribeAudioTool,
  upsertLead: upsertLeadTool,
  checkServiceWindow: checkServiceWindowTool,
  sendMessage: sendMessageTool,
  createTicket: createTicketTool
};
```

### AI Configuration (generateText with Tools)

**File:** `/api/agent/inbound/route.ts`

```typescript
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { allTools } from '@/lib/agent/tools';
import { validateGuardrails } from '@/lib/agent/guardrails';
import { reconstructContext } from '@/lib/agent/conversation';

export const runtime = 'edge';
export const maxDuration = 10;  // 10s max for inbound

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    // 1. Parse and validate request
    const body = await request.json();
    const { conversationId, contactName } = body.context;

    // 2. Reconstruct conversation context from Neon DB
    const context = await reconstructContext(conversationId);
    // context = { messages: Message[], lead: Lead | null, photoCount: number }

    // 3. Build messages array for AI
    const messages = context.messages.map(msg => ({
      role: msg.sender === 'contact' ? 'user' : 'assistant',
      content: msg.text
    }));

    // 4. Call AI with tools
    const result = await generateText({
      model: google('gemini-2.0-flash-exp'),
      system: await getSystemPrompt(context.lead),  // Load from /lib/agent/prompts/eva-system.md
      messages,
      tools: allTools,
      maxToolRoundtrips: 3,  // Allow up to 3 tool calls in conversation
      temperature: 0.7,
      abortSignal: AbortSignal.timeout(9000)  // 9s timeout
    });

    // 5. Validate guardrails BEFORE sending response
    const validation = validateGuardrails(result.text);
    if (!validation.safe) {
      console.error('[Guardrails] Violation detected:', validation.violations);

      // Fallback to safe response + handover
      return NextResponse.json({
        success: true,
        reply: 'Para ayudarte mejor con esto, te voy a transferir a un especialista. Un momento 💙',
        status: 'handover',
        handoverReason: `guardrail_violation: ${validation.violations.join(', ')}`,
        processingTime: `${((Date.now() - startTime) / 1000).toFixed(1)}s`
      });
    }

    // 6. Log message to DB
    await db.insert(messageLogs).values({
      conversationId,
      direction: 'outbound',
      sender: 'bot',
      text: result.text,
      toolCalls: result.toolCalls,  // Log which tools were called
      processingTime: Date.now() - startTime,
      createdAt: new Date()
    });

    // 7. Return response to Bird AI Employee
    return NextResponse.json({
      success: true,
      reply: result.text,
      status: context.requiresHuman ? 'handover' : 'active',
      handoverReason: context.handoverReason,
      processingTime: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
      toolCalls: result.toolCalls?.length || 0
    });

  } catch (error) {
    console.error('[Agent Inbound Error]', error);

    return NextResponse.json({
      success: false,
      error: error.message,
      code: error instanceof TimeoutError ? 'TIMEOUT' : 'PROCESSING_ERROR',
      processingTime: `${((Date.now() - startTime) / 1000).toFixed(1)}s`
    }, { status: error instanceof TimeoutError ? 408 : 500 });
  }
}
```

---

## Guardrails Implementation

**File:** `/lib/agent/guardrails.ts`

```typescript
import { z } from 'zod';

// Medical keywords that trigger violations
const DIAGNOSTIC_KEYWORDS = [
  'diagnóstico', 'diagnosis', 'tienes', 'padeces', 'sufres',
  'enfermedad', 'condición médica', 'síntoma de', 'parece que'
];

const PRESCRIPTION_KEYWORDS = [
  'deberías hacerte', 'te recomiendo procedimiento', 'necesitas cirugía',
  'debes operarte', 'requieres tratamiento', 'prescrib'
];

const RESULT_PROMISE_KEYWORDS = [
  'quedarás perfecta', 'eliminarás 100%', 'garantizo', 'seguro que',
  'sin duda obtendrás', 'resultados garantizados'
];

const PRICE_COMMITMENT_KEYWORDS = [
  'tu cirugía costará', 'el precio para ti es', 'te cobraré',
  'pagarás exactamente', 'costo final'
];

// Validation function
export function validateGuardrails(response: string): {
  safe: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  const lowerResponse = response.toLowerCase();

  // Check diagnostic language
  if (DIAGNOSTIC_KEYWORDS.some(kw => lowerResponse.includes(kw))) {
    violations.push('medical_diagnosis');
  }

  // Check prescription language
  if (PRESCRIPTION_KEYWORDS.some(kw => lowerResponse.includes(kw))) {
    violations.push('medical_prescription');
  }

  // Check result promises
  if (RESULT_PROMISE_KEYWORDS.some(kw => lowerResponse.includes(kw))) {
    violations.push('result_promise');
  }

  // Check price commitments
  if (PRICE_COMMITMENT_KEYWORDS.some(kw => lowerResponse.includes(kw))) {
    violations.push('price_commitment');
  }

  return {
    safe: violations.length === 0,
    violations
  };
}

// Post-conversation audit (weekly/daily batch job)
export async function auditConversation(conversationId: string): Promise<{
  compliant: boolean;
  violations: Array<{ messageId: string; type: string; excerpt: string }>;
}> {
  // Fetch all bot messages in conversation
  const messages = await db.select()
    .from(messageLogs)
    .where(
      and(
        eq(messageLogs.conversationId, conversationId),
        eq(messageLogs.sender, 'bot')
      )
    );

  const violations = [];

  for (const msg of messages) {
    const validation = validateGuardrails(msg.text);
    if (!validation.safe) {
      violations.push({
        messageId: msg.messageId,
        type: validation.violations.join(', '),
        excerpt: msg.text.slice(0, 100)  // First 100 chars
      });
    }
  }

  return {
    compliant: violations.length === 0,
    violations
  };
}
```

---

## Compliance & Privacy (Ley 1581/2012 Colombia)

### Consentimiento de Datos Sensibles

**Implementación en conversación:**

```typescript
// When user sends photo for first time
if (photoCount === 0 && !hasSensitiveDataConsent) {
  // Bot must request consent BEFORE processing
  const consentMessage = `
Para procesar tu foto con nuestro sistema de análisis, necesito tu consentimiento explícito para tratar datos sensibles (fotos médicas).

Los datos serán usados ÚNICAMENTE para:
- Evaluación de calidad técnica de la foto
- Coordinación con el Dr. Durán para tu valoración

¿Autorizas el tratamiento de tus datos sensibles? Responde SÍ o NO.
  `.trim();

  // Wait for user confirmation
  // If YES: record consent + process photo
  // If NO: inform can't proceed without consent
}
```

**Consent Record:**

```typescript
await db.insert(consents).values({
  leadId: lead.leadId,
  sensitiveDataOptIn: true,
  method: 'whatsapp_text',  // User typed "SÍ"
  policyVersion: 'v1.0',
  timestamp: new Date()
});
```

### Retención de Datos

- **Fotos:** NO almacenamos archivos. Solo procesamos en memoria y descartamos.
- **Metadata:** Almacenamos `{ type: 'image', processedAt, score }` en `message_logs.attachmentsMeta`
- **Transcripciones:** Almacenamos texto transcrito, NO archivo de audio
- **TTL:** 90 días para datos no asociados a cita confirmada. Indefinido para pacientes con cirugía (historia clínica, Resolución 839/2017)

### WhatsApp Business Policies

**24-Hour Service Window:**
- Bot puede responder LIBREMENTE dentro de 24h desde último mensaje del usuario
- Fuera de ventana: SOLO templates aprobadas por WhatsApp (utility category)

**Templates Requeridas (MVP v1.1):**
```
appointment_reminder_72h (utility)
appointment_reminder_24h (utility)
appointment_reminder_3h (utility)
post_consult_checkin (utility)
consent_sensitive_data (utility)
```

**Límites de Rate:**
- 250 mensajes/segundo por número de teléfono
- Implementar token bucket en `/lib/whatsapp/rate-limit.ts` (reuse existing pattern)

---

## Testing Strategy

### Local Testing (Without Bird)

```bash
# 1. Start dev server
pnpm dev

# 2. Test inbound endpoint directly
curl -X POST http://localhost:3000/api/agent/inbound \
  -H "Content-Type: application/json" \
  -d '{
    "context": {
      "conversationId": "test-uuid-123",
      "contactName": "Test Patient"
    }
  }'

# 3. Mock Neon DB responses with seed data
pnpm db:seed
```

### Integration Testing (With Bird Sandbox)

1. **Setup Bird Test Number:** Use Bird sandbox WhatsApp number
2. **Configure Webhook:** Point to `https://your-app.vercel.app/api/agent/inbound`
3. **Test Scenarios:**
   - Happy path: Info request → Data collection → Appointment
   - Photo upload: Send image → Get quality feedback
   - Price inquiry: Ask price → Escalation to human
   - Guardrails: Try to get diagnosis → Blocked + handover

### Audit Testing (Weekly)

```bash
# Run guardrails audit on all conversations
node scripts/audit-conversations.ts --from=2025-12-01 --to=2025-12-07

# Output:
# ✅ 1,234 conversations scanned
# ❌ 12 violations found
# - Conversation abc-123: medical_diagnosis (message msg-456)
# - Conversation def-789: price_commitment (message msg-101)
```

### Load Testing (Before Production)

```bash
# Simulate 100 concurrent users
artillery run artillery.yml

# Targets:
# - p95 latency < 10s
# - Error rate < 1%
# - Successful tool calls > 95%
```

---

## Deployment & Operations

### Environment Variables

```bash
# Neon Database
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neero?sslmode=require

# AI Services (Reuse from api-neero)
AI_GATEWAY_API_KEY=xxx          # Vercel AI Gateway (Gemini)
GROQ_API_KEY=xxx                # Groq Whisper v3
OPENAI_API_KEY=xxx              # OpenAI Whisper fallback

# Bird Integration (Reuse from api-neero)
BIRD_ACCESS_KEY=xxx             # Bird API authentication
BIRD_WORKSPACE_ID=xxx           # Bird workspace UUID
BIRD_CHANNEL_ID=xxx             # WhatsApp channel (optional, can override)

# Agent Config
NEERO_API_KEY=xxx               # API key for Bird to call /api/agent/inbound
HANDOVER_WEBHOOK_URL=xxx        # Notify coordinators on escalation
LEADS_WEBHOOK_URL=xxx           # Log leads to CRM

# Feature Flags
ENABLE_PHOTO_PROCESSING=true
ENABLE_AUDIO_PROCESSING=true
ENABLE_APPOINTMENT_BOOKING=false  # MVP: disabled, v1.1: enabled
```

### Vercel Deployment

```bash
# 1. Link to Vercel project
vercel link

# 2. Set environment variables
vercel env add DATABASE_URL production
vercel env add AI_GATEWAY_API_KEY production
# ... (all vars)

# 3. Deploy
vercel --prod

# 4. Run migrations (Drizzle)
pnpm drizzle-kit push:pg
```

### Monitoring & Alerts

**Structured Logging:**

```typescript
console.log(JSON.stringify({
  type: 'agent_inbound_start',
  conversationId,
  timestamp: new Date().toISOString()
}));

console.log(JSON.stringify({
  type: 'agent_inbound_success',
  conversationId,
  toolCalls: result.toolCalls?.length || 0,
  processingTime: Date.now() - startTime,
  model: 'gemini-2.0-flash'
}));
```

**Metrics Dashboard (Future):**
- Conversions: lead → appointment (weekly)
- Handovers: by reason (pricing, medical, etc.)
- Tool usage: which tools most called
- Latency: p50, p95, p99
- Guardrails: violations detected

---

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Medical advice leakage** | CRITICAL | Medium | Pre-send guardrails validation + weekly audit + override with safe response + handover |
| **WhatsApp template violations** | HIGH | Low | Hard gate in sendMessageTool (check window BEFORE sending) |
| **Timeout >10s** | MEDIUM | Medium | Graceful degradation: return partial response + create ticket for human follow-up |
| **Neon connection timeout** | LOW | Low | HTTP client (no cold start), exponential backoff retry, fallback to error response |
| **Tool execution failure** | MEDIUM | Medium | Wrap all tool calls in try-catch, log error, return safe fallback + handover |
| **Consent not obtained** | HIGH | Medium | Block photo processing if no consent, request explicitly before first photo |
| **Bird API rate limit** | LOW | Low | Implement token bucket rate limiter (250 msg/sec limit) |
| **Hallucination (price, medical)** | HIGH | Medium | Guardrails catch price commitments, medical advice → auto-handover |

---

## Success Criteria (Go/No-Go for Production)

### Technical Criteria

- [x] p95 latency < 10s in staging
- [x] 0 guardrails violations in 100-conversation test
- [x] 0 messages sent outside 24h window without template
- [x] 100% tool executions logged
- [x] Database migrations run successfully
- [x] All environment variables configured
- [x] Health check endpoint returns 200

### Functional Criteria

- [x] Lead can complete full journey: info → data collection → (handover for booking)
- [x] Photo quality analysis works end-to-end (consent → analyze → feedback)
- [x] Audio transcription works with fallback (Groq → OpenAI)
- [x] Handover creates ticket with structured context
- [x] Bird Contact updated after upsertLead
- [x] Conversation context persists across messages

### Compliance Criteria

- [x] Explicit consent requested before photo processing
- [x] No medical diagnosis in any bot response (audit 100 convos)
- [x] No price commitments without specialist involvement
- [x] Warm handoff message used for all escalations
- [x] Data retention policy documented (90 days TTL)

### Operational Criteria

- [x] Coordinator training completed (2 hours)
- [x] Incident response runbook created
- [x] Monitoring dashboard configured
- [x] Weekly audit script tested
- [x] Rollback plan documented

---

## Timeline & Milestones

### MVP v1.0 (4 Semanas)

**Week 1: Infraestructura & DB**
- [x] Neon PostgreSQL setup + schema
- [x] Drizzle ORM integration
- [x] Type definitions (/lib/agent/types.ts)
- [x] Context reconstruction (/lib/agent/conversation.ts)

**Week 2: Tools & Multimodal**
- [x] 6 tools implementation
- [x] Photo quality analysis (reuse lib/ai/)
- [x] Audio transcription (reuse lib/ai/)
- [x] Guardrails validation

**Week 3: Conversational AI**
- [x] System prompt (eva-system.md)
- [x] generateText integration
- [x] Tool calling orchestration
- [x] Error handling

**Week 4: Testing & Deployment**
- [x] Local testing (mocked DB)
- [x] Bird integration testing (sandbox)
- [x] Staging deployment
- [x] 100-conversation audit
- [x] Production deployment

### v1.1 (Semanas 5-6)

**Week 5: Appointment Management**
- [ ] Google Calendar API integration
- [ ] Create/update appointment tools
- [ ] Timezone handling (America/Bogota)
- [ ] Double-booking prevention

**Week 6: Recordatorios & Templates**
- [ ] Vercel Cron Jobs setup (5 jobs)
- [ ] WhatsApp templates creation & approval
- [ ] Template rendering logic
- [ ] Confirmation tracking

### v1.2 (Semanas 7-8)

**Week 7: Personalización**
- [ ] Procedure-specific photo kits
- [ ] Pre-op checklists by procedure
- [ ] Contextual FAQs

**Week 8: Métricas & Optimización**
- [ ] Dashboard interno (Grafana/Vercel Analytics)
- [ ] A/B testing framework
- [ ] Reputation management flow
- [ ] Performance optimization

---

## Appendix

### A. Bird AI Employee Configuration

See `/docs/bird/bird-ai-employees-setup-guide.md` for complete 45-60 min setup.

**Quick Reference:**

**Personality:**
- Purpose: "Asistente virtual para cirugía plástica Dr. Andrés Durán"
- Tasks: Data collection, photo quality, appointment coordination, handover
- Tone: Warm, professional, Spanish, patient-first

**Actions:**
- Name: `process_media`
- URL: `https://api.neero.ai/api/agent/inbound`
- Method: POST
- Headers: `X-API-Key: {{env.NEERO_API_KEY}}`
- Body: `{ "context": { "conversationId": "{{conversationId}}", "contactName": "{{contact.name}}" } }`

### B. Cost Projections

**Assumptions:** 1,000 conversations/month

| Component | Usage | Cost/Unit | Monthly Cost |
|-----------|-------|-----------|--------------|
| Gemini 2.0 Flash (conversation) | 1,000 calls × 10K tokens | $0.075/1M input | $0.75 |
| Gemini 2.0 Flash (photo analysis) | 300 photos | $0.17/1K images | $0.05 |
| Groq Whisper (audio) | 100 audios × 1 min avg | $0.67/1K min | $0.07 |
| Neon PostgreSQL | 0.2GB storage, 50h compute | Free tier | $0.00 |
| Vercel Edge Functions | 1M requests, 1GB bandwidth | Free tier | $0.00 |
| **Total** | | | **$0.87/month** |

**vs. Claude-based alternative:**
- Claude Opus 4: $15/1M tokens input = $150/month for same usage
- **Savings:** 99.4% ($149.13/month)

### C. Glossary

- **Bird AI Employee:** Conversational AI agent configured in Bird.com platform
- **Bird Actions:** HTTP endpoints that Bird AI Employee calls (vs webhooks)
- **Conversation Context:** Last 10 messages + lead data + state
- **Guardrails:** Pre-send validation to prevent medical/legal violations
- **Handover:** Escalation from bot to human agent with structured context
- **Service Window:** WhatsApp 24-hour window for free-form messaging
- **Template:** Pre-approved WhatsApp message format for out-of-window sending
- **Tool Calling:** AI's ability to execute functions (analyzePhoto, upsertLead, etc.)
- **Valoración:** Medical evaluation/consultation before surgery
- **Modality:** Type of consultation (presencial, virtual, pre-consulta)

---

**Document Version:** 2.0
**Last Updated:** 2025-12-14
**Author:** Neero.ai Technical Team
**Status:** Production Ready
**Next Review:** 2025-12-28 (post-MVP launch)
