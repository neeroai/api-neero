/**
 * @file JSON to CSV Converter for Bird Contacts
 * @description Converts 286 JSON batch files to single CSV file
 * @usage pnpm tsx scripts/json-to-csv.ts
 */

// Load environment variables FIRST
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { BirdContact } from '@/lib/bird/types';

interface BatchFile {
  batchNumber: number;
  contactCount: number;
  extractedAt: string;
  workspaceId: string;
  contacts: BirdContact[];
}

interface CSVRow {
  firstName: string;
  lastName: string;
  displayName: string;
  avatarUrl: string;
  country: string;
  gender: string;
  phonenumber: string;
  emailaddress: string;
  subscribedSms: string;
  subscribedWhatsApp: string;
  subscribedEmail: string;
  subscribedRcs: string;
  subscribedPush: string;
  subscribedAppInbox: string;
}

interface ConversionStats {
  totalContacts: number;
  fieldCoverage: Record<string, number>;
  subscriptions: Record<string, number>;
}

const CONTACTS_DIR = join(process.cwd(), 'crm_bird', 'contacts');
const OUTPUT_FILE = join(process.cwd(), 'crm_bird', 'contacts_bird_complete.csv');

const CSV_HEADER = [
  'firstName',
  'lastName',
  'displayName',
  'avatarUrl',
  'country',
  'gender',
  'phonenumber',
  'emailaddress',
  'subscribedSms',
  'subscribedWhatsApp',
  'subscribedEmail',
  'subscribedRcs',
  'subscribedPush',
  'subscribedAppInbox',
];

function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Escape quotes and wrap in quotes if contains special characters
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function mapContactToCSVRow(contact: BirdContact): CSVRow {
  const attrs = contact.attributes || {};

  return {
    firstName: attrs.firstName || '',
    lastName: attrs.lastName || '',
    displayName: attrs.displayName || contact.computedDisplayName || '',
    avatarUrl: attrs.avatarUrl || '',
    country: attrs.country || '',
    gender: attrs.gender || '',
    phonenumber: Array.isArray(attrs.phonenumber) ? (attrs.phonenumber[0] || '') : (attrs.phonenumber || ''),
    emailaddress: Array.isArray(attrs.emailaddress) ? (attrs.emailaddress[0] || '') : (attrs.emailaddress || ''),
    subscribedSms: String(attrs.subscribedSms || false),
    subscribedWhatsApp: String(attrs.subscribedWhatsApp || false),
    subscribedEmail: String(attrs.subscribedEmail || false),
    subscribedRcs: String(attrs.subscribedRcs || false),
    subscribedPush: String(attrs.subscribedPush || false),
    subscribedAppInbox: String(attrs.subscribedAppInbox || false),
  };
}

function calculateStats(contacts: BirdContact[]): ConversionStats {
  const stats: ConversionStats = {
    totalContacts: contacts.length,
    fieldCoverage: {
      firstName: 0,
      lastName: 0,
      displayName: 0,
      country: 0,
      gender: 0,
      phonenumber: 0,
      emailaddress: 0,
    },
    subscriptions: {
      subscribedSms: 0,
      subscribedWhatsApp: 0,
      subscribedEmail: 0,
      subscribedRcs: 0,
      subscribedPush: 0,
      subscribedAppInbox: 0,
    },
  };

  for (const contact of contacts) {
    const attrs = contact.attributes || {};

    // Field coverage
    if (attrs.firstName) stats.fieldCoverage.firstName++;
    if (attrs.lastName) stats.fieldCoverage.lastName++;
    if (attrs.displayName || contact.computedDisplayName) stats.fieldCoverage.displayName++;
    if (attrs.country) stats.fieldCoverage.country++;
    if (attrs.gender) stats.fieldCoverage.gender++;
    if (attrs.phonenumber) stats.fieldCoverage.phonenumber++;
    if (attrs.emailaddress) stats.fieldCoverage.emailaddress++;

    // Subscriptions
    if (attrs.subscribedSms) stats.subscriptions.subscribedSms++;
    if (attrs.subscribedWhatsApp) stats.subscriptions.subscribedWhatsApp++;
    if (attrs.subscribedEmail) stats.subscriptions.subscribedEmail++;
    if (attrs.subscribedRcs) stats.subscriptions.subscribedRcs++;
    if (attrs.subscribedPush) stats.subscriptions.subscribedPush++;
    if (attrs.subscribedAppInbox) stats.subscriptions.subscribedAppInbox++;
  }

  return stats;
}

function formatPercentage(value: number, total: number): string {
  const percent = ((value / total) * 100).toFixed(1);
  return `${value.toLocaleString()} (${percent}%)`;
}

