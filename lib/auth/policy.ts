import type { UserRecord } from "@/lib/db/schema";

export function canAccessBranch(user: Pick<UserRecord, "role" | "branchId">, branchId: string) {
  return user.role === "ADMIN" || user.branchId === branchId;
}
