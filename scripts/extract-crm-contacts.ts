/**
 * @file Extract CRM Contacts from Bird Workspace
 * @description Extracts all contacts from Bird workspace 28519 and saves to /crm_bird/
 * @usage pnpm tsx scripts/extract-crm-contacts.ts
 */

// Load environment variables FIRST (before any imports that use them)
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { listAllContacts } from '@/lib/bird/contacts';
import { getBirdConfig } from '@/lib/bird/env';
import type { BirdContact } from '@/lib/bird/types';

interface BatchFile {
  batchNumber: number;
  contactCount: number;
  extractedAt: string;
  workspaceId: string;
  contacts: BirdContact[];
}

interface ExtractionLog {
  startTime: string;
  endTime: string;
  duration: string;
  workspaceId: string;
  totals: {
    contacts: number;
    batches: number;
    errors: number;
  };
  files: {
    contactBatches: number;
    totalSize: string;
  };
  errors: Array<{ page: number; error: string }>;
}

interface Summary {
  workspaceId: string;
  extractedAt: string;
  duration: string;
  totals: {
    contacts: number;
    batches: number;
    identifiers: Record<string, number>;
    customAttributes: Record<string, number>;
  };
  errors: number;
  files: {
    contactBatches: number;
    totalSize: string;
  };
}

const BATCH_SIZE = 100;
const OUTPUT_DIR = join(process.cwd(), 'crm_bird');
const CONTACTS_DIR = join(OUTPUT_DIR, 'contacts');
const METADATA_DIR = join(OUTPUT_DIR, 'metadata');

function formatTimestamp(): string {
  return new Date().toISOString();
}

function formatDuration(startTime: Date, endTime: Date): string {
  const durationMs = endTime.getTime() - startTime.getTime();
  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }
  return `${minutes}m ${remainingSeconds}s`;
}

function formatFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

function logProgress(message: string): void {
  const timestamp = new Date().toLocaleTimeString('es-CO', { hour12: false });
  console.log(`[${timestamp}] ${message}`);
}

async function ensureDirectories(): Promise<void> {
  await mkdir(CONTACTS_DIR, { recursive: true });
  await mkdir(METADATA_DIR, { recursive: true });
  logProgress(`✓ Directorios creados: ${OUTPUT_DIR}`);
}

async function saveBatch(
  batchNumber: number,
  contacts: BirdContact[],
  workspaceId: string
): Promise<number> {
  const batchFile: BatchFile = {
    batchNumber,
    contactCount: contacts.length,
    extractedAt: formatTimestamp(),
    workspaceId,
    contacts,
  };

  const filename = `batch-${String(batchNumber).padStart(4, '0')}.json`;
  const filepath = join(CONTACTS_DIR, filename);

  const content = JSON.stringify(batchFile, null, 2);
  await writeFile(filepath, content, 'utf-8');

  return Buffer.byteLength(content, 'utf-8');
}

function analyzeContacts(allContacts: BirdContact[]): {
  identifiers: Record<string, number>;
  customAttributes: Record<string, number>;
} {
  const identifiers: Record<string, number> = {};
  const customAttributes: Record<string, number> = {};

  for (const contact of allContacts) {
    // Analyze identifiers
    for (const identifier of contact.featuredIdentifiers || []) {
      const key = identifier.key;
      identifiers[key] = (identifiers[key] || 0) + 1;
    }

    // Analyze custom attributes
    if (contact.attributes) {
      for (const attrKey of Object.keys(contact.attributes)) {
        if (contact.attributes[attrKey]) {
          customAttributes[attrKey] = (customAttributes[attrKey] || 0) + 1;
        }
      }
    }
  }

  return { identifiers, customAttributes };
}

