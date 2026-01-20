/**
 * @file Client
 * @description Client implementation
 * @module lib/bird/client
 * @exports birdFetch
 */
import { BIRD_API_BASE, getBirdConfig } from './env';

interface BirdFetchOptions extends RequestInit {
  retryCount?: number;
}

async function doFetch(path: string, init: RequestInit) {
  const { accessKey } = getBirdConfig();
  const headers = new Headers(init.headers ?? {});

  if (!headers.has('Authorization')) {
    headers.set('Authorization', `AccessKey ${accessKey}`);
  }

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BIRD_API_BASE}${path}`, { ...init, headers });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Bird API error ${response.status}: ${text}`);
  }

  return response;
}

export async function birdFetch(path: string, options: BirdFetchOptions = {}) {
  const { retryCount = 0, ...init } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      return await doFetch(path, init);
    } catch (error) {
      lastError = error;
      if (attempt < retryCount) {
        const wait = 2 ** attempt * 100; // 100ms, 200ms, 400ms
        await new Promise((resolve) => setTimeout(resolve, wait));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Unknown Bird API error');
}
