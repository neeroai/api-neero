import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

import * as fs from 'fs';
import * as path from 'path';
import {
  type ConversationMessage,
  extractAllPatientData,
  type PatientData,
} from '@/lib/utils/data-extraction';

interface Conversation {
  conversationId: string;
  channelId: string;
  contactPhone: string;
  lastMessageAt: string;
  messages: ConversationMessage[];
}

interface ExtractedContact extends PatientData {
  conversationId: string;
  contactPhone: string;
  lastMessageAt: string;
}

async function main() {
  // Parse CLI arguments
  const args = process.argv.slice(2);
  let outputPath = 'extracted-contacts.json';

  const outputIndex = args.indexOf('--output');
  if (outputIndex !== -1 && args[outputIndex + 1]) {
    outputPath = args[outputIndex + 1];
  }

  console.log('📖 Analyzing WhatsApp conversations...\n');

  // Read conversation data
  const conversationsPath = path.join(
    __dirname,
    '../docs/conversations/whatsapp-conversations-2025-12-14.json'
  );
  console.log(`Reading: ${conversationsPath}`);

  const rawData = fs.readFileSync(conversationsPath, 'utf-8');
  const conversations: Conversation[] = JSON.parse(rawData);

  console.log(`Total conversations: ${conversations.length}\n`);

  // Extract data from each conversation
  console.log('⚙️  Extracting patient data...');

  const extractedContacts: ExtractedContact[] = [];
  const stats = {
    total: 0,
    withName: 0,
    withEmail: 0,
    withCountry: 0,
    withCity: 0,
    withProcedure: 0,
  };

  for (const conv of conversations) {
    stats.total++;

    const patientData = extractAllPatientData(conv.messages);

    // Count completeness
    if (patientData.name) stats.withName++;
    if (patientData.email) stats.withEmail++;
    if (patientData.country) stats.withCountry++;
    if (patientData.city) stats.withCity++;
    if (patientData.procedureInterest) stats.withProcedure++;

    // Only include contacts with at least one field
    if (Object.keys(patientData).some((k) => patientData[k as keyof PatientData])) {
      extractedContacts.push({
        conversationId: conv.conversationId,
        contactPhone: conv.contactPhone,
        lastMessageAt: conv.lastMessageAt,
        ...patientData,
      });
    }
  }

  // Write to output file
  fs.writeFileSync(outputPath, JSON.stringify(extractedContacts, null, 2), 'utf-8');

  console.log(`\n✅ Extracted ${extractedContacts.length} contacts with data\n`);

  // Print statistics
  console.log('📊 Data Completeness:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Total Conversations:    ${stats.total}`);
  console.log(
    `Contacts with Name:     ${stats.withName} (${((stats.withName / stats.total) * 100).toFixed(1)}%)`
  );
  console.log(
    `Contacts with Email:    ${stats.withEmail} (${((stats.withEmail / stats.total) * 100).toFixed(1)}%)`
  );
  console.log(
    `Contacts with Country:  ${stats.withCountry} (${((stats.withCountry / stats.total) * 100).toFixed(1)}%)`
  );
  console.log(
    `Contacts with City:     ${stats.withCity} (${((stats.withCity / stats.total) * 100).toFixed(1)}%)`
  );
  console.log(
    `Contacts with Procedure: ${stats.withProcedure} (${((stats.withProcedure / stats.total) * 100).toFixed(1)}%)`
  );
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Show sample
  console.log('📄 Sample Extracted Contact:');
  const sample = extractedContacts.find((c) => c.email && c.name && c.country);
  if (sample) {
    console.log(JSON.stringify(sample, null, 2));
  }

  console.log(`\n💾 Output written to: ${outputPath}`);
  console.log('\n💡 Next steps:');
  console.log('   1. Review extracted data quality in extracted-contacts.json');
  console.log(
    '   2. Run dry-run update: pnpm tsx scripts/update-crm-contacts.ts --input extracted-contacts.json --dry-run --limit 10'
  );
}

main();
