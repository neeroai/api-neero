/**
 * @file Bird conversation.created Webhook Handler
 * @description Proactive contact normalization when new conversation created
 * @module app/api/webhooks/bird/conversation-created/route
 * @exports POST, runtime
 * @runtime edge
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyBirdWebhookSignature } from '@/lib/bird/webhook-signature';
import { updateContact } from '@/lib/bird/contacts';
import { getConversationMessages } from '@/lib/bird/conversations';
import { extractContactDataGPT4oMini } from '@/lib/normalization/gpt4o-mini-extractor';
import { TimeBudget, TimeoutBudgetError } from '@/lib/ai/timeout';
import { db } from '@/lib/db/client';
import { contactNormalizations } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import {
  handleRouteError,
  TimeoutError,
  UnauthorizedError,
  ValidationError,
} from '@/lib/errors';

export const runtime = 'edge';

/**
 * Zod schema for Bird conversation.created event (actual format from Bird API)
 */
const ConversationCreatedEventSchema = z.object({
  service: z.literal('conversations'),
  event: z.literal('conversation.created'),
  payload: z.object({
    id: z.string().uuid(), // Conversation ID
    channelId: z.string().optional(),
    featuredParticipants: z
      .array(
        z.object({
          id: z.string().uuid(), // Contact/Participant ID
          type: z.string(),
          displayName: z.string().optional(),
          contact: z
            .object({
              identifierKey: z.string(),
              identifierValue: z.string(), // Phone number
              platformAddress: z.string().optional(),
            })
            .optional(),
        })
      )
      .optional(),
  }),
});

type ConversationCreatedEvent = z.infer<typeof ConversationCreatedEventSchema>;

/**
 * POST handler for Bird conversation.created webhook
 * Automatically normalizes contact data on first conversation
 *
 * Flow:
 * 1. Verify webhook signature (security)
 * 2. Check if already normalized (idempotency)
 * 3. Fetch conversation messages (first 10 for context)
 * 4. Extract contact data with GPT-4o-mini
 * 5. Update contact if confidence >= 0.6
 * 6. Log to contact_normalizations table
 */
