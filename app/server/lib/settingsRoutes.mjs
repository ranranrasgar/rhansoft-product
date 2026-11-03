/**
 * Pengaturan sistem: ongkos kirim (tabel settings, key "shipping") dan status integrasi dari .env.
 */
import { DEFAULT_SHIPPING, normalizeShippingSettings } from "./shippingSettings.mjs"
import { integrationStatus } from "./integrationStatus.mjs"

const SHIPPING_KEY = "shipping"

/** Pengaturan ongkir yang berlaku; bila belum ada atau nilainya rusak, bawaan (nonaktif) dipakai. */
export async function loadShippingSettings(queryOne) {
  const row = await queryOne(`SELECT value FROM settings WHERE key = $1`, [SHIPPING_KEY])
  if (!row) return { ...DEFAULT_SHIPPING, province_rates: {} }
  const parsed = normalizeShippingSettings(row.value)
  return "value" in parsed ? parsed.value : { ...DEFAULT_SHIPPING, province_rates: {} }
}

export function registerSettingsRoutes(app, { authMiddleware, queryOne }) {
  const send = async (res) => {
    try {
      res.json(await loadShippingSettings(queryOne))
    } catch (err) {
      console.error("load shipping settings error:", err.message)
      res.status(500).json({ error: "Gagal memuat pengaturan ongkos kirim" })
    }
  }

  // Publik: dibutuhkan checkout untuk menampilkan ongkir dan pilihan provinsi
  app.get("/api/shipping-config", (req, res) => send(res))

  app.get("/api/admin/settings/shipping", authMiddleware("admin"), (req, res) => send(res))

  app.put("/api/admin/settings/shipping", authMiddleware("admin"), async (req, res) => {
    const parsed = normalizeShippingSettings(req.body)
    if ("error" in parsed) return res.status(400).json({ error: parsed.error })
    try {
      await queryOne(
        `INSERT INTO settings (key, value, updated_by, updated_at) VALUES ($1, $2, $3, NOW())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
        [SHIPPING_KEY, JSON.stringify(parsed.value), req.user.id]
      )
      res.json(parsed.value)
    } catch (err) {
      console.error("save shipping settings error:", err.message)
      res.status(500).json({ error: "Gagal menyimpan pengaturan ongkos kirim" })
    }
  })

  // Status Midtrans/email/R2 dari .env (tanpa kunci rahasia) untuk halaman Pengaturan
  app.get("/api/admin/settings/integrations", authMiddleware("admin"), (req, res) => {
    res.json(integrationStatus())
  })
}
