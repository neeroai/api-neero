/**
 * Rate Limiter - Token Bucket Algorithm (Edge Runtime Compatible)
 * Enforces WhatsApp Cloud API rate limit of 250 messages/second
 * In-memory implementation suitable for single-instance deployments
 */

/**
 * Token bucket configuration
 */
interface BucketConfig {
  capacity: number;
  refillRate: number;
  refillInterval: number;
}

/**
 * Token bucket state
 */
interface Bucket {
  tokens: number;
  lastRefill: number;
}

/**
 * Token bucket rate limiter
 * Implements token bucket algorithm for rate limiting
 * Default: 250 messages/second (WhatsApp Cloud API limit)
 *
 * How it works:
 * - Bucket starts with N tokens (capacity)
 * - Each message consumes 1 token
 * - Tokens refill at R tokens per second
 * - If no tokens available, request is rate limited
 *
 * @example
 * const limiter = new RateLimiter(250, 250);
 * if (limiter.checkLimit(userId)) {
 *   await sendMessage(userId, text);
 * } else {
 *   console.log('Rate limited');
 * }
 */
export class RateLimiter {
  private buckets: Map<string, Bucket> = new Map();
  private config: BucketConfig;

  /**
   * Create rate limiter with token bucket algorithm
   * @param capacity - Max tokens in bucket (burst capacity)
   * @param refillRate - Tokens added per second (sustained rate)
   * @param refillInterval - Milliseconds between refills (default 1000)
   */
  constructor(
    capacity: number = 250,
    refillRate: number = 250,
    refillInterval: number = 1000
  ) {
    this.config = {
      capacity,
      refillRate,
      refillInterval,
    };
  }

  /**
   * Check if user can send message (consumes 1 token if available)
   * @param userId - User identifier (phone number or WhatsApp ID)
   * @returns True if allowed, false if rate limited
   */
  checkLimit(userId: string): boolean {
    const bucket = this.getBucket(userId);
    this.refillBucket(bucket);

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }

    return false;
  }

  /**
   * Get available tokens for user (without consuming)
   * @param userId - User identifier
   * @returns Number of available tokens
   */
  getAvailableTokens(userId: string): number {
    const bucket = this.getBucket(userId);
    this.refillBucket(bucket);
    return Math.floor(bucket.tokens);
  }

  /**
   * Reset rate limit for user (replenish tokens)
   * @param userId - User identifier
   */
  resetLimit(userId: string): void {
    this.buckets.set(userId, {
      tokens: this.config.capacity,
      lastRefill: Date.now(),
    });
  }

  /**
   * Clear all rate limit data
   * Useful for testing or periodic cleanup
   */
  clearAll(): void {
    this.buckets.clear();
  }

  /**
   * Get or create bucket for user
   */
  private getBucket(userId: string): Bucket {
    let bucket = this.buckets.get(userId);

    if (!bucket) {
      bucket = {
        tokens: this.config.capacity,
        lastRefill: Date.now(),
      };
      this.buckets.set(userId, bucket);
    }

    return bucket;
  }

  /**
   * Refill bucket based on elapsed time
   * Tokens refill at configured rate (e.g., 250 tokens/second)
   */
  private refillBucket(bucket: Bucket): void {
    const now = Date.now();
    const elapsed = now - bucket.lastRefill;

    if (elapsed >= this.config.refillInterval) {
      const tokensToAdd =
        (elapsed / this.config.refillInterval) * this.config.refillRate;

      bucket.tokens = Math.min(
        this.config.capacity,
        bucket.tokens + tokensToAdd
      );
      bucket.lastRefill = now;
    }
  }
}

/**
 * Global rate limiter instance (250 messages/second default)
 * Use this for standard WhatsApp Cloud API rate limiting
 */
export const globalRateLimiter = new RateLimiter(250, 250);

/**
 * Rate limit middleware helper
 * Returns 429 response if rate limited
 * @param userId - User identifier
 * @param limiter - Rate limiter instance (optional, uses global by default)
 * @returns Null if allowed, Response if rate limited
 */
export function checkRateLimit(
  userId: string,
  limiter: RateLimiter = globalRateLimiter
): Response | null {
  if (!limiter.checkLimit(userId)) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        retry_after: 1,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '1',
        },
      }
    );
  }

  return null;
}
