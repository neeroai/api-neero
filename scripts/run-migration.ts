import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Run Drizzle migration directly using Neon HTTP client
 * Loads .env.local explicitly using dotenv
 */

// Load .env.local
config({ path: join(process.cwd(), '.env.local') });

async function runMigration() {
  console.log('🔍 Checking DATABASE_URL...');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  // Mask the connection string for logging
  const maskedUrl = databaseUrl.replace(
    /postgresql:\/\/([^:]+):([^@]+)@(.*)/,
    'postgresql://$1:***@$3'
  );
  console.log(`✅ DATABASE_URL configured: ${maskedUrl}`);

  console.log('\n📄 Reading migration file...');
  const migrationPath = join(process.cwd(), 'drizzle', '0000_empty_outlaw_kid.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');

  console.log(`✅ Migration file loaded (${migrationSQL.split('\n').length} lines)`);

  console.log('\n🚀 Executing migration...');
  const sql = neon(databaseUrl);

  try {
    // Split SQL into individual statements (by --> statement-breakpoint)
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip empty or comment-only statements
      if (!statement || statement.startsWith('--')) {
        continue;
      }

      console.log(`  [${i + 1}/${statements.length}] Executing statement...`);

      try {
        await sql(statement);
        console.log(`  ✅ Statement ${i + 1} completed`);
      } catch (error) {
        // Some statements might fail if tables already exist - that's okay
        if (error instanceof Error && error.message.includes('already exists')) {
          console.log(`  ⚠️  Statement ${i + 1} skipped (already exists)`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n✅ Migration executed successfully!');

    console.log('\n🔍 Verifying tables...');
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log('\n📊 Tables created:');
    tables.forEach((table: { table_name: string }) => {
      console.log(`  ✓ ${table.table_name}`);
    });

    console.log('\n✅ Database setup complete!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
