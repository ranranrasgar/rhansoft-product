/**
 * Rhansoft Store — Backend API Server
 *
 * Express + PostgreSQL + Midtrans
 *
 * Endpoints:
 *   GET  /api/health                     — health check
 *   GET  /api/categories                 — list all categories
 *   GET  /api/products                   — list all products (with specs, highlights)
 *   GET  /api/products/:id              — get single product detail
 *   GET  /api/products?category=X       — filter by category name
 *   GET  /api/promos                     — list promos
 *   GET  /api/hero-slides                — list hero slides
 *   POST /api/create-transaction        — create Midtrans Snap transaction
 *   GET  /api/transaction-status/:id    — check transaction status
 *   POST /api/webhook                    — Midtrans payment notification webhook
 *   GET  /api/orders                     — list all orders
 */
import crypto from "crypto"
import path from "path"
import { fileURLToPath } from "url"
import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import multer from "multer"
import sharp from "sharp"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { r2Client, R2_BUCKET, getR2PublicUrl, isR2Configured } from "./lib/r2.mjs"
import midtransClient from "midtrans-client"
import { registerLicenseRoutes, fetchMyLicenseRequests } from "./lib/licenseRoutes.mjs"
import { notifyAdminLicenseRequest } from "./lib/email.mjs"
import { pool, query, queryAll, queryOne, testConnection } from "./db/pool.mjs"
import {
  registerUser,
  loginUser,
  loginWithGoogle,
  signToken,
  getUserById,
  authMiddleware,
} from "./lib/auth.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, ".env") })

const app = express()
const PORT = process.env.PORT || 3001

// ── Midtrans Configuration ─────────────────────────────────────
const MIDTRANS_MERCHANT_ID = process.env.MIDTRANS_MERCHANT_ID || "G627599304"
const IS_PRODUCTION = process.env.MIDTRANS_ENV === "production"
const CLIENT_KEY = IS_PRODUCTION
  ? process.env.MIDTRANS_PRODUCTION_CLIENT_KEY
  : process.env.MIDTRANS_SANDBOX_CLIENT_KEY
const SERVER_KEY = IS_PRODUCTION
  ? process.env.MIDTRANS_PRODUCTION_SERVER_KEY
  : process.env.MIDTRANS_SANDBOX_SERVER_KEY

const snap = new midtransClient.Snap({
  isProduction: IS_PRODUCTION,
  serverKey: SERVER_KEY,
  clientKey: CLIENT_KEY,
})

// ── Middleware ──────────────────────────────────────────────────
app.use(express.json())
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:4173",
      "http://127.0.0.1:5173",
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
  })
)

// Request logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`)
  next()
})

// ── Multer (memory storage, file processed by sharp before R2 upload) ──
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max upload (sebelum kompres)
  },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error("Format gambar harus JPG, PNG, WebP, atau GIF"))
    }
  },
})

// ═══════════════════════════════════════════════════════════════
//  ROUTES
// ═══════════════════════════════════════════════════════════════

// ── Health check ────────────────────────────────────────────────
app.get("/api/health", async (req, res) => {
  try {
    const dbResult = await queryOne("SELECT NOW() as now")
    res.json({
      status: "ok",
      environment: IS_PRODUCTION ? "production" : "sandbox",
      merchantId: MIDTRANS_MERCHANT_ID,
      database: dbResult ? "connected" : "disconnected",
      dbTime: dbResult?.now,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    res.status(500).json({ status: "error", database: "disconnected", error: err.message })
  }
})

// ── Metode pembayaran yang ditawarkan di checkout ───────────────
// Isi ENABLED_PAYMENT_METHODS di .env (pisah koma) sesuai channel yang sudah aktif
// di dashboard Midtrans. Kosong = checkout tidak memilih metode; popup Midtrans
// menampilkan semua metode yang aktif (default Midtrans).
const ALL_PAYMENT_METHODS = ["card", "gopay", "bank_transfer", "shopeepay"]
const ENABLED_PAYMENT_METHODS = (() => {
  const list = (process.env.ENABLED_PAYMENT_METHODS || "")
    .split(",")
    .map((m) => m.trim())
    .filter((m) => ALL_PAYMENT_METHODS.includes(m))
  return list
})()

// ── Midtrans public config ──────────────────────────────────────
app.get("/api/midtrans-config", (req, res) => {
  res.json({
    paymentMethods: ENABLED_PAYMENT_METHODS,
    isProduction: IS_PRODUCTION,
    merchantId: MIDTRANS_MERCHANT_ID,
    clientKey: CLIENT_KEY,
    snapUrl: IS_PRODUCTION
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js",
  })
})

// ═══════════════════════════════════════════════════════════════
//  AUTH ROUTES (Register, Login, Google OAuth, Me, Update Role)
//  Roles: admin, user, editor
// ═══════════════════════════════════════════════════════════════

// ── Register (manual) ─────────────────────────────────────────
app.post("/api/auth/register", async (req, res) => {
  try {
    const { first_name, last_name, email, password } = req.body

    if (!first_name || !email || !password) {
      return res.status(400).json({
        error: "Nama depan, email, dan password wajib diisi",
      })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password minimal 6 karakter" })
    }

    const user = await registerUser({ first_name, last_name, email, password })
    const token = signToken(user)

    console.log(`✅ User registered: ${email} (role: user)`)
    res.status(201).json({ user, token })
  } catch (err) {
    console.error("POST /api/auth/register error:", err.message)
    res.status(400).json({ error: err.message })
  }
})

// ── Login (manual) ────────────────────────────────────────────
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: "Email dan password wajib diisi" })
    }

    const user = await loginUser({ email, password })
    const token = signToken(user)

    console.log(`✅ User logged in: ${email} (role: ${user.role})`)
    res.json({ user, token })
  } catch (err) {
    console.error("POST /api/auth/login error:", err.message)
    res.status(401).json({ error: err.message })
  }
})

// ── Google OAuth login ───────────────────────────────────────
app.post("/api/auth/google", async (req, res) => {
  try {
    const { credential } = req.body
    if (!credential) {
      return res.status(400).json({ error: "Google credential tidak ditemukan" })
    }

    const user = await loginWithGoogle(credential)
    const token = signToken(user)

    console.log(`✅ Google login: ${user.email} (role: ${user.role})`)
    res.json({ user, token })
  } catch (err) {
    console.error("POST /api/auth/google error:", err.message)
    res.status(400).json({ error: err.message })
  }
})

// ── Get current user (from token) ────────────────────────────
app.get("/api/auth/me", authMiddleware(), async (req, res) => {
  res.json({ user: req.user })
})

