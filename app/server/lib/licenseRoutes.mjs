/**
 * Rute permintaan nomor registrasi lisensi.
 * Pelanggan mengirim kode lisensi dari pesanan yang sudah lunas; admin menerbitkan nomornya
 * (dibuat di luar sistem ini). Tidak ada perhitungan nomor registrasi di sini.
 */
import {
  normalizeLicenseCode,
  validateLicenseCode,
  validateRegistrationNumber,
  createRateLimiter,
} from "./license.mjs"

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
  const { authMiddleware, queryOne, queryAll, pool, notifyAdminLicenseRequest, sendLicenseIssuedEmail } = deps
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

  // ── Admin: daftar, terbitkan, tolak ──────────────────────────
  const STATUSES = ["pending", "issued", "rejected"]

  app.get("/api/admin/license-requests", authMiddleware("admin"), async (req, res) => {
    try {
      const status = req.query.status
      if (status !== undefined && !STATUSES.includes(status)) {
        return res.status(400).json({ error: "Status tidak valid" })
      }
      const items = await queryAll(
        `SELECT lr.id, lr.status, lr.license_code, lr.registration_number, lr.admin_note,
                lr.created_at, lr.issued_at,
                trim(u.first_name || ' ' || COALESCE(u.last_name, '')) AS customer_name,
                u.email AS customer_email, oi.product_name,
                o.order_id, o.transaction_status AS order_status
         FROM license_requests lr
         JOIN users u ON u.id = lr.user_id
         JOIN order_items oi ON oi.id = lr.order_item_id
         JOIN orders o ON o.id = oi.order_id
         WHERE ($1::text IS NULL OR lr.status = $1)
         ORDER BY lr.created_at DESC, lr.id DESC
         LIMIT 500`,
        [status ?? null]
      )
      const pending = await queryOne(`SELECT count(*)::int AS n FROM license_requests WHERE status = 'pending'`)
      res.json({ items, pending_count: pending.n })
    } catch (err) {
      console.error("GET admin license-requests error:", err.message)
      res.status(500).json({ error: "Gagal memuat permintaan" })
    }
  })

  const loadRequest = (id) =>
    queryOne(
      `SELECT lr.id, lr.status, o.transaction_status, u.email, u.first_name, oi.product_name
       FROM license_requests lr
       JOIN users u ON u.id = lr.user_id
       JOIN order_items oi ON oi.id = lr.order_item_id
       JOIN orders o ON o.id = oi.order_id
       WHERE lr.id = $1`,
      [id]
    )

  app.put("/api/admin/license-requests/:id/issue", authMiddleware("admin"), async (req, res) => {
    const id = Number.parseInt(req.params.id, 10)
    if (!Number.isInteger(id)) return res.status(404).json({ error: "Permintaan tidak ditemukan" })
    try {
      const parsed = validateRegistrationNumber(req.body?.registration_number)
      if ("error" in parsed) return res.status(400).json({ error: parsed.error })

      const request = await loadRequest(id)
      if (!request) return res.status(404).json({ error: "Permintaan tidak ditemukan" })
      if (!PAID.includes(request.transaction_status)) {
        return res.status(409).json({ error: "Pesanan ini tidak lagi berstatus lunas" })
      }
      // Yang sudah terbit boleh dikoreksi; yang ditolak harus diminta ulang oleh pelanggan
      const updated = await queryOne(
        `UPDATE license_requests
         SET registration_number = $1, status = 'issued', issued_by = $2, issued_at = NOW(),
             admin_note = NULL, updated_at = NOW()
         WHERE id = $3 AND status IN ('pending', 'issued') RETURNING id`,
        [parsed.value, req.user.id, id]
      )
      if (!updated) return res.status(409).json({ error: "Permintaan ini sudah ditolak" })

      // Email tidak boleh menggagalkan penerbitan
      try {
        await sendLicenseIssuedEmail({
          to: request.email,
          firstName: request.first_name,
          productName: request.product_name,
          registrationNumber: parsed.value,
        })
      } catch (e) {
        console.error("sendLicenseIssuedEmail:", e.message)
      }
      res.json({ id, status: "issued" })
    } catch (err) {
      console.error("PUT issue error:", err.message)
      res.status(500).json({ error: "Gagal menerbitkan nomor registrasi" })
    }
  })

  app.put("/api/admin/license-requests/:id/reject", authMiddleware("admin"), async (req, res) => {
    const id = Number.parseInt(req.params.id, 10)
    if (!Number.isInteger(id)) return res.status(404).json({ error: "Permintaan tidak ditemukan" })
    try {
      const note = typeof req.body?.note === "string" ? req.body.note.trim() : ""
      if (!note) return res.status(400).json({ error: "Alasan penolakan wajib diisi" })
      if (note.length > 500) return res.status(400).json({ error: "Alasan maksimal 500 karakter" })

      const updated = await queryOne(
        `UPDATE license_requests SET status = 'rejected', admin_note = $1, updated_at = NOW()
         WHERE id = $2 AND status = 'pending' RETURNING id`,
        [note, id]
      )
      if (!updated) {
        const exists = await queryOne(`SELECT 1 AS ok FROM license_requests WHERE id = $1`, [id])
        return exists
          ? res.status(409).json({ error: "Hanya permintaan yang menunggu yang bisa ditolak" })
          : res.status(404).json({ error: "Permintaan tidak ditemukan" })
      }
      res.json({ id, status: "rejected" })
    } catch (err) {
      console.error("PUT reject error:", err.message)
      res.status(500).json({ error: "Gagal menolak permintaan" })
    }
  })
}
