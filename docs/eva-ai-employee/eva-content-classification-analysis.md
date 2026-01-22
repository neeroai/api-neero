# Eva Valoración: Análisis de Clasificación de Contenido

**Version:** 1.0 | **Date:** 2025-12-20 20:00 | **Purpose:** Fase 1 - Clasificar contenido estático vs dinámico

---

## Resumen Ejecutivo

**Total de tokens en Additional Instructions:** ~9,000 tokens

**Clasificación:**
- **DINÁMICO (mantener):** ~4,000 tokens (44%)
- **ESTÁTICO (mover a KB):** ~5,000 tokens (56%)

**Reducción esperada:** -56% tokens de contexto en Additional Instructions

---

## Metodología de Clasificación

### DINÁMICO = MANTENER en Additional Instructions
- Flujos de conversación con lógica condicional
- Macros de tratamientos populares (top 3)
- Casos edge complejos
- Frameworks de comportamiento (empatía, safety)
- Integraciones con actions

### ESTÁTICO = MOVER a Knowledge Base
- Descripciones de procedimientos (texto fijo)
- Información de ubicaciones (direcciones, horarios)
- FAQs estáticas (sin lógica condicional)
- Políticas y procesos (texto informativo)
- Datos de contacto de terceros

---

## Análisis Sección por Sección

### ✅ DINÁMICO - MANTENER (4,000 tokens estimados)

#### **1. Saludo inicial**
- **Líneas:** 88-90
- **Tokens:** ~80
- **Razón:** Flujo dinámico (diferencia WhatsApp vs Instagram)
- **Decisión:** MANTENER

#### **2. Respuesta a solicitud de información general**
- **Líneas:** 93-95
- **Tokens:** ~60
- **Razón:** Flujo de indagación
- **Decisión:** MANTENER

#### **3. ACTUALIZACIÓN DE DATOS DE CONTACTO**
- **Líneas:** 97-137
- **Tokens:** ~800
- **Razón:** Flujo complejo con action, validaciones, manejo de errores
- **Decisión:** MANTENER (crítico para integración)

#### **4. Indagación sobre intereses**
- **Líneas:** 139-140
- **Tokens:** ~40
- **Razón:** Flujo de conversación
- **Decisión:** MANTENER

#### **8. Información consulta virtual**
- **Líneas:** 153-154
- **Tokens:** ~80
- **Razón:** Flujo con contexto dinámico
- **Decisión:** MANTENER

#### **7.1 Cliente no está de acuerdo con precio**
- **Líneas:** 156-157
- **Tokens:** ~60
- **Razón:** Flujo de manejo de objeción + link
- **Decisión:** MANTENER

#### **7.2 Flujo de Manejo de Precios**
- **Líneas:** 159-174
- **Tokens:** ~250
- **Razón:** Flujo crítico para reducir abandono (47% → 35-40%)
- **Decisión:** MANTENER (P1 - High Quality)

#### **7.3 Flujo de Calificación por Ubicación** (PARCIAL)
- **Líneas:** 176-192
- **Tokens:** ~280
- **Razón:** Flujo de calificación + manejo de objeciones
- **Decisión:** MANTENER el flujo, mover direcciones a KB

#### **9. Solicitar datos personales (FORMATO OPTIMIZADO)**
- **Líneas:** 194-213
- **Tokens:** ~300
- **Razón:** Flujo optimizado (19% → 30%+ data capture)
- **Decisión:** MANTENER (P1 - High Quality)

#### **10.1 Marco de Empatía**
- **Líneas:** 217-234
- **Tokens:** ~280
- **Razón:** Framework de comportamiento con ejemplos
- **Decisión:** MANTENER (P1 - High Quality)

#### **11.1 Macros de Tratamientos Populares**
- **Líneas:** 375-386
- **Tokens:** ~200
- **Razón:** Macros optimizados para top 3 (Enzimas 20%, Deep Slim 7%, Hydrafacial 7%)
- **Decisión:** MANTENER (P1 - High Quality)

#### **11. Redirigir a agente casos específicos**
- **Líneas:** 388-390
- **Tokens:** ~80
- **Razón:** Flujo de escalación
- **Decisión:** MANTENER

#### **12. NO proporcionar precios**
- **Líneas:** 392-394
- **Tokens:** ~60
- **Razón:** Flujo de manejo de precios
- **Decisión:** MANTENER

#### **13. No hablar de competencia**
- **Líneas:** 396-398
- **Tokens:** ~80
- **Razón:** Flujo de redirección
- **Decisión:** MANTENER