export async function POST(request: Request): Promise<Response> {
  const startTime = Date.now();
  const budget = new TimeBudget(25000); // 25s budget (Bird webhook timeout: 30s)

  try {
    // 1. Verify webhook signature
    const rawBody = await request.text();
    const signature = request.headers.get('X-Bird-Signature');

    if (!(await verifyBirdWebhookSignature(signature, rawBody))) {
      throw new UnauthorizedError('Invalid webhook signature');
    }

    budget.checkBudget();

    // 2. Parse event payload
    const event = parseWebhookEvent(rawBody);
    const { conversationId, contactId, contactPhone } = extractEventData(event);

    console.log(`[Webhook] conversation.created - Conversation: ${conversationId}, Contact: ${contactId}`);

    budget.checkBudget();

    // 3. Check if already normalized (idempotency)
    const existingResults = await db
      .select()
      .from(contactNormalizations)
      .where(eq(contactNormalizations.contactId, contactId))
      .orderBy(desc(contactNormalizations.createdAt))
      .limit(1);

    const existing = existingResults[0];

    if (existing && existing.status === 'success' && existing.confidence && existing.confidence >= 0.6) {
      console.log(`[Webhook] Contact ${contactId} already normalized (confidence: ${existing.confidence})`);
      return NextResponse.json(
        {
          success: true,
          message: 'Contact already normalized',
          skipped: true,
          existingNormalization: {
            status: existing.status,
            confidence: existing.confidence,
            createdAt: existing.createdAt,
          },
        },
        { status: 200 }
      );
    }

    budget.checkBudget();

    // 4. Fetch conversation messages (first 10 for context)
    console.log(`[Webhook] Fetching conversation messages...`);
    const messages = await getConversationMessages(conversationId);

    // Extract text from messages (filter out media-only messages)
    const conversationText = messages
      .map((msg) => {
        if (msg.body.type === 'text') {
          const textBody = msg.body.text as any;
          return typeof textBody === 'string'
            ? textBody
            : textBody?.text || '';
        }
        return '';
      })
      .filter((text) => text.length > 0)
      .join('\n');

    if (!conversationText || conversationText.trim().length === 0) {
      console.log(`[Webhook] No text messages found in conversation ${conversationId}`);
      return NextResponse.json(
        {
          success: false,
          error: 'No text messages in conversation',
          code: 'NO_TEXT_MESSAGES',
        },
        { status: 400 }
      );
    }

    budget.checkBudget();

    // 5. Extract contact data with GPT-4o-mini
    console.log(`[Webhook] Extracting contact data with GPT-4o-mini...`);
    const extracted = await extractContactDataGPT4oMini(conversationText, {
      contactPhone,
      fallbackToRegex: true,
    });

    console.log(`[Webhook] Extraction result - Confidence: ${extracted.confidence}, Method: ${extracted.method}`);

    budget.checkBudget();

    // 6. Update contact if confidence >= 0.6
    if (extracted.confidence >= 0.6 && extracted.displayName) {
      console.log(`[Webhook] Updating contact ${contactId}...`);

      // Prepare update payload (dual-field strategy)
      const updatePayload: any = {
        firstName: extracted.firstName,
        lastName: extracted.lastName,
        attributes: {
          displayName: extracted.displayName,
          firstName: extracted.firstName,
          lastName: extracted.lastName,
          jose: extracted.displayName, // Custom full name field
        },
      };

      // Add email if extracted
      if (extracted.email) {
        updatePayload.attributes.email = extracted.email;
      }

      // Add country if extracted
      if (extracted.country) {
        // Convert ISO code to full name
        const countryNames: Record<string, string> = {
          CO: 'Colombia',
          MX: 'Mexico',
          US: 'United States',
          AR: 'Argentina',
          CL: 'Chile',
          PE: 'Peru',
          EC: 'Ecuador',
          VE: 'Venezuela',
          ES: 'España',
        };

        updatePayload.attributes.country = countryNames[extracted.country] || extracted.country;
      }

      await updateContact(contactId, updatePayload);

      budget.checkBudget();

      // Log success
      await db.insert(contactNormalizations).values({
        contactId,
        conversationId,
        status: 'success',
        confidence: extracted.confidence,
        extractedData: {
          displayName: extracted.displayName,
          firstName: extracted.firstName,
          lastName: extracted.lastName,
          email: extracted.email,
          country: extracted.country,
          method: extracted.method,
          tokensUsed: extracted.tokensUsed,
        },
      });

      console.log(`[Webhook] Contact ${contactId} normalized successfully`);

      return NextResponse.json(
        {
          success: true,
          message: 'Contact normalized successfully',
          data: {
            contactId,
            conversationId,
            confidence: extracted.confidence,
            method: extracted.method,
            extractedData: {
              displayName: extracted.displayName,
              email: extracted.email,
              country: extracted.country,
            },
          },
          processingTime: formatProcessingTime(startTime),
        },
        { status: 200 }
      );
    } else {
      // Low confidence - mark for manual review
      console.log(`[Webhook] Low confidence (${extracted.confidence}), marking for manual review`);

      await db.insert(contactNormalizations).values({
        contactId,
        conversationId,
        status: 'needs_review',
        confidence: extracted.confidence,
        extractedData: {
          displayName: extracted.displayName,
          firstName: extracted.firstName,
          lastName: extracted.lastName,
          email: extracted.email,
          country: extracted.country,
          method: extracted.method,
          tokensUsed: extracted.tokensUsed,
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Contact marked for manual review (low confidence)',
          data: {
            contactId,
            conversationId,
            confidence: extracted.confidence,
            needsReview: true,
          },
          processingTime: formatProcessingTime(startTime),
        },
        { status: 200 }
      );
    }
  } catch (error) {
    if (error instanceof TimeoutBudgetError) {
      throw new TimeoutError(error.message, { budgetMs: 25000 });
    }

    return handleRouteError(error);
  }
}

/**
 * Helper: Parse webhook event payload
 */
function parseWebhookEvent(rawBody: string): ConversationCreatedEvent {
  try {
    const json = JSON.parse(rawBody);
    return ConversationCreatedEventSchema.parse(json);
  } catch (error) {
    throw new ValidationError('Invalid webhook payload', { error });
  }
}

/**
 * Helper: Extract relevant data from event (updated for actual Bird format)
 */
function extractEventData(event: ConversationCreatedEvent): {
  conversationId: string;
  contactId: string;
  contactPhone: string;
} {
  const conversationId = event.payload.id;
  const participants = event.payload.featuredParticipants;

  if (!participants || participants.length === 0) {
    throw new ValidationError('Missing featuredParticipants in webhook payload');
  }

  // Find first contact participant
  const contactParticipant = participants.find((p) => p.type === 'contact');

  if (!contactParticipant) {
    throw new ValidationError('No contact participant found in webhook payload');
  }

  if (!contactParticipant.contact?.identifierValue) {
    throw new ValidationError('Missing contact identifierValue in webhook payload');
  }

  return {
    conversationId,
    contactId: contactParticipant.id,
    contactPhone: contactParticipant.contact.identifierValue,
  };
}

/**
 * Helper: Format processing time
 */
function formatProcessingTime(startTime: number): string {
  const elapsed = Date.now() - startTime;
  return `${(elapsed / 1000).toFixed(1)}s`;
}
