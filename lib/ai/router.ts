/**
 * @file Image Routing Table
 * @description API route handler
 * @module lib/ai/router
 * @exports ROUTE_TABLE, RouteConfig, adjustTimeoutForRemaining, getAllRoutes, getRouteForType
 */
/**
 * Image Routing Table
 * Model selection and timeout configuration based on image type
 */

import { GeminiModelId, type GeminiModelIdType } from '@/lib/ai/gateway';
import type { ImageType } from '@/lib/ai/schemas/classification';

/**
 * Route configuration for each image type
 */
export interface RouteConfig {
  modelId: GeminiModelIdType;
  timeoutMs: number;
  description: string;
}

/**
 * Routing table: maps image types to optimal model configurations
 *
 * Performance targets:
 * - photo: 4s (Gemini 2.0 Flash - fast general vision)
 * - invoice: 5s (Gemini 2.0 Flash - OCR + structure)
 * - document: 5.5s (Gemini 2.5 Flash - complex docs)
 * - unknown: 5.5s (Gemini 2.5 Flash - complex fallback)
 */
export const ROUTE_TABLE: Record<ImageType, RouteConfig> = {
  photo: {
    modelId: GeminiModelId.FLASH_2_0,
    timeoutMs: 4000,
    description: 'Fast photo processing for people, objects, scenes',
  },
  invoice: {
    modelId: GeminiModelId.FLASH_2_0,
    timeoutMs: 5000,
    description: 'Invoice OCR and structured data extraction',
  },
  document: {
    modelId: GeminiModelId.FLASH_2_5,
    timeoutMs: 5500,
    description: 'Complex document processing (cedulas, contracts)',
  },
  unknown: {
    modelId: GeminiModelId.FLASH_2_5,
    timeoutMs: 5500,
    description: 'Fallback processing for unclear images (assumes complex)',
  },
};

/**
 * Get route configuration for image type
 *
 * @param type - Classified image type
 * @returns Route configuration with model and timeout
 */
export function getRouteForType(type: ImageType): RouteConfig {
  return ROUTE_TABLE[type];
}

/**
 * Adjust timeout based on remaining time budget
 * Ensures we don't exceed total budget while respecting minimum processing time
 *
 * @param config - Original route configuration
 * @param remainingMs - Remaining time in milliseconds
 * @returns Adjusted route configuration with safe timeout
 */
export function adjustTimeoutForRemaining(config: RouteConfig, remainingMs: number): RouteConfig {
  // Need at least 500ms buffer for response serialization
  const maxTimeout = remainingMs - 500;

  // Minimum 2 seconds for reasonable processing
  const minTimeout = 2000;

  if (maxTimeout < minTimeout) {
    throw new Error(
      `Insufficient time remaining: ${remainingMs}ms available, need at least ${minTimeout + 500}ms`
    );
  }

  // Use configured timeout, but cap at remaining time
  const adjustedTimeout = Math.min(config.timeoutMs, maxTimeout);

  return {
    ...config,
    timeoutMs: adjustedTimeout,
  };
}

/**
 * Get all available routes for inspection
 */
export function getAllRoutes(): Record<ImageType, RouteConfig> {
  return ROUTE_TABLE;
}
