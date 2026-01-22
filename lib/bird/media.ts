/**
 * @file Bird Media Download
 * @description Exports 3 functions and types
 * @module lib/bird/media
 * @exports bufferToBase64, downloadMedia, getMimeType
 */
/**
 * Bird Media Download
 * Fetches media from Bird CDN with optional authentication
 * Edge Runtime compatible (uses Web APIs)
 */

/**
 * Download media from Bird CDN
 *
 * @param url - Media URL from Bird (e.g., {{messageImage}}, {{messageFile}}, {{messageAudio}})
 * @returns ArrayBuffer of media content
 * @throws Error if download fails or times out
 *
 * Edge Runtime compatible:
 * - Uses fetch (Web API)
 * - Returns ArrayBuffer (not Node.js Buffer)
 * - Timeout via AbortController
 *
 * @example
 * ```ts
 * const buffer = await downloadMedia("https://cdn.bird.com/image.jpg");
 * // buffer: ArrayBuffer with image data
 * ```
 */
export async function downloadMedia(url: string): Promise<ArrayBuffer> {
  const TIMEOUT_MS = 10000; // 10 seconds max download time (includes redirect handling)
  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB limit for Edge Runtime (128MB max memory)

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    // Bird media URL flow (confirmed via testing 2026-01-22):
    // 1. media.api.bird.com ALWAYS redirects to S3 (never serves directly)
    // 2. Initial request requires Authorization header (401 without it)
    // 3. Bird returns 302 redirect with Location header containing S3 presigned URL
    // 4. S3 presigned URL has auth in query params (X-Amz-Signature, etc.)
    // 5. MUST follow redirect WITHOUT Authorization header (S3 rejects dual auth)
    // 6. Edge Runtime does NOT drop Authorization on cross-origin redirects (non-spec-compliant)
    //
    // Solution: Manual redirect handling to control which requests get auth header
    const headers: Record<string, string> = {};

    const isPresignedUrl =
      url.includes('X-Amz-Algorithm') || url.includes('X-Amz-Signature');

    // Only add Authorization header for non-presigned Bird media URLs
    if (!isPresignedUrl && process.env.BIRD_ACCESS_KEY) {
      headers.Authorization = `AccessKey ${process.env.BIRD_ACCESS_KEY}`;
    }

    // Request with manual redirect handling
    let response = await fetch(url, {
      headers,
      signal: controller.signal,
      redirect: 'manual', // Prevent automatic redirect following
    });

    // Handle redirect manually (if Bird returns 302/307)
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('Location');
      if (!location) {
        throw new Error('Redirect response missing Location header');
      }

      // Follow redirect WITHOUT Authorization header
      // S3 presigned URL has auth in query params, adding header causes 400 error
      response = await fetch(location, {
        signal: controller.signal,
        redirect: 'manual', // In case of chained redirects
      });
    }

    // Safety check: Validate Content-Length before reading body
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      const sizeBytes = parseInt(contentLength, 10);
      if (sizeBytes > MAX_FILE_SIZE) {
        throw new Error(
          `File size (${(sizeBytes / 1024 / 1024).toFixed(2)}MB) exceeds limit of 25MB`
        );
      }
    }

    if (!response.ok) {
      // Enhanced error with full URL and response body
      let errorBody = '';
      try {
        errorBody = await response.text();
      } catch {
        // Ignore if body can't be read
      }
      throw new Error(
        `Media download failed: ${response.status} ${response.statusText}. URL: ${url}. Body: ${errorBody}`
      );
    }

    const buffer = await response.arrayBuffer();

    if (buffer.byteLength === 0) {
      throw new Error('Downloaded media is empty');
    }

    // Secondary safety check: Verify actual buffer size
    if (buffer.byteLength > MAX_FILE_SIZE) {
      throw new Error(
        `File size (${(buffer.byteLength / 1024 / 1024).toFixed(2)}MB) exceeds limit of 25MB`
      );
    }

    return buffer;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Media download timeout after ${TIMEOUT_MS}ms`);
      }
      throw error;
    }

    throw new Error('Unknown error during media download');
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Convert ArrayBuffer to Base64 string (for AI SDK vision models)
 *
 * @param buffer - ArrayBuffer from downloadMedia
 * @returns Base64 encoded string
 *
 * @example
 * ```ts
 * const base64 = bufferToBase64(buffer);
 * // base64: "/9j/4AAQSkZJRg..." (for image/jpeg)
 * ```
 */
export function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const CHUNK_SIZE = 8192; // 8KB chunks (well below 65K argument limit)
  let binary = '';

  // Process in chunks to avoid "Maximum call stack size exceeded"
  // Spread operator has ~65K argument limit in V8/Edge Runtime
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, i + CHUNK_SIZE);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

/**
 * MIME type mapping for file extensions
 */
const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  pdf: 'application/pdf',
  mp3: 'audio/mpeg',
  mp4: 'audio/mp4',
  ogg: 'audio/ogg',
  wav: 'audio/wav',
  m4a: 'audio/m4a',
};

/**
 * Get media MIME type from URL or file extension
 *
 * Handles URLs with query parameters (e.g., image.jpg?v=123)
 *
 * @param url - Media URL
 * @returns MIME type string
 *
 * @example
 * ```ts
 * const mime = getMimeType("https://cdn.bird.com/photo.jpg");
 * // mime: "image/jpeg"
 * ```
 */
export function getMimeType(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const ext = pathname.split('.').pop()?.toLowerCase();
    return MIME_TYPES[ext ?? ''] ?? 'application/octet-stream';
  } catch {
    // Fallback for invalid URLs - extract extension directly
    const ext = url.split('.').pop()?.toLowerCase();
    return MIME_TYPES[ext ?? ''] ?? 'application/octet-stream';
  }
}
