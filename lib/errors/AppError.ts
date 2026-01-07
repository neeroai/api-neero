/**
 * AppError - Edge Runtime Compatible Error Class
 * Provides consistent error handling across all API routes
 *
 * Pattern adopted from whatsapp-api/src/errors/AppError.ts
 * Adapted for Edge Runtime and Next.js serverless functions
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly metadata?: Record<string, unknown>;

  constructor(message: string, statusCode = 400, metadata?: Record<string, unknown>) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = this.generateErrorCode(statusCode);
    this.metadata = metadata;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  private generateErrorCode(status: number): string {
    const codeMap: Record<number, string> = {
      400: 'VALIDATION_ERROR',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      408: 'TIMEOUT',
      429: 'RATE_LIMIT_EXCEEDED',
      500: 'INTERNAL_ERROR',
      503: 'SERVICE_UNAVAILABLE',
    };
    return codeMap[status] || 'UNKNOWN_ERROR';
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        ...(this.metadata && { metadata: this.metadata }),
      },
    };
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Common error constructors for typical API scenarios
 */

export class ValidationError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 400, metadata);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', metadata?: Record<string, unknown>) {
    super(message, 401, metadata);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', metadata?: Record<string, unknown>) {
    super(message, 404, metadata);
  }
}

export class TimeoutError extends AppError {
  constructor(message = 'Request timeout', metadata?: Record<string, unknown>) {
    super(message, 408, metadata);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded', metadata?: Record<string, unknown>) {
    super(message, 429, metadata);
  }
}

export class InternalError extends AppError {
  constructor(message = 'Internal server error', metadata?: Record<string, unknown>) {
    super(message, 500, metadata);
  }
}
