/**
 * @file Extract and Correct
 * @description Extrae datos con NER y aplica correcciones automáticamente
 * @module scripts/extract-and-correct
 * @exports main
 */

import { config } from 'dotenv';

config({ path: '.env.local' });

import { updateContact } from '@/lib/bird/contacts';
import { db } from '@/lib/db/client';
import { contactNormalizations } from '@/lib/db/schema';
import { extractContactDataGPT4oMini } from '@/lib/normalization/gpt4o-mini-extractor';
import { isValidPatientName } from '@/lib/normalization/validators';

interface ExtractedData {
  contactId: string;
  responseText: string;
  extracted: {
    firstName: string;
    lastName: string;
    displayName: string;
    email: string | null;
  } | null;
  confidence: number;
  valid: boolean;
  reason?: string;
}

async function main() {
  const fs = await import('node:fs/promises');

  // Load responses
  const responsesCSV = await fs.readFile('patient-responses.csv', 'utf-8');
  const lines = responsesCSV.split('\n').slice(1);

  const extractions: ExtractedData[] = [];

  console.log('Extracting data from patient responses...\n');

  for (const line of lines) {
    if (!line.trim()) continue;

    const parts = line.split(',');
    const contactId = parts[0].trim();
    const responseText = parts[2].replace(/"/g, '').trim();

    console.log(`\n[${contactId}]`);
    console.log(`Response: "${responseText}"`);

    try {
      // Use existing NER extractor
      const extracted = await extractContactDataGPT4oMini(responseText);

      const validation = isValidPatientName(extracted.displayName, extracted.confidence);

      extractions.push({
        contactId,
        responseText,
        extracted: {
          firstName: extracted.firstName,
          lastName: extracted.lastName,
          displayName: extracted.displayName,
          email: extracted.email || null,
        },
        confidence: extracted.confidence,
        valid: validation.valid,
        reason: validation.reason,
      });

      console.log(`  Extracted: ${extracted.displayName}`);
      console.log(`  Confidence: ${extracted.confidence}`);
      console.log(
        `  Valid: ${validation.valid}${validation.reason ? ` (${validation.reason})` : ''}`
      );
    } catch (error) {
      extractions.push({
        contactId,
        responseText,
        extracted: null,
        confidence: 0,
        valid: false,
        reason: `Extraction failed: ${error}`,
      });
      console.log(`  ✗ Extraction failed: ${error}`);
    }

    // Rate limit
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Apply corrections for valid extractions
  console.log('\n\nApplying corrections...\n');

  let successCount = 0;
  let failureCount = 0;

  for (const extraction of extractions) {
    if (!extraction.valid || !extraction.extracted) {
      console.log(`  ✗ ${extraction.contactId} - Skipped (invalid or failed extraction)`);
      failureCount++;
      continue;
    }

    try {
      await updateContact(extraction.contactId, {
        firstName: extraction.extracted.firstName,
        lastName: extraction.extracted.lastName,
        attributes: {
          displayName: extraction.extracted.displayName,
          firstName: extraction.extracted.firstName,
          lastName: extraction.extracted.lastName,
          email: extraction.extracted.email || undefined,
          estatus: 'corregido_automaticamente',
        },
      });

      // Log to database
      await db.insert(contactNormalizations).values({
        contactId: extraction.contactId,
        status: 'success',
        confidence: extraction.confidence,
        extractedData: {
          ...extraction.extracted,
          method: 'patient_confirmation',
          source: 'automated_message',
        },
      });

      console.log(
        `  ✓ ${extraction.contactId} - Corrected to: ${extraction.extracted.displayName}`
      );
      successCount++;
    } catch (error) {
      console.log(`  ✗ ${extraction.contactId} - Failed: ${error}`);
      failureCount++;
    }

    // Rate limit
    await new Promise((resolve) => setTimeout(resolve, 600));
  }

  // Export results
  const header =
    'Contact ID,Display Name,First Name,Last Name,Email,Confidence,Valid,Reason,Status\n';
  const rows = extractions
    .map((e) => {
      const status = e.valid && e.extracted ? 'corrected' : 'needs_review';
      return `${e.contactId},"${e.extracted?.displayName || 'N/A'}","${e.extracted?.firstName || ''}","${e.extracted?.lastName || ''}","${e.extracted?.email || ''}",${e.confidence},${e.valid},"${e.reason || ''}",${status}`;
    })
    .join('\n');

  await fs.writeFile('extraction-results.csv', header + rows, 'utf-8');

  console.log('\n' + '='.repeat(80));
  console.log('EXTRACTION & CORRECTION COMPLETE');
  console.log('='.repeat(80));
  console.log(`✓ Corrected: ${successCount}`);
  console.log(`✗ Needs Review: ${failureCount}`);
  console.log('='.repeat(80));
}

main().catch(console.error);
