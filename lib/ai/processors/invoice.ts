/**
 * Invoice Processor
 * Extracts structured data from invoices and receipts with Gemini 2.0 Flash
 * LATAM-optimized for Colombian invoices with IVA
 */

import { generateObject } from 'ai';
import { GeminiModelId, getGeminiModel } from '@/lib/ai/gateway';
import { getInvoiceExtractionPrompt } from '@/lib/ai/prompts/invoice';
import { type InvoiceData, InvoiceDataSchema } from '@/lib/ai/schemas/invoice';

/**
 * Process invoice for structured data extraction
 *
 * @param imageUrl - URL of the invoice/receipt to process
 * @param timeoutMs - Maximum processing time in milliseconds (default: 5000ms)
 * @returns Invoice data with vendor, items, totals, and tax information
 * @throws Error if processing fails or times out
 *
 * Performance: ~5 seconds with Gemini 2.0 Flash
 * Use case: Colombian invoices, receipts, facturas electronicas
 * Features: IVA extraction, NIT parsing, line items, Spanish number formats
 */
export async function processInvoice(imageUrl: string, timeoutMs = 5000): Promise<InvoiceData> {
  const model = getGeminiModel(GeminiModelId.FLASH_2_0);
  const prompt = getInvoiceExtractionPrompt();

  try {
    const result = await generateObject({
      model,
      schema: InvoiceDataSchema,
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
        throw new Error(`Invoice processing timeout after ${timeoutMs}ms`);
      }
      throw new Error(`Invoice processing failed: ${error.message}`);
    }
    throw error;
  }
}
