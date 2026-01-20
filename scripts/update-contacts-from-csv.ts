/**
 * Update Bird CRM Contacts from CSV
 *
 * Reads contact data from CSV export and updates Bird CRM with clean names.
 * CRITICAL FIX: Updates BOTH displayName attribute AND firstName/lastName fields.
 *
 * Features:
 * - CSV input (reusable for future updates)
 * - Emoji removal from Display Name
 * - Dual-field update strategy (displayName + firstName/lastName)
 * - Verification via GET after update
 * - Dry-run mode
 * - Detailed JSON reporting
 *
 * Usage:
 *   npx tsx scripts/update-contacts-from-csv.ts --csv "path/to/contacts.csv" --dry-run
 *   npx tsx scripts/update-contacts-from-csv.ts --csv "path/to/contacts.csv"
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import * as fs from 'fs';
import { parseCSVFile } from '@/lib/utils/csv-parser';
import {
  searchContactByPhone,
  updateContact,
  fetchContactById,
} from '@/lib/bird/contacts';
import type { BirdContact } from '@/lib/bird/types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface CSVContact {
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  countryCode: string | null;
  updatedAt: string | null;
  createdAt: string | null;
}

interface UpdateReport {
  phone: string;
  csvDisplayName: string;
  status: 'success' | 'failed' | 'not_found' | 'skipped';
  before: {
    computedDisplayName?: string;
    displayNameAttr?: string;
    firstName?: string;
    lastName?: string;
    jose?: string;
    country?: string;
    fase?: string;
    initialSource?: string;
  };
  after: {
    displayName?: string;
    firstName?: string;
    lastName?: string;
    jose?: string;
    country?: string;
    fase?: string;
    initialSource?: string;
  };
  updatedFields: string[];
  verified?: boolean;
  verificationNote?: string;
  error?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Remove all emojis from string (comprehensive Unicode ranges)
 */
function removeEmojis(text: string): string {
  return text
    .replace(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{1FAA0}-\u{1FAFF}]/gu,
      ''
    )
    .trim();
}

/**
 * Capitalize first letter of each word (proper case)
 */
