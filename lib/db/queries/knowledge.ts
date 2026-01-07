import { eq } from 'drizzle-orm';
import { generateEmbedding } from '@/lib/ai/embeddings';
import { db, sql } from '@/lib/db/client';
import { type MedicalKnowledge, medicalKnowledge, type NewMedicalKnowledge } from '@/lib/db/schema';

/**
 * Result type for knowledge search with similarity score
 */
export interface KnowledgeSearchResult {
  knowledgeId: string;
  content: string;
  category: string;
  subcategory: string | null;
  metadata: Record<string, unknown> | null;
  similarity: number;
}

/**
 * Search medical knowledge using semantic vector similarity
 *
 * **Performance:** ~201.5ms total (200ms embedding + 1.5ms HNSW search)
 * **Index:** HNSW with vector_cosine_ops (AWS benchmark: 1.5ms @ 58K records)
 * **Threshold:** 0.7 recommended (balance between precision and recall)
 *
 * @param query - User's natural language question
 * @param options - Search filters and limits
 * @returns Array of knowledge documents sorted by similarity (highest first)
 *
 * @example
 * const results = await searchKnowledge("¿Cuánto dura la recuperación de rinoplastia?", {
 *   category: "procedure",
 *   limit: 3,
 *   threshold: 0.7
 * });
 * // Returns: [{content: "La recuperación...", similarity: 0.92}, ...]
 */
export async function searchKnowledge(
  query: string,
  options: {
    category?: 'procedure' | 'faq' | 'policy' | 'location';
    limit?: number;
    threshold?: number;
  } = {}
): Promise<KnowledgeSearchResult[]> {
  const { category, limit = 3, threshold = 0.7 } = options;

  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query);
  const embeddingVector = JSON.stringify(queryEmbedding);

  // Execute semantic search using pgvector cosine similarity
  // <=> operator: cosine distance (0 = identical, 2 = opposite)
  // similarity = 1 - distance (1 = identical, -1 = opposite)
  // Use conditional query to avoid sql.unsafe (not available in Neon client)
  let results;
  if (category) {
    results = await sql`
      SELECT
        knowledge_id,
        content,
        category,
        subcategory,
        metadata,
        1 - (embedding <=> ${embeddingVector}::vector) as similarity
      FROM medical_knowledge
      WHERE active = true
        AND category = ${category}
        AND 1 - (embedding <=> ${embeddingVector}::vector) > ${threshold}
      ORDER BY embedding <=> ${embeddingVector}::vector
      LIMIT ${limit}
    `;
  } else {
    results = await sql`
      SELECT
        knowledge_id,
        content,
        category,
        subcategory,
        metadata,
        1 - (embedding <=> ${embeddingVector}::vector) as similarity
      FROM medical_knowledge
      WHERE active = true
        AND 1 - (embedding <=> ${embeddingVector}::vector) > ${threshold}
      ORDER BY embedding <=> ${embeddingVector}::vector
      LIMIT ${limit}
    `;
  }

  // Cast to array since Neon returns union type (any[][] | Record<string, any>[] | FullQueryResults)
  const rows = results as Array<Record<string, any>>;
  return rows.map((row) => ({
    knowledgeId: row.knowledge_id,
    content: row.content,
    category: row.category,
    subcategory: row.subcategory,
    metadata: row.metadata,
    similarity: parseFloat(row.similarity),
  }));
}

/**
 * Insert knowledge document with automatic embedding generation
 *
 * **Use case:** Seed script, admin panel, or API to add validated medical content
 * **Validation:** All content must be validated by Dr. Andrés Durán before insertion
 *
 * @param knowledge - Knowledge document without embedding (auto-generated)
 * @returns Inserted knowledge document with ID and embedding
 *
 * @example
 * const result = await insertKnowledge({
 *   content: "La rinoplastia es un procedimiento quirúrgico...",
 *   category: "procedure",
 *   subcategory: "rinoplastia",
 *   metadata: { duration: "2-3 horas", recovery_days: 10 },
 *   validatedBy: "Dr. Andrés Durán",
 *   validatedAt: new Date()
 * });
 */
