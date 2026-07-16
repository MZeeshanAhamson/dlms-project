import { requireUser } from "@/lib/auth/authorization";

const roleContent = {
  ADMIN: ["System administration", "Master data and users", "Global operational visibility"],
  DATA_ENTRY_OPERATOR: ["Applicant registration", "Application data entry", "Assigned branch records"],
  PAYMENT_OFFICER: ["Payment queue", "Fee verification", "Assigned branch records"],
  LICENSE_OFFICER: ["Issuance queue", "Issued licenses", "Assigned branch records"],
  EXAMINER: ["Examination queue", "Attempt recording", "Assigned branch records"],
} as const;

export default async function DashboardPage() {
  const user = await requireUser();
  return <div><div className="page-heading"><div><p className="eyebrow">Workspace</p><h1>Good day, {user.name}</h1><p>Your dashboard reflects your current role and branch assignment.</p></div></div><section className="grid gap-5 md:grid-cols-3" aria-label="Role capabilities">{roleContent[user.role].map((item, index) => <article className="metric-card" key={item}><span className="metric-index">0{index + 1}</span><h2>{item}</h2><p>Ready for the next operational milestone.</p></article>)}</section></div>;
}
