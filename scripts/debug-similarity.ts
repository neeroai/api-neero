import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { generateEmbedding } from '@/lib/ai/embeddings';

const sql = neon(process.env.DATABASE_URL!);

const queries = [
  'opciones de financiamiento y pago en cuotas',
  'qué incluye la consulta inicial',
  'cuánto cuesta una lipo',
];

async function checkSimilarity() {
  for (const query of queries) {
    console.log(`\nQuery: '${query}'`);
    const embedding = await generateEmbedding(query);
    const results = await sql`
      SELECT category, subcategory,
             1 - (embedding <=> ${JSON.stringify(embedding)}::vector) as similarity
      FROM medical_knowledge
      WHERE active = true
      ORDER BY embedding <=> ${JSON.stringify(embedding)}::vector
      LIMIT 5
    `;
    results.forEach((r, i) => {
      console.log(
        `  ${i + 1}. ${r.category}>${r.subcategory}: ${parseFloat(r.similarity as string).toFixed(3)}`
      );
    });
  }
}

checkSimilarity();
