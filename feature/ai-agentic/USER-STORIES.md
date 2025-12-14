# USER-STORIES.md

**Version:** 1.0 | **Date:** 2025-12-14 12:50 | **Owner:** Neero AI Team | **Status:** Active

---

## Alcance

User stories para Eva, AI Employee conversacional para consultas de cirugía plástica vía WhatsApp.

**Datos de Validación:**
- 1,106 conversaciones analizadas (2024-10-01 a 2024-11-30)
- 10,764 mensajes procesados
- 4 personas validadas: Lead, Paciente, Coordinador, Cirujano
- Estado implementación: 80% completo (v1.0 fases 1-4 DONE)

**Versiones:**
- v1.0 MVP: 6 stories (DONE)
- v1.1 Proactive: 3 stories (TODO)
- v1.2 Advanced: 2 stories (DEFER)

---

## Índice de Stories

| ID | Versión | Persona | Feature | Prioridad | Esfuerzo | Estado |
|----|---------|---------|---------|-----------|----------|--------|
| US-1.0-01 | v1.0 | Lead | Recolección datos 1 mensaje | Alta | 3h | DONE |
| US-1.0-02 | v1.0 | Lead | Handover precio a coordinador | Alta | 2h | DONE |
| US-1.0-03 | v1.0 | Lead | Triage ubicación Bogotá/otros | Alta | 2h | DONE |
| US-1.0-04 | v1.0 | Lead | Análisis foto con Gemini | Media | 4h | DONE |
| US-1.0-05 | v1.0 | Lead | Transcripción audio Whisper | Media | 3h | DONE |
| US-1.0-06 | v1.0 | Todos | Guardrails compliance | Alta | 5h | DONE |
| US-1.1-01 | v1.1 | Lead | CTA cierre conversación | Alta | 6h | TODO |
| US-1.1-02 | v1.1 | Lead | Explicación proactiva precio/valor | Alta | 8h | TODO |
| US-1.1-03 | v1.1 | Lead | Ubicación dinámica 8 ciudades | Media | 6h | TODO |
| US-1.2-01 | v1.2 | Paciente | Agendamiento citas | Media | 12h | DEFER |
| US-1.2-02 | v1.2 | Paciente | Links de pago | Baja | 10h | DEFER |

**Total Esfuerzo:** v1.0 (19h DONE) | v1.1 (20h TODO) | v1.2 (22h DEFER)

---

## v1.0 MVP (DONE)

### US-1.0-01: Recolección Datos en 1 Mensaje

**ID:** US-1.0-01 | **Prioridad:** Alta | **Esfuerzo:** 3h | **Estado:** DONE

**Como** Lead quirúrgico interesado en procedimiento
**Quiero** que el bot recolecte mis datos básicos en 1 solo mensaje
**Para** obtener respuesta rápida del coordinador sin múltiples intercambios

**Criterios de Aceptación:**
- [x] Solicita 5 campos: nombre, edad, ciudad, procedimiento, contacto
- [x] Acepta respuestas en formato libre o estructurado
- [x] 60% completan en 1 mensaje (664/1,106 validado)
- [x] Guarda datos estructurados en tabla `leads` para coordinador

**Métricas de Éxito:**
- Tiempo recolección: <2 min (vs 5-8 min manual)
- Tasa completitud primer mensaje: 60%
- Datos en CRM: 100% casos exitosos

**Referencia:** PRD.md F001, plan.md Phase 1, decisions.md "Data Collection"

---

### US-1.0-02: Handover Precio a Coordinador

**ID:** US-1.0-02 | **Prioridad:** Alta | **Esfuerzo:** 2h | **Estado:** DONE

**Como** Lead que pregunta "¿Cuánto cuesta?"
**Quiero** que el bot escale inmediatamente a coordinador
**Para** obtener presupuesto personalizado sin frustración

**Criterios de Aceptación:**
- [x] Detecta keywords: "precio", "cuánto", "costo", "valor", "$"
- [x] Escala a coordinador con contexto completo
- [x] 50% preguntan precio (553/1,106 validado)
- [x] Template respuesta: "Te conecto con coordinador para presupuesto personalizado"

