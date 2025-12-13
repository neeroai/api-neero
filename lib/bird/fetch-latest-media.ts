/**
 * Bird Conversations API - Media Extraction
 * Fetch latest media message from WhatsApp conversation
 * Edge Runtime compatible
 */

import { z } from 'zod';

// Schema para mensaje de Bird API - Estructura real de WhatsApp via Bird
const BirdMessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  sender: z.object({
    type: z.enum(['contact', 'bot']),
  }),
  body: z.object({
    type: z.enum(['text', 'image', 'file', 'location']),
    // Image structure - WhatsApp images
    image: z
      .object({
        images: z.array(
          z.object({
            mediaUrl: z.string(),
          })
        ),
      })
      .optional(),
    // File structure - Documents, audio, video, stickers
    file: z
      .object({
        files: z.array(
          z.object({
            mediaUrl: z.string(),
            contentType: z.string(),
            filename: z.string().optional(),
          })
        ),
      })
      .optional(),
    // Location - Not processable but must validate
    location: z
      .object({
        coordinates: z.object({
          latitude: z.number(),
          longitude: z.number(),
        }),
        location: z
          .object({
            address: z.string().optional(),
            label: z.string().optional(),
          })
          .optional(),
      })
      .optional(),
  }),
  createdAt: z.string(),
  meta: z
    .object({
      extraInformation: z
        .object({
          'whatsapp.media.type': z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

const MessagesResponseSchema = z.object({
  results: z.array(BirdMessageSchema),
});

type BirdMessage = z.infer<typeof BirdMessageSchema>;

export interface ExtractedMedia {
  mediaUrl: string;
  mediaType: 'image' | 'document' | 'audio';
}

/**
 * Extract mediaUrl from WhatsApp message body
 * Auto-detects mediaType from Bird API structure and contentType
 */
function extractMediaFromMessage(message: BirdMessage): ExtractedMedia | null {
  const { type } = message.body;

  // Image - WhatsApp images use images[] array
  if (type === 'image' && message.body.image?.images?.[0]?.mediaUrl) {
    return {
      mediaUrl: message.body.image.images[0].mediaUrl,
      mediaType: 'image',
    };
  }

  // File - Documents, audio, video, stickers all use files[] array
  if (type === 'file' && message.body.file?.files?.[0]) {
    const file = message.body.file.files[0];

    if (!file.mediaUrl || !file.contentType) {
      return null;
    }

    // Detect mediaType from contentType
    let mediaType: 'image' | 'document' | 'audio';

    if (file.contentType.startsWith('audio/')) {
      mediaType = 'audio';
    } else if (file.contentType.startsWith('image/')) {
      // Stickers are sent as type="file" with contentType="image/webp"
      mediaType = 'image';
    } else {
      // PDFs, videos, etc.
      mediaType = 'document';
    }

    return {
      mediaUrl: file.mediaUrl,
      mediaType,
    };
  }

  return null;
}

/**
 * Fetch latest media message from conversation
 * This is the PRIMARY way to get mediaUrl (not a fallback)
 *
 * @param conversationId - Bird conversation UUID
 * @returns Extracted media URL and detected type
 * @throws Error if BIRD_ACCESS_KEY or BIRD_WORKSPACE_ID missing
 * @throws Error if Bird API request fails
 * @throws Error if no media messages found
 */
export async function fetchLatestMediaFromConversation(
  conversationId: string
): Promise<ExtractedMedia> {
  const accessKey = process.env.BIRD_ACCESS_KEY;
  const workspaceId = process.env.BIRD_WORKSPACE_ID;

  if (!accessKey || !workspaceId) {
    throw new Error('Missing BIRD_ACCESS_KEY or BIRD_WORKSPACE_ID');
  }

  // Fetch most recent message only (limit=1 for efficiency)
  const url = `https://api.bird.com/workspaces/${workspaceId}/conversations/${conversationId}/messages?limit=1`;

  const response = await fetch(url, {
    headers: {
      Authorization: `AccessKey ${accessKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Bird API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const parsed = MessagesResponseSchema.parse(data);

  // With limit=1, we only get the most recent message
  if (parsed.results.length === 0) {
    throw new Error('No messages found in conversation');
  }

  const latestMessage = parsed.results[0]!;

  // Validate message is from contact (not bot)
  if (latestMessage.sender.type !== 'contact') {
    throw new Error('Latest message is not from contact (sent by bot)');
  }

  // Validate message type (reject text and location)
  if (latestMessage.body.type === 'text') {
    throw new Error('Latest message is text, not media');
  }

  if (latestMessage.body.type === 'location') {
    throw new Error('Location messages are not supported');
  }

  // Extract media with auto-detected type
  const extracted = extractMediaFromMessage(latestMessage);

  if (!extracted) {
    throw new Error('Could not extract media URL from latest message');
  }

  return extracted;
}
