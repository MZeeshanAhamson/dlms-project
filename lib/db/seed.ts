import { hash } from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import type { Database } from "./index";
import {
  applicationStatuses,
  applicationTypes,
  bloodGroups,
  branches,
  feeSchedules,
  licenseCategories,
  nationalities,
  paymentTypes,
  policies,
  provinces,
  users,
} from "./schema";
import { BRANCH_SEEDS, CATEGORY_ADDITIONS, DEMO_POLICY, DEMO_USERS, FEE_BASES, MASTER_SEEDS } from "./seed-data";

type MasterTable =
  | typeof nationalities
  | typeof bloodGroups
  | typeof applicationTypes
  | typeof applicationStatuses
  | typeof paymentTypes
  | typeof provinces
  | typeof licenseCategories;

async function upsertMaster(
  database: Database,
  table: MasterTable,
  values: readonly (readonly [string, string])[],
  protectedRecords = false,
) {
  for (const [code, name] of values) {
    await database
      .insert(table)
      .values({ code, name, isActive: true, isProtected: protectedRecords })
      .onConflictDoUpdate({
        target: table.code,
        set: { name, isActive: true, isProtected: protectedRecords, updatedAt: new Date() },
      });
  }
}

export async function seedDatabase(
  database: Database,
  options: { includeDemoUsers: boolean; demoPassword?: string },
) {
  await upsertMaster(database, nationalities, MASTER_SEEDS.nationalities);
  await upsertMaster(database, bloodGroups, MASTER_SEEDS.bloodGroups);
  await upsertMaster(database, provinces, MASTER_SEEDS.provinces);
  await upsertMaster(database, paymentTypes, MASTER_SEEDS.paymentTypes);
  await upsertMaster(database, applicationTypes, MASTER_SEEDS.applicationTypes, true);
  await upsertMaster(database, applicationStatuses, MASTER_SEEDS.applicationStatuses, true);
  await upsertMaster(database, licenseCategories, MASTER_SEEDS.licenseCategories);

  const provinceRows = await database.select().from(provinces);
  const provinceByCode = new Map(provinceRows.map((row) => [row.code, row]));

  for (const branch of BRANCH_SEEDS) {
    const province = provinceByCode.get(branch.provinceCode);
    if (!province) throw new Error(`Missing province seed ${branch.provinceCode}`);
    await database
      .insert(branches)
      .values({ ...branch, provinceId: province.id, isActive: true, isProtected: false })
      .onConflictDoUpdate({
        target: branches.code,
        set: {
          name: branch.name,
          address: branch.address,
          provinceId: province.id,
          isActive: true,
          isProtected: false,
          updatedAt: new Date(),
        },
      });
  }

  await database
    .insert(policies)
    .values(DEMO_POLICY)
    .onConflictDoUpdate({
      target: policies.effectiveFrom,
      set: { ...DEMO_POLICY, isActive: true, updatedAt: new Date() },
    });

  const typeRows = await database.select().from(applicationTypes);
  const categoryRows = await database.select().from(licenseCategories);
  for (const type of typeRows) {
    for (const category of categoryRows) {
      const base = FEE_BASES[type.code];
      const addition = CATEGORY_ADDITIONS[category.code];
      if (base === undefined || addition === undefined) continue;
      await database
        .insert(feeSchedules)
        .values({
          applicationTypeId: type.id,
          licenseCategoryId: category.id,
          amount: String(base + addition),
          effectiveFrom: DEMO_POLICY.effectiveFrom,
        })
        .onConflictDoUpdate({
          target: [feeSchedules.applicationTypeId, feeSchedules.licenseCategoryId, feeSchedules.effectiveFrom],
          set: { amount: String(base + addition), currency: "PKR", isActive: true, updatedAt: new Date() },
        });
    }
  }

  if (options.includeDemoUsers) {
    if (!options.demoPassword || options.demoPassword.length < 12) {
      throw new Error("DEMO_USER_PASSWORD must contain at least 12 characters");
    }
    const passwordHash = await hash(options.demoPassword, 12);
    const branchRows = await database.select().from(branches);
    const branchByCode = new Map(branchRows.map((row) => [row.code, row]));
    for (const demoUser of DEMO_USERS) {
      const branchId = demoUser.branchCode ? branchByCode.get(demoUser.branchCode)?.id : null;
      await database
        .insert(users)
        .values({ ...demoUser, branchId, passwordHash, isActive: true })
        .onConflictDoUpdate({
          target: users.email,
          set: {
            name: demoUser.name,
            role: demoUser.role,
            branchId,
            passwordHash,
            isActive: true,
            authVersion: sql`${users.authVersion} + 1`,
            updatedAt: new Date(),
          },
        });
    }
  }

  return {
    users: options.includeDemoUsers ? await database.select().from(users) : [],
    activePolicy: await database.select().from(policies).where(eq(policies.effectiveFrom, DEMO_POLICY.effectiveFrom)),
  };
}
