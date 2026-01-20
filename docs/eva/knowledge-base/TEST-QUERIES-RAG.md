# Test Queries - RAG Validation

**Purpose:** Validate RAG retrieval for 13 new knowledge base entries
**Date:** 2026-01-20
**Status:** Ready for testing after embeddings generation

---

## Overview

This document contains test queries to validate that the RAG system correctly retrieves the 13 new knowledge base entries added in the Eva KB expansion.

**Success Criteria:**
- Similarity score > 0.7 (threshold)
- Target similarity > 0.8 (optimal)
- Correct KB entry retrieved
- Content includes relevant information

---

## Phase 1: Procedures + Pricing (7 entries)

### Test 1: Enzimas en Brazos

**Query:** "¿Cuánto duran las enzimas en brazos?"

**Expected KB Entry:** `enzimas-brazos`

**Success Criteria:**
- Similarity > 0.8
- Content mentions: "3-4 sesiones", "3-4 semanas", "2-3 meses resultados"

**Validation:**
- [ ] Retrieved correct entry
- [ ] Similarity score: _____
- [ ] Includes sessions info
- [ ] Includes timeline

---

### Test 2: Deep Slim

**Query:** "¿Qué es Deep Slim y cuántas sesiones necesito?"

**Expected KB Entry:** `deep-slim`

**Success Criteria:**
- Similarity > 0.8
- Content mentions: "6-8 sesiones", "radiofrecuencia + ultrasonido", "1-2 meses resultados"

**Validation:**
- [ ] Retrieved correct entry
- [ ] Similarity score: _____
- [ ] Includes sessions info
- [ ] Includes technology description

---

### Test 3: Hydrafacial

**Query:** "¿Hydrafacial tiene resultados inmediatos?"

**Expected KB Entry:** `hydrafacial`

**Success Criteria:**
- Similarity > 0.8
- Content mentions: "resultados inmediatos", "30-45 minutos", "mantenimiento mensual"

**Validation:**
- [ ] Retrieved correct entry
- [ ] Similarity score: _____
- [ ] Confirms immediate results
- [ ] Includes duration

---

### Test 4: Toxina Botulínica

**Query:** "¿Cuánto dura el efecto de la toxina botulínica?"

**Expected KB Entry:** `toxina-botulinica`

**Success Criteria:**
- Similarity > 0.8
- Content mentions: "3-4 meses duración", "3-7 días primeros efectos", "mantenimiento cada 3-4 meses"

**Validation:**
- [ ] Retrieved correct entry
- [ ] Similarity score: _____
- [ ] Includes duration info
- [ ] Includes maintenance frequency

---

### Test 5: Precios Personalizados

**Query:** "¿Cuánto cuesta la lipoescultura?"

**Expected KB Entry:** `precios-personalizados`

**Success Criteria:**
- Similarity > 0.75
- Content mentions: "varían según factores", "área y extensión", "tecnologías", "valoración con Dr. Durán"
- Does NOT provide specific price (correctly redirects to consultation)

**Validation:**
- [ ] Retrieved correct entry
- [ ] Similarity score: _____
- [ ] Explains personalization
- [ ] Offers valoración

---

### Test 6: Costo Incluido

**Query:** "¿Qué incluye el precio de la cirugía?"

**Expected KB Entry:** `costo-incluido-detalle`

**Success Criteria:**
- Similarity > 0.8
- Content mentions: "honorarios", "sala de cirugía", "controles primer año", "atención 24/7"
- Includes "NO incluye" section

**Validation:**
- [ ] Retrieved correct entry
- [ ] Similarity score: _____
- [ ] Lists included items
- [ ] Lists not included items

---

### Test 7: Inversión Consulta

**Query:** "¿Por qué debo pagar la valoración?"

**Expected KB Entry:** `inversion-consulta`

**Success Criteria:**
- Similarity > 0.75
- Content mentions: "inversión en seguridad", "30-45 minutos", "3 modalidades", "video explicativo"

**Validation:**
- [ ] Retrieved correct entry
- [ ] Similarity score: _____
- [ ] Explains value proposition
- [ ] Includes video link

---

## Phase 2: Modalities + Locations + Comparisons (5 entries)

### Test 8: Modalidades Detalle

**Query:** "¿Diferencia entre valoración virtual y presencial?"

**Expected KB Entry:** `modalidades-valoracion-detalle`

