/**
 * Extract Emails from Conversations and Add as Identifiers
 *
 * Fetches conversations for 10 specific contacts via Bird API,
 * extracts email addresses from conversation messages,
 * and adds them as identifiers (NOT attributes) to Bird CRM.
 *
 * Usage:
 *   npx tsx scripts/extract-emails-from-conversations.ts --dry-run  # Test mode
 *   npx tsx scripts/extract-emails-from-conversations.ts             # Production mode
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import * as fs from 'fs';
import { findConversationByPhone, getConversationMessages } from '@/lib/bird/conversations';
import { searchContactByPhone, addEmailIdentifier } from '@/lib/bird/contacts';
import { extractEmail, type ConversationMessage } from '@/lib/utils/data-extraction';
import type { BirdMessage, BirdMessageBody } from '@/lib/bird/types';

interface TargetContact {
  phone: string;
  name: string;
}

const TARGET_CONTACTS: TargetContact[] = [
  { phone: '+12029047178', name: 'JASMINE' },
  { phone: '+573208389730', name: '😱 (emoji)' },
  { phone: '+15713069613', name: 'Monica Borden' },
  { phone: '+573214819502', name: 'RUTHJ' },
  { phone: '+573006592633', name: 'Luz Ángela Restrepo' },
  { phone: '+573004421028', name: 'rosariofernandez rf21' },
  { phone: '+573024611392', name: 'luzmemao ✨' },
  { phone: '+17073469640', name: 'lizeth' },
  { phone: '+573212439688', name: 'Jessi Sanchez 💕' },
  { phone: '+573106098955', name: 'Val F 🌸' },
];

interface ExtractionReport {
  phone: string;
  name: string;
  status: 'success' | 'failed' | 'no_conversation' | 'no_email' | 'no_contact';
  conversationId?: string;
  messageCount?: number;
  emailFound?: string;
  contactId?: string;
  error?: string;
}

/**
 * Normalize sender type to patient/bot/human
 */
function normalizeRole(senderType: string): 'patient' | 'bot' | 'human' {
  if (senderType === 'contact') return 'patient';
  if (senderType === 'bot') return 'bot';
  if (senderType === 'agent' || senderType === 'human') return 'human';
  return 'patient'; // Default fallback
}

/**
 * Extract text from Bird message body
 */
function extractText(body: BirdMessageBody): string | null {
  if (body.type !== 'text') return null;

  if (typeof body === 'object' && 'text' in body) {
    const textField = (body as { text?: unknown }).text;

    if (typeof textField === 'string') return textField;
    if (textField && typeof textField === 'object' && 'text' in textField) {
      const nested = (textField as { text?: unknown }).text;
      if (typeof nested === 'string') return nested;
    }
  }

  return null;
}

/**
 * Convert Bird API messages to ConversationMessage format for data extraction
 */
