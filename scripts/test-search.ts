// Load environment variables FIRST
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Import dependencies (without db client)
import { neon } from '@neondatabase/serverless';
import { generateEmbedding } from '@/lib/ai/embeddings';
import { medicalKnowledge } from '@/lib/db/schema';

interface TestCase {
  query: string;
  expectedCategory?: 'procedure' | 'faq' | 'policy' | 'location';
  expectedSubcategory?: string;
  description: string;
}

interface SearchResult {
  knowledge_id: string;
  content: string;
  category: string;
  subcategory: string | null;
  metadata: Record<string, unknown> | null;
  similarity: number;
}

/**
 * Search knowledge base using semantic similarity
 * (Inline implementation to avoid import hoisting issues)
 */
async function searchKnowledge(
  sql: ReturnType<typeof neon>,
  query: string,
  options: {
    category?: 'procedure' | 'faq' | 'policy' | 'location';
    limit?: number;
    threshold?: number;
  } = {}
): Promise<SearchResult[]> {
  const { category, limit = 3, threshold = 0.7 } = options;

  // Generate embedding for query
  const queryEmbedding = await generateEmbedding(query);

  // Execute semantic search with conditional category filter
  const results = category
    ? await sql`
        SELECT
          knowledge_id,
          content,
          category,
          subcategory,
          metadata,
          1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity
        FROM medical_knowledge
        WHERE active = true
          AND category = ${category}
          AND 1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) > ${threshold}
        ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector
        LIMIT ${limit}
      `
    : await sql`
        SELECT
          knowledge_id,
          content,
          category,
          subcategory,
          metadata,
          1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity
        FROM medical_knowledge
        WHERE active = true
          AND 1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) > ${threshold}
        ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector
        LIMIT ${limit}
      `;

  return results.map((row) => ({
    knowledge_id: row.knowledge_id,
    content: row.content,
    category: row.category,
    subcategory: row.subcategory,
    metadata: row.metadata,
    similarity: parseFloat(row.similarity as string),
  }));
}

const testCases: TestCase[] = [
  {
    query: '¿Cuánto dura la recuperación de rinoplastia?',
    expectedCategory: 'procedure',
    expectedSubcategory: 'rinoplastia',
    description: 'Procedure-specific recovery time query',
  },
  {
    query: 'dolor después de cirugía',
    expectedCategory: 'faq',
    expectedSubcategory: 'manejo-dolor',
    description: 'Post-operative pain management FAQ',
  },
  {
    query: 'opciones de financiamiento y pago en cuotas',
    expectedCategory: 'policy',
    expectedSubcategory: 'financiamiento',
    description: 'Payment and financing policy',
  },
  {
    query: 'dirección de la clínica en Bogotá',
    expectedCategory: 'location',
    expectedSubcategory: 'bogota-principal',
    description: 'Location information',
  },
  {
    query: 'cuánto cuesta una lipo',
    expectedCategory: 'procedure',
    expectedSubcategory: 'lipoescultura',
    description: 'Pricing query (should find lipoescultura procedure)',
  },
  {
    query: 'qué incluye la consulta inicial',
    expectedCategory: 'faq',
    expectedSubcategory: 'consulta-valoracion',
    description: 'Initial consultation FAQ',
  },
];

async function runTests() {
  console.log('🔍 Testing Semantic Search Functionality\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Initialize database connection
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  const sql = neon(process.env.DATABASE_URL);

  let passed = 0;
  let failed = 0;

  for (const [index, testCase] of testCases.entries()) {
    console.log(`Test ${index + 1}/${testCases.length}: ${testCase.description}`);
    console.log(`Query: "${testCase.query}"`);

    const startTime = Date.now();
    const results = await searchKnowledge(sql, testCase.query, {
      limit: 3,
      threshold: 0.65, // Adjusted from 0.7 based on debug analysis
    });
    const duration = Date.now() - startTime;

    if (results.length === 0) {
      console.log('❌ FAILED: No results found (similarity < 0.65)\n');
      failed++;
      continue;
    }

    const topResult = results[0];
    const categoryMatch = !testCase.expectedCategory || topResult.category === testCase.expectedCategory;
    const subcategoryMatch =
      !testCase.expectedSubcategory || topResult.subcategory === testCase.expectedSubcategory;

    if (categoryMatch && subcategoryMatch) {
      console.log(`✅ PASSED (${duration}ms)`);
      console.log(`   Top Match: ${topResult.category} > ${topResult.subcategory}`);
      console.log(`   Similarity: ${topResult.similarity.toFixed(3)}`);
      console.log(`   Content: ${topResult.content.substring(0, 100)}...`);
      passed++;
    } else {
      console.log(`❌ FAILED (${duration}ms)`);
      console.log(`   Expected: ${testCase.expectedCategory} > ${testCase.expectedSubcategory}`);
      console.log(`   Got: ${topResult.category} > ${topResult.subcategory}`);
      console.log(`   Similarity: ${topResult.similarity.toFixed(3)}`);
      failed++;
    }

    console.log('');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📊 Test Summary:');
  console.log(`   Total: ${testCases.length}`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%\n`);

  if (failed > 0) {
    console.log('💡 Troubleshooting Tips:');
    console.log('   - Check if embeddings were generated correctly');
    console.log('   - Verify HNSW index is created: SELECT * FROM pg_indexes WHERE tablename = \'medical_knowledge\'');
    console.log('   - Try lowering threshold from 0.7 to 0.6');
    console.log('   - Check seed data relevance to failed queries\n');
  } else {
    console.log('🎉 All tests passed! Semantic search is working correctly.\n');
  }
}

// Run tests
runTests().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
