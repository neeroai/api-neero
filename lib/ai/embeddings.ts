import { google } from '@ai-sdk/google';
import { embed } from 'ai';

/**
 * Generate vector embeddings using Google Gemini text-embedding-004
 *
 * **Model:** text-embedding-004 (768 dimensions)
 * **Cost:** $0.025 / 1M tokens (negligible)
 * **Latency:** ~200ms per query (Edge Runtime compatible)
 * **Use case:** Medical knowledge base semantic search
 *
 * **Sources:**
 * - https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai
 * - https://dev.to/danielsogl/generating-and-storing-google-gemini-embeddings-with-vercel-ai-sdk-and-supabase-283d
 *
 * @param text - Text to convert to embeddings (medical content, FAQs, procedures)
 * @returns 768-dimensional vector array for pgvector storage
 *
 * @example
 * const embedding = await generateEmbedding("¿Cuánto dura la recuperación de rinoplastia?");
 * // Returns: [0.123, -0.456, 0.789, ...] (768 numbers)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: google.textEmbeddingModel('text-embedding-004'),
    value: text,
  });

  return embedding;
}

/**
 * Generate embeddings for multiple texts in batch
 *
 * **Use case:** Seed script to generate embeddings for all knowledge base documents
 * **Performance:** Processes sequentially to avoid rate limits
 *
 * @param texts - Array of texts to convert to embeddings
 * @returns Array of 768-dimensional vectors matching input order
 *
 * @example
 * const texts = [
 *   "La rinoplastia es un procedimiento...",
 *   "La lipoescultura requiere..."
 * ];
 * const embeddings = await generateEmbeddingsBatch(texts);
 * // Returns: [[0.1, 0.2, ...], [0.3, 0.4, ...]]
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];

  for (const text of texts) {
    const embedding = await generateEmbedding(text);
    embeddings.push(embedding);
  }

  return embeddings;
}