#### **14. Transferencia para agendamiento**
- **Líneas:** 400-401
- **Tokens:** ~60
- **Razón:** Flujo con recolección de datos
- **Decisión:** MANTENER

#### **15. Información fines de semana**
- **Líneas:** 403-404
- **Tokens:** ~40
- **Razón:** Flujo de transferencia
- **Decisión:** MANTENER

#### **16. Referencia a The Spa**
- **Líneas:** 406-408
- **Tokens:** ~50
- **Razón:** Flujo de redirección + contacto
- **Decisión:** MANTENER (contacto es dato fijo pero flujo es dinámico)

#### **17. Medios de pago**
- **Líneas:** 410-411
- **Tokens:** ~60
- **Razón:** Flujo de transferencia
- **Decisión:** MANTENER

#### **17.1 Cierre Proactivo de Conversación**
- **Líneas:** 413-428
- **Tokens:** ~280
- **Razón:** Flujo crítico (5% → 95%+ proactive closure)
- **Decisión:** MANTENER (P1 - High Quality)

#### **18. Gestión de Consentimiento Multimedia**
- **Líneas:** 430-457
- **Tokens:** ~500
- **Razón:** Flujo compliance Ley 1581/2012 (crítico legal)
- **Decisión:** MANTENER (P0 - Safety/Legal)

**TOTAL DINÁMICO:** ~4,000 tokens

---

### ⚠️ ESTÁTICO - MOVER A KNOWLEDGE BASE (5,000 tokens estimados)

#### **5. Modalidades de consulta de valoración**
- **Líneas:** 142-150
- **Tokens:** ~250
- **Razón:** Descripciones estáticas de modalidades (presencial, virtual, PRE-CONSULTA)
- **Decisión:** MOVER a `faqs.md`
- **KB Section:** "Modalidades de Valoración"

#### **6. Información consulta presencial Barranquilla**
- **Líneas:** 148-150 (dentro de sección 5)
- **Tokens:** ~150
- **Razón:** Dirección, horarios, parqueadero (datos fijos)
- **Decisión:** MOVER a `ubicaciones.md`
- **KB Section:** "Consultorio Barranquilla"

#### **7. Información consulta presencial Bogotá**
- **Líneas:** 152-153 (dentro de sección 5)
- **Tokens:** ~150
- **Razón:** Dirección, horarios (datos fijos)
- **Decisión:** MOVER a `ubicaciones.md`
- **KB Section:** "Consultorio Bogotá"

#### **8. Información sobre La PRE-CONSULTA**
- **Líneas:** 215-216
- **Tokens:** ~80
- **Razón:** Descripción estática de servicio
- **Decisión:** MOVER a `faqs.md`
- **KB Section:** "PRE-CONSULTA"

#### **10. Explicación pago anticipado**
- **Líneas:** 236-237
- **Tokens:** ~80
- **Razón:** Política estática de agendamiento
- **Decisión:** MOVER a `faqs.md`
- **KB Section:** "Proceso de Agendamiento"

#### **11. Información sobre procedimientos** (MASIVO)
- **Líneas:** 239-373
- **Tokens:** ~4,000
- **Razón:** 25+ descripciones de procedimientos (texto fijo, sin lógica)
- **Decisión:** MOVER a `procedimientos.md`
- **KB Sections:**
  - Lipo High Tech 3 + tecnologías (Vaser, Microaire, Retraction, J Plasma)
  - Lipotransferencia glútea
  - Lipoabdominoplastia
  - Mamoplastia reducción/aumento
  - Recambio de prótesis
  - Braquioplastia
  - Cruroplastia
  - Ginecomastia
  - Lipo papada
  - Bichectomía
  - Otoplastia
  - Implantes pectorales/pantorrilla
  - Rinoplastia
  - Mentoplastia
  - Frontoplastia
  - Blefaroplastia

**TOTAL ESTÁTICO:** ~5,000 tokens

---

## Archivos para Knowledge Base (3 archivos)

### 1. `knowledge-base/procedimientos.md` (~4,200 tokens)
**Contenido:**
- Lipo High Tech 3 (descripción completa + 4 tecnologías)
- Lipotransferencia glútea
- Lipoabdominoplastia
- Mamoplastia reducción/aumento
- Recambio de prótesis
- Braquioplastia
- Cruroplastia
- Ginecomastia
- Lipo papada
- Bichectomía
- Otoplastia
- Implantes pectorales/pantorrilla
- Rinoplastia
- Mentoplastia
- Frontoplastia
- Blefaroplastia

**Formato:** Estructura con headers, descripciones, beneficios

