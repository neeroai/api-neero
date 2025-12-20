# Eva Knowledge Base Optimization - Testing Guide

**Version:** 1.0 | **Date:** 2025-12-20 20:30 | **Status:** Testing Phase

---

## Resumen Ejecutivo

**Cambios implementados:**
- Additional Instructions reducido de 9,000 → 3,260 tokens (-64%)
- Contenido estático movido a Knowledge Base (3 archivos)
- Contenido dinámico mantenido en Additional Instructions

**Beneficios esperados:**
- -48% costo operativo
- -22% latencia promedio
- Mejor mantenibilidad (separación data vs comportamiento)

---

## Pre-requisitos

### 1. Subir Knowledge Base a Bird Dashboard

**Paso 1: Acceder a Bird Dashboard**
- URL: https://dashboard.bird.com
- Navegar a: AI Employees → Eva Valoración → Knowledge Base

**Paso 2: Subir archivos (3 documentos)**

| Archivo | Ubicación Local | Categoría | Tokens |
|---------|----------------|-----------|--------|
| procedimientos.md | `/knowledge-base/procedimientos.md` | Procedimientos | ~4,200 |
| ubicaciones.md | `/knowledge-base/ubicaciones.md` | Ubicaciones | ~400 |
| faqs.md | `/knowledge-base/faqs.md` | FAQs | ~500 |

**Paso 3: Configurar Knowledge Base**
- Habilitar "Auto-retrieve" para consultas relacionadas
- Configurar similarity threshold: 0.65 (estándar)
- Verificar que los 3 archivos estén "Active"

### 2. Actualizar configuración de Eva

**Opción A: Usar Bird UI (Recomendado)**
1. Copiar contenido de `eva-valoracion.agent.json` campo `legacy.additional`
2. Pegar en Bird Dashboard → Eva Valoración → Additional Instructions
3. Guardar cambios

**Opción B: API de Bird (Avanzado)**
```bash
curl -X PATCH "https://api.bird.com/workspaces/{workspace_id}/ai-employees/{employee_id}" \
  -H "Authorization: AccessKey {BIRD_ACCESS_KEY}" \
  -H "Content-Type: application/json" \
  -d @feature/eva-valoracion/eva-valoracion.agent.json
```

---

## Casos de Prueba

### Test Case 1: Procedimiento Común (Enzimas Lipolíticas)

**Objetivo:** Verificar que Eva usa macro en memoria (NO consulta KB para tratamientos top 3)

**Input usuario:**
```
Hola, quiero información sobre enzimas
```

**Respuesta esperada:**
```
¡Hola! Soy Eva, la Asistente Virtual del Dr. Andrés Durán.

Las enzimas lipolíticas son un tratamiento inyectable para reducir grasa localizada en áreas específicas como abdomen, papada, brazos. El Dr. Durán evaluará en la valoración qué zonas tratar y cuántas sesiones necesita. ¿Le gustaría agendar su valoración?
```

**Verificación:**
- [ ] Respuesta en 2-4 oraciones
- [ ] Menciona que es inyectable para grasa localizada
- [ ] Ofrece agendar valoración
- [ ] Tono cálido y profesional (usa "usted")
- [ ] NO consulta Knowledge Base (usa macro directo)

**Criterio de éxito:** ✓ Respuesta correcta sin consultar KB

---

### Test Case 2: Procedimiento Raro (Lipo High Tech 3)

**Objetivo:** Verificar que Eva consulta Knowledge Base para procedimientos no en macros

**Input usuario:**
```
Hola, quisiera saber qué es la Lipo High Tech 3
```

**Respuesta esperada:**
```
¡Hola! Soy Eva, la Asistente Virtual del Dr. Andrés Durán.

La Lipo High Tech 3 es la combinación de 3 tecnologías (Vaser, Microaire y Retraction) que permite obtener resultados con mayor precisión anatómica. El J Plasma NO se incluye inicialmente, solo si el Dr. Durán lo recomienda según su caso.

¿Le gustaría agendar su valoración con el Dr. Durán para más detalles?
```

**Verificación:**
- [ ] Consulta Knowledge Base (procedimientos.md)
- [ ] Menciona 3 tecnologías: Vaser, Microaire, Retraction
- [ ] Menciona que J Plasma NO se incluye inicialmente
- [ ] Resume en 2-4 oraciones
- [ ] Ofrece agendar valoración

**Criterio de éxito:** ✓ Respuesta correcta consultando KB

---

### Test Case 3: Ubicación (Barranquilla)

**Objetivo:** Verificar que Eva consulta Knowledge Base para ubicaciones

