// Load environment variables FIRST (before any imports that use them)
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

import { fetchContactById } from '@/lib/bird/contacts';

async function main() {
  const contactId = process.argv[2];

  if (!contactId) {
    console.error('Usage: tsx scripts/fetch-bird-contact.ts <contactId>');
    console.error('\nExample:');
    console.error('  pnpm tsx scripts/fetch-bird-contact.ts 95fb9a8d-0125-4687-985b-f14ef932ac21');
    process.exit(1);
  }

  console.log(`Fetching Bird contact: ${contactId}...\n`);

  try {
    const contact = await fetchContactById(contactId);

    console.log('✅ Contact fetched successfully!\n');
    console.log('📋 Contact Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(JSON.stringify(contact, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📊 Identified Updateable Fields:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`ID: ${contact.id}`);
    console.log(`Display Name: ${contact.computedDisplayName}`);
    console.log(`Created: ${contact.createdAt}`);
    console.log(`Updated: ${contact.updatedAt}\n`);

    console.log('Identifiers:');
    for (const identifier of contact.featuredIdentifiers) {
      console.log(`  - ${identifier.key}: ${identifier.value}`);
    }

    console.log('\nCurrent Attributes:');
    if (contact.attributes && Object.keys(contact.attributes).length > 0) {
      for (const [key, value] of Object.entries(contact.attributes)) {
        console.log(`  - ${key}: ${value}`);
      }
    } else {
      console.log('  (No custom attributes set)');
    }

    console.log('\n💡 Available for Update:');
    console.log('  - attributes.email');
    console.log('  - attributes.country');
    console.log('  - attributes.city');
    console.log('  - attributes.procedure_interest');
    console.log('  - attributes.last_conversation_at');
  } catch (error) {
    console.error('❌ Failed to fetch contact:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
    }
    process.exit(1);
  }
}

main();
