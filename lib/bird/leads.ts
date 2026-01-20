/**
 * @file Leads
 * @description Exports 2 functions and types
 * @module lib/bird/leads
 * @exports LeadPayload, registerLead
 */
export interface LeadPayload {
  name?: string;
  phone?: string;
  email?: string;
  country?: string;
  procedure?: string;
  modality?: 'virtual' | 'presencial' | 'preconsulta' | string;
  city?: string;
  channel?: 'whatsapp' | 'instagram' | 'messenger' | string;
  conversationId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Register lead in external CRM or webhook if configured
 *
 * @param payload - Lead data to register
 * @param payload.name - Contact name (optional)
 * @param payload.phone - Contact phone number (optional)
 * @param payload.email - Contact email (optional)
 * @param payload.country - Country name (optional)
 * @param payload.procedure - Medical procedure or service (optional)
 * @param payload.modality - Appointment modality (optional)
 * @param payload.city - City name (optional)
 * @param payload.channel - Communication channel (optional)
 * @param payload.conversationId - Bird conversation UUID (optional)
 * @param payload.metadata - Additional custom data (optional)
 * @returns Object with delivered status and response
 *
 * @example
 * ```ts
 * const result = await registerLead({
 *   name: "Ana García",
 *   phone: "+573001234567",
 *   email: "[email protected]",
 *   procedure: "Consulta General",
 *   modality: "virtual",
 *   channel: "whatsapp"
 * });
 * // result: { delivered: true, response: {...} }
 * ```
 */
export async function registerLead(payload: LeadPayload) {
  const webhook = process.env.LEADS_WEBHOOK_URL;

  if (!webhook) {
    console.info('[lead] captured (no webhook configured)', payload);
    return { delivered: false, reason: 'LEADS_WEBHOOK_URL not set' };
  }

  const response = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const ok = response.ok;
  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = await response.text();
  }

  return { delivered: ok, response: data };
}
