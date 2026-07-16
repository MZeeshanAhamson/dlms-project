import { describe, expect, it } from "vitest";
import { canAccessBranch } from "@/lib/auth/policy";

describe("branch authorization", () => {
  it("allows an administrator to access every branch", () => {
    expect(canAccessBranch({ role: "ADMIN", branchId: null }, "another-branch")).toBe(true);
  });

  it("restricts a specialist to the assigned branch", () => {
    expect(canAccessBranch({ role: "PAYMENT_OFFICER", branchId: "branch-a" }, "branch-a")).toBe(true);
    expect(canAccessBranch({ role: "PAYMENT_OFFICER", branchId: "branch-a" }, "branch-b")).toBe(false);
  });
});
