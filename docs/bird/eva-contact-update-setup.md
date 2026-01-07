# Eva Valoración: Contact Update Action Setup Guide

**Version:** 1.0 | **Date:** 2025-12-20 18:15 | **Target:** Operators configuring Bird UI

---

## Overview

This guide explains how to configure the `update_contact_data` action in Eva Valoración through the Bird Dashboard UI. This action enables Eva to update patient contact information with automatic validation, cleaning, and verification.

**Estimated Time:** 15-20 minutes
**Prerequisites:** Bird Dashboard access, Eva Valoración AI Employee created

---

## Step 1: Navigate to Eva Valoración Actions

1. **Open Bird Dashboard:** https://app.bird.com
2. **Navigate to AI Employees:**
   - Left sidebar → **AI Employees**
3. **Select Eva Valoración:**
   - Click on **Eva Valoración** from the list
4. **Go to Actions:**
   - Click **Actions** tab at the top
5. **Create New Action:**
   - Click **+ Add action** button (top right)

---

## Step 2: Configure Action Basic Settings

### Action Name and Description

In the "Basic Settings" section:

| Field | Value |
|-------|-------|
| **Name** | `update_contact_data` |
| **Description** | `Actualiza datos de contacto con validación y limpieza automática` |

**Note:** During parallel testing (Week 2), use this name. In Week 3, rename to `actualizacion de datos` after deprecating the old action.

---

## Step 3: Configure Task Arguments

Click **+ Add argument** and configure the following 3 arguments:

### Argument 1: conversationId

| Field | Value |
|-------|-------|
| **Argument name** | `conversationId` |
| **Type** | `string` |
| **Description** | `ID de la conversación de Bird` |
| **Required** | ✓ Yes |
| **Value** | `{{conversation.id}}` |

**How to set Value:**
- Click in the "Value" field
- Type `{{` - Bird will show variable picker
- Select `conversation` → `id`
- Result: `{{conversation.id}}`

### Argument 2: contactPhone

| Field | Value |
|-------|-------|
| **Argument name** | `contactPhone` |
| **Type** | `string` |
| **Description** | `Teléfono del paciente en formato E.164 (+57...)` |
| **Required** | ✓ Yes |
| **Value** | `{{contact.telefono}}` |

**How to set Value:**
- Click in the "Value" field
- Type `{{` - Bird will show variable picker
- Select `contact` → `telefono`
- Result: `{{contact.telefono}}`

**Alternative:** If `contact.telefono` is not available, use `{{contact.phonenumber}}` or configure Eva to ask the patient for their phone number during the conversation.

### Argument 3: updateData

| Field | Value |
|-------|-------|
| **Argument name** | `updateData` |
| **Type** | `object` |
| **Description** | `Campos a actualizar (displayName, email, country)` |
| **Required** | ✓ Yes |
| **Value** | Eva constructs dynamically |

**Special Note:** This is a JSON object that Eva will construct during the conversation based on what fields the patient wants to update. Eva will create this object with ONLY the fields the patient wants to change.

**Example updateData:**
```json
{
  "displayName": "Maria Garcia",
  "email": "[email protected]",
  "country": "CO"
}
```

---

## Step 4: Configure HTTP Request

In the "HTTP Request" section:

### Request Configuration

| Field | Value |
|-------|-------|
| **Method** | `POST` |
| **URL** | `https://api.neero.ai/api/contacts/update` |
| **Content-Type** | `application/json` |

### Headers

Click **+ Add header** and add:

| Header Name | Value |
|-------------|-------|
| `X-API-Key` | `{{env.NEERO_API_KEY}}` |

**How to set environment variable:**
- Type `{{` in the Value field
- Select `env` → `NEERO_API_KEY`
- If `NEERO_API_KEY` is not in the list, ask your admin to configure it in Bird workspace settings

### Request Body

```json
{
  "context": {
    "conversationId": "{{conversationId}}",
    "contactPhone": "{{contactPhone}}"
  },
  "updates": {{updateData}}
}
```

**Important:**
- Copy this JSON exactly
- Use `{{conversationId}}`, `{{contactPhone}}`, and `{{updateData}}` - these reference the task arguments
- Do NOT add quotes around `{{updateData}}` - it's already a JSON object

---

## Step 5: Update Eva Instructions

In the Bird Dashboard:

1. **Navigate to Instructions:**
   - Eva Valoración → **Instructions** tab
2. **Find the "Additional Instructions" section**
3. **Add the following text:**

