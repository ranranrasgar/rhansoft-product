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
const issuedMails = []
let failEmail = false

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
    sendLicenseIssuedEmail: async (info) => {
      if (failEmail) throw new Error("smtp down")
      issuedMails.push(info)
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

// ── Admin ─────────────────────────────────────────────────────
const api = (method, path, token, body) =>
  fetch(`${base}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

/** Pelanggan + pesanan lunas + satu permintaan pending; mengembalikan id permintaan. */
async function pendingRequest({ quantity = 1, code = "ADM1-0000-0001" } = {}) {
  const user = await createUser()
  const { orderId, orderItemId } = await createOrderItem({ userId: user.id, quantity })
  const res = await post(orderItemId, user.token, { license_code: code })
  return { user, orderId, orderItemId, id: (await res.json()).id }
}

test("pelanggan biasa ditolak (403) di semua endpoint admin", async () => {
  const user = await createUser()
  const { id } = await pendingRequest()
  assert.equal((await api("GET", "/api/admin/license-requests", user.token)).status, 403)
  assert.equal((await api("PUT", `/api/admin/license-requests/${id}/issue`, user.token, { registration_number: "TEST-1234" })).status, 403)
  assert.equal((await api("PUT", `/api/admin/license-requests/${id}/reject`, user.token, { note: "x" })).status, 403)
})

test("daftar admin menampilkan permintaan pending beserta pending_count", async () => {
  const admin = await createUser({ role: "admin" })
  const { id } = await pendingRequest({ code: "LIST-0000-0001" })
  const res = await api("GET", "/api/admin/license-requests?status=pending", admin.token)
  assert.equal(res.status, 200)
  const body = await res.json()
  const row = body.items.find((r) => r.id === id)
  assert.equal(row.license_code, "LIST-0000-0001")
  assert.equal(row.product_name, "Produk Uji")
  assert.equal(row.order_status, "settlement")
  assert.ok(body.pending_count >= 1)
  assert.equal((await api("GET", "/api/admin/license-requests?status=bogus", admin.token)).status, 400)
})

test("terbitkan: nomor huruf kecil disimpan huruf besar, pelanggan melihatnya, email terkirim sekali", async () => {
  const admin = await createUser({ role: "admin" })
  const { user, orderItemId, id } = await pendingRequest({ code: "ISSU-0000-0001" })
  const mails = issuedMails.length
  const res = await api("PUT", `/api/admin/license-requests/${id}/issue`, admin.token, { registration_number: " test-1234-abcd " })
  assert.equal(res.status, 200)
  const mine = (await requestsOf(user.id, orderItemId))[0]
  assert.equal(mine.status, "issued")
  assert.equal(mine.registration_number, "TEST-1234-ABCD")
  const row = await queryOne(`SELECT issued_by, issued_at FROM license_requests WHERE id = $1`, [id])
  assert.equal(row.issued_by, admin.id)
  assert.ok(row.issued_at)
  assert.equal(issuedMails.length, mails + 1)
  assert.equal(issuedMails.at(-1).registrationNumber, "TEST-1234-ABCD")
})

test("nomor registrasi tidak sah ditolak (400)", async () => {
  const admin = await createUser({ role: "admin" })
  const { id } = await pendingRequest({ code: "BADN-0000-0001" })
  assert.equal((await api("PUT", `/api/admin/license-requests/${id}/issue`, admin.token, { registration_number: "AB" })).status, 400)
  assert.equal((await api("PUT", `/api/admin/license-requests/${id}/issue`, admin.token, { registration_number: "A_B-1234" })).status, 400)
  assert.equal((await api("PUT", `/api/admin/license-requests/${id}/issue`, admin.token, {})).status, 400)
})

test("menerbitkan ulang yang sudah terbit boleh (koreksi) dan mengganti nomor", async () => {
  const admin = await createUser({ role: "admin" })
  const { user, orderItemId, id } = await pendingRequest({ code: "REIS-0000-0001" })
  await api("PUT", `/api/admin/license-requests/${id}/issue`, admin.token, { registration_number: "OLDN-0001" })
  assert.equal((await api("PUT", `/api/admin/license-requests/${id}/issue`, admin.token, { registration_number: "NEWN-0002" })).status, 200)
  assert.equal((await requestsOf(user.id, orderItemId))[0].registration_number, "NEWN-0002")
})

test("klik Terbitkan dua kali bersamaan tidak merusak data", async () => {
  const admin = await createUser({ role: "admin" })
  const { user, orderItemId, id } = await pendingRequest({ code: "DBLC-0000-0001" })
  const [a, b] = await Promise.all([
    api("PUT", `/api/admin/license-requests/${id}/issue`, admin.token, { registration_number: "SAME-0001" }),
    api("PUT", `/api/admin/license-requests/${id}/issue`, admin.token, { registration_number: "SAME-0001" }),
  ])
  assert.ok([a.status, b.status].every((s) => s === 200 || s === 409))
  const list = await requestsOf(user.id, orderItemId)
  assert.equal(list.length, 1)
  assert.equal(list[0].status, "issued")
  assert.equal(list[0].registration_number, "SAME-0001")
})

test("pesanan yang di-refund tidak bisa diterbitkan (409)", async () => {
  const admin = await createUser({ role: "admin" })
  const { orderId, id } = await pendingRequest({ code: "RFND-0000-0001" })
  await query(`UPDATE orders SET transaction_status = 'refund' WHERE order_id = $1`, [orderId])
  assert.equal((await api("PUT", `/api/admin/license-requests/${id}/issue`, admin.token, { registration_number: "TEST-1234" })).status, 409)
})

test("tolak: alasan wajib, pelanggan melihat alasan, tidak bisa ditolak dua kali atau diterbitkan setelahnya", async () => {
  const admin = await createUser({ role: "admin" })
  const { user, orderItemId, id } = await pendingRequest({ code: "REJT-0000-0001" })
  assert.equal((await api("PUT", `/api/admin/license-requests/${id}/reject`, admin.token, {})).status, 400)
  assert.equal((await api("PUT", `/api/admin/license-requests/${id}/reject`, admin.token, { note: "   " })).status, 400)
  assert.equal((await api("PUT", `/api/admin/license-requests/${id}/reject`, admin.token, { note: "Kode salah ketik" })).status, 200)
  const mine = (await requestsOf(user.id, orderItemId))[0]
  assert.equal(mine.status, "rejected")
  assert.equal(mine.admin_note, "Kode salah ketik")
  assert.equal((await api("PUT", `/api/admin/license-requests/${id}/reject`, admin.token, { note: "lagi" })).status, 409)
  assert.equal((await api("PUT", `/api/admin/license-requests/${id}/issue`, admin.token, { registration_number: "TEST-1234" })).status, 409)
})

test("id yang tidak ada mendapat 404", async () => {
  const admin = await createUser({ role: "admin" })
  assert.equal((await api("PUT", "/api/admin/license-requests/999999999/issue", admin.token, { registration_number: "TEST-1234" })).status, 404)
  assert.equal((await api("PUT", "/api/admin/license-requests/999999999/reject", admin.token, { note: "x" })).status, 404)
})

test("email gagal tidak membatalkan penerbitan", async () => {
  const admin = await createUser({ role: "admin" })
  const { user, orderItemId, id } = await pendingRequest({ code: "MAIL-0000-0001" })
  failEmail = true
  try {
    assert.equal((await api("PUT", `/api/admin/license-requests/${id}/issue`, admin.token, { registration_number: "TEST-5678" })).status, 200)
  } finally {
    failEmail = false
  }
  assert.equal((await requestsOf(user.id, orderItemId))[0].status, "issued")
})
