/**
 * @file Service Window
 * @description Exports 3 functions and types
 * @module lib/bird/service-window
 * @exports ServiceWindowResult, ServiceWindowState, checkServiceWindow
 */
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
 * Check WhatsApp 24-hour messaging window status for contact
 *
 * @param params - Service window check parameters
 * @param params.channelId - Bird channel ID
 * @param params.contactId - Bird contact ID
 * @param params.phoneNumber - Contact phone number (E.164 format)
 * @returns Object with window state and expiration
 *
 * @example
 * ```ts
 * const result = await checkServiceWindow({
 *   channelId: "ch_xxx",
 *   contactId: "ct_xxx",
 *   phoneNumber: "+573001234567"
 * });
 * // result: { state: "open", serviceWindowExpireAt: "2026-01-20T10:00:00Z", isPermanentSession: false }
 * ```
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
