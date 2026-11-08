/**
 * Rhansoft Ads — iklan produk Rhansoft yang bisa dipasang di aplikasi lain.
 *
 *   GET  /api/ads?key=SLOT_KEY[&format=][&style=][&limit=]  — iklan untuk satu slot (publik, CORS *)
 *   GET  /api/ads/click?key=SLOT_KEY&p=PRODUCT_ID            — hitung klik lalu buka halaman produk
 *   GET  /api/ads/embed.js                                   — skrip sematan untuk situs/aplikasi lain
 *   GET/POST/PUT/DELETE /api/admin/ad-slots[/:id]            — kelola slot (admin)
 *   GET/PUT /api/admin/ad-products[/:id]                     — produk mana yang boleh diiklankan (admin)
 *
 * Tabel: ad_slots + kolom products.ad_enabled (lihat db/migration_ads.sql).
 */
import crypto from "crypto"
import cors from "cors"
import { query, queryAll, queryOne } from "../db/pool.mjs"
import { authMiddleware } from "./auth.mjs"

const FORMATS = ["horizontal", "vertical", "square"]
const STYLES = ["image", "image_text"]

const siteUrl = () => (process.env.FRONTEND_URL || "https://app.rhantech.com").replace(/\/+$/, "")
// Absolute URL for product images stored as "/img/..." paths.
const absUrl = (p) => (!p ? null : /^https?:\/\//i.test(p) ? p : `${siteUrl()}${p.startsWith("/") ? "" : "/"}${p}`)
// Short plain-text teaser from a description that may contain markdown/HTML.
const teaser = (text, max = 110) => {
  const plain = String(text || "").replace(/<[^>]*>/g, " ").replace(/[#*_`>\[\]]/g, "").replace(/\s+/g, " ").trim()
  return plain.length > max ? `${plain.slice(0, max - 1).trimEnd()}…` : plain
}
const pick = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback)
const clampItems = (n, fallback = 3) => Math.min(6, Math.max(1, parseInt(n, 10) || fallback))

async function findSlot(key) {
  if (!key || typeof key !== "string" || key.length > 64) return null
  return queryOne(`SELECT * FROM ad_slots WHERE slot_key = $1 AND is_active = TRUE`, [key])
}

export function registerAdRoutes(app) {
  const publicCors = cors() // any origin, no credentials: the ads are public

  // ── Public: ads for a slot ───────────────────────────────────
  app.options("/api/ads", publicCors)
  app.get("/api/ads", publicCors, async (req, res) => {
    try {
      const slot = await findSlot(req.query.key)
      if (!slot) return res.status(404).json({ error: "Slot iklan tidak ditemukan atau nonaktif" })

      const limit = clampItems(req.query.limit, slot.max_items)
      const products = await queryAll(
        `SELECT id, name, price, original_price, image, description, color
           FROM products
          WHERE is_active = TRUE AND COALESCE(ad_enabled, TRUE) = TRUE
          ORDER BY random()
          LIMIT $1`,
        [limit]
      )
      await query(`UPDATE ad_slots SET impressions = impressions + 1 WHERE id = $1`, [slot.id])

      const base = siteUrl()
      res.set("Cache-Control", "public, max-age=60")
      res.json({
        slot: {
          name: slot.name,
          format: pick(req.query.format, FORMATS, slot.format),
          style: pick(req.query.style, STYLES, slot.style),
        },
        items: products.map((p) => ({
          id: p.id,
          name: p.name,
          tagline: teaser(p.description),
          price: Number(p.price),
          originalPrice: p.original_price ? Number(p.original_price) : null,
          image: absUrl(p.image),
          color: p.color || null,
          url: `${base}/api/ads/click?key=${encodeURIComponent(slot.slot_key)}&p=${encodeURIComponent(p.id)}`,
        })),
      })
    } catch (err) {
      console.error("[ads] list error:", err.message)
      res.status(500).json({ error: "Gagal memuat iklan" })
    }
  })

  // ── Public: click → product page ─────────────────────────────
  app.get("/api/ads/click", async (req, res) => {
    try {
      const product = req.query.p
        ? await queryOne(`SELECT id FROM products WHERE id = $1`, [String(req.query.p)])
        : null
      // Only ever redirect to our own product pages (no open redirect).
      if (!product) return res.redirect(302, siteUrl())

      const slot = await findSlot(req.query.key)
      if (slot) await query(`UPDATE ad_slots SET clicks = clicks + 1 WHERE id = $1`, [slot.id])

      const params = new URLSearchParams({
        utm_source: slot?.name || "rhansoft-ads",
        utm_medium: "ads",
        utm_campaign: slot?.slot_key || "unknown",
      })
      res.redirect(302, `${siteUrl()}/product/${encodeURIComponent(product.id)}?${params}`)
    } catch (err) {
      console.error("[ads] click error:", err.message)
      res.redirect(302, siteUrl())
    }
  })

  // ── Public: embed script ─────────────────────────────────────
  app.get("/api/ads/embed.js", publicCors, (req, res) => {
    res.set("Content-Type", "application/javascript; charset=utf-8")
    res.set("Cache-Control", "public, max-age=3600")
    res.send(EMBED_SCRIPT)
  })

  // ── Admin: slots ─────────────────────────────────────────────
  const admin = authMiddleware("admin")

  app.get("/api/admin/ad-slots", admin, async (req, res) => {
    try {
      res.json(await queryAll(`SELECT * FROM ad_slots ORDER BY created_at DESC`))
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  app.post("/api/admin/ad-slots", admin, async (req, res) => {
    try {
      const { name, site_url, format, style, max_items } = req.body || {}
      if (!name || !String(name).trim()) return res.status(400).json({ error: "Nama slot wajib diisi" })
      const slotKey = `rsk_${crypto.randomBytes(12).toString("hex")}`
      const row = await queryOne(
        `INSERT INTO ad_slots (slot_key, name, site_url, format, style, max_items)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [slotKey, String(name).trim(), site_url || null, pick(format, FORMATS, "horizontal"), pick(style, STYLES, "image_text"), clampItems(max_items)]
      )
      res.status(201).json(row)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  app.put("/api/admin/ad-slots/:id", admin, async (req, res) => {
    try {
      const current = await queryOne(`SELECT * FROM ad_slots WHERE id = $1`, [parseInt(req.params.id, 10)])
      if (!current) return res.status(404).json({ error: "Slot tidak ditemukan" })
      const b = req.body || {}
      const row = await queryOne(
        `UPDATE ad_slots SET name = $2, site_url = $3, format = $4, style = $5, max_items = $6, is_active = $7, updated_at = NOW()
          WHERE id = $1 RETURNING *`,
        [
          current.id,
          b.name !== undefined && String(b.name).trim() ? String(b.name).trim() : current.name,
          b.site_url !== undefined ? b.site_url || null : current.site_url,
          pick(b.format, FORMATS, current.format),
          pick(b.style, STYLES, current.style),
          b.max_items !== undefined ? clampItems(b.max_items) : current.max_items,
          typeof b.is_active === "boolean" ? b.is_active : current.is_active,
        ]
      )
      res.json(row)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  app.delete("/api/admin/ad-slots/:id", admin, async (req, res) => {
    try {
      await query(`DELETE FROM ad_slots WHERE id = $1`, [parseInt(req.params.id, 10)])
      res.json({ success: true })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  // ── Admin: which products may be advertised ──────────────────
  app.get("/api/admin/ad-products", admin, async (req, res) => {
    try {
      const rows = await queryAll(
        `SELECT id, name, image, price, COALESCE(ad_enabled, TRUE) AS ad_enabled
           FROM products WHERE is_active = TRUE ORDER BY sort_order, name`
      )
      res.json(rows.map((r) => ({ ...r, image: absUrl(r.image), price: Number(r.price) })))
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  app.put("/api/admin/ad-products/:id", admin, async (req, res) => {
    try {
      const row = await queryOne(
        `UPDATE products SET ad_enabled = $2 WHERE id = $1 RETURNING id, COALESCE(ad_enabled, TRUE) AS ad_enabled`,
        [req.params.id, req.body?.ad_enabled !== false]
      )
      if (!row) return res.status(404).json({ error: "Produk tidak ditemukan" })
      res.json(row)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })
}

/**
 * Embed script. Usage on any site:
 *   <div data-rhansoft-ad data-key="SLOT_KEY" data-format="horizontal" data-style="image_text"></div>
 *   <script async src="https://app.rhantech.com/api/ads/embed.js"></script>
 * data-format / data-style are optional (the slot's settings are used otherwise).
 * Optional data-note + data-note-url add a line under the ads (e.g. "Upgrade untuk menghapus iklan").
 */
const EMBED_SCRIPT = String.raw`(function () {
  var script = document.currentScript;
  var origin = script ? new URL(script.src).origin : "https://app.rhantech.com";
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function rupiah(n) {
    try { return "Rp " + Number(n).toLocaleString("id-ID"); } catch (e) { return "Rp " + n; }
  }
  function card(it, format, style) {
    var img = it.image
      ? '<img src="' + esc(it.image) + '" alt="' + esc(it.name) + '" loading="lazy" style="display:block;object-fit:cover;border-radius:8px;background:#f1f5f9;' +
        (style === "image" ? "width:100%;height:" + (format === "vertical" ? "140px" : "110px") + ";" :
         format === "square" ? "width:100%;aspect-ratio:16/10;height:auto;" : "width:72px;height:72px;flex:0 0 72px;") + '">'
      : "";
    var text = style === "image" ? "" :
      '<div style="min-width:0;flex:1">' +
        '<div style="font-weight:600;font-size:13px;line-height:1.3;color:#0f172a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(it.name) + "</div>" +
        (it.tagline ? '<div style="font-size:12px;line-height:1.4;color:#64748b;margin-top:2px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">' + esc(it.tagline) + "</div>" : "") +
        '<div style="font-size:13px;font-weight:700;color:' + esc(it.color || "#005596") + ';margin-top:4px">' + rupiah(it.price) +
          (it.originalPrice && it.originalPrice > it.price ? ' <span style="font-weight:400;color:#94a3b8;text-decoration:line-through;font-size:11px">' + rupiah(it.originalPrice) + "</span>" : "") +
        "</div>" +
      "</div>";
    var dir = style === "image" || format === "square" ? "column" : "row";
    return '<a href="' + esc(it.url) + '" target="_blank" rel="noopener sponsored" style="display:flex;flex-direction:' + dir +
      ';gap:10px;align-items:' + (dir === "row" ? "center" : "stretch") + ';padding:10px;border:1px solid #e2e8f0;border-radius:10px;background:#fff;text-decoration:none;min-width:0;' +
      (format === "horizontal" ? "flex:1 1 220px;" : "") + '">' + img + text + "</a>";
  }
  function render(el, data) {
    var format = el.getAttribute("data-format") || data.slot.format;
    var style = el.getAttribute("data-style") || data.slot.style;
    if (!data.items || !data.items.length) { el.innerHTML = ""; return; }
    var layout = format === "vertical" ? "display:flex;flex-direction:column;gap:8px;" :
      format === "square" ? "display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;" :
      "display:flex;flex-wrap:wrap;gap:10px;";
    var note = el.getAttribute("data-note");
    var noteUrl = el.getAttribute("data-note-url");
    el.innerHTML =
      '<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif">' +
        '<div style="font-size:10px;letter-spacing:.04em;text-transform:uppercase;color:#94a3b8;margin-bottom:6px">Iklan · Produk Rhansoft</div>' +
        '<div style="' + layout + '">' + data.items.map(function (it) { return card(it, format, style); }).join("") + "</div>" +
        (note ? '<div style="font-size:12px;color:#64748b;margin-top:8px">' + (noteUrl ? '<a href="' + esc(noteUrl) + '" style="color:#005596;font-weight:600">' + esc(note) + "</a>" : esc(note)) + "</div>" : "") +
      "</div>";
  }
  function load(el) {
    if (el.getAttribute("data-rhansoft-loaded")) return;
    el.setAttribute("data-rhansoft-loaded", "1");
    var key = el.getAttribute("data-key");
    if (!key) return;
    var qs = "key=" + encodeURIComponent(key);
    var limit = el.getAttribute("data-limit");
    if (limit) qs += "&limit=" + encodeURIComponent(limit);
    fetch(origin + "/api/ads?" + qs).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) { if (data) render(el, data); })
      .catch(function () { /* no ads: leave the space empty */ });
  }
  var nodes = document.querySelectorAll("[data-rhansoft-ad]");
  for (var i = 0; i < nodes.length; i++) load(nodes[i]);
})();
`
