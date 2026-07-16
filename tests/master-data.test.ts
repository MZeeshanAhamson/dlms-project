import { describe, expect, it } from "vitest";
import { MASTER_SEEDS, CATEGORY_ADDITIONS, FEE_BASES } from "@/lib/db/seed-data";
import { masterRecordSchema } from "@/lib/master-data/validation";
import { createUserSchema, validateBranchAssignment } from "@/lib/users/validation";

describe("master data", () => {
  it("contains the complete deterministic demo matrix", () => {
    expect(MASTER_SEEDS.bloodGroups).toHaveLength(8);
    expect(MASTER_SEEDS.applicationTypes).toHaveLength(5);
    expect(MASTER_SEEDS.licenseCategories).toHaveLength(6);
    expect(Object.keys(FEE_BASES)).toHaveLength(5);
    expect(Object.keys(CATEGORY_ADDITIONS)).toHaveLength(6);
    expect(FEE_BASES.PERMANENT + CATEGORY_ADDITIONS.HTV).toBe(3000);
  });

  it("normalizes master codes", () => {
    expect(masterRecordSchema.parse({ code: "motorcar_jeep", name: "Motorcar / Jeep" }).code).toBe("MOTORCAR_JEEP");
  });

  it("requires long passwords and specialist branches", () => {
    expect(createUserSchema.safeParse({ name: "Test User", email: "user@example.com", role: "EXAMINER", branchId: "", password: "short" }).success).toBe(false);
    expect(validateBranchAssignment("EXAMINER", "")).toBe(false);
    expect(validateBranchAssignment("ADMIN", "")).toBe(true);
  });
});
