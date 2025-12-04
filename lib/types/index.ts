/**
 * Type Re-exports
 * Centralized type imports for convenience
 *
 * Re-export Bird Actions types for easy access
 */

export type {
  AudioData,
  BirdActionContext,
  BirdActionErrorResponse,
  BirdActionRequest,
  BirdActionResponse,
  BirdActionSuccessResponse,
  DocumentData,
  ErrorCode,
  ImageData,
  MediaType,
  ResponseData,
} from '@/lib/bird/types';

export { isErrorResponse, isSuccessResponse } from '@/lib/bird/types';
