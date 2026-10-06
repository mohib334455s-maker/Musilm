import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const databaseDir = resolve(".pgdata");
const port = Number(process.env.PG_PORT || 5433);
const user = "postgres";
const password = "postgres";
const dbName = "app_db";

const pg = new EmbeddedPostgres({
  databaseDir,
  user,
  password,
  port,
  persistent: true,
  initdbFlags: ["--encoding=UTF8", "--locale=C", "--lc-collate=C", "--lc-ctype=C"],
});

async function main() {
  if (!existsSync(databaseDir)) {
    console.log("Initializing local Postgres cluster…");
    await pg.initialise();
  }

  console.log(`Starting Postgres on port ${port}…`);
  await pg.start();

  try {
    await pg.createDatabase(dbName);
    console.log(`Database "${dbName}" ready.`);
  } catch (err) {
    const msg = String(err?.message || err);
    if (/already exists/i.test(msg)) {
      console.log(`Database "${dbName}" already exists.`);
    } else {
      console.warn("createDatabase note:", msg);
    }
  }

  console.log(`DATABASE_URL=postgresql://${user}:${password}@127.0.0.1:${port}/${dbName}`);
  console.log("Local database is running. Keep this terminal open.");

  const stop = async () => {
    console.log("\nStopping Postgres…");
    try {
      await pg.stop();
    } catch {
      /* ignore */
    }
    process.exit(0);
  };

  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  // Keep process alive
  await new Promise(() => {});
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