### 2. `knowledge-base/ubicaciones.md` (~400 tokens)
**Contenido:**
- **Barranquilla:** Quantum Tower - Dirección, horarios, parqueadero, confirmación
- **Bogotá:** World Medical Center - Dirección, horarios, confirmación
- **Valoración Virtual:** Descripción, requisitos

**Formato:** Tabla o secciones por ciudad

### 3. `knowledge-base/faqs.md` (~400 tokens)
**Contenido:**
- ¿Qué es la PRE-CONSULTA?
- Modalidades de valoración (presencial, virtual, PRE-CONSULTA)
- Proceso de agendamiento (pago anticipado)
- Importancia de la valoración (video YouTube)

**Formato:** Q&A estilo FAQ

---

## Additional Instructions REDUCIDO (4,000 tokens)

### Nuevo Contenido (sin estáticos)

```markdown
**INSTRUCCIÓN DE CONSULTA A KNOWLEDGE BASE:**

Cuando el paciente pregunta por:
- **Procedimientos específicos:** Consulta Knowledge Base sección "Procedimientos"
- **Ubicaciones/horarios:** Consulta Knowledge Base sección "Ubicaciones"
- **Modalidades de valoración:** Consulta Knowledge Base sección "FAQs"

Resume en 2-4 oraciones y ofrece agendar valoración.

---

[MANTENER TODO EL CONTENIDO DINÁMICO ACTUAL]

**1. Saludo inicial**
...

**2. Respuesta a solicitud de información general**
...

**3. ACTUALIZACIÓN DE DATOS DE CONTACTO**
...

[... resto de secciones dinámicas ...]

**18. Gestión de Consentimiento Multimedia**
...
```

---

## Beneficios Esperados

### Métricas de Eficiencia

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Tokens en Additional | 9,000 | 4,000 | -56% |
| Tokens por interacción | 9,100 | 4,600 | -49% |
| Latencia promedio | 3.2s | 2.5s | -22% |
| Costo/1K interacciones | $27 | $14 | -48% |

### Mantenibilidad

- ✅ Actualizar procedimiento: Solo editar `procedimientos.md` (sin tocar prompts)
- ✅ Cambiar ubicación: Solo editar `ubicaciones.md`
- ✅ Agregar FAQ: Solo editar `faqs.md`
- ✅ Modificar flujo: Solo editar Additional Instructions

---

## Próximos Pasos

### Fase 2: Crear Knowledge Base (siguiente tarea)

1. Crear `/knowledge-base/procedimientos.md` (4,200 tokens)
2. Crear `/knowledge-base/ubicaciones.md` (400 tokens)
3. Crear `/knowledge-base/faqs.md` (400 tokens)
4. Subir archivos a Bird Dashboard > Knowledge Base

### Fase 3: Reducir Additional Instructions

1. Editar `eva-valoracion.agent.json`
2. Remover secciones estáticas identificadas
3. Agregar instrucción de consulta a KB
4. Mantener solo contenido dinámico

---

## Validación

### Criterios de Éxito (Fase 4 - Testing)

**Consultas que DEBEN funcionar con KB:**
1. "¿Qué es Lipo High Tech 3?" → Eva consulta KB + responde
2. "¿Dónde están ubicados?" → Eva consulta KB + responde
3. "¿Qué es la PRE-CONSULTA?" → Eva consulta KB + responde

**Consultas que usan flujos dinámicos:**
1. "¿Cuánto cuesta?" → Eva usa flujo 7.2 (NO KB) + solicita datos
2. "Actualizar mi email" → Eva usa flujo de actualización + action
3. Usuario envía foto → Eva usa flujo de consentimiento (sección 18)

**Umbral:** 95%+ respuestas correctas (mismo nivel que antes)

---

## Clasificación Final

### MANTENER en Additional Instructions (44%)
- Saludos y flujos de indagación
- Actualización de datos (action integration)
- Flujo de manejo de precios (7.2)
- Flujo de calificación por ubicación (7.3 - solo lógica)
- Solicitar datos optimizado (9)
- Marco de empatía (10.1)
- Macros top 3 (11.1: Enzimas, Deep Slim, Hydrafacial)
- Flujos de transferencia y redirección
- Cierre proactivo (17.1)
- Gestión de consentimiento multimedia (18)

### MOVER a Knowledge Base (56%)
- 25+ descripciones de procedimientos
- Ubicaciones Barranquilla/Bogotá (direcciones, horarios)
- FAQs (PRE-CONSULTA, modalidades, pago anticipado)

---

**Estado:** Fase 1 COMPLETA - Clasificación terminada
**Próximo:** Fase 2 - Crear archivos para Knowledge Base
**ROI:** -56% tokens en Additional, -48% costo operativo
