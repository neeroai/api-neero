/**
 * @file Messages
 * @description Exports 4 functions and types
 * @module lib/bird/messages
 * @exports SendTemplateParams, SendTextParams, sendTemplateMessage, sendTextMessage
 */
import { birdFetch } from './client';
import { getBirdConfig } from './env';

interface BaseMessageParams {
  channelId: string;
  to: string;
}

export interface SendTextParams extends BaseMessageParams {
  text: string;
  buttons?: string[];
}

export interface SendTemplateParams extends BaseMessageParams {
  name: string;
  locale?: string;
  variables?: Record<string, string>;
}

/**
 * Send plain text message with optional quick reply buttons
 *
 * @param params - Message parameters
 * @param params.channelId - Bird channel ID
 * @param params.to - Recipient phone number (E.164 format)
 * @param params.text - Message text content
 * @param params.buttons - Optional quick reply buttons (max 3)
 * @returns Bird API response with message ID
 *
 * @example
 * ```ts
 * await sendTextMessage({
 *   channelId: "ch_xxx",
 *   to: "+573001234567",
 *   text: "¿Cómo te llamas?",
 *   buttons: ["Ana", "Juan", "María"]
 * });
 * ```
 */
export async function sendTextMessage({ channelId, to, text, buttons }: SendTextParams) {
  const { workspaceId } = getBirdConfig();

  const actions = buttons?.slice(0, 3).map((label) => ({
    type: 'reply',
    reply: { id: label.toLowerCase().replace(/\s+/g, '_'), text: label },
  }));

  const body: Record<string, unknown> = {
    body: {
      type: 'text',
      text: {
        text,
        ...(actions && actions.length
          ? {
              actions,
            }
          : {}),
      },
    },
  };

  const payload = {
    receiver: {
      contacts: [{ identifierKey: 'phonenumber', identifierValue: to }],
    },
    ...body,
  };

  const path = `/workspaces/${workspaceId}/channels/${channelId}/messages`;
  const response = await birdFetch(path, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response.json();
}

/**
 * Send WhatsApp template message (required after 24h window closes)
 *
 * @param params - Template parameters
 * @param params.channelId - Bird channel ID
 * @param params.to - Recipient phone number (E.164 format)
 * @param params.name - Template name registered in Bird
 * @param params.locale - Language code (default: "es")
 * @param params.variables - Template variable substitutions
 * @returns Bird API response with message ID
 *
 * @example
 * ```ts
 * await sendTemplateMessage({
 *   channelId: "ch_xxx",
 *   to: "+573001234567",
 *   name: "appointment_reminder",
 *   locale: "es",
 *   variables: { date: "2026-01-20", time: "10:00" }
 * });
 * ```
 */
export async function sendTemplateMessage({
  channelId,
  to,
  name,
  locale = 'es',
  variables = {},
}: SendTemplateParams) {
  const { workspaceId } = getBirdConfig();

  const payload = {
    receiver: {
      contacts: [{ identifierKey: 'phonenumber', identifierValue: to }],
    },
    template: {
      name,
      locale,
      variables,
    },
  };

  const path = `/workspaces/${workspaceId}/channels/${channelId}/messages`;
  const response = await birdFetch(path, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response.json();
}
