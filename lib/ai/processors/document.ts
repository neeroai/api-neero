/**
 * Document Processor
 * Extracts structured data from official documents with Gemini 2.5 Flash
 * LATAM-optimized for cedulas colombianas, contracts, and policies
 */

import { generateObject } from 'ai';
import { GeminiModelId, getGeminiModel } from '@/lib/ai/gateway';
import { getDocumentExtractionPrompt } from '@/lib/ai/prompts/document';
import { type DocumentData, DocumentDataSchema } from '@/lib/ai/schemas/document';

/**
 * Process document for structured field extraction
 *
 * @param imageUrl - URL of the document to process
 * @param timeoutMs - Maximum processing time in milliseconds (default: 5500ms)
 * @returns Document data with type, fields, and full OCR text
 * @throws Error if processing fails or times out
 *
 * Performance: ~5.5 seconds with Gemini 2.5 Flash (more powerful for complex docs)
 * Use case: Cedulas de ciudadania, passports, contracts, insurance policies
 * Features: Field extraction, Spanish OCR, Colombian ID formats (CC, NIT)
 */
export async function processDocument(imageUrl: string, timeoutMs = 5500): Promise<DocumentData> {
  const model = getGeminiModel(GeminiModelId.FLASH_2_5);
  const prompt = getDocumentExtractionPrompt();

  try {
    const result = await generateObject({
      model,
      schema: DocumentDataSchema,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image', image: imageUrl },
          ],
        },
      ],
      abortSignal: AbortSignal.timeout(timeoutMs),
    });

    return result.object;
  } catch (error) {
    // Handle timeout or API errors
    if (error instanceof Error) {
      if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
        throw new Error(`Document processing timeout after ${timeoutMs}ms`);
      }
      throw new Error(`Document processing failed: ${error.message}`);
    }
    throw error;
  }
}
