#!/usr/bin/env tsx
/**
 * @file Batch Contact Normalization Script
 * @description Normalize ALL Bird CRM contacts using GPT-4o-mini extractor
 * @module scripts/batch-normalize-all-contacts
 *
 * Usage:
 *   tsx scripts/batch-normalize-all-contacts.ts --dry-run        # Preview only (no updates)
 *   tsx scripts/batch-normalize-all-contacts.ts --execute        # Execute normalization
 *   tsx scripts/batch-normalize-all-contacts.ts --execute --limit 100  # Test with 100 contacts
 *   tsx scripts/batch-normalize-all-contacts.ts --execute --resume     # Resume from checkpoint
 *
 * Features:
 *   - Pagination support (100 contacts/page)
 *   - Rate limit safe (100 req/min)
 *   - Progress bar with ETA
 *   - Cost estimation
 *   - Checkpoint/resume functionality
 *   - Dry-run mode for testing
 */

import { listAllContacts, updateContact } from '../lib/bird/contacts';
import { getConversationMessages, findConversationByPhone } from '../lib/bird/conversations';
import { extractContactDataGPT4oMini, estimateExtractionCost } from '../lib/normalization/gpt4o-mini-extractor';
import { db } from '../lib/db/client';
import { contactNormalizations } from '../lib/db/schema';
import { desc, eq } from 'drizzle-orm';

interface ScriptOptions {
  dryRun: boolean;
  limit?: number;
  resume: boolean;
  checkpointFile: string;
}

interface Checkpoint {
  processedCount: number;
  successCount: number;
  failureCount: number;
  lowConfidenceCount: number;
  lastContactId: string;
  totalCost: number;
}

/**
 * Parse command-line arguments
 */
function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2);

  const dryRun = !args.includes('--execute');
  const limit = args.find(arg => arg.startsWith('--limit='))?.split('=')[1];
  const resume = args.includes('--resume');
  const checkpointFile = './batch-normalize-checkpoint.json';

  return {
    dryRun,
    limit: limit ? parseInt(limit, 10) : undefined,
    resume,
    checkpointFile,
  };
}

/**
 * Load checkpoint from file
 */
