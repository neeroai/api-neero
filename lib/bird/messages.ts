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
 * Send plain text or quick replies (WhatsApp buttons limited to 3)
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
 * Send WhatsApp template after 24h window is closed
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