async function convertJSONToCSV(): Promise<void> {
  const startTime = new Date();

  console.log('🚀 Iniciando conversión JSON → CSV...');
  console.log(`📂 Leyendo archivos de: ${CONTACTS_DIR}`);

  // Read all batch files
  const files = await readdir(CONTACTS_DIR);
  const batchFiles = files
    .filter((f) => f.startsWith('batch-') && f.endsWith('.json'))
    .sort((a, b) => {
      const numA = parseInt(a.match(/batch-(\d+)\.json/)?.[1] || '0', 10);
      const numB = parseInt(b.match(/batch-(\d+)\.json/)?.[1] || '0', 10);
      return numA - numB;
    });

  console.log(`📊 Encontrados ${batchFiles.length} archivos batch`);

  const allContacts: BirdContact[] = [];
  const csvRows: string[] = [];

  // Add header with UTF-8 BOM
  csvRows.push(CSV_HEADER.join(','));

  // Process each batch file
  for (let i = 0; i < batchFiles.length; i++) {
    const filename = batchFiles[i];
    const filepath = join(CONTACTS_DIR, filename);

    const content = await readFile(filepath, 'utf-8');
    const batch: BatchFile = JSON.parse(content);

    // Map contacts to CSV rows
    for (const contact of batch.contacts) {
      allContacts.push(contact);

      const row = mapContactToCSVRow(contact);
      const csvRow = [
        escapeCSVValue(row.firstName),
        escapeCSVValue(row.lastName),
        escapeCSVValue(row.displayName),
        escapeCSVValue(row.avatarUrl),
        escapeCSVValue(row.country),
        escapeCSVValue(row.gender),
        escapeCSVValue(row.phonenumber),
        escapeCSVValue(row.emailaddress),
        escapeCSVValue(row.subscribedSms),
        escapeCSVValue(row.subscribedWhatsApp),
        escapeCSVValue(row.subscribedEmail),
        escapeCSVValue(row.subscribedRcs),
        escapeCSVValue(row.subscribedPush),
        escapeCSVValue(row.subscribedAppInbox),
      ].join(',');

      csvRows.push(csvRow);
    }

    // Progress logging every 10 batches
    if ((i + 1) % 10 === 0) {
      console.log(`⏳ Procesados ${i + 1}/${batchFiles.length} batches (${allContacts.length} contactos)`);
    }
  }

  // Write CSV file with UTF-8 BOM
  const csvContent = '\uFEFF' + csvRows.join('\n');
  await writeFile(OUTPUT_FILE, csvContent, 'utf-8');

  const endTime = new Date();
  const duration = ((endTime.getTime() - startTime.getTime()) / 1000).toFixed(2);

  // Calculate statistics
  const stats = calculateStats(allContacts);

  // Print report
  console.log('\n=== CONVERSION REPORT ===');
  console.log(`Total contactos procesados: ${stats.totalContacts.toLocaleString()}`);
  console.log(`Total filas escritas: ${csvRows.length.toLocaleString()} (incluyendo header)`);
  console.log('');
  console.log('Field Coverage:');
  console.log(`  firstName: ${formatPercentage(stats.fieldCoverage.firstName, stats.totalContacts)}`);
  console.log(`  lastName: ${formatPercentage(stats.fieldCoverage.lastName, stats.totalContacts)}`);
  console.log(`  displayName: ${formatPercentage(stats.fieldCoverage.displayName, stats.totalContacts)}`);
  console.log(`  country: ${formatPercentage(stats.fieldCoverage.country, stats.totalContacts)}`);
  console.log(`  gender: ${formatPercentage(stats.fieldCoverage.gender, stats.totalContacts)}`);
  console.log(`  phonenumber: ${formatPercentage(stats.fieldCoverage.phonenumber, stats.totalContacts)}`);
  console.log(`  emailaddress: ${formatPercentage(stats.fieldCoverage.emailaddress, stats.totalContacts)}`);
  console.log('');
  console.log('Subscriptions:');
  console.log(`  subscribedSms: ${formatPercentage(stats.subscriptions.subscribedSms, stats.totalContacts)}`);
  console.log(`  subscribedWhatsApp: ${formatPercentage(stats.subscriptions.subscribedWhatsApp, stats.totalContacts)}`);
  console.log(`  subscribedEmail: ${formatPercentage(stats.subscriptions.subscribedEmail, stats.totalContacts)}`);
  console.log(`  subscribedRcs: ${formatPercentage(stats.subscriptions.subscribedRcs, stats.totalContacts)}`);
  console.log(`  subscribedPush: ${formatPercentage(stats.subscriptions.subscribedPush, stats.totalContacts)}`);
  console.log(`  subscribedAppInbox: ${formatPercentage(stats.subscriptions.subscribedAppInbox, stats.totalContacts)}`);
  console.log('');
  console.log(`Output: ${OUTPUT_FILE}`);
  console.log(`Duración: ${duration} segundos`);
  console.log('');
  console.log('✅ Conversión completada exitosamente');
}

// Execute
convertJSONToCSV();
