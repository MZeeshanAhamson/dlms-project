"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/actions/state";
import { AuthorizationError, requireUser } from "@/lib/auth/authorization";
import { requireAccessibleApplicant } from "@/lib/applicants/authorization";
import { applicantSchema } from "@/lib/applicants/validation";
import { getDatabase } from "@/lib/db";
import { writeAudit } from "@/lib/db/audit";
import { getPostgresErrorCode } from "@/lib/db/errors";
import { applicants } from "@/lib/db/schema";

function failure(error: unknown): ActionState {
  if (error instanceof AuthorizationError) return { status: "error", message: error.message };
  if (getPostgresErrorCode(error) === "23505") return { status: "error", message: "An applicant with that CNIC already exists." };
  return { status: "error", message: "The applicant could not be saved." };
}

export async function createApplicantAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = applicantSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Check the applicant details.", fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const actor = await requireUser(["DATA_ENTRY_OPERATOR"]);
    const homeBranchId = actor.role === "ADMIN" ? parsed.data.homeBranchId : actor.branchId;
    if (!homeBranchId) return { status: "error", message: "A home branch is required." };
    const database = getDatabase();
    let createdId = "";
    await database.transaction(async (tx) => {
      const [created] = await tx.insert(applicants).values({ ...parsed.data, homeBranchId, createdById: actor.id, updatedById: actor.id }).returning();
      createdId = created.id;
      await writeAudit(tx, { actorUserId: actor.id, branchId: homeBranchId, action: "CREATE", entityType: "APPLICANT", entityId: created.id, after: created });
    });
    revalidatePath("/applicants");
    return { status: "success", message: `Applicant created. Open record: ${createdId}` };
  } catch (error) { return failure(error); }
}

export async function updateApplicantAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = applicantSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success || !parsed.data.id) return { status: "error", message: "Check the applicant details.", fieldErrors: parsed.success ? undefined : parsed.error.flatten().fieldErrors };
  try {
    const actor = await requireUser(["DATA_ENTRY_OPERATOR"]);
    const existing = await requireAccessibleApplicant(actor, parsed.data.id);
    const homeBranchId = actor.role === "ADMIN" ? parsed.data.homeBranchId || existing.homeBranchId : existing.homeBranchId;
    const database = getDatabase();
    await database.transaction(async (tx) => {
      const [after] = await tx.update(applicants).set({ ...parsed.data, homeBranchId, updatedById: actor.id }).where(eq(applicants.id, existing.id)).returning();
      await writeAudit(tx, { actorUserId: actor.id, branchId: homeBranchId, action: "UPDATE", entityType: "APPLICANT", entityId: after.id, before: existing, after });
    });
    revalidatePath(`/applicants/${existing.id}`);
    revalidatePath("/applicants");
    return { status: "success", message: "Applicant updated." };
  } catch (error) { return failure(error); }
}
