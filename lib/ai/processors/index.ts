/**
 * Image Processors
 * Barrel export for type-specific image processors
 */

export type { DocumentData, DocumentField } from '@/lib/ai/schemas/document';
export type { InvoiceData, InvoiceLineItem } from '@/lib/ai/schemas/invoice';
// Re-export types for convenience
export type { PhotoAnalysis } from '@/lib/ai/schemas/photo';
export { processDocument } from './document';
export { processInvoice } from './invoice';
export { processPhoto } from './photo';
