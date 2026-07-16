import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDatabase } from "@/lib/db";
import { users, type Role, type UserRecord } from "@/lib/db/schema";
import { canAccessBranch } from "./policy";
import { AuthorizationError } from "./errors";

export async function getCurrentUser(): Promise<UserRecord | null> {
  const session = await auth();
  if (!session?.user.id) return null;
  const [user] = await getDatabase().select().from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!user?.isActive || user.authVersion !== session.user.authVersion) return null;
  return user;
}

export async function requireUser(roles?: readonly Role[]) {
  const user = await getCurrentUser();
  if (!user) throw new AuthorizationError("Your session is no longer valid.");
  if (roles && user.role !== "ADMIN" && !roles.includes(user.role)) throw new AuthorizationError();
  return user;
}

export function assertBranchAccess(user: Pick<UserRecord, "role" | "branchId">, branchId: string) {
  if (!canAccessBranch(user, branchId)) throw new AuthorizationError();
}

export { canAccessBranch } from "./policy";
export { AuthorizationError } from "./errors";
