import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getServerEnvironment } from "@/lib/env";
import * as schema from "./schema";

type Database = ReturnType<typeof createDatabase>;

function createDatabase(url = getServerEnvironment().DATABASE_URL) {
  const client = postgres(url, {
    max: process.env.NODE_ENV === "development" ? 5 : 1,
    prepare: false,
  });
  return drizzle(client, { schema });
}

const globalDatabase = globalThis as typeof globalThis & { dlmsDatabase?: Database };

export function getDatabase() {
  globalDatabase.dlmsDatabase ??= createDatabase();
  return globalDatabase.dlmsDatabase;
}

export { createDatabase };
export type { Database };

export function openDatabase(url: string) {
  const client = postgres(url, { max: 1, prepare: false });
  return { client, database: drizzle(client, { schema }) };
}
