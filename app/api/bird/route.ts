/**
 * Bird Actions API Endpoint
 * Main endpoint for multimodal processing: image, audio, document
 * Edge Runtime optimized with 9-second timeout enforcement
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { transcribeWithFallback } from '@/lib/ai/transcribe';
import { processImage } from '@/lib/ai/pipeline';
import type { DocumentData as AIDocumentData } from '@/lib/ai/schemas/document';
import type { InvoiceData } from '@/lib/ai/schemas/invoice';
import type { PhotoAnalysis } from '@/lib/ai/schemas/photo';
import { TimeBudget, TimeoutBudgetError } from '@/lib/ai/timeout';
import { createUnauthorizedResponse, validateApiKey } from '@/lib/auth/api-key';
import { downloadMedia } from '@/lib/bird/media';
import type {
  BirdActionErrorResponse,
  BirdActionRequest,
  BirdActionSuccessResponse,
  DocumentData as BirdDocumentData,
  ErrorCode,
  ImageData,
} from '@/lib/bird/types';
import { BirdActionRequestSchema } from '@/lib/bird/types';

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
async function parseRequestBody(
  request: Request,
  startTime: number
): Promise<BirdActionRequest | Response> {
  try {
    const rawBody = await request.json();
    return BirdActionRequestSchema.parse(rawBody);
  } catch (error) {
    if (error instanceof ZodError) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        `Invalid request body: ${error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        400,
        startTime
      );
    }
    return createErrorResponse('VALIDATION_ERROR', 'Invalid JSON body', 400, startTime);
  }
}

/**
 * Download media with error handling
 */
async function downloadMediaSafe(url: string, startTime: number): Promise<ArrayBuffer | Response> {
  try {
    return await downloadMedia(url);
  } catch (error) {
    return createErrorResponse(
      'MEDIA_DOWNLOAD_ERROR',
      error instanceof Error ? error.message : 'Failed to download media',
      500,
      startTime
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
 * Process audio media type
 */
async function handleAudioProcessing(
  mediaBuffer: ArrayBuffer,
  startTime: number
): Promise<Response> {
  const result = await transcribeWithFallback(mediaBuffer, {
    language: 'es',
  });

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
 * POST /api/bird
 * Process media (image, audio, document) for Bird AI Employees
 */
export async function POST(request: Request): Promise<Response> {
  const startTime = Date.now();
  const budget = new TimeBudget(8500);

  try {
    // 1. API Key Validation
    if (!validateApiKey(request)) {
      return createUnauthorizedResponse();
    }

    // 2. Parse request body
    const bodyOrError = await parseRequestBody(request, startTime);
    if (bodyOrError instanceof Response) {
      return bodyOrError;
    }
    const body = bodyOrError;

    budget.checkBudget();

    // 3. Download media
    const bufferOrError = await downloadMediaSafe(body.mediaUrl, startTime);
    if (bufferOrError instanceof Response) {
      return bufferOrError;
    }
    const mediaBuffer = bufferOrError;

    budget.checkBudget();

    // 4. Process based on media type
    try {
      switch (body.type) {
        case 'image':
          return await handleImageProcessing(body.mediaUrl, budget, startTime);
        case 'audio':
          return await handleAudioProcessing(mediaBuffer, startTime);
        case 'document':
          return await handleDocumentProcessing(body.mediaUrl, budget, startTime);
        default: {
          const _exhaustive: never = body.type;
          return createErrorResponse(
            'UNSUPPORTED_MEDIA_TYPE',
            `Unsupported media type: ${_exhaustive}`,
            400,
            startTime
          );
        }
      }
    } catch (error) {
      if (error instanceof TimeoutBudgetError) {
        return createErrorResponse('TIMEOUT_ERROR', error.message, 408, startTime);
      }
      return createErrorResponse(
        'PROCESSING_ERROR',
        error instanceof Error ? error.message : 'Processing failed',
        500,
        startTime
      );
    }
  } catch (error) {
    if (error instanceof TimeoutBudgetError) {
      return createErrorResponse('TIMEOUT_ERROR', error.message, 408, startTime);
    }
    return createErrorResponse(
      'PROCESSING_ERROR',
      error instanceof Error ? error.message : 'Unexpected error',
      500,
      startTime
    );
  }
}

/**
 * Create error response
 */
function createErrorResponse(
  code: ErrorCode,
  message: string,
  status: number,
  startTime: number
): Response {
  const response: BirdActionErrorResponse = {
    success: false,
    error: message,
    code,
    processingTime: formatProcessingTime(startTime),
  };

  // Log error for monitoring
  console.error(`[Bird API Error] ${code}: ${message}`);

  return NextResponse.json(response, { status });
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
