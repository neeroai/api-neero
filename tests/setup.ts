// Vitest test setup for Edge Runtime compatibility
import { afterEach, beforeAll } from 'vitest';

// Mock environment variables
beforeAll(() => {
  // NODE_ENV is set by vitest automatically
  process.env.AI_GATEWAY_API_KEY = 'test-key';
  process.env.GROQ_API_KEY = 'test-groq-key';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
});

// Mock global fetch for offline testing
globalThis.fetch = async (input: RequestInfo | URL, _init?: RequestInit) => {
  throw new Error(`Network request blocked in tests: ${input.toString()}`);
};

afterEach(() => {
  // Clear mocks after each test
});
