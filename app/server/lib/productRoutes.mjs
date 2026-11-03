/**
 * Membuat produk baru dari panel admin (Tambah Produk dan Salin produk).
 * Bentuk body sama dengan PUT /api/products/:id di index.mjs; kategori boleh berupa nama atau id.
 */
import crypto from "node:crypto"

const MAX_ID = 50

/** Id produk dari nama: slug huruf kecil + akhiran acak 6 karakter agar salinan tidak bentrok. */
export function productIdFromName(name) {
  const slug =
    String(name)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "produk"
  const suffix = crypto.randomBytes(4).toString("hex").slice(0, 6)
  return `${slug.slice(0, MAX_ID - suffix.length - 1).replace(/-+$/, "")}-${suffix}`
}

/** Kategori dari nama ("POS & Retail") atau id ("pos-retail"); null bila tidak ada. */
export async function resolveCategoryId(client, category) {
  if (typeof category !== "string" || !category.trim()) return null
  const row = await client.query(`SELECT id FROM categories WHERE id = $1 OR name = $1 LIMIT 1`, [category.trim()])
  return row.rows[0]?.id ?? null
}

/** Ganti spesifikasi, highlight, dan platform produk (yang dikirim saja). */
export async function writeProductRelations(client, id, { specs, highlights, platformIds }) {
  if (Array.isArray(specs)) {
    await client.query("DELETE FROM product_specs WHERE product_id = $1", [id])
    for (let j = 0; j < specs.length; j++) {
      await client.query(
        `INSERT INTO product_specs (product_id, label, value, sort_order) VALUES ($1, $2, $3, $4)`,
        [id, specs[j].label, specs[j].value, j]
      )
    }
  }
  if (Array.isArray(highlights)) {
    await client.query("DELETE FROM product_highlights WHERE product_id = $1", [id])
    for (let j = 0; j < highlights.length; j++) {
      await client.query(
        `INSERT INTO product_highlights (product_id, highlight, sort_order) VALUES ($1, $2, $3)`,
        [id, highlights[j], j]
      )
    }
  }
  if (Array.isArray(platformIds)) {
    await client.query("DELETE FROM product_platforms WHERE product_id = $1", [id])
    for (let j = 0; j < platformIds.length; j++) {
      await client.query(
        `INSERT INTO product_platforms (product_id, platform_id, sort_order) VALUES ($1, $2, $3)
         ON CONFLICT (product_id, platform_id) DO NOTHING`,
        [id, platformIds[j], j]
      )
    }
  }
}

const json = (v) => (v == null ? null : JSON.stringify(v))
const isRupiah = (v) => Number.isInteger(v) && v >= 0

export function registerProductCreateRoute(app, { authMiddleware, pool }) {
  app.post("/api/products", authMiddleware("editor"), async (req, res) => {
    const b = req.body || {}
    const name = typeof b.name === "string" ? b.name.trim() : ""
    const description = typeof b.description === "string" ? b.description.trim() : ""
    const price = Number(b.price)
    const originalPrice = b.originalPrice == null || b.originalPrice === "" ? null : Number(b.originalPrice)
    const platformIds = Array.isArray(b.platformIds) ? b.platformIds : []

    if (!name || name.length > 200) return res.status(400).json({ error: "Nama produk wajib diisi (maksimal 200 karakter)" })
    if (!description) return res.status(400).json({ error: "Deskripsi wajib diisi" })
    if (!isRupiah(price)) return res.status(400).json({ error: "Harga harus bilangan bulat Rupiah 0 atau lebih" })
    if (originalPrice !== null && !isRupiah(originalPrice)) return res.status(400).json({ error: "Harga coret tidak sah" })
    if (platformIds.length === 0) return res.status(400).json({ error: "Pilih minimal 1 platform" })

    const client = await pool.connect()
    try {
      await client.query("BEGIN")
      const fail = async (error) => {
        await client.query("ROLLBACK")
        return res.status(400).json({ error })
      }

      const categoryId = await resolveCategoryId(client, b.category)
      if (!categoryId) return fail("Kategori tidak ditemukan")
      const known = await client.query(`SELECT id FROM platforms WHERE id = ANY($1::text[])`, [platformIds])
      if (known.rowCount !== new Set(platformIds).size) return fail("Platform tidak dikenal")

      const id = productIdFromName(name)
      // Produk baru tampil paling akhir di katalog
      await client.query(
        `INSERT INTO products (id, name, category_id, price, original_price, description, image, badge, version,
                               platform, license, download_size, color, download_links, install_tutorial, gallery,
                               featured, is_active, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, TRUE,
                 (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM products))`,
        [
          id,
          name,
          categoryId,
          price,
          originalPrice || null,
          description,
          b.image || null,
          b.badge || null,
          b.version || null,
          b.platform || null,
          b.license || null,
          b.downloadSize || null,
          b.color || null,
          json(b.downloadLinks || null),
          b.installTutorial || null,
          json(b.gallery || null),
          b.featured === true,
        ]
      )
      await writeProductRelations(client, id, { specs: b.specs, highlights: b.highlights, platformIds })
      await client.query("COMMIT")
      res.status(201).json({ id })
    } catch (err) {
      await client.query("ROLLBACK").catch(() => {})
      console.error("POST /api/products error:", err.message)
      res.status(500).json({ error: "Gagal menyimpan produk" })
    } finally {
      client.release()
    }
  })
}
