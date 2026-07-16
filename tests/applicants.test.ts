import { describe, expect, it } from "vitest";
import { canAccessApplicant, canManageApplicants } from "@/lib/applicants/authorization";
import { applicantSchema, formatCnic, normalizeCnic, normalizePakistanPhone } from "@/lib/applicants/validation";

describe("applicant identity validation", () => {
  it("canonicalizes common CNIC and Pakistani mobile formats", () => {
    expect(normalizeCnic("35202-1234567-1")).toBe("3520212345671");
    expect(formatCnic("3520212345671")).toBe("35202-1234567-1");
    expect(normalizePakistanPhone("0300 123-4567")).toBe("+923001234567");
    expect(normalizePakistanPhone("923001234567")).toBe("+923001234567");
  });

  it("rejects malformed identity inputs", () => {
    expect(() => normalizeCnic("35202-ABC-1")).toThrow();
    expect(() => normalizePakistanPhone("021-1234567")).toThrow();
    expect(applicantSchema.safeParse({}).success).toBe(false);
  });

  it("allows only Admin or the home-branch Data Entry operator", () => {
    expect(canManageApplicants({ role: "ADMIN" })).toBe(true);
    expect(canManageApplicants({ role: "EXAMINER" })).toBe(false);
    expect(canAccessApplicant({ role: "DATA_ENTRY_OPERATOR", branchId: "a" }, "a")).toBe(true);
    expect(canAccessApplicant({ role: "DATA_ENTRY_OPERATOR", branchId: "a" }, "b")).toBe(false);
  });
});
