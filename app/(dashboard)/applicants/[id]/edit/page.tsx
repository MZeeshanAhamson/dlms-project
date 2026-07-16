import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/authorization";
import { canAccessApplicant } from "@/lib/applicants/authorization";
import { getApplicantFormOptions } from "@/lib/applicants/queries";
import { getDatabase } from "@/lib/db";
import { applicants } from "@/lib/db/schema";
import { ApplicantForm } from "../../applicant-form";

export default async function EditApplicantPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const [applicant] = await getDatabase().select().from(applicants).where(eq(applicants.id, id)).limit(1);
  if (!applicant || !canAccessApplicant(user, applicant.homeBranchId)) redirect("/forbidden");
  const options = await getApplicantFormOptions();
  return <div><div className="page-heading"><div><p className="eyebrow">Applicant registry</p><h1>Edit {applicant.legalName}</h1><p>Updates affect the shared registry and are recorded in the audit history.</p></div></div><ApplicantForm {...options} isAdmin={user.role === "ADMIN"} applicant={{ id: applicant.id, cnic: applicant.cnic, legalName: applicant.legalName, fatherSpouseName: applicant.fatherSpouseName, dateOfBirth: applicant.dateOfBirth, gender: applicant.gender, nationalityId: applicant.nationalityId, bloodGroupId: applicant.bloodGroupId, phone: applicant.phone, email: applicant.email, address: applicant.address, provinceId: applicant.provinceId, homeBranchId: applicant.homeBranchId }} /></div>;
}
