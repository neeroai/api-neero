/**
 * Two-Stage Image Processing Pipeline
 * Intelligent routing with classification + type-specific processing
 * Total budget: 8.5 seconds (9s deadline with 0.5s buffer)
 */

import { classifyImage } from '@/lib/ai/classify';
import { processDocument } from '@/lib/ai/processors/document';
import { processInvoice } from '@/lib/ai/processors/invoice';
import { processPhoto } from '@/lib/ai/processors/photo';
import { adjustTimeoutForRemaining, getRouteForType } from '@/lib/ai/router';
import type { ImageType } from '@/lib/ai/schemas/classification';
import type { DocumentData } from '@/lib/ai/schemas/document';
import type { InvoiceData } from '@/lib/ai/schemas/invoice';
import type { PhotoAnalysis } from '@/lib/ai/schemas/photo';
import {
  checkTimeout,
  getRemaining,
  startTimeTracking,
  TimeoutBudgetError,
} from '@/lib/ai/timeout';

/**
 * Pipeline options
 */
export interface PipelineOptions {
  /**
   * Force specific image type (skips classification, saves ~2s)
   */
  forceType?: ImageType;

  /**
   * Total time budget in milliseconds (default: 8500ms = 8.5s)
   */
  budgetMs?: number;
}

/**
 * Pipeline result with type information
 */
export interface PipelineResult {
  type: ImageType;
  data: PhotoAnalysis | InvoiceData | DocumentData;
  timing: {
    classificationMs?: number;
    processingMs: number;
    totalMs: number;
  };
}

/**
 * Process image through two-stage pipeline
 *
 * Stage 1: Classification (2s) - Determine image type with Gemini 2.0 Flash
 * Stage 2: Processing (4-5.5s) - Type-specific extraction with optimal model
 *
 * @param imageUrl - URL of the image to process
 * @param options - Pipeline configuration options
 * @returns Pipeline result with type and extracted data
 * @throws TimeoutBudgetError if 8.5-second budget exceeded
 *
 * Performance:
 * - With classification: ~6-7.5s total (2s classify + 4-5.5s process)
 * - Without (forceType): ~4-5.5s total (skip classification)
 *
 * Example:
 * ```typescript
 * // Automatic routing
 * const result = await processImage(imageUrl);
 *
 * // Fast path (skip classification)
 * const result = await processImage(imageUrl, { forceType: 'invoice' });
 * ```
 */
export async function processImage(
  imageUrl: string,
  options?: PipelineOptions
): Promise<PipelineResult> {
  const { forceType, budgetMs = 8500 } = options || {};

  // Start time tracking (8.5s budget by default)
  const timeTracker = startTimeTracking(budgetMs);
  const startTime = Date.now();

  let imageType: ImageType;
  let classificationMs: number | undefined;

  try {
    // Stage 1: Classification (or skip if forceType provided)
    if (forceType) {
      // Fast path: skip classification (saves ~2s)
      imageType = forceType;
      classificationMs = undefined;
    } else {
      // Classify image to determine optimal processor
      const classifyStart = Date.now();
      checkTimeout(timeTracker);

      const classification = await classifyImage(imageUrl, timeTracker);
      imageType = classification.type;

      classificationMs = Date.now() - classifyStart;
    }

    // Stage 2: Type-specific processing
    const processingStart = Date.now();
    checkTimeout(timeTracker);

    // Get route configuration for image type
    const routeConfig = getRouteForType(imageType);

    // Adjust timeout based on remaining budget
    const remainingMs = getRemaining(timeTracker);
    const adjustedConfig = adjustTimeoutForRemaining(routeConfig, remainingMs);

    // Process with type-specific processor
    let data: PhotoAnalysis | InvoiceData | DocumentData;

    switch (imageType) {
      case 'photo':
        data = await processPhoto(imageUrl, adjustedConfig.timeoutMs);
        break;

      case 'invoice':
        data = await processInvoice(imageUrl, adjustedConfig.timeoutMs);
        break;

      case 'document':
        data = await processDocument(imageUrl, adjustedConfig.timeoutMs);
        break;

      case 'unknown':
        // Fallback: treat as photo for best-effort processing
        data = await processPhoto(imageUrl, adjustedConfig.timeoutMs);
        break;

      default: {
        // TypeScript exhaustiveness check
        const _exhaustive: never = imageType;
        throw new Error(`Unknown image type: ${_exhaustive}`);
      }
    }

    const processingMs = Date.now() - processingStart;
    const totalMs = Date.now() - startTime;

    // Final budget check
    checkTimeout(timeTracker);

    return {
      type: imageType,
      data,
      timing: {
        classificationMs,
        processingMs,
        totalMs,
      },
    };
  } catch (error) {
    // Re-throw timeout errors as-is
    if (error instanceof TimeoutBudgetError) {
      throw error;
    }

    // Wrap other errors with context
    if (error instanceof Error) {
      const elapsed = Date.now() - startTime;
      throw new Error(`Pipeline failed after ${elapsed}ms: ${error.message}`);
    }

    throw error;
  }
}

/**
 * Type guard: check if result is photo analysis
 */
export function isPhotoAnalysis(
  data: PhotoAnalysis | InvoiceData | DocumentData
): data is PhotoAnalysis {
  return 'objects' in data && 'scene' in data && 'colors' in data;
}

/**
 * Type guard: check if result is invoice data
 */
export function isInvoiceData(
  data: PhotoAnalysis | InvoiceData | DocumentData
): data is InvoiceData {
  return 'items' in data && 'total' in data && 'currency' in data;
}

/**
 * Type guard: check if result is document data
 */
export function isDocumentData(
  data: PhotoAnalysis | InvoiceData | DocumentData
): data is DocumentData {
  return 'documentType' in data && 'extractedText' in data;
}
