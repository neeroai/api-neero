import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

/**
 * Neon PostgreSQL client for Edge Runtime
 *
 * Uses HTTP-based connection (no TCP) for Vercel Edge compatibility
 * Latency: ~50ms p95 from Vercel Edge Network
 *
 * Environment variable required: DATABASE_URL
 * Format: postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/db?sslmode=require
 */

let _sql: ReturnType<typeof neon> | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function initializeDb() {
  if (!_sql || !_db) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    _sql = neon(process.env.DATABASE_URL);
    _db = drizzle(_sql as Parameters<typeof drizzle>[0], { schema });
  }
}

/**
 * Drizzle ORM instance with Neon HTTP client
 * Provides type-safe queries with TypeScript inference
 */
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    initializeDb();
    return (_db as any)[prop];
  },
});

/**
 * Raw SQL executor for custom queries
 * Use sparingly - prefer Drizzle ORM for type safety
 */
export const sql = new Proxy({} as ReturnType<typeof neon>, {
  get(_target, prop) {
    initializeDb();
    return (_sql as any)[prop];
  },
  apply(_target, _thisArg, args) {
    initializeDb();
    return (_sql as any)(...args);
  },
});
