import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { StorageEnv } from "../config/env";
import { AppError } from "./appError";

const REGION = "auto";

function r2Config() {
  const { R2_ACCOUNT_ID, R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_BASE_URL } = StorageEnv;
  if (!R2_ACCOUNT_ID || !R2_BUCKET_NAME || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_PUBLIC_BASE_URL) {
    throw new AppError(503, "Cloudflare R2 uploads are not configured yet");
  }
  return { R2_ACCOUNT_ID, R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_BASE_URL };
}

export async function uploadImageToR2(
  key: string,
  content: Buffer,
  contentType: string,
): Promise<string> {
  const config = r2Config();
  const endpoint = `https://${config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  const client = new S3Client({
    region: REGION,
    endpoint,
    credentials: {
      accessKeyId: config.R2_ACCESS_KEY_ID,
      secretAccessKey: config.R2_SECRET_ACCESS_KEY,
    },
    maxAttempts: 3,
  });
  try {
    await client.send(new PutObjectCommand({
      Bucket: config.R2_BUCKET_NAME,
      Key: key,
      Body: content,
      ContentType: contentType,
    }));
  } catch (error) {
    const name = error instanceof Error ? error.name : "UnknownError";
    if (name === "SignatureDoesNotMatch" || name === "AccessDenied") {
      console.error("Image upload failed: R2 credentials were rejected");
      throw new AppError(502, "Image upload failed because storage access was rejected");
    }
    console.error(`Image upload failed: ${name}`);
    throw new AppError(502, "Image upload failed. Please try again");
  } finally {
    client.destroy();
  }

  return `${config.R2_PUBLIC_BASE_URL.replace(/\/+$/, "")}/${encodedKey}`;
}

export function assertImageSignature(content: Buffer, contentType: string): void {
  const isPng = content.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isJpeg = content.subarray(0, 3).equals(Buffer.from([255, 216, 255]));
  const isWebp = content.subarray(0, 4).toString() === "RIFF" && content.subarray(8, 12).toString() === "WEBP";
  if (!((contentType === "image/png" && isPng) || (contentType === "image/jpeg" && isJpeg) || (contentType === "image/webp" && isWebp))) {
    throw new AppError(400, "Unsupported or invalid image file");
  }
}

export async function copyRemoteImageToR2(remoteUrl: string, key: string): Promise<string> {
  const response = await fetch(remoteUrl);
  if (!response.ok) throw new Error(`Unable to retrieve generated image: ${response.status}`);
  const contentType = response.headers.get("content-type")?.split(";", 1)[0] ?? "image/png";
  const content = Buffer.from(await response.arrayBuffer());
  if (content.length > 20 * 1024 * 1024) throw new Error("Generated image exceeds the storage size limit");
  assertImageSignature(content, contentType);
  return uploadImageToR2(key, content, contentType);
}
