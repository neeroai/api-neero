/**
 * WhatsApp Message Normalization - Edge Runtime Compatible
 * Convert various WhatsApp message types to unified interface for AI processing
 */

import type { WhatsAppIncomingMessage } from '../types/whatsapp';

/**
 * Normalized message interface for AI processing
 */
export interface NormalizedMessage {
  userId: string;
  content: string;
  type: 'text' | 'audio' | 'image' | 'interactive' | 'unknown';
  timestamp: number;
  messageId: string;
  metadata?: {
    mediaId?: string;
    mimeType?: string;
    caption?: string;
    interactiveId?: string;
    interactiveTitle?: string;
  };
}

/**
 * Normalize any WhatsApp message type to unified interface
 * Extracts user ID, content, type, and metadata for AI processing
 * @param message - Incoming WhatsApp message (any type)
 * @returns Normalized message object
 */
export function normalizeMessage(
  message: WhatsAppIncomingMessage
): NormalizedMessage {
  const base = {
    userId: message.from,
    messageId: message.id,
    timestamp: parseInt(message.timestamp, 10) * 1000,
  };

  switch (message.type) {
    case 'text':
      return {
        ...base,
        content: message.text.body,
        type: 'text',
      };

    case 'audio':
      return {
        ...base,
        content: '[Audio message]',
        type: 'audio',
        metadata: {
          mediaId: message.audio.id,
          mimeType: message.audio.mime_type,
        },
      };

    case 'image':
      return {
        ...base,
        content: message.image.caption || '[Image]',
        type: 'image',
        metadata: {
          mediaId: message.image.id,
          mimeType: message.image.mime_type,
          caption: message.image.caption,
        },
      };

    case 'interactive': {
      const interactive = message.interactive;

      if (interactive.type === 'button_reply') {
        return {
          ...base,
          content: interactive.button_reply?.title || '',
          type: 'interactive',
          metadata: {
            interactiveId: interactive.button_reply?.id,
            interactiveTitle: interactive.button_reply?.title,
          },
        };
      }

      if (interactive.type === 'list_reply') {
        return {
          ...base,
          content: interactive.list_reply?.title || '',
          type: 'interactive',
          metadata: {
            interactiveId: interactive.list_reply?.id,
            interactiveTitle: interactive.list_reply?.title,
          },
        };
      }

      return {
        ...base,
        content: '[Interactive message]',
        type: 'interactive',
      };
    }

    default:
      return {
        ...base,
        content: `[${message.type}]`,
        type: 'unknown',
      };
  }
}

/**
 * Extract text content from normalized message
 * Useful for AI processing when only text is needed
 * @param normalized - Normalized message
 * @returns Text content string
 */
export function extractTextContent(normalized: NormalizedMessage): string {
  return normalized.content;
}

/**
 * Check if message requires media download
 * @param normalized - Normalized message
 * @returns True if message has media that needs downloading
 */
export function requiresMediaDownload(normalized: NormalizedMessage): boolean {
  return (
    (normalized.type === 'audio' || normalized.type === 'image') &&
    !!normalized.metadata?.mediaId
  );
}

/**
 * Format timestamp to ISO string
 * @param timestamp - Unix timestamp in milliseconds
 * @returns ISO 8601 formatted date string
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toISOString();
}
