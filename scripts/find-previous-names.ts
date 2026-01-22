/**
 * @file Find Previous Correct Names
 * @description Busca nombres correctos en normalizaciones ANTERIORES al incidente
 * @module scripts/find-previous-names
 * @exports main
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

import { sql } from 'drizzle-orm';
import { fetchContactById } from '@/lib/bird/contacts';
import { db } from '@/lib/db/client';

interface DamagedContact {
  contactId: string;
  currentBadName: string;
  suspiciousReason: string;
}

interface PreviousNormalization {
  contactId: string;
  currentBadName: string;
  previousGoodName: string | null;
  confidence: number | null;
  normalizedAt: string | null;
  source: 'database' | 'bird_attributes' | 'manual_review';
  notes: string;
}

/**
 * Carga contactos dañados desde CSV
 *
 * @param filePath - Ruta al CSV
 * @returns Lista de contactos dañados
 */
async function loadDamagedContacts(filePath: string): Promise<DamagedContact[]> {
  const fs = await import('node:fs/promises');
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n').slice(1);

  const damaged: DamagedContact[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    const parts = line.split(',');
    if (parts.length < 6) continue;

    damaged.push({
      contactId: parts[1].trim(),
      currentBadName: parts[2].replace(/"/g, '').trim(),
      suspiciousReason: parts[5].replace(/"/g, '').trim(),
    });
  }

  return damaged;
}

/**
 * Busca nombre correcto en normalizaciones anteriores al incidente
 *
 * @param contactId - ID del contacto
 * @returns Nombre anterior si existe
 */
async function findPreviousGoodName(contactId: string): Promise<string | null> {
  // Buscar normalizaciones ANTES del incidente (antes de 2026-01-20 00:00)
  const results = await db.execute(sql`
    SELECT
      extracted_data->>'displayName' as display_name,
      confidence,
      created_at
    FROM contact_normalizations
    WHERE
      contact_id = ${contactId}
      AND created_at < '2026-01-20T00:00:00Z'
      AND status = 'success'
      AND confidence >= 0.7
      AND extracted_data->>'displayName' IS NOT NULL
      AND extracted_data->>'displayName' != ''
      AND extracted_data->>'method' != 'manual_correction'
    ORDER BY created_at DESC
    LIMIT 1
  `);

  if (results.rows.length > 0) {
    const displayName = results.rows[0].display_name as string;

    // Validar que no sea un nombre sospechoso
    if (
      displayName.match(/para|pueda|atender|cuando|pero|que|claro|costo/i) ||
      displayName.match(/^(Eva|Karina|Bot)$/i) ||
      displayName.length < 5
    ) {
      return null;
    }

    return displayName;
  }

  return null;
}

/**
 * Busca información adicional en atributos de Bird
 *
 * @param contactId - ID del contacto
 * @returns Información adicional
 */
async function checkBirdAttributes(contactId: string): Promise<{
  displayName: string | null;
  notes: string;
}> {
  try {
    const contact = await fetchContactById(contactId);

    // Buscar en atributos que podrían tener el nombre
    const attrs = contact.attributes || {};

    // Revisar atributos comunes
    const possibleNameFields = [
      attrs.displayName,
      attrs.firstName && attrs.lastName ? `${attrs.firstName} ${attrs.lastName}` : null,
      attrs.name,
      attrs.fullName,
      attrs.patientName,
    ];

    const notes: string[] = [];

    // Agregar info adicional
    if (attrs.email) notes.push(`Email: ${attrs.email}`);
    if (attrs.country) notes.push(`Country: ${attrs.country}`);
    if (attrs.city) notes.push(`City: ${attrs.city}`);
    if (attrs.company) notes.push(`Company: ${attrs.company}`);

    // Encontrar el primer nombre válido
    for (const name of possibleNameFields) {
      if (
        name &&
        typeof name === 'string' &&
        name.length >= 5 &&
        !name.match(/para|pueda|atender|Eva|Karina/i)
      ) {
        return { displayName: name, notes: notes.join('; ') };
      }
    }

    return { displayName: null, notes: notes.join('; ') };
  } catch (error) {
    return { displayName: null, notes: `Error: ${error}` };
  }
}

/**
 * Analiza contactos dañados y encuentra nombres correctos
 *
 * @param damaged - Lista de contactos dañados
 * @returns Lista con nombres encontrados
 */
async function analyzeDamagedContacts(damaged: DamagedContact[]): Promise<PreviousNormalization[]> {
  const results: PreviousNormalization[] = [];

  console.log(`Analyzing ${damaged.length} damaged contacts...\n`);

  for (let i = 0; i < damaged.length; i++) {
    const contact = damaged[i];
    console.log(`[${i + 1}/${damaged.length}] ${contact.contactId} (${contact.currentBadName})`);

    // Estrategia 1: Buscar en base de datos
    const prevName = await findPreviousGoodName(contact.contactId);

    if (prevName) {
      console.log(`  ✓ Found in database: ${prevName}`);
      results.push({
        contactId: contact.contactId,
        currentBadName: contact.currentBadName,
        previousGoodName: prevName,
        confidence: null,
        normalizedAt: null,
        source: 'database',
        notes: 'Found in contact_normalizations before incident',
      });

      // Rate limit
      await new Promise((resolve) => setTimeout(resolve, 600));
      continue;
    }

    // Estrategia 2: Buscar en atributos de Bird
    const birdInfo = await checkBirdAttributes(contact.contactId);

    if (birdInfo.displayName) {
      console.log(`  ✓ Found in Bird attributes: ${birdInfo.displayName}`);
      results.push({
        contactId: contact.contactId,
        currentBadName: contact.currentBadName,
        previousGoodName: birdInfo.displayName,
        confidence: null,
        normalizedAt: null,
        source: 'bird_attributes',
        notes: birdInfo.notes || 'Found in Bird contact attributes',
      });

      // Rate limit
      await new Promise((resolve) => setTimeout(resolve, 600));
      continue;
    }

    // No se encontró nombre automáticamente
    console.log(`  ✗ No automatic match - needs manual review`);
    console.log(`    Additional info: ${birdInfo.notes || 'None'}`);

    results.push({
      contactId: contact.contactId,
      currentBadName: contact.currentBadName,
      previousGoodName: null,
      confidence: null,
      normalizedAt: null,
      source: 'manual_review',
      notes: birdInfo.notes || 'No previous data found - manual review required',
    });

    // Rate limit
    await new Promise((resolve) => setTimeout(resolve, 600));
  }

  return results;
}

/**
 * Exporta resultados a CSV
 *
 * @param results - Resultados del análisis
 * @param outputPath - Ruta del archivo de salida
 */
async function exportResults(results: PreviousNormalization[], outputPath: string): Promise<void> {
  const fs = await import('node:fs/promises');

  const header = 'Contact ID,Current Bad Name,Previous Good Name,Source,Notes,Action Required\n';
  const rows = results
    .map((r) => {
      const action = r.previousGoodName ? 'AUTO' : 'MANUAL';
      return `${r.contactId},"${r.currentBadName}","${r.previousGoodName || 'N/A'}",${r.source},"${r.notes}",${action}`;
    })
    .join('\n');

  await fs.writeFile(outputPath, header + rows, 'utf-8');
  console.log(`\n✓ Exported results to ${outputPath}`);
}

/**
 * Genera CSV de correcciones automáticas
 *
 * @param results - Resultados del análisis
 * @param outputPath - Ruta del archivo de salida
 */
async function generateCorrectionsCSV(
  results: PreviousNormalization[],
  outputPath: string
): Promise<void> {
  const fs = await import('node:fs/promises');

  const autoCorrections = results.filter((r) => r.previousGoodName !== null);

  if (autoCorrections.length === 0) {
    console.log('\nNo automatic corrections found.');
    return;
  }

  const header = 'Contact ID,First Name,Last Name,Display Name,Notes\n';
  const rows = autoCorrections
    .map((r) => {
      const goodName = r.previousGoodName || '';
      const parts = goodName.split(/\s+/);
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ');

      return `${r.contactId},${firstName},${lastName},"${goodName}","Auto-recovered from ${r.source}"`;
    })
    .join('\n');

  await fs.writeFile(outputPath, header + rows, 'utf-8');
  console.log(`✓ Generated ${autoCorrections.length} automatic corrections in ${outputPath}`);
}

async function main() {
  const args = process.argv.slice(2);
  const inputFile = args.find((arg) => arg.endsWith('.csv')) || 'damaged-contacts.csv';
  const analysisFile = 'previous-names-analysis.csv';
  const correctionsFile = 'corrections-auto.csv';

  console.log('='.repeat(80));
  console.log('PREVIOUS NAMES FINDER');
  console.log('='.repeat(80));
  console.log(`Input: ${inputFile}`);
  console.log(`Analysis output: ${analysisFile}`);
  console.log(`Corrections output: ${correctionsFile}`);
  console.log('='.repeat(80));
  console.log();

  const damaged = await loadDamagedContacts(inputFile);
  console.log(`Loaded ${damaged.length} damaged contacts\n`);

  const results = await analyzeDamagedContacts(damaged);

  // Export analysis
  await exportResults(results, analysisFile);

  // Generate corrections CSV
  await generateCorrectionsCSV(results, correctionsFile);

  // Summary
  const autoCount = results.filter((r) => r.previousGoodName !== null).length;
  const manualCount = results.filter((r) => r.previousGoodName === null).length;

  console.log();
  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total analyzed: ${results.length}`);
  console.log(
    `✓ Auto-recoverable: ${autoCount} (${((autoCount / results.length) * 100).toFixed(1)}%)`
  );
  console.log(
    `✗ Manual review: ${manualCount} (${((manualCount / results.length) * 100).toFixed(1)}%)`
  );
  console.log('='.repeat(80));
  console.log();
  console.log('Next steps:');
  console.log(`1. Review ${analysisFile} for all findings`);
  if (autoCount > 0) {
    console.log(`2. Review ${correctionsFile} for auto-corrections`);
    console.log(`3. Run: tsx scripts/correct-damaged-contacts.ts ${correctionsFile}`);
    console.log(`4. Run: tsx scripts/correct-damaged-contacts.ts ${correctionsFile} --execute`);
  }
  if (manualCount > 0) {
    console.log(`5. Manually review ${manualCount} contacts that need manual correction`);
  }
}

main().catch(console.error);
