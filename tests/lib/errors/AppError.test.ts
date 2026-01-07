import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  AppError,
  InternalError,
  NotFoundError,
  RateLimitError,
  TimeoutError,
  UnauthorizedError,
  ValidationError,
} from '@/lib/errors/AppError';
import { toAppError } from '@/lib/errors/response';

describe('AppError', () => {
  describe('Base AppError', () => {
    it('should create error with message and default statusCode', () => {
      const error = new AppError('Test error');

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.name).toBe('AppError');
    });

    it('should create error with custom statusCode', () => {
      const error = new AppError('Test error', 500);

      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
    });

    it('should create error with metadata', () => {
      const metadata = { field: 'email', value: 'invalid' };
      const error = new AppError('Test error', 400, metadata);

      expect(error.metadata).toEqual(metadata);
    });

    it('should generate correct error codes for status codes', () => {
      expect(new AppError('', 400).code).toBe('VALIDATION_ERROR');
      expect(new AppError('', 401).code).toBe('UNAUTHORIZED');
      expect(new AppError('', 403).code).toBe('FORBIDDEN');
      expect(new AppError('', 404).code).toBe('NOT_FOUND');
      expect(new AppError('', 408).code).toBe('TIMEOUT');
      expect(new AppError('', 429).code).toBe('RATE_LIMIT_EXCEEDED');
      expect(new AppError('', 500).code).toBe('INTERNAL_ERROR');
      expect(new AppError('', 503).code).toBe('SERVICE_UNAVAILABLE');
      expect(new AppError('', 999).code).toBe('UNKNOWN_ERROR');
    });

    it('should convert to JSON correctly', () => {
      const error = new AppError('Test error', 400, { field: 'email' });
      const json = error.toJSON();

      expect(json).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Test error',
          statusCode: 400,
          metadata: { field: 'email' },
        },
      });
    });

    it('should convert to JSON without metadata if not provided', () => {
      const error = new AppError('Test error', 400);
      const json = error.toJSON();

      expect(json).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Test error',
          statusCode: 400,
        },
      });
    });
  });

  describe('Specialized Error Classes', () => {
    it('should create ValidationError with statusCode 400', () => {
      const error = new ValidationError('Invalid input');

      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.name).toBe('AppError');
    });

    it('should create UnauthorizedError with statusCode 401', () => {
      const error = new UnauthorizedError('Missing token');

      expect(error.message).toBe('Missing token');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.name).toBe('AppError');
    });

    it('should create NotFoundError with statusCode 404', () => {
      const error = new NotFoundError('Resource not found');

      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.name).toBe('AppError');
    });

    it('should create TimeoutError with statusCode 408', () => {
      const error = new TimeoutError('Request timed out');

      expect(error.message).toBe('Request timed out');
      expect(error.statusCode).toBe(408);
      expect(error.code).toBe('TIMEOUT');
      expect(error.name).toBe('AppError');
    });

    it('should create RateLimitError with statusCode 429', () => {
      const error = new RateLimitError('Too many requests');

      expect(error.message).toBe('Too many requests');
      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(error.name).toBe('AppError');
    });

    it('should create InternalError with statusCode 500', () => {
      const error = new InternalError('Server error');

      expect(error.message).toBe('Server error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.name).toBe('AppError');
    });
  });

  describe('Error Conversion', () => {
    it('should return AppError unchanged', () => {
      const originalError = new ValidationError('Invalid input', { field: 'email' });
      const converted = toAppError(originalError);

      expect(converted).toBe(originalError);
      expect(converted.message).toBe('Invalid input');
      expect(converted.statusCode).toBe(400);
      expect(converted.metadata).toEqual({ field: 'email' });
    });

    it('should convert ZodError to ValidationError', () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
      });

      try {
        schema.parse({ email: 'invalid', age: 15 });
      } catch (error) {
        const converted = toAppError(error);

        expect(converted).toBeInstanceOf(ValidationError);
        expect(converted.message).toBe('Validation failed');
        expect(converted.statusCode).toBe(400);
        expect(converted.metadata).toHaveProperty('issues');
        expect(Array.isArray(converted.metadata?.issues)).toBe(true);
        expect((converted.metadata?.issues as any[]).length).toBeGreaterThan(0);

        const issues = converted.metadata?.issues as any[];
        expect(issues[0]).toHaveProperty('path');
        expect(issues[0]).toHaveProperty('message');
        expect(issues[0]).toHaveProperty('code');
      }
    });

    it('should convert standard Error to InternalError', () => {
      const originalError = new Error('Something went wrong');
      const converted = toAppError(originalError);

      expect(converted).toBeInstanceOf(InternalError);
      expect(converted.message).toBe('Something went wrong');
      expect(converted.statusCode).toBe(500);
      expect(converted.metadata).toHaveProperty('name');
      expect((converted.metadata as any).name).toBe('Error');
    });

    it('should convert unknown error to InternalError', () => {
      const converted = toAppError('string error');

      expect(converted).toBeInstanceOf(InternalError);
      expect(converted.message).toBe('Unknown error occurred');
      expect(converted.statusCode).toBe(500);
      expect(converted.metadata).toHaveProperty('error');
      expect((converted.metadata as any).error).toBe('string error');
    });

    it('should preserve error stack trace', () => {
      const originalError = new Error('Test error');
      const converted = toAppError(originalError);

      expect(converted.stack).toBeDefined();
      expect(converted.stack).toContain('Test error');
    });
  });

  describe('Error Serialization', () => {
    it('should serialize ValidationError with metadata', () => {
      const error = new ValidationError('Invalid input', {
        field: 'email',
        expected: 'string',
        received: 'number',
      });

      const json = error.toJSON();

      expect(json.error.code).toBe('VALIDATION_ERROR');
      expect(json.error.message).toBe('Invalid input');
      expect(json.error.statusCode).toBe(400);
      expect(json.error.metadata).toEqual({
        field: 'email',
        expected: 'string',
        received: 'number',
      });
    });

    it('should serialize TimeoutError with budget metadata', () => {
      const error = new TimeoutError('Request exceeded time budget', {
        budgetMs: 8500,
        elapsedMs: 9000,
      });

      const json = error.toJSON();

      expect(json.error.code).toBe('TIMEOUT');
      expect(json.error.metadata).toEqual({
        budgetMs: 8500,
        elapsedMs: 9000,
      });
    });

    it('should serialize nested metadata', () => {
      const error = new InternalError('Database error', {
        query: 'SELECT * FROM users',
        details: {
          table: 'users',
          operation: 'select',
          error: 'connection timeout',
        },
      });

      const json = error.toJSON();

      expect(json.error.metadata).toHaveProperty('query');
      expect(json.error.metadata).toHaveProperty('details');
      expect((json.error.metadata as any).details).toEqual({
        table: 'users',
        operation: 'select',
        error: 'connection timeout',
      });
    });
  });
});
