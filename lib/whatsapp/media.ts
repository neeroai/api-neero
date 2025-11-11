/**
 * WhatsApp Media Utilities - Edge Runtime Compatible
 * Download, upload, and validate media files (images, audio, video, documents)
 */

const BASE_URL = 'https://graph.facebook.com/v23.0';

/**
 * Media size limits (WhatsApp Cloud API constraints)
 */
export const MEDIA_LIMITS = {
  audio: 16 * 1024 * 1024, // 16 MB
  image: 5 * 1024 * 1024, // 5 MB
  video: 16 * 1024 * 1024, // 16 MB
  document: 100 * 1024 * 1024, // 100 MB
} as const;

/**
 * Supported media MIME types
 */
export const SUPPORTED_MIME_TYPES = {
  audio: ['audio/aac', 'audio/mp4', 'audio/mpeg', 'audio/amr', 'audio/ogg'],
  image: ['image/jpeg', 'image/png'],
  video: ['video/mp4', 'video/3gpp'],
  document: [
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/msword',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
} as const;

/**
 * Media download response
 */
export interface MediaDownloadResult {
  buffer: ArrayBuffer;
  mimeType: string;
  fileSize: number;
  url: string;
}

/**
 * Media upload response
 */
export interface MediaUploadResult {
  id: string;
}

/**
 * Get media URL from media ID
 * WhatsApp provides media ID in webhooks, need to exchange for download URL
 * @param mediaId - Media ID from webhook
 * @returns Media URL and MIME type
 * @throws Error if API call fails
 */
export async function getMediaUrl(mediaId: string): Promise<{
  url: string;
  mime_type: string;
  sha256: string;
  file_size: number;
}> {
  const token = process.env.WHATSAPP_TOKEN;

  if (!token) {
    throw new Error('WHATSAPP_TOKEN not configured');
  }

  const response = await fetch(`${BASE_URL}/${mediaId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get media URL: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Download media from WhatsApp
 * @param mediaId - Media ID from webhook
 * @returns Media buffer, MIME type, and metadata
 * @throws Error if download fails or file too large
 */
export async function downloadMedia(
  mediaId: string
): Promise<MediaDownloadResult> {
  const token = process.env.WHATSAPP_TOKEN;

  if (!token) {
    throw new Error('WHATSAPP_TOKEN not configured');
  }

  const mediaInfo = await getMediaUrl(mediaId);

  const response = await fetch(mediaInfo.url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download media: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();

  if (buffer.byteLength > MEDIA_LIMITS.document) {
    throw new Error(
      `Media file too large: ${buffer.byteLength} bytes (max ${MEDIA_LIMITS.document})`
    );
  }

  return {
    buffer,
    mimeType: mediaInfo.mime_type,
    fileSize: buffer.byteLength,
    url: mediaInfo.url,
  };
}

/**
 * Upload media to WhatsApp
 * @param file - File buffer to upload
 * @param mimeType - MIME type of the file
 * @param filename - Optional filename
 * @returns Media ID for sending messages
 * @throws Error if upload fails or invalid MIME type
 */
export async function uploadMedia(
  file: ArrayBuffer,
  mimeType: string,
  filename?: string
): Promise<MediaUploadResult> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  if (!token || !phoneId) {
    throw new Error('WHATSAPP_TOKEN or WHATSAPP_PHONE_ID not configured');
  }

  const mediaType = getMediaType(mimeType);
  if (!mediaType) {
    throw new Error(`Unsupported MIME type: ${mimeType}`);
  }

  const maxSize = MEDIA_LIMITS[mediaType];
  if (file.byteLength > maxSize) {
    throw new Error(
      `File too large: ${file.byteLength} bytes (max ${maxSize} for ${mediaType})`
    );
  }

  const formData = new FormData();
  formData.append('messaging_product', 'whatsapp');
  formData.append('file', new Blob([file], { type: mimeType }), filename);

  const response = await fetch(`${BASE_URL}/${phoneId}/media`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload media: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Validate media URL format
 * @param url - URL to validate
 * @returns True if valid, false otherwise
 */
export function validateMediaUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      (parsed.hostname.endsWith('.facebook.com') ||
        parsed.hostname.endsWith('.whatsapp.net'))
    );
  } catch {
    return false;
  }
}

/**
 * Get media type from MIME type
 * @param mimeType - MIME type string
 * @returns Media type or null if unsupported
 */
function getMediaType(
  mimeType: string
): 'audio' | 'image' | 'video' | 'document' | null {
  for (const [type, mimes] of Object.entries(SUPPORTED_MIME_TYPES)) {
    if (mimes.includes(mimeType as never)) {
      return type as 'audio' | 'image' | 'video' | 'document';
    }
  }
  return null;
}

/**
 * Validate media file
 * @param buffer - File buffer
 * @param mimeType - MIME type
 * @returns Validation result with error message if invalid
 */
export function validateMedia(
  buffer: ArrayBuffer,
  mimeType: string
): { valid: boolean; error?: string } {
  const mediaType = getMediaType(mimeType);

  if (!mediaType) {
    return { valid: false, error: `Unsupported MIME type: ${mimeType}` };
  }

  const maxSize = MEDIA_LIMITS[mediaType];
  if (buffer.byteLength > maxSize) {
    return {
      valid: false,
      error: `File too large: ${buffer.byteLength} bytes (max ${maxSize} for ${mediaType})`,
    };
  }

  return { valid: true };
}
