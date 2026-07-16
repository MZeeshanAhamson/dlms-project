import { DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/authorization";
import { requireAccessibleApplicant } from "@/lib/applicants/authorization";
import { getDatabase } from "@/lib/db";
import { writeAudit } from "@/lib/db/audit";
import { applicantPhotos } from "@/lib/db/schema";
import { getStorageEnvironment } from "@/lib/env";
import { getS3Client } from "@/lib/storage/s3";

const requestSchema = z.object({ applicantId: z.string().uuid(), objectKey: z.string().min(1), mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]), size: z.number().int().positive() });

export async function POST(request: Request) {
  try {
    const user = await requireUser(["DATA_ENTRY_OPERATOR"]);
    const input = requestSchema.parse(await request.json());
    const applicant = await requireAccessibleApplicant(user, input.applicantId);
    const expectedPrefix = `applicants/${input.applicantId}/photos/`;
    if (!input.objectKey.startsWith(expectedPrefix) || input.objectKey.includes("..")) return NextResponse.json({ error: "Invalid object key." }, { status: 400 });
    const environment = getStorageEnvironment();
    if (input.size > environment.PHOTO_MAX_BYTES) return NextResponse.json({ error: "Photo exceeds the size limit." }, { status: 400 });
    const head = await getS3Client().send(new HeadObjectCommand({ Bucket: environment.S3_BUCKET, Key: input.objectKey }));
    if (head.ContentLength !== input.size || head.ContentType !== input.mimeType) return NextResponse.json({ error: "Uploaded object metadata does not match." }, { status: 400 });

    const database = getDatabase();
    const [current] = await database.select().from(applicantPhotos).where(and(eq(applicantPhotos.applicantId, applicant.id), eq(applicantPhotos.status, "ACTIVE"))).orderBy(desc(applicantPhotos.version)).limit(1);
    let createdId = "";
    await database.transaction(async (tx) => {
      if (current) await tx.update(applicantPhotos).set({ status: "SUPERSEDED", supersededAt: new Date() }).where(eq(applicantPhotos.id, current.id));
      const [created] = await tx.insert(applicantPhotos).values({ applicantId: applicant.id, objectKey: input.objectKey, bucket: environment.S3_BUCKET, mimeType: input.mimeType, size: input.size, etag: head.ETag, version: (current?.version ?? 0) + 1, uploadedById: user.id }).returning();
      createdId = created.id;
      await writeAudit(tx, { actorUserId: user.id, branchId: applicant.homeBranchId, action: current ? "REPLACE_PHOTO" : "UPLOAD_PHOTO", entityType: "APPLICANT_PHOTO", entityId: created.id, before: current, after: created, metadata: { applicantId: applicant.id } });
    });
    if (current) await getS3Client().send(new DeleteObjectCommand({ Bucket: current.bucket, Key: current.objectKey })).catch(() => undefined);
    return NextResponse.json({ photoId: createdId });
  } catch (error) {
    console.error("Applicant photo finalization failed", error);
    return NextResponse.json({ error: "Upload could not be finalized." }, { status: 403 });
  }
}
