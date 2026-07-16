import { describe, expect, it } from "vitest";
import { getTestDatabaseUrl, serverEnvironmentSchema } from "@/lib/env";

describe("environment validation", () => {
  it("parses a safe runtime environment", () => {
    const result = serverEnvironmentSchema.parse({
      DATABASE_URL: "postgresql://user:pass@localhost:5432/dlms",
      AUTH_SECRET: "a-secret-with-at-least-thirty-two-characters",
    });
    expect(result.PHOTO_MAX_BYTES).toBe(5 * 1024 * 1024);
    expect(result.SEED_DEMO_USERS).toBe(false);
  });

  it("rejects a test database matching the runtime database", () => {
    const url = "postgresql://user:pass@localhost:5432/dlms";
    expect(() => getTestDatabaseUrl({ DATABASE_URL: url, DATABASE_URL_TEST: url })).toThrow(/must not point/);
  });

  it("allows a separately named test database", () => {
    expect(getTestDatabaseUrl({ DATABASE_URL: "postgresql://localhost/dlms", DATABASE_URL_TEST: "postgresql://localhost/dlms_test" })).toContain("dlms_test");
  });

  it("rejects a test URL whose database name is not visibly test-only", () => {
    expect(() => getTestDatabaseUrl({ DATABASE_URL_TEST: "postgresql://localhost/dlms" })).toThrow(/contain 'test'/);
  });
});
