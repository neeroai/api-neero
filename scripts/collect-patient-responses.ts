/**
 * @file Collect Patient Responses
 * @description Recolecta respuestas de pacientes después de 1h
 * @module scripts/collect-patient-responses
 * @exports main
 */

import { config } from 'dotenv';

config({ path: '.env.local' });

import { getConversationMessages } from '@/lib/bird/conversations';

interface PatientResponse {
  contactId: string;
  conversationId: string;
  responseText: string;
  respondedAt: string;
}

async function main() {
  const fs = await import('node:fs/promises');

  // Load messages sent
  const sentCSV = await fs.readFile('messages-sent.csv', 'utf-8');
  const sentLines = sentCSV.split('\n').slice(1);

  const responses: PatientResponse[] = [];

  console.log('Collecting patient responses...\n');

  for (const line of sentLines) {
    if (!line.trim()) continue;

    const parts = line.split(',');
    const contactId = parts[0].trim();
    const status = parts[1].trim();
    const sentAt = parts[2].replace(/"/g, '').trim();

    if (status !== 'sent') continue;

    // Get conversation messages after sentAt
    const activeCSV = await fs.readFile('active-today.csv', 'utf-8');
    const activeLine = activeCSV.split('\n').find((l) => l.startsWith(contactId));
    if (!activeLine) continue;

    const conversationId = activeLine.split(',')[3].trim();

    // Fetch messages
    const messages = await getConversationMessages(conversationId);

    // Find patient's response (message after sentAt from contact)
    const sentTimestamp = new Date(sentAt).getTime();
    const patientMessages = messages
      .filter((m) => (m as { direction?: string }).direction === 'received') // From patient
      .filter((m) => new Date(m.createdAt).getTime() > sentTimestamp)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    if (patientMessages.length > 0) {
      const firstResponse = patientMessages[0];

      // Extract text from message body
      let responseText = '';
      if (firstResponse.body.type === 'text') {
        const textBody = firstResponse.body.text;
        if (typeof textBody === 'string') {
          responseText = textBody;
        } else if (textBody && typeof textBody === 'object' && 'text' in textBody) {
          responseText = textBody.text || '';
        }
      }

      responses.push({
        contactId,
        conversationId,
        responseText,
        respondedAt: firstResponse.createdAt,
      });
      console.log(`  ✓ ${contactId}: "${responseText}"`);
    } else {
      console.log(`  ✗ ${contactId}: No response yet`);
    }

    // Rate limit
    await new Promise((resolve) => setTimeout(resolve, 600));
  }

  // Export responses
  const header = 'Contact ID,Conversation ID,Response Text,Responded At\n';
  const rows = responses
    .map((r) => `${r.contactId},${r.conversationId},"${r.responseText}",${r.respondedAt}`)
    .join('\n');

  await fs.writeFile('patient-responses.csv', header + rows, 'utf-8');

  console.log(`\n✓ Collected ${responses.length} responses`);
}

main().catch(console.error);
