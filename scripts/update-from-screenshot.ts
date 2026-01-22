import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

import * as fs from 'fs';
import { searchContactByPhone, updateContact } from '@/lib/bird/contacts';
import { parseFullName } from '@/lib/utils/data-extraction';

interface ManualContactData {
  phone: string;
  screenshotName: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  country?: string;
  fase?: string;
  initialSource?: string;
  notes?: string;
}

// Manual data from screenshot + inferred data
const MANUAL_DATA: ManualContactData[] = [
  {
    phone: '+12029047178',
    screenshotName: 'JASMINE',
    firstName: 'Jasmine',
    lastName: '', // Unknown
    country: 'United States', // Inferred from +1
    fase: 'Contacto Inicial', // Default
    initialSource: 'whatsapp', // WhatsApp contact
    notes: 'Updated 12/20/2025 04:54 | Country inferred from phone code',
  },
  {
    phone: '+573208389730',
    screenshotName: '😱 (emoji)',
    firstName: '', // UNKNOWN - needs investigation
    lastName: '',
    country: 'Colombia', // Inferred from +57
    fase: 'Contacto Inicial', // Default
    initialSource: 'whatsapp', // WhatsApp contact
    notes: 'CRITICAL: Emoji as name, needs real name | SKIPPED - no valid name data',
  },
  {
    phone: '+15713069613',
    screenshotName: 'Monica Borden',
    firstName: 'Monica',
    lastName: 'Borden',
    country: 'United States', // Inferred from +1
    fase: 'Contacto Inicial', // Default
    initialSource: 'whatsapp', // WhatsApp contact
  },
  {
    phone: '+573214819502',
    screenshotName: 'RUTHJ',
    firstName: 'Ruth',
    lastName: 'J', // Abbreviated last name
    country: 'Colombia', // Inferred from +57
    fase: 'Contacto Inicial', // Default
    initialSource: 'whatsapp', // WhatsApp contact
    notes: 'Abbreviated last name',
  },
  {
    phone: '+573006592633',
    screenshotName: 'Luz Ángela Restrepo',
    firstName: 'Luz Ángela',
    lastName: 'Restrepo',
    country: 'Colombia', // Inferred from +57
    fase: 'Contacto Inicial', // Default
    initialSource: 'whatsapp', // WhatsApp contact
    notes: 'Email will be added via extract-emails-from-conversations.ts',
  },
  {
    phone: '+573004421028',
    screenshotName: 'rosariofernandez rf21',
    firstName: 'Rosario',
    lastName: 'Fernandez',
    country: 'Colombia', // Inferred from +57
    fase: 'Contacto Inicial', // Default
    initialSource: 'whatsapp', // WhatsApp contact
    notes: 'Cleaned from "rosariofernandez rf21"',
  },
  {
    phone: '+573024611392',
    screenshotName: 'luzmemao ✨',
    firstName: 'Luz',
    lastName: 'Memao',
    country: 'Colombia', // Inferred from +57
    fase: 'Contacto Inicial', // Default
    initialSource: 'whatsapp', // WhatsApp contact
    notes: 'Cleaned emoji',
  },
  {
    phone: '+17073469640',
    screenshotName: 'lizeth',
    firstName: 'Lizeth',
    lastName: '',
    country: 'United States', // Inferred from +1
    fase: 'Contacto Inicial', // Default
    initialSource: 'whatsapp', // WhatsApp contact
  },
  {
    phone: '+573212439688',
    screenshotName: 'Jessi Sanchez 💕',
    firstName: 'Jessi',
    lastName: 'Sanchez',
    country: 'Colombia', // Inferred from +57
    fase: 'Contacto Inicial', // Default
    initialSource: 'whatsapp', // WhatsApp contact
    notes: 'Cleaned emoji',
  },
  {
    phone: '+573106098955',
    screenshotName: 'Val F 🌸',
    firstName: 'Val',
    lastName: 'F',
    country: 'Colombia', // Inferred from +57
    fase: 'Contacto Inicial', // Default
    initialSource: 'whatsapp', // WhatsApp contact
    notes: 'Abbreviated last name, cleaned emoji',
  },
];

