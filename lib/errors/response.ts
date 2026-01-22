/**
 * @file Error Response Utilities for Next.js Route Handlers
 * @description Exports 4 functions and types
 * @module lib/errors/response
 * @exports createErrorResponse, createSuccessResponse, handleRouteError, toAppError
 */
/**
 * Error Response Utilities for Next.js Route Handlers
 * Edge Runtime Compatible
 *
 * Provides utilities to convert errors to standardized API responses
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { type AppError, InternalError, isAppError, ValidationError } from './AppError';

/**
 * Converts any error to AppError for consistent handling
 */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) return error;

  if (error instanceof ZodError) {
    return new ValidationError('Validation failed', {
      issues: error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
        code: e.code,
      })),
    });
  }

  if (error instanceof Error) {
    return new InternalError(error.message, {
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }

  return new InternalError('Unknown error occurred', {
    error: String(error),
  });
}

/**
 * Creates NextResponse with standardized error format
 */
export function createErrorResponse(error: AppError): NextResponse {
  console.error('[AppError]', {
    code: error.code,
    message: error.message,
    statusCode: error.statusCode,
    metadata: error.metadata,
  });

  return NextResponse.json(error.toJSON(), { status: error.statusCode });
}

/**
 * Main error handler for route handlers
 * Converts any error to AppError and creates response
 */
export function handleRouteError(error: unknown): NextResponse {
  const appError = toAppError(error);
  return createErrorResponse(appError);
}

/**
 * Creates standardized success response
 */
export function createSuccessResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ ok: true, data }, { status });
}
