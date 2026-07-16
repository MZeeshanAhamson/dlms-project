"use server";

import { hash } from "bcryptjs";
import { and, count, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/actions/state";
import { AuthorizationError, requireUser } from "@/lib/auth/authorization";
import { getDatabase } from "@/lib/db";
import { writeAudit } from "@/lib/db/audit";
import { getPostgresErrorCode } from "@/lib/db/errors";
import { users, type UserRecord } from "@/lib/db/schema";
import { createUserSchema, resetPasswordSchema, updateUserSchema, validateBranchAssignment } from "@/lib/users/validation";

function publicUser(user: UserRecord) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    branchId: user.branchId,
    isActive: user.isActive,
    authVersion: user.authVersion,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function actionError(error: unknown): ActionState {
  if (error instanceof AuthorizationError) return { status: "error", message: error.message };
  if (getPostgresErrorCode(error) === "23505") return { status: "error", message: "That email address is already assigned." };
  return { status: "error", message: error instanceof Error ? error.message : "The user could not be saved." };
}

export async function createUserAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = createUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Check the user details.", fieldErrors: parsed.error.flatten().fieldErrors };
  if (!validateBranchAssignment(parsed.data.role, parsed.data.branchId)) return { status: "error", message: "Specialist users require a branch." };
  try {
    const actor = await requireUser(["ADMIN"]);
    const passwordHash = await hash(parsed.data.password, 12);
    const database = getDatabase();
    await database.transaction(async (tx) => {
      const [created] = await tx.insert(users).values({
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role,
        branchId: parsed.data.role === "ADMIN" ? null : parsed.data.branchId,
        passwordHash,
      }).returning();
      await writeAudit(tx, { actorUserId: actor.id, branchId: actor.branchId, action: "CREATE", entityType: "USER", entityId: created.id, after: publicUser(created) });
    });
    revalidatePath("/admin/users");
    return { status: "success", message: "User created." };
  } catch (error) { return actionError(error); }
}

async function ensureAnotherActiveAdmin(id: string) {
  const [result] = await getDatabase().select({ value: count() }).from(users).where(and(eq(users.role, "ADMIN"), eq(users.isActive, true), ne(users.id, id)));
  if (Number(result.value) === 0) throw new Error("The final active administrator cannot be removed or reassigned.");
}

export async function updateUserAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = updateUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Check the user details.", fieldErrors: parsed.error.flatten().fieldErrors };
  if (!validateBranchAssignment(parsed.data.role, parsed.data.branchId)) return { status: "error", message: "Specialist users require a branch." };
  try {
    const actor = await requireUser(["ADMIN"]);
    const database = getDatabase();
    const [existing] = await database.select().from(users).where(eq(users.id, parsed.data.id)).limit(1);
    if (!existing) throw new Error("User not found.");
    if (existing.role === "ADMIN" && existing.isActive && parsed.data.role !== "ADMIN") await ensureAnotherActiveAdmin(existing.id);
    await database.transaction(async (tx) => {
      const [after] = await tx.update(users).set({
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role,
        branchId: parsed.data.role === "ADMIN" ? null : parsed.data.branchId,
        authVersion: existing.authVersion + 1,
      }).where(eq(users.id, existing.id)).returning();
      await writeAudit(tx, { actorUserId: actor.id, branchId: actor.branchId, action: "UPDATE", entityType: "USER", entityId: after.id, before: publicUser(existing), after: publicUser(after) });
    });
    revalidatePath("/admin/users");
    return { status: "success", message: "User updated; existing sessions were invalidated." };
  } catch (error) { return actionError(error); }
}

export async function toggleUserAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const id = String(formData.get("id") ?? "");
  try {
    const actor = await requireUser(["ADMIN"]);
    const database = getDatabase();
    const [existing] = await database.select().from(users).where(eq(users.id, id)).limit(1);
    if (!existing) throw new Error("User not found.");
    if (existing.role === "ADMIN" && existing.isActive) await ensureAnotherActiveAdmin(existing.id);
    await database.transaction(async (tx) => {
      const [after] = await tx.update(users).set({ isActive: !existing.isActive, authVersion: existing.authVersion + 1 }).where(eq(users.id, id)).returning();
      await writeAudit(tx, { actorUserId: actor.id, branchId: actor.branchId, action: after.isActive ? "REACTIVATE" : "DEACTIVATE", entityType: "USER", entityId: id, before: publicUser(existing), after: publicUser(after) });
    });
    revalidatePath("/admin/users");
    return { status: "success", message: existing.isActive ? "User deactivated." : "User reactivated." };
  } catch (error) { return actionError(error); }
}

export async function resetPasswordAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "The new password must contain at least 12 characters." };
  try {
    const actor = await requireUser(["ADMIN"]);
    const database = getDatabase();
    const [existing] = await database.select().from(users).where(eq(users.id, parsed.data.id)).limit(1);
    if (!existing) throw new Error("User not found.");
    const passwordHash = await hash(parsed.data.password, 12);
    await database.transaction(async (tx) => {
      const [after] = await tx.update(users).set({ passwordHash, authVersion: existing.authVersion + 1 }).where(eq(users.id, existing.id)).returning();
      await writeAudit(tx, { actorUserId: actor.id, branchId: actor.branchId, action: "PASSWORD_RESET", entityType: "USER", entityId: existing.id, before: publicUser(existing), after: publicUser(after) });
    });
    return { status: "success", message: "Password reset; existing sessions were invalidated." };
  } catch (error) { return actionError(error); }
}
