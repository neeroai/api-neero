/**
 * @file Interactive Contact Inspection
 * @description Herramienta interactiva para inspeccionar conversaciones y extraer nombres correctos
 * @module scripts/inspect-damaged-contacts
 * @exports main
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

import { createInterface } from 'node:readline';
import { fetchContactById } from '@/lib/bird/contacts';
import { findConversationByPhone, getConversationMessages } from '@/lib/bird/conversations';

interface DamagedContact {
  normalizationId: string;
  contactId: string;
  extractedName: string;
  confidence: string;
  method: string;
  suspiciousReason: string;
  birdCurrentName: string;
  birdPhone: string;
}

interface Correction {
  contactId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  notes: string;
}

/**
 * Carga contactos dañados desde CSV
 *
 * @param filePath - Ruta al CSV de contactos dañados
 * @returns Lista de contactos a inspeccionar
 *
 * @example
 * ```ts
 * const damaged = await loadDamagedContacts('damaged-contacts.csv');
 * ```
 */
async function loadDamagedContacts(filePath: string): Promise<DamagedContact[]> {
  const fs = await import('node:fs/promises');
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n').slice(1); // Skip header

  const damaged: DamagedContact[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    const parts = line.split(',');
    if (parts.length < 8) continue;

    damaged.push({
      normalizationId: parts[0].trim(),
      contactId: parts[1].trim(),
      extractedName: parts[2].replace(/"/g, '').trim(),
      confidence: parts[3].trim(),
      method: parts[4].trim(),
      suspiciousReason: parts[5].replace(/"/g, '').trim(),
      birdCurrentName: parts[6].replace(/"/g, '').trim(),
      birdPhone: parts[7].replace(/"/g, '').trim(),
    });
  }

  return damaged;
}

/**
 * Muestra mensajes del contacto para inspección manual
 *
 * @param contactId - ID del contacto en Bird
 * @param phone - Número de teléfono del contacto
 *
 * @example
 * ```ts
 * await displayConversation('conta_123', '+573001234567');
 * ```
 */
async function displayConversation(contactId: string, phone: string): Promise<void> {
  try {
    // Fetch contact details
    const contact = await fetchContactById(contactId);
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Contact ID: ${contactId}`);
    console.log(`Current Name: ${contact.computedDisplayName}`);
    console.log(`Phone: ${phone}`);
    console.log('='.repeat(80));

    // Find conversation
    const conversation = await findConversationByPhone(phone);
    if (!conversation) {
      console.log('\nNo conversation found for this phone number.');
      return;
    }

    // Get messages (last 50, filter for contact messages only)
    const messages = await getConversationMessages(conversation.id, 50);
    const contactMessages = messages.filter((msg) => msg.sender.type === 'contact');

    console.log(`\nLast ${Math.min(contactMessages.length, 20)} CONTACT messages:\n`);

    // Show last 20 contact messages
    contactMessages.slice(0, 20).forEach((msg, idx) => {
      const timestamp = new Date(msg.createdAt).toLocaleString('es-CO');
      const text = msg.body.text?.substring(0, 150) || '[No text]';
      console.log(`[${idx + 1}] ${timestamp}`);
      console.log(`    ${text}`);
      console.log();
    });
  } catch (error) {
    console.error(`Error fetching conversation: ${error}`);
  }
}

/**
 * Pregunta al usuario por la corrección
 *
 * @param rl - Readline interface
 * @param question - Pregunta a hacer
 * @returns Respuesta del usuario
 */
function askQuestion(rl: ReturnType<typeof createInterface>, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

/**
 * Guarda correcciones a CSV
 *
 * @param corrections - Lista de correcciones
 * @param outputPath - Ruta del archivo de salida
 *
 * @example
 * ```ts
 * await saveCorrections(corrections, 'corrections.csv');
 * ```
 */
async function saveCorrections(corrections: Correction[], outputPath: string): Promise<void> {
  const fs = await import('node:fs/promises');

  const header = 'Contact ID,First Name,Last Name,Display Name,Notes\n';
  const rows = corrections
    .map((c) => `${c.contactId},${c.firstName},${c.lastName},"${c.displayName}","${c.notes}"`)
    .join('\n');

  await fs.writeFile(outputPath, header + rows, 'utf-8');
  console.log(`\n✓ Saved ${corrections.length} corrections to ${outputPath}`);
}

async function main() {
  const args = process.argv.slice(2);
  const inputFile = args.find((arg) => arg.endsWith('.csv')) || 'damaged-contacts.csv';
  const outputFile = 'corrections.csv';

  console.log('='.repeat(80));
  console.log('INTERACTIVE CONTACT INSPECTION TOOL');
  console.log('='.repeat(80));
  console.log(`Input: ${inputFile}`);
  console.log(`Output: ${outputFile}`);
  console.log('='.repeat(80));
  console.log();
  console.log('Instructions:');
  console.log('1. Review the conversation messages');
  console.log('2. Enter the CORRECT full name (First Last)');
  console.log('3. Type "skip" to skip this contact');
  console.log('4. Type "quit" to save and exit');
  console.log();

  const damaged = await loadDamagedContacts(inputFile);
  console.log(`Loaded ${damaged.length} damaged contacts\n`);

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const corrections: Correction[] = [];

  for (let i = 0; i < damaged.length; i++) {
    const contact = damaged[i];

    console.log(`\n[${i + 1}/${damaged.length}] Processing contact...`);

    // Display conversation
    await displayConversation(contact.contactId, contact.birdPhone);

    console.log('Current bad name:', contact.extractedName);
    console.log('Suspicious reason:', contact.suspiciousReason);
    console.log();

    // Ask for correction
    const answer = await askQuestion(rl, 'Enter CORRECT name (First Last), "skip", or "quit": ');

    if (answer.toLowerCase() === 'quit') {
      console.log('\nSaving and exiting...');
      break;
    }

    if (answer.toLowerCase() === 'skip') {
      console.log('Skipped.');
      continue;
    }

    if (answer.trim().length < 5) {
      console.log('⚠ Name too short. Skipping.');
      continue;
    }

    // Parse name
    const parts = answer.trim().split(/\s+/);
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');

    if (!lastName) {
      console.log('⚠ Missing last name. Skipping.');
      continue;
    }

    corrections.push({
      contactId: contact.contactId,
      firstName,
      lastName,
      displayName: answer.trim(),
      notes: `Corrected from "${contact.extractedName}" - Reason: ${contact.suspiciousReason}`,
    });

    console.log(`✓ Saved: ${answer}`);

    // Rate limit
    await new Promise((resolve) => setTimeout(resolve, 600));
  }

  rl.close();

  // Save corrections
  if (corrections.length > 0) {
    await saveCorrections(corrections, outputFile);
  } else {
    console.log('\nNo corrections to save.');
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log('INSPECTION COMPLETE');
  console.log('='.repeat(80));
  console.log(`Inspected: ${damaged.length} contacts`);
  console.log(`Corrected: ${corrections.length} contacts`);
  console.log(`Skipped: ${damaged.length - corrections.length} contacts`);
  console.log('='.repeat(80));
  console.log();
  console.log('Next steps:');
  console.log('1. Review corrections.csv');
  console.log('2. Run: tsx scripts/correct-damaged-contacts.ts corrections.csv');
  console.log('3. Run: tsx scripts/correct-damaged-contacts.ts corrections.csv --execute');
  console.log();
}

main().catch(console.error);
