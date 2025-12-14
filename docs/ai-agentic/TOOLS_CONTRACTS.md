# TOOLS_CONTRACTS.md
## Principio
El modelo no “imagina” acciones. Solo usa estas herramientas. Si falta herramienta o falla: `TOOL_FAILURE` + `handover=true`.

## Contratos (pseudo OpenAPI)
### crm.upsertLead
Input:
- `conversationId`, `contactId`, `name?`, `phone`, `city?`, `procedureInterest?`, `stage`
Output:
- `leadId`, `updatedFields[]`

### calendar.create
Input:
- `leadId`, `type`, `datetimeISO`, `timezone`, `locationId`, `notes?`
Output:
- `appointmentId`, `status`

### calendar.reschedule
Input:
- `appointmentId`, `newDatetimeISO`, `timezone`
Output:
- `status`

### ticket.create (handover)
Input:
- `conversationId`, `leadId?`, `priority (P0/P1/P2)`, `reason_code`, `risk_flags[]`, `notes_for_human`
Output:
- `ticketId`

### whatsapp.sendText
Input:
- `to`, `text`, `conversationId?`
Output:
- `messageId`

### whatsapp.sendTemplate
Input:
- `to`, `templateId`, `variables`, `language`
Output:
- `messageId`

### media.analyze
Input:
- `mediaRef`, `mediaType`, `procedureType?`, `requestedChecks[]`
Output:
- `qualityScore`, `issues[]`, `suggestedRetakeText`

### payments.createLink
Input:
- `leadId`, `amount`, `currency`, `concept`
Output:
- `url`, `expiresAt`

### email.send
Input:
- `to`, `subject`, `body`, `attachmentsRefs?`
Output:
- `emailId`

## Idempotencia
Todas las tools deben aceptar `idempotencyKey = messageId` cuando aplique.
