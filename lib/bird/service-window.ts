import { birdFetch } from './client';
import { getBirdConfig } from './env';

export type ServiceWindowState = 'open' | 'closed';

export interface ServiceWindowResult {
  state: ServiceWindowState;
  serviceWindowExpireAt: string | null;
  isPermanentSession: boolean | null;
}

interface ServiceWindowParams {
  channelId: string;
  contactId: string;
  phoneNumber: string;
}

/**
 * Check WhatsApp 24h service window via Contacts API
 */
export async function checkServiceWindow({
  channelId,
  contactId,
  phoneNumber,
}: ServiceWindowParams): Promise<ServiceWindowResult> {
  const { workspaceId } = getBirdConfig();
  const encodedPhone = encodeURIComponent(phoneNumber);
  const path = `/workspaces/${workspaceId}/channels/${channelId}/contacts/${contactId}?contactIdentifierValue=${encodedPhone}`;

  const response = await birdFetch(path, { method: 'GET' });
  const data = await response.json();

  const expireAt = data.serviceWindowExpireAt ?? null;
  const now = Date.now();
  const isOpen = expireAt && new Date(expireAt).getTime() > now;

  return {
    state: isOpen ? 'open' : 'closed',
    serviceWindowExpireAt: expireAt,
    isPermanentSession: data.isPermanentSession ?? null,
  };
}
