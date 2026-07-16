import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/authorization";
import { canManageApplicants } from "@/lib/applicants/authorization";
import { getApplicantFormOptions } from "@/lib/applicants/queries";
import { ApplicantForm } from "../applicant-form";

export default async function NewApplicantPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageApplicants(user)) redirect("/forbidden");
  const options = await getApplicantFormOptions();
  return <div><div className="page-heading"><div><p className="eyebrow">Applicant registry</p><h1>Create applicant</h1><p>CNIC and phone values are normalized before storage.</p></div></div><ApplicantForm {...options} isAdmin={user.role === "ADMIN"} /></div>;
}
