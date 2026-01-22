import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function applyMigration() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not found in environment variables');
  }

  const sql = neon(process.env.DATABASE_URL);

  // Read the migration file
  const migrationPath = path.join(__dirname, '../drizzle/0001_glorious_maginty.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  console.log('Applying migration to Neon database...');
  console.log('Migration content:');
  console.log(migrationSQL);
  console.log('\n---\n');

  try {
    // Execute the migration SQL
    // Split by semicolon to execute each statement separately
    const statements = migrationSQL
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      await sql(statement);
      console.log('✓ Success');
    }

    console.log('\n✅ Migration applied successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

applyMigration();
