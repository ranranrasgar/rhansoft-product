/**
 * Rute permintaan nomor registrasi lisensi.
 * Pelanggan mengirim kode lisensi dari pesanan yang sudah lunas; admin menerbitkan nomornya
 * (dibuat di luar sistem ini). Tidak ada perhitungan nomor registrasi di sini.
 */
import { normalizeLicenseCode, validateLicenseCode, createRateLimiter } from "./license.mjs"

const PAID = ["settlement", "capture"]
const REQUESTS_PER_HOUR = 10

/** Permintaan milik pengguna, dikelompokkan per order_item_id. Field sensitif disaring menurut status. */
export async function fetchMyLicenseRequests(queryAll, userId) {
  const rows = await queryAll(
    `SELECT id, order_item_id, license_code, status, created_at, registration_number, admin_note
     FROM license_requests WHERE user_id = $1 ORDER BY created_at, id`,
    [userId]
  )
  const grouped = {}
  for (const r of rows) {
    const view = { id: r.id, license_code: r.license_code, status: r.status, created_at: r.created_at }
    if (r.status === "issued") view.registration_number = r.registration_number
    if (r.status === "rejected") view.admin_note = r.admin_note
    ;(grouped[r.order_item_id] ||= []).push(view)
  }
  return grouped
}

export function registerLicenseRoutes(app, deps) {
  const { authMiddleware, queryOne, pool, notifyAdminLicenseRequest } = deps
  const allow = createRateLimiter(REQUESTS_PER_HOUR, 60 * 60 * 1000)

  // ── Pelanggan: minta nomor registrasi untuk satu item pesanan ──
  app.post("/api/my/order-items/:id/license-requests", authMiddleware(), async (req, res) => {
    const itemId = Number.parseInt(req.params.id, 10)
    if (!Number.isInteger(itemId)) return res.status(404).json({ error: "Pesanan tidak ditemukan" })

    try {
      const item = await queryOne(
        `SELECT oi.id, oi.product_name, o.order_id, o.transaction_status
         FROM order_items oi JOIN orders o ON o.id = oi.order_id
         WHERE oi.id = $1 AND o.user_id = $2`,
        [itemId, req.user.id]
      )
      if (!item) return res.status(404).json({ error: "Pesanan tidak ditemukan" })
      if (!PAID.includes(item.transaction_status)) {
        return res.status(409).json({ error: "Nomor registrasi hanya bisa diminta untuk pesanan yang sudah lunas" })
      }

      const code = normalizeLicenseCode(req.body?.license_code)
      const invalid = validateLicenseCode(code)
      if (invalid) return res.status(400).json({ error: invalid })

      if (!allow(req.user.id)) {
        return res.status(429).json({ error: "Terlalu banyak permintaan. Coba lagi satu jam lagi." })
      }

      // Kuota dan sisipan dalam satu transaksi dengan kunci baris agar permintaan bersamaan tidak melampaui kuota
      const client = await pool.connect()
      let created
      try {
        await client.query("BEGIN")
        const locked = await client.query(`SELECT quantity FROM order_items WHERE id = $1 FOR UPDATE`, [itemId])
        const used = await client.query(
          `SELECT count(*)::int AS n FROM license_requests WHERE order_item_id = $1 AND status <> 'rejected'`,
          [itemId]
        )
        if (used.rows[0].n >= locked.rows[0].quantity) {
          await client.query("ROLLBACK")
          return res.status(409).json({ error: "Kuota lisensi untuk produk ini sudah habis" })
        }
        created = await client.query(
          `INSERT INTO license_requests (user_id, order_item_id, license_code) VALUES ($1, $2, $3) RETURNING id`,
          [req.user.id, itemId, code]
        )
        await client.query("COMMIT")
      } catch (err) {
        await client.query("ROLLBACK").catch(() => {})
        if (err.code === "23505") {
          return res.status(409).json({ error: "Kode lisensi ini sudah pernah diminta untuk produk ini" })
        }
        throw err
      } finally {
        client.release()
      }

      // Pemberitahuan ke admin tidak boleh menggagalkan permintaan
      Promise.resolve(
        notifyAdminLicenseRequest({
          customerName: `${req.user.first_name} ${req.user.last_name || ""}`.trim(),
          productName: item.product_name,
          orderId: item.order_id,
        })
      ).catch((e) => console.error("notifyAdminLicenseRequest:", e.message))

      res.status(201).json({ id: created.rows[0].id, status: "pending" })
    } catch (err) {
      console.error("POST license-requests error:", err.message)
      res.status(500).json({ error: "Gagal menyimpan permintaan" })
    }
  })
}
