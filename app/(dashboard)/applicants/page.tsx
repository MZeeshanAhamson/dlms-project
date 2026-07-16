import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/authorization";
import { canAccessApplicant, canManageApplicants } from "@/lib/applicants/authorization";
import { cnicLookupSchema, formatCnic } from "@/lib/applicants/validation";
import { getDatabase } from "@/lib/db";
import { applicants, branches } from "@/lib/db/schema";

export default async function ApplicantsPage({ searchParams }: { searchParams: Promise<{ cnic?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageApplicants(user)) redirect("/forbidden");
  const database = getDatabase();
  const params = await searchParams;
  const lookup = params.cnic ? cnicLookupSchema.safeParse({ cnic: params.cnic }) : null;
  const [found] = lookup?.success ? await database.select().from(applicants).where(eq(applicants.cnic, lookup.data.cnic)).limit(1) : [];
  const rows = await database.select({ applicant: applicants, branchName: branches.name }).from(applicants).innerJoin(branches, eq(applicants.homeBranchId, branches.id)).where(user.role === "ADMIN" ? undefined : eq(applicants.homeBranchId, user.branchId!)).orderBy(asc(applicants.legalName));
  return <div><div className="page-heading"><div><p className="eyebrow">Shared registry</p><h1>Applicants</h1><p>Browse your branch or retrieve an exact CNIC globally without creating duplicates.</p></div><Link className="button button-primary" href="/applicants/new">Create applicant</Link></div><section className="panel mb-6"><div className="panel-header"><h2 className="font-bold">Exact CNIC lookup</h2></div><div className="panel-body"><form className="flex flex-col gap-3 sm:flex-row" method="get"><div className="grow"><label className="label" htmlFor="lookup-cnic">CNIC</label><input className="input" id="lookup-cnic" name="cnic" defaultValue={params.cnic} placeholder="35202-1234567-1" required /></div><button className="button button-secondary self-end">Find applicant</button></form>{params.cnic && !lookup?.success ? <p className="form-error mt-3">Enter a valid 13-digit CNIC.</p> : null}{lookup?.success ? found ? <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4"><p className="font-bold text-slate-950">{found.legalName}</p><p className="mt-1 text-sm text-slate-600">{formatCnic(found.cnic)} · {found.phone} · {found.address}</p>{canAccessApplicant(user, found.homeBranchId) ? <Link className="mt-3 inline-block text-sm font-bold text-blue-800" href={`/applicants/${found.id}`}>Open applicant →</Link> : <p className="mt-3 text-sm font-semibold text-blue-900">Existing applicant found in another branch. Reuse this registry ID in a new application; profile corrections remain with the home branch or Admin.</p>}</div> : <p className="mt-4 text-sm text-slate-600">No applicant exists with that CNIC.</p> : null}</div></section><section className="panel"><div className="panel-header"><h2 className="font-bold">{user.role === "ADMIN" ? "All applicants" : "Branch applicants"}</h2><span className="badge badge-inactive">{rows.length} records</span></div><div className="table-wrap"><table className="data-table"><thead><tr><th>CNIC</th><th>Name</th><th>Phone</th><th>Branch</th><th></th></tr></thead><tbody>{rows.map(({ applicant, branchName }) => <tr key={applicant.id}><td>{formatCnic(applicant.cnic)}</td><td className="font-semibold">{applicant.legalName}</td><td>{applicant.phone}</td><td>{branchName}</td><td><Link className="font-bold text-blue-800" href={`/applicants/${applicant.id}`}>View</Link></td></tr>)}</tbody></table>{rows.length === 0 ? <p className="panel-body text-sm text-slate-500">No applicants in this branch yet.</p> : null}</div></section></div>;
}
