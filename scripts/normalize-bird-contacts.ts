/**
 * Bird CRM Contact Normalization Script
 *
 * Automatically normalizes contact data from conversations:
 * - Extracts full names (firstName/lastName)
 * - Extracts emails from conversation text
 * - Infers country from phone code
 * - Cleans emojis and special characters from displayName
 *
 * Usage:
 *   pnpm tsx scripts/normalize-bird-contacts.ts --dry-run --limit 100
 *   pnpm tsx scripts/normalize-bird-contacts.ts --execute
 *   pnpm tsx scripts/normalize-bird-contacts.ts --execute --limit 50
 */

// CRITICAL: Load environment variables BEFORE any imports
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

import { type BirdContact, listAllContacts, updateContact } from '@/lib/bird/contacts';
import { findConversationByPhone, getConversationMessages } from '@/lib/bird/conversations';
import {
  cleanDisplayName,
  extractEmail,
  extractNameHybrid,
  inferCountryFromPhone,
  isInstagramUsername,
  isOnlyEmojis,
  isValidName,
} from '@/lib/normalization/extractors';
import { saveNormalizationResult } from '@/lib/normalization/tracking';

/**
 * Sleep utility for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Normalization result for a single contact
 */
interface NormalizationResult {
  contactId: string;
  status: 'success' | 'needs_review' | 'error' | 'skipped';
  reason?: string;
  before?: {
    displayName: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    country?: string;
  };
  after?: {
    displayName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    country?: string;
  };
  confidence?: number;
}

/**
 * Check if contact needs normalization
 */
function needsNormalization(contact: BirdContact): boolean {
  const displayName = contact.computedDisplayName || '';

  // Needs normalization if:
  // 1. Display name has emojis
  if (isOnlyEmojis(displayName)) return true;

  // 2. Display name looks like Instagram username
  if (isInstagramUsername(displayName)) return true;

  // 3. Missing firstName or lastName in attributes
  if (!contact.attributes?.firstName || !contact.attributes?.lastName) return true;

  // 4. Missing email in attributes
  if (!contact.attributes?.email) return true;

  // 5. Missing country in attributes
  if (!contact.attributes?.country) return true;

  return false;
}

/**
 * Normalize a single contact
 */
async function normalizeContact(
  contact: BirdContact,
  dryRun: boolean
): Promise<NormalizationResult> {
  const contactId = contact.id;

  console.log(`\n📋 Processing: ${contact.computedDisplayName} (${contactId})`);

  try {
    // Capture "before" state
    const before = {
      displayName: contact.computedDisplayName || '',
      firstName: contact.attributes?.firstName,
      lastName: contact.attributes?.lastName,
      email: contact.attributes?.email,
      country: contact.attributes?.country,
    };

    // 1. Get phone number from featured identifiers
    const phoneIdentifier = contact.featuredIdentifiers?.find((id) => id.key === 'phonenumber');

    if (!phoneIdentifier) {
      console.log('  ⚠️  No phone number found - skipping');
      return {
        contactId,
        status: 'skipped',
        reason: 'No phone number',
        before,
      };
    }

    const phoneNumber = phoneIdentifier.value;

    // 2. Find conversation by phone number
    console.log('  🔍 Finding conversation...');
    const conversation = await findConversationByPhone(phoneNumber);

    if (!conversation) {
      console.log('  ⚠️  No conversation found - skipping');
      return {
        contactId,
        status: 'skipped',
        reason: 'No conversation found',
        before,
      };
    }

    const conversationId = conversation.id;

    // 3. Fetch conversation messages
    console.log('  📥 Fetching conversation messages...');
    const messages = await getConversationMessages(conversationId);

    if (messages.length === 0) {
      console.log('  ⚠️  No messages found - skipping');
      return {
        contactId,
        status: 'skipped',
        reason: 'No conversation messages',
        before,
      };
    }

    // Extract text content from messages
    // BirdMessage.body can be { type: 'text', text?: { text?: string } | string }
    const messageTexts = messages
      .map((m) => {
        if (m.body.type === 'text') {
          // Handle both string and object formats
          if (typeof m.body.text === 'string') {
            return m.body.text;
          } else if (typeof m.body.text === 'object' && m.body.text?.text) {
            return m.body.text.text;
          }
        }
        return null;
      })
      .filter((text): text is string => Boolean(text));

    console.log(`  💬 Found ${messageTexts.length} text messages`);

    // 4. Extract data from conversation
    console.log('  🔍 Extracting data...');

    const nameResult = await extractNameHybrid(messageTexts);
    const emailResult = extractEmail(messageTexts);
    const countryResult = inferCountryFromPhone(phoneNumber);

    console.log(`     Name: ${nameResult.fullName || 'NOT FOUND'}`);
    console.log(`     Email: ${emailResult || 'NOT FOUND'}`);
    console.log(`     Country: ${countryResult || 'NOT FOUND'}`);
    console.log(`     Confidence: ${nameResult.confidence.toFixed(2)}`);
    console.log(`     Method: ${nameResult.method}`);

    // 4. Validate confidence (threshold: 0.6 for Gemini-assisted extraction)
    if (nameResult.confidence < 0.6) {
      console.log(`  ⚠️  Low confidence (${nameResult.confidence.toFixed(2)}) - marking for review`);

      // Save to database for manual review
      if (!dryRun) {
        await saveNormalizationResult({
          contactId,
          conversationId,
          status: 'needs_review',
          confidence: nameResult.confidence,
          extractedData: {
            ...nameResult,
            email: emailResult,
            country: countryResult,
          },
          before,
        });
      }

      return {
        contactId,
        status: 'needs_review',
        confidence: nameResult.confidence,
        before,
      };
    }

    // 5. Validate extracted name
    if (!isValidName(nameResult.firstName) || !isValidName(nameResult.lastName)) {
      console.log('  ⚠️  Invalid name format - marking for review');

      if (!dryRun) {
        await saveNormalizationResult({
          contactId,
          conversationId,
          status: 'needs_review',
          confidence: nameResult.confidence,
          extractedData: {
            ...nameResult,
            email: emailResult,
            country: countryResult,
          },
          before,
          errorMessage: 'Invalid name format',
        });
      }

      return {
        contactId,
        status: 'needs_review',
        reason: 'Invalid name format',
        confidence: nameResult.confidence,
        before,
      };
    }

    // 6. Build update payload
    const updatePayload: {
      firstName?: string;
      lastName?: string;
      attributes?: Record<string, string>;
    } = {};

    // Only update if we have valid data
    if (nameResult.firstName && nameResult.lastName) {
      updatePayload.firstName = nameResult.firstName;
      updatePayload.lastName = nameResult.lastName;
    }

    // Update attributes (email, country) - only add if found
    updatePayload.attributes = { ...contact.attributes };
    if (emailResult) {
      updatePayload.attributes.email = emailResult;
    }
    if (countryResult) {
      updatePayload.attributes.country = countryResult;
    }

    // Capture "after" state
    const after = {
      displayName: contact.computedDisplayName, // Keep original displayName
      firstName: updatePayload.firstName,
      lastName: updatePayload.lastName,
      email: updatePayload.attributes?.email,
      country: updatePayload.attributes?.country,
    };

    // 7. Update contact in Bird CRM (if not dry-run)
    if (!dryRun) {
      console.log('  🔄 Updating contact...');
      await updateContact(contactId, updatePayload);

      // Save success to database
      await saveNormalizationResult({
        contactId,
        conversationId,
        status: 'success',
        confidence: nameResult.confidence,
        extractedData: {
          ...nameResult,
          email: emailResult,
          country: countryResult,
        },
        before,
        after,
      });

      console.log('  ✅ Updated successfully');
    } else {
      console.log('  [DRY-RUN] Would update with:');
      console.log('     firstName:', updatePayload.firstName);
      console.log('     lastName:', updatePayload.lastName);
      console.log('     email:', updatePayload.attributes?.email);
      console.log('     country:', updatePayload.attributes?.country);
    }

    return {
      contactId,
      status: 'success',
      confidence: nameResult.confidence,
      before,
      after,
    };
  } catch (error: any) {
    console.log(`  ❌ Error: ${error.message}`);

    // Save error to database
    if (!dryRun) {
      await saveNormalizationResult({
        contactId,
        status: 'error',
        errorMessage: error.message,
      });
    }

    return {
      contactId,
      status: 'error',
      reason: error.message,
    };
  }
}

