import { resetTestDatabase } from "../lib/db/test-reset";
import { loadProjectEnvironment } from "../lib/load-environment";

loadProjectEnvironment();

async function main() {
  await resetTestDatabase();
  console.log("Reset, migrated, and seeded the isolated test database.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
