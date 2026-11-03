import "dotenv/config"
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import express from "express"
import { queryOne } from "../db/pool.mjs"
import { categorizePaymentStatus, registerPaymentResultRoute } from "../lib/paymentResult.mjs"
import { createUser, createOrderItem, cleanupFixtures, closePool } from "./fixtures.mjs"

test("categorizePaymentStatus: lunas, menunggu, gagal", () => {
  assert.equal(categorizePaymentStatus("settlement"), "paid")
  assert.equal(categorizePaymentStatus("capture", "accept"), "paid")
  assert.equal(categorizePaymentStatus("capture", "challenge"), "pending")
  assert.equal(categorizePaymentStatus("pending"), "pending")
  for (const s of ["deny", "cancel", "expire", "failure", "refund", "partial_refund"]) {
    assert.equal(categorizePaymentStatus(s), "failed", s)
  }
  assert.equal(categorizePaymentStatus("sesuatu-yang-baru"), "unknown")
})

// ── Rute (Midtrans diganti objek palsu) ───────────────────────
let server
let base
let known
const midtransStatus = {} // order_id -> objek status Midtrans; tidak ada = Midtrans menjawab 404

before(async () => {
  await cleanupFixtures()
  const user = await createUser()
  known = (await createOrderItem({ userId: user.id })).orderId

  const app = express()
  registerPaymentResultRoute(app, {
    snap: {
      transaction: {
        status: async (id) => {
          if (!midtransStatus[id]) throw new Error("404 Transaction doesn't exist")
          return midtransStatus[id]
        },
      },
    },
    queryOne,
    limit: 5,
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

const get = (id, ip = "203.0.113.1") =>
  fetch(`${base}/api/payment-result/${id}`, { headers: { "x-forwarded-for": ip } })

test("pesanan toko ini yang lunas: paid dan own_store true, tanpa data lain", async () => {
  midtransStatus[known] = { transaction_status: "settlement", gross_amount: "123", payment_type: "gopay", customer_email: "x@y.z" }
  const res = await get(known, "203.0.113.10")
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { status: "paid", own_store: true })
})

test("pesanan website lain (tidak ada di database ini) tetap diverifikasi, own_store false", async () => {
  midtransStatus["OTHER-SITE-1"] = { transaction_status: "expire" }
  assert.deepEqual(await (await get("OTHER-SITE-1", "203.0.113.11")).json(), { status: "failed", own_store: false })
})

test("nomor pesanan yang tidak dikenal Midtrans: unknown", async () => {
  assert.deepEqual(await (await get("TIDAK-ADA-1", "203.0.113.12")).json(), { status: "unknown", own_store: false })
})

test("nomor pesanan dengan karakter aneh ditolak (400)", async () => {
  assert.equal((await get("a%20b%3Cscript%3E", "203.0.113.13")).status, 400)
})

test("batas laju per alamat IP: permintaan ke-6 ditolak (429), IP lain tetap boleh", async () => {
  const ip = "203.0.113.99"
  const statuses = []
  for (let i = 0; i < 6; i++) statuses.push((await get("TIDAK-ADA-2", ip)).status)
  assert.deepEqual(statuses.slice(0, 5), Array(5).fill(200))
  assert.equal(statuses[5], 429)
  assert.equal((await get("TIDAK-ADA-2", "203.0.113.98")).status, 200)
})
