/**
 * @file Normalization Schemas
 * @description Zod schemas for contact normalization input, output, and AI extraction
 * @module lib/normalization/schemas
 * @exports ContactInputSchema, ContactInput, NormalizedContactSchema, NormalizedContact, AIExtractionSchema, AIExtraction
 */

import { z } from 'zod';

/**
 * Input schema for contact normalization
 * Accepts raw contact data from Bird CRM
 */
export const ContactInputSchema = z.object({
  displayName: z.string().optional(),
  phone: z.string().optional(),
  conversationMessages: z.array(z.string()).default([]),
});

export type ContactInput = z.infer<typeof ContactInputSchema>;

/**
 * Output schema for normalized contact
 * Contains all 7 critical fields + additional fields
 */
export const NormalizedContactSchema = z.object({
  // 7 CRITICAL FIELDS (Bird CRM)
  displayName: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email().optional(), // CRITICAL - RFC 5322 format
  country: z.string().optional(), // ISO alpha-2 code (CO, MX, ES)
  countryName: z.string().optional(), // Full name (Colombia, México, España)
  phone: z.string().optional(), // E.164 format

  // ADDITIONAL FIELDS
  gender: z.enum(['M', 'F']).optional(),
  city: z.string().optional(),
  alias: z.string().optional(),

  // METADATA
  confidence: z.number().min(0).max(1),
  method: z.enum(['regex', 'heuristic', 'ai', 'hybrid']),
  extractionMethods: z.array(z.string()),
});

export type NormalizedContact = z.infer<typeof NormalizedContactSchema>;

/**
 * Schema for Gemini AI structured extraction
 * Used with generateObject() for type-safe AI responses
 */
export const AIExtractionSchema = z.object({
  fullName: z.string().describe('Full name extracted from conversation'),
  firstName: z.string().describe('First name only'),
  lastName: z.string().describe('Last name or surnames (LATAM 2-apellido support)'),
  email: z.string().email().optional().describe('Email address if mentioned'),
  gender: z.enum(['M', 'F']).optional().describe('Gender inferred from name or context'),
  city: z.string().optional().describe('City mentioned in conversation'),
  confidence: z.number().min(0).max(1).describe('Confidence score 0-1'),
  reasoning: z.string().optional().describe('Explanation of extraction logic'),
});

export type AIExtraction = z.infer<typeof AIExtractionSchema>;
