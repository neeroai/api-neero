# Eva Valoración: Contact Update Improvement

**Version:** 1.0 | **Date:** 2025-12-20 17:45 | **Status:** Migration Ready

---

## Resumen Ejecutivo

Nuevo endpoint custom `/api/contacts/update` implementado y testeado exitosamente. Permite a Eva actualizar datos de contacto de pacientes con validación automática, limpieza de nombres y verificación post-actualización.

**Estado:** Endpoint production-ready. Listo para migrar Eva Valoración del endpoint nativo de Bird al nuevo endpoint custom.

---

## Problema Actual

Eva Valoración usa el endpoint nativo de Bird `createOrUpdateContactByIdentifier` que presenta **7 problemas críticos**:

### Problemas Técnicos

1. **Emojis en nombres** - Se almacenan tal cual en Bird CRM
   - Ejemplo: `🌻TheFloRG🌻` se guarda sin limpiar
   - Impacto: Nombres difíciles de leer en Bird UI

2. **Nombres en MAYÚSCULAS** - No se normalizan
   - Ejemplo: `MARIA GARCIA` se guarda todo en mayúsculas
   - Impacto: Datos poco profesionales en CRM

3. **País mapeado a campo incorrecto** - `pais` se mapea a `city`
   - Impacto: Pérdida de dato de país, campo city con valor incorrecto

4. **Sin validación de email** - Acepta emails inválidos
   - Ejemplo: `abc@` se acepta y envía a Bird
   - Impacto: Datos inválidos en CRM, emails bounce

5. **Sin validación de teléfono** - Acepta formatos incorrectos
   - Ejemplo: `3001234567` (sin código de país)
   - Impacto: Búsquedas de contacto pueden fallar

6. **Sin verificación** - No confirma que actualización se aplicó
   - Impacto: Actualizaciones silenciosamente fallan, usuario no se entera

7. **Mensajes de error crípticos** - Errores de Bird poco claros
   - Impacto: Eva no puede guiar al usuario para corregir

---

## Solución Implementada

Endpoint custom `/api/contacts/update` con:

### Características Clave

✅ **Validación pre-actualización**
- Email: Formato RFC 5322 (`[email protected]`)
- Teléfono: Formato E.164 (`+573001234567`)
- País: Código ISO alpha-2 (`CO`, `MX`, `US`)
- Nombre: Min 1 char, max 100, debe contener letra/número

✅ **Limpieza automática de nombres**
- Remueve emojis: `Juan 😊` → `Juan`
- Capitalización correcta: `MARIA GARCIA` → `Maria Garcia`
- Normaliza espacios: `jose   luis` → `Jose Luis`

✅ **Mapeo correcto de campos**
- País se mapea a `attributes.country` (correcto)
- Estrategia dual-field para displayName (sistema + atributos)

✅ **Verificación post-actualización**
- GET contact después de PATCH
- Confirma que cambios se aplicaron
- Retorna `verified: true/false`

✅ **Transparencia before/after**
- Retorna valores antes y después de actualización
- Eva puede confirmar cambios exactos al usuario

✅ **Códigos de error específicos**
- `VALIDATION_ERROR` - Error de formato en campo
- `CONTACT_NOT_FOUND` - Teléfono no existe en Bird
- `UPDATE_ERROR` - Fallo en API de Bird
- `TIMEOUT_ERROR` - Procesamiento >9s
- `UNAUTHORIZED` - API key inválida

---

## Beneficios

### Para Usuarios (Pacientes)

- **Feedback inmediato**: Email inválido se detecta ANTES de enviar a Bird (más rápido)
- **Confianza en cambios**: Ven antes/después de actualización
- **Datos limpios**: Sin emojis ni mayúsculas en nombres

### Para Operaciones (Equipo Médico)

- **Mejor calidad de datos**: CRM con nombres profesionales
- **Lectura fácil**: Sin emojis que dificultan lectura
- **Menos tickets de soporte**: "¿Se guardó mi cambio?" → ahora confirmado automáticamente

### Para Eva (AI Employee)

- **Guía específica**: Puede decir "Por favor usa formato [email protected]" (no solo "error")
- **Confirmación clara**: "Nombre: Juan 😊 → Juan ✓" (con before/after)
- **Manejo automático**: Emojis/mayúsculas se limpian sin pedir al usuario

---

## Plan de Migración (4 Semanas)

### Semana 1: Configuración Inicial (15 min)
- ✅ Endpoint implementado y testeado (7 tests passed)
- ⏳ Crear nueva action en Bird: `update_contact_data`
- ⏳ Actualizar instrucciones de Eva
- ⏳ Deploy a producción

### Semana 2: Testing Paralelo (3-5 días)
- Probar con equipo interno (7 casos de prueba)
- Monitorear logs de Vercel
- Verificar calidad de datos en Bird CRM
- Comparar con action vieja (side by side)

### Semana 3: Migración Completa (1 semana)
- Deprecar action vieja: `actualizacion de datos (DEPRECATED)`
- Renombrar action nueva: `update_contact_data` → `actualizacion de datos`
- Monitorear tasas de error diariamente
- Verificar feedback de usuarios