// ── Admin: list all users ─────────────────────────────────────
app.get("/api/admin/users", authMiddleware("admin"), async (req, res) => {
  try {
    const rows = await queryAll(
      `SELECT id, first_name, last_name, email, avatar_url, role, is_active,
       last_login_at, created_at
       FROM users ORDER BY created_at DESC`
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Admin: update user role ───────────────────────────────────
app.put("/api/admin/users/:id/role", authMiddleware("admin"), async (req, res) => {
  try {
    const { id } = req.params
    const { role } = req.body

    const validRoles = ["admin", "user", "editor"]
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Role harus: admin, user, atau editor" })
    }

    // Prevent admin from demoting themselves
    if (parseInt(id) === req.user.id && role !== "admin") {
      return res.status(400).json({ error: "Anda tidak bisa menurunkan role Anda sendiri" })
    }

    const row = await queryOne(
      `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, first_name, last_name, email, role`,
      [role, id]
    )
    if (!row) return res.status(404).json({ error: "User tidak ditemukan" })

    console.log(`✅ User ${row.email} role changed to ${role}`)
    res.json(row)
  } catch (err) {
    console.error("PUT /api/admin/users/:id/role error:", err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── Admin: toggle user active status ─────────────────────────
app.put("/api/admin/users/:id/status", authMiddleware("admin"), async (req, res) => {
  try {
    const { id } = req.params
    const { is_active } = req.body

    if (parseInt(id) === req.user.id && !is_active) {
      return res.status(400).json({ error: "Anda tidak bisa menonaktifkan akun Anda sendiri" })
    }

    const row = await queryOne(
      `UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING id, first_name, last_name, email, is_active`,
      [is_active, id]
    )
    if (!row) return res.status(404).json({ error: "User tidak ditemukan" })

    console.log(`✅ User ${row.email} ${is_active ? "activated" : "deactivated"}`)
    res.json(row)
  } catch (err) {
    console.error("PUT /api/admin/users/:id/status error:", err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── Categories (CRUD) ─────────────────────────────────────────────
app.get("/api/categories", async (req, res) => {
  try {
    const rows = await queryAll(
      `SELECT * FROM categories ORDER BY sort_order ASC`
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post("/api/categories", authMiddleware("editor"), async (req, res) => {
  try {
    const { id, name, tagline, icon, gradient } = req.body
    if (!id || !name) {
      return res.status(400).json({ error: "id dan name wajib diisi" })
    }
    const maxOrder = await queryOne(
      `SELECT COALESCE(MAX(sort_order), -1) as max_order FROM categories`
    )
    const sortOrder = (maxOrder?.max_order ?? -1) + 1
    const result = await queryOne(
      `INSERT INTO categories (id, name, tagline, icon, count, gradient, sort_order)
       VALUES ($1, $2, $3, $4, 0, $5, $6) RETURNING *`,
      [id, name, tagline || "", icon || "Package", gradient || "from-slate-50 to-slate-100", sortOrder]
    )
    res.json(result)
  } catch (err) {
    console.error("POST /api/categories error:", err.message)
    res.status(500).json({ error: err.message })
  }
})

app.put("/api/categories/:id", authMiddleware("editor"), async (req, res) => {
  try {
    const { id } = req.params
    const { name, tagline, icon, gradient, sort_order } = req.body
    const result = await queryOne(
      `UPDATE categories SET
        name = COALESCE($1, name),
        tagline = COALESCE($2, tagline),
        icon = COALESCE($3, icon),
        gradient = COALESCE($4, gradient),
        sort_order = COALESCE($5, sort_order)
       WHERE id = $6 RETURNING *`,
      [name, tagline, icon, gradient, sort_order, id]
    )
    if (!result) return res.status(404).json({ error: "Category not found" })
    res.json(result)
  } catch (err) {
    console.error("PUT /api/categories error:", err.message)
    res.status(500).json({ error: err.message })
  }
})

app.delete("/api/categories/:id", authMiddleware("editor"), async (req, res) => {
  try {
    const { id } = req.params
    // Cek apakah ada produk yang pakai kategori ini
    const count = await queryOne(
      `SELECT COUNT(*) as cnt FROM products WHERE category_id = $1 AND is_active = TRUE`,
      [id]
    )
    if (parseInt(count?.cnt) > 0) {
      return res.status(400).json({
        error: `Tidak bisa hapus — masih ada ${count.cnt} produk di kategori ini. Pindahkan produk ke kategori lain dulu.`,
      })
    }
    await query(`DELETE FROM categories WHERE id = $1`, [id])
    res.json({ status: "ok", id })
  } catch (err) {
    console.error("DELETE /api/categories error:", err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── Image Upload ke Cloudflare R2 ─────────────────────────────────
// POST /api/upload  (multipart/form-data, field: "image")
// Kompres gambar (max 1200px width, quality 80) sebelum upload ke R2
app.post("/api/upload", authMiddleware("editor"), upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "File gambar tidak ditemukan" })
    }

    if (!isR2Configured()) {
      return res.status(500).json({
        error: "Cloudflare R2 belum dikonfigurasi. Isi R2_ACCOUNT_ID, R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_URL di file .env",
      })
    }

    // Kompres gambar dengan sharp:
    // - Resize max width 1200px (keep aspect ratio)
    // - Convert ke JPEG quality 80 (ukuran file lebih kecil)
    // - Batasi output max 500KB
    let processedBuffer = await sharp(req.file.buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer()

    // Jika masih > 500KB, kompres lebih agresif
    if (processedBuffer.length > 500 * 1024) {
      let quality = 70
      while (processedBuffer.length > 500 * 1024 && quality > 30) {
        processedBuffer = await sharp(req.file.buffer)
          .resize({ width: 1000, withoutEnlargement: true })
          .jpeg({ quality, mozjpeg: true })
          .toBuffer()
        quality -= 10
      }
    }

    // Generate unique filename
    const ext = ".jpg"
    const filename = `products/${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`

    // Upload ke R2
    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: filename,
        Body: processedBuffer,
        ContentType: "image/jpeg",
      })
    )

    const publicUrl = getR2PublicUrl(filename)

    console.log(`✅ Uploaded ${req.file.originalname} → ${filename} (${(processedBuffer.length / 1024).toFixed(0)} KB)`)

    res.json({
      url: publicUrl,
      key: filename,
      size: processedBuffer.length,
      sizeFormatted: `${(processedBuffer.length / 1024).toFixed(0)} KB`,
    })
  } catch (err) {
    console.error("POST /api/upload error:", err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── Platforms (master data) ─────────────────────────────────────
app.get("/api/platforms", async (req, res) => {
  try {
    const rows = await queryAll(
      `SELECT * FROM platforms ORDER BY sort_order ASC`
    )
    res.json(rows)
  } catch (err) {
    console.error("GET /api/platforms error:", err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── Products (all or filtered by category) ───────────────────────
app.get("/api/products", async (req, res) => {
  try {
    const { category, search } = req.query

    let sql = `
      SELECT
        p.*,
        c.name as category_name,
        COALESCE(ps.specs, '[]') as specs,
        COALESCE(ph.highlights, '[]') as highlights,
        COALESCE(ppl.platforms, '[]') as platforms
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN LATERAL (
        SELECT json_agg(json_build_object('label', s.label, 'value', s.value) ORDER BY s.sort_order) as specs
        FROM product_specs s WHERE s.product_id = p.id
      ) ps ON true
      LEFT JOIN LATERAL (
        SELECT json_agg(ph2.highlight ORDER BY ph2.sort_order) as highlights
        FROM product_highlights ph2 WHERE ph2.product_id = p.id
      ) ph ON true
      LEFT JOIN LATERAL (
        SELECT json_agg(json_build_object('id', pl.id, 'name', pl.name, 'icon', pl.icon) ORDER BY pp.sort_order) as platforms
        FROM product_platforms pp
        JOIN platforms pl ON pl.id = pp.platform_id
        WHERE pp.product_id = p.id
      ) ppl ON true
      WHERE p.is_active = TRUE
    `

    const params = []
    const conditions = []

    if (category && category !== "all") {
      conditions.push("c.name = $" + (params.length + 1))
      params.push(category)
    }

    if (search) {
      conditions.push(
        "(p.name ILIKE $" +
          (params.length + 1) +
          " OR p.description ILIKE $" +
          (params.length + 1) +
          ")"
      )
      params.push(`%${search}%`)
    }

    if (conditions.length > 0) {
      sql += " AND " + conditions.join(" AND ")
    }

    sql += " ORDER BY p.sort_order ASC"

    const rows = await queryAll(sql, params)

    // Transform: gallery comes as JSONB string from pg, convert specs/highlights arrays
    const products = rows.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category_name,
      price: parseInt(p.price),
      originalPrice: p.original_price ? parseInt(p.original_price) : undefined,
      rating: parseFloat(p.rating),
      reviews: p.reviews,
      badge: p.badge,
      image: p.image,
      color: p.color,
      description: p.description,
      specs: p.specs.map((s) => ({ label: s.label, value: s.value })),
      highlights: p.highlights,
      gallery: p.gallery,
      platform: p.platform,
      version: p.version,
      license: p.license,
      downloadSize: p.download_size,
      downloadLinks: p.download_links || [],
      installTutorial: p.install_tutorial || "",
      featured: p.featured === true || p.featured === "true" || p.featured === true,
      platforms: p.platforms || [],
    }))

    res.json(products)
  } catch (err) {
    console.error("GET /api/products error:", err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── Single product ───────────────────────────────────────────────
app.get("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params

    const rows = await queryAll(
      `
      SELECT
        p.*,
        c.name as category_name,
        COALESCE(ps.specs, '[]') as specs,
        COALESCE(ph.highlights, '[]') as highlights,
        COALESCE(ppl.platforms, '[]') as platforms
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN LATERAL (
        SELECT json_agg(json_build_object('label', s.label, 'value', s.value) ORDER BY s.sort_order) as specs
        FROM product_specs s WHERE s.product_id = p.id
      ) ps ON true
      LEFT JOIN LATERAL (
        SELECT json_agg(ph2.highlight ORDER BY ph2.sort_order) as highlights
        FROM product_highlights ph2 WHERE ph2.product_id = p.id
      ) ph ON true
      LEFT JOIN LATERAL (
        SELECT json_agg(json_build_object('id', pl.id, 'name', pl.name, 'icon', pl.icon) ORDER BY pp.sort_order) as platforms
        FROM product_platforms pp
        JOIN platforms pl ON pl.id = pp.platform_id
        WHERE pp.product_id = p.id
      ) ppl ON true
      WHERE p.id = $1 AND p.is_active = TRUE
      `,
      [id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: "Product not found" })
    }

    const p = rows[0]
    const product = {
      id: p.id,
      name: p.name,
      category: p.category_name,
      price: parseInt(p.price),
      originalPrice: p.original_price ? parseInt(p.original_price) : undefined,
      rating: parseFloat(p.rating),
      reviews: p.reviews,
      badge: p.badge,
      image: p.image,
      color: p.color,
      description: p.description,
      specs: p.specs.map((s) => ({ label: s.label, value: s.value })),
      highlights: p.highlights,
      gallery: p.gallery,
      platform: p.platform,
      version: p.version,
      license: p.license,
      downloadSize: p.download_size,
      downloadLinks: p.download_links || [],
      installTutorial: p.install_tutorial || "",
      featured: p.featured === true || p.featured === "true" || p.featured === true,
      platforms: p.platforms || [],
    }

    res.json(product)
  } catch (err) {
    console.error("GET /api/products/:id error:", err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── Promos ───────────────────────────────────────────────────────
app.get("/api/promos", async (req, res) => {
  try {
    const rows = await queryAll(
      `SELECT * FROM promos WHERE is_active = TRUE ORDER BY sort_order ASC`
    )
    const promos = rows.map((p) => ({
      id: p.id,
      eyebrow: p.eyebrow,
      title: p.title,
      subtitle: p.subtitle,
      cta: p.cta,
      theme: p.theme,
      image: p.image,
    }))
    res.json(promos)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Hero slides ──────────────────────────────────────────────────
app.get("/api/hero-slides", async (req, res) => {
  try {
    const rows = await queryAll(
      `SELECT * FROM hero_slides WHERE is_active = TRUE ORDER BY sort_order ASC`
    )
    const slides = rows.map((h) => ({
      id: h.id,
      eyebrow: h.eyebrow,
      title: h.title,
      subtitle: h.subtitle,
      cta: h.cta,
      secondaryCta: h.secondary_cta,
      image: h.image,
      align: h.align,
      color: h.color,
    }))
    res.json(slides)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Create Midtrans Transaction ─────────────────────────────────
const MAX_CART_LINES = 50
const MAX_ITEM_QUANTITY = 100

app.post("/api/create-transaction", authMiddleware(), async (req, res) => {
  const client = await pool.connect()

  try {
    const {
      order_id,
      customer,
      items: requestedItems,
      payment_method,
    } = req.body

    // Validate
    // Catatan: gross_amount, items[].price, shipping_cost, dan tax dari client
    // sengaja diabaikan — semua nominal dihitung ulang di server dari tabel products.
    if (!order_id || !customer || !Array.isArray(requestedItems) || requestedItems.length === 0) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["order_id", "customer", "items"],
      })
    }

    if (requestedItems.length > MAX_CART_LINES) {
      return res.status(400).json({ error: "Terlalu banyak item dalam keranjang" })
    }

    for (const it of requestedItems) {
      if (!it || typeof it.id !== "string" || !it.id) {
        return res.status(400).json({ error: "Item tidak valid" })
      }
      if (!Number.isInteger(it.quantity) || it.quantity < 1 || it.quantity > MAX_ITEM_QUANTITY) {
        return res.status(400).json({ error: `Jumlah tidak valid untuk produk ${it.id}` })
      }
    }

    // Ambil harga resmi dari database
    const productIds = [...new Set(requestedItems.map((it) => it.id))]
    const productRows = await client.query(
      `SELECT p.id, p.name, p.price, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = ANY($1::varchar[]) AND p.is_active = TRUE`,
      [productIds]
    )
    const productMap = new Map(productRows.rows.map((r) => [r.id, r]))
    const unknownIds = productIds.filter((id) => !productMap.has(id))
    if (unknownIds.length > 0) {
      return res.status(400).json({ error: `Produk tidak ditemukan: ${unknownIds.join(", ")}` })
    }

    const items = requestedItems.map((it) => {
      const p = productMap.get(it.id)
      return {
        id: p.id,
        name: p.name,
        price: Number(p.price),
        quantity: it.quantity,
        brand: "Rhansoft",
        category: p.category_name || "Software",
      }
    })

    const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0)
    // Harus sama dengan CheckoutPage.tsx: gratis ongkir mulai Rp 1.000.000, selain itu Rp 25.000
    const shippingCost = subtotal >= 1000000 ? 0 : 25000
    const taxAmount = Math.round(subtotal * 0.11)
    const totalAmount = subtotal + shippingCost + taxAmount

    if (Number(req.body.gross_amount) !== totalAmount) {
      console.warn(
        `⚠️  gross_amount dari client (${req.body.gross_amount}) berbeda dengan hitungan server (${totalAmount}) untuk order ${order_id}`
      )
    }

    if (payment_method && ENABLED_PAYMENT_METHODS.length && !ENABLED_PAYMENT_METHODS.includes(payment_method)) {
      return res.status(400).json({ error: "Metode pembayaran ini belum tersedia" })
    }

    await client.query("BEGIN")

    // 1. Insert or find customer
    let customerRow = await client.query(
      "SELECT id FROM customers WHERE email = $1 AND phone = $2",
      [customer.email, customer.phone]
    )

    let customerId
    if (customerRow.rows.length > 0) {
      customerId = customerRow.rows[0].id
    } else {
      const newCustomer = await client.query(
        `INSERT INTO customers (first_name, last_name, email, phone, address, city, postal_code, country_code)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [
          customer.first_name,
          customer.last_name || "",
          customer.email,
          customer.phone,
          customer.shipping_address?.address || "",
          customer.shipping_address?.city || "",
          customer.shipping_address?.postal_code || "",
          customer.shipping_address?.country_code || "ID",
        ]
      )
      customerId = newCustomer.rows[0].id
    }

    // 2. Create order in DB
    const orderRow = await client.query(
      `INSERT INTO orders
        (order_id, customer_id, user_id, gross_amount, shipping_cost, tax, total_amount,
         payment_method, transaction_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending') RETURNING id`,
      [order_id, customerId, req.user.id, totalAmount, shippingCost, taxAmount, totalAmount, payment_method]
    )

    const orderIdDb = orderRow.rows[0].id

    // 3. Insert order items
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, price, quantity, brand, category)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          orderIdDb,
          item.id,
          item.name,
          item.price,
          item.quantity,
          item.brand,
          item.category,
        ]
      )
    }

    // 4. Build Midtrans parameter
    // Tanpa pilihan metode: biarkan Midtrans menampilkan semua channel yang aktif
    const enabledPayments = payment_method ? getEnabledPayments(payment_method) : undefined

    // Midtrans requires ISO 3166-1 alpha-3 country_code (3 characters)
    const normalizeCountryCode = (code) => {
      if (!code || typeof code !== "string") return "IDN"
      const c = code.trim().toUpperCase()
      if (c.length === 3) return c
      // Indonesia 2-letter fallback
      if (c === "ID") return "IDN"
      return c.length === 2 ? c.padEnd(3, " ") : "IDN"
    }

    const shipping = customer.shipping_address || {}
    const midtransShippingAddress = {
      first_name: customer.first_name,
      last_name: customer.last_name || "",
      address: shipping.address || "",
      city: shipping.city || "",
      postal_code: shipping.postal_code || "",
      country_code: normalizeCountryCode(shipping.country_code || shipping.country),
      phone: customer.phone,
    }

    const parameter = {
      transaction_details: {
        order_id: order_id,
        gross_amount: totalAmount,
      },
      customer_details: {
        first_name: customer.first_name,
        last_name: customer.last_name || "",
        email: customer.email,
        phone: customer.phone,
        shipping_address: midtransShippingAddress,
      },
      item_details: [
        ...items.map((item) => ({
          id: item.id,
          name: item.name.length > 50 ? item.name.substring(0, 50) : item.name,
          price: item.price,
          quantity: item.quantity,
          brand: item.brand,
          category: item.category,
        })),
        ...(shippingCost > 0
          ? [{ id: "SHIPPING", name: "Ongkos Kirim", price: shippingCost, quantity: 1, brand: "Rhansoft", category: "Shipping" }]
          : []),
        ...(taxAmount > 0
          ? [{ id: "TAX", name: "PPN 11%", price: taxAmount, quantity: 1, brand: "Rhansoft", category: "Tax" }]
          : []),
      ],
      enabled_payments: enabledPayments,
      credit_card: payment_method === "card" ? { secure: true } : undefined,
    }

    console.log("\n📤 Transaction Request:")
    console.log(`   Order ID    : ${order_id}`)
    console.log(`   Amount      : Rp ${totalAmount.toLocaleString("id-ID")}`)
    console.log(`   Customer    : ${customer.first_name} ${customer.last_name || ""}`)
    console.log(`   Email       : ${customer.email}`)
    console.log(`   Phone       : ${customer.phone}`)
    console.log(`   Items       : ${items.length} product(s)`)
    console.log(`   Payment     : ${payment_method || "all"}`)

    // 5. Call Midtrans API
    const transaction = await snap.createTransaction(parameter)

    console.log("✅ Transaction created!")
    console.log(`   Token       : ${transaction.token.substring(0, 30)}...`)

    // 6. Save snap token to order
    await client.query(
      `UPDATE orders SET snap_token = $1, redirect_url = $2 WHERE id = $3`,
      [transaction.token, transaction.redirect_url, orderIdDb]
    )

    await client.query("COMMIT")

    res.json({
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      order_db_id: orderIdDb,
      client_key: CLIENT_KEY,
      is_production: IS_PRODUCTION,
      snap_url: IS_PRODUCTION
        ? "https://app.midtrans.com/snap/snap.js"
        : "https://app.sandbox.midtrans.com/snap/snap.js",
    })
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("❌ Transaction error:", error.message)

    const statusCode = error.Apiresponse?.status_code || 500
    const errorMsg = error.Apiresponse?.status_message || error.message

    res.status(statusCode).json({ error: errorMsg, details: error.message })
  } finally {
    client.release()
  }
})

// ── Transaction Status ──────────────────────────────────────────
app.get("/api/transaction-status/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params

    // Get from Midtrans
    const status = await snap.transaction.status(orderId)

    // Update DB
    await query(
      `UPDATE orders
       SET transaction_status = $1, payment_type = $2, paid_at = $3
       WHERE order_id = $4`,
      [
        status.transaction_status,
        status.payment_type,
        status.settlement_time || null,
        orderId,
      ]
    )

    res.json(status)
  } catch (error) {
    console.error("❌ Status error:", error.message)
    res.status(500).json({ error: error.message })
  }
})

// ── Midtrans Webhook (payment notification) ────────────────────
const handleWebhook = async (req, res) => {
  // Keamanan: webhook ini bisa dipanggil siapa saja, jadi body-nya tidak boleh dipercaya.
  // 1) tanda tangan Midtrans harus cocok, 2) status diambil langsung dari Midtrans,
  // 3) nominal harus sama dengan pesanan di database.
  const body = req.body || {}
  const expected = crypto
    .createHash("sha512")
    .update(`${body.order_id}${body.status_code}${body.gross_amount}${SERVER_KEY}`)
    .digest("hex")
  const given = String(body.signature_key || "")
  const signatureOk =
    given.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected))
  if (!signatureOk) {
    console.warn(`⚠️ Webhook ditolak: signature tidak valid (order ${body.order_id})`)
    return res.status(403).json({ error: "Signature tidak valid" })
  }

  let notif
  try {
    notif = await snap.transaction.status(body.order_id)
  } catch (err) {
    // Mis. notifikasi uji dari dashboard Midtrans atau transaksi belum ada: abaikan agar tidak diulang terus
    console.warn(`⚠️ Webhook diabaikan: status ${body.order_id} tidak ditemukan di Midtrans`)
    return res.status(200).json({ status: "ignored" })
  }

  const known = await queryOne("SELECT total_amount FROM orders WHERE order_id = $1", [notif.order_id])
  if (!known) return res.status(200).json({ status: "ignored" })
  if (Math.round(Number(notif.gross_amount)) !== Number(known.total_amount)) {
    console.error(
      `🚨 Webhook ditolak: nominal ${notif.gross_amount} tidak sama dengan pesanan ${notif.order_id} (${known.total_amount})`
    )
    return res.status(400).json({ error: "Nominal tidak cocok" })
  }

  const client = await pool.connect()

  try {

    console.log("\n📥 Webhook Notification:")
    console.log(`   Order ID    : ${notif.order_id}`)
    console.log(`   Status      : ${notif.transaction_status}`)
    console.log(`   Payment Type: ${notif.payment_type}`)
    console.log(`   Amount      : Rp ${notif.gross_amount}`)

    // 1. Log notification
    await client.query(
      `INSERT INTO payment_notifications
        (order_id, transaction_id, transaction_status, payment_type,
         gross_amount, fraud_status, status_code, status_message, raw_notification)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        notif.order_id,
        notif.transaction_id,
        notif.transaction_status,
        notif.payment_type,
        notif.gross_amount,
        notif.fraud_status,
        notif.status_code,
        notif.status_message,
        JSON.stringify(notif),
      ]
    )

    // 2. Update order status
    const paidAt =
      notif.transaction_status === "settlement" || notif.transaction_status === "capture"
        ? notif.settlement_time || new Date().toISOString()
        : null

    await client.query(
      `UPDATE orders
       SET transaction_status = $1, payment_type = $2, paid_at = $3,
           transaction_id = $4
       WHERE order_id = $5`,
      [
        notif.transaction_status,
        notif.payment_type,
        paidAt,
        notif.transaction_id,
        notif.order_id,
      ]
    )

    console.log(`✅ Order ${notif.order_id} updated to ${notif.transaction_status}`)

    // 3. Send email if payment is successful (settlement or capture)
    if (
      (notif.transaction_status === "settlement" ||
        notif.transaction_status === "capture") &&
      notif.fraud_status !== "deny"
    ) {
      try {
        const order = await client.query(
          `SELECT o.*, c.first_name, c.last_name, c.email, c.phone
           FROM orders o
           JOIN customers c ON o.customer_id = c.id
           WHERE o.order_id = $1`,
          [notif.order_id]
        )

        if (order.rows.length > 0) {
          const orderData = order.rows[0]

          const itemsRes = await client.query(
            `SELECT oi.*, p.download_links, p.install_tutorial, p.name as current_name
             FROM order_items oi
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = $1`,
            [orderData.id]
          )

          const { sendOrderEmail } = await import("./lib/email.mjs")
          await sendOrderEmail(orderData, itemsRes.rows)
          console.log(`📧 Confirmation email sent to ${orderData.email}`)
        }
      } catch (emailErr) {
        console.error("⚠️ Failed to send email:", emailErr.message)
      }
    }

    res.json({ status: "ok" })
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("❌ Webhook error:", error.message)
    res.status(500).json({ error: error.message })
  } finally {
    client.release()
  }
}

app.post("/api/webhook", handleWebhook)
app.post("/api/webhooks/midtrans/callback", handleWebhook)
app.post("/api/payment/notification", handleWebhook)

// ── List orders ─────────────────────────────────────────────────
app.get("/api/orders", authMiddleware("admin"), async (req, res) => {
  try {
    const rows = await queryAll(
      `SELECT o.*, c.first_name, c.last_name, c.email, c.phone,
       json_agg(json_build_object(
         'product_name', oi.product_name,
         'price', oi.price,
         'quantity', oi.quantity,
         'category', oi.category
       )) as items
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       GROUP BY o.id, c.id
       ORDER BY o.created_at DESC`
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Update product (admin) ───────────────────────────────────────
app.put("/api/products/:id", authMiddleware("editor"), async (req, res) => {
  const client = await pool.connect()
  try {
    const { id } = req.params
    const {
      name,
      price,
      originalPrice,
      description,
      image,
      badge,
      version,
      platform,
      license,
      downloadSize,
      color,
      downloadLinks,
      installTutorial,
      highlights,
      specs,
      gallery,
      featured,
      platformIds,
    } = req.body

    await client.query("BEGIN")

    // Update sebagian (mis. hanya { featured }) tidak boleh menimpa field lain dengan null
    const curRes = await client.query("SELECT * FROM products WHERE id = $1", [id])
    const cur = curRes.rows[0]
    if (!cur) {
      await client.query("ROLLBACK")
      return res.status(404).json({ error: "Produk tidak ditemukan" })
    }
    const pick = (v, c) => (v === undefined ? c : v)
    const json = (v) => (v == null ? null : JSON.stringify(v))

    await client.query(
      `UPDATE products SET
        name = $1, price = $2, original_price = $3, description = $4,
        image = $5, badge = $6, version = $7, platform = $8, license = $9,
        download_size = $10, color = $11, download_links = $12, install_tutorial = $13,
        gallery = $14, featured = $15, updated_at = NOW()
       WHERE id = $16`,
      [
        pick(name, cur.name),
        pick(price, cur.price),
        originalPrice === undefined ? cur.original_price : originalPrice || null,
        pick(description, cur.description),
        pick(image, cur.image),
        badge === undefined ? cur.badge : badge || null,
        pick(version, cur.version),
        pick(platform, cur.platform),
        pick(license, cur.license),
        pick(downloadSize, cur.download_size),
        pick(color, cur.color),
        downloadLinks === undefined ? json(cur.download_links) : json(downloadLinks || null),
        installTutorial === undefined ? cur.install_tutorial : installTutorial || null,
        gallery === undefined ? json(cur.gallery) : json(gallery || null),
        featured === undefined ? cur.featured : featured === true || featured === "true",
        id,
      ]
    )

    // Replace specs
    if (Array.isArray(specs)) {
      await client.query("DELETE FROM product_specs WHERE product_id = $1", [id])
      for (let j = 0; j < specs.length; j++) {
        await client.query(
          `INSERT INTO product_specs (product_id, label, value, sort_order) VALUES ($1, $2, $3, $4)`,
          [id, specs[j].label, specs[j].value, j]
        )
      }
    }

    // Replace highlights
    if (Array.isArray(highlights)) {
      await client.query("DELETE FROM product_highlights WHERE product_id = $1", [id])
      for (let j = 0; j < highlights.length; j++) {
        await client.query(
          `INSERT INTO product_highlights (product_id, highlight, sort_order) VALUES ($1, $2, $3)`,
          [id, highlights[j], j]
        )
      }
    }

    // Replace product_platforms (many-to-many)
    if (platformIds && Array.isArray(platformIds)) {
      await client.query("DELETE FROM product_platforms WHERE product_id = $1", [id])
      for (let j = 0; j < platformIds.length; j++) {
        await client.query(
          `INSERT INTO product_platforms (product_id, platform_id, sort_order) VALUES ($1, $2, $3)
           ON CONFLICT (product_id, platform_id) DO NOTHING`,
          [id, platformIds[j], j]
        )
      }
    }

    await client.query("COMMIT")
    res.json({ status: "ok", id })
  } catch (err) {
    await client.query("ROLLBACK")
    console.error("PUT /api/products/:id error:", err.message)
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

// ── List orders with items (admin) ───────────────────────────────
app.get("/api/admin/orders", authMiddleware("admin"), async (req, res) => {
  try {
    const rows = await queryAll(
      `SELECT o.*, c.first_name, c.last_name, c.email, c.phone,
       json_agg(json_build_object(
         'product_name', oi.product_name,
         'product_id', oi.product_id,
         'price', oi.price,
         'quantity', oi.quantity,
         'category', oi.category
       )) FILTER (WHERE oi.id IS NOT NULL) as items
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       GROUP BY o.id, c.id
       ORDER BY o.created_at DESC`
    )
    res.json(rows)
  } catch (err) {
    console.error("GET /api/admin/orders error:", err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── Resend email for an order (admin) ────────────────────────────
app.post("/api/admin/resend-email/:orderId", authMiddleware("admin"), async (req, res) => {
  try {
    const { orderId } = req.params
    const order = await queryOne(
      `SELECT o.*, c.first_name, c.last_name, c.email, c.phone
       FROM orders o
       JOIN customers c ON o.customer_id = c.id
       WHERE o.order_id = $1`,
      [orderId]
    )

    if (!order) return res.status(404).json({ error: "Order not found" })

    const items = await queryAll(
      `SELECT oi.*, p.download_links, p.install_tutorial, p.name as current_name
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [order.id]
    )

    const { sendOrderEmail } = await import("./lib/email.mjs")
    await sendOrderEmail(order, items)

    res.json({ status: "ok", message: "Email sent" })
  } catch (err) {
    console.error("Resend email error:", err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── Order actions (admin): approve, cancel, sync ─────────────────
async function sendOrderEmailFor(orderId) {
  const order = await queryOne(
    `SELECT o.*, c.first_name, c.last_name, c.email, c.phone
     FROM orders o
     JOIN customers c ON o.customer_id = c.id
     WHERE o.order_id = $1`,
    [orderId]
  )
  if (!order) throw new Error("Order not found")
  const items = await queryAll(
    `SELECT oi.*, p.download_links, p.install_tutorial, p.name as current_name
     FROM order_items oi
     LEFT JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = $1`,
    [order.id]
  )
  const { sendOrderEmail } = await import("./lib/email.mjs")
  await sendOrderEmail(order, items)
}

const isPaidStatus = (s) => s === "settlement" || s === "capture"

// Ambil status terbaru dari Midtrans, simpan, dan kirim email lisensi bila baru lunas
async function syncOrderFromMidtrans(order) {
  const s = await snap.transaction.status(order.order_id)
  const paid = isPaidStatus(s.transaction_status)
  await query(
    `UPDATE orders SET transaction_status = $1, payment_type = $2,
       paid_at = COALESCE(paid_at, $3), transaction_id = $4
     WHERE order_id = $5`,
    [
      s.transaction_status,
      s.payment_type,
      paid ? s.settlement_time || new Date().toISOString() : null,
      s.transaction_id,
      order.order_id,
    ]
  )
  let emailSent = false
  if (paid && !isPaidStatus(order.transaction_status) && s.fraud_status !== "deny") {
    try {
      await sendOrderEmailFor(order.order_id)
      emailSent = true
    } catch (e) {
      console.error("⚠️ Sync: failed to send email:", e.message)
    }
  }
  return { status: s.transaction_status, emailSent }
}

async function logOrderAction(order, status, paymentType, message, admin) {
  await query(
    `INSERT INTO payment_notifications
      (order_id, transaction_status, payment_type, gross_amount, status_message, raw_notification)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      order.order_id,
      status,
      paymentType,
      order.gross_amount,
      message,
      JSON.stringify({ source: "admin", admin: admin.email }),
    ]
  )
}

app.post("/api/admin/orders/:orderId/action", authMiddleware("admin"), async (req, res) => {
  try {
    const { orderId } = req.params
    const { action } = req.body
    const order = await queryOne(`SELECT * FROM orders WHERE order_id = $1`, [orderId])
    if (!order) return res.status(404).json({ error: "Pesanan tidak ditemukan" })

    if (action === "approve") {
      // Konfirmasi pembayaran manual (mis. transfer yang dicek sendiri). Midtrans tidak tahu.
      const row = await queryOne(
        `UPDATE orders SET transaction_status = 'settlement', payment_type = 'manual', paid_at = NOW()
         WHERE order_id = $1 AND transaction_status = 'pending' RETURNING order_id`,
        [orderId]
      )
      if (!row) return res.status(409).json({ error: "Hanya pesanan pending yang bisa disetujui" })
      await logOrderAction(order, "settlement", "manual", "Disetujui manual oleh admin", req.user)
      let emailSent = false
      try {
        await sendOrderEmailFor(orderId)
        emailSent = true
      } catch (e) {
        console.error("⚠️ Approve: failed to send email:", e.message)
      }
      console.log(`✅ Order ${orderId} disetujui manual oleh ${req.user.email}`)
      return res.json({ status: "settlement", emailSent })
    }

    if (action === "cancel") {
      if (order.transaction_status !== "pending") {
        return res.status(409).json({ error: "Hanya pesanan pending yang bisa dibatalkan" })
      }
      try {
        await snap.transaction.cancel(orderId)
      } catch (e) {
        // 404 = transaksi belum pernah dibayar/dibuat di Midtrans, aman dibatalkan lokal
        if (!String(e.message).includes("404")) {
          return res.status(502).json({ error: "Midtrans menolak pembatalan: " + e.message })
        }
      }
      const row = await queryOne(
        `UPDATE orders SET transaction_status = 'cancel'
         WHERE order_id = $1 AND transaction_status = 'pending' RETURNING order_id`,
        [orderId]
      )
      if (!row) return res.status(409).json({ error: "Status pesanan sudah berubah" })
      await logOrderAction(order, "cancel", order.payment_type, "Dibatalkan oleh admin", req.user)
      console.log(`🚫 Order ${orderId} dibatalkan oleh ${req.user.email}`)
      return res.json({ status: "cancel" })
    }

    if (action === "refund") {
      const reason = String(req.body.reason || "").trim()
      if (!reason) return res.status(400).json({ error: "Alasan refund wajib diisi" })
      if (!isPaidStatus(order.transaction_status)) {
        return res.status(409).json({ error: "Hanya pesanan yang sudah dibayar yang bisa direfund" })
      }
      if (order.payment_type !== "manual") {
        // Dikembalikan lewat Midtrans (hanya metode yang mendukung refund online, mis. kartu, GoPay, QRIS)
        try {
          await snap.transaction.refundDirect(orderId, {
            refund_key: `rf-${orderId}-${Date.now()}`,
            amount: Number(order.total_amount),
            reason,
          })
        } catch (e) {
          return res.status(502).json({ error: "Midtrans menolak refund: " + e.message })
        }
      }
      const row = await queryOne(
        `UPDATE orders SET transaction_status = 'refund'
         WHERE order_id = $1 AND transaction_status IN ('settlement', 'capture') RETURNING order_id`,
        [orderId]
      )
      if (!row) return res.status(409).json({ error: "Status pesanan sudah berubah" })
      await logOrderAction(order, "refund", order.payment_type, `Refund: ${reason}`, req.user)
      console.log(`↩️ Order ${orderId} direfund oleh ${req.user.email}: ${reason}`)
      return res.json({ status: "refund", manual: order.payment_type === "manual" })
    }

    if (action === "sync") {
      return res.json(await syncOrderFromMidtrans(order))
    }

    res.status(400).json({ error: "Aksi tidak dikenal" })
  } catch (err) {
    console.error("Order action error:", err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── Pesanan saya (pelanggan login) ──────────────────────────────
const SNAP_TOKEN_TTL_MS = 24 * 60 * 60 * 1000 // masa berlaku token Snap bawaan Midtrans

async function getOwnOrder(orderId, userId) {
  return queryOne(
    `SELECT o.*, c.first_name, c.last_name, c.email, c.phone
     FROM orders o LEFT JOIN customers c ON o.customer_id = c.id
     WHERE o.order_id = $1 AND o.user_id = $2`,
    [orderId, userId]
  )
}

app.get("/api/my/orders", authMiddleware(), async (req, res) => {
  try {
    const orders = await queryAll(
      `SELECT order_id, created_at, paid_at, total_amount, transaction_status, payment_type
       FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    )
    const items = await queryAll(
      `SELECT o.order_id, oi.id AS order_item_id, oi.product_id, oi.product_name, oi.price, oi.quantity,
              p.download_links, p.install_tutorial
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE o.user_id = $1
       ORDER BY oi.id`,
      [req.user.id]
    )
    const licenseRequests = await fetchMyLicenseRequests(queryAll, req.user.id)
    res.json(
      orders.map((o) => {
        const paid = isPaidStatus(o.transaction_status)
        return {
          ...o,
          items: items
            .filter((i) => i.order_id === o.order_id)
            .map((i) => ({
              id: i.order_item_id,
              license_requests: licenseRequests[i.order_item_id] || [],
              product_id: i.product_id,
              product_name: i.product_name,
              price: i.price,
              quantity: i.quantity,
              // Link unduhan hanya untuk pesanan yang sudah lunas
              download_links: paid ? i.download_links || [] : [],
              install_tutorial: paid ? i.install_tutorial || null : null,
            })),
        }
      })
    )
  } catch (err) {
    console.error("GET /api/my/orders error:", err.message)
    res.status(500).json({ error: "Gagal memuat pesanan" })
  }
})

registerLicenseRoutes(app, { authMiddleware, queryOne, queryAll, pool, notifyAdminLicenseRequest })

// Token pembayaran untuk melanjutkan pesanan yang belum dibayar
app.post("/api/my/orders/:orderId/pay", authMiddleware(), async (req, res) => {
  try {
    const order = await getOwnOrder(req.params.orderId, req.user.id)
    if (!order) return res.status(404).json({ error: "Pesanan tidak ditemukan" })
    if (order.transaction_status !== "pending") {
      return res.status(409).json({ error: "Pesanan ini tidak menunggu pembayaran" })
    }
    const age = Date.now() - new Date(order.created_at).getTime()
    if (!order.snap_token || age > SNAP_TOKEN_TTL_MS) {
      return res.status(409).json({ error: "Waktu pembayaran pesanan ini sudah habis. Silakan pesan ulang." })
    }
    res.json({
      token: order.snap_token,
      client_key: CLIENT_KEY,
      snap_url: IS_PRODUCTION
        ? "https://app.midtrans.com/snap/snap.js"
        : "https://app.sandbox.midtrans.com/snap/snap.js",
    })
  } catch (err) {
    res.status(500).json({ error: "Gagal menyiapkan pembayaran" })
  }
})

// Cek status terbaru ke Midtrans (mis. setelah membayar)
app.post("/api/my/orders/:orderId/refresh", authMiddleware(), async (req, res) => {
  try {
    const order = await getOwnOrder(req.params.orderId, req.user.id)
    if (!order) return res.status(404).json({ error: "Pesanan tidak ditemukan" })
    res.json(await syncOrderFromMidtrans(order))
  } catch (err) {
    // 404 dari Midtrans = pelanggan belum memilih metode bayar; status tetap
    res.status(502).json({ error: "Belum ada pembaruan dari Midtrans" })
  }
})

// Kirim ulang email lisensi/unduhan ke email akun untuk pesanan yang sudah lunas
app.post("/api/my/orders/:orderId/resend-email", authMiddleware(), async (req, res) => {
  try {
    const order = await getOwnOrder(req.params.orderId, req.user.id)
    if (!order) return res.status(404).json({ error: "Pesanan tidak ditemukan" })
    if (!isPaidStatus(order.transaction_status)) {
      return res.status(409).json({ error: "Email lisensi hanya untuk pesanan yang sudah lunas" })
    }
    await sendOrderEmailFor(order.order_id)
    res.json({ status: "ok" })
  } catch (err) {
    console.error("my resend-email error:", err.message)
    res.status(500).json({ error: "Gagal mengirim email" })
  }
})

// ── Helper: enabled payments by method ────────────────────────────
function getEnabledPayments(method) {
  switch (method) {
    case "card":
      return ["credit_card"]
    case "gopay":
      return ["gopay"]
    case "shopeepay":
      return ["shopeepay"]
    case "bank_transfer":
      return ["bca_va", "bni_va", "bri_va", "mandiri_va", "echannel"]
    default:
      return [
        "credit_card",
        "gopay",
        "shopeepay",
        "bca_va",
        "bni_va",
        "bri_va",
        "mandiri_va",
        "echannel",
      ]
  }
}

// ═══════════════════════════════════════════════════════════════
//  TRIAL REGISTRATION — Uji Coba Gratis
// ═══════════════════════════════════════════════════════════════

// ── Register trial ────────────────────────────────────────────────
app.post("/api/trial/register", async (req, res) => {
  try {
    const {
      fullName,
      email,
      whatsapp,
      address,
      city,
      province,
      company,
      position,
      productName,
    } = req.body

    // Validate
    if (!fullName || fullName.trim().length < 3) {
      return res.status(400).json({ error: "Nama lengkap wajib diisi (min 3 karakter)" })
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Email wajib diisi dan harus valid" })
    }
    if (!whatsapp || whatsapp.replace(/\D/g, "").length < 10) {
      return res.status(400).json({ error: "Nomor WhatsApp wajib diisi (min 10 digit)" })
    }

    const registrationId = `TR-${Date.now()}`
    const cleanPhone = whatsapp.replace(/\D/g, "")

    // Insert to DB
    const row = await queryOne(
      `INSERT INTO trial_registrations
        (registration_id, full_name, email, whatsapp, address, city, province,
         company, position, product_name, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
       RETURNING id, registration_id, full_name, email, whatsapp, city, province,
                 company, product_name, created_at`,
      [
        registrationId,
        fullName.trim(),
        email.trim().toLowerCase(),
        cleanPhone,
        address || "",
        city || "",
        province || "",
        company || "",
        position || "",
        productName || "",
      ]
    )

    if (!row) {
      return res.status(500).json({ error: "Gagal menyimpan data pendaftaran" })
    }

    console.log("\n📤 Trial Registration:")
    console.log(`   Reg ID      : ${registrationId}`)
    console.log(`   Name        : ${fullName}`)
    console.log(`   Email       : ${email}`)
    console.log(`   WhatsApp    : ${cleanPhone}`)
    console.log(`   Product     : ${productName || "-"}`)

    // Send confirmation email (surat resmi dengan kop)
    let emailSent = false
    try {
      const { sendTrialRegistrationEmail } = await import("./lib/email.mjs")
      await sendTrialRegistrationEmail(row)
      emailSent = true
      await query(
        `UPDATE trial_registrations SET email_sent = TRUE, email_sent_at = NOW() WHERE id = $1`,
        [row.id]
      )
      console.log(`📧 Surat konfirmasi terkirim ke ${email}`)
    } catch (emailErr) {
      console.error("⚠️ Failed to send trial email:", emailErr.message)
    }

    res.json({
      success: true,
      registrationId: registrationId,
      emailSent: emailSent,
      message: emailSent
        ? "Pendaftaran berhasil. Surat konfirmasi telah dikirim ke email Anda."
        : "Pendaftaran berhasil, namun email gagal dikirim. Tim kami akan menghubungi via WhatsApp.",
    })
  } catch (error) {
    console.error("❌ Trial register error:", error.message)
    if (error.code === "23505") {
      // unique constraint violation
      return res.status(409).json({ error: "Email sudah terdaftar" })
    }
    res.status(500).json({ error: error.message })
  }
})

// ── List trial registrations (admin) ─────────────────────────────
app.get("/api/trial/registrations", authMiddleware("admin"), async (req, res) => {
  try {
    const rows = await queryAll(
      `SELECT id, registration_id, full_name, email, whatsapp, address, city,
              province, company, position, product_name, status, email_sent,
              email_sent_at, created_at
       FROM trial_registrations
       ORDER BY created_at DESC`
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Update trial registration status (admin) ─────────────────────
const TRIAL_STATUSES = ["pending", "contacted", "active", "expired"]
app.put("/api/trial/registrations/:id/status", authMiddleware("admin"), async (req, res) => {
  try {
    const { status } = req.body
    if (!TRIAL_STATUSES.includes(status)) {
      return res.status(400).json({ error: "Status tidak valid" })
    }
    const row = await queryOne(
      `UPDATE trial_registrations SET status = $1 WHERE id = $2 RETURNING id, status`,
      [status, req.params.id]
    )
    if (!row) return res.status(404).json({ error: "Pendaftaran tidak ditemukan" })
    res.json(row)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ═══════════════════════════════════════════════════════════════
//  START SERVER
// ═══════════════════════════════════════════════════════════════

async function start() {
  console.log("━".repeat(60))
  console.log("  Rhansoft Store — Backend API")
  console.log("━".repeat(60))
  console.log(`  Merchant ID : ${MIDTRANS_MERCHANT_ID}`)
  console.log(`  Environment : ${IS_PRODUCTION ? "PRODUCTION" : "SANDBOX"}`)
  console.log(`  Client Key  : ${CLIENT_KEY?.substring(0, 20)}...`)
  console.log(`  Server Key  : ${SERVER_KEY?.substring(0, 20)}...`)
  console.log("─".repeat(60))

  const dbOk = await testConnection()
  if (!dbOk) {
    console.error("\n❌ Cannot start server — database not connected.")
    console.error("   Check your .env and PostgreSQL service.")
    process.exit(1)
  }

  app.listen(PORT, () => {
    console.log("─".repeat(60))
    console.log(`🚀 Backend running at http://localhost:${PORT}`)
    console.log(`   Health: http://localhost:${PORT}/api/health`)
    console.log(`   Products: http://localhost:${PORT}/api/products`)
    console.log("━".repeat(60))
  })
}

start()
