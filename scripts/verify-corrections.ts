/**
 * @file Verificación de Correcciones
 * @description Verifica que las correcciones manuales se hayan aplicado correctamente en Bird CRM
 * @module scripts/verify-corrections
 * @exports main
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

import { sql } from 'drizzle-orm';
import { fetchContactById } from '@/lib/bird/contacts';
import { db } from '@/lib/db/client';

interface VerificationResult {
  contactId: string;
  expectedName: string;
  actualName: string;
  match: boolean;
  createdAt: string;
}

/**
 * Verifica correcciones aplicadas contra estado actual en Bird
 *
 * @returns Lista de resultados de verificación
 *
 * @example
 * ```ts
 * const results = await verifyCorrections();
 * // results: [{ contactId: 'abc123', match: true, ... }]
 * ```
 */
async function verifyCorrections(): Promise<VerificationResult[]> {
  // Fetch correcciones aplicadas desde database
  const results = await db.execute(sql`
    SELECT
      "contactId",
      "extractedData"->>'displayName' as expected_name,
      "createdAt"
    FROM contact_normalizations
    WHERE
      "extractedData"->>'method' = 'manual_correction'
      AND "createdAt" > '2026-01-20T11:31:00Z'
    ORDER BY "createdAt" DESC
  `);

  console.log(`Verifying ${results.rows.length} corrections...\n`);

  const verificationResults: VerificationResult[] = [];

  for (const row of results.rows) {
    const contactId = row.contactId as string;
    const expectedName = row.expected_name as string;
    const createdAt = row.createdAt as string;

    try {
      const contact = await fetchContactById(contactId);
      const actualName = contact.computedDisplayName;

      const match = actualName === expectedName;

      console.log(
        `${match ? '✓' : '✗'} ${contactId}: ${actualName} ${match ? '==' : '!='} ${expectedName}`
      );

      verificationResults.push({
        contactId,
        expectedName,
        actualName,
        match,
        createdAt,
      });

      // Rate limit: 600ms
      await new Promise((resolve) => setTimeout(resolve, 600));
    } catch (error) {
      console.error(`✗ ${contactId}: Error fetching contact - ${error}`);
      verificationResults.push({
        contactId,
        expectedName,
        actualName: 'ERROR',
        match: false,
        createdAt,
      });
    }
  }

  return verificationResults;
}

/**
 * Exporta resultados de verificación a CSV
 *
 * @param results - Resultados de verificación
 *
 * @example
 * ```ts
 * await exportVerificationResults(results);
 * // Output: verification-results.csv
 * ```
 */
async function exportVerificationResults(results: VerificationResult[]): Promise<void> {
  const fs = await import('node:fs/promises');

  const header = 'Contact ID,Expected Name,Actual Name,Match,Created At\n';
  const rows = results
    .map(
      (r) =>
        `${r.contactId},"${r.expectedName}","${r.actualName}",${r.match ? 'YES' : 'NO'},${r.createdAt}`
    )
    .join('\n');

  await fs.writeFile('verification-results.csv', header + rows, 'utf-8');
  console.log(`\n✓ Exported verification results to verification-results.csv`);
}

async function main() {
  console.log('='.repeat(80));
  console.log('VERIFICATION SCRIPT - Contact Corrections');
  console.log('='.repeat(80));
  console.log();

  const results = await verifyCorrections();

  const matchCount = results.filter((r) => r.match).length;
  const mismatchCount = results.filter((r) => !r.match).length;

  console.log(`\n${'='.repeat(80)}`);
  console.log('VERIFICATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total verified: ${results.length}`);
  console.log(`✓ Match: ${matchCount} (${((matchCount / results.length) * 100).toFixed(1)}%)`);
  console.log(
    `✗ Mismatch: ${mismatchCount} (${((mismatchCount / results.length) * 100).toFixed(1)}%)`
  );
  console.log('='.repeat(80));

  if (results.length > 0) {
    await exportVerificationResults(results);
  }

  // List mismatches if any
  if (mismatchCount > 0) {
    console.log('\nMISMATCHES:');
    results
      .filter((r) => !r.match)
      .forEach((r) => {
        console.log(`  ${r.contactId}: Expected "${r.expectedName}", got "${r.actualName}"`);
      });
  }
}

main().catch(console.error);
