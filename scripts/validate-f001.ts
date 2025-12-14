/**
 * F001 Validation Script: Data Collection (1 Message)
 *
 * Validates:
 * 1. Database connection (Neon PostgreSQL)
 * 2. Schema exists (leads table)
 * 3. upsertLead tool execution (insert + update)
 * 4. Data validation (Zod schema)
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local FIRST
config({ path: resolve(process.cwd(), '.env.local') });

const TEST_CONVERSATION_ID = '00000000-0000-0000-0000-000000000001';

async function validateF001() {
  // Dynamic imports after dotenv config
  const { db, sql } = await import('@/lib/db/client');
  const { leads } = await import('@/lib/db/schema');
  const { eq } = await import('drizzle-orm');
  const { upsertLeadTool } = await import('@/lib/agent/tools/crm');

  console.log('🔍 F001 Validation: Data Collection (1 Message)\n');

  // Test 1: Database Connection
  console.log('Test 1: Database Connection');
  try {
    const result = await sql`SELECT 1 as test`;
    console.log('✓ Database connection successful');
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    process.exit(1);
  }

  // Test 2: Schema Exists (leads table)
  console.log('\nTest 2: Schema Validation (leads table)');
  try {
    const testQuery = await db.select().from(leads).limit(1);
    console.log('✓ Leads table exists and is accessible');
    console.log(`  Current leads count: ${testQuery.length}`);
  } catch (error) {
    console.error('✗ Leads table not found or inaccessible:', error);
    process.exit(1);
  }

  // Test 3: Clean Test Data (if exists)
  console.log('\nTest 3: Clean Previous Test Data');
  try {
    await db.delete(leads).where(eq(leads.conversationId, TEST_CONVERSATION_ID));
    console.log('✓ Test data cleaned');
  } catch (error) {
    console.log('⚠ No previous test data to clean');
  }

  // Test 4: Insert New Lead (via upsertLead tool)
  console.log('\nTest 4: Insert New Lead (upsertLeadTool)');
  try {
    const insertResult = await upsertLeadTool.execute({
      conversationId: TEST_CONVERSATION_ID,
      name: 'Test Patient',
      phone: '+573001234567',
      email: 'test@example.com',
      country: 'Colombia',
      city: 'Bogotá',
      procedureInterest: 'Rinoplastia',
      stage: 'new',
      metadata: { source: 'validation-script' }
    });

    if (insertResult.success && insertResult.leadId) {
      console.log('✓ Lead inserted successfully');
      console.log(`  Lead ID: ${insertResult.leadId}`);
      console.log(`  Stage: ${insertResult.stage}`);
      console.log(`  Is New: ${insertResult.isNew}`);
    } else {
      throw new Error('Insert failed: ' + JSON.stringify(insertResult));
    }
  } catch (error) {
    console.error('✗ Lead insertion failed:', error);
    process.exit(1);
  }

  // Test 5: Update Existing Lead (via upsertLead tool)
  console.log('\nTest 5: Update Existing Lead (upsertLeadTool)');
  try {
    const updateResult = await upsertLeadTool.execute({
      conversationId: TEST_CONVERSATION_ID,
      name: 'Test Patient Updated',
      phone: '+573001234567',
      email: 'test.updated@example.com',
      country: 'Colombia',
      city: 'Medellín',
      procedureInterest: 'Liposucción',
      stage: 'qualified',
      metadata: { source: 'validation-script', updated: true }
    });

    if (updateResult.success && updateResult.leadId) {
      console.log('✓ Lead updated successfully');
      console.log(`  Lead ID: ${updateResult.leadId}`);
      console.log(`  Stage: ${updateResult.stage}`);
      console.log(`  Is New: ${updateResult.isNew}`);
      console.log(`  Message: ${updateResult.message}`);
    } else {
      throw new Error('Update failed: ' + JSON.stringify(updateResult));
    }
  } catch (error) {
    console.error('✗ Lead update failed:', error);
    process.exit(1);
  }

  // Test 6: Verify Final State
  console.log('\nTest 6: Verify Final State');
  try {
    const finalLead = await db.select().from(leads)
      .where(eq(leads.conversationId, TEST_CONVERSATION_ID))
      .limit(1);

    if (finalLead.length > 0 && finalLead[0]) {
      const lead = finalLead[0];
      console.log('✓ Lead verification successful');
      console.log(`  Name: ${lead.name} (expected: "Test Patient Updated")`);
      console.log(`  City: ${lead.city} (expected: "Medellín")`);
      console.log(`  Procedure: ${lead.procedureInterest} (expected: "Liposucción")`);
      console.log(`  Stage: ${lead.stage} (expected: "qualified")`);

      // Validate data integrity
      if (lead.name !== 'Test Patient Updated' ||
          lead.city !== 'Medellín' ||
          lead.procedureInterest !== 'Liposucción' ||
          lead.stage !== 'qualified') {
        throw new Error('Data integrity check failed: values do not match expected');
      }
    } else {
      throw new Error('Lead not found after update');
    }
  } catch (error) {
    console.error('✗ Verification failed:', error);
    process.exit(1);
  }

  // Test 7: Cleanup
  console.log('\nTest 7: Cleanup Test Data');
  try {
    await db.delete(leads).where(eq(leads.conversationId, TEST_CONVERSATION_ID));
    console.log('✓ Test data cleaned up');
  } catch (error) {
    console.error('⚠ Cleanup failed (non-critical):', error);
  }

  console.log('\n✅ F001 Validation: ALL TESTS PASSED\n');
  console.log('Summary:');
  console.log('  ✓ Database connection working');
  console.log('  ✓ Leads table schema deployed');
  console.log('  ✓ upsertLeadTool insert working');
  console.log('  ✓ upsertLeadTool update working');
  console.log('  ✓ Data integrity validated');
}

validateF001().catch((error) => {
  console.error('\n❌ F001 Validation FAILED:', error);
  process.exit(1);
});
