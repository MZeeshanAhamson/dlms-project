import { getTestDatabaseUrl, serverEnvironmentSchema } from "../lib/env";
import { openDatabase } from "../lib/db";
import { seedDatabase } from "../lib/db/seed";
import { loadProjectEnvironment } from "../lib/load-environment";

loadProjectEnvironment();

const isTest = process.argv.includes("--test");
const parsed = serverEnvironmentSchema.partial().parse(process.env);
const url = isTest ? getTestDatabaseUrl() : parsed.DATABASE_URL;

if (!url) throw new Error("DATABASE_URL is required");
const databaseUrl = url;
if (process.env.NODE_ENV === "production" && parsed.SEED_DEMO_USERS) {
  throw new Error("Demo users cannot be seeded in production");
}

async function main() {
  const { client, database } = openDatabase(databaseUrl);
  try {
    await seedDatabase(database, {
      includeDemoUsers: isTest || Boolean(parsed.SEED_DEMO_USERS),
      demoPassword: parsed.DEMO_USER_PASSWORD,
    });
    console.log(`Seeded ${isTest ? "test" : "runtime"} database.`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
