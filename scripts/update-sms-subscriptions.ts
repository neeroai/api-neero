/**
 * Update SMS Subscription Status for All Contacts
 *
 * Changes "Never Subscribed" → "Subscribed" for all SMS identifiers
 *
 * Usage:
 *   npx tsx scripts/update-sms-subscriptions.ts --limit 1  # Test primero
 *   npx tsx scripts/update-sms-subscriptions.ts            # Todos los contactos
 */

import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

import { listAllContacts, updateIdentifierSubscription } from '@/lib/bird/contacts';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('📱 Updating SMS Subscription Status\n');

  // Parse CLI arguments for --limit
  const args = process.argv.slice(2);
  let limit: number | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    }
  }

  // Fetch all contacts
  const contacts = await listAllContacts();
  console.log(`Total contacts: ${contacts.length}`);

  const toProcess = limit ? contacts.slice(0, limit) : contacts;
  console.log(`Processing: ${toProcess.length} contactos\n`);

  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const contact = toProcess[i];

    // Find phone identifier (SMS uses phonenumber key)
    const smsIdentifier = contact.featuredIdentifiers?.find((id) => id.key === 'phonenumber');

    if (!smsIdentifier) {
      console.log(
        `[${i + 1}/${toProcess.length}] ${contact.computedDisplayName} - No phone number, skipping`
      );
      skipped++;
      continue;
    }

    console.log(`\n[${i + 1}/${toProcess.length}] Processing: ${smsIdentifier.value}`);
    console.log(`  Contact: ${contact.computedDisplayName}`);

    try {
      // LLAMADA REAL A BIRD API - Debe retornar respuesta HTTP
      const response = await updateIdentifierSubscription('phonenumber', smsIdentifier.value, {
        subscribedSms: true,
      });

      // LOGGING DETALLADO - Prueba de ejecución real
      console.log(`  ✅ API Response received (contactId: ${response.id})`);
      console.log(`  ✅ ${smsIdentifier.value} → Subscribed`);
      console.log(`  Timestamp: ${new Date().toISOString()}`);

      updated++;

      // Rate limiting: 100ms delay
      if (i < toProcess.length - 1) {
        await sleep(100);
      }
    } catch (error: any) {
      console.log(`  ❌ Error: ${error.message}`);
      skipped++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total processed: ${toProcess.length}`);

  if (limit) {
    console.log(`\n⚠️  MODO TEST - Solo procesados ${limit} contactos`);
    console.log(`   Verifica el cambio en Bird Dashboard antes de continuar`);
    console.log(`   Ejecuta sin --limit para procesar todos los contactos`);
  }
}

main().catch(console.error);
