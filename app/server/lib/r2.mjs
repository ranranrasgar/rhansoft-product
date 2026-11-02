// ============================================================
//  Cloudflare R2 Client (S3-compatible API)
//  Upload & kompres gambar ke R2, bukan server lokal
// ============================================================
import { S3Client } from "@aws-sdk/client-s3"

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || ""

// R2 endpoint format: https://<account_id>.r2.cloudflarestorage.com
const R2_ENDPOINT = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`

export const r2Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

export const R2_BUCKET = process.env.R2_BUCKET_NAME || "rhansoft-store"

/**
 * Build public URL for an object stored in R2.
 * @param {string} key - Object key (e.g. "products/abc123.jpg")
 * @returns {string} Full public URL
 */
export function getR2PublicUrl(key) {
  const base = R2_PUBLIC_URL.replace(/\/$/, "")
  return `${base}/${key}`
}

/**
 * Check if R2 is configured (credentials filled in .env)
 */
export function isR2Configured() {
  return (
    R2_ACCOUNT_ID &&
    R2_ACCOUNT_ID !== "your_account_id_here" &&
    R2_ACCESS_KEY_ID &&
    R2_ACCESS_KEY_ID !== "your_access_key_here" &&
    R2_SECRET_ACCESS_KEY &&
    R2_SECRET_ACCESS_KEY !== "your_secret_key_here" &&
    R2_PUBLIC_URL &&
    R2_PUBLIC_URL !== "https://your-r2-public-url.r2.dev"
  )
}