async function loadCheckpoint(file: string): Promise<Checkpoint | null> {
  try {
    const fs = await import('fs/promises');
    const content = await fs.readFile(file, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Save checkpoint to file
 */
async function saveCheckpoint(file: string, checkpoint: Checkpoint): Promise<void> {
  try {
    const fs = await import('fs/promises');
    await fs.writeFile(file, JSON.stringify(checkpoint, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save checkpoint:', error);
  }
}

/**
 * Main batch normalization logic
 */
async function main() {
  const options = parseArgs();
  const startTime = Date.now();

  console.log('='.repeat(80));
  console.log('BATCH CONTACT NORMALIZATION SCRIPT');
  console.log('='.repeat(80));
  console.log(`Mode: ${options.dryRun ? 'DRY RUN (no updates)' : 'EXECUTE (will update contacts)'}`);
  console.log(`Limit: ${options.limit || 'All contacts'}`);
  console.log(`Resume: ${options.resume ? 'Yes' : 'No'}`);
  console.log('='.repeat(80));
  console.log();

  // Load checkpoint if resuming
  let checkpoint: Checkpoint | null = null;
  if (options.resume) {
    checkpoint = await loadCheckpoint(options.checkpointFile);
    if (checkpoint) {
      console.log(`Resuming from checkpoint (processed: ${checkpoint.processedCount})`);
      console.log();
    } else {
      console.log('No checkpoint found, starting from beginning');
      console.log();
    }
  }

  // Initialize counters
  let processedCount = checkpoint?.processedCount || 0;
  let successCount = checkpoint?.successCount || 0;
  let failureCount = checkpoint?.failureCount || 0;
  let lowConfidenceCount = checkpoint?.lowConfidenceCount || 0;
  let totalCost = checkpoint?.totalCost || 0;
  let skippedCount = 0;

  // Fetch all contacts (paginated)
  console.log('Fetching contacts from Bird CRM...');
  const contacts = await listAllContacts();
  console.log(`Total contacts: ${contacts.length}`);
  console.log();

  // Sort by createdAt descending (newest first)
  contacts.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA; // Descending order
  });
  console.log(`Sorted by creation date (newest first)`);
  console.log(`Newest: ${contacts[0]?.createdAt || 'N/A'}`);
  console.log(`Oldest: ${contacts[contacts.length - 1]?.createdAt || 'N/A'}`);
  console.log();

  // Apply limit if specified
  const contactsToProcess = options.limit ? contacts.slice(0, options.limit) : contacts;
  console.log(`Contacts to process: ${contactsToProcess.length}`);
  console.log();

  // Cost estimation
  const estimatedCost = estimateExtractionCost(contactsToProcess.length);
  console.log(`Estimated cost: $${estimatedCost.toFixed(4)}`);
  console.log();

  if (options.dryRun) {
    console.log('DRY RUN - Will preview first 10 contacts only');
    console.log();
  }

  // Confirm execution
  if (!options.dryRun) {
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('Starting normalization...');
    console.log();
  }

  // Process contacts
  for (let i = 0; i < contactsToProcess.length; i++) {
    const contact = contactsToProcess[i];

    // Resume logic: skip contacts before checkpoint
    if (checkpoint && contact.id <= checkpoint.lastContactId) {
      continue;
    }

    // Progress
    processedCount++;
    const progress = ((i + 1) / contactsToProcess.length) * 100;
    const elapsed = Date.now() - startTime;
    const eta = (elapsed / (i + 1)) * (contactsToProcess.length - i - 1);

    console.log(`[${i + 1}/${contactsToProcess.length}] (${progress.toFixed(1)}%) Contact: ${contact.id}`);

    try {
      // 1. Check if already normalized (skip)
      const existingResults = await db
        .select()
        .from(contactNormalizations)
        .where(eq(contactNormalizations.contactId, contact.id))
        .orderBy(desc(contactNormalizations.createdAt))
        .limit(1);

      const existing = existingResults[0];

      if (existing && existing.status === 'success' && existing.confidence && existing.confidence >= 0.6) {
        console.log(`  ✓ Already normalized (confidence: ${existing.confidence}) - SKIPPED`);
        skippedCount++;
        continue;
      }

      // 2. Get phone number from contact identifiers
      const phoneIdentifier = contact.featuredIdentifiers.find(id => id.key === 'phonenumber');
      if (!phoneIdentifier) {
        console.log(`  ✗ No phone number found - SKIPPED`);
        skippedCount++;
        continue;
      }

      const contactPhone = phoneIdentifier.value;

      // 3. Find most recent conversation
      const conversation = await findConversationByPhone(contactPhone);
      if (!conversation) {
        console.log(`  ✗ No conversation found - SKIPPED`);
        skippedCount++;
        continue;
      }

      // 4. Fetch conversation messages (first 10)
      const messages = await getConversationMessages(conversation.id, { limit: 10 });
      const conversationText = messages
        .map((msg) => {
          if (msg.body.type === 'text') {
            return typeof msg.body.text === 'string'
              ? msg.body.text
              : msg.body.text?.text || '';
          }
          return '';
        })
        .filter((text) => text.length > 0)
        .join('\n');

      if (!conversationText || conversationText.trim().length === 0) {
        console.log(`  ✗ No text messages found - SKIPPED`);
        skippedCount++;
        continue;
      }

      // 5. Extract contact data with GPT-4o-mini
      const extracted = await extractContactDataGPT4oMini(conversationText, {
        contactPhone,
        fallbackToRegex: true,
      });

      console.log(`  → Extracted: ${extracted.displayName || '(none)'} | Confidence: ${extracted.confidence.toFixed(2)} | Method: ${extracted.method}`);

      // Update cost tracking
      if (extracted.tokensUsed) {
        const cost = (extracted.tokensUsed / 1_000_000) * 0.15; // $0.15 per 1M input tokens
        totalCost += cost;
      }

      // 6. Update contact if confidence >= 0.6 (and not dry-run)
      if (extracted.confidence >= 0.6 && extracted.displayName && !options.dryRun) {
        // Prepare update payload (NO email - attribute doesn't exist in Bird)
        const updatePayload: any = {
          firstName: extracted.firstName,
          lastName: extracted.lastName,
          attributes: {
            displayName: extracted.displayName,
            firstName: extracted.firstName,
            lastName: extracted.lastName,
            jose: extracted.displayName,
            estatus: 'datosok', // Mark as successfully normalized
          },
        };

        // Add country if available
        if (extracted.country) {
          const countryNames: Record<string, string> = {
            CO: 'Colombia', MX: 'Mexico', US: 'United States',
            AR: 'Argentina', CL: 'Chile', PE: 'Peru', EC: 'Ecuador',
            VE: 'Venezuela', ES: 'España',
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

        console.log(`  ✓ Updated successfully`);
        successCount++;
      } else if (extracted.confidence < 0.6 && !options.dryRun) {
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

        console.log(`  ! Low confidence - marked for manual review`);
        lowConfidenceCount++;
      } else if (options.dryRun) {
        console.log(`  → DRY RUN - would ${extracted.confidence >= 0.6 ? 'update' : 'mark for review'}`);
        if (extracted.confidence >= 0.6) successCount++;
        else lowConfidenceCount++;
      }

      // Save checkpoint every 100 contacts
      if (processedCount % 100 === 0 && !options.dryRun) {
        await saveCheckpoint(options.checkpointFile, {
          processedCount,
          successCount,
          failureCount,
          lowConfidenceCount,
          lastContactId: contact.id,
          totalCost,
        });
      }

      // Rate limit: 600ms delay (100 req/min)
      await new Promise(resolve => setTimeout(resolve, 600));

    } catch (error) {
      console.log(`  ✗ Error: ${error}`);
      failureCount++;
    }

    console.log(`  ETA: ${formatETA(eta)}`);
    console.log();

    // Dry-run limit: only first 10 contacts
    if (options.dryRun && i >= 9) {
      console.log('DRY RUN - Stopping after 10 contacts');
      break;
    }
  }

  // Final summary
  const totalElapsed = Date.now() - startTime;
  console.log('='.repeat(80));
  console.log('BATCH NORMALIZATION COMPLETE');
  console.log('='.repeat(80));
  console.log(`Total processed: ${processedCount}`);
  console.log(`  ✓ Successful: ${successCount}`);
  console.log(`  ! Low confidence: ${lowConfidenceCount}`);
  console.log(`  ✗ Failed: ${failureCount}`);
  console.log(`  → Skipped: ${skippedCount}`);
  console.log(`Total cost: $${totalCost.toFixed(4)}`);
  console.log(`Total time: ${formatDuration(totalElapsed)}`);
  console.log('='.repeat(80));

  // Clean up checkpoint on completion
  if (!options.dryRun) {
    try {
      const fs = await import('fs/promises');
      await fs.unlink(options.checkpointFile);
    } catch {}
  }
}

/**
 * Format duration in human-readable format
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Format ETA in human-readable format
 */
function formatETA(ms: number): string {
  return formatDuration(ms);
}

// Run script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
