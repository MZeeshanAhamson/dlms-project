// Requires DATABASE_URL_TEST and DEMO_USER_PASSWORD. It deliberately fails fast when either is missing.
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getTestDatabaseUrl } from "@/lib/env";
import { openDatabase } from "@/lib/db";
import { seedDatabase } from "@/lib/db/seed";
import { DEMO_POLICY, DEMO_USERS } from "@/lib/db/seed-data";
import { applicants, auditLogs, bloodGroups, branches, feeSchedules, nationalities, policies, provinces, users } from "@/lib/db/schema";

const url = getTestDatabaseUrl();
const password = process.env.DEMO_USER_PASSWORD;
if (!password) throw new Error("DEMO_USER_PASSWORD is required for integration tests");
const connection = openDatabase(url);

describe("migrations and seeds", () => {
  beforeAll(async () => migrate(connection.database, { migrationsFolder: "drizzle" }));
  afterAll(async () => connection.client.end());

  it("is idempotent and creates the required demo records", async () => {
    await seedDatabase(connection.database, { includeDemoUsers: true, demoPassword: password });
    await seedDatabase(connection.database, { includeDemoUsers: true, demoPassword: password });
    const demoEmails = DEMO_USERS.map((user) => user.email);
    const [demoRows, policyRows, feeRows] = await Promise.all([
      connection.database.select().from(users).where(inArray(users.email, demoEmails)),
      connection.database.select().from(policies).where(eq(policies.effectiveFrom, DEMO_POLICY.effectiveFrom)),
      connection.database.select().from(feeSchedules),
    ]);
    expect(demoRows).toHaveLength(5);
    expect(policyRows).toHaveLength(1);
    expect(feeRows).toHaveLength(30);
  });

  it("enforces canonical CNIC uniqueness and stores applicant audits atomically", async () => {
    const [[admin], [branch], [nationality], [bloodGroup], [province]] = await Promise.all([
      connection.database.select().from(users).where(eq(users.email, "admin@dlms.test")).limit(1),
      connection.database.select().from(branches).where(eq(branches.code, "LHR-CENTRAL")).limit(1),
      connection.database.select().from(nationalities).where(eq(nationalities.code, "PK")).limit(1),
      connection.database.select().from(bloodGroups).where(eq(bloodGroups.code, "A+")).limit(1),
      connection.database.select().from(provinces).where(eq(provinces.code, "PB")).limit(1),
    ]);
    await connection.database.delete(applicants).where(eq(applicants.cnic, "3520212345671"));
    let applicantId = "";
    await connection.database.transaction(async (tx) => {
      const [created] = await tx.insert(applicants).values({ cnic: "3520212345671", legalName: "Integration Applicant", fatherSpouseName: "Parent Name", dateOfBirth: "1990-01-01", gender: "MALE", nationalityId: nationality.id, bloodGroupId: bloodGroup.id, phone: "+923001234567", address: "Test address, Lahore", provinceId: province.id, homeBranchId: branch.id, createdById: admin.id, updatedById: admin.id }).returning();
      applicantId = created.id;
      await tx.insert(auditLogs).values({ actorUserId: admin.id, branchId: branch.id, action: "CREATE", entityType: "APPLICANT", entityId: created.id, after: created });
    });
    await expect(connection.database.insert(applicants).values({ cnic: "3520212345671", legalName: "Duplicate", fatherSpouseName: "Parent Name", dateOfBirth: "1990-01-01", gender: "MALE", nationalityId: nationality.id, bloodGroupId: bloodGroup.id, phone: "+923001234568", address: "Test address, Lahore", provinceId: province.id, homeBranchId: branch.id })).rejects.toMatchObject({ cause: { code: "23505" } });
    expect(await connection.database.select().from(auditLogs).where(eq(auditLogs.entityId, applicantId))).toHaveLength(1);
  });
});
