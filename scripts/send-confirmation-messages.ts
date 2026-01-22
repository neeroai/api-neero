/**
 * @file Send Confirmation Messages
 * @description Envía mensaje automático pidiendo confirmación de datos
 * @module scripts/send-confirmation-messages
 * @exports main
 */

import { config } from 'dotenv';

config({ path: '.env.local' });

import { sendTextMessage } from '@/lib/bird/messages';

interface ContactToMessage {
  contactId: string;
  phone: string;
  conversationId: string;
  channelId: string;
}

async function loadActiveContacts(): Promise<ContactToMessage[]> {
  const fs = await import('node:fs/promises');
  const content = await fs.readFile('active-today.csv', 'utf-8');
  const lines = content.split('\n').slice(1);

  const contacts: ContactToMessage[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    const parts = line.split(',');
    contacts.push({
      contactId: parts[0].trim(),
      phone: parts[1].trim(),
      conversationId: parts[3].trim(),
      channelId: parts[4].trim(),
    });
  }

  return contacts;
}

async function main() {
  const contacts = await loadActiveContacts();

  const MESSAGE_TEXT =
    'Por favor nos puede confirmar su nombre y email (correo electrónico) si tiene?';

  console.log(`Sending confirmation message to ${contacts.length} contacts...\n`);

  const results: Array<{
    contactId: string;
    status: 'sent' | 'failed';
    error?: string;
    sentAt?: string;
  }> = [];

  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];
    console.log(`[${i + 1}/${contacts.length}] ${contact.phone}`);

    if (!contact.channelId) {
      results.push({
        contactId: contact.contactId,
        status: 'failed',
        error: 'Missing channelId for conversation',
      });
      console.log(`  ✗ Failed: Missing channelId`);
      continue;
    }

    try {
      await sendTextMessage({
        channelId: contact.channelId,
        to: contact.phone,
        text: MESSAGE_TEXT,
      });

      const sentAt = new Date().toISOString();
      results.push({ contactId: contact.contactId, status: 'sent', sentAt });
      console.log(`  ✓ Sent at ${sentAt}`);
    } catch (error) {
      results.push({ contactId: contact.contactId, status: 'failed', error: String(error) });
      console.log(`  ✗ Failed: ${error}`);
    }

    // Rate limit: 600ms
    await new Promise((resolve) => setTimeout(resolve, 600));
  }

  // Export results
  const fs = await import('node:fs/promises');
  const header = 'Contact ID,Status,Sent At,Error\n';
  const rows = results
    .map((r) => `${r.contactId},${r.status},"${r.sentAt || 'N/A'}","${r.error || ''}"`)
    .join('\n');

  await fs.writeFile('messages-sent.csv', header + rows, 'utf-8');

  const successCount = results.filter((r) => r.status === 'sent').length;
  console.log(`\n✓ Sent: ${successCount}/${contacts.length}`);
  console.log(`✗ Failed: ${contacts.length - successCount}`);
}

main().catch(console.error);
