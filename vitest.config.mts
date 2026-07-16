import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { loadProjectEnvironment } from "./lib/load-environment";

loadProjectEnvironment();

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    clearMocks: true,
  },
});
