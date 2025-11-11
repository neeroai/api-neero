/**
 * WhatsApp Send Message API - Edge Runtime
 * Sends text, button, and list messages via WhatsApp Cloud API v23.0
 * Includes rate limiting and input validation
 */

import { z } from 'zod';
import {
  sendTextMessage,
  sendButtonMessage,
  sendListMessage,
  type Button,
  type Section,
} from '@/lib/whatsapp/messaging';
import { checkRateLimit } from '@/lib/whatsapp/rate-limit';

export const runtime = 'edge';

/**
 * Zod schema for send message request
 */
const sendMessageSchema = z.object({
  to: z.string().min(1, 'Recipient phone number required'),
  message: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('text'),
      text: z.string().min(1).max(4096),
    }),
    z.object({
      type: z.literal('button'),
      text: z.string().min(1).max(4096),
      buttons: z
        .array(
          z.object({
            id: z.string().min(1),
            title: z.string().min(1).max(20),
          })
        )
        .min(1)
        .max(3),
    }),
    z.object({
      type: z.literal('list'),
      text: z.string().min(1).max(4096),
      buttonText: z.string().min(1).max(20),
      sections: z
        .array(
          z.object({
            title: z.string().min(1).max(24),
            rows: z
              .array(
                z.object({
                  id: z.string().min(1),
                  title: z.string().min(1).max(24),
                  description: z.string().max(72).optional(),
                })
              )
              .min(1)
              .max(10),
          })
        )
        .min(1),
    }),
  ]),
});

type SendMessageRequest = z.infer<typeof sendMessageSchema>;

/**
 * POST handler for sending WhatsApp messages
 * @param request - Next.js request object
 * @returns JSON response with message ID or error
 */
export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = sendMessageSchema.safeParse(body);

    if (!validatedData.success) {
      return Response.json(
        {
          error: 'Invalid request body',
          details: validatedData.error.errors,
        },
        { status: 400 }
      );
    }

    const { to, message } = validatedData.data;

    // Check rate limit
    const rateLimitResponse = checkRateLimit(to);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Send message based on type
    let response;

    if (message.type === 'text') {
      response = await sendTextMessage(to, message.text);
    } else if (message.type === 'button') {
      const buttons: Button[] = message.buttons.map((btn) => ({
        id: btn.id,
        title: btn.title,
      }));
      response = await sendButtonMessage(to, message.text, buttons);
    } else if (message.type === 'list') {
      const sections: Section[] = message.sections.map((section) => ({
        title: section.title,
        rows: section.rows.map((row) => ({
          id: row.id,
          title: row.title,
          description: row.description,
        })),
      }));
      response = await sendListMessage(
        to,
        message.text,
        message.buttonText,
        sections
      );
    } else {
      return Response.json(
        { error: 'Unsupported message type' },
        { status: 400 }
      );
    }

    // Return success response
    return Response.json(
      {
        success: true,
        messageId: response.messages[0].id,
        recipient: response.contacts[0].wa_id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Send message error:', error);

    // Handle specific error types
    if (error instanceof Error) {
      // WhatsApp API errors
      if (error.message.includes('WhatsApp API error')) {
        return Response.json(
          { error: error.message },
          { status: 502 }
        );
      }

      // Configuration errors
      if (error.message.includes('not configured')) {
        return Response.json(
          { error: 'Server configuration error' },
          { status: 500 }
        );
      }

      // Button limit errors
      if (error.message.includes('max 3 buttons')) {
        return Response.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    // Generic error response
    return Response.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