**Métricas de Éxito:**
- Escalación pricing: 100% casos detectados
- Tiempo respuesta coordinador: <30 min promedio
- Satisfacción: Sin mensajes de frustración

**Referencia:** PRD.md F002, decisions.md "Price Inquiry Handover"

---

### US-1.0-03: Triage Ubicación Bogotá/Otros

**ID:** US-1.0-03 | **Prioridad:** Alta | **Esfuerzo:** 2h | **Estado:** DONE

**Como** Lead que pregunta ubicación
**Quiero** respuesta específica de clínica en mi ciudad
**Para** saber si el servicio está disponible cerca de mí

**Criterios de Aceptación:**
- [x] Detecta ciudad en mensaje usuario
- [x] Responde con dirección específica si Bogotá
- [x] Escala a coordinador si otra ciudad
- [x] 28% preguntan ubicación (310/1,106 validado)

**Métricas de Éxito:**
- Detección ciudad: 95% accuracy
- Respuesta Bogotá: Automática con dirección completa
- Otras ciudades: Escalación a coordinador

**Referencia:** PRD.md F003, decisions.md "Location Triage"

---

### US-1.0-04: Análisis Foto con Gemini

**ID:** US-1.0-04 | **Prioridad:** Media | **Esfuerzo:** 4h | **Estado:** DONE

**Como** Lead que envía foto de zona a intervenir
**Quiero** que el bot analice calidad y relevancia de la imagen
**Para** asegurar que el cirujano tiene información útil

**Criterios de Aceptación:**
- [x] Procesa imágenes vía Gemini 2.0 Flash
- [x] Valida: iluminación, enfoque, área visible
- [x] Guarda análisis en tabla `message_logs`
- [x] Reutiliza pipeline `/lib/ai` (image routing)

**Métricas de Éxito:**
- Latencia análisis: p95 <5s
- Calidad detectada: 3 niveles (buena/regular/mala)
- Reuso código: 100% pipeline multimodal existente

**Referencia:** PRD.md F004, plan.md Phase 2, `/lib/ai/classify.ts`

---

### US-1.0-05: Transcripción Audio Whisper

**ID:** US-1.0-05 | **Prioridad:** Media | **Esfuerzo:** 3h | **Estado:** DONE

**Como** Lead que envía nota de voz en español
**Quiero** que el bot transcriba mi audio
**Para** que el coordinador tenga registro escrito de mi consulta

**Criterios de Aceptación:**
- [x] Procesa audio con Groq Whisper v3 (primary)
- [x] Fallback a OpenAI Whisper si Groq falla
- [x] Optimizado para español (idioma primario LATAM)
- [x] Guarda transcripción en `message_logs`

**Métricas de Éxito:**
- Latencia: p95 <8s (Groq) | <12s (OpenAI)
- Accuracy español: >95%
- Fallback rate: <5%

**Referencia:** PRD.md F005, `/lib/ai/transcribe.ts`

---

### US-1.0-06: Guardrails Compliance

**ID:** US-1.0-06 | **Prioridad:** Alta | **Esfuerzo:** 5h | **Estado:** DONE

**Como** Clínica quirúrgica regulada
**Quiero** que el bot cumpla guardrails de seguridad
**Para** evitar riesgos legales, médicos y reputacionales

**Criterios de Aceptación:**
- [x] Detecta emergencias P0 (sangrado, dolor extremo) → Escalación inmediata
- [x] Bloquea advice médico (diagnósticos, tratamientos)
- [x] No compromete precios (solo coordinador autorizado)
- [x] Valida consentimiento datos (GDPR/Ley 1581)
- [x] 100% logging en Supabase: conversationId, reason_code, risk_flags

**Métricas de Éxito:**
- Guardrails violations: 0
- Emergencias detectadas: 100% escalación <30s
- Compliance audit: 100% pass

