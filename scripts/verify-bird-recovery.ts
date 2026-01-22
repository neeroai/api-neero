/**
 * @file Verify Bird Recovery
 * @description Tests Bird API recovery for damaged contacts sample
 * @module scripts/verify-bird-recovery
 * @exports main
 */

import { config } from 'dotenv';

config({ path: '.env.local' });

import { fetchContactById } from '@/lib/bird/contacts';

async function main() {
  const separator = '='.repeat(80);
  const dash = '-'.repeat(80);

  console.log(separator);
  console.log('VERIFY BIRD ATTRIBUTES RECOVERY');
  console.log(separator);

  // Test with diverse damaged contacts
  const testContacts = [
    {
      id: 'c0d3bafd-2a3c-40e4-9d0d-e980e80469b3',
      badName: 'para que pueda atender',
      type: 'conversation_fragment',
    },
    { id: '7ef8a110-f5fb-4335-a0a8-26ce53d8dafa', badName: 'Eva', type: 'generic_bot_name' },
    { id: '05906035-723c-4d10-af3c-e16270d117df', badName: 'Andrés Durán', type: 'duplicate_name' },
    { id: 'ee823207-1111-4e4d-8467-5b54ec48922d', badName: 'Stephanie', type: 'duplicate_name' },
    { id: 'd6beb3b5-8ac7-400d-acde-c555937c0cb7', badName: 'Stephanie', type: 'duplicate_name' },
  ];

  let successCount = 0;
  let failCount = 0;

  for (const test of testContacts) {
    console.log(`\n${dash}`);
    console.log(`Contact: ${test.id.slice(0, 8)}...`);
    console.log(`Current bad name: "${test.badName}" (${test.type})`);

    try {
      const contact = await fetchContactById(test.id);
      const attrs = contact.attributes || {};

      console.log('\nBird attributes:');
      console.log(`  displayName: ${attrs.displayName || 'N/A'}`);
      console.log(`  firstName: ${attrs.firstName || 'N/A'}`);
      console.log(`  lastName: ${attrs.lastName || 'N/A'}`);
      console.log(`  email: ${attrs.email || 'N/A'}`);
      console.log(`  country: ${attrs.country || 'N/A'}`);
      console.log(`  city: ${attrs.city || 'N/A'}`);

      // Check if we have a recoverable name
      const possibleNames = [
        attrs.displayName,
        attrs.firstName && attrs.lastName ? `${attrs.firstName} ${attrs.lastName}` : null,
        attrs.firstName,
      ].filter(Boolean);

      if (possibleNames.length > 0) {
        console.log(`\n✓ RECOVERABLE: ${possibleNames[0]}`);
        successCount++;
      } else {
        console.log('\n✗ NOT RECOVERABLE: No valid name in Bird attributes');
        failCount++;
      }
    } catch (error: any) {
      console.log(`\n✗ ERROR: ${error.message}`);
      failCount++;
    }

    // Rate limit
    await new Promise((resolve) => setTimeout(resolve, 600));
  }

  console.log(`\n${separator}`);
  console.log('RECOVERY TEST SUMMARY');
  console.log(separator);
  console.log(`✓ Recoverable: ${successCount}/${testContacts.length}`);
  console.log(`✗ Failed: ${failCount}/${testContacts.length}`);
  console.log(`Success rate: ${((successCount / testContacts.length) * 100).toFixed(1)}%`);
  console.log(separator);
}

main().catch(console.error);
