import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { join } from 'path';

// Load .env.local
config({ path: join(process.cwd(), '.env.local') });

async function verifySchema() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  console.log('🔍 Verifying database schema...\n');

  // Check message_logs table structure
  const columns = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'message_logs'
    ORDER BY ordinal_position
  `;

  console.log('📊 message_logs table structure:');
  console.log('─'.repeat(70));

  columns.forEach((col: { column_name: string; data_type: string; is_nullable: string }) => {
    const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
    const highlight = col.column_name === 'metadata' ? '✨ ' : '   ';
    console.log(`${highlight}${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${nullable}`);
  });

  console.log('─'.repeat(70));

  // Check if metadata column exists
  const hasMetadata = columns.some((col: { column_name: string }) => col.column_name === 'metadata');

  if (hasMetadata) {
    console.log('\n✅ metadata column found in message_logs table');
  } else {
    console.log('\n❌ metadata column NOT found in message_logs table');
    process.exit(1);
  }

  // Test insert with metadata
  console.log('\n🧪 Testing metadata insertion...');

  try {
    const result = await sql`
      INSERT INTO message_logs (
        conversation_id,
        direction,
        text,
        metadata
      ) VALUES (
        gen_random_uuid(),
        'outgoing',
        'Test message with metadata',
        ${JSON.stringify({
          urgency: 'routine',
          reason_code: null,
          risk_flags: [],
          handover: false
        })}
      )
      RETURNING message_id, conversation_id, metadata
    `;

    console.log('✅ Test insert successful');

    const testMessageId = result[0].message_id;

    console.log('\n📝 Inserted metadata:');
    console.log(JSON.stringify(result[0].metadata, null, 2));

    // Cleanup test data
    await sql`
      DELETE FROM message_logs
      WHERE message_id = ${testMessageId}
    `;

    console.log('\n✅ Schema verification complete!');
  } catch (error) {
    console.error('\n❌ Test insert failed:', error);
    process.exit(1);
  }
}

verifySchema();