async function saveMetadata(
  log: ExtractionLog,
  summary: Summary
): Promise<void> {
  const logPath = join(METADATA_DIR, 'extraction-log.json');
  const summaryPath = join(METADATA_DIR, 'summary.json');

  await writeFile(logPath, JSON.stringify(log, null, 2), 'utf-8');
  await writeFile(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');

  logProgress(`✓ Metadata guardada en ${METADATA_DIR}`);
}

async function extractContacts(): Promise<void> {
  const startTime = new Date();
  const config = getBirdConfig();
  const workspaceId = config.workspaceId;

  logProgress('Iniciando extracción de contactos...');
  logProgress(`Workspace ID: ${workspaceId}`);

  await ensureDirectories();

  const errors: Array<{ page: number; error: string }> = [];
  const allContacts: BirdContact[] = [];
  let batchNumber = 1;
  let totalSize = 0;

  try {
    logProgress('Extrayendo contactos de Bird API...');

    // Usar listAllContacts() que ya maneja paginación
    const contacts = await listAllContacts();

    logProgress(`✓ ${contacts.length} contactos extraídos de Bird API`);

    // Dividir en batches y guardar
    for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
      const batch = contacts.slice(i, i + BATCH_SIZE);
      const batchSize = await saveBatch(batchNumber, batch, workspaceId);
      totalSize += batchSize;
      allContacts.push(...batch);

      logProgress(
        `Guardando batch ${batchNumber}/${Math.ceil(contacts.length / BATCH_SIZE)}: ${batch.length} contactos`
      );

      batchNumber++;
    }

    const endTime = new Date();
    const duration = formatDuration(startTime, endTime);

    logProgress(`COMPLETO: ${allContacts.length} contactos extraídos → ${batchNumber - 1} archivos generados`);

    // Analizar contactos
    const { identifiers, customAttributes } = analyzeContacts(allContacts);

    // Crear extraction log
    const extractionLog: ExtractionLog = {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      workspaceId,
      totals: {
        contacts: allContacts.length,
        batches: batchNumber - 1,
        errors: errors.length,
      },
      files: {
        contactBatches: batchNumber - 1,
        totalSize: formatFileSize(totalSize),
      },
      errors,
    };

    // Crear summary
    const summary: Summary = {
      workspaceId,
      extractedAt: endTime.toISOString(),
      duration,
      totals: {
        contacts: allContacts.length,
        batches: batchNumber - 1,
        identifiers,
        customAttributes,
      },
      errors: errors.length,
      files: {
        contactBatches: batchNumber - 1,
        totalSize: formatFileSize(totalSize),
      },
    };

    await saveMetadata(extractionLog, summary);

    logProgress('✓ Extracción finalizada exitosamente');

    // Summary output
    console.log('\n=== RESUMEN ===');
    console.log(`Total contactos: ${allContacts.length}`);
    console.log(`Archivos generados: ${batchNumber - 1}`);
    console.log(`Tamaño total: ${formatFileSize(totalSize)}`);
    console.log(`Duración: ${duration}`);
    console.log(`Errores: ${errors.length}`);
    console.log('\nIdentificadores:');
    for (const [key, count] of Object.entries(identifiers)) {
      console.log(`  ${key}: ${count}`);
    }
    console.log('\nAtributos personalizados (top 10):');
    const topAttributes = Object.entries(customAttributes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
    for (const [key, count] of topAttributes) {
      console.log(`  ${key}: ${count}`);
    }

  } catch (error) {
    const endTime = new Date();
    const duration = formatDuration(startTime, endTime);

    console.error('\n❌ Error crítico en extracción:', error);

    // Guardar log de error
    const extractionLog: ExtractionLog = {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      workspaceId,
      totals: {
        contacts: allContacts.length,
        batches: batchNumber - 1,
        errors: errors.length + 1,
      },
      files: {
        contactBatches: batchNumber - 1,
        totalSize: formatFileSize(totalSize),
      },
      errors: [
        ...errors,
        {
          page: -1,
          error: error instanceof Error ? error.message : String(error),
        },
      ],
    };

    await saveMetadata(extractionLog, {
      workspaceId,
      extractedAt: endTime.toISOString(),
      duration,
      totals: {
        contacts: allContacts.length,
        batches: batchNumber - 1,
        identifiers: {},
        customAttributes: {},
      },
      errors: errors.length + 1,
      files: {
        contactBatches: batchNumber - 1,
        totalSize: formatFileSize(totalSize),
      },
    });

    process.exit(1);
  }
}

// Execute
extractContacts();