/**
 * Main script execution
 */
async function main() {
  console.log('🔄 Bird CRM Contact Normalizer\n');

  // Parse CLI arguments
  const args = process.argv.slice(2);
  let dryRun = true; // Default to dry-run for safety
  let limit: number | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') {
      dryRun = true;
    } else if (args[i] === '--execute') {
      dryRun = false;
    } else if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    }
  }

  console.log(`Mode: ${dryRun ? '🧪 DRY-RUN' : '🚀 PRODUCTION'}`);
  console.log(`Limit: ${limit || 'All contacts'}\n`);

  // Safety warning for production mode
  if (!dryRun) {
    console.log('⚠️  WARNING: Production mode will UPDATE Bird CRM contacts!');
    console.log('   Press Ctrl+C within 5 seconds to cancel...\n');
    await sleep(5000);
  }

  // 1. Fetch all contacts from Bird CRM
  console.log('📥 Fetching all contacts from Bird CRM...');
  const allContacts = await listAllContacts();
  console.log(`   Total contacts: ${allContacts.length}\n`);

  // 2. Filter contacts that need normalization
  console.log('🔍 Filtering contacts that need normalization...');
  const needsNorm = allContacts.filter(needsNormalization);
  console.log(`   Needs normalization: ${needsNorm.length}\n`);

  // Apply limit if specified
  const toProcess = limit ? needsNorm.slice(0, limit) : needsNorm;
  console.log(`   Will process: ${toProcess.length}\n`);

  if (toProcess.length === 0) {
    console.log('✅ No contacts need normalization. Exiting.');
    return;
  }

  // 3. Process each contact
  const results: NormalizationResult[] = [];
  let processed = 0;

  for (const contact of toProcess) {
    processed++;
    console.log(`\n[${processed}/${toProcess.length}]`);

    const result = await normalizeContact(contact, dryRun);
    results.push(result);

    // Rate limiting: 100ms delay between requests
    if (!dryRun && processed < toProcess.length) {
      await sleep(100);
    }
  }

  // 4. Print summary
  console.log('\n\n📊 Summary:');
  console.log('─'.repeat(50));
  console.log(`Success:       ${results.filter((r) => r.status === 'success').length}`);
  console.log(`Needs Review:  ${results.filter((r) => r.status === 'needs_review').length}`);
  console.log(`Errors:        ${results.filter((r) => r.status === 'error').length}`);
  console.log(`Skipped:       ${results.filter((r) => r.status === 'skipped').length}`);
  console.log(`Total:         ${results.length}`);
  console.log('─'.repeat(50));

  if (dryRun) {
    console.log('\n💡 This was a DRY-RUN. No changes were made to Bird CRM.');
    console.log('   Run with --execute to apply changes.\n');
  } else {
    console.log('\n✅ Normalization complete! Changes have been applied to Bird CRM.\n');
  }
}

// Execute script
main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
