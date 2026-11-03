/**
 * Rute klaim pelanggan lama.
 * Pelanggan mengirim klaim; admin menyetujui (membuat pesanan LEGACY- Rp 0 + permintaan lisensi)
 * atau menolak. Setelah disetujui, alur lisensi biasa (licenseRoutes.mjs) yang dipakai.
 */
import { createRateLimiter } from "./license.mjs"
import { validateClaim } from "./legacyClaims.mjs"

const CLAIMS_PER_HOUR = 5

export function registerLegacyClaimRoutes(app, deps) {
  const { authMiddleware, queryOne, queryAll, notifyAdminLegacyClaim } = deps
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
}
