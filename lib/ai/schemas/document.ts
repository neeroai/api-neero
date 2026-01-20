/**
 * @file Document
 * @description Exports 4 functions and types
 * @module lib/ai/schemas/document
 * @exports DocumentData, DocumentDataSchema, DocumentField, DocumentFieldSchema
 */
import { z } from 'zod';

/**
 * Extracted field from document with optional confidence
 */
export const DocumentFieldSchema = z.object({
  name: z.string().describe('Field name (e.g., "nombre", "cedula", "fecha_expedicion")'),
  value: z.string().describe('Extracted field value'),
  confidence: z.number().min(0).max(1).optional().describe('Confidence score for extraction (0-1)'),
});

/**
 * Document processing schema for cedulas/contracts/policies
 * Optimized for Spanish documents (LATAM)
 */
export const DocumentDataSchema = z.object({
  documentType: z.string().describe('Type of document (cedula, passport, contract, policy, etc)'),

  fullName: z.string().optional().describe('Full name of the person on the document'),

  idNumber: z.string().optional().describe('ID number (cedula, passport number, etc)'),

  dateOfBirth: z.string().optional().describe('Date of birth (YYYY-MM-DD format)'),

  issueDate: z.string().optional().describe('Document issue date (YYYY-MM-DD format)'),

  expiryDate: z.string().optional().describe('Document expiry date (YYYY-MM-DD format)'),

  issueLocation: z.string().optional().describe('Place where document was issued'),

  placeOfBirth: z.string().optional().describe('Place of birth'),

  bloodType: z.string().optional().describe('Blood type (for cedulas)'),

  gender: z.string().optional().describe('Gender (M/F)'),

  extractedText: z.string().describe('Complete OCR text from the document'),

  additionalFields: z
    .record(z.unknown())
    .optional()
    .describe('Additional structured fields extracted from the document'),

  confidence: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe('Overall confidence score for extraction (0-1)'),

  language: z.string().default('es').describe('Document language code (default "es" for Spanish)'),

  metadata: z
    .record(z.unknown())
    .optional()
    .describe('Additional document metadata or contextual information'),
});

export type DocumentField = z.infer<typeof DocumentFieldSchema>;
export type DocumentData = z.infer<typeof DocumentDataSchema>;
