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
