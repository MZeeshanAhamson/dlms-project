import { eq } from "drizzle-orm";
import { AuthorizationError } from "@/lib/auth/errors";
import { getDatabase } from "@/lib/db";
import { applicants, type UserRecord } from "@/lib/db/schema";

export function canManageApplicants(user: Pick<UserRecord, "role">) {
  return user.role === "ADMIN" || user.role === "DATA_ENTRY_OPERATOR";
}

export function canAccessApplicant(user: Pick<UserRecord, "role" | "branchId">, homeBranchId: string) {
  return user.role === "ADMIN" || (user.role === "DATA_ENTRY_OPERATOR" && user.branchId === homeBranchId);
}

export async function requireAccessibleApplicant(user: Pick<UserRecord, "role" | "branchId">, applicantId: string) {
  const [applicant] = await getDatabase().select().from(applicants).where(eq(applicants.id, applicantId)).limit(1);
  if (!applicant) throw new AuthorizationError("Applicant not found.");
  if (!canAccessApplicant(user, applicant.homeBranchId)) throw new AuthorizationError();
  return applicant;
}
