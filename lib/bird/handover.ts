/**
 * @file Handover
 * @description Exports 2 functions and types
 * @module lib/bird/handover
 * @exports HandoverPayload, notifyHandover
 */
export interface HandoverPayload {
  reason: string;
  conversationId?: string;
  contactId?: string;
  phone?: string;
  channel?: string;
  notes?: string;
}

/**
 * Notify human handover to external channel (Slack/CRM) if configured
 *
 * @param payload - Handover context and reason
 * @param payload.reason - Why handover was requested
 * @param payload.conversationId - Bird conversation UUID (optional)
 * @param payload.contactId - Bird contact UUID (optional)
 * @param payload.phone - Contact phone number (optional)
 * @param payload.channel - Channel name (optional)
 * @param payload.notes - Additional context (optional)
 * @returns Object with delivered status and response
 *
 * @example
 * ```ts
 * const result = await notifyHandover({
 *   reason: "medical_question",
 *   conversationId: "conv_123",
 *   phone: "+573001234567",
 *   notes: "Patient asked about medication dosage"
 * });
 * // result: { delivered: true, response: {...} }
 * ```
 */
export async function notifyHandover(payload: HandoverPayload) {
  const webhook = process.env.HANDOVER_WEBHOOK_URL;

  if (!webhook) {
    console.info('[handover] requested (no webhook configured)', payload);
    return { delivered: false, reason: 'HANDOVER_WEBHOOK_URL not set' };
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
