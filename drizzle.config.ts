import { defineConfig } from "drizzle-kit";
import { loadProjectEnvironment } from "./lib/load-environment";

loadProjectEnvironment();

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_URL is required to run drizzle-kit");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
