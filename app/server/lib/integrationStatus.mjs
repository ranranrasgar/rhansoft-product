/**
 * Status integrasi yang diatur lewat .env (Midtrans, email SMTP, Cloudflare R2) untuk halaman Pengaturan admin.
 * Hanya mengembalikan "sudah diisi atau belum" plus info yang tidak rahasia (host, port, bucket):
 * kunci, token, dan sandi tidak pernah ikut dikirim.
 */

// Nilai contoh dari .env.example dianggap belum diisi (sama dengan lib/r2.mjs)
const PLACEHOLDERS = new Set([
  "your_account_id_here",
  "your_access_key_here",
  "your_secret_key_here",
  "https://your-r2-public-url.r2.dev",
])
const filled = (v) => typeof v === "string" && v.trim() !== "" && !PLACEHOLDERS.has(v.trim())

export function integrationStatus(env = process.env) {
  const production = env.MIDTRANS_ENV === "production"
  const prefix = production ? "MIDTRANS_PRODUCTION_" : "MIDTRANS_SANDBOX_"

  // Sama dengan lib/email.mjs: MAIL_* dengan cadangan SMTP_*
  const host = env.MAIL_HOST || env.SMTP_HOST || ""
  const user = env.MAIL_USERNAME || env.SMTP_USER || ""
  const pass = env.MAIL_PASSWORD || env.SMTP_PASS || ""
  const port = Number.parseInt(env.MAIL_PORT || env.SMTP_PORT || "587", 10)

  const storageConfigured = ["R2_ACCOUNT_ID", "R2_BUCKET_NAME", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_PUBLIC_URL"].every(
    (k) => filled(env[k])
  )

  return {
    midtrans: {
      configured: filled(env[`${prefix}SERVER_KEY`]) && filled(env[`${prefix}CLIENT_KEY`]),
      environment: production ? "production" : "sandbox",
    },
    email: filled(host) && filled(user) && filled(pass)
      ? { configured: true, host, port, sender: user }
      : { configured: false },
    storage: storageConfigured ? { configured: true, bucket: env.R2_BUCKET_NAME } : { configured: false },
  }
}
