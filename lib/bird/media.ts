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
 */
export async function downloadMedia(url: string): Promise<ArrayBuffer> {
  const TIMEOUT_MS = 1000; // 1 second max download time

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    // Conditional authentication based on BIRD_ACCESS_KEY
    const headers: Record<string, string> = {};
    if (process.env.BIRD_ACCESS_KEY) {
      headers.Authorization = `AccessKey ${process.env.BIRD_ACCESS_KEY}`;
    }

    const response = await fetch(url, {
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Media download failed: ${response.status} ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();

    if (buffer.byteLength === 0) {
      throw new Error('Downloaded media is empty');
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
