/**
 * Rute klaim pelanggan lama.
 * Pelanggan mengirim klaim; admin menyetujui (membuat pesanan LEGACY- Rp 0 + permintaan lisensi)
 * atau menolak. Setelah disetujui, alur lisensi biasa (licenseRoutes.mjs) yang dipakai.
 */
import { createRateLimiter } from "./license.mjs"
import { validateClaim, parseQuantity, LEGACY_PREFIX, MAX_COMPUTERS } from "./legacyClaims.mjs"

const CLAIMS_PER_HOUR = 5

export function registerLegacyClaimRoutes(app, deps) {
  const { authMiddleware, queryOne, queryAll, pool, notifyAdminLegacyClaim } = deps
  const allow = createRateLimiter(CLAIMS_PER_HOUR, 60 * 60 * 1000)

  // ── Pelanggan: kirim klaim ──
  app.post("/api/legacy-claims", authMiddleware(), async (req, res) => {
    try {
      const checked = validateClaim(req.body)
      if (checked.error) return res.status(400).json({ error: checked.error })
      const c = checked.value

      let productName = c.product_other
      if (c.product_id) {
        const product = await queryOne(`SELECT name FROM products WHERE id = $1`, [c.product_id])
        if (!product) return res.status(400).json({ error: "Produk tidak ditemukan" })
        productName = product.name
      }

      const duplicate = await queryOne(
        `SELECT id FROM legacy_claims
         WHERE user_id = $1 AND status = 'pending'
           AND (product_id = $2 OR (product_id IS NULL AND lower(product_other) = lower($3)))`,
        [req.user.id, c.product_id, c.product_other]
      )
      if (duplicate) return res.status(409).json({ error: "Klaim untuk produk ini masih diperiksa admin" })

      if (!allow(req.user.id)) {
        return res.status(429).json({ error: "Terlalu banyak klaim. Coba lagi satu jam lagi." })
      }

      const row = await queryOne(
        `INSERT INTO legacy_claims (user_id, product_id, product_other, company, phone, quantity, license_codes, note)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [req.user.id, c.product_id, c.product_other, c.company, c.phone, c.quantity, JSON.stringify(c.license_codes), c.note]
      )

      // Pemberitahuan ke admin tidak boleh menggagalkan klaim
      Promise.resolve()
        .then(() =>
          notifyAdminLegacyClaim({
            customerName: `${req.user.first_name} ${req.user.last_name || ""}`.trim(),
            productName,
          })
        )
        .catch((e) => console.error("notifyAdminLegacyClaim:", e.message))

      res.status(201).json({ id: row.id, status: "pending" })
    } catch (err) {
      console.error("POST legacy-claims error:", err.message)
      res.status(500).json({ error: "Gagal menyimpan klaim" })
    }
  })

  // ── Pelanggan: klaim milik sendiri ──
  app.get("/api/my/legacy-claims", authMiddleware(), async (req, res) => {
    try {
      const rows = await queryAll(
        `SELECT lc.id, lc.status, lc.quantity, lc.created_at, lc.admin_note,
                COALESCE(p.name, lc.product_other) AS product_name
         FROM legacy_claims lc LEFT JOIN products p ON p.id = lc.product_id
         WHERE lc.user_id = $1 ORDER BY lc.created_at DESC, lc.id DESC`,
        [req.user.id]
      )
      res.json(
        rows.map(({ admin_note, ...r }) => (r.status === "rejected" ? { ...r, admin_note } : r))
      )
    } catch (err) {
      console.error("GET my legacy-claims error:", err.message)
      res.status(500).json({ error: "Gagal memuat klaim" })
    }
  })

  // ── Admin: daftar, setujui, tolak ──
  const STATUSES = ["pending", "approved", "rejected"]
  const claimId = (req) => {
    const id = Number(req.params.id)
    return Number.isInteger(id) && id > 0 && id <= 2147483647 ? id : null
  }

  app.get("/api/admin/legacy-claims", authMiddleware("admin"), async (req, res) => {
    try {
      const status = STATUSES.includes(req.query.status) ? req.query.status : null
      const rows = await queryAll(
        `SELECT lc.id, lc.status, lc.company, lc.phone, lc.quantity, lc.license_codes, lc.note, lc.admin_note,
                lc.product_id, lc.product_other, lc.created_at, lc.reviewed_at,
                COALESCE(p.name, lc.product_other) AS product_name,
                trim(u.first_name || ' ' || COALESCE(u.last_name, '')) AS customer_name,
                u.email AS customer_email, o.order_id
         FROM legacy_claims lc
         JOIN users u ON u.id = lc.user_id
         LEFT JOIN products p ON p.id = lc.product_id
         LEFT JOIN orders o ON o.id = lc.order_id
         WHERE ($1::text IS NULL OR lc.status = $1)
         ORDER BY lc.created_at DESC, lc.id DESC
         LIMIT 500`,
        [status]
      )
      res.json(rows)
    } catch (err) {
      console.error("GET admin legacy-claims error:", err.message)
      res.status(500).json({ error: "Gagal memuat klaim" })
    }
  })

  app.put("/api/admin/legacy-claims/:id/approve", authMiddleware("admin"), async (req, res) => {
    const id = claimId(req)
    if (!id) return res.status(404).json({ error: "Klaim tidak ditemukan" })
    const productId = typeof req.body?.product_id === "string" ? req.body.product_id.trim() : ""
    const quantity = parseQuantity(req.body?.quantity)
    if (!productId) return res.status(400).json({ error: "Pilih produk untuk klaim ini" })
    if (quantity === null) return res.status(400).json({ error: `Jumlah komputer 1-${MAX_COMPUTERS}` })

    const client = await pool.connect()
    try {
      await client.query("BEGIN")
      // Kunci baris agar dua admin yang menyetujui bersamaan tidak membuat dua pesanan
      const found = await client.query(
        `SELECT lc.*, u.first_name, u.last_name, u.email
         FROM legacy_claims lc JOIN users u ON u.id = lc.user_id
         WHERE lc.id = $1 FOR UPDATE OF lc`,
        [id]
      )
      const c = found.rows[0]
      const fail = async (status, error) => {
        await client.query("ROLLBACK")
        return res.status(status).json({ error })
      }
      if (!c) return fail(404, "Klaim tidak ditemukan")
      if (c.status !== "pending") return fail(409, "Klaim ini sudah diproses")
      if (quantity < c.license_codes.length) {
        return fail(400, "Jumlah komputer tidak boleh kurang dari banyaknya kode lisensi")
      }
      const product = (await client.query(`SELECT id, name FROM products WHERE id = $1`, [productId])).rows[0]
      if (!product) return fail(400, "Produk tidak ditemukan")

      const customer = await client.query(
        `INSERT INTO customers (first_name, last_name, email, phone) VALUES ($1, $2, $3, $4) RETURNING id`,
        [c.first_name, c.last_name, c.email, c.phone]
      )
      const orderId = `${LEGACY_PREFIX}${Date.now()}-${c.id}`
      const order = await client.query(
        `INSERT INTO orders (order_id, customer_id, user_id, gross_amount, total_amount,
                             transaction_status, payment_type, payment_method, paid_at)
         VALUES ($1, $2, $3, 0, 0, 'settlement', 'legacy', 'legacy', NOW()) RETURNING id`,
        [orderId, customer.rows[0].id, c.user_id]
      )
      const item = await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, price, quantity)
         VALUES ($1, $2, $3, 0, $4) RETURNING id`,
        [order.rows[0].id, product.id, product.name, quantity]
      )
      for (const code of c.license_codes) {
        await client.query(
          `INSERT INTO license_requests (user_id, order_item_id, license_code) VALUES ($1, $2, $3)`,
          [c.user_id, item.rows[0].id, code]
        )
      }
      await client.query(
        `UPDATE legacy_claims SET status = 'approved', order_id = $1, reviewed_by = $2, reviewed_at = NOW()
         WHERE id = $3`,
        [order.rows[0].id, req.user.id, id]
      )
      await client.query("COMMIT")
      res.json({ order_id: orderId })
    } catch (err) {
      await client.query("ROLLBACK").catch(() => {})
      console.error("PUT approve legacy-claim error:", err.message)
      res.status(500).json({ error: "Gagal menyetujui klaim" })
    } finally {
      client.release()
    }
  })

  app.put("/api/admin/legacy-claims/:id/reject", authMiddleware("admin"), async (req, res) => {
    const id = claimId(req)
    if (!id) return res.status(404).json({ error: "Klaim tidak ditemukan" })
    const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : ""
    if (!reason) return res.status(400).json({ error: "Alasan penolakan wajib diisi" })
    if (reason.length > 500) return res.status(400).json({ error: "Alasan maksimal 500 karakter" })
    try {
      const row = await queryOne(
        `UPDATE legacy_claims SET status = 'rejected', admin_note = $1, reviewed_by = $2, reviewed_at = NOW()
         WHERE id = $3 AND status = 'pending' RETURNING id`,
        [reason, req.user.id, id]
      )
      if (row) return res.json({ status: "rejected" })
      const exists = await queryOne(`SELECT id FROM legacy_claims WHERE id = $1`, [id])
      res.status(exists ? 409 : 404).json({ error: exists ? "Klaim ini sudah diproses" : "Klaim tidak ditemukan" })
    } catch (err) {
      console.error("PUT reject legacy-claim error:", err.message)
      res.status(500).json({ error: "Gagal menolak klaim" })
    }
  })
}
