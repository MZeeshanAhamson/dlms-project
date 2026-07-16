import type { Database } from "./index";
import { auditLogs, type AuditInsert } from "./schema";

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

export async function writeAudit(tx: Transaction, entry: AuditInsert) {
  await tx.insert(auditLogs).values(entry);
}