### Semana 4: Limpieza (30 min)
- Eliminar action deprecated
- Crear documentación final
- Verificar sin quejas de usuarios
- Confirmar calidad de datos en Bird CRM

**Plan de Rollback:** Si >10% errores o >5% timeouts → revertir a action vieja inmediatamente.

---

## Casos de Prueba

| Test | Input | Resultado Esperado |
|------|-------|-------------------|
| Update completo | Name: "MARIA 😊 GARCIA", Email: "[email protected]", Country: "CO" | ✅ Nombre limpiado a "Maria Garcia", todos los campos actualizados |
| Solo nombre | Name: "José Luis Pérez" | ✅ Solo displayName actualizado |
| Email inválido | Email: "invalidemail" | ❌ VALIDATION_ERROR con mensaje claro |
| País inválido | Country: "Colombia" (no CO) | ❌ VALIDATION_ERROR: "Must be 2-letter code" |
| Contacto no existe | Phone: +573009999999 (fake) | ❌ CONTACT_NOT_FOUND error |
| Remoción de emoji | Name: "🌻Ana🌻" | ✅ Limpiado a "Ana" |
| Capitalización | Name: "juan perez" | ✅ Limpiado a "Juan Perez" |

---

## Métricas de Éxito

### Métricas Técnicas (Semana 2-3)

- ✅ Response time <5s P95 (actualmente 0.0-2.3s)
- ✅ Error rate <5% (excluyendo errores de input de usuario)
- ✅ Timeout rate <1%
- ✅ Verificación exitosa >95%

### Métricas de Negocio (Semana 3-4)

- **Calidad de datos mejora**: Sin emojis en Bird CRM
- **Quejas de usuarios disminuyen**: "¿Se actualizó mi dato?"
- **Eva maneja errores gracefully**: Guías específicas de recuperación
- **Transparencia aumenta confianza**: Before/after visible al usuario

---

## Ejemplo de Flujo

### Flujo Actual (Problemático)

```
Usuario: "Mi email es abc@"
  ↓
Eva: [Envía a Bird sin validar]
  ↓
Bird: [Rechaza silenciosamente]
  ↓
Eva: "Error al actualizar" (no sabe qué pasó)
  ↓
Usuario: [Confundido, no sabe qué corregir]
```

### Flujo Nuevo (Mejorado)

```
Usuario: "Mi email es abc@"
  ↓
Eva: [Envía a endpoint custom]
  ↓
Endpoint: [Valida ANTES de Bird] → VALIDATION_ERROR
  ↓
Eva: "Por favor verifica el formato de tu email ([email protected])"
  ↓
Usuario: "Ah ok, es [email protected]"
  ↓
Eva: [Reenvía con email correcto]
  ↓
Endpoint: [Valida OK] → Actualiza → Verifica → Retorna before/after
  ↓
Eva: "Email actualizado: abc@ → [email protected] ✓ Verificado en el sistema"
  ↓
Usuario: [Confiado, sabe que cambio se guardó]
```

---

## Riesgos y Mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Validación muy estricta rechaza inputs válidos | Baja | Medio | Testing paralelo detecta falsos positivos. Ajustar validación si >10% errores. |
| Timeouts >9s en producción | Muy Baja | Alto | Endpoint testeado: 0.0-2.3s. Budget de 9s muy holgado. Rollback inmediato si >5% timeouts. |
| Bird API cambia y rompe endpoint | Baja | Alto | Usa endpoints estables de Bird (PATCH /contacts, GET /contacts). Versionados. |
| Usuario confundido por códigos de país | Media | Bajo | Eva explica códigos en instrucciones ("CO=Colombia"). Documentar en guía. |

---

## Siguiente Paso

**Acción inmediata** (ahora):

1. **Revisar este documento** con stakeholder (Javier)
2. **Aprobar migración** si beneficios justifican esfuerzo
3. **Crear Bird action** `update_contact_data` en Bird UI (15 min)

**Después de aprobación** (Semana 1):

1. Actualizar instrucciones de Eva
2. Deploy a producción
3. Iniciar testing paralelo

---

## Contacto y Preguntas

**Endpoint implementado por:** Claude Code
**Testing completado:** 2025-12-20 (7 tests passed)
**Plan de migración:** 4 semanas
**Rollback disponible:** Sí (si >10% errores)

**Preguntas frecuentes:**

**P: ¿Por qué no usar el endpoint nativo de Bird?**
R: El nativo no valida, no limpia nombres, mapea país a campo incorrecto y no verifica updates.

**P: ¿Qué pasa si el endpoint falla?**
R: Plan de rollback inmediato. Action vieja permanece disponible durante Semanas 2-3.

**P: ¿Eva puede seguir usando la action vieja?**
R: Sí, durante Semanas 2-3 ambas actions coexisten para testing paralelo.

**P: ¿Cuánto tiempo toma la migración completa?**
R: 4 semanas, pero solo ~45 minutos de trabajo activo. El resto es monitoreo pasivo.

---

**Token Budget:** ~1,100 tokens | **Target Audience:** Stakeholders (Javier, equipo médico)
