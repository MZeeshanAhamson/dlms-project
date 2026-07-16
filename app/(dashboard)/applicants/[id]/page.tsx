import Link from "next/link";
import Image from "next/image";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/authorization";
import { canAccessApplicant } from "@/lib/applicants/authorization";
import { formatCnic } from "@/lib/applicants/validation";
import { getDatabase } from "@/lib/db";
import { applicantPhotos, applicants, auditLogs, bloodGroups, branches, nationalities, provinces } from "@/lib/db/schema";
import { PhotoUploader } from "../photo-uploader";

export default async function ApplicantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const database = getDatabase();
  const [record] = await database.select({ applicant: applicants, nationality: nationalities.name, bloodGroup: bloodGroups.name, province: provinces.name, branch: branches.name }).from(applicants).innerJoin(nationalities, eq(applicants.nationalityId, nationalities.id)).innerJoin(bloodGroups, eq(applicants.bloodGroupId, bloodGroups.id)).innerJoin(provinces, eq(applicants.provinceId, provinces.id)).innerJoin(branches, eq(applicants.homeBranchId, branches.id)).where(eq(applicants.id, id)).limit(1);
  if (!record || !canAccessApplicant(user, record.applicant.homeBranchId)) redirect("/forbidden");
  const [photo, history] = await Promise.all([
    database.select().from(applicantPhotos).where(and(eq(applicantPhotos.applicantId, id), eq(applicantPhotos.status, "ACTIVE"))).limit(1),
    database.select().from(auditLogs).where(or(and(eq(auditLogs.entityType, "APPLICANT"), eq(auditLogs.entityId, id)), sql`${auditLogs.metadata}->>'applicantId' = ${id}`)).orderBy(desc(auditLogs.createdAt)),
  ]);
  const applicant = record.applicant;
  const details = [["CNIC", formatCnic(applicant.cnic)], ["Phone", applicant.phone], ["Father / spouse", applicant.fatherSpouseName], ["Date of birth", applicant.dateOfBirth], ["Gender", applicant.gender], ["Nationality", record.nationality], ["Blood group", record.bloodGroup], ["Email", applicant.email ?? "—"], ["Province", record.province], ["Home branch", record.branch], ["Address", applicant.address]];
  return <div><div className="page-heading"><div><p className="eyebrow">Applicant registry</p><h1>{applicant.legalName}</h1><p>Shared identity record and immutable change history.</p></div><Link className="button button-primary" href={`/applicants/${id}/edit`}>Edit applicant</Link></div><div className="grid gap-6 lg:grid-cols-[1fr_20rem]"><section className="panel"><div className="panel-header"><h2 className="font-bold">Applicant details</h2></div><dl className="grid gap-0 sm:grid-cols-2">{details.map(([label, value]) => <div className="border-b border-slate-100 p-4" key={label}><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 text-sm font-semibold text-slate-900">{value}</dd></div>)}</dl></section><aside className="panel panel-body"><h2 className="mb-4 font-bold">Applicant photo</h2>{photo[0] ? <Image unoptimized width={320} height={400} className="mb-4 aspect-[4/5] w-full rounded-xl object-cover" src={`/api/files/${photo[0].id}`} alt={`${applicant.legalName} identity photograph`} /> : <div className="mb-4 grid aspect-[4/5] place-items-center rounded-xl bg-slate-100 text-sm text-slate-500">No photo uploaded</div>}<PhotoUploader applicantId={id} /></aside></div><section className="panel mt-6"><div className="panel-header"><h2 className="font-bold">Audit history</h2></div><div className="table-wrap"><table className="data-table"><thead><tr><th>When</th><th>Action</th><th>Entity</th></tr></thead><tbody>{history.map((entry) => <tr key={entry.id}><td>{entry.createdAt.toLocaleString("en-PK", { timeZone: "Asia/Karachi" })}</td><td>{entry.action}</td><td>{entry.entityType}</td></tr>)}</tbody></table></div></section></div>;
}
