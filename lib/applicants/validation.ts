import { z } from "zod";
import { genderValues } from "@/lib/db/schema";

export function normalizeCnic(value: string) {
  const trimmed = value.trim();
  if (!/^[0-9\s-]+$/.test(trimmed)) throw new Error("CNIC may contain only digits, spaces, and hyphens.");
  const digits = trimmed.replace(/\D/g, "");
  if (!/^\d{13}$/.test(digits)) throw new Error("CNIC must contain exactly 13 digits.");
  return digits;
}

export function formatCnic(value: string) {
  return `${value.slice(0, 5)}-${value.slice(5, 12)}-${value.slice(12)}`;
}

export function normalizePakistanPhone(value: string) {
  const compact = value.trim().replace(/[\s()-]/g, "");
  const normalized = compact.startsWith("03")
    ? `+92${compact.slice(1)}`
    : compact.startsWith("923")
      ? `+${compact}`
      : compact;
  if (!/^\+923\d{9}$/.test(normalized)) throw new Error("Enter a Pakistani mobile number such as 03001234567.");
  return normalized;
}

const normalizedCnic = z.string().transform((value, context) => {
  try { return normalizeCnic(value); } catch (error) { context.addIssue({ code: "custom", message: error instanceof Error ? error.message : "Invalid CNIC" }); return z.NEVER; }
});

const normalizedPhone = z.string().transform((value, context) => {
  try { return normalizePakistanPhone(value); } catch (error) { context.addIssue({ code: "custom", message: error instanceof Error ? error.message : "Invalid phone" }); return z.NEVER; }
});

export const applicantSchema = z.object({
  id: z.string().uuid().optional(),
  cnic: normalizedCnic,
  legalName: z.string().trim().min(2).max(150),
  fatherSpouseName: z.string().trim().min(2).max(150),
  dateOfBirth: z.iso.date().refine((value) => value <= new Date().toISOString().slice(0, 10), "Date of birth cannot be in the future."),
  gender: z.enum(genderValues),
  nationalityId: z.string().uuid(),
  bloodGroupId: z.string().uuid(),
  phone: normalizedPhone,
  email: z.string().trim().email().optional().or(z.literal("")).transform((value) => value || null),
  address: z.string().trim().min(5).max(300),
  provinceId: z.string().uuid(),
  homeBranchId: z.string().uuid().optional().or(z.literal("")),
});

export const cnicLookupSchema = z.object({ cnic: normalizedCnic });
