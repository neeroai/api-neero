/**
 * WhatsApp Business API Utilities - Barrel Export
 * Edge Runtime compatible utilities for WhatsApp Cloud API v23.0
 */

export {
  sendTextMessage,
  sendButtonMessage,
  sendListMessage,
  type Button,
  type Section,
} from './messaging';

export {
  validateSignature,
  extractMessages,
  isDuplicateMessage,
  extractPhoneNumberId,
  extractContact,
} from './webhook';

export {
  downloadMedia,
  uploadMedia,
  getMediaUrl,
  validateMediaUrl,
  validateMedia,
  MEDIA_LIMITS,
  SUPPORTED_MIME_TYPES,
  type MediaDownloadResult,
  type MediaUploadResult,
} from './media';

export {
  normalizeMessage,
  extractTextContent,
  requiresMediaDownload,
  formatTimestamp,
  type NormalizedMessage,
} from './normalization';

export {
  RateLimiter,
  globalRateLimiter,
  checkRateLimit,
} from './rate-limit';
