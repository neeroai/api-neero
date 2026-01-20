/**
 * @file Bird Actions API Endpoint v3.0
 * @description API route handler
 * @module app/api/bird/route
 * @exports POST, runtime
 * @runtime edge
 */
/**
 * Bird Actions API Endpoint v3.0
 * Main endpoint for multimodal processing: image, audio, document
 * Edge Runtime optimized with 9-second timeout enforcement
 *
 * v3.0 BREAKING CHANGE: mediaUrl is now extracted from conversation via Bird API
 */

import { NextResponse } from 'next/server';
import { processImage } from '@/lib/ai/pipeline';
import type { DocumentData as AIDocumentData } from '@/lib/ai/schemas/document';
import type { InvoiceData } from '@/lib/ai/schemas/invoice';
import type { PhotoAnalysis } from '@/lib/ai/schemas/photo';
import { TimeBudget, TimeoutBudgetError, type TimeTracker } from '@/lib/ai/timeout';
import { transcribeWithFallback } from '@/lib/ai/transcribe';
import { validateApiKey } from '@/lib/auth/api-key';
import { fetchLatestMediaFromConversation } from '@/lib/bird/fetch-latest-media';
import { downloadMedia } from '@/lib/bird/media';
import type {
  BirdActionRequest,
  BirdActionSuccessResponse,
  DocumentData as BirdDocumentData,
  ImageData,
} from '@/lib/bird/types';
import { BirdActionRequestSchema } from '@/lib/bird/types';
import {
  InternalError,
  TimeoutError,
  UnauthorizedError,
  ValidationError,
  handleRouteError,
} from '@/lib/errors';

export const runtime = 'edge';

/**
 * Adapter Functions: Convert detailed AI schemas to simplified Bird response format
 */

/**
 * Convert PhotoAnalysis to ImageData
 */
function photoToImageData(photo: PhotoAnalysis): ImageData {
  return {
    documentType: 'photo',
    description: photo.description,
    extractedFields: {
      objects: photo.objects,
      people: photo.people,
      scene: photo.scene,
      colors: photo.colors,
      text: photo.text,
      confidence: photo.confidence,
    },
  };
}

/**
 * Convert InvoiceData to ImageData
 */
function invoiceToImageData(invoice: InvoiceData): ImageData {
  return {
    documentType: 'invoice',
    description: `Invoice from ${invoice.vendor ?? 'unknown vendor'}, Total: ${invoice.total} ${invoice.currency}`,
    extractedFields: {
      vendor: invoice.vendor,
      nit: invoice.nit,
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.date,
      items: invoice.items,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      discount: invoice.discount,
      total: invoice.total,
      currency: invoice.currency,
      confidence: invoice.confidence,
    },
  };
}

/**
 * Convert AIDocumentData to ImageData
 */
function documentToImageData(document: AIDocumentData): ImageData {
  return {
    documentType: document.documentType === 'cedula' ? 'cedula' : 'unknown',
    description: `${document.documentType} - ${document.fullName ?? 'No name'}`,
    extractedFields: {
      fullName: document.fullName,
      idNumber: document.idNumber,
      dateOfBirth: document.dateOfBirth,
      issueDate: document.issueDate,
      expiryDate: document.expiryDate,
      issueLocation: document.issueLocation,
      placeOfBirth: document.placeOfBirth,
      bloodType: document.bloodType,
      gender: document.gender,
      extractedText: document.extractedText,
      confidence: document.confidence,
      language: document.language,
    },
  };
}

/**
 * Convert AIDocumentData to BirdDocumentData
 */
function documentToBirdDocumentData(document: AIDocumentData): BirdDocumentData {
  return {
    text: document.extractedText,
    pages: 1, // Single page for images
    documentType: document.documentType,
  };
}

/**
 * Parse and validate request body
 */
async function parseRequestBody(request: Request): Promise<BirdActionRequest> {
  const rawBody = await request.json();
  return BirdActionRequestSchema.parse(rawBody);
}

/**
 * Download media with error handling
 */
async function downloadMediaSafe(url: string): Promise<ArrayBuffer> {
  try {
    return await downloadMedia(url);
  } catch (error) {
    throw new InternalError(
      error instanceof Error ? error.message : 'Failed to download media',
      { operation: 'media_download', url: url.substring(0, 50) }
    );
  }
}

/**
 * Process image media type
 */
async function handleImageProcessing(
  mediaUrl: string,
  budget: TimeBudget,
  startTime: number
): Promise<Response> {
  const result = await processImage(mediaUrl, {
    budgetMs: budget.getRemainingMs(),
  });

  // Convert result to Bird ImageData format
  let imageData: ImageData;
  if (result.type === 'photo') {
    imageData = photoToImageData(result.data as PhotoAnalysis);
  } else if (result.type === 'invoice') {
    imageData = invoiceToImageData(result.data as InvoiceData);
  } else if (result.type === 'document') {
    imageData = documentToImageData(result.data as AIDocumentData);
  } else {
    imageData = photoToImageData(result.data as PhotoAnalysis);
  }

  const response: BirdActionSuccessResponse = {
    success: true,
    type: 'image',
    data: imageData,
    processingTime: formatProcessingTime(startTime),
    model: getModelFromType(result.type),
  };

  return NextResponse.json(response, { status: 200 });
}