**Referencia:** PRD.md F006, AI-AGENTIC-GUIDE.md "Safety Policy"

---

## v1.1 Proactive (TODO)

### US-1.1-01: CTA Cierre Conversación

**ID:** US-1.1-01 | **Prioridad:** Alta | **Esfuerzo:** 6h | **Estado:** TODO

**Como** Lead quirúrgico que completó el formulario
**Quiero** recibir confirmación clara de cierre y próximos pasos
**Para** saber que mi solicitud fue procesada y cuándo esperar respuesta

**Contexto del Problema:**
- **Dato validado:** 95% conversaciones terminan sin closure (1,051/1,106)
- **Impacto:** Usuarios quedan en incertidumbre sobre estado de solicitud
- **Evidencia:** 0 mensajes de cierre encontrados en análisis completo
- **Oportunidad:** Reducir ansiedad y preguntas repetidas "¿Y ahora qué?"

**Criterios de Aceptación:**

| Escenario | Dado | Cuando | Entonces |
|-----------|------|--------|----------|
| Datos completos | Usuario envió 5/5 campos requeridos | Bot valida completitud | Envía: "Recibimos tu información sobre {procedimiento}. Un coordinador te contactará en máximo 24 horas." |
| Datos parciales | Usuario envió 3/5 campos | Bot detecta campos faltantes | Solicita faltantes ANTES de enviar CTA closure |
| Post-escalación | Usuario pidió hablar con coordinador | Bot ejecutó handover | Envía: "Te conectamos con coordinador. Espera 2-5 minutos." |
| Fuera de horario | Usuario escribe después de 6pm | Bot detecta timestamp | Envía: "Recibimos tu solicitud. Coordinador responderá mañana 9am-6pm." |

**Implementación Técnica:**

```typescript
// lib/agent/actions/send-closure-cta.ts
interface ClosureCTAParams {
  conversationId: string;
  scenario: 'complete' | 'escalated' | 'after_hours';
  collectedFields: string[];
}

async function sendClosureCTA(params: ClosureCTAParams) {
  const messages = {
    complete: "Recibimos tu información sobre {procedimiento}. Un coordinador te contactará en máximo 24 horas.",
    escalated: "Te conectamos con coordinador. Tiempo estimado: 2-5 minutos.",
    after_hours: "Recibimos tu solicitud. Horario: 9am-6pm. Te contactaremos mañana."
  };

  await sendWhatsAppMessage(params.conversationId, messages[params.scenario]);
  await logEvent('closure_cta_sent', { scenario: params.scenario });
}
```

**Métricas de Éxito:**

| Métrica | Baseline | Target v1.1 | Target v1.2 | Validación |
|---------|----------|-------------|-------------|------------|
| Conversaciones con closure | 5% (55) | 20% (+300%) | 50% (+900%) | Supabase logs |
| Satisfacción post-bot | 7/10 | 8/10 | 9/10 | Encuesta NPS |
| Preguntas "¿Y ahora qué?" | 15% | 6% (-60%) | 3% (-80%) | Message analysis |

**Dependencias:**
- PRD.md Feature F007 (Proactive Closure CTA)
- decisions.md "Proactive Messaging Strategy"
- plan.md Phase 5 (v1.1 Proactive Features)
- POLICY_GUARDRAILS.md Rule 3 (WhatsApp 24h window compliance)

**Riesgos:**
- WhatsApp 24h window: Si >24h desde último mensaje usuario, bot NO puede enviar
- Mitigación: Validar timestamp antes de enviar, log warning si outside window

**Validación QA:**
- [ ] Test con 4 escenarios en staging (complete/partial/escalated/after_hours)
- [ ] Verificar logging 100% eventos en conversation_logs
- [ ] Confirmar compliance WhatsApp 24h window
- [ ] User testing con 10 conversaciones reales

---

### US-1.1-02: Explicación Proactiva Precio/Valor

**ID:** US-1.1-02 | **Prioridad:** Alta | **Esfuerzo:** 8h | **Estado:** TODO

