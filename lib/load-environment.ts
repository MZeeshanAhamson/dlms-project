import * as nextEnv from "@next/env";

type EnvironmentModule = { loadEnvConfig?: (directory: string) => unknown; default?: { loadEnvConfig?: (directory: string) => unknown } };

export function loadProjectEnvironment() {
  const module = nextEnv as unknown as EnvironmentModule;
  const loader = module.loadEnvConfig ?? module.default?.loadEnvConfig;
  if (!loader) throw new Error("Unable to load the Next.js environment loader.");
  loader(process.cwd());
}
