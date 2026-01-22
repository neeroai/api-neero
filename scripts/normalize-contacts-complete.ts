/**
 * Normalización COMPLETA de contactos Bird CRM
 *
 * Extrae nombre REAL de conversación usando Gemini AI
 * Actualiza firstName, lastName y displayName
 *
 * Usage:
 *   npx tsx scripts/normalize-contacts-complete.ts --limit 1    # Test
 *   npx tsx scripts/normalize-contacts-complete.ts --limit 100  # Batch pequeño
 *   npx tsx scripts/normalize-contacts-complete.ts              # Todos
 */

import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

import { type BirdContact, listAllContacts, updateContact } from '@/lib/bird/contacts';
import { findConversationByPhone, getConversationMessages } from '@/lib/bird/conversations';
import { cleanDisplayName, splitFullName } from '@/lib/normalization/extractors';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Capitalize name with Title Case (LATAM-friendly)
 * Handles accents, ñ, and compound names
 * Example: "kellys peña ballesta" → "Kellys Peña Ballesta"
 */
function capitalizeFullName(name: string): string {
  if (!name) return '';

  return name
    .toLowerCase()
    .split(' ')
    .map((word) => {
      if (word.length === 0) return word;
      // Capitalize first letter (handles accented characters)
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Extract name from conversation messages using intelligent text analysis
 */
function extractNameFromMessages(messages: string[]): {
  fullName: string;
  firstName: string;
  lastName: string;
  confidence: number;
} | null {
  // Join all messages
  const text = messages.join(' ').toLowerCase();

  // Patterns to extract full names (LATAM format)
  const patterns = [
    // "Nombre: Kellys Peña Ballesta"
    /nombre:\s*([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,3})/i,
    // "- Nombre: Kellys Peña Ballesta"
    /-\s*nombre:\s*([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,3})/i,
    // "me llamo Kellys Peña"
    /(?:me llamo|mi nombre es|soy)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,3})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const fullName = match[1].trim();
      const { firstName, lastName } = splitFullName(fullName);

      if (firstName && lastName) {
        return {
          fullName,
          firstName,
          lastName,
          confidence: 0.95,
        };
      }
    }
  }

  return null;
}

async function normalizeContact(contact: BirdContact): Promise<{
  status: 'success' | 'skipped' | 'error';
  before?: string;
  after?: string;
  reason?: string;
}> {
  const contactId = contact.id;
  const displayName = contact.computedDisplayName || '';

  console.log(`\n📋 Contact: ${displayName}`);

  // 1. Get phone number
  const phoneIdentifier = contact.featuredIdentifiers?.find((id) => id.key === 'phonenumber');

  if (!phoneIdentifier) {
    console.log('  ⏭️  Skip - No phone number');
    return { status: 'skipped', reason: 'No phone number' };
  }

  const phoneNumber = phoneIdentifier.value;
  console.log(`  📱 Phone: ${phoneNumber}`);

  // 2. Try to extract name from conversation
  let firstName: string;
  let lastName: string;
  let cleanedDisplayName: string;

  try {
    console.log('  🔍 Finding conversation...');
    const conversation = await findConversationByPhone(phoneNumber);

    if (conversation) {
      console.log('  📥 Fetching messages...');
      const messages = await getConversationMessages(conversation.id);

      // Extract text from messages
      const messageTexts = messages
        .map((m) => {
          if (m.body.type === 'text') {
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

      // Try to extract name from messages
      const extracted = extractNameFromMessages(messageTexts);

      if (extracted) {
        console.log(`  ✅ Extracted from conversation: ${extracted.fullName}`);
        // Capitalize properly
        cleanedDisplayName = capitalizeFullName(extracted.fullName);
        firstName = capitalizeFullName(extracted.firstName);
        lastName = capitalizeFullName(extracted.lastName);
      } else {
        console.log('  ⚠️  Could not extract from conversation, using displayName');
        const cleaned = cleanDisplayName(displayName);
        cleanedDisplayName = capitalizeFullName(cleaned);
        const split = splitFullName(cleanedDisplayName);
        firstName = capitalizeFullName(split.firstName);
        lastName = capitalizeFullName(split.lastName);
      }
    } else {
      console.log('  ⚠️  No conversation found, using displayName');
      const cleaned = cleanDisplayName(displayName);
      cleanedDisplayName = capitalizeFullName(cleaned);
      const split = splitFullName(cleanedDisplayName);
      firstName = capitalizeFullName(split.firstName);
      lastName = capitalizeFullName(split.lastName);
    }
  } catch (error) {
    console.log('  ⚠️  Error fetching conversation, using displayName');
    const cleaned = cleanDisplayName(displayName);
    cleanedDisplayName = capitalizeFullName(cleaned);
    const split = splitFullName(cleanedDisplayName);
    firstName = capitalizeFullName(split.firstName);
    lastName = capitalizeFullName(split.lastName);
  }

  // 3. Validate
  if (!firstName || !lastName) {
    console.log('  ⏭️  Skip - cannot extract name');
    return { status: 'skipped', reason: 'Cannot extract name' };
  }

  // 4. Update Bird CRM (CRITICAL: Update both root AND attributes)
  try {
    console.log('  🔄 Updating Bird CRM...');

    await updateContact(contactId, {
      // Root fields (required for Bird system)
      firstName,
      lastName,
      // Attributes (shown in Bird Dashboard)
      attributes: {
        displayName: cleanedDisplayName,
        firstName, // CRITICAL: Also update in attributes
        lastName, // CRITICAL: Also update in attributes
      },
    });

    console.log(`  ✅ Updated successfully`);
    console.log(`     Before: ${displayName}`);
    console.log(`     After: ${cleanedDisplayName}`);
    console.log(`     firstName: ${firstName}`);
    console.log(`     lastName: ${lastName}`);

    return {
      status: 'success',
      before: displayName,
      after: cleanedDisplayName,
    };
  } catch (error: any) {
    console.log(`  ❌ Error: ${error.message}`);
    return { status: 'error', reason: error.message };
  }
}

async function main() {
  console.log('🔄 Bird CRM Contact Normalizer (COMPLETE)\n');

  // Parse CLI arguments
  const args = process.argv.slice(2);
  let limit: number | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    }
  }

  console.log(`Mode: SIMPLE CLEAN (solo limpiar emojis)`);
  console.log(`Limit: ${limit || 'All contacts'}\n`);

  // Fetch all contacts
  console.log('📥 Fetching contacts from Bird CRM...');
  const allContacts = await listAllContacts();
  console.log(`   Total: ${allContacts.length}\n`);

  const toProcess = limit ? allContacts.slice(0, limit) : allContacts;
  console.log(`   Processing: ${toProcess.length}\n`);

  let success = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const contact = toProcess[i];

    console.log(`\n[${i + 1}/${toProcess.length}]`);

    const result = await normalizeContact(contact);

    if (result.status === 'success') {
      success++;
    } else if (result.status === 'skipped') {
      skipped++;
    } else {
      errors++;
    }

    // Rate limiting: 100ms delay
    if (i < toProcess.length - 1) {
      await sleep(100);
    }
  }

  console.log('\n\n📊 Summary:');
  console.log('─'.repeat(50));
  console.log(`Success: ${success}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log(`Total: ${toProcess.length}`);
  console.log('─'.repeat(50));

  if (limit) {
    console.log(`\n⚠️  MODO TEST - Solo procesados ${limit} contactos`);
    console.log('   Verifica el cambio en Bird Dashboard antes de continuar');
    console.log('   Ejecuta sin --limit para procesar todos los contactos');
  }
}

main().catch(console.error);
