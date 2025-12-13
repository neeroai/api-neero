/**
 * Bird Conversations API - Media Extraction
 * Fetch latest media message from WhatsApp conversation
 * Edge Runtime compatible
 */

import { z } from 'zod';

// Schema para mensaje de Bird API
const BirdMessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  sender: z.object({
    type: z.enum(['contact', 'bot']),
  }),
  body: z.object({
    type: z.enum(['text', 'image', 'file', 'audio', 'video']),
    image: z
      .object({
        url: z.string().optional(), // Optional - validated in extraction logic
      })
      .optional(),
    file: z
      .object({
        files: z
          .array(
            z.object({
              mediaUrl: z.string().optional(), // Optional - validated in extraction logic
              contentType: z.string().optional(),
              filename: z.string().optional(),
            })
          )
          .optional(), // Array itself can be missing
      })
      .optional(),
    audio: z
      .object({
        url: z.string().optional(), // Optional - validated in extraction logic
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
 */
function extractMediaFromMessage(message: BirdMessage): ExtractedMedia | null {
  const { type } = message.body;

  // Image
  if (type === 'image' && message.body.image?.url) {
    return {
      mediaUrl: message.body.image.url,
      mediaType: 'image',
    };
  }

  // File/Document
  if (type === 'file' && message.body.file?.files[0]?.mediaUrl) {
    return {
      mediaUrl: message.body.file.files[0].mediaUrl,
      mediaType: 'document',
    };
  }

  // Audio
  if (type === 'audio' && message.body.audio?.url) {
    return {
      mediaUrl: message.body.audio.url,
      mediaType: 'audio',
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

  // Fetch recent messages (limit 10 to find latest media)
  const url = `https://api.bird.com/workspaces/${workspaceId}/conversations/${conversationId}/messages?limit=10`;

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

  // Filter messages from contact (user) with media, sorted by newest first
  const mediaMessages = parsed.results
    .filter((msg) => msg.sender.type === 'contact')
    .filter((msg) => msg.body.type !== 'text')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (mediaMessages.length === 0) {
    throw new Error('No media messages found in conversation');
  }

  // Extract media from most recent message
  const latestMedia = extractMediaFromMessage(mediaMessages[0]!);

  if (!latestMedia) {
    throw new Error('Could not extract media URL from latest message');
  }

  return latestMedia;
}
