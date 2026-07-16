"use server";

import { count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/actions/state";
import { AuthorizationError, requireUser } from "@/lib/auth/authorization";
import { getDatabase } from "@/lib/db";
import { writeAudit } from "@/lib/db/audit";
import { getPostgresErrorCode } from "@/lib/db/errors";
import { branches, feeSchedules, users } from "@/lib/db/schema";
import { isMasterResource, masterResources, type MasterResource } from "@/lib/master-data/config";
import { masterRecordSchema } from "@/lib/master-data/validation";

function errorState(error: unknown): ActionState {
  if (error instanceof AuthorizationError) return { status: "error", message: error.message };
  if (getPostgresErrorCode(error) === "23505") return { status: "error", message: "That code already exists." };
  return { status: "error", message: "The record could not be saved." };
}

export async function createMasterAction(resource: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  if (!isMasterResource(resource)) return { status: "error", message: "Unknown master-data resource." };
  const parsed = masterRecordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  if (resource === "branches" && (!parsed.data.provinceId || !parsed.data.address)) return { status: "error", message: "Province and address are required for a branch." };
  try {
    const actor = await requireUser(["ADMIN"]);
    const database = getDatabase();
    await database.transaction(async (tx) => {
      const [created] = resource === "branches"
        ? await tx.insert(branches).values({ code: parsed.data.code, name: parsed.data.name, provinceId: parsed.data.provinceId!, address: parsed.data.address ?? "" }).returning()
        : await tx.insert(masterResources[resource].table).values({ code: parsed.data.code, name: parsed.data.name }).returning();
      await writeAudit(tx, { actorUserId: actor.id, branchId: actor.branchId, action: "CREATE", entityType: resource.toUpperCase(), entityId: created.id, after: created });
    });
    revalidatePath(`/admin/master-data/${resource}`);
    return { status: "success", message: "Record created." };
  } catch (error) { return errorState(error); }
}

export async function updateMasterAction(resource: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  if (!isMasterResource(resource)) return { status: "error", message: "Unknown master-data resource." };
  const parsed = masterRecordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success || !parsed.data.id) return { status: "error", message: "Check the record values.", fieldErrors: parsed.success ? undefined : parsed.error.flatten().fieldErrors };
  if (resource === "branches" && (!parsed.data.provinceId || !parsed.data.address)) return { status: "error", message: "Province and address are required for a branch." };
  const recordId = parsed.data.id;
  try {
    const actor = await requireUser(["ADMIN"]);
    const database = getDatabase();
    await database.transaction(async (tx) => {
      const table = resource === "branches" ? branches : masterResources[resource].table;
      const [before] = await tx.select().from(table).where(eq(table.id, recordId)).limit(1);
      if (!before) throw new Error("Record not found");
      const code = before.isProtected ? before.code : parsed.data.code;
      const [after] = resource === "branches"
        ? await tx.update(branches).set({ code, name: parsed.data.name, provinceId: parsed.data.provinceId!, address: parsed.data.address ?? "" }).where(eq(branches.id, recordId)).returning()
        : await tx.update(masterResources[resource].table).set({ code, name: parsed.data.name }).where(eq(masterResources[resource].table.id, recordId)).returning();
      await writeAudit(tx, { actorUserId: actor.id, branchId: actor.branchId, action: "UPDATE", entityType: resource.toUpperCase(), entityId: after.id, before, after });
    });
    revalidatePath(`/admin/master-data/${resource}`);
    return { status: "success", message: "Changes saved." };
  } catch (error) { return errorState(error); }
}

async function referenceCount(resource: MasterResource, id: string) {
  const database = getDatabase();
  if (resource === "provinces") return Number((await database.select({ value: count() }).from(branches).where(eq(branches.provinceId, id)))[0].value);
  if (resource === "application-types") return Number((await database.select({ value: count() }).from(feeSchedules).where(eq(feeSchedules.applicationTypeId, id)))[0].value);
  if (resource === "license-categories") return Number((await database.select({ value: count() }).from(feeSchedules).where(eq(feeSchedules.licenseCategoryId, id)))[0].value);
  if (resource === "branches") return Number((await database.select({ value: count() }).from(users).where(eq(users.branchId, id)))[0].value);
  return 0;
}

export async function removeMasterAction(resource: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  if (!isMasterResource(resource)) return { status: "error", message: "Unknown master-data resource." };
  const id = String(formData.get("id") ?? "");
  try {
    const actor = await requireUser(["ADMIN"]);
    const database = getDatabase();
    const table = resource === "branches" ? branches : masterResources[resource].table;
    const [before] = await database.select().from(table).where(eq(table.id, id)).limit(1);
    if (!before) return { status: "error", message: "Record not found." };
    if (before.isProtected) return { status: "error", message: "This workflow record is protected and cannot be removed." };
    const referenced = (await referenceCount(resource, id)) > 0;
    await database.transaction(async (tx) => {
      if (referenced) await tx.update(table).set({ isActive: false }).where(eq(table.id, id));
      else await tx.delete(table).where(eq(table.id, id));
      await writeAudit(tx, { actorUserId: actor.id, branchId: actor.branchId, action: referenced ? "DEACTIVATE" : "DELETE", entityType: resource.toUpperCase(), entityId: id, before });
    });
    revalidatePath(`/admin/master-data/${resource}`);
    return { status: "success", message: referenced ? "Referenced record deactivated." : "Record removed." };
  } catch (error) { return errorState(error); }
}

export async function reactivateMasterAction(resource: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  if (!isMasterResource(resource)) return { status: "error", message: "Unknown master-data resource." };
  const id = String(formData.get("id") ?? "");
  try {
    const actor = await requireUser(["ADMIN"]);
    const database = getDatabase();
    const table = resource === "branches" ? branches : masterResources[resource].table;
    await database.transaction(async (tx) => {
      const [before] = await tx.select().from(table).where(eq(table.id, id)).limit(1);
      const [after] = await tx.update(table).set({ isActive: true }).where(eq(table.id, id)).returning();
      if (!before || !after) throw new Error("Record not found");
      await writeAudit(tx, { actorUserId: actor.id, branchId: actor.branchId, action: "REACTIVATE", entityType: resource.toUpperCase(), entityId: id, before, after });
    });
    revalidatePath(`/admin/master-data/${resource}`);
    return { status: "success", message: "Record reactivated." };
  } catch (error) { return errorState(error); }
}
