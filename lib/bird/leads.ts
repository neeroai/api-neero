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
 * Register lead in an external system (if configured) or log as fallback.
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
