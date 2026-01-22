/**
 * @file Analyze Normalization Data
 * @description Analyzes contact_normalizations table to assess recovery options
 * @module scripts/analyze-normalization-data
 * @exports main
 */

import { config } from 'dotenv';

config({ path: '.env.local' });

import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';

interface AnalysisResult {
  totalIncidentRecords: number;
  recordsWithBefore: number;
  recordsWithAfter: number;
  beforeFieldIntegrity: {
    hasDisplayName: number;
    hasValidDisplayName: number;
    hasDifferentFromAfter: number;
  };
  sampleRecords: Array<{
    id: number;
    contactId: string;
    before: any;
    after: any;
    beforeName: string | null;
    afterName: string | null;
    nameChanged: boolean;
  }>;
}

async function analyzeNormalizationData(): Promise<AnalysisResult> {
  // Get incident records (2026-01-20 16:21-16:23)
  const incidentRecords = await db.execute(sql`
    SELECT
      id,
      contact_id,
      before,
      after,
      created_at
    FROM contact_normalizations
    WHERE
      created_at >= '2026-01-20T16:21:00Z'
      AND created_at <= '2026-01-20T16:23:59Z'
    ORDER BY created_at ASC
  `);

  console.log(`\nTotal incident records: ${incidentRecords.rows.length}`);

  const result: AnalysisResult = {
    totalIncidentRecords: incidentRecords.rows.length,
    recordsWithBefore: 0,
    recordsWithAfter: 0,
    beforeFieldIntegrity: {
      hasDisplayName: 0,
      hasValidDisplayName: 0,
      hasDifferentFromAfter: 0,
    },
    sampleRecords: [],
  };

  for (const row of incidentRecords.rows) {
    const before = row.before as any;
    const after = row.after as any;

    if (before) result.recordsWithBefore++;
    if (after) result.recordsWithAfter++;

    const beforeName = before?.displayName || null;
    const afterName = after?.displayName || null;

    if (beforeName) {
      result.beforeFieldIntegrity.hasDisplayName++;

      // Check if valid (not generic/fragment)
      if (
        beforeName.length >= 5 &&
        !beforeName.match(/para|pueda|atender|cuando|pero|que|claro|costo/i) &&
        !beforeName.match(/^(Eva|Karina|Bot)$/i)
      ) {
        result.beforeFieldIntegrity.hasValidDisplayName++;
      }

      // Check if different from after
      if (beforeName !== afterName) {
        result.beforeFieldIntegrity.hasDifferentFromAfter++;
      }
    }

    // Sample first 10 records with before data
    if (result.sampleRecords.length < 10 && before) {
      result.sampleRecords.push({
        id: row.id as number,
        contactId: row.contact_id as string,
        before,
        after,
        beforeName,
        afterName,
        nameChanged: beforeName !== afterName,
      });
    }
  }

  return result;
}

async function checkHistoricalNames() {
  console.log('\n' + '='.repeat(80));
  console.log('CHECKING HISTORICAL NORMALIZATIONS (before incident)');
  console.log('='.repeat(80));

  // Sample 5 damaged contacts and check their history
  const damagedContactIds = [
    'c0d3bafd-2a3c-40e4-9d0d-e980e80469b3', // "para que pueda atender"
    '7ef8a110-f5fb-4335-a0a8-26ce53d8dafa', // "Eva"
    '05906035-723c-4d10-af3c-e16270d117df', // "Andrés Durán"
    'ee823207-1111-4e4d-8467-5b54ec48922d', // "Stephanie"
    'd6beb3b5-8ac7-400d-acde-c555937c0cb7', // "Stephanie" #2
  ];

  for (const contactId of damagedContactIds) {
    console.log(`\nContact: ${contactId}`);

    const history = await db.execute(sql`
      SELECT
        id,
        created_at,
        status,
        confidence,
        extracted_data->>'displayName' as display_name,
        before->>'displayName' as before_name,
        after->>'displayName' as after_name
      FROM contact_normalizations
      WHERE contact_id = ${contactId}
      ORDER BY created_at ASC
    `);

    console.log(`  Total normalizations: ${history.rows.length}`);

    for (const record of history.rows) {
      const date = new Date(record.created_at as string);
      const displayName = record.display_name || record.after_name;
      const beforeName = record.before_name;

      console.log(
        `    ${date.toISOString()} | "${displayName}" | before: "${beforeName || 'N/A'}"`
      );
    }
  }
}

async function main() {
  console.log('='.repeat(80));
  console.log('CONTACT NORMALIZATIONS DATA ANALYSIS');
  console.log('='.repeat(80));

  const analysis = await analyzeNormalizationData();

  console.log('\n' + '='.repeat(80));
  console.log('INCIDENT RECORDS ANALYSIS (2026-01-20 16:21-16:23)');
  console.log('='.repeat(80));
  console.log(`Total incident records: ${analysis.totalIncidentRecords}`);
  console.log(
    `Records with 'before' field: ${analysis.recordsWithBefore} (${((analysis.recordsWithBefore / analysis.totalIncidentRecords) * 100).toFixed(1)}%)`
  );
  console.log(
    `Records with 'after' field: ${analysis.recordsWithAfter} (${((analysis.recordsWithAfter / analysis.totalIncidentRecords) * 100).toFixed(1)}%)`
  );

  console.log('\n' + '='.repeat(80));
  console.log('BEFORE FIELD INTEGRITY');
  console.log('='.repeat(80));
  console.log(`Has displayName: ${analysis.beforeFieldIntegrity.hasDisplayName}`);
  console.log(`Has VALID displayName: ${analysis.beforeFieldIntegrity.hasValidDisplayName}`);
  console.log(`Different from after: ${analysis.beforeFieldIntegrity.hasDifferentFromAfter}`);

  console.log('\n' + '='.repeat(80));
  console.log('SAMPLE RECORDS (first 10 with before data)');
  console.log('='.repeat(80));

  for (const sample of analysis.sampleRecords) {
    console.log(`\nID: ${sample.id} | Contact: ${sample.contactId.slice(0, 8)}...`);
    console.log(`  Before: "${sample.beforeName || 'N/A'}"`);
    console.log(`  After:  "${sample.afterName || 'N/A'}"`);
    console.log(`  Changed: ${sample.nameChanged ? 'YES' : 'NO'}`);
  }

  await checkHistoricalNames();

  console.log('\n' + '='.repeat(80));
  console.log('RECOVERY ASSESSMENT');
  console.log('='.repeat(80));

  if (analysis.beforeFieldIntegrity.hasValidDisplayName > 0) {
    console.log(
      `✓ GOOD NEWS: ${analysis.beforeFieldIntegrity.hasValidDisplayName} records have valid names in 'before' field`
    );
    console.log(`  These can be restored directly from the database`);
  } else {
    console.log(`✗ WARNING: No valid names found in 'before' field`);
    console.log(`  Need to rely on historical normalizations or Bird attributes`);
  }

  console.log('='.repeat(80));
}

main().catch(console.error);
