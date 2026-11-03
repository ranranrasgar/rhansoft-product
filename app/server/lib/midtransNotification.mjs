/**
 * Alamat notifikasi tambahan per transaksi Snap.
 *
 * Akun Midtrans ini dipakai beberapa website, dan dashboard hanya menyimpan satu alamat notifikasi
 * (sekarang menuju aplikasi lain). Header `X-Append-Notification` menambahkan alamat toko ini untuk
 * transaksi yang dibuat toko ini saja; alamat akun tetap menerima notifikasi seperti biasa.
 * Midtrans menerima maksimal tiga alamat, dipisah koma.
 */

const MAX_URLS = 3
const HEADER = "X-Append-Notification"

/** Daftar alamat http(s) yang sah (maksimal tiga) dari string dipisah koma. */
export function parseNotificationUrls(value) {
  if (typeof value !== "string") return []
  return value
    .split(",")
    .map((u) => u.trim())
    .filter((u) => /^https?:\/\/[^\s,]+$/i.test(u))
    .slice(0, MAX_URLS)
}

/**
 * Pasang header pada permintaan pembuatan transaksi Snap (POST .../snap/v1/transactions) saja,
 * bukan pada cek status, pembatalan, atau refund. Mengembalikan true bila terpasang.
 */
export function applyAppendNotification(snap, value) {
  const urls = parseNotificationUrls(value)
  if (urls.length === 0) return false
  const joined = urls.join(",")

  snap.httpClient.http_client.interceptors.request.use((config) => {
    const isCreate = String(config.method).toLowerCase() === "post" && /\/snap\/v1\/transactions$/.test(config.url || "")
    if (isCreate) {
      if (typeof config.headers.set === "function") config.headers.set(HEADER, joined)
      else config.headers[HEADER] = joined
    }
    return config
  })
  return true
}
