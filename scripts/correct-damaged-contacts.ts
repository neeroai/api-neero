/**
 * @file Corrección de Contactos Dañados
 * @description Aplica correcciones desde CSV manual con dry-run mode y rate limiting
 * @module scripts/correct-damaged-contacts
 * @exports main
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

import { fetchContactById, updateContact } from '@/lib/bird/contacts';
import { db } from '@/lib/db/client';
import { contactNormalizations } from '@/lib/db/schema';

interface Correction {
  contactId: string;
  correctFirstName: string;
  correctLastName: string;
  correctDisplayName: string;
  notes: string;
}

/**
 * Carga correcciones desde archivo CSV
 *
 * @param filePath - Ruta al archivo CSV con correcciones
 * @returns Lista de correcciones a aplicar
 *
 * @example
 * ```ts
 * const corrections = await loadCorrectionsFromCSV('corrections.csv');
 * // corrections: [{ contactId: 'abc123', correctDisplayName: 'María García', ... }]
 * ```
 */
async function loadCorrectionsFromCSV(filePath: string): Promise<Correction[]> {
  const fs = await import('node:fs/promises');
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n').slice(1); // Skip header

  const corrections: Correction[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    const [contactId, firstName, lastName, displayName, notes] = line
      .split(',')
      .map((s) => s.trim().replace(/"/g, ''));

    corrections.push({
      contactId,
      correctFirstName: firstName,
      correctLastName: lastName,
      correctDisplayName: displayName,
      notes,
    });
  }

  return corrections;
}

/**
 * Aplica corrección a un contacto individual
 *
 * @param correction - Datos de corrección a aplicar
 * @param dryRun - Si es true, solo simula sin aplicar cambios
 * @returns True si la corrección fue exitosa
 * @throws Error si falla la actualización en Bird API
 *
 * @example
 * ```ts
 * const success = await applyCorrection(correction, false);
 * // success: true (contacto actualizado en Bird)
 * ```
 */
async function applyCorrection(correction: Correction, dryRun: boolean): Promise<boolean> {
  try {
    // 1. Fetch current state (for logging)
    const currentContact = await fetchContactById(correction.contactId);
    const beforeState = {
      displayName: currentContact.computedDisplayName,
      firstName: currentContact.attributes?.firstName,
      lastName: currentContact.attributes?.lastName,
    };

    console.log(`  Before: ${beforeState.displayName}`);
    console.log(`  After:  ${correction.correctDisplayName}`);

    if (dryRun) {
      console.log('  → DRY RUN - No update applied');
      return true;
    }

    // 2. Apply correction to Bird
    await updateContact(correction.contactId, {
      firstName: correction.correctFirstName,
      lastName: correction.correctLastName,
      attributes: {
        displayName: correction.correctDisplayName,
        firstName: correction.correctFirstName,
        lastName: correction.correctLastName,
        estatus: 'corregido_manualmente', // Mark as manually corrected
      },
    });

    // 3. Log correction to database
    await db.insert(contactNormalizations).values({
      contactId: correction.contactId,
      status: 'success',
      confidence: 1.0, // Manual correction = 100% confidence
      before: beforeState,
      after: {
        displayName: correction.correctDisplayName,
        firstName: correction.correctFirstName,
        lastName: correction.correctLastName,
      },
      extractedData: {
        displayName: correction.correctDisplayName,
        firstName: correction.correctFirstName,
        lastName: correction.correctLastName,
        method: 'manual_correction',
        notes: correction.notes,
      },
    });

    console.log('  ✓ Corrected successfully');
    return true;
  } catch (error) {
    console.error(`  ✗ Error: ${error}`);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  const csvFile = args.find((arg) => arg.endsWith('.csv')) || 'corrections.csv';

  console.log('='.repeat(80));
  console.log('CONTACT CORRECTION SCRIPT');
  console.log('='.repeat(80));
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'EXECUTE'}`);
  console.log(`CSV: ${csvFile}`);
  console.log('='.repeat(80));
  console.log();

  // Load corrections
  const corrections = await loadCorrectionsFromCSV(csvFile);
  console.log(`Loaded ${corrections.length} corrections\n`);

  if (!dryRun) {
    console.log('Press Ctrl+C to cancel, or wait 5 seconds...');
    await new Promise((resolve) => setTimeout(resolve, 5000));
    console.log('Starting corrections...\n');
  }

  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < corrections.length; i++) {
    const correction = corrections[i];
    console.log(`[${i + 1}/${corrections.length}] Contact: ${correction.contactId}`);

    const success = await applyCorrection(correction, dryRun);
    if (success) successCount++;
    else failureCount++;

    // Rate limit: 600ms
    await new Promise((resolve) => setTimeout(resolve, 600));
    console.log();
  }

  console.log('='.repeat(80));
  console.log('CORRECTION COMPLETE');
  console.log('='.repeat(80));
  console.log(`Total: ${corrections.length}`);
  console.log(`✓ Success: ${successCount}`);
  console.log(`✗ Failed: ${failureCount}`);
  console.log('='.repeat(80));
}

main().catch(console.error);
