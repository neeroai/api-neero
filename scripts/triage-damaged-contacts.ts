/**
 * @file Triage de Contactos Dañados
 * @description Identifica y exporta contactos con nombres sospechosos del incidente 2026-01-20
 * @module scripts/triage-damaged-contacts
 * @exports main
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

import { sql } from 'drizzle-orm';
import { fetchContactById } from '@/lib/bird/contacts';
import { db } from '@/lib/db/client';

interface DamagedContact {
  normalizationId: number;
  contactId: string;
  extractedName: string;
  confidence: number;
  method: string;
  suspiciousReason: string;
  birdCurrentName: string | null;
  birdPhone: string | null;
}

/**
 * Identifica contactos con nombres sospechosos usando criterios de pattern matching
 *
 * @returns Lista de contactos potencialmente dañados
 *
 * @example
 * ```ts
 * const damaged = await identifyDamagedContacts();
 * // damaged: [{ contactId: 'abc123', extractedName: 'Eva', ... }]
 * ```
 */
async function identifyDamagedContacts(): Promise<DamagedContact[]> {
  // Query con criterios sospechosos
  const results = await db.execute(sql`
    SELECT
      cn.id,
      cn.contact_id,
      cn.confidence,
      cn.extracted_data->>'displayName' as extracted_name,
      cn.extracted_data->>'method' as method,
      cn.created_at
    FROM contact_normalizations cn
    WHERE
      cn.created_at >= '2026-01-20T00:00:00Z'
      AND cn.created_at < '2026-01-21T00:00:00Z'
      AND cn.status = 'success'
      AND (
        cn.extracted_data->>'displayName' ~* '(para|pueda|atender|cuando|pero|que|claro|costo|precio|buenas)'
        OR cn.extracted_data->>'displayName' ~* '^(Eva|Karina)$'
        OR length(cn.extracted_data->>'displayName') < 5
        OR cn.confidence < 0.7
      )
    ORDER BY cn.created_at DESC
  `);

  const damaged: DamagedContact[] = [];

  for (const row of results.rows) {
    const normalizationId = row.id as number;
    const contactId = row.contact_id as string;
    const extractedName = row.extracted_name as string;
    const confidence = row.confidence as number;
    const method = row.method as string;

    // Detectar razón sospechosa
    let suspiciousReason = '';
    if (extractedName.match(/para|pueda|atender|cuando|pero|que|claro|costo/i)) {
      suspiciousReason = 'Conversation fragment';
    } else if (extractedName.match(/^(Eva|Karina)$/)) {
      suspiciousReason = 'Generic bot name';
    } else if (extractedName.length < 5) {
      suspiciousReason = 'Too short';
    } else if (confidence < 0.7) {
      suspiciousReason = 'Low confidence';
    }

    // Fetch current Bird contact state
    let birdCurrentName = null;
    let birdPhone = null;
    try {
      const contact = await fetchContactById(contactId);
      birdCurrentName = contact.computedDisplayName;
      const phoneId = contact.featuredIdentifiers.find((id) => id.key === 'phonenumber');
      birdPhone = phoneId?.value || null;
    } catch (error) {
      console.error(`Error fetching contact ${contactId}:`, error);
    }

    damaged.push({
      normalizationId,
      contactId,
      extractedName,
      confidence,
      method,
      suspiciousReason,
      birdCurrentName,
      birdPhone,
    });

    // Rate limit (600ms)
    await new Promise((resolve) => setTimeout(resolve, 600));
  }

  return damaged;
}

/**
 * Exporta lista de contactos dañados a CSV
 *
 * @param damaged - Lista de contactos dañados
 *
 * @example
 * ```ts
 * await exportToCSV(damagedContacts);
 * // Output: damaged-contacts.csv
 * ```
 */
async function exportToCSV(damaged: DamagedContact[]): Promise<void> {
  const fs = await import('node:fs/promises');

  const header =
    'Normalization ID,Contact ID,Extracted Name,Confidence,Method,Suspicious Reason,Current Bird Name,Phone\n';
  const rows = damaged
    .map(
      (d) =>
        `${d.normalizationId},${d.contactId},"${d.extractedName}",${d.confidence},${d.method},"${d.suspiciousReason}","${d.birdCurrentName || 'N/A'}","${d.birdPhone || 'N/A'}"`
    )
    .join('\n');

  await fs.writeFile('damaged-contacts.csv', header + rows, 'utf-8');
  console.log(`✓ Exported ${damaged.length} damaged contacts to damaged-contacts.csv`);
}

async function main() {
  console.log('Starting triage...\n');

  const damaged = await identifyDamagedContacts();

  console.log(`\nFound ${damaged.length} potentially damaged contacts\n`);
  console.log('Summary by reason:');
  const summary = damaged.reduce(
    (acc, d) => {
      acc[d.suspiciousReason] = (acc[d.suspiciousReason] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  Object.entries(summary).forEach(([reason, count]) => {
    console.log(`  ${reason}: ${count}`);
  });

  await exportToCSV(damaged);
}

main().catch(console.error);
