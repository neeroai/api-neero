/**
 * @file Filter Active Conversations
 * @description Filtra contactos dañados con actividad hoy
 * @module scripts/filter-active-conversations
 * @exports main
 */

import { config } from 'dotenv';

config({ path: '.env.local' });

import { findConversationByPhone } from '@/lib/bird/conversations';

interface ActiveContact {
  contactId: string;
  phone: string;
  currentName: string;
  conversationId: string;
  channelId: string;
  lastMessageAt: string;
}

async function main() {
  // Load damaged contacts
  const fs = await import('node:fs/promises');
  const damagedCSV = await fs.readFile('damaged-contacts.csv', 'utf-8');
  const lines = damagedCSV.split('\n').slice(1); // Skip header

  const activeToday: ActiveContact[] = [];
  const today = '2026-01-20';

  console.log('Checking 88 damaged contacts for activity today...\n');

  for (const line of lines) {
    if (!line.trim()) continue;

    const parts = line.split(',');
    const contactId = parts[1].trim();
    const currentName = parts[6].replace(/"/g, '').trim();
    const phone = parts[7].replace(/"/g, '').trim();

    // Find conversation for this contact
    const conversation = await findConversationByPhone(phone);

    if (!conversation) {
      console.log(`  ✗ ${currentName} (${phone}) - No conversation found`);
      continue;
    }

    // Check if conversation has activity today
    const lastMessageDate = new Date(conversation.updatedAt).toISOString().split('T')[0];

    if (lastMessageDate === today) {
      console.log(`  ✓ ${currentName} (${phone}) - Active today`);
      activeToday.push({
        contactId,
        phone,
        currentName,
        conversationId: conversation.id,
        channelId: conversation.channelId || '',
        lastMessageAt: conversation.updatedAt,
      });
    } else {
      console.log(`  ✗ ${currentName} (${phone}) - Last activity: ${lastMessageDate}`);
    }

    // Rate limit
    await new Promise((resolve) => setTimeout(resolve, 600));
  }

  // Export active contacts
  const header =
    'Contact ID,Phone,Current Name,Conversation ID,Channel ID,Last Message At,Status\n';
  const rows = activeToday
    .map(
      (c) =>
        `${c.contactId},${c.phone},"${c.currentName}",${c.conversationId},${c.channelId},${c.lastMessageAt},pending`
    )
    .join('\n');

  await fs.writeFile('active-today.csv', header + rows, 'utf-8');

  console.log(`\n✓ Found ${activeToday.length} active conversations today`);
  console.log(`✗ ${88 - activeToday.length} inactive - require different approach`);
}

main().catch(console.error);
