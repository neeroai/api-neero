import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { listAllContacts } from '@/lib/bird/contacts';
import { findConversationByPhone } from '@/lib/bird/conversations';
import { getConversationMessages } from '@/lib/bird/conversations';

async function main() {
  console.log('Fetching first contact that needs normalization...\n');

  const contacts = await listAllContacts(10);
  const contact = contacts[0];

  console.log('Contact:', {
    id: contact.id,
    displayName: contact.computedDisplayName,
    phone: contact.featuredIdentifiers?.find((id) => id.key === 'phonenumber')
      ?.value,
  });

  const phoneIdentifier = contact.featuredIdentifiers?.find(
    (id) => id.key === 'phonenumber'
  );

  if (!phoneIdentifier) {
    console.log('No phone number found');
    return;
  }

  const conversation = await findConversationByPhone(phoneIdentifier.value);

  if (!conversation) {
    console.log('No conversation found');
    return;
  }

  console.log('\nFetching messages...');
  const messages = await getConversationMessages(conversation.id);

  console.log(`Found ${messages.length} messages\n`);

  // Extract text messages (first 10)
  const textMessages = messages
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
    .filter((text): text is string => Boolean(text))
    .slice(0, 10);

  console.log('First 10 text messages:');
  console.log('─'.repeat(50));
  textMessages.forEach((msg, i) => {
    console.log(`[${i + 1}] ${msg}`);
  });
  console.log('─'.repeat(50));
}

main().catch(console.error);