**Success Criteria:**
- Similarity > 0.8
- Content mentions: "3 modalidades", "pros/cons", "presencial/virtual/PRE-CONSULTA"

**Validation:**
- [ ] Retrieved correct entry
- [ ] Similarity score: _____
- [ ] Lists 3 modalities clearly
- [ ] Includes pros/cons

---

### Test 9: Barranquilla Location

**Query:** "¿Dónde queda la clínica en Barranquilla?"

**Expected KB Entry:** `barranquilla-principal`

**Success Criteria:**
- Similarity > 0.8
- Content mentions: "Quantum Tower", "Calle 85", "parqueadero"

**Validation:**
- [ ] Retrieved correct entry
- [ ] Similarity score: _____
- [ ] Includes address
- [ ] Includes parking info

**Note:** Phone/WhatsApp/schedule are PENDING in metadata

---

### Test 10: Pacientes Otras Ciudades

**Query:** "Soy de Medellín, ¿cómo funciona?"

**Expected KB Entry:** `pacientes-otras-ciudades`

**Success Criteria:**
- Similarity > 0.75
- Content mentions: "2 opciones", "valoración virtual", "coordinamos viaje/hospedaje", "seguimiento"

**Validation:**
- [ ] Retrieved correct entry
- [ ] Similarity score: _____
- [ ] Lists 2 options
- [ ] Mentions support included

---

### Test 11: Quirúrgico vs No Quirúrgico

**Query:** "¿Necesito cirugía o hay opciones sin cirugía?"

**Expected KB Entry:** `quirurgico-vs-no-quirurgico`

**Success Criteria:**
- Similarity > 0.75
- Content mentions: "TRATAMIENTOS NO QUIRÚRGICOS", "TRATAMIENTOS QUIRÚRGICOS", comparación, "valoración necesaria"

**Validation:**
- [ ] Retrieved correct entry
- [ ] Similarity score: _____
- [ ] Compares both options
- [ ] Includes decision guide

---

### Test 12: Opciones Contorno Corporal

**Query:** "¿Qué es mejor, enzimas, Deep Slim o lipoescultura?"

**Expected KB Entry:** `opciones-contorno-corporal`

**Success Criteria:**
- Similarity > 0.8
- Content mentions: "ENZIMAS", "DEEP SLIM", "LIPOESCULTURA", comparación, "CUÁNDO ELEGIR"

**Validation:**
- [ ] Retrieved correct entry
- [ ] Similarity score: _____
- [ ] Compares 3 options
- [ ] Includes selection criteria

---

## Phase 3: Edge Cases (1 entry)

### Test 13: Tratamientos No Ofrecidos

**Query:** "¿Ofrecen exosomas?"

**Expected KB Entry:** `tratamientos-no-ofrecidos`

**Success Criteria:**
- Similarity > 0.75
- Content mentions: "no ofrecemos", "alternativas", "PRP", "valoración con Dr. Durán"
- Does NOT say "no tenemos eso" cold (redirects with context)

**Validation:**
- [ ] Retrieved correct entry
- [ ] Similarity score: _____
- [ ] Mentions alternatives
- [ ] Offers valoración

---

## Additional Test Cases (Cross-Reference)

### Test 14: Pricing + Enzimas (Multi-intent)

**Query:** "¿Cuánto cuestan las enzimas en brazos?"

**Expected KB Entries (could return multiple):**
- Primary: `precios-personalizados` (addresses pricing)
- Secondary: `enzimas-brazos` (provides treatment info)

**Success Criteria:**
- At least one entry with similarity > 0.75
- Ideally returns pricing FAQ (explains personalization)

**Validation:**
- [ ] Retrieved relevant entry/entries
- [ ] Similarity scores: _____, _____
- [ ] Addresses both pricing and treatment

---

### Test 15: Location + Modalities (Multi-intent)

**Query:** "¿Puedo hacer la consulta en Barranquilla o es mejor virtual?"

**Expected KB Entries (could return multiple):**
- Primary: `modalidades-valoracion-detalle` (compares options)
- Secondary: `barranquilla-principal` (location info)

**Success Criteria:**
- At least one entry with similarity > 0.75

**Validation:**
- [ ] Retrieved relevant entry/entries
- [ ] Similarity scores: _____, _____
- [ ] Helps decision making

---

## RAG Performance Metrics

### Target Metrics (from plan)

