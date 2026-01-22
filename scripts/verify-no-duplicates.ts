/**
 * @file Verify No Duplicates
 * @description Verifica que no hay contactos con nombres duplicados
 * @module scripts/verify-no-duplicates
 * @exports main
 */

import { config } from 'dotenv';

config({ path: '.env.local' });

import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';

async function main() {
  // Find all recent normalizations (last 24 hours)
  const results = await db.execute(sql`
    SELECT
      cn.extracted_data->>'displayName' as display_name,
      COUNT(*) as count,
      array_agg(cn.contact_id) as contact_ids
    FROM contact_normalizations cn
    WHERE
      cn.created_at >= NOW() - INTERVAL '24 hours'
      AND cn.status = 'success'
    GROUP BY cn.extracted_data->>'displayName'
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC
  `);

  console.log('Checking for duplicate names...\n');

  if (results.rows.length === 0) {
    console.log('✓ No duplicates found - all contacts have unique names\n');
    return;
  }

  console.log(`✗ Found ${results.rows.length} duplicate names:\n`);

  for (const row of results.rows) {
    const displayName = row.display_name as string;
    const count = row.count as number;
    const contactIds = row.contact_ids as string[];

    console.log(`  "${displayName}": ${count} contacts`);
    contactIds.forEach((id) => console.log(`    - ${id}`));
    console.log();
  }

  console.log('⚠️  CRITICAL: Duplicates detected - requires manual review');
}

main().catch(console.error);
