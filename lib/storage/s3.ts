import { S3Client } from "@aws-sdk/client-s3";
import { getStorageEnvironment } from "@/lib/env";

let client: S3Client | undefined;

export function getS3Client() {
  const environment = getStorageEnvironment();
  client ??= new S3Client({
    endpoint: environment.S3_ENDPOINT,
    region: environment.S3_REGION,
    forcePathStyle: environment.S3_FORCE_PATH_STYLE,
    credentials: {
      accessKeyId: environment.S3_ACCESS_KEY_ID,
      secretAccessKey: environment.S3_SECRET_ACCESS_KEY,
    },
  });
  return client;
}