interface ContactReport {
  phone: string;
  screenshotName: string;
  status: 'success' | 'failed' | 'not_found' | 'skipped';
  before: {
    firstName?: string;
    lastName?: string;
    jose?: string;
    email?: string;
    country?: string;
    fase?: string;
    initialSource?: string;
  };
  after: {
    firstName?: string;
    lastName?: string;
    jose?: string;
    email?: string;
    country?: string;
    fase?: string;
    initialSource?: string;
  };
  updatedFields: string[];
  error?: string;
  notes?: string;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log('🎯 Update from Screenshot - Manual Data Entry\n');
  console.log(`Mode: ${dryRun ? '🔒 DRY-RUN (no changes)' : '⚠️  PRODUCTION (will update CRM)'}`);
  console.log(`Total contacts: ${MANUAL_DATA.length}\n`);

  if (!dryRun) {
    console.log('⚠️  WARNING: Production mode will UPDATE Bird CRM contacts!');
    console.log('   Press Ctrl+C within 5 seconds to cancel...\n');
    await sleep(5000);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const reports: ContactReport[] = [];
  let processed = 0;

  for (const manualData of MANUAL_DATA) {
    processed++;
    console.log(
      `📋 Contact ${processed}/${MANUAL_DATA.length}: ${manualData.screenshotName} (${manualData.phone})`
    );
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const report: ContactReport = {
      phone: manualData.phone,
      screenshotName: manualData.screenshotName,
      status: 'skipped',
      before: {},
      after: {},
      updatedFields: [],
      notes: manualData.notes,
    };

    try {
      // 1. Fetch current CRM data
      console.log('  Fetching current CRM data...');
      const birdContact = dryRun ? null : await searchContactByPhone(manualData.phone);

      if (!birdContact && !dryRun) {
        console.log(`⚠️  Contact not found in Bird CRM\n`);
        report.status = 'not_found';
        reports.push(report);
        continue;
      }

      // Populate BEFORE data
      if (birdContact) {
        report.before = {
          firstName: birdContact.attributes?.firstName || birdContact.firstName || '-',
          lastName: birdContact.attributes?.lastName || birdContact.lastName || '-',
          jose: birdContact.attributes?.jose || '-',
          email: birdContact.attributes?.email || '-',
          country: birdContact.attributes?.country || '-',
          fase: birdContact.attributes?.fase || '-',
          initialSource: birdContact.attributes?.initialSource || '-',
        };
      }

      // 2. Prepare update payload
      const updatePayload: any = {
        attributes: {},
      };

      const updatedFields: string[] = [];

      // firstName
      if (manualData.firstName && manualData.firstName.trim()) {
        updatePayload.firstName = manualData.firstName;
        updatedFields.push('firstName');
        report.after.firstName = manualData.firstName;
      }

      // lastName
      if (manualData.lastName && manualData.lastName.trim()) {
        updatePayload.lastName = manualData.lastName;
        updatedFields.push('lastName');
        report.after.lastName = manualData.lastName;
      }

      // Email: REMOVED - Email is an IDENTIFIER, not an attribute
      // Use scripts/extract-emails-from-conversations.ts to add email identifiers

      // Country
      if (manualData.country) {
        updatePayload.attributes.country = manualData.country;
        updatedFields.push('country');
        report.after.country = manualData.country;
      }

      // Fase (lead phase)
      if (manualData.fase) {
        updatePayload.attributes.fase = manualData.fase;
        updatedFields.push('fase');
        report.after.fase = manualData.fase;
      }

      // Initial Source (first contact channel)
      if (manualData.initialSource) {
        updatePayload.attributes.initialSource = manualData.initialSource;
        updatedFields.push('initialSource');
        report.after.initialSource = manualData.initialSource;
      }

      // 3. Display BEFORE/AFTER
      console.log('\n  BEFORE (CRM):');
      console.log(`    firstName:     ${report.before.firstName || '-'}`);
      console.log(`    lastName:      ${report.before.lastName || '-'}`);
      console.log(`    jose:          ${report.before.jose || '-'}`);
      console.log(`    email:         ${report.before.email || '-'}`);
      console.log(`    country:       ${report.before.country || '-'}`);
      console.log(`    fase:          ${report.before.fase || '-'}`);
      console.log(`    initialSource: ${report.before.initialSource || '-'}`);

      console.log('\n  AFTER (Manual Data):');
      console.log(`    firstName:     ${report.after.firstName || '-'}`);
      console.log(`    lastName:      ${report.after.lastName || '-'}`);
      console.log(`    jose:          ${report.after.jose || '-'}`);
      console.log(`    email:         ${report.after.email || '-'}`);
      console.log(`    country:       ${report.after.country || '-'}`);
      console.log(`    fase:          ${report.after.fase || '-'}`);
      console.log(`    initialSource: ${report.after.initialSource || '-'}`);

      if (manualData.notes) {
        console.log(`\n  📝 Notes: ${manualData.notes}`);
      }

      if (updatedFields.length === 0) {
        console.log('\n  ⏭️  No fields to update, skipping\n');
        report.status = 'skipped';
        reports.push(report);
        continue;
      }

      console.log(`\n  Updating fields: ${updatedFields.join(', ')}`);

      // 4. Update in Bird CRM
      if (dryRun) {
        console.log('\n  [DRY-RUN] Would update with payload:');
        console.log(`  ${JSON.stringify(updatePayload, null, 2)}`);
        console.log('\n  ✅ [DRY-RUN] Would update successfully\n');
      } else {
        const contactId = birdContact!.id;
        await updateContact(contactId, updatePayload);
        console.log('\n  ✅ Updated successfully\n');
      }

      report.status = 'success';
      report.updatedFields = updatedFields;
      reports.push(report);

      // Rate limiting
      if (!dryRun && processed < MANUAL_DATA.length) {
        await sleep(100);
      }
    } catch (error) {
      console.log(`\n  ❌ Failed: ${error}\n`);
      report.status = 'failed';
      report.error = error instanceof Error ? error.message : String(error);
      reports.push(report);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  // Final Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Final Summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const successCount = reports.filter((r) => r.status === 'success').length;
  const failedCount = reports.filter((r) => r.status === 'failed').length;
  const notFoundCount = reports.filter((r) => r.status === 'not_found').length;
  const skippedCount = reports.filter((r) => r.status === 'skipped').length;

  console.log(`Total Contacts:   ${MANUAL_DATA.length}`);
  console.log(`✅ Success:       ${successCount}`);
  console.log(`❌ Failed:        ${failedCount}`);
  console.log(`⚠️  Not Found:    ${notFoundCount}`);
  console.log(`⏭️  Skipped:      ${skippedCount}\n`);

  if (failedCount > 0) {
    console.log('Failed Contacts:');
    reports
      .filter((r) => r.status === 'failed')
      .forEach((r) => {
        console.log(`  - ${r.phone} (${r.screenshotName}): ${r.error}`);
      });
    console.log('');
  }

  if (skippedCount > 0) {
    console.log('Skipped Contacts (no data to update):');
    reports
      .filter((r) => r.status === 'skipped')
      .forEach((r) => {
        console.log(`  - ${r.phone} (${r.screenshotName})`);
      });
    console.log('');
  }

  // Generate JSON report
  const reportData = {
    timestamp: new Date().toISOString(),
    mode: dryRun ? 'dry-run' : 'production',
    source: 'manual-screenshot-data',
    totalProcessed: MANUAL_DATA.length,
    successCount,
    failedCount,
    notFoundCount,
    skippedCount,
    contacts: reports,
  };

  const reportPath = `feature/user-update-data/results/screenshot-update-results-${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2), 'utf-8');
  console.log(`📝 Detailed report: ${reportPath}\n`);

  if (dryRun) {
    console.log('🔒 DRY-RUN completed. No changes were made to Bird CRM.\n');
    console.log('💡 To run in production mode:');
    console.log('   npx tsx scripts/update-from-screenshot.ts');
  } else {
    console.log('✅ Production update completed!\n');
    console.log('💡 Verify results in Bird CRM UI');
  }
}

main();
