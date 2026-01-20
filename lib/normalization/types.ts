/**
 * @file Normalization Types
 * @description Shared TypeScript types for normalization system
 * @module lib/normalization/types
 * @exports NameExtractionResult, GenderInferenceResult, CountryInferenceResult, PhoneValidationResult
 */

/**
 * Result from name extraction (regex, heuristic, or AI)
 */
export interface NameExtractionResult {
  fullName: string;
  firstName: string;
  lastName: string;
  confidence: number;
  method: 'regex' | 'heuristic' | 'ai' | 'unknown';
}

/**
 * Result from gender inference (heuristic)
 */
export interface GenderInferenceResult {
  gender: 'M' | 'F';
  confidence: number;
}

/**
 * Result from country inference (phone number)
 */
export interface CountryInferenceResult {
  country: string; // ISO alpha-2 (CO, MX, ES)
  countryName: string; // Full name (Colombia, México, España)
}

/**
 * Result from phone validation (E.164)
 */
export interface PhoneValidationResult {
  valid: boolean;
  e164: string | null; // Formatted phone number
  country?: string; // ISO alpha-2 code if detected
  countryName?: string; // Full country name if detected
}

/**
 * Extraction result from a single source (regex, heuristic, AI)
 */
export interface ExtractionSourceResult {
  source: 'regex' | 'heuristic' | 'ai';
  data: Partial<{
    fullName: string;
    firstName: string;
    lastName: string;
    email: string;
    gender: 'M' | 'F';
    city: string;
    alias: string;
  }>;
  confidence: number;
}
