import { config } from 'dotenv';

config({ path: '.env.local' });

import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';

async function main() {
  // Check for Eva/Karina contacts on 2026-01-20
  const results = await db.execute(sql`
    SELECT
      cn.id,
      cn.contact_id,
      cn.confidence,
      cn.extracted_data->>'displayName' as extracted_name,
      cn.extracted_data->>'method' as method,
      cn.created_at,
      cn.status
    FROM contact_normalizations cn
    WHERE
      cn.created_at >= '2026-01-20T00:00:00Z'
      AND cn.created_at < '2026-01-21T00:00:00Z'
      AND (
        cn.extracted_data->>'displayName' ~* '^(Eva|Karina)$'
        OR cn.extracted_data->>'displayName' ~* 'para que pueda'
      )
    ORDER BY cn.created_at DESC
    LIMIT 50
  `);

  console.log('\n' + '='.repeat(80));
  console.log(`Found ${results.rows.length} suspicious normalizations on 2026-01-20`);
  console.log('='.repeat(80));

  if (results.rows.length > 0) {
    console.log('\nFirst 10 results:');
    results.rows.slice(0, 10).forEach((r, i) => {
      console.log(
        `[${i + 1}] ${r.created_at} - "${r.extracted_name}" (confidence: ${r.confidence}, status: ${r.status})`
      );
    });
  }

  // Also check current Bird contacts with "Eva" name
  console.log('\n' + '='.repeat(80));
  console.log('Checking current contacts in Bird with suspicious names...');
  console.log('='.repeat(80));

  const { listAllContacts } = await import('@/lib/bird/contacts');
  const contacts = await listAllContacts({ limit: 500 });

  const evaContacts = contacts.filter(
    (c) => c.computedDisplayName === 'Eva' || c.computedDisplayName === 'Karina'
  );

  console.log(`\nFound ${evaContacts.length} contacts with Eva/Karina names in Bird`);

  if (evaContacts.length > 0) {
    console.log('\nFirst 10:');
    evaContacts.slice(0, 10).forEach((c, i) => {
      const phone =
        c.featuredIdentifiers.find((id) => id.key === 'phonenumber')?.value || 'No phone';
      console.log(`[${i + 1}] ${c.id} - ${c.computedDisplayName} - ${phone}`);
    });
  }
}

main().catch(console.error);
