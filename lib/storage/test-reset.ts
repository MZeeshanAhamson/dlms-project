import { CreateBucketCommand, DeleteObjectsCommand, HeadBucketCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getStorageEnvironment } from "@/lib/env";
import { getS3Client } from "./s3";

export async function resetTestBucket() {
  const environment = getStorageEnvironment();
  const client = getS3Client();
  try {
    await client.send(new HeadBucketCommand({ Bucket: environment.S3_BUCKET }));
  } catch {
    await client.send(new CreateBucketCommand({ Bucket: environment.S3_BUCKET }));
  }

  let continuationToken: string | undefined;
  do {
    const listed = await client.send(new ListObjectsV2Command({ Bucket: environment.S3_BUCKET, ContinuationToken: continuationToken }));
    if (listed.Contents?.length) {
      await client.send(new DeleteObjectsCommand({ Bucket: environment.S3_BUCKET, Delete: { Objects: listed.Contents.map((item) => ({ Key: item.Key! })), Quiet: true } }));
    }
    continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
  } while (continuationToken);
}
