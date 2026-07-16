import { z } from "zod";
import { roleValues } from "@/lib/db/schema";

const baseUserSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  role: z.enum(roleValues),
  branchId: z.string().uuid().or(z.literal("")).optional(),
});

export const createUserSchema = baseUserSchema.extend({ password: z.string().min(12).max(128) });
export const updateUserSchema = baseUserSchema.extend({ id: z.string().uuid() });
export const resetPasswordSchema = z.object({ id: z.string().uuid(), password: z.string().min(12).max(128) });

export function validateBranchAssignment(role: (typeof roleValues)[number], branchId?: string) {
  return role === "ADMIN" || Boolean(branchId);
}
