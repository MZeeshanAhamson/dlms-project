import { migrate } from "drizzle-orm/postgres-js/migrator";
import { getTestDatabaseUrl } from "../lib/env";
import { openDatabase } from "../lib/db";
import { loadProjectEnvironment } from "../lib/load-environment";

loadProjectEnvironment();

const isTest = process.argv.includes("--test");
const url = isTest ? getTestDatabaseUrl() : process.env.DATABASE_URL;

if (!url) throw new Error("DATABASE_URL is required");
const databaseUrl = url;

async function main() {
  const { client, database } = openDatabase(databaseUrl);
  try {
    await migrate(database, { migrationsFolder: "drizzle" });
    console.log(`Migrated ${isTest ? "test" : "runtime"} database.`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
