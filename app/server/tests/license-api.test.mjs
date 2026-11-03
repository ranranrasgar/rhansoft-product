import "dotenv/config"
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import express from "express"
import { pool, queryAll, queryOne, query } from "../db/pool.mjs"
import { authMiddleware } from "../lib/auth.mjs"
import { registerLicenseRoutes, fetchMyLicenseRequests } from "../lib/licenseRoutes.mjs"
import { createUser, createOrderItem, cleanupFixtures, closePool } from "./fixtures.mjs"

let server
let base
const notices = []

before(async () => {
  await cleanupFixtures()
  const app = express()
  app.use(express.json())
  registerLicenseRoutes(app, {
    authMiddleware,
    queryOne,
    queryAll,
    pool,
    notifyAdminLicenseRequest: async (info) => {
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

const post = (itemId, token, body) =>
  fetch(`${base}/api/my/order-items/${itemId}/license-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  })

const requestsOf = async (userId, itemId) => (await fetchMyLicenseRequests(queryAll, userId))[itemId] || []

test("tanpa login ditolak (401)", async () => {
  const u = await createUser()
  const { orderItemId } = await createOrderItem({ userId: u.id })
  assert.equal((await post(orderItemId, null, { license_code: "AB12-CD34-EF56" })).status, 401)
})

test("kode huruf kecil dengan spasi dan baris baru diterima dan disimpan huruf besar", async () => {
  const u = await createUser()
  const { orderItemId } = await createOrderItem({ userId: u.id })
  const res = await post(orderItemId, u.token, { license_code: "  ab12-cd34-ef56\n" })
  assert.equal(res.status, 201)
  const list = await requestsOf(u.id, orderItemId)
  assert.equal(list.length, 1)
  assert.equal(list[0].license_code, "AB12-CD34-EF56")
  assert.equal(list[0].status, "pending")
})

test("format kode salah ditolak (400)", async () => {
  const u = await createUser()
  const { orderItemId } = await createOrderItem({ userId: u.id })
  assert.equal((await post(orderItemId, u.token, { license_code: "AB*12-CD34" })).status, 400)
  assert.equal((await post(orderItemId, u.token, { license_code: "AB1" })).status, 400)
})

test("pesanan belum lunas dan pesanan refund ditolak (409)", async () => {
  const u = await createUser()
  const a = await createOrderItem({ userId: u.id, status: "pending" })
  const b = await createOrderItem({ userId: u.id, status: "refund" })
  assert.equal((await post(a.orderItemId, u.token, { license_code: "AB12-CD34-EF56" })).status, 409)
  assert.equal((await post(b.orderItemId, u.token, { license_code: "AB12-CD34-EF56" })).status, 409)
})

test("kuota habis ditolak, dan permintaan yang ditolak admin tidak memakai kuota", async () => {
  const u = await createUser()
  const { orderItemId } = await createOrderItem({ userId: u.id, quantity: 1 })
  const first = await post(orderItemId, u.token, { license_code: "AAAA-1111-AAAA" })
  assert.equal(first.status, 201)
  assert.equal((await post(orderItemId, u.token, { license_code: "BBBB-2222-BBBB" })).status, 409)
  await query(`UPDATE license_requests SET status = 'rejected', admin_note = 'salah ketik' WHERE id = $1`, [
    (await first.json()).id,
  ])
  assert.equal((await post(orderItemId, u.token, { license_code: "BBBB-2222-BBBB" })).status, 201)
})

test("kode yang sama dua kali pada item yang sama ditolak (409)", async () => {
  const u = await createUser()
  const { orderItemId } = await createOrderItem({ userId: u.id, quantity: 3 })
  assert.equal((await post(orderItemId, u.token, { license_code: "AB12-CD34-EF56" })).status, 201)
  assert.equal((await post(orderItemId, u.token, { license_code: "ab12-cd34-ef56" })).status, 409)
})

test("dua permintaan bersamaan untuk slot terakhir: hanya satu berhasil", async () => {
  const u = await createUser()
  const { orderItemId } = await createOrderItem({ userId: u.id, quantity: 1 })
  const [a, b] = await Promise.all([
    post(orderItemId, u.token, { license_code: "RACE-AAAA-0001" }),
    post(orderItemId, u.token, { license_code: "RACE-BBBB-0002" }),
  ])
  assert.deepEqual([a.status, b.status].sort(), [201, 409])
  assert.equal((await requestsOf(u.id, orderItemId)).length, 1)
})

test("pengguna lain mendapat 404 dan tidak melihat permintaan orang lain", async () => {
  const owner = await createUser()
  const other = await createUser()
  const { orderItemId } = await createOrderItem({ userId: owner.id })
  assert.equal((await post(orderItemId, owner.token, { license_code: "AB12-CD34-EF56" })).status, 201)
  assert.equal((await post(orderItemId, other.token, { license_code: "ZZ99-YY88-XX77" })).status, 404)
  assert.equal((await requestsOf(other.id, orderItemId)).length, 0)
})

test("nomor registrasi dan catatan admin tidak bocor sebelum waktunya", async () => {
  const u = await createUser()
  const { orderItemId } = await createOrderItem({ userId: u.id, quantity: 2 })
  const res = await post(orderItemId, u.token, { license_code: "LEAK-0000-0001" })
  const id = (await res.json()).id
  await query(`UPDATE license_requests SET registration_number = 'RAHASIA-1', admin_note = 'catatan' WHERE id = $1`, [id])
  const pending = (await requestsOf(u.id, orderItemId))[0]
  assert.equal("registration_number" in pending, false)
  assert.equal("admin_note" in pending, false)
  await query(`UPDATE license_requests SET status = 'issued' WHERE id = $1`, [id])
  const issued = (await requestsOf(u.id, orderItemId))[0]
  assert.equal(issued.registration_number, "RAHASIA-1")
  assert.equal("admin_note" in issued, false)
})

test("batas laju: permintaan ke-11 dalam satu jam ditolak (429)", async () => {
  const u = await createUser()
  const { orderItemId } = await createOrderItem({ userId: u.id, quantity: 20 })
  const statuses = []
  for (let i = 0; i < 11; i++) {
    statuses.push((await post(orderItemId, u.token, { license_code: `RATE-0000-${String(i).padStart(4, "0")}` })).status)
  }
  assert.deepEqual(statuses.slice(0, 10), Array(10).fill(201))
  assert.equal(statuses[10], 429)
})

test("admin diberi tahu satu kali per permintaan baru", async () => {
  const u = await createUser()
  const { orderItemId, orderId } = await createOrderItem({ userId: u.id })
  const before = notices.length
  await post(orderItemId, u.token, { license_code: "NOTE-0000-0001" })
  assert.equal(notices.length, before + 1)
  assert.equal(notices.at(-1).orderId, orderId)
  assert.equal(notices.at(-1).productName, "Produk Uji")
})
