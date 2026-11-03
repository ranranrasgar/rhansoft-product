import "dotenv/config"
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import express from "express"
import { pool, queryAll, queryOne } from "../db/pool.mjs"
import { authMiddleware } from "../lib/auth.mjs"
import { registerLegacyClaimRoutes } from "../lib/legacyClaimRoutes.mjs"
import { createUser, createProduct, cleanupFixtures, closePool } from "./fixtures.mjs"

let server
let base
let productId
const notices = []
let failNotify = false

before(async () => {
  await cleanupFixtures()
  productId = await createProduct()
  const app = express()
  app.use(express.json())
  registerLegacyClaimRoutes(app, {
    authMiddleware,
    queryOne,
    queryAll,
    pool,
    notifyAdminLegacyClaim: async (info) => {
      if (failNotify) throw new Error("smtp down")
      notices.push(info)
    },
  })
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve)
  })
  base = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  await new Promise((resolve) => server.close(resolve))
  await cleanupFixtures()
  await closePool()
})

const call = (method, path, token, body) =>
  fetch(`${base}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

const claim = (over = {}) => ({
  product_id: productId,
  company: "Toko Lama",
  phone: "081234567890",
  quantity: 2,
  license_codes: ["AB12-CD34-EF56"],
  ...over,
})

test("tanpa login ditolak (401)", async () => {
  assert.equal((await call("POST", "/api/legacy-claims", null, claim())).status, 401)
})

test("klaim sah tersimpan pending dan admin diberi tahu", async () => {
  const u = await createUser()
  const before = notices.length
  const res = await call("POST", "/api/legacy-claims", u.token, claim())
  assert.equal(res.status, 201)
  assert.equal((await res.json()).status, "pending")
  assert.equal(notices.length, before + 1)
  assert.equal(notices.at(-1).productName, "Produk Uji")
  const row = await queryOne(`SELECT license_codes, status FROM legacy_claims WHERE user_id = $1`, [u.id])
  assert.deepEqual(row.license_codes, ["AB12-CD34-EF56"])
  assert.equal(row.status, "pending")
})

test("klaim pending kedua untuk produk yang sama ditolak (409)", async () => {
  const u = await createUser()
  assert.equal((await call("POST", "/api/legacy-claims", u.token, claim())).status, 201)
  assert.equal((await call("POST", "/api/legacy-claims", u.token, claim())).status, 409)
})

test("Lainnya: nama yang sama beda huruf besar/kecil dianggap klaim ganda", async () => {
  const u = await createUser()
  const other = (name) => claim({ product_id: null, product_other: name })
  assert.equal((await call("POST", "/api/legacy-claims", u.token, other("Jadwal Sekolah"))).status, 201)
  assert.equal((await call("POST", "/api/legacy-claims", u.token, other("jadwal sekolah"))).status, 409)
})

test("produk yang tidak ada di katalog ditolak (400), isian tidak sah juga 400", async () => {
  const u = await createUser()
  assert.equal((await call("POST", "/api/legacy-claims", u.token, claim({ product_id: "tidak-ada" }))).status, 400)
  assert.equal((await call("POST", "/api/legacy-claims", u.token, claim({ phone: "123" }))).status, 400)
})

test("email notifikasi gagal tidak menggagalkan klaim", async () => {
  const u = await createUser()
  failNotify = true
  try {
    assert.equal((await call("POST", "/api/legacy-claims", u.token, claim())).status, 201)
  } finally {
    failNotify = false
  }
})

test("daftar klaim saya hanya milik sendiri, dengan nama produk", async () => {
  const a = await createUser()
  const b = await createUser()
  await call("POST", "/api/legacy-claims", a.token, claim())
  await call("POST", "/api/legacy-claims", b.token, claim({ product_id: null, product_other: "Kasir Lama" }))
  const res = await call("GET", "/api/my/legacy-claims", b.token)
  assert.equal(res.status, 200)
  const list = await res.json()
  assert.equal(list.length, 1)
  assert.equal(list[0].product_name, "Kasir Lama")
  assert.equal(list[0].status, "pending")
  assert.equal("admin_note" in list[0], false)
})

// ── Admin ──
const submit = async (u, over) => {
  const res = await call("POST", "/api/legacy-claims", u.token, claim(over))
  assert.equal(res.status, 201)
  return (await res.json()).id
}

test("pengguna biasa tidak boleh memakai rute admin (403)", async () => {
  const u = await createUser()
  assert.equal((await call("GET", "/api/admin/legacy-claims", u.token)).status, 403)
  assert.equal((await call("PUT", "/api/admin/legacy-claims/1/approve", u.token, {})).status, 403)
  assert.equal((await call("PUT", "/api/admin/legacy-claims/1/reject", u.token, { reason: "x" })).status, 403)
})

test("admin melihat daftar klaim pending dengan data akun dan produk", async () => {
  const admin = await createUser({ role: "admin" })
  const u = await createUser()
  const id = await submit(u)
  const list = await (await call("GET", "/api/admin/legacy-claims?status=pending", admin.token)).json()
  const row = list.find((r) => r.id === id)
  assert.equal(row.product_name, "Produk Uji")
  assert.match(row.customer_email, /^lictest-/)
  assert.equal(row.company, "Toko Lama")
  assert.deepEqual(row.license_codes, ["AB12-CD34-EF56"])
  assert.equal(row.order_id, null)
})

test("setujui membuat pesanan LEGACY lunas Rp 0, item berkuota, dan permintaan lisensi per kode", async () => {
  const admin = await createUser({ role: "admin" })
  const u = await createUser()
  const id = await submit(u, { quantity: 2, license_codes: ["AAAA-BBBB-0001", "AAAA-BBBB-0002"] })
  const res = await call("PUT", `/api/admin/legacy-claims/${id}/approve`, admin.token, { product_id: productId, quantity: 3 })
  assert.equal(res.status, 200)
  const { order_id } = await res.json()
  assert.match(order_id, /^LEGACY-/)

  const order = await queryOne(`SELECT * FROM orders WHERE order_id = $1`, [order_id])
  assert.equal(order.transaction_status, "settlement")
  assert.equal(order.payment_type, "legacy")
  assert.equal(Number(order.total_amount), 0)
  assert.equal(order.user_id, u.id)
  assert.ok(order.paid_at)

  const item = await queryOne(`SELECT * FROM order_items WHERE order_id = $1`, [order.id])
  assert.equal(item.quantity, 3)
  assert.equal(Number(item.price), 0)
  assert.equal(item.product_name, "Produk Uji")
  assert.equal(item.product_id, productId)

  const reqs = await queryAll(`SELECT license_code, status, user_id FROM license_requests WHERE order_item_id = $1 ORDER BY license_code`, [item.id])
  assert.deepEqual(reqs.map((r) => r.license_code), ["AAAA-BBBB-0001", "AAAA-BBBB-0002"])
  assert.ok(reqs.every((r) => r.status === "pending" && r.user_id === u.id))

  const c = await queryOne(`SELECT status, order_id, reviewed_by FROM legacy_claims WHERE id = $1`, [id])
  assert.equal(c.status, "approved")
  assert.equal(c.order_id, order.id)
  assert.equal(c.reviewed_by, admin.id)

  // disetujui dua kali ditolak
  assert.equal((await call("PUT", `/api/admin/legacy-claims/${id}/approve`, admin.token, { product_id: productId, quantity: 3 })).status, 409)
})

test("setujui: Lainnya tanpa produk, jumlah kurang dari kode, produk tidak ada → 400", async () => {
  const admin = await createUser({ role: "admin" })
  const u = await createUser()
  const other = await submit(u, { product_id: null, product_other: "Kasir Lama" })
  assert.equal((await call("PUT", `/api/admin/legacy-claims/${other}/approve`, admin.token, { quantity: 2 })).status, 400)
  const id = await submit(u, { quantity: 2, license_codes: ["AAAA-BBBB-0003", "AAAA-BBBB-0004"] })
  assert.equal((await call("PUT", `/api/admin/legacy-claims/${id}/approve`, admin.token, { product_id: productId, quantity: 1 })).status, 400)
  assert.equal((await call("PUT", `/api/admin/legacy-claims/${id}/approve`, admin.token, { product_id: "tidak-ada", quantity: 2 })).status, 400)
  // klaim Lainnya bisa disetujui setelah admin memilih produk
  assert.equal((await call("PUT", `/api/admin/legacy-claims/${other}/approve`, admin.token, { product_id: productId, quantity: 2 })).status, 200)
})

test("id bukan angka atau tidak ada → 404", async () => {
  const admin = await createUser({ role: "admin" })
  assert.equal((await call("PUT", "/api/admin/legacy-claims/abc/approve", admin.token, { product_id: productId, quantity: 1 })).status, 404)
  assert.equal((await call("PUT", "/api/admin/legacy-claims/99999999/approve", admin.token, { product_id: productId, quantity: 1 })).status, 404)
  assert.equal((await call("PUT", "/api/admin/legacy-claims/abc/reject", admin.token, { reason: "x" })).status, 404)
  assert.equal((await call("PUT", "/api/admin/legacy-claims/99999999/reject", admin.token, { reason: "x" })).status, 404)
})

test("dua persetujuan bersamaan hanya membuat satu pesanan", async () => {
  const admin = await createUser({ role: "admin" })
  const u = await createUser()
  const id = await submit(u)
  const body = { product_id: productId, quantity: 2 }
  const statuses = (
    await Promise.all([
      call("PUT", `/api/admin/legacy-claims/${id}/approve`, admin.token, body),
      call("PUT", `/api/admin/legacy-claims/${id}/approve`, admin.token, body),
    ])
  ).map((r) => r.status).sort()
  assert.deepEqual(statuses, [200, 409])
  const n = await queryOne(`SELECT count(*)::int AS n FROM orders WHERE user_id = $1 AND order_id LIKE 'LEGACY-%'`, [u.id])
  assert.equal(n.n, 1)
})

test("tolak wajib alasan; setelah ditolak pelanggan bisa klaim lagi dan melihat alasannya", async () => {
  const admin = await createUser({ role: "admin" })
  const u = await createUser()
  const id = await submit(u)
  assert.equal((await call("PUT", `/api/admin/legacy-claims/${id}/reject`, admin.token, { reason: " " })).status, 400)
  assert.equal((await call("PUT", `/api/admin/legacy-claims/${id}/reject`, admin.token, { reason: "x".repeat(501) })).status, 400)
  const res = await call("PUT", `/api/admin/legacy-claims/${id}/reject`, admin.token, { reason: "Tidak ada di catatan penjualan" })
  assert.equal(res.status, 200)
  assert.equal((await call("PUT", `/api/admin/legacy-claims/${id}/reject`, admin.token, { reason: "lagi" })).status, 409)
  const mine = await (await call("GET", "/api/my/legacy-claims", u.token)).json()
  assert.equal(mine[0].admin_note, "Tidak ada di catatan penjualan")
  assert.equal((await call("POST", "/api/legacy-claims", u.token, claim())).status, 201)
})
