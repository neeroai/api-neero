import { tool } from 'ai';
import { z } from 'zod';
import { searchKnowledge } from '@/lib/db/queries/knowledge';

const retrieveKnowledgeSchema = z.object({
  query: z
    .string()
    .min(5)
    .describe(
      'Pregunta exacta del usuario sobre procedimientos médicos, FAQs, políticas, o ubicaciones'
    ),
  category: z
    .enum(['procedure', 'faq', 'policy', 'location'])
    .optional()
    .describe('Categoría para filtrar búsqueda: procedure, faq, policy, location'),
});

/**
 * Retrieve Knowledge Tool
 * Searches validated medical knowledge base using semantic vector similarity
 *
 * **RAG Implementation:**
 * - Embeddings: Google Gemini text-embedding-004 (768 dims)
 * - Vector DB: Neon pgvector with HNSW index
 * - Performance: 201.5ms total (200ms embedding + 1.5ms search)
 * - Threshold: 0.7 similarity (balance precision vs recall)
 *
 * **Use Cases:**
 * - Procedimientos: rinoplastia, lipoescultura, mamoplastia, blefaroplastia
 * - FAQs: recuperación, preparación, costos, resultados
 * - Políticas: consultas, garantías, financiamiento
 * - Ubicaciones: clínicas, horarios, servicios
 *
 * **Critical:** All content validated by Dr. Andrés Durán before deployment
 */
export const retrieveKnowledgeTool = tool({
  description: `Buscar información verificada sobre procedimientos médicos, políticas de la clínica, FAQs, y ubicaciones.

                CUÁNDO USAR:
                - Usuario pregunta sobre procedimiento específico (rinoplastia, lipoescultura, etc.)
                - Usuario pregunta sobre preparación pre-operatoria o cuidados post-operatorios
                - Usuario pregunta sobre políticas (consultas, garantías, financiamiento)
                - Usuario pregunta sobre ubicaciones, horarios, servicios
                - Usuario pregunta sobre precios, duración, o resultados de procedimientos

                CUÁNDO NO USAR:
                - Preguntas sobre agendar cita (usa scheduleCitation)
                - Preguntas personales sobre síntomas (escalar a humano)
                - Solicitudes de diagnóstico médico (escalar a humano)
                - Información no relacionada con servicios de la clínica

                IMPORTANTE:
                - Si found=false, SIEMPRE escalar a humano con createTicket
                - NUNCA inventar información si no hay resultados
                - Usar el contenido retornado TAL CUAL, con tono empático
                - Verificar similarity > 0.7 antes de usar el contenido`,
  inputSchema: retrieveKnowledgeSchema,
  execute: async ({ query, category }) => {
    try {
      console.info('[retrieveKnowledgeTool] Searching knowledge base:', {
        query,
        category,
      });

      // Search knowledge base using semantic vector similarity
      const results = await searchKnowledge(query, {
        category,
        limit: 3,
        threshold: 0.7,
      });

      if (results.length === 0) {
        console.warn('[retrieveKnowledgeTool] No knowledge found for query:', query);

        return {
          found: false,
          message:
            'No encontré información específica sobre tu consulta. Voy a escalarte con un agente especializado que podrá ayudarte mejor.',
          action: 'escalate_to_human',
        };
      }

      console.info('[retrieveKnowledgeTool] Found knowledge:', {
        count: results.length,
        categories: results.map((r) => r.category),
        similarities: results.map((r) => r.similarity.toFixed(3)),
      });

      return {
        found: true,
        knowledge: results.map((r) => ({
          content: r.content,
          category: r.category,
          subcategory: r.subcategory,
          metadata: r.metadata,
          similarity: parseFloat(r.similarity.toFixed(3)),
        })),
        usage_instructions: {
          tone: 'Usa el contenido con tono empático y cercano',
          format: 'Adapta la información al nivel de entendimiento del usuario',
          validation: 'Todo el contenido ha sido validado por Dr. Andrés Durán',
          attribution:
            'No menciones que es de una base de datos, presenta como conocimiento de la clínica',
        },
      };
    } catch (error) {
      console.error('[retrieveKnowledgeTool] Error:', error);

      return {
        found: false,
        error: 'search_failed',
        message:
          'Tuve un problema buscando la información. Voy a escalarte con un agente para que te ayude.',
        action: 'escalate_to_human',
      };
    }
  },
});
