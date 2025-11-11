/**
 * WhatsApp Messaging Utilities - Edge Runtime Compatible
 * Send text, interactive buttons/lists, and media messages via WhatsApp Cloud API v23.0
 */

import type {
  WhatsAppOutgoingTextMessage,
  WhatsAppOutgoingInteractiveMessage,
  WhatsAppButtonsContent,
  WhatsAppListContent,
  WhatsAppSendMessageResponse,
  WhatsAppErrorResponse,
} from '../types/whatsapp';

const BASE_URL = 'https://graph.facebook.com/v23.0';

/**
 * Button interface for interactive button messages (max 3 buttons)
 */
export interface Button {
  id: string;
  title: string;
}

/**
 * List section interface for interactive list messages
 */
export interface Section {
  title: string;
  rows: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
}

/**
 * Send a text message to a WhatsApp user
 * @param to - Recipient phone number (with country code, no + sign)
 * @param text - Message text (max 4096 characters)
 * @returns Message ID and recipient info
 * @throws Error if send fails
 */
export async function sendTextMessage(
  to: string,
  text: string
): Promise<WhatsAppSendMessageResponse> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  if (!token || !phoneId) {
    throw new Error('WHATSAPP_TOKEN or WHATSAPP_PHONE_ID not configured');
  }

  const payload: WhatsAppOutgoingTextMessage = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: {
      preview_url: true,
      body: text.slice(0, 4096),
    },
  };

  const response = await fetch(`${BASE_URL}/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error: WhatsAppErrorResponse = await response.json();
    throw new Error(`WhatsApp API error: ${error.error.message}`);
  }

  return response.json();
}

/**
 * Send interactive button message (max 3 buttons)
 * Use for binary/ternary choices or quick actions
 * @param to - Recipient phone number
 * @param text - Message body text
 * @param buttons - Array of buttons (max 3)
 * @returns Message ID and recipient info
 * @throws Error if buttons exceed 3 or send fails
 */
export async function sendButtonMessage(
  to: string,
  text: string,
  buttons: Button[]
): Promise<WhatsAppSendMessageResponse> {
  if (buttons.length > 3) {
    throw new Error('Button messages support max 3 buttons. Use sendListMessage for more options.');
  }

  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  if (!token || !phoneId) {
    throw new Error('WHATSAPP_TOKEN or WHATSAPP_PHONE_ID not configured');
  }

  const interactive: WhatsAppButtonsContent = {
    type: 'button',
    body: {
      text: text.slice(0, 4096),
    },
    action: {
      buttons: buttons.map((btn) => ({
        type: 'reply',
        reply: {
          id: btn.id,
          title: btn.title.slice(0, 20),
        },
      })),
    },
  };

  const payload: WhatsAppOutgoingInteractiveMessage = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive,
  };

  const response = await fetch(`${BASE_URL}/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error: WhatsAppErrorResponse = await response.json();
    throw new Error(`WhatsApp API error: ${error.error.message}`);
  }

  return response.json();
}

/**
 * Send interactive list message (4-10 rows recommended)
 * Use for menus, product catalogs, or multi-option selection
 * @param to - Recipient phone number
 * @param text - Message body text
 * @param buttonText - Text for the list button (e.g. "View Menu")
 * @param sections - Array of sections with rows (max 10 rows per section)
 * @returns Message ID and recipient info
 * @throws Error if send fails
 */
export async function sendListMessage(
  to: string,
  text: string,
  buttonText: string,
  sections: Section[]
): Promise<WhatsAppSendMessageResponse> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  if (!token || !phoneId) {
    throw new Error('WHATSAPP_TOKEN or WHATSAPP_PHONE_ID not configured');
  }

  const interactive: WhatsAppListContent = {
    type: 'list',
    body: {
      text: text.slice(0, 4096),
    },
    action: {
      button: buttonText.slice(0, 20),
      sections: sections.map((section) => ({
        title: section.title.slice(0, 24),
        rows: section.rows.slice(0, 10).map((row) => ({
          id: row.id,
          title: row.title.slice(0, 24),
          description: row.description?.slice(0, 72),
        })),
      })),
    },
  };

  const payload: WhatsAppOutgoingInteractiveMessage = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive,
  };

  const response = await fetch(`${BASE_URL}/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error: WhatsAppErrorResponse = await response.json();
    throw new Error(`WhatsApp API error: ${error.error.message}`);
  }

  return response.json();
}