**Como** Lead quirúrgico antes de preguntar precio
**Quiero** que el bot explique factores de costo proactivamente
**Para** entender valor y evitar sorpresa de presupuesto

**Contexto del Problema:**
- **Dato validado:** 50% preguntan precio inmediatamente (553/1,106)
- **Impacto:** Fricción en conversación, escalación prematura
- **Evidencia:** Pregunta #1 en 60% de casos donde aparece pricing
- **Oportunidad:** Educar sobre valor antes de escalación

**Criterios de Aceptación:**

| Escenario | Dado | Cuando | Entonces |
|-----------|------|--------|----------|
| Primera mención procedimiento | Usuario dice "quiero rinoplastia" | Bot detecta procedimiento | Incluye en respuesta: "El costo varía según complejidad. Coordinador te dará presupuesto personalizado tras evaluación." |
| Pregunta directa precio | Usuario dice "¿cuánto cuesta?" | Bot detecta keyword pricing | Responde: "El precio depende de: experiencia cirujano, tipo anestesia, tiempo quirófano. Rango general: {min-max}. Coordinador te da presupuesto exacto." |
| Comparación precios | Usuario dice "en otra clínica cuesta X" | Bot detecta comparación | Explica: "Nuestro precio refleja: cirujano certificado, clínica acreditada, seguimiento 1 año. Coordinador explica diferencias." |

**Implementación Técnica:**

```typescript
// lib/agent/prompts/pricing-education.ts
const pricingExplanation = {
  factors: [
    "Experiencia y certificación del cirujano",
    "Tipo de anestesia (local/general)",
    "Tiempo de quirófano y complejidad",
    "Seguimiento post-operatorio incluido"
  ],
  ranges: {
    rinoplastia: "COP $8M - $15M",
    aumento_mamas: "COP $12M - $18M",
    liposuccion: "COP $6M - $12M"
  },
  template: "El costo de {procedimiento} varía según complejidad. Factores: {factors}. Rango general: {range}. Un coordinador te dará presupuesto personalizado."
};

function generatePricingResponse(procedimiento: string): string {
  return pricingExplanation.template
    .replace('{procedimiento}', procedimiento)
    .replace('{factors}', pricingExplanation.factors.slice(0, 2).join(', '))
    .replace('{range}', pricingExplanation.ranges[procedimiento] || 'variable');
}
```

**Métricas de Éxito:**

| Métrica | Baseline | Target v1.1 | Target v1.2 | Validación |
|---------|----------|-------------|-------------|------------|
| Preguntan precio SIN datos | 47% (261) | 35% (-25%) | 25% (-47%) | Message analysis |
| Entienden factores costo | 10% | 50% (+400%) | 70% (+600%) | Encuesta comprensión |
| Proceden a evaluación | 30% | 45% (+50%) | 60% (+100%) | Conversion funnel |

**Dependencias:**
- PRD.md Feature F008 (Proactive Pricing Education)
- decisions.md "Price/Value Explanation Strategy"
- plan.md Phase 5 (v1.1 Proactive Features)
- Coordinador approval: Rangos de precio autorizados para cada procedimiento

**Riesgos:**
- Compliance pricing: NO comprometer precio exacto (solo coordinador autorizado)
- Mitigación: Usar rangos amplios + disclaimer "coordinador da presupuesto exacto"

**Validación QA:**
- [ ] Legal review: Rangos pricing compliance
- [ ] A/B test: Con/sin explicación proactiva (100 conversaciones cada grupo)
- [ ] Medir: % que preguntan precio después de explicación vs control
- [ ] Coordinador feedback: ¿Leads más educados sobre pricing?

---

### US-1.1-03: Ubicación Dinámica 8 Ciudades

**ID:** US-1.1-03 | **Prioridad:** Media | **Esfuerzo:** 6h | **Estado:** TODO

**Como** Lead de cualquier ciudad colombiana principal
**Quiero** que el bot me diga si hay clínica en mi ciudad
**Para** saber disponibilidad geográfica sin esperar coordinador

