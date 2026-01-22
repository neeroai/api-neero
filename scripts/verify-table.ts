// Load environment variables FIRST
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';

async function verifyTable() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found');
    console.log(
      'Environment variables:',
      Object.keys(process.env).filter((k) => k.includes('DATA'))
    );
    process.exit(1);
  }

  console.log('✅ DATABASE_URL found');
  console.log('First 20 chars:', process.env.DATABASE_URL.substring(0, 20));

  const sql = neon(process.env.DATABASE_URL);

  try {
    // List all tables
    const allTables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log('\n📋 All tables in database:');
    for (const table of allTables) {
      console.log(`  - ${table.table_name}`);
    }

    // Check for medical_knowledge
    const result = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'medical_knowledge'
    `;

    if (result.length > 0) {
      console.log('\n✅ Table medical_knowledge EXISTS');

      // Check columns
      const columns = await sql`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'medical_knowledge'
        ORDER BY ordinal_position
      `;

      console.log('\nColumns:');
      for (const col of columns) {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      }
    } else {
      console.log('\n❌ Table medical_knowledge does NOT exist');
      console.log('\n💡 Attempting to create table now...');

      // Try creating it directly
      await sql`CREATE EXTENSION IF NOT EXISTS vector`;
      console.log('  ✓ pgvector extension enabled');

      await sql`
        CREATE TABLE medical_knowledge (
          knowledge_id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          content text NOT NULL,
          embedding vector(768),
          category varchar(50) NOT NULL,
          subcategory text,
          metadata jsonb,
          validated_by varchar(100) NOT NULL,
          validated_at timestamp NOT NULL,
          version integer DEFAULT 1 NOT NULL,
          active boolean DEFAULT true NOT NULL,
          created_at timestamp DEFAULT now() NOT NULL,
          updated_at timestamp DEFAULT now() NOT NULL
        )
      `;
      console.log('  ✓ Table created');

      await sql`
        CREATE INDEX medical_knowledge_embedding_idx
        ON medical_knowledge
        USING hnsw (embedding vector_cosine_ops)
      `;
      console.log('  ✓ HNSW index created');

      await sql`
        CREATE INDEX medical_knowledge_category_idx
        ON medical_knowledge (category, subcategory)
      `;
      console.log('  ✓ Category index created');

      console.log('\n✅ Table and indexes created successfully!');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verifyTable();
