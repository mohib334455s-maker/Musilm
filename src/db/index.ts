import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { isDemoMode } from "@/lib/demo";

/**
 * In demo / no-DATABASE_URL mode we never open a real Pool.
 * Pages and APIs must go through `@/lib/store-data` helpers instead of querying `db`.
 */
const demo = isDemoMode();
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

const databaseUrl =
  process.env.DATABASE_URL ||
  (isBuildPhase || demo ? "postgresql://demo:demo@127.0.0.1:5432/demo" : "");

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required. Set it in .env or enable demo mode by leaving it unset.",
  );
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

function createPool(): Pool {
  return new Pool({
    connectionString: databaseUrl,
    max: demo ? 1 : 10,
    connectionTimeoutMillis: demo || isBuildPhase ? 1 : 10_000,
    idleTimeoutMillis: 5_000,
  });
}

export const pool =
  demo
    ? (null as unknown as Pool)
    : (globalForDb.__arenaNextJsPostgresqlPool ?? createPool());

if (!demo && process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

/** Only safe to use when `!isDemoMode()`. Prefer `@/lib/store-data`. */
export const db = demo
  ? (new Proxy(
      {},
      {
        get() {
          throw new Error("Database disabled in demo mode — use @/lib/store-data");
        },
      },
    ) as ReturnType<typeof drizzle>)
  : drizzle(pool);
