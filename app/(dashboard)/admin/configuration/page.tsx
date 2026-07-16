import { asc, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/authorization";
import { getDatabase } from "@/lib/db";
import { applicationTypes, feeSchedules, licenseCategories, policies } from "@/lib/db/schema";
import { FeeForm, PolicyForm } from "./configuration-forms";

export default async function ConfigurationPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/forbidden");
  const database = getDatabase();
  const [policyRows, typeRows, categoryRows, feeRows] = await Promise.all([
    database.select().from(policies).orderBy(desc(policies.effectiveFrom)),
    database.select({ id: applicationTypes.id, name: applicationTypes.name }).from(applicationTypes).where(eq(applicationTypes.isActive, true)).orderBy(asc(applicationTypes.name)),
    database.select({ id: licenseCategories.id, name: licenseCategories.name }).from(licenseCategories).where(eq(licenseCategories.isActive, true)).orderBy(asc(licenseCategories.name)),
    database.select({ id: feeSchedules.id, amount: feeSchedules.amount, currency: feeSchedules.currency, effectiveFrom: feeSchedules.effectiveFrom, effectiveTo: feeSchedules.effectiveTo, type: applicationTypes.name, category: licenseCategories.name }).from(feeSchedules).innerJoin(applicationTypes, eq(feeSchedules.applicationTypeId, applicationTypes.id)).innerJoin(licenseCategories, eq(feeSchedules.licenseCategoryId, licenseCategories.id)).orderBy(desc(feeSchedules.effectiveFrom)),
  ]);
  return <div><div className="page-heading"><div><p className="eyebrow">Administration</p><h1>Policies and fee schedules</h1><p>Add effective-dated versions; historical values remain unchanged.</p></div></div><section className="grid gap-6 xl:grid-cols-2"><div className="panel"><div className="panel-header"><h2 className="font-bold">New policy version</h2></div><div className="panel-body"><PolicyForm /></div></div><div className="panel"><div className="panel-header"><h2 className="font-bold">New fee version</h2></div><div className="panel-body"><FeeForm types={typeRows} categories={categoryRows} /></div></div></section><section className="panel mt-6"><div className="panel-header"><h2 className="font-bold">Policy history</h2></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Effective</th><th>Eligibility</th><th>Validity L / P / I</th><th>Computer pass</th></tr></thead><tbody>{policyRows.map((row) => <tr key={row.id}><td>{row.effectiveFrom} – {row.effectiveTo ?? "current"}</td><td>{row.permanentEligibilityDays} days</td><td>{row.learnerValidityMonths} / {row.permanentValidityMonths} / {row.internationalValidityMonths} months</td><td>{row.computerPassPercentage}%</td></tr>)}</tbody></table></div></section><section className="panel mt-6"><div className="panel-header"><h2 className="font-bold">Fee history</h2></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Type</th><th>Category</th><th>Amount</th><th>Effective</th></tr></thead><tbody>{feeRows.map((row) => <tr key={row.id}><td>{row.type}</td><td>{row.category}</td><td>{row.currency} {row.amount}</td><td>{row.effectiveFrom} – {row.effectiveTo ?? "current"}</td></tr>)}</tbody></table></div></section></div>;
}
