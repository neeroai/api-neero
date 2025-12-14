# SCHEMA_EvaResult.md
## Schema (Zod)
```ts
import { z } from "zod";

export const EvaResult = z.object({
  reply: z.string().min(1),

  urgency: z.enum(["emergency", "urgent", "routine"]),

  handover: z.boolean(),

  reason_code: z.enum([
    "EMERGENCY_SYMPTOMS",
    "URGENT_SYMPTOMS",
    "MEDICAL_ADVICE_REQUEST",
    "PRICING_QUOTE_REQUEST",
    "APPOINTMENT_SCHEDULING",
    "PAYMENT_SUPPORT",
    "COMPLAINT_OR_LEGAL",
    "SENSITIVE_DATA_CONSENT_MISSING",
    "MINOR_PATIENT",
    "OUT_OF_SCOPE",
    "TOOL_FAILURE",
    "POLICY_VIOLATION",
    "OTHER"
  ]),

  risk_flags: z.array(z.enum([
    "CHEST_PAIN",
    "SHORTNESS_OF_BREATH",
    "COUGHING_BLOOD",
    "FAINTING_CONFUSION",
    "UNCONTROLLED_BLEEDING",
    "FEVER_HIGH",
    "WOUND_PUS_ODOR",
    "SEVERE_WORSENING_PAIN",
    "DVT_SYMPTOMS",
    "INFECTION_SIGNALS",
    "MEDICAL_DIAGNOSIS",
    "TREATMENT_INSTRUCTIONS",
    "PROMISES_GUARANTEES",
    "PRICE_COMMITMENT",
    "MISSING_CONSENT",
    "EXPLICIT_IMAGE",
    "MINOR"
  ])).default([]),

  allowed_actions: z.array(z.enum([
    "crm.upsertLead",
    "calendar.create",
    "calendar.reschedule",
    "calendar.cancel",
    "ticket.create",
    "whatsapp.sendText",
    "whatsapp.sendTemplate",
    "media.analyze",
    "payments.createLink",
    "email.send"
  ])).default([]),

  notes_for_human: z.string().optional()
});

export type EvaResultType = z.infer<typeof EvaResult>;
