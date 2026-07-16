import { migrate } from "drizzle-orm/postgres-js/migrator";
import { getTestDatabaseUrl } from "@/lib/env";
import { openDatabase } from "./index";
import { seedDatabase } from "./seed";

export async function resetTestDatabase() {
  const password = process.env.DEMO_USER_PASSWORD;
  if (!password || password.length < 12) throw new Error("DEMO_USER_PASSWORD must contain at least 12 characters");
  const { client, database } = openDatabase(getTestDatabaseUrl());
  try {
    await client.unsafe("drop schema if exists public cascade");
    await client.unsafe("drop schema if exists drizzle cascade");
    await client.unsafe("create schema public");
    await migrate(database, { migrationsFolder: "drizzle" });
    await seedDatabase(database, { includeDemoUsers: true, demoPassword: password });
  } finally {
    await client.end();
  }
}
