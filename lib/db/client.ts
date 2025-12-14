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

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = neon(process.env.DATABASE_URL);

/**
 * Drizzle ORM instance with Neon HTTP client
 * Provides type-safe queries with TypeScript inference
 */
export const db = drizzle(sql as Parameters<typeof drizzle>[0], { schema });

/**
 * Raw SQL executor for custom queries
 * Use sparingly - prefer Drizzle ORM for type safety
 */
export { sql };