export async function insertKnowledge(
  knowledge: Omit<NewMedicalKnowledge, 'embedding'>
): Promise<MedicalKnowledge> {
  // Generate embedding for the content
  const embedding = await generateEmbedding(knowledge.content);

  // Insert with embedding
  const [result] = await db
    .insert(medicalKnowledge)
    .values({
      ...knowledge,
      embedding,
    })
    .returning();

  if (!result) {
    throw new Error('Failed to insert knowledge document');
  }
  return result;
}

/**
 * Batch insert knowledge documents with embeddings
 *
 * **Use case:** Seed script to populate initial knowledge base
 * **Performance:** Processes sequentially to avoid rate limits (200ms per doc)
 *
 * @param knowledgeList - Array of knowledge documents without embeddings
 * @returns Array of inserted knowledge documents with IDs and embeddings
 *
 * @example
 * const results = await insertKnowledgeBatch([
 *   {
 *     content: "La rinoplastia...",
 *     category: "procedure",
 *     subcategory: "rinoplastia",
 *     validatedBy: "Dr. Andrés Durán",
 *     validatedAt: new Date()
 *   },
 *   // ... more documents
 * ]);
 */
export async function insertKnowledgeBatch(
  knowledgeList: Array<Omit<NewMedicalKnowledge, 'embedding'>>
): Promise<MedicalKnowledge[]> {
  const results: MedicalKnowledge[] = [];

  for (const knowledge of knowledgeList) {
    const result = await insertKnowledge(knowledge);
    results.push(result);
  }

  return results;
}

/**
 * Update knowledge document and regenerate embedding if content changed
 *
 * **Use case:** Update procedures, FAQs, or policies with new validated information
 * **Versioning:** Increments version field automatically
 *
 * @param knowledgeId - UUID of knowledge document to update
 * @param updates - Fields to update (if content changes, embedding is regenerated)
 * @returns Updated knowledge document
 */
export async function updateKnowledge(
  knowledgeId: string,
  updates: Partial<Omit<NewMedicalKnowledge, 'embedding'>>
): Promise<MedicalKnowledge> {
  // If content is being updated, regenerate embedding
  const updateData: any = { ...updates };

  if (updates.content) {
    const embedding = await generateEmbedding(updates.content);
    updateData.embedding = embedding;
  }

  // Increment version
  if (Object.keys(updateData).length > 0) {
    updateData.version = sql`version + 1`;
    updateData.updatedAt = new Date();
  }

  const [result] = await db
    .update(medicalKnowledge)
    .set(updateData)
    .where(eq(medicalKnowledge.knowledgeId, knowledgeId))
    .returning();

  if (!result) {
    throw new Error(`Failed to update knowledge document: ${knowledgeId}`);
  }
  return result;
}

/**
 * Deactivate knowledge document (soft delete)
 *
 * **Use case:** Mark outdated or incorrect content as inactive without deletion
 * **Audit trail:** Document remains in database for compliance
 *
 * @param knowledgeId - UUID of knowledge document to deactivate
 */
export async function deactivateKnowledge(knowledgeId: string): Promise<void> {
  await db
    .update(medicalKnowledge)
    .set({ active: false, updatedAt: new Date() })
    .where(eq(medicalKnowledge.knowledgeId, knowledgeId));
}

/**
 * Get knowledge document by ID
 *
 * @param knowledgeId - UUID of knowledge document
 * @returns Knowledge document or undefined if not found
 */
export async function getKnowledgeById(knowledgeId: string): Promise<MedicalKnowledge | undefined> {
  const [result] = await db
    .select()
    .from(medicalKnowledge)
    .where(eq(medicalKnowledge.knowledgeId, knowledgeId))
    .limit(1);

  return result;
}
