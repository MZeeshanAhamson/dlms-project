import { resetTestDatabase } from "@/lib/db/test-reset";
import { resetTestBucket } from "@/lib/storage/test-reset";

export default async function globalSetup() {
  await resetTestDatabase();
  await resetTestBucket();
}
