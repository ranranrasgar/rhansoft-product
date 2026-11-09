import "dotenv/config"
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import express from "express"
import { pool, query, queryAll, queryOne } from "../db/pool.mjs"
import { authMiddleware } from "../lib/auth.mjs"
import { registerProductWriteRoutes, productIdFromName } from "../lib/productRoutes.mjs"
import { createUser, cleanupFixtures, closePool } from "./fixtures.mjs"

let server
let base
let editor
let user
const removeTestProducts = () => query(`DELETE FROM products WHERE id LIKE 'lictest-%'`)

before(async () => {
  await cleanupFixtures()
  await removeTestProducts()
  editor = await createUser({ role: "editor" })
  user = await createUser()
  const app = express()
  app.use(express.json())
  registerProductWriteRoutes(app, { authMiddleware, pool })
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve)
  })
  base = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  await new Promise((resolve) => server.close(resolve))
  await removeTestProducts()
  await cleanupFixtures()
  await closePool()
})

const post = (token, body) =>
  fetch(`${base}/api/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  })

const product = (over = {}) => ({
  name: "LICTEST Software Toko (Salinan)",
  category: "POS & Retail",
  price: 1000,
  originalPrice: 1200000,
  description: "Deskripsi uji",
  image: "https://cdn.example.test/a.png",
  badge: "Best Seller",
  version: "1.3.2.1",
  license: "Lifetime License",
  downloadSize: "50 MB",
  color: "#0ea5e9",
  highlights: ["Satu", "Dua"],
  specs: [{ label: "Database", value: "MySQL" }],
  gallery: ["https://cdn.example.test/g1.png"],
  downloadLinks: [{ label: "Installer", url: "https://drive.example.test/x", size: "45 MB" }],
  installTutorial: "1. Jalankan installer",
  platformIds: ["desktop", "web"],
  featured: true,
  benefits: ["  Hemat waktu  ", "", "Laporan real-time"],
  ...over,
})

test("productIdFromName: slug huruf kecil berawalan nama, unik, maksimal 50 karakter", () => {
  const a = productIdFromName("Software Toko Rhansoft (Salinan)")
  const b = productIdFromName("Software Toko Rhansoft (Salinan)")
  assert.match(a, /^software-toko-rhansoft-salinan-[a-z0-9]{6}$/)
  assert.notEqual(a, b)
  assert.ok(productIdFromName("x".repeat(200)).length <= 50)
  assert.match(productIdFromName("!!!"), /^produk-[a-z0-9]{6}$/)
})

test("tanpa login 401, pengguna biasa 403", async () => {
  assert.equal((await post(null, product())).status, 401)
  assert.equal((await post(user.token, product())).status, 403)
})

test("membuat produk lengkap: kategori dari nama, spesifikasi, highlight, platform tersimpan", async () => {
  const res = await post(editor.token, product())
  assert.equal(res.status, 201)
  const { id } = await res.json()
  assert.match(id, /^lictest-software-toko-salinan-[a-z0-9]{6}$/)
  const row = await queryOne(`SELECT * FROM products WHERE id = $1`, [id])
  assert.equal(row.name, "LICTEST Software Toko (Salinan)")
  assert.equal(row.category_id, "pos-retail")
  assert.equal(Number(row.price), 1000)
  assert.equal(Number(row.original_price), 1200000)
  assert.equal(row.badge, "Best Seller")
  assert.equal(row.featured, true)
  assert.equal(row.is_active, true)
  assert.deepEqual(row.benefits, ["Hemat waktu", "Laporan real-time"])
  assert.deepEqual(row.gallery, ["https://cdn.example.test/g1.png"])
  assert.equal(row.download_links[0].url, "https://drive.example.test/x")
  const specs = await queryAll(`SELECT label, value FROM product_specs WHERE product_id = $1`, [id])
  assert.deepEqual(specs, [{ label: "Database", value: "MySQL" }])
  const hl = await queryAll(`SELECT highlight FROM product_highlights WHERE product_id = $1 ORDER BY sort_order`, [id])
  assert.deepEqual(hl.map((h) => h.highlight), ["Satu", "Dua"])
  const pl = await queryAll(`SELECT platform_id FROM product_platforms WHERE product_id = $1 ORDER BY sort_order`, [id])
  assert.deepEqual(pl.map((p) => p.platform_id), ["desktop", "web"])
})

test("isian wajib dan nilai tidak sah ditolak 400", async () => {
  assert.equal((await post(editor.token, product({ name: " " }))).status, 400)
  assert.equal((await post(editor.token, product({ description: "" }))).status, 400)
  assert.equal((await post(editor.token, product({ price: -1 }))).status, 400)
  assert.equal((await post(editor.token, product({ price: "abc" }))).status, 400)
  assert.equal((await post(editor.token, product({ category: "Tidak Ada" }))).status, 400)
  assert.equal((await post(editor.token, product({ platformIds: [] }))).status, 400)
  assert.equal((await post(editor.token, product({ platformIds: ["tidak-ada"] }))).status, 400)
})

const del = (token, id) =>
  fetch(`${base}/api/products/${id}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

test("hapus produk = disembunyikan (is_active false), data dan relasinya tetap ada", async () => {
  const { id } = await (await post(editor.token, product())).json()
  assert.equal((await del(null, id)).status, 401)
  assert.equal((await del(user.token, id)).status, 403)
  const res = await del(editor.token, id)
  assert.equal(res.status, 200)
  const row = await queryOne(`SELECT is_active FROM products WHERE id = $1`, [id])
  assert.equal(row.is_active, false)
  const specs = await queryAll(`SELECT 1 FROM product_specs WHERE product_id = $1`, [id])
  assert.equal(specs.length, 1)
  // menghapus lagi tetap 404 agar admin tahu produknya sudah tidak ada di katalog
  assert.equal((await del(editor.token, id)).status, 404)
  assert.equal((await del(editor.token, "tidak-ada")).status, 404)
})
