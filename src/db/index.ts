import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

/**
 * During `next build` (e.g. on Vercel) DATABASE_URL may be unset while
 * Next still imports this module for layout / not-found. Defer the real
 * requirement to first query at runtime.
 */
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

const databaseUrl =
  process.env.DATABASE_URL ||
  (isBuildPhase ? "postgresql://build:build@127.0.0.1:5432/build" : "");

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required. Set it in .env locally or in Vercel → Project Settings → Environment Variables.",
  );
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
    max: 10,
    // Fail fast during build if anything accidentally queries
    connectionTimeoutMillis: isBuildPhase ? 1 : 10_000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
