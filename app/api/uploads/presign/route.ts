import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/authorization";
import { requireAccessibleApplicant } from "@/lib/applicants/authorization";
import { getStorageEnvironment } from "@/lib/env";
import { getS3Client } from "@/lib/storage/s3";

const mimeExtensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const requestSchema = z.object({ applicantId: z.string().uuid(), mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]), size: z.number().int().positive() });

export async function POST(request: Request) {
  try {
    const user = await requireUser(["DATA_ENTRY_OPERATOR"]);
    const input = requestSchema.parse(await request.json());
    await requireAccessibleApplicant(user, input.applicantId);
    const environment = getStorageEnvironment();
    if (input.size > environment.PHOTO_MAX_BYTES) return NextResponse.json({ error: "Photo exceeds the 5 MB limit." }, { status: 400 });
    const objectKey = `applicants/${input.applicantId}/photos/${crypto.randomUUID()}.${mimeExtensions[input.mimeType]}`;
    const uploadUrl = await getSignedUrl(getS3Client(), new PutObjectCommand({ Bucket: environment.S3_BUCKET, Key: objectKey, ContentType: input.mimeType, ContentLength: input.size }), { expiresIn: 300 });
    return NextResponse.json({ objectKey, uploadUrl, expiresIn: 300 });
  } catch (error) {
    console.error("Applicant photo presign failed", error);
    return NextResponse.json({ error: "Upload could not be authorized." }, { status: 403 });
  }
}