**Input usuario:**
```
¿Dónde están ubicados en Barranquilla?
```

**Respuesta esperada:**
```
Nuestro consultorio en Barranquilla está en Quantum Tower, Calle 85 #50-159, Consultorio 06, Primer Piso. El edificio cuenta con parqueadero privado ($6.000 la hora).

¿Le gustaría agendar una valoración presencial?
```

**Verificación:**
- [ ] Consulta Knowledge Base (ubicaciones.md)
- [ ] Menciona dirección completa: Quantum Tower, Calle 85 #50-159
- [ ] Menciona parqueadero y precio ($6.000/hora)
- [ ] Ofrece agendar valoración presencial

**Criterio de éxito:** ✓ Respuesta correcta consultando KB

---

### Test Case 4: Flujo Dinámico (Manejo de Precios)

**Objetivo:** Verificar que flujos dinámicos funcionan SIN consultar KB

**Input usuario:**
```
¿Cuánto cuesta la valoración?
```

**Respuesta esperada:**
```
Para darle una cotización personalizada necesito algunos datos, porque cada caso es único. El Dr. Durán evaluará su situación específica y le dará el mejor presupuesto.

Por favor compártame:
• Nombre completo
• Ciudad donde se encuentra
• Correo electrónico
• Número de teléfono

Puede enviarme todo en un solo mensaje.
```

**Verificación:**
- [ ] NO consulta Knowledge Base (usa flujo directo)
- [ ] Explica por qué necesita datos
- [ ] Solicita 4 campos en bullet points
- [ ] Menciona que puede enviar todo en un mensaje
- [ ] Tono empático (Marco de Empatía aplicado)

**Criterio de éxito:** ✓ Flujo dinámico funciona sin KB

---

### Test Case 5: FAQ (PRE-CONSULTA)

**Objetivo:** Verificar que Eva consulta Knowledge Base para FAQs

**Input usuario:**
```
¿Qué es la PRE-CONSULTA?
```

**Respuesta esperada:**
```
La PRE-CONSULTA es una valoración por medio de fotos. Le permite obtener el presupuesto del procedimiento de su interés en el menor tiempo posible, sin necesidad de desplazamiento. El Dr. Andrés Durán analizará las fotos y le proporcionará una evaluación inicial con presupuesto.

¿Le gustaría más información sobre cómo funciona?
```

**Verificación:**
- [ ] Consulta Knowledge Base (faqs.md)
- [ ] Menciona que es valoración por fotos
- [ ] Menciona beneficio: presupuesto rápido sin desplazamiento
- [ ] Resume en 2-4 oraciones

**Criterio de éxito:** ✓ Respuesta correcta consultando KB

---

### Test Case 6: Procedimiento No en KB (Edge Case)

**Objetivo:** Verificar comportamiento cuando procedimiento no existe en KB

**Input usuario:**
```
¿Hacen transplante de cabello?
```

**Respuesta esperada:**
```
El Dr. Andrés Durán se especializa en procedimientos de cirugía plástica y estética. Para saber si ofrecemos ese procedimiento específico, le conecto con un asesor especializado que podrá darle información detallada. ¿Procedo?
```

**Verificación:**
- [ ] Intenta consultar KB pero no encuentra
- [ ] NO inventa información
- [ ] Ofrece transferir a agente humano
- [ ] Mantiene tono profesional

**Criterio de éxito:** ✓ Escala correctamente cuando no encuentra info

---

## Métricas de Éxito

### Criterios de Aprobación (95%+ requerido)

**Funcionalidad (6 casos de prueba):**
- Test Case 1 (Enzimas): ✓/✗
- Test Case 2 (Lipo High Tech 3): ✓/✗
- Test Case 3 (Ubicación): ✓/✗
- Test Case 4 (Precios): ✓/✗
- Test Case 5 (PRE-CONSULTA): ✓/✗
- Test Case 6 (Edge case): ✓/✗

**Criterio de éxito:** 6/6 o 5/6 (83-100%) → Aprobado

**Calidad de Respuestas:**
- Tono cálido y profesional: ✓/✗
- Usa "usted" (no tutea): ✓/✗
- Respuestas concisas (2-4 oraciones): ✓/✗
- Ofrece agendar valoración: ✓/✗
- NO inventa información: ✓/✗

**Criterio de éxito:** 5/5 (100%) → Aprobado

### Métricas Técnicas (Monitoreo post-deployment)

**Tokens por interacción (objetivo: -50%):**
- Baseline (antes): ~9,100 tokens
- Target (después): ~4,600 tokens
- Medición: Bird Analytics → Token Usage

