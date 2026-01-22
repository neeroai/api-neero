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
  const TIMEOUT_MS = 1000; // 1 second max download time
  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB limit for Edge Runtime (128MB max memory)

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    // Bird media URLs are S3 presigned URLs with auth in query params
    // Adding Authorization header causes AWS error: "Only one auth mechanism allowed"
    // See: docs/bird/bird-conversations-api-capabilities.md L134
    const headers: Record<string, string> = {};

    const response = await fetch(url, {
      headers,
      signal: controller.signal,
    });

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

    clearTimeout(timeoutId);

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
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Media download timeout after ${TIMEOUT_MS}ms`);
      }
      throw error;
    }

    throw new Error('Unknown error during media download');
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
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i] as number);
  }
  return btoa(binary);
}

/**
 * Get media MIME type from URL or file extension
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
  const ext = url.split('.').pop()?.toLowerCase();

  const mimeTypes: Record<string, string> = {
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

  return mimeTypes[ext ?? ''] ?? 'application/octet-stream';
}