/**
 * Process audio media type with budget-aware timeout management
 */
async function handleAudioProcessing(
  mediaBuffer: ArrayBuffer,
  budget: TimeBudget,
  startTime: number
): Promise<Response> {
  // Create TimeTracker from remaining budget
  const timeTracker: TimeTracker = {
    startTime: Date.now(),
    budgetMs: budget.getRemainingMs(),
  };

  // Transcribe with fallback, passing time tracker for dynamic timeout
  const result = await transcribeWithFallback(
    mediaBuffer,
    {
      language: 'es',
    },
    timeTracker
  );

  const response: BirdActionSuccessResponse = {
    success: true,
    type: 'audio',
    data: {
      transcript: result.text,
      language: 'es',
    },
    processingTime: formatProcessingTime(startTime),
    model: result.provider === 'groq' ? 'whisper-large-v3-turbo' : 'whisper-1',
    fallbackUsed: result.fallbackUsed,
  };

  return NextResponse.json(response, { status: 200 });
}

/**
 * Process document media type
 */
async function handleDocumentProcessing(
  mediaUrl: string,
  budget: TimeBudget,
  startTime: number
): Promise<Response> {
  const result = await processImage(mediaUrl, {
    forceType: 'document',
    budgetMs: budget.getRemainingMs(),
  });

  const documentData = documentToBirdDocumentData(result.data as AIDocumentData);

  const response: BirdActionSuccessResponse = {
    success: true,
    type: 'document',
    data: documentData,
    processingTime: formatProcessingTime(startTime),
    model: 'gemini-2.5-flash',
  };

  return NextResponse.json(response, { status: 200 });
}

/**
 * POST /api/bird v3.0
 * Process media (image, audio, document) for Bird AI Employees
 *
 * v3.0 BREAKING CHANGE:
 * - Removed mediaUrl from request (AI Employee cannot obtain it reliably)
 * - ALWAYS extracts mediaUrl from conversation via Bird Conversations API
 * - Uses detected mediaType from conversation (more reliable than AI Employee hint)
 */
export async function POST(request: Request): Promise<Response> {
  const startTime = Date.now();
  const budget = new TimeBudget(8500);

  try {
    // 1. API Key Validation
    if (!validateApiKey(request)) {
      throw new UnauthorizedError('API key required or invalid');
    }

    // 2. Parse request body (v3.0 schema: no mediaUrl, required context.conversationId)
    const body = await parseRequestBody(request);

    budget.checkBudget();

    // 3. ALWAYS extract mediaUrl from conversation (PRIMARY flow, not fallback)
    console.log(`[Bird API] Fetching media from conversation ${body.context.conversationId}...`);

    let mediaUrl: string;
    let mediaType: 'image' | 'document' | 'audio';

    try {
      const extracted = await fetchLatestMediaFromConversation(body.context.conversationId);
      mediaUrl = extracted.mediaUrl;
      // Use detected type from conversation (more reliable than body.mediaType)
      mediaType = extracted.mediaType;

      console.log(`[Bird API] Extracted: type=${mediaType}, url=${mediaUrl.substring(0, 50)}...`);
    } catch (error) {
      throw new InternalError(
        error instanceof Error ? error.message : 'Could not extract media from conversation',
        {
          operation: 'media_extraction',
          conversationId: body.context.conversationId,
        }
      );
    }

    budget.checkBudget();

    // 4. Download media
    const mediaBuffer = await downloadMediaSafe(mediaUrl);

    budget.checkBudget();

    // 5. Process based on DETECTED media type (not body.mediaType)
    switch (mediaType) {
      case 'image':
        return await handleImageProcessing(mediaUrl, budget, startTime);
      case 'audio':
        return await handleAudioProcessing(mediaBuffer, budget, startTime);
      case 'document':
        return await handleDocumentProcessing(mediaUrl, budget, startTime);
      default: {
        const _exhaustive: never = mediaType;
        throw new ValidationError(`Unsupported media type: ${_exhaustive}`);
      }
    }
  } catch (error) {
    if (error instanceof TimeoutBudgetError) {
      throw new TimeoutError(error.message, { budgetMs: 8500 });
    }
    return handleRouteError(error);
  }
}


/**
 * Format processing time as string (e.g., "2.3s")
 */
function formatProcessingTime(startTime: number): string {
  const elapsed = Date.now() - startTime;
  return `${(elapsed / 1000).toFixed(1)}s`;
}

/**
 * Get model name from image type
 */
function getModelFromType(type: string): string {
  switch (type) {
    case 'photo':
    case 'invoice':
      return 'gemini-2.0-flash';
    case 'document':
      return 'gemini-2.5-flash';
    case 'unknown':
      return 'gemini-2.0-flash';
    default:
      return 'gemini-2.0-flash';
  }
}
