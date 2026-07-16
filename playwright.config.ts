import { defineConfig, devices } from "@playwright/test";
import { loadProjectEnvironment } from "./lib/load-environment";

loadProjectEnvironment();

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node node_modules/next/dist/bin/next start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL_TEST ?? "",
      AUTH_SECRET: process.env.AUTH_SECRET ?? "e2e-only-auth-secret-at-least-32-characters",
      AUTH_URL: "http://localhost:3000",
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
