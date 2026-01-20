import { describe, it, expect } from 'vitest';
import { AIExtractionSchema } from '../schemas';

describe('AIExtractionSchema email test', () => {
  it('validates a real email', () => {
    const extraction = {
      fullName: 'Test User',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@gmail.com',
      confidence: 0.9,
    };

    const result = AIExtractionSchema.safeParse(extraction);
    if (!result.success) {
      console.error('Errors:', JSON.stringify(result.error.errors, null, 2));
    }
    expect(result.success).toBe(true);
  });
});
