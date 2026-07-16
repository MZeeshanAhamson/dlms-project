import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/authorization";
import { canAccessApplicant } from "@/lib/applicants/authorization";
import { getDatabase } from "@/lib/db";
import { applicantPhotos, applicants } from "@/lib/db/schema";
import { getS3Client } from "@/lib/storage/s3";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const [row] = await getDatabase().select({ photo: applicantPhotos, homeBranchId: applicants.homeBranchId }).from(applicantPhotos).innerJoin(applicants, eq(applicantPhotos.applicantId, applicants.id)).where(eq(applicantPhotos.id, id)).limit(1);
  if (!row || row.photo.status !== "ACTIVE") return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canAccessApplicant(user, row.homeBranchId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = await getSignedUrl(getS3Client(), new GetObjectCommand({ Bucket: row.photo.bucket, Key: row.photo.objectKey }), { expiresIn: 60 });
  return NextResponse.redirect(url);
}