```
ACTUALIZACION DE DATOS DE CONTACTO:

CUANDO USAR:
- Paciente solicita actualizar su información
- Palabras clave: "actualizar datos", "cambiar nombre", "cambiar email", "cambiar país"

FLUJO:
1. Preguntar QUE datos desea actualizar:
   - Nombre completo
   - Correo electrónico
   - País (código de 2 letras: CO, MX, US, AR, CL, PE, EC, VE, ES, NL)

2. Validar con paciente ANTES de actualizar:
   - Email: Confirmar formato ([email protected])
   - Nombre: Confirmar ortografía correcta
   - País: Confirmar código correcto (CO=Colombia, MX=Mexico, US=United States, etc.)

3. Construir updateData JSON con SOLO los campos que el paciente quiere cambiar:
   {
     "displayName": "nombre completo",    // Si cambió nombre
     "email": "[email protected]",         // Si cambió email
     "country": "CO"                      // Si cambió país (CODIGO 2 letras)
   }

4. Obtener teléfono actual del paciente (del contexto o preguntar)

5. Llamar action update_contact_data:
   - conversationId: del contexto
   - contactPhone: teléfono actual del paciente con código de país (+57...)
   - updateData: JSON construido en paso 3

6. Procesar respuesta:

   SI success=true:
   - Confirmar: "Tus datos han sido actualizados correctamente"
   - Mostrar cambios: "Nombre: [ANTES] → [DESPUÉS]"
   - Si verified=true: "Verificado en el sistema ✓"

   SI success=false:
   - VALIDATION_ERROR:
     * Email inválido: "Por favor verifica el formato de tu email"
     * Teléfono inválido: "El teléfono debe incluir código de país (+57...)"
     * País inválido: "Usa código de 2 letras (CO, MX, US, etc.)"

   - CONTACT_NOT_FOUND:
     * "No encontré tu contacto con ese teléfono. ¿Podrías verificarlo?"

   - TIMEOUT_ERROR:
     * "El sistema tardó mucho. Intenta de nuevo en un momento."

   - Otros errores:
     * "Hubo un error al actualizar. Te transfiero con un asesor."

VALIDACIONES AUTOMÁTICAS (NO mencionar al usuario):
- Emojis en nombre → Removidos automáticamente
- MAYUSCULAS → Capitalizados correctamente
- Espacios múltiples → Normalizados

IMPORTANTE:
- NO actualizar datos médicos (diagnósticos, tratamientos)
- NO actualizar datos financieros
- SOLO actualizar: nombre, email, país
- Teléfono NO se actualiza (es la clave de búsqueda)
```

**Where to add:**
- Scroll to the bottom of the existing instructions
- Paste this text AFTER the existing content
- Click **Save** button

---

## Step 6: Test the Action

### Test Case 1: Valid Update (Name with Emoji)

**Setup:**
1. Open a test conversation with Eva in Bird Dashboard
2. Ensure the test contact has a phone number in Bird CRM

**Test Steps:**
1. User: "Quiero actualizar mi nombre"
2. Eva should ask: "¿Cuál es tu nuevo nombre completo?"
3. User: "MARIA 😊 GARCIA"
4. Eva should confirm and call the action
5. **Expected Response:**
   - Success: `true`
   - Before: `MARIA 😊 GARCIA`
   - After: `Maria Garcia` (emoji removed, proper capitalization)
   - Verified: `true`

### Test Case 2: Invalid Email

**Test Steps:**
1. User: "Quiero actualizar mi email"
2. Eva: "¿Cuál es tu nuevo email?"
3. User: "abc@"
4. Eva should call the action
5. **Expected Response:**
   - Success: `false`
   - Code: `VALIDATION_ERROR`
   - Error: "Invalid request body: updates.email: Invalid email"
6. Eva should say: "Por favor verifica el formato de tu email"

### Test Case 3: Multiple Fields

**Test Steps:**
1. User: "Quiero actualizar mi nombre, email y país"
2. Eva should ask for each field
3. User provides:
   - Name: "Juan Perez"
   - Email: "[email protected]"
   - Country: "CO"
4. **Expected Response:**
   - Success: `true`
   - Updated fields: `["displayName", "firstName", "lastName", "jose", "email", "country"]`
   - Verified: `true`

### Verification Checklist

- [ ] Action appears in Eva's action list
- [ ] Test Case 1 passes (emoji removal works)
- [ ] Test Case 2 passes (validation error handled)
- [ ] Test Case 3 passes (multiple fields updated)
- [ ] Eva shows before/after changes to user
- [ ] Bird CRM shows updated data (check Contact profile)
- [ ] No emojis in Bird CRM display names
- [ ] Names are properly capitalized (not ALL CAPS)

---

## Step 7: Monitor and Troubleshoot

### View Logs

1. **Bird Logs:**
   - Bird Dashboard → AI Employees → Eva Valoración → **Activity** tab
   - View action execution results

