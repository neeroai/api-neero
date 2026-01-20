/**
 * @file Quick Contact Normalization Script
 * @description Normalizes latest 100 Bird CRM contacts (regex-only, zero cost)
 * @module scripts/quick-normalize
 *
 * IDEMPOTENT: Safe to run multiple times - updates contacts with current normalization
 *
 * Updates 5 CRITICAL fields:
 * 1. firstName (top-level field)
 * 2. lastName (top-level field)
 * 3. attributes.displayName (PRIORITY - visible in Bird UI)
 * 4. attributes.country (ISO code from phone: CO, MX, ES)
 * 5. attributes.countryName (full name: Colombia, México, España)
 *
 * Extraction strategy: Regex patterns (zero cost) → displayName cleaning
 * PROHIBITED: Gemini/OpenAI models (use Claude Haiku if AI needed)
 *
 * Usage:
 * ```bash
 * npx tsx scripts/quick-normalize.ts
 * ```
 *
 * Requirements:
 * - BIRD_ACCESS_KEY in .env.local
 * - BIRD_WORKSPACE_ID in .env.local
 *
 * @see docs/bird-contact-normalization-lessons-learned.md
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { listAllContacts, updateContact } from '@/lib/bird/contacts';
import {
  cleanDisplayName,
  splitFullName,
  inferCountryFromPhone,
  phoneToCountryCode,
} from '@/lib/normalization/extractors';

async function main() {
  console.log('🚀 Quick Normalize - Starting with LATEST contacts\n');

  // Fetch ALL contacts
  console.log('📥 Fetching contacts...');
  const allContacts = await listAllContacts();

  // Sort by updatedAt DESC (most recent first)
  const sorted = allContacts.sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  // Take first 100 (most recent)
  const toProcess = sorted.slice(0, 100);

  console.log(`Total: ${allContacts.length}`);
  console.log(`Processing: ${toProcess.length} (most recent)\n`);

  let updated = 0;
  let skipped = 0;
  let alreadyClean = 0;
  const skipReasons: Record<string, number> = {};
  const contactsUpdated: Array<{ id: string; name: string; country: string }> = [];

  for (let i = 0; i < toProcess.length; i++) {
    const contact = toProcess[i];
    console.log(`[${i + 1}/${toProcess.length}] ${contact.computedDisplayName}`);

    const displayName = contact.computedDisplayName || '';

    // Clean emojis
    const cleaned = cleanDisplayName(displayName);

    // Check if already clean (idempotency - skip if no emojis)
    if (cleaned === displayName && displayName.length > 0) {
      console.log('  ⏭️  Skip - already clean (no emojis)');
      alreadyClean++;
      continue;
    }

    if (!cleaned || cleaned.length < 2) {
      const reason = 'empty_after_cleaning';
      console.log('  ⏭️  Skip - empty after cleaning');
      skipReasons[reason] = (skipReasons[reason] || 0) + 1;
      skipped++;
      continue;
    }

    // Split into firstName/lastName
    const { firstName, lastName } = splitFullName(cleaned);

    if (!firstName || !lastName) {
      const reason = 'single_word_name';
      console.log('  ⏭️  Skip - cannot split name');
      skipReasons[reason] = (skipReasons[reason] || 0) + 1;
      skipped++;
      continue;
    }

    // Extract phone number for country inference
    const phoneNumber =
      contact.featuredIdentifiers.find((i) => i.key === 'phonenumber')?.value || '';

    // Infer country from phone code
    const countryName = inferCountryFromPhone(phoneNumber);
    const countryCode = phoneToCountryCode(phoneNumber);

    // CRITICAL: Must update firstName + lastName + displayName + country + countryName
    // displayName has PRIORITY in Bird UI - if not updated, emojis remain visible
    try {
      await updateContact(contact.id, {
        firstName,
        lastName,
        attributes: {
          displayName: `${firstName} ${lastName}`.trim(),
          country: countryCode || undefined,
          countryName: countryName || undefined,
        },
      });

      console.log(`  ✅ Updated: ${firstName} ${lastName} (${countryName || 'unknown'})`);
      updated++;
      contactsUpdated.push({
        id: contact.id,
        name: `${firstName} ${lastName}`,
        country: countryName || 'unknown',
      });

      // Rate limit (500ms to be safe)
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error: any) {
      const reason = 'api_error';
      console.log(`  ❌ Error: ${error.message}`);
      skipReasons[reason] = (skipReasons[reason] || 0) + 1;
      skipped++;
    }
  }

  // Final report
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 Summary`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  console.log(`Total processed: ${toProcess.length}`);
  console.log(`✅ Updated: ${updated}`);
  console.log(`⏭️  Already clean: ${alreadyClean}`);
  console.log(`⏭️  Skipped: ${skipped}`);

  if (Object.keys(skipReasons).length > 0) {
    console.log(`\nSkip reasons:`);
    for (const [reason, count] of Object.entries(skipReasons)) {
      console.log(`  - ${reason}: ${count}`);
    }
  }

  // Save JSON report
  const reportData = {
    timestamp: new Date().toISOString(),
    totalProcessed: toProcess.length,
    updated,
    alreadyClean,
    skipped,
    skipReasons,
    contactsUpdated,
  };

  const fs = await import('fs');
  const reportPath = `results/quick-normalize-${Date.now()}.json`;

  if (!fs.existsSync('results')) {
    fs.mkdirSync('results');
  }

  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2), 'utf-8');
  console.log(`\n📝 Report saved: ${reportPath}\n`);
}

main().catch(console.error);
