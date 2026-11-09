/**
 * Status pembayaran untuk halaman tujuan pengalihan Midtrans.
 * Alamat pengalihan di dashboard Midtrans berlaku untuk seluruh akun, jadi halaman itu juga dipakai
 * pelanggan website lain. Karena itu endpoint ini hanya mengembalikan dua hal: kategori status
 * (dari Midtrans, bukan dari parameter di alamat) dan apakah pesanan itu milik toko ini.
 * Tidak ada nominal, metode bayar, atau data pelanggan.
 */
import { createRateLimiter } from "./license.mjs"

const ORDER_ID_RE = /^[A-Za-z0-9_.-]{1,100}$/

/** "paid" | "pending" | "failed" | "unknown" dari status transaksi Midtrans. */
export function categorizePaymentStatus(transactionStatus, fraudStatus) {
  if (transactionStatus === "settlement") return "paid"
  if (transactionStatus === "capture") return fraudStatus === "challenge" ? "pending" : "paid"
  if (transactionStatus === "pending") return "pending"
  if (["deny", "cancel", "expire", "failure", "refund", "partial_refund"].includes(transactionStatus)) return "failed"
  return "unknown"
}

const clientKey = (req) => String(req.headers["x-forwarded-for"] || req.ip || "").split(",")[0].trim()

export function registerPaymentResultRoute(app, { snap, queryOne, limit = 30 }) {
  const allow = createRateLimiter(limit, 60 * 1000)

  app.get("/api/payment-result/:orderId", async (req, res) => {
    const orderId = req.params.orderId
    if (!ORDER_ID_RE.test(orderId)) return res.status(400).json({ error: "Nomor pesanan tidak valid" })
    if (!allow(clientKey(req))) return res.status(429).json({ error: "Terlalu banyak permintaan" })

    let status = "unknown"
    try {
      const s = await snap.transaction.status(orderId)
      status = categorizePaymentStatus(s.transaction_status, s.fraud_status)
    } catch {
      // Midtrans tidak mengenal nomor ini (atau belum ada pembayaran): tetap "unknown"
    }
    try {
      const own = await queryOne("SELECT 1 AS ok FROM orders WHERE order_id = $1", [orderId])
      res.json({ status, own_store: Boolean(own) })
    } catch (err) {
      console.error("payment-result error:", err.message)
      res.status(500).json({ error: "Gagal memeriksa status" })
    }
  })
}
