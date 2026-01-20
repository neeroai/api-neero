/**
 * Quick Capitalize - Fix capitalization for existing contacts
 *
 * Simple script: Read displayName → Capitalize → Update all fields
 * NO conversations, NO AI, ONLY capitalize existing data
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { listAllContacts, updateContact } from '@/lib/bird/contacts';
import { cleanDisplayName, splitFullName } from '@/lib/normalization/extractors';

/**
 * Capitalize name with Title Case (LATAM-friendly)
 * Example: "kellys peña ballesta" → "Kellys Peña Ballesta"
 */
function capitalizeFullName(name: string): string {
  if (!name) return '';

  return name
    .toLowerCase()
    .split(' ')
    .map((word) => {
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

async function main() {
  console.log('🚀 Quick Capitalize - Fix capitalization\n');

  // Parse CLI arguments
  const args = process.argv.slice(2);
  let limit: number | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    }
  }

  // Fetch contacts
  console.log('📥 Fetching contacts...');
  const allContacts = await listAllContacts();
  console.log(`Total: ${allContacts.length}\n`);

  const toProcess = limit ? allContacts.slice(0, limit) : allContacts;
  console.log(`Processing: ${toProcess.length}\n`);

  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const contact = toProcess[i];
    const displayName = contact.computedDisplayName || '';

    console.log(`[${i + 1}/${toProcess.length}] ${displayName}`);

    // Clean emojis
    const cleaned = cleanDisplayName(displayName);

    if (!cleaned || cleaned.length < 2) {
      console.log('  ⏭️  Skip - empty after cleaning');
      skipped++;
      continue;
    }

    // Capitalize
    const capitalized = capitalizeFullName(cleaned);

    // Split into firstName/lastName
    const { firstName, lastName } = splitFullName(capitalized);

    if (!firstName || !lastName) {
      console.log('  ⏭️  Skip - cannot split name');
      skipped++;
      continue;
    }

    // Update Bird CRM (CRITICAL: Update both root AND attributes)
    try {
      await updateContact(contact.id, {
        // Root fields (required for Bird system)
        firstName,
        lastName,
        // Attributes (shown in Bird Dashboard)
        attributes: {
          displayName: capitalized,
          firstName, // CRITICAL: Also in attributes
          lastName,  // CRITICAL: Also in attributes
        },
      });

      console.log(`  ✅ Updated`);
      console.log(`     Before: ${displayName}`);
      console.log(`     After: ${capitalized}`);
      console.log(`     firstName: ${firstName}`);
      console.log(`     lastName: ${lastName}`);

      updated++;

      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error: any) {
      console.log(`  ❌ Error: ${error.message}`);
      skipped++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total: ${toProcess.length}`);

  if (limit) {
    console.log(`\n⚠️  MODO TEST - Solo ${limit} contactos`);
    console.log('   Verifica en Bird Dashboard antes de continuar');
  }
}

main().catch(console.error);
