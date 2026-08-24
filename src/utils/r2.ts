import { createHash, createHmac } from "crypto";
import { StorageEnv } from "../config/env";
import { AppError } from "./appError";

const REGION = "auto";
const SERVICE = "s3";

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(key: string | Buffer, value: string): Buffer {
  return createHmac("sha256", key).update(value).digest();
}

function credentialScope(date: string): string {
  return `${date}/${REGION}/${SERVICE}/aws4_request`;
}

function signingKey(secret: string, date: string): Buffer {
  return hmac(hmac(hmac(hmac(`AWS4${secret}`, date), REGION), SERVICE), "aws4_request");
}

function r2Config() {
  const { R2_ACCOUNT_ID, R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_BASE_URL } = StorageEnv;
  if (!R2_ACCOUNT_ID || !R2_BUCKET_NAME || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_PUBLIC_BASE_URL) {
    throw new AppError(503, "Cloudflare R2 uploads are not configured yet");
  }
  return { R2_ACCOUNT_ID, R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_BASE_URL };
}

function amzDateParts(now: Date): { date: string; timestamp: string } {
  const timestamp = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return { date: timestamp.slice(0, 8), timestamp };
}

export async function uploadImageToR2(
  key: string,
  content: Buffer,
  contentType: string,
): Promise<string> {
  const config = r2Config();
  const endpoint = `https://${config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  const path = `/${config.R2_BUCKET_NAME}/${encodedKey}`;
  const { date, timestamp } = amzDateParts(new Date());
  const payloadHash = sha256(content);
  const host = new URL(endpoint).host;
  const canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${timestamp}\n`;
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = `PUT\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const stringToSign = `AWS4-HMAC-SHA256\n${timestamp}\n${credentialScope(date)}\n${sha256(canonicalRequest)}`;
  const signature = createHmac("sha256", signingKey(config.R2_SECRET_ACCESS_KEY, date))
    .update(stringToSign)
    .digest("hex");
  const authorization = `AWS4-HMAC-SHA256 Credential=${config.R2_ACCESS_KEY_ID}/${credentialScope(date)}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(`${endpoint}${path}`, {
    method: "PUT",
    headers: {
      "content-type": contentType,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": timestamp,
      authorization,
    },
    body: new Uint8Array(content),
  });
  if (!response.ok) {
    throw new Error(`R2 upload failed with status ${response.status}: ${await response.text()}`);
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
