import { z } from "zod";

export const masterRecordSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().trim().min(1).max(40).regex(/^[A-Za-z0-9_+-]+$/, "Use letters, numbers, +, - or _ only.").transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2).max(120),
  provinceId: z.string().uuid().optional(),
  address: z.string().trim().max(240).optional(),
});
