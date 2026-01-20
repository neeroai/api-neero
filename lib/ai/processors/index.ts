/**
 * @file Image Processors
 * @description Exports 8 functions and types
 * @module lib/ai/processors/index
 * @exports DocumentData, DocumentField, InvoiceData, InvoiceLineItem, PhotoAnalysis, processDocument, processInvoice, processPhoto
 */
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