function capitalizeProper(text: string): string {
  if (!text) return text;
  return text
    .split(/\s+/)
    .map((word) => {
      if (word.length === 0) return word;
      // Preserve special patterns like "D." or single letters
      if (word.length === 1 || (word.length === 2 && word.endsWith('.'))) {
        return word.toUpperCase();
      }
      // Normal capitalization
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Parse display name into firstName and lastName
 */
function parseFullName(displayName: string): {
  firstName: string;
  lastName: string;
} {
  const cleanName = removeEmojis(displayName).trim();

  // Handle empty or single-character names
  if (!cleanName || cleanName.length === 1) {
    return { firstName: cleanName || 'Unknown', lastName: '' };
  }

  // Split by whitespace
  const parts = cleanName.split(/\s+/).filter((p) => p.length > 0);

  if (parts.length === 0) {
    return { firstName: 'Unknown', lastName: '' };
  }

  if (parts.length === 1) {
    return {
      firstName: capitalizeProper(parts[0]),
      lastName: '',
    };
  }

  // Multiple parts: first = firstName, rest = lastName
  const firstName = capitalizeProper(parts[0]);
  const lastName = parts.slice(1).map(capitalizeProper).join(' ');

  return { firstName, lastName };
}

/**
 * Normalize country code (handle CO → Colombia, etc.)
 */
function normalizeCountry(countryCode: string | null): string {
  if (!countryCode || countryCode === '\\N') return '-';

  const mapping: Record<string, string> = {
    CO: 'Colombia',
    NL: 'Netherlands',
    US: 'United States',
    ES: 'España',
  };

  return mapping[countryCode] || countryCode;
}

/**
 * Infer country from phone number
 */
function inferCountryFromPhone(phone: string): string {
  if (phone.startsWith('+57')) return 'Colombia';
  if (phone.startsWith('+1')) return 'United States';
  if (phone.startsWith('+52')) return 'Mexico';
  if (phone.startsWith('+34')) return 'España';
  if (phone.startsWith('+54')) return 'Argentina';
  if (phone.startsWith('+593')) return 'Ecuador';
  if (phone.startsWith('+584')) return 'Venezuela';
  if (phone.startsWith('+31')) return 'Netherlands';
  if (phone.startsWith('+507')) return 'Panama';
  if (phone.startsWith('+504')) return 'Honduras';
  if (phone.startsWith('+509')) return 'Haiti';
  if (phone.startsWith('+56')) return 'Chile';
  if (phone.startsWith('+44')) return 'United Kingdom';
  return '-';
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Update Logic
// ─────────────────────────────────────────────────────────────────────────────

async function updateContactWithVerification(
  csvContact: CSVContact,
  dryRun: boolean
): Promise<UpdateReport> {
  const phone = csvContact.phone;
  const csvDisplayName = csvContact.displayName || 'Unknown';

  const report: UpdateReport = {
    phone: phone || 'N/A',
    csvDisplayName,
    status: 'failed',
    before: {},
    after: {},
    updatedFields: [],
  };

  try {
    // 1. Skip if no phone
    if (!phone || phone === '\\N') {
      report.status = 'skipped';
      report.error = 'No phone number in CSV';
      return report;
    }

    // 2. Search contact in Bird CRM
    console.log(`\n📋 Processing: ${csvDisplayName} (${phone})`);

    const birdContact = dryRun ? null : await searchContactByPhone(phone);

    if (!birdContact && !dryRun) {
      console.log('  ⚠️  Contact not found in Bird CRM');
      report.status = 'not_found';
      return report;
    }

    // 3. Populate BEFORE data
    if (birdContact) {
      report.before = {
        computedDisplayName: birdContact.computedDisplayName,
        displayNameAttr: birdContact.attributes?.displayName || '-',
        firstName: birdContact.attributes?.firstName || '-',
        lastName: birdContact.attributes?.lastName || '-',
        jose: birdContact.attributes?.jose || '-',
        country: birdContact.attributes?.country || '-',
        fase: birdContact.attributes?.fase || '-',
        initialSource: birdContact.attributes?.initialSource || '-',
      };
    }

    // 4. Parse clean name from CSV Display Name
    const cleanDisplayName = removeEmojis(csvDisplayName).trim();
    const { firstName, lastName } = parseFullName(csvDisplayName);
    const fullNameClean = lastName ? `${firstName} ${lastName}` : firstName;

    // 5. Determine country
    let country = normalizeCountry(csvContact.countryCode);
    if (country === '-' && phone) {
      country = inferCountryFromPhone(phone);
    }
    // Preserve existing country if we can't infer
    if (country === '-' && report.before.country && report.before.country !== '-') {
      country = report.before.country;
    }

    // 6. Prepare UPDATE PAYLOAD (DUAL-FIELD STRATEGY)
    const updatePayload: any = {
      firstName, // TOP-LEVEL (for computedDisplayName)
      lastName, // TOP-LEVEL (for computedDisplayName)
      attributes: {
        displayName: fullNameClean, // NEW: Direct displayName attribute
        firstName, // ATTRIBUTE storage
        lastName, // ATTRIBUTE storage
        jose: fullNameClean, // Custom full name
        country,
        fase: report.before.fase === '-' ? 'Contacto Inicial' : report.before.fase,
        initialSource:
          report.before.initialSource === '-' ||
          report.before.initialSource === 'connectors'
            ? 'whatsapp'
            : report.before.initialSource,
      },
    };

    const updatedFields: string[] = [
      'firstName',
      'lastName',
      'displayName',
      'jose',
    ];
    if (country !== '-') updatedFields.push('country');
    if (report.before.fase === '-') updatedFields.push('fase');
    if (
      report.before.initialSource === '-' ||
      report.before.initialSource === 'connectors'
    ) {
      updatedFields.push('initialSource');
    }

    // 7. Populate AFTER data
    report.after = {
      displayName: fullNameClean,
      firstName,
      lastName,
      jose: fullNameClean,
      country,
      fase: updatePayload.attributes.fase,
      initialSource: updatePayload.attributes.initialSource,
    };
    report.updatedFields = updatedFields;

    // 8. Display BEFORE/AFTER
    console.log('  📊 BEFORE (CRM):');
    console.log(`     computedDisplayName: ${report.before.computedDisplayName || '-'}`);
    console.log(`     displayName (attr):  ${report.before.displayNameAttr || '-'}`);
    console.log(`     firstName:           ${report.before.firstName || '-'}`);
    console.log(`     lastName:            ${report.before.lastName || '-'}`);
    console.log(`     jose:                ${report.before.jose || '-'}`);
    console.log(`     country:             ${report.before.country || '-'}`);
    console.log('');
    console.log('  📊 AFTER (Clean):');
    console.log(`     displayName:  ${report.after.displayName} ← CLEAN (NEW)`);
    console.log(`     firstName:    ${report.after.firstName}`);
    console.log(`     lastName:     ${report.after.lastName}`);
    console.log(`     jose:         ${report.after.jose} ← NO EMOJIS`);
    console.log(`     country:      ${report.after.country}`);
    console.log('');
    console.log(`  🔄 Updating fields: ${updatedFields.join(', ')}`);
    console.log('');

    // 9. Update in Bird CRM
    if (dryRun) {
      console.log('  [DRY-RUN] Would update with payload:');
      console.log(`  ${JSON.stringify(updatePayload, null, 2)}`);
      console.log('  ✅ [DRY-RUN] Would update successfully\n');
      report.status = 'success';
      report.verified = false;
      return report;
    }

    // Production update
    const contactId = birdContact!.id;
    await updateContact(contactId, updatePayload);
    console.log('  ✅ Updated successfully');

    // 10. VERIFICATION: GET contact and check if displayName updated
    console.log('  🔍 Verifying update...');
    await sleep(500); // Small delay for Bird to process

    const updatedContact = await fetchContactById(contactId);
    const displayNameUpdated =
      updatedContact.computedDisplayName === fullNameClean ||
      updatedContact.attributes?.displayName === fullNameClean;

    if (displayNameUpdated) {
      console.log(
        `  ✅ VERIFIED: Display Name = "${updatedContact.computedDisplayName}"`
      );
      report.verified = true;
    } else {
      console.log(
        `  ⚠️  VERIFICATION WARNING: Display Name may not have updated`
      );
      console.log(
        `     API returned computedDisplayName: "${updatedContact.computedDisplayName}"`
      );
      console.log(
        `     API returned displayName attr:    "${updatedContact.attributes?.displayName || 'N/A'}"`
      );
      console.log(`     Expected: "${fullNameClean}"`);
      report.verified = false;
      report.verificationNote =
        'Display Name in API response does not match expected value';
    }

    console.log('');

    report.status = 'success';
    return report;
  } catch (error) {
    console.log(`  ❌ Failed: ${error}\n`);
    report.status = 'failed';
    report.error = error instanceof Error ? error.message : String(error);
    return report;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Function
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  // Parse CSV path argument
  const csvIndex = args.indexOf('--csv');
  if (csvIndex === -1 || !args[csvIndex + 1]) {
    console.error('❌ Error: Missing --csv parameter');
    console.log('\nUsage:');
    console.log(
      '  npx tsx scripts/update-contacts-from-csv.ts --csv "path/to/contacts.csv" --dry-run'
    );
    console.log(
      '  npx tsx scripts/update-contacts-from-csv.ts --csv "path/to/contacts.csv"'
    );
    process.exit(1);
  }

  const csvPath = args[csvIndex + 1];

  console.log('🎯 Update Bird CRM Contacts from CSV\n');
  console.log(
    `Mode: ${dryRun ? '🔒 DRY-RUN (no changes)' : '⚠️  PRODUCTION (will update CRM)'}`
  );
  console.log(`CSV File: ${csvPath}\n`);

  // Check if CSV file exists
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ Error: CSV file not found: ${csvPath}`);
    process.exit(1);
  }

  if (!dryRun) {
    console.log('⚠️  WARNING: Production mode will UPDATE Bird CRM contacts!');
    console.log('   Press Ctrl+C within 5 seconds to cancel...\n');
    await sleep(5000);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Parse CSV
  console.log('📂 Parsing CSV file...\n');

  const contacts = parseCSVFile<CSVContact>(csvPath, {
    'Display name': 'displayName',
    'First name': 'firstName',
    'Last name': 'lastName',
    Phone: 'phone',
    Email: 'email',
    'Country Code': 'countryCode',
    'Updated At': 'updatedAt',
    'Created At': 'createdAt',
  });

  console.log(`✅ Parsed ${contacts.length} contacts from CSV\n`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const reports: UpdateReport[] = [];
  let processed = 0;

  for (const contact of contacts) {
    processed++;
    const report = await updateContactWithVerification(contact, dryRun);
    reports.push(report);

    // Rate limiting
    if (!dryRun && processed < contacts.length) {
      await sleep(500);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Final Summary
  // ───────────────────────────────────────────────────────────────────────────

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Final Summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const successCount = reports.filter((r) => r.status === 'success').length;
  const failedCount = reports.filter((r) => r.status === 'failed').length;
  const notFoundCount = reports.filter((r) => r.status === 'not_found').length;
  const skippedCount = reports.filter((r) => r.status === 'skipped').length;
  const verifiedCount = reports.filter((r) => r.verified === true).length;
  const unverifiedCount = reports.filter(
    (r) => r.status === 'success' && r.verified === false
  ).length;

  console.log(`Total Contacts:       ${contacts.length}`);
  console.log(`✅ Success:           ${successCount}`);
  console.log(`❌ Failed:            ${failedCount}`);
  console.log(`⚠️  Not Found:        ${notFoundCount}`);
  console.log(`⏭️  Skipped (no phone): ${skippedCount}`);

  if (!dryRun) {
    console.log(`\n🔍 Verification:`);
    console.log(`   ✅ Verified updates:   ${verifiedCount}`);
    console.log(`   ⚠️  Unverified updates: ${unverifiedCount}`);
  }

  console.log('');

  if (successCount > 0) {
    console.log('Successfully Updated:');
    reports
      .filter((r) => r.status === 'success')
      .slice(0, 10) // Show first 10
      .forEach((r) => {
        const verifyMark = r.verified ? '✅' : '⚠️';
        console.log(
          `  ${verifyMark} ${r.phone} (${r.csvDisplayName}) → ${r.after.displayName}`
        );
      });
    if (successCount > 10) {
      console.log(`  ... and ${successCount - 10} more`);
    }
    console.log('');
  }

  if (failedCount > 0) {
    console.log('Failed Contacts:');
    reports
      .filter((r) => r.status === 'failed')
      .forEach((r) => {
        console.log(`  ❌ ${r.phone} (${r.csvDisplayName}): ${r.error}`);
      });
    console.log('');
  }

  if (notFoundCount > 0) {
    console.log('Not Found in CRM:');
    reports
      .filter((r) => r.status === 'not_found')
      .slice(0, 10)
      .forEach((r) => {
        console.log(`  ⚠️  ${r.phone} (${r.csvDisplayName})`);
      });
    if (notFoundCount > 10) {
      console.log(`  ... and ${notFoundCount - 10} more`);
    }
    console.log('');
  }

  // Generate JSON report
  const reportData = {
    timestamp: new Date().toISOString(),
    mode: dryRun ? 'dry-run' : 'production',
    source: 'update-contacts-from-csv',
    csvFile: csvPath,
    totalContacts: contacts.length,
    successCount,
    failedCount,
    notFoundCount,
    skippedCount,
    verifiedCount: dryRun ? null : verifiedCount,
    unverifiedCount: dryRun ? null : unverifiedCount,
    contacts: reports,
  };

  const timestamp = Date.now();
  const reportPath = `feature/user-update-data/results/csv-update-${timestamp}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2), 'utf-8');
  console.log(`📝 Detailed report: ${reportPath}\n`);

  if (dryRun) {
    console.log('🔒 DRY-RUN completed. No changes were made to Bird CRM.\n');
    console.log('💡 To run in production mode:');
    console.log(`   npx tsx scripts/update-contacts-from-csv.ts --csv "${csvPath}"`);
  } else {
    console.log('✅ Production update completed!\n');

    if (unverifiedCount > 0) {
      console.log('⚠️  IMPORTANT: Some updates could not be verified');
      console.log('   Please check Bird CRM UI manually:');
      console.log('   1. Hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)');
      console.log('   2. Check Display Name column for sample contacts');
      console.log('   3. If names still wrong, contact Bird support\n');
    } else {
      console.log('💡 Verify results in Bird CRM UI:');
      console.log('   Hard refresh and check Display Name column');
      console.log('   All names should be clean without emojis');
    }
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