function convertToConversationMessages(birdMessages: BirdMessage[]): ConversationMessage[] {
  return birdMessages
    .map((msg) => {
      const text = extractText(msg.body);
      if (!text) return null;

      return {
        id: msg.id,
        at: msg.createdAt,
        role: normalizeRole(msg.sender.type),
        sender: msg.sender.displayName || msg.sender.type,
        text,
      };
    })
    .filter((m): m is ConversationMessage => m !== null);
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log('📧 Extract Emails from Conversations & Add as Identifiers\n');
  console.log(`Mode: ${dryRun ? '🔒 DRY-RUN (no changes)' : '⚠️  PRODUCTION (will add identifiers)'}`);
  console.log(`Total contacts: ${TARGET_CONTACTS.length}\n`);

  if (!dryRun) {
    console.log('⚠️  WARNING: Production mode will ADD email identifiers to Bird CRM!');
    console.log('   Press Ctrl+C within 5 seconds to cancel...\n');
    await sleep(5000);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const reports: ExtractionReport[] = [];
  let processed = 0;

  for (const target of TARGET_CONTACTS) {
    processed++;
    console.log(`📋 Contact ${processed}/${TARGET_CONTACTS.length}: ${target.name} (${target.phone})`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const report: ExtractionReport = {
      phone: target.phone,
      name: target.name,
      status: 'failed',
    };

    try {
      // 1. Find conversation via Bird API
      console.log('  🔍 Searching for conversation...');
      const conversation = await findConversationByPhone(target.phone);

      if (!conversation) {
        console.log('  ⚠️  No conversation found in Bird CRM\n');
        report.status = 'no_conversation';
        reports.push(report);
        continue;
      }

      report.conversationId = conversation.id;
      console.log(`  ✅ Conversation found: ${conversation.id}\n`);

      // 2. Fetch messages
      console.log('  📨 Fetching conversation messages...');
      const birdMessages = await getConversationMessages(conversation.id);
      console.log(`  ✅ ${birdMessages.length} messages retrieved\n`);

      report.messageCount = birdMessages.length;

      // 3. Convert to ConversationMessage format and extract email
      console.log('  🔍 Extracting email from messages...');
      const conversationMessages = convertToConversationMessages(birdMessages);
      const email = extractEmail(conversationMessages);

      if (!email) {
        console.log('  ⚠️  No email found in conversation messages\n');
        report.status = 'no_email';
        reports.push(report);
        continue;
      }

      report.emailFound = email;
      console.log(`  ✅ Email found: ${email}\n`);

      // 4. Find contact in Bird CRM
      console.log('  🔍 Finding contact in Bird CRM...');
      const contact = dryRun ? { id: 'dry-run-contact-id' } : await searchContactByPhone(target.phone);

      if (!contact) {
        console.log('  ⚠️  Contact not found in Bird CRM\n');
        report.status = 'no_contact';
        reports.push(report);
        continue;
      }

      report.contactId = contact.id;
      console.log(`  ✅ Contact found: ${contact.id}\n`);

      // 5. Add email identifier
      if (dryRun) {
        console.log('  [DRY-RUN] Would add email identifier:');
        console.log(`    Contact: ${contact.id}`);
        console.log(`    Email: ${email}`);
        console.log(`    Identifier Key: emailaddress\n`);
        console.log('  ✅ [DRY-RUN] Would add successfully\n');
      } else {
        console.log('  📝 Adding email identifier to Bird CRM...');
        await addEmailIdentifier(contact.id, email);
        console.log('  ✅ Email identifier added successfully\n');
      }

      report.status = 'success';
      reports.push(report);

      // Rate limiting
      if (!dryRun && processed < TARGET_CONTACTS.length) {
        await sleep(500); // 500ms between requests
      }
    } catch (error) {
      console.log(`  ❌ Failed: ${error}\n`);
      report.status = 'failed';
      report.error = error instanceof Error ? error.message : String(error);
      reports.push(report);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  // Final Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Final Summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const successCount = reports.filter((r) => r.status === 'success').length;
  const failedCount = reports.filter((r) => r.status === 'failed').length;
  const noConversationCount = reports.filter((r) => r.status === 'no_conversation').length;
  const noEmailCount = reports.filter((r) => r.status === 'no_email').length;
  const noContactCount = reports.filter((r) => r.status === 'no_contact').length;

  console.log(`Total Contacts:       ${TARGET_CONTACTS.length}`);
  console.log(`✅ Success:           ${successCount}`);
  console.log(`❌ Failed:            ${failedCount}`);
  console.log(`⚠️  No Conversation:  ${noConversationCount}`);
  console.log(`⚠️  No Email:         ${noEmailCount}`);
  console.log(`⚠️  No Contact:       ${noContactCount}\n`);

  if (successCount > 0) {
    console.log('Successful Email Extractions:');
    reports
      .filter((r) => r.status === 'success')
      .forEach((r) => {
        console.log(`  ✅ ${r.phone} (${r.name}): ${r.emailFound}`);
      });
    console.log('');
  }

  if (noEmailCount > 0) {
    console.log('Contacts Without Emails:');
    reports
      .filter((r) => r.status === 'no_email')
      .forEach((r) => {
        console.log(`  ⚠️  ${r.phone} (${r.name}) - ${r.messageCount} messages`);
      });
    console.log('');
  }

  if (failedCount > 0) {
    console.log('Failed Contacts:');
    reports
      .filter((r) => r.status === 'failed')
      .forEach((r) => {
        console.log(`  ❌ ${r.phone} (${r.name}): ${r.error}`);
      });
    console.log('');
  }

  // Generate JSON report
  const reportData = {
    timestamp: new Date().toISOString(),
    mode: dryRun ? 'dry-run' : 'production',
    source: 'bird-conversations-api',
    totalProcessed: TARGET_CONTACTS.length,
    successCount,
    failedCount,
    noConversationCount,
    noEmailCount,
    noContactCount,
    contacts: reports,
  };

  const reportPath = `feature/user-update-data/results/email-extraction-${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2), 'utf-8');
  console.log(`📝 Detailed report: ${reportPath}\n`);

  if (dryRun) {
    console.log('🔒 DRY-RUN completed. No changes were made to Bird CRM.\n');
    console.log('💡 To run in production mode:');
    console.log('   npx tsx scripts/extract-emails-from-conversations.ts');
  } else {
    console.log('✅ Production extraction completed!\n');
    console.log('💡 Verify results in Bird CRM UI → Contacts → Identifiers section');
  }
}

main();