| Metric | Target | Notes |
|--------|--------|-------|
| **RAG found rate** | >85% | For enzimas/deep slim/hydrafacial queries |
| **Avg similarity** | 0.75+ | Threshold 0.7, target 0.75+ |
| **Search latency** | <205ms | 200ms embedding + 1.5ms HNSW + 13 docs overhead <5ms |
| **Embedding cost** | <$0.10 | 13 docs × Gemini text-embedding-004 |

### Actual Metrics (Fill after testing)

| Metric | Actual | Status |
|--------|--------|--------|
| **RAG found rate** | ___% (___/15 queries) | ⬜ PASS / ⬜ FAIL |
| **Avg similarity** | _____ | ⬜ PASS / ⬜ FAIL |
| **Search latency** | _____ms | ⬜ PASS / ⬜ FAIL |
| **Embedding cost** | $_____  | ⬜ PASS / ⬜ FAIL |

---

## Test Execution Commands

### 1. Generate Embeddings & Seed Database

```bash
# Run the seed script to generate embeddings and insert into DB
npx tsx scripts/seed-knowledge.ts
```

**Expected Output:**
- 13 new entries inserted
- Embeddings generated via Gemini text-embedding-004
- Total time: ~45 minutes (13 docs × 200ms + insert overhead)

---

### 2. Run Individual Test Queries

```bash
# Test individual queries (replace with actual test script if available)
npx tsx scripts/test-eva-rag.ts "¿Cuánto duran las enzimas en brazos?"
npx tsx scripts/test-eva-rag.ts "¿Cuánto cuesta la lipoescultura?"
npx tsx scripts/test-eva-rag.ts "¿Ofrecen exosomas?"
```

**For each query, record:**
- Similarity score
- Retrieved KB entry (category/subcategory)
- Content snippet (first 100 chars)
- Latency (ms)

---

### 3. Run All Tests (Batch)

If a batch test script exists:

```bash
# Run all 15 test queries
npx tsx scripts/test-eva-rag-batch.ts docs/eva/knowledge-base/TEST-QUERIES-RAG.md
```

---

## Validation Checklist

### Pre-Deployment (Staging)

- [ ] All 15 test queries return similarity > 0.7
- [ ] At least 13/15 queries return similarity > 0.75
- [ ] No queries return wrong KB entry (content mismatch)
- [ ] Latency < 205ms average
- [ ] Embeddings generated successfully (no errors)

### Post-Deployment (Production)

**Week 1 Monitoring:**
- [ ] Daily: Check handover rate trend
- [ ] Daily: KB found rate (`retrieveKnowledgeTool` success %)
- [ ] Daily: Pricing query → handover rate
- [ ] Daily: Lead capture rate

**Week 2 Review:**
- [ ] Top queries with low similarity (<0.7)
- [ ] New treatment requests (candidates for KB expansion)
- [ ] Patient satisfaction signals (silence after KB response vs engagement)

---

## Troubleshooting

### If similarity scores are low (<0.7):

1. **Check embedding quality:**
   - Verify Gemini text-embedding-004 is being used
   - Check embedding dimensions (should be 768)

2. **Check query phrasing:**
   - Test with natural language variations
   - Test with specific vs general queries

3. **Adjust threshold:**
   - Consider lowering threshold from 0.7 to 0.65 temporarily
   - Monitor false positive rate

4. **Add synonyms:**
   - If specific terms don't match, consider adding synonym variations to content

### If wrong KB entry is retrieved:

1. **Review content overlap:**
   - Check if multiple entries have similar content
   - Consider making content more distinct

2. **Check metadata:**
   - Ensure category/subcategory are correct
   - Verify validation_pending flag

3. **Test with edge cases:**
   - Test queries that could match multiple entries
   - Verify RAG returns most relevant one

---

## Notes

**IMPORTANT:**
- All 13 new entries have `validatedBy: "PENDING"` and `validation_pending: true` in metadata
- After Dr. Durán validation, update these fields to `"Dr. Andrés Durán"` and `false`
- Barranquilla location has PENDING fields for phone/WhatsApp/schedule - fill after Dr. Durán provides info

**Next Steps After Testing:**
1. If all tests pass → Production deployment
2. If tests fail → Review and fix before deployment
3. Monitor post-deployment for 2 weeks as per plan

---

**Created:** 2026-01-20
**Test Status:** ⬜ NOT RUN / ⬜ IN PROGRESS / ⬜ COMPLETED
**Overall Result:** ⬜ PASS / ⬜ FAIL