**Latencia promedio (objetivo: -20%):**
- Baseline (antes): ~3.2s
- Target (después): ~2.5s
- Medición: Bird Analytics → Response Time

**Tasa de respuestas correctas (objetivo: ≥95%):**
- Medición: Manual review de 20 conversaciones aleatorias
- Criterio: 19/20 o 20/20 correctas

**Escalación a humano (objetivo: mantener 35-40%):**
- Medición: Bird Analytics → Handover Rate
- Criterio: No debe aumentar significativamente

---

## Procedimiento de Testing

### Fase 1: Testing Funcional (1 hora)

**1. Ejecutar los 6 casos de prueba**
- Usar WhatsApp real conectado a Eva
- Documentar respuestas en tabla

**2. Verificar Knowledge Base retrieval**
- Bird Dashboard → AI Employees → Eva → Analytics
- Verificar que "Knowledge Base Queries" > 0
- Revisar qué documentos fueron consultados

**3. Documentar resultados**
- Captura de pantalla de cada conversación
- Marcar ✓/✗ en cada criterio de verificación

### Fase 2: Testing de Regresión (30 min)

**1. Verificar flujos críticos NO afectados**
- Saludo inicial (WhatsApp vs Instagram)
- Actualización de datos de contacto
- Cierre proactivo de conversación
- Consentimiento multimedia (Ley 1581/2012)

**2. Verificar Guardrails activos**
- NO da diagnósticos médicos
- NO menciona precios específicos
- NO recomienda tamaño de prótesis

### Fase 3: Testing de Performance (2-3 días en producción)

**1. Configurar monitoreo en Bird Analytics**
- Tokens por interacción (daily average)
- Latencia promedio (daily average)
- Handover rate (daily %)

**2. Comparar con baseline**
- Exportar métricas de últimos 7 días (pre-optimization)
- Exportar métricas de 7 días (post-optimization)
- Calcular delta % para cada métrica

**3. Validar ROI**
- Si tokens reducidos ≥40% → ✓ Objetivo cumplido
- Si latencia reducida ≥15% → ✓ Objetivo cumplido
- Si tasa correcta ≥95% → ✓ Calidad mantenida

---

## Rollback Plan

### Criterios para Rollback

**ROLLBACK INMEDIATO si:**
- Tasa de respuestas correctas <90% (degradación significativa)
- Handover rate >50% (Eva escala demasiado)
- Errores críticos en producción (Eva da diagnósticos, menciona precios, etc.)

**Procedimiento de Rollback:**

1. **Restaurar Additional Instructions previo**
```bash
git checkout a580a1b -- feature/eva-valoracion/eva-valoracion.agent.json
```

2. **Actualizar en Bird Dashboard**
- Copiar contenido de `legacy.additional` del commit a580a1b
- Pegar en Bird UI → Additional Instructions
- Guardar cambios

3. **Desactivar Knowledge Base (temporal)**
- Bird Dashboard → Knowledge Base → Disable Auto-retrieve
- Mantener archivos pero no usarlos

4. **Validar restauración**
- Ejecutar Test Case 4 (Precios) → Debe funcionar
- Verificar que tasa de error vuelve a baseline

5. **Análisis post-mortem**
- Identificar causa raíz del problema
- Documentar en `/docs/eva-rollback-analysis.md`
- Planificar fix antes de re-intentar

---

## Aprobación de Deployment

### Checklist de Aprobación

**Testing Funcional:**
- [ ] 6/6 casos de prueba pasados (o 5/6)
- [ ] Knowledge Base consultas funcionando
- [ ] Calidad de respuestas ≥95%

**Testing de Regresión:**
- [ ] Flujos críticos intactos
- [ ] Guardrails activos
- [ ] Sin errores de seguridad

**Documentación:**
- [ ] Resultados documentados
- [ ] Capturas de pantalla guardadas
- [ ] Rollback plan revisado

**Decisión Final:**

✓ **APROBADO** → Proceder a Fase 5 (Deployment Guide)
✗ **RECHAZADO** → Ejecutar Rollback Plan

---

## Próximos Pasos

**Si aprobado:**
1. Proceder a Fase 5: Crear guía de despliegue y monitoreo
2. Configurar alertas en Bird Analytics
3. Monitorear métricas por 7 días
4. Documentar lessons learned

**Si rechazado:**
1. Ejecutar Rollback Plan
2. Analizar causa raíz
3. Iterar en solución
4. Re-ejecutar testing

---

**Estado:** Testing Guide Completo | **Próximo:** Ejecutar casos de prueba | **Owner:** Equipo Neero