2. **Vercel Logs:**
   - https://vercel.com/dashboard
   - Select `api-neero` project
   - Click **Logs** tab
   - Filter by `/api/contacts/update`

### Common Issues

**Issue 1: "conversationId not found"**
- **Cause:** Variable `{{conversation.id}}` not configured correctly
- **Fix:** Re-add argument, use variable picker (type `{{`)

**Issue 2: "contactPhone not found"**
- **Cause:** Contact doesn't have `telefono` attribute
- **Fix:** Update argument to use `{{contact.phonenumber}}` or configure Eva to ask for phone

**Issue 3: "VALIDATION_ERROR: Invalid email"**
- **Cause:** User provided invalid email format
- **Expected:** This is normal validation, Eva should guide user to correct format

**Issue 4: "CONTACT_NOT_FOUND"**
- **Cause:** Phone number doesn't exist in Bird CRM
- **Fix:** Verify phone format (must be E.164: `+57...`), check Bird Contacts

**Issue 5: Action timeout**
- **Cause:** Endpoint took >9 seconds
- **Fix:** Check Vercel logs, verify Bird API response times

---

## Step 8: Migration Plan (Week 2-4)

### Week 2: Parallel Testing (Current Step)

- [x] Create `update_contact_data` action (completed above)
- [ ] Test with internal team (7 test cases)
- [ ] Monitor error rates (target: <5%)
- [ ] Compare with old action `actualizacion de datos`

### Week 3: Full Migration

**When ready (after Week 2 testing passes):**

1. **Deprecate Old Action:**
   - Bird Dashboard → Eva Valoración → Actions
   - Find old action `actualizacion de datos`
   - Click **Edit**
   - Rename to: `actualizacion de datos (DEPRECATED - do not use)`
   - Add to description: "Use update_contact_data instead"
   - **Do NOT delete** (keep for rollback)

2. **Rename New Action:**
   - Find `update_contact_data` action
   - Click **Edit**
   - Rename to: `actualizacion de datos`
   - Update description: "Actualiza datos de contacto (validated, cleaned, verified)"

3. **Monitor for 1 Week:**
   - Check error rates daily (target: <5%)
   - Verify user feedback (complaints about data updates)
   - Monitor Bird CRM for data quality (no emojis, proper caps)

### Week 4: Cleanup

**When migration is successful (no issues in Week 3):**

1. **Remove Deprecated Action:**
   - Bird Dashboard → Eva Valoración → Actions
   - Find `actualizacion de datos (DEPRECATED)`
   - Click **Delete**
   - Confirm deletion

2. **Verify:**
   - Eva still works correctly
   - No errors in Vercel logs
   - Bird CRM data quality is good

---

## Rollback Plan

**If error rate >10% or timeout rate >5% during Week 2-3:**

1. **Immediate Actions:**
   - Rename `update_contact_data` back to original name (or delete)
   - Rename old action back to `actualizacion de datos`
   - Update instructions to reference old action

2. **Investigation:**
   - Check Vercel logs for error patterns
   - Identify root cause (validation too strict? timeout issues?)
   - Fix in staging environment

3. **Re-attempt:**
   - Deploy fix to production
   - Restart parallel testing

---

## Country Code Reference

For Eva to use when validating country updates:

| Code | Country Name | Spanish |
|------|--------------|---------|
| CO | Colombia | Colombia |
| MX | Mexico | México |
| US | United States | Estados Unidos |
| AR | Argentina | Argentina |
| CL | Chile | Chile |
| PE | Peru | Perú |
| EC | Ecuador | Ecuador |
| VE | Venezuela | Venezuela |
| ES | España | España |
| NL | Netherlands | Países Bajos |

**Validation Rule:** Must be 2-letter uppercase code (e.g., `CO`, not `Colombia` or `co`)

---

## Related Documentation

- **API Reference:** `/docs/api/contacts-update.md` - Complete endpoint documentation
- **Executive Summary:** `/docs/eva-executive-summary.md` - Stakeholder summary
- **Bird Actions Architecture:** `/docs/bird/bird-actions-architecture.md` - Technical background
- **Migration Plan:** `/Users/mercadeo/.claude/plans/zesty-booping-charm.md` - Complete plan

---

## Support

**Issues during setup:**
- Check Bird Dashboard logs (Activity tab)
- Check Vercel logs (api.neero.ai project)
- Review error codes in `/docs/api/contacts-update.md`

**Questions:**
- Technical: Review `/docs/api/contacts-update.md`
- Business: Review `/docs/eva-executive-summary.md`

---

**Token Budget:** ~1,200 tokens | **Target Audience:** Operators configuring Bird UI