**Contexto del Problema:**
- **Dato validado:** 28% preguntan ubicación primero (310/1,106)
- **Impacto actual:** Solo Bogotá tiene respuesta automática, otras ciudades escalan
- **Evidencia:** Distribución ciudades: Bogotá 60%, Medellín 15%, Cali 10%, otras 15%
- **Oportunidad:** Expandir cobertura automática a 8 ciudades principales

**Criterios de Aceptación:**

| Ciudad | Dado | Cuando | Entonces |
|--------|------|--------|----------|
| Bogotá | Usuario de Bogotá | Pregunta ubicación | "Clínica en Chapinero: Cra 7 #71-21 Torre B Piso 5. Horario: Lun-Vie 9am-6pm, Sáb 9am-1pm." |
| Medellín | Usuario de Medellín | Pregunta ubicación | "Clínica en El Poblado: Cra 43A #5-33. Horario: Lun-Vie 9am-6pm." |
| Cali | Usuario de Cali | Pregunta ubicación | "Atendemos pacientes de Cali. Coordinador te contacta para agendar valoración. ¿Prefieres videollamada o visita presencial?" |
| Otras 5 ciudades | Usuario de Barranquilla, Cartagena, Bucaramanga, Pereira, Santa Marta | Pregunta ubicación | "Atendemos pacientes de {ciudad}. Coordinador te explica opciones: videollamada inicial o referencia a cirujano certificado en tu ciudad." |
| Ciudad no cubierta | Usuario de otra ciudad | Pregunta ubicación | "Nuestras clínicas están en Bogotá y Medellín. ¿Te interesa valoración por videollamada o viajar?" |

**Implementación Técnica:**

```typescript
// lib/agent/data/locations.ts
const clinicLocations = {
  bogota: {
    hasPhysicalClinic: true,
    address: "Cra 7 #71-21 Torre B Piso 5, Chapinero",
    hours: "Lun-Vie 9am-6pm, Sáb 9am-1pm",
    phone: "+57 601 234 5678"
  },
  medellin: {
    hasPhysicalClinic: true,
    address: "Cra 43A #5-33, El Poblado",
    hours: "Lun-Vie 9am-6pm",
    phone: "+57 604 567 8901"
  },
  cali: {
    hasPhysicalClinic: false,
    serviceOptions: ["videoconsulta", "visita_presencial"],
    message: "Atendemos pacientes de Cali. ¿Prefieres videollamada o visita presencial?"
  }
  // ... 5 ciudades adicionales
};
```

**Métricas de Éxito:**

| Métrica | Baseline | Target v1.1 | Target v1.2 | Validación |
|---------|----------|-------------|-------------|------------|
| Preguntas ubicación sin respuesta | 28% (310) | 20% (-29%) | 15% (-46%) | Message analysis |
| Cobertura automática ciudades | 1 ciudad | 8 ciudades | 15 ciudades | Location data |
| Satisfacción respuesta ubicación | 6/10 | 8/10 | 9/10 | Encuesta NPS |

**Dependencias:**
- PRD.md Feature F009 (Dynamic Location Prompts)
- decisions.md "Location Triage Expansion"
- plan.md Phase 5 (v1.1 Proactive Features)
- Coordinador input: Ciudades con cobertura confirmada + opciones servicio

**Riesgos:**
- Datos desactualizados: Direcciones o horarios cambian
- Mitigación: Archivo `/lib/agent/data/locations.ts` editable, review trimestral

**Validación QA:**
- [ ] Validar datos 8 ciudades con coordinador
- [ ] Test detección ciudad: 95% accuracy (NLP o keywords)
- [ ] Verificar response templates en español natural
- [ ] User testing: 5 conversaciones por ciudad

---

## v1.2 Advanced (DEFER)

### US-1.2-01: Agendamiento Citas

**ID:** US-1.2-01 | **Prioridad:** Media | **Esfuerzo:** 12h | **Estado:** DEFER

