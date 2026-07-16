"use server";

import { and, eq, isNull, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/lib/actions/state";
import { AuthorizationError, requireUser } from "@/lib/auth/authorization";
import { getDatabase } from "@/lib/db";
import { writeAudit } from "@/lib/db/audit";
import { getPostgresErrorCode } from "@/lib/db/errors";
import { feeSchedules, policies } from "@/lib/db/schema";

const policySchema = z.object({
  permanentEligibilityDays: z.coerce.number().int().min(0).max(365),
  learnerValidityMonths: z.coerce.number().int().min(1).max(120),
  permanentValidityMonths: z.coerce.number().int().min(1).max(240),
  internationalValidityMonths: z.coerce.number().int().min(1).max(120),
  computerPassPercentage: z.coerce.number().int().min(1).max(100),
  effectiveFrom: z.iso.date(),
});

const feeSchema = z.object({
  applicationTypeId: z.string().uuid(),
  licenseCategoryId: z.string().uuid(),
  amount: z.coerce.number().positive().max(10_000_000),
  effectiveFrom: z.iso.date(),
});

function previousDay(date: string) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() - 1);
  return value.toISOString().slice(0, 10);
}

function failure(error: unknown): ActionState {
  if (error instanceof AuthorizationError) return { status: "error", message: error.message };
  if (getPostgresErrorCode(error) === "23505") return { status: "error", message: "A configuration already starts on that date." };
  return { status: "error", message: "Configuration could not be saved." };
}

export async function createPolicyAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = policySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Check every policy value." };
  try {
    const actor = await requireUser(["ADMIN"]);
    const database = getDatabase();
    await database.transaction(async (tx) => {
      await tx.update(policies).set({ effectiveTo: previousDay(parsed.data.effectiveFrom) }).where(and(isNull(policies.effectiveTo), lt(policies.effectiveFrom, parsed.data.effectiveFrom)));
      const [created] = await tx.insert(policies).values(parsed.data).returning();
      await writeAudit(tx, { actorUserId: actor.id, branchId: actor.branchId, action: "CREATE", entityType: "POLICY", entityId: created.id, after: created });
    });
    revalidatePath("/admin/configuration");
    return { status: "success", message: "Policy version scheduled." };
  } catch (error) { return failure(error); }
}

export async function createFeeAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = feeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Choose a type, category, amount, and date." };
  try {
    const actor = await requireUser(["ADMIN"]);
    const database = getDatabase();
    await database.transaction(async (tx) => {
      await tx.update(feeSchedules).set({ effectiveTo: previousDay(parsed.data.effectiveFrom) }).where(and(eq(feeSchedules.applicationTypeId, parsed.data.applicationTypeId), eq(feeSchedules.licenseCategoryId, parsed.data.licenseCategoryId), isNull(feeSchedules.effectiveTo), lt(feeSchedules.effectiveFrom, parsed.data.effectiveFrom)));
      const [created] = await tx.insert(feeSchedules).values({ ...parsed.data, amount: String(parsed.data.amount) }).returning();
      await writeAudit(tx, { actorUserId: actor.id, branchId: actor.branchId, action: "CREATE", entityType: "FEE_SCHEDULE", entityId: created.id, after: created });
    });
    revalidatePath("/admin/configuration");
    return { status: "success", message: "Fee version scheduled." };
  } catch (error) { return failure(error); }
}
