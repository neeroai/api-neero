export interface HandoverPayload {
  reason: string;
  conversationId?: string;
  contactId?: string;
  phone?: string;
  channel?: string;
  notes?: string;
}

/**
 * Notify human handover to external channel (Slack/CRM) if configured.
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
