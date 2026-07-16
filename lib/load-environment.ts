import * as nextEnv from "@next/env";

type EnvironmentModule = { loadEnvConfig?: (directory: string) => unknown; default?: { loadEnvConfig?: (directory: string) => unknown } };

export function loadProjectEnvironment() {
  const environmentModule = nextEnv as unknown as EnvironmentModule;
  const loader = environmentModule.loadEnvConfig ?? environmentModule.default?.loadEnvConfig;
  if (!loader) throw new Error("Unable to load the Next.js environment loader.");
  loader(process.cwd());
}