**Como** Paciente que recibió presupuesto aprobado
**Quiero** agendar mi cita directamente desde WhatsApp
**Para** confirmar fecha sin necesidad de llamadas o emails adicionales

**Criterios de Aceptación:**
- [ ] Integración con Google Calendar del cirujano
- [ ] Propone 3 slots disponibles en próximos 7-14 días
- [ ] Confirmación automática vía WhatsApp + Calendar invite
- [ ] Recordatorios 48h y 24h antes de cita
- [ ] Maneja reagendamiento (1 cambio gratis, >1 requiere coordinador)

**Métricas de Éxito:**
- Target: 30% Leads agendan directamente (vs 0% actual)
- Reducción no-shows: 15% → 8%
- Tiempo coordinador: -45 min/semana

**Razón DEFER:** Requiere validación ROI (costo desarrollo vs ahorro coordinador) + integración externa Calendar API

**Referencia:** PRD.md F010, plan.md Phase 6 (v1.2 defer), decisions.md "Advanced Automation"

---

### US-1.2-02: Links de Pago

**ID:** US-1.2-02 | **Prioridad:** Baja | **Esfuerzo:** 10h | **Estado:** DEFER

**Como** Paciente que confirmó cita
**Quiero** pagar anticipo directamente vía link de pago
**Para** asegurar mi cupo sin ir a clínica o transferencia manual

**Criterios de Aceptación:**
- [ ] Integración con pasarela de pago (Wompi, PayU, Mercado Pago)
- [ ] Genera link de pago personalizado (monto, concepto, vencimiento)
- [ ] Confirma pago automáticamente en CRM
- [ ] Envía recibo electrónico vía WhatsApp

**Métricas de Éxito:**
- Target: 50% pagan anticipo vía link (vs 0% actual)
- Reducción tiempo confirmación: 24h → 2h
- Conversión Lead→Paciente: +15%

**Razón DEFER:** Requiere decisión proveedor pago + compliance PCI-DSS + testing seguridad

**Referencia:** PRD.md F011, plan.md Phase 6 (v1.2 defer), decisions.md "Payment Automation"

---

## Requisitos Técnicos (Todos los Stories)

| Requisito | Especificación | Validación |
|-----------|----------------|------------|
| **Latencia** | p95 <10s | Vercel Edge Logs + Supabase query logs |
| **Logging** | 100% eventos en Supabase | Tabla `conversation_logs` + `message_logs` |
| **WhatsApp Compliance** | Respuesta dentro ventana 24h | POLICY_GUARDRAILS.md Rule 3 |
| **Error Handling** | Graceful degradation + human fallback | Try/catch blocks + escalation automática |
| **Type Safety** | TypeScript strict mode | `tsc --noEmit` en CI/CD pipeline |
| **Edge Runtime** | Web APIs only, no Node.js modules | Vercel Edge Functions deployment check |

**Nota:** Todos los stories cumplen con requisitos técnicos estándar listados arriba.
Ver `/docs/architecture.md` y `AI-AGENTIC-GUIDE.md` para detalles completos.

---

## Referencias Cruzadas

| Documento | Sección | Relación con Stories |
|-----------|---------|---------------------|
| **PRD.md** | Features F001-F011 | Mapeo 1:1 Feature → Story |
| **plan.md** | Phases 1-6 | Agrupación por versión (v1.0-v1.2) |
| **decisions.md** | 9 IMPLEMENT decisions | Criterios aceptación + effort estimates |
| **AI-AGENTIC-GUIDE.md** | Tool contracts, guardrails, testing | Requisitos técnicos + QA validation |

**Datos de Validación:**
- 1,106 conversaciones analizadas (2024-10-01 a 2024-11-30)
- 10,764 mensajes procesados
- 4 personas validadas: Lead, Paciente, Coordinador, Cirujano
- 80% implementación completada (v1.0 fases 1-4 DONE)

---

**Última Actualización:** 2025-12-14 12:50
**Próxima Revisión:** 2025-12-18 (post-MVP production deployment)
