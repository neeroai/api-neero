// Load environment variables FIRST (before any imports that use them)
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Now import modules
import * as fs from 'fs';
import * as path from 'path';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { medicalKnowledge } from '@/lib/db/schema';
import { generateEmbedding } from '@/lib/ai/embeddings';

interface KnowledgeDocument {
  content: string;
  category: 'procedure' | 'faq' | 'policy' | 'location';
  subcategory: string;
  metadata: Record<string, unknown>;
  validatedBy: string;
  validatedAt: string;
}

interface KnowledgeBase {
  procedures: KnowledgeDocument[];
  faqs: KnowledgeDocument[];
  policies: KnowledgeDocument[];
  locations: KnowledgeDocument[];
}

async function seedKnowledgeBase() {
  console.log('🌱 Starting knowledge base seed...\n');

  try {
    // 1. Read the knowledge base JSON file
    const dataPath = path.join(__dirname, '../data/knowledge-base.json');
    console.log(`📖 Reading knowledge base from: ${dataPath}`);

    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const knowledgeBase: KnowledgeBase = JSON.parse(rawData);

    // 2. Flatten all documents into a single array
    const allDocuments: Array<{
      content: string;
      category: 'procedure' | 'faq' | 'policy' | 'location';
      subcategory: string;
      metadata: Record<string, unknown>;
      validatedBy: string;
      validatedAt: Date;
    }> = [];

    for (const doc of knowledgeBase.procedures) {
      allDocuments.push({
        ...doc,
        validatedAt: new Date(doc.validatedAt),
      });
    }

    for (const doc of knowledgeBase.faqs) {
      allDocuments.push({
        ...doc,
        validatedAt: new Date(doc.validatedAt),
      });
    }

    for (const doc of knowledgeBase.policies) {
      allDocuments.push({
        ...doc,
        validatedAt: new Date(doc.validatedAt),
      });
    }

    for (const doc of knowledgeBase.locations) {
      allDocuments.push({
        ...doc,
        validatedAt: new Date(doc.validatedAt),
      });
    }

    console.log(`\n📊 Total documents to seed: ${allDocuments.length}`);
    console.log(`   - Procedures: ${knowledgeBase.procedures.length}`);
    console.log(`   - FAQs: ${knowledgeBase.faqs.length}`);
    console.log(`   - Policies: ${knowledgeBase.policies.length}`);
    console.log(`   - Locations: ${knowledgeBase.locations.length}\n`);

    // 3. Initialize database connection
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const sql = neon(process.env.DATABASE_URL);
    const db = drizzle(sql as any, { schema: { medicalKnowledge } });

    // 4. Insert documents with embeddings
    console.log('⚙️  Generating embeddings and inserting documents...');
    console.log('   (This may take a few minutes: ~200ms per document)\n');

    const startTime = Date.now();
    const results: any[] = [];

    for (let i = 0; i < allDocuments.length; i++) {
      const doc = allDocuments[i];
      console.log(`   [${i + 1}/${allDocuments.length}] Generating embedding for: ${doc.subcategory}...`);

      // Generate embedding
      const embedding = await generateEmbedding(doc.content);

      // Insert with embedding
      const [result] = await db
        .insert(medicalKnowledge)
        .values({
          ...doc,
          embedding
        })
        .returning();

      results.push(result);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n✅ Successfully seeded ${results.length} documents in ${duration}s`);
    console.log(`   Average: ${(parseFloat(duration) / results.length).toFixed(2)}s per document\n`);

    // 4. Print summary
    console.log('📝 Seeded Documents Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const byCategory = results.reduce(
      (acc, doc) => {
        acc[doc.category] = (acc[doc.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    for (const [category, count] of Object.entries(byCategory)) {
      console.log(`   ${category.padEnd(15)}: ${count} documents`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 5. Show sample document
    console.log('📄 Sample Document (first procedure):');
    const sample = results.find((r) => r.category === 'procedure');
    if (sample) {
      console.log(`   ID: ${sample.knowledgeId}`);
      console.log(`   Category: ${sample.category}`);
      console.log(`   Subcategory: ${sample.subcategory}`);
      console.log(`   Content: ${sample.content.substring(0, 100)}...`);
      console.log(`   Validated By: ${sample.validatedBy}`);
      console.log(`   Has Embedding: ${sample.embedding ? 'Yes (768 dims)' : 'No'}\n`);
    }

    console.log('🎉 Knowledge base seeded successfully!');
    console.log('💡 You can now test semantic search with:');
    console.log('   npx tsx scripts/test-search.ts "¿Cuánto dura la recuperación de rinoplastia?"\n');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

// Run seed
seedKnowledgeBase();
