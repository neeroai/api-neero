-- Identificar Contactos Dañados - Incidente 2026-01-20
-- Encuentra registros sospechosos de normalización incorrecta

SELECT
  cn.id,
  cn."contactId",
  cn."conversationId",
  cn.status,
  cn.confidence,
  cn."extractedData"->>'displayName' as extracted_name,
  cn."extractedData"->>'firstName' as first_name,
  cn."extractedData"->>'lastName' as last_name,
  cn."extractedData"->>'method' as method,
  cn.before as before_state,
  cn.after as after_state,
  cn."createdAt"
FROM contact_normalizations cn
WHERE
  cn."createdAt" >= '2026-01-20T00:00:00Z'
  AND cn."createdAt" < '2026-01-21T00:00:00Z'
  AND cn.status = 'success'
  AND (
    -- Fragmentos de conversación
    cn."extractedData"->>'displayName' ~* '(para|pueda|atender|cuando|pero|que|si|no|claro|costo|precio|buenas|noches|dia|hoy)'
    -- Nombres genéricos de bots
    OR cn."extractedData"->>'displayName' ~* '^(Eva|Karina|Bot|Assistant|System|Auto)$'
    -- Nombres muy cortos (<5 chars)
    OR length(cn."extractedData"->>'displayName') < 5
    -- Confidence sospechosamente baja para 'success'
    OR (cn.confidence < 0.7 AND cn.status = 'success')
    -- Solo caracteres especiales
    OR cn."extractedData"->>'displayName' ~ '^[^a-zA-Z]+$'
  )
ORDER BY cn."createdAt" DESC;
