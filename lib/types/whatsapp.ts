/**
 * WhatsApp Business API v23.0 Types
 * Source: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

// Webhook Event Types
export interface WhatsAppWebhookPayload {
  object: 'whatsapp_business_account';
  entry: WhatsAppEntry[];
}

export interface WhatsAppEntry {
  id: string;
  changes: WhatsAppChange[];
}

export interface WhatsAppChange {
  value: WhatsAppValue;
  field: 'messages';
}

export interface WhatsAppValue {
  messaging_product: 'whatsapp';
  metadata: WhatsAppMetadata;
  contacts?: WhatsAppContact[];
  messages?: WhatsAppIncomingMessage[];
  statuses?: WhatsAppStatus[];
}

export interface WhatsAppMetadata {
  display_phone_number: string;
  phone_number_id: string;
}

export interface WhatsAppContact {
  profile: {
    name: string;
  };
  wa_id: string;
}

// Incoming Message Types
export type WhatsAppIncomingMessage =
  | WhatsAppTextMessage
  | WhatsAppAudioMessage
  | WhatsAppImageMessage
  | WhatsAppInteractiveMessage;

export interface WhatsAppBaseMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
}

export interface WhatsAppTextMessage extends WhatsAppBaseMessage {
  type: 'text';
  text: {
    body: string;
  };
}

export interface WhatsAppAudioMessage extends WhatsAppBaseMessage {
  type: 'audio';
  audio: {
    id: string;
    mime_type: string;
  };
}

export interface WhatsAppImageMessage extends WhatsAppBaseMessage {
  type: 'image';
  image: {
    id: string;
    mime_type: string;
    sha256: string;
    caption?: string;
  };
}

export interface WhatsAppInteractiveMessage extends WhatsAppBaseMessage {
  type: 'interactive';
  interactive: {
    type: 'button_reply' | 'list_reply';
    button_reply?: {
      id: string;
      title: string;
    };
    list_reply?: {
      id: string;
      title: string;
      description?: string;
    };
  };
}

// Outgoing Message Types
export interface WhatsAppOutgoingTextMessage {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'text';
  text: {
    preview_url?: boolean;
    body: string;
  };
}

export interface WhatsAppOutgoingInteractiveMessage {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'interactive';
  interactive: WhatsAppInteractiveContent;
}

export type WhatsAppInteractiveContent =
  | WhatsAppButtonsContent
  | WhatsAppListContent;

export interface WhatsAppButtonsContent {
  type: 'button';
  body: {
    text: string;
  };
  action: {
    buttons: Array<{
      type: 'reply';
      reply: {
        id: string;
        title: string;
      };
    }>;
  };
}

export interface WhatsAppListContent {
  type: 'list';
  body: {
    text: string;
  };
  action: {
    button: string;
    sections: Array<{
      title: string;
      rows: Array<{
        id: string;
        title: string;
        description?: string;
      }>;
    }>;
  };
}

// Status Types
export interface WhatsAppStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  errors?: Array<{
    code: number;
    title: string;
    message: string;
  }>;
}

// API Response Types
export interface WhatsAppSendMessageResponse {
  messaging_product: 'whatsapp';
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

export interface WhatsAppErrorResponse {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode: number;
    fbtrace_id: string;
  };
}
