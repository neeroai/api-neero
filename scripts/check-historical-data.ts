/**
 * @file Check Historical Data
 * @description Checks if contacts have ANY normalizations before 2026-01-20
 * @module scripts/check-historical-data
 * @exports main
 */

import { config } from 'dotenv';

config({ path: '.env.local' });

import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';

async function main() {
  console.log('='.repeat(80));
  console.log('CHECKING HISTORICAL NORMALIZATIONS');
  console.log('='.repeat(80));

  // Get total normalizations before incident
  const beforeIncident = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM contact_normalizations
    WHERE created_at < '2026-01-20T00:00:00Z'
  `);

  console.log(`\nTotal normalizations BEFORE 2026-01-20: ${beforeIncident.rows[0].count}`);

  // Get earliest and latest normalization dates
  const dateRange = await db.execute(sql`
    SELECT
      MIN(created_at) as earliest,
      MAX(created_at) as latest,
      COUNT(*) as total
    FROM contact_normalizations
  `);

  const earliest = dateRange.rows[0].earliest as Date;
  const latest = dateRange.rows[0].latest as Date;
  const total = dateRange.rows[0].total;

  console.log(`\nDate range:`);
  console.log(`  Earliest: ${earliest ? new Date(earliest).toISOString() : 'N/A'}`);
  console.log(`  Latest:   ${latest ? new Date(latest).toISOString() : 'N/A'}`);
  console.log(`  Total:    ${total}`);

  // Check if damaged contacts exist in database AT ALL before incident
  const damagedContactIds = [
    'c0d3bafd-2a3c-40e4-9d0d-e980e80469b3',
    '7ef8a110-f5fb-4335-a0a8-26ce53d8dafa',
    '05906035-723c-4d10-af3c-e16270d117df',
    'ee823207-1111-4e4d-8467-5b54ec48922d',
    'd6beb3b5-8ac7-400d-acde-c555937c0cb7',
  ];

  console.log('\n' + '='.repeat(80));
  console.log('SAMPLE DAMAGED CONTACTS - FIRST EVER NORMALIZATION');
  console.log('='.repeat(80));

  for (const contactId of damagedContactIds) {
    const first = await db.execute(sql`
      SELECT
        id,
        created_at,
        extracted_data->>'displayName' as display_name
      FROM contact_normalizations
      WHERE contact_id = ${contactId}
      ORDER BY created_at ASC
      LIMIT 1
    `);

    if (first.rows.length > 0) {
      const date = new Date(first.rows[0].created_at as string);
      const name = first.rows[0].display_name;
      const isIncident = date >= new Date('2026-01-20T16:21:00Z');

      console.log(`\n${contactId.slice(0, 8)}...`);
      console.log(`  First normalization: ${date.toISOString()}`);
      console.log(`  Name: "${name}"`);
      console.log(`  During incident: ${isIncident ? 'YES (BAD)' : 'NO (good)'}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('CONCLUSION');
  console.log('='.repeat(80));

  if (Number(beforeIncident.rows[0].count) === 0) {
    console.log('✗ CRITICAL: This is the FIRST BATCH of normalizations ever');
    console.log('  The system has NEVER normalized these contacts before');
    console.log('  The "before" field is NULL because there was no previous state');
    console.log('  Recovery strategy:');
    console.log('    1. Bird contact attributes (firstName, lastName, displayName)');
    console.log('    2. Message history analysis (names in conversation)');
    console.log('    3. Manual review for unrecoverable contacts');
  } else {
    console.log(`✓ There are ${beforeIncident.rows[0].count} normalizations before incident`);
    console.log('  Some contacts may be recoverable from historical data');
  }

  console.log('='.repeat(80));
}

main().catch(console.error);
