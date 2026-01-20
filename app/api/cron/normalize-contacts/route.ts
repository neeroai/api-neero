/**
 * @file Scheduled Contact Normalization Cron
 * @description Daily cron job to normalize recently updated contacts
 * @module app/api/cron/normalize-contacts/route
 * @exports GET, runtime
 * @runtime edge
 */

import { NextResponse } from 'next/server';
import { listAllContacts, updateContact } from '@/lib/bird/contacts';
import { getConversationMessages, findConversationByPhone } from '@/lib/bird/conversations';
import { extractContactDataGPT4oMini } from '@/lib/normalization/gpt4o-mini-extractor';
import { db } from '@/lib/db/client';
import { contactNormalizations } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { TimeBudget } from '@/lib/ai/timeout';
import { handleRouteError, UnauthorizedError } from '@/lib/errors';

export const runtime = 'edge';

/**
 * Vercel Cron: Daily contact normalization
 * Runs at 2 AM Colombia time (7 AM UTC)
 *
 * Flow:
 * 1. Verify cron authorization
 * 2. Fetch contacts updated in last 24 hours
 * 3. Filter contacts that need normalization
 * 4. Normalize using GPT-4o-mini extractor
 * 5. Send summary email (optional)
 */
export async function GET(request: Request): Promise<Response> {
  const startTime = Date.now();
  const budget = new TimeBudget(540000); // 9 minutes (Vercel cron timeout: 10 min)

  try {
    // 1. Verify cron authorization (Vercel sets this header)
    const authHeader = request.headers.get('Authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (authHeader !== expectedAuth) {
      throw new UnauthorizedError('Invalid cron authorization');
    }

    console.log('[Cron] Starting daily contact normalization...');

    // 2. Fetch all contacts (we'll filter by update time)
    const contacts = await listAllContacts();
    console.log(`[Cron] Total contacts: ${contacts.length}`);

    budget.checkBudget();

    // 3. Filter contacts updated in last 24 hours that need normalization
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentlyUpdatedContacts = contacts.filter((contact) => {
      return contact.updatedAt >= yesterday;
    });

    console.log(`[Cron] Recently updated contacts (last 24h): ${recentlyUpdatedContacts.length}`);

    // 4. Check which contacts need normalization
    const contactsToNormalize = [];
    for (const contact of recentlyUpdatedContacts) {
      const existingResults = await db
        .select()
        .from(contactNormalizations)
        .where(eq(contactNormalizations.contactId, contact.id))
        .orderBy(desc(contactNormalizations.createdAt))
        .limit(1);

      const existing = existingResults[0];

      // Skip if already normalized with high confidence
      if (existing && existing.status === 'success' && existing.confidence && existing.confidence >= 0.6) {
        continue;
      }

      contactsToNormalize.push(contact);
    }

    console.log(`[Cron] Contacts to normalize: ${contactsToNormalize.length}`);

    budget.checkBudget();

    // 5. Normalize contacts
    let successCount = 0;
    let lowConfidenceCount = 0;
    let failureCount = 0;
    let skippedCount = 0;
    let totalCost = 0;

    for (const contact of contactsToNormalize) {
      try {
        // Get phone number
        const phoneIdentifier = contact.featuredIdentifiers.find((id) => id.key === 'phonenumber');
        if (!phoneIdentifier) {
          skippedCount++;
          continue;
        }

        const contactPhone = phoneIdentifier.value;

        // Find conversation
        const conversation = await findConversationByPhone(contactPhone);
        if (!conversation) {
          skippedCount++;
          continue;
        }

        // Fetch messages (get all, then take last 10)
        const allMessages = await getConversationMessages(conversation.id);
        const messages = allMessages.slice(-10); // Last 10 messages
        const conversationText = messages
          .map((msg) => {
            if (msg.body.type === 'text') {
              const body = msg.body as { type: 'text'; text?: { text?: string } | string };
              return typeof body.text === 'string' ? body.text : body.text?.text || '';
            }
            return '';
          })
          .filter((text) => text.length > 0)
          .join('\n');

        if (!conversationText || conversationText.trim().length === 0) {
          skippedCount++;
          continue;
        }

        // Extract contact data
        const extracted = await extractContactDataGPT4oMini(conversationText, {
          contactPhone,
          fallbackToRegex: true,
        });

        // Update cost tracking
        if (extracted.tokensUsed) {
          const cost = (extracted.tokensUsed / 1_000_000) * 0.15;
          totalCost += cost;
        }

        // Update contact if confidence >= 0.6
        if (extracted.confidence >= 0.6 && extracted.displayName) {
          const updatePayload: any = {
            firstName: extracted.firstName,
            lastName: extracted.lastName,
            attributes: {
              displayName: extracted.displayName,
              firstName: extracted.firstName,
              lastName: extracted.lastName,
              jose: extracted.displayName,
            },
          };

          if (extracted.email) {
            updatePayload.attributes.email = extracted.email;
          }

          if (extracted.country) {
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

          await updateContact(contact.id, updatePayload);

          // Log success
          await db.insert(contactNormalizations).values({
            contactId: contact.id,
            conversationId: conversation.id,
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

          successCount++;
        } else {
          // Log for manual review
          await db.insert(contactNormalizations).values({
            contactId: contact.id,
            conversationId: conversation.id,
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

          lowConfidenceCount++;
        }

        // Budget check
        budget.checkBudget();

        // Rate limit: 600ms delay (100 req/min)
        await new Promise((resolve) => setTimeout(resolve, 600));
      } catch (error) {
        console.error(`[Cron] Error normalizing contact ${contact.id}:`, error);
        failureCount++;
      }
    }

    const totalElapsed = Date.now() - startTime;

    // 6. Build summary
    const summary = {
      success: true,
      message: 'Daily contact normalization completed',
      stats: {
        totalContacts: contacts.length,
        recentlyUpdated: recentlyUpdatedContacts.length,
        normalized: contactsToNormalize.length,
        successful: successCount,
        lowConfidence: lowConfidenceCount,
        failed: failureCount,
        skipped: skippedCount,
        totalCost: `$${totalCost.toFixed(4)}`,
        processingTime: `${(totalElapsed / 1000).toFixed(1)}s`,
      },
    };

    console.log('[Cron] Summary:', JSON.stringify(summary.stats, null, 2));

    // TODO: Send summary email (Resend integration)
    // await sendDailySummaryEmail(summary);

    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    return handleRouteError(error);
  }
}
