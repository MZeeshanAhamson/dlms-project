import { z } from "zod";

const booleanString = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

export const serverEnvironmentSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  AUTH_TRUST_HOST: booleanString.default(true),
  S3_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().min(1).default("us-east-1"),
  S3_BUCKET: z.string().min(1).optional(),
  S3_ACCESS_KEY_ID: z.string().min(1).optional(),
  S3_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  S3_FORCE_PATH_STYLE: booleanString.default(false),
  PHOTO_MAX_BYTES: z.coerce.number().int().positive().default(5 * 1024 * 1024),
  DOCUMENT_MAX_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024),
  SEED_DEMO_USERS: booleanString.default(false),
  DEMO_USER_PASSWORD: z.string().min(12).optional().or(z.literal("")),
});

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

export const storageEnvironmentSchema = z.object({
  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_FORCE_PATH_STYLE: z.boolean(),
  PHOTO_MAX_BYTES: z.number().int().positive(),
  DOCUMENT_MAX_BYTES: z.number().int().positive(),
});

export function getStorageEnvironment() {
  return storageEnvironmentSchema.parse(getServerEnvironment());
}

let cachedEnvironment: ServerEnvironment | undefined;

export function getServerEnvironment(): ServerEnvironment {
  cachedEnvironment ??= serverEnvironmentSchema.parse(process.env);
  return cachedEnvironment;
}

export function getTestDatabaseUrl(environment: Record<string, string | undefined> = process.env): string {
  const result = z
    .object({
      DATABASE_URL: z.string().url().optional(),
      DATABASE_URL_TEST: z.string().url(),
    })
    .parse(environment);

  if (result.DATABASE_URL && normalizeUrl(result.DATABASE_URL) === normalizeUrl(result.DATABASE_URL_TEST)) {
    throw new Error("DATABASE_URL_TEST must not point to DATABASE_URL");
  }
  if (!new URL(result.DATABASE_URL_TEST).pathname.toLowerCase().includes("test")) {
    throw new Error("DATABASE_URL_TEST database name must contain 'test'");
  }

  return result.DATABASE_URL_TEST;
}

function normalizeUrl(value: string) {
  const url = new URL(value);
  url.password = "";
  url.username = "";
  url.search = "";
  url.hash = "";
  return url.toString();
}

export function resetEnvironmentCacheForTests() {
  cachedEnvironment = undefined;
}
