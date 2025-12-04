/**
 * 9-Second Budget Management
 * Tracks time budget for Bird Actions API to ensure < 9 second response
 */

/**
 * Timeout error thrown when budget exceeded
 */
export class TimeoutBudgetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutBudgetError';
  }
}

/**
 * Time budget manager for request processing
 */
export class TimeBudget {
  private startTime: number;
  private totalBudgetMs: number;
  private bufferMs: number;

  /**
   * Create a new time budget tracker
   *
   * @param totalBudgetMs - Total budget in milliseconds (default: 8500ms = 8.5s)
   * @param bufferMs - Safety buffer before actual deadline (default: 500ms)
   */
  constructor(totalBudgetMs = 8500, bufferMs = 500) {
    this.startTime = Date.now();
    this.totalBudgetMs = totalBudgetMs;
    this.bufferMs = bufferMs;
  }

  /**
   * Get elapsed time in milliseconds
   */
  getElapsedMs(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Get elapsed time in seconds (formatted string)
   */
  getElapsedSeconds(): string {
    return (this.getElapsedMs() / 1000).toFixed(1);
  }

  /**
   * Get remaining time in milliseconds
   */
  getRemainingMs(): number {
    return this.totalBudgetMs - this.getElapsedMs();
  }

  /**
   * Get remaining time in seconds (formatted string)
   */
  getRemainingSeconds(): string {
    return Math.max(0, this.getRemainingMs() / 1000).toFixed(1);
  }

  /**
   * Check if budget is exceeded
   */
  isExceeded(): boolean {
    return this.getRemainingMs() <= 0;
  }

  /**
   * Check if time is running low (within buffer)
   */
  isRunningLow(): boolean {
    return this.getRemainingMs() <= this.bufferMs;
  }

  /**
   * Throw error if budget exceeded
   *
   * @throws TimeoutBudgetError if budget exceeded
   */
  checkBudget(): void {
    if (this.isExceeded()) {
      throw new TimeoutBudgetError(
        `Time budget exceeded: ${this.getElapsedSeconds()}s elapsed, ${this.totalBudgetMs / 1000}s allowed`
      );
    }
  }

  /**
   * Get processing time summary
   */
  getSummary(): {
    elapsed: string;
    remaining: string;
    isExceeded: boolean;
    isRunningLow: boolean;
  } {
    return {
      elapsed: `${this.getElapsedSeconds()}s`,
      remaining: `${this.getRemainingSeconds()}s`,
      isExceeded: this.isExceeded(),
      isRunningLow: this.isRunningLow(),
    };
  }
}

/**
 * Simple function-based timeout tracking (alternative to class)
 */
export interface TimeTracker {
  startTime: number;
  budgetMs: number;
}

/**
 * Start time tracking
 *
 * @param budgetMs - Total budget in milliseconds (default: 8500ms)
 * @returns TimeTracker object
 */
export function startTimeTracking(budgetMs = 8500): TimeTracker {
  return {
    startTime: Date.now(),
    budgetMs,
  };
}

/**
 * Get elapsed time in milliseconds
 */
export function getElapsed(tracker: TimeTracker): number {
  return Date.now() - tracker.startTime;
}

/**
 * Get remaining time in milliseconds
 */
export function getRemaining(tracker: TimeTracker): number {
  return tracker.budgetMs - getElapsed(tracker);
}

/**
 * Check if budget exceeded and throw error
 *
 * @throws TimeoutBudgetError if budget exceeded
 */
export function checkTimeout(tracker: TimeTracker): void {
  const remaining = getRemaining(tracker);
  if (remaining <= 0) {
    const elapsed = (getElapsed(tracker) / 1000).toFixed(1);
    throw new TimeoutBudgetError(
      `Time budget exceeded: ${elapsed}s elapsed, ${tracker.budgetMs / 1000}s allowed`
    );
  }
}

/**
 * Format elapsed time as string (e.g., "2.3s")
 */
export function formatElapsed(tracker: TimeTracker): string {
  return `${(getElapsed(tracker) / 1000).toFixed(1)}s`;
}
