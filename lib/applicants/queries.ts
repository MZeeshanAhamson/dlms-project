import { asc, eq } from "drizzle-orm";
import { getDatabase } from "@/lib/db";
import { bloodGroups, branches, nationalities, provinces } from "@/lib/db/schema";

export async function getApplicantFormOptions() {
  const database = getDatabase();
  const [nationalityRows, bloodRows, provinceRows, branchRows] = await Promise.all([
    database.select({ id: nationalities.id, name: nationalities.name }).from(nationalities).where(eq(nationalities.isActive, true)).orderBy(asc(nationalities.name)),
    database.select({ id: bloodGroups.id, name: bloodGroups.name }).from(bloodGroups).where(eq(bloodGroups.isActive, true)).orderBy(asc(bloodGroups.name)),
    database.select({ id: provinces.id, name: provinces.name }).from(provinces).where(eq(provinces.isActive, true)).orderBy(asc(provinces.name)),
    database.select({ id: branches.id, name: branches.name }).from(branches).where(eq(branches.isActive, true)).orderBy(asc(branches.name)),
  ]);
  return { nationalities: nationalityRows, bloodGroups: bloodRows, provinces: provinceRows, branches: branchRows };
}
