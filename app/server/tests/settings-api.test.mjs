import "dotenv/config"
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import express from "express"
import { query, queryOne } from "../db/pool.mjs"
import { authMiddleware } from "../lib/auth.mjs"
import { DEFAULT_SHIPPING } from "../lib/shippingSettings.mjs"
import { registerSettingsRoutes, loadShippingSettings } from "../lib/settingsRoutes.mjs"
import { createUser, cleanupFixtures, closePool } from "./fixtures.mjs"

let server
let base
let admin
let user
const clear = () => query(`DELETE FROM settings WHERE key = 'shipping'`)

before(async () => {
  await cleanupFixtures()
  await clear()
  admin = await createUser({ role: "admin" })
  user = await createUser()
  const app = express()
  app.use(express.json())
  registerSettingsRoutes(app, { authMiddleware, queryOne })
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve)
  })
  base = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  await new Promise((resolve) => server.close(resolve))
  await clear()
  await cleanupFixtures()
  await closePool()
})

const api = (method, path, token, body) =>
  fetch(`${base}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

const valid = {
  enabled: true,
  mode: "province",
  label: "Ongkos Kirim",
  flat_amount: 0,
  default_amount: 30000,
  province_rates: { "jawa barat": 15000 },
}

test("hak akses: tanpa login 401, pelanggan biasa 403 pada endpoint admin", async () => {
  assert.equal((await api("GET", "/api/admin/settings/shipping")).status, 401)
  assert.equal((await api("GET", "/api/admin/settings/shipping", user.token)).status, 403)
  assert.equal((await api("PUT", "/api/admin/settings/shipping", user.token, valid)).status, 403)
})

test("belum ada pengaturan: admin dan publik mendapat bawaan nonaktif", async () => {
  await clear()
  assert.deepEqual(await (await api("GET", "/api/admin/settings/shipping", admin.token)).json(), DEFAULT_SHIPPING)
  assert.deepEqual(await (await api("GET", "/api/shipping-config")).json(), DEFAULT_SHIPPING)
})

test("simpan lalu baca: nilai dinormalisasi, publik sama, updated_by tercatat dan tidak bocor", async () => {
  const res = await api("PUT", "/api/admin/settings/shipping", admin.token, valid)
  assert.equal(res.status, 200)
  const expected = { ...valid, province_rates: { "Jawa Barat": 15000 } }
  assert.deepEqual(await (await api("GET", "/api/admin/settings/shipping", admin.token)).json(), expected)
  const pub = await (await api("GET", "/api/shipping-config")).json()
  assert.deepEqual(pub, expected)
  assert.equal("updated_by" in pub, false)
  const row = await queryOne(`SELECT updated_by FROM settings WHERE key = 'shipping'`)
  assert.equal(row.updated_by, admin.id)
})

test("nilai tidak sah ditolak (400) dan pengaturan tersimpan tidak berubah", async () => {
  await api("PUT", "/api/admin/settings/shipping", admin.token, { ...valid, enabled: true, mode: "flat", flat_amount: 20000 })
  for (const badBody of [{ ...valid, flat_amount: -1 }, { ...valid, mode: "kurir" }, { ...valid, default_amount: "15.000" }]) {
    const res = await api("PUT", "/api/admin/settings/shipping", admin.token, badBody)
    assert.equal(res.status, 400)
    assert.ok((await res.json()).error)
  }
  const now = await (await api("GET", "/api/shipping-config")).json()
  assert.equal(now.mode, "flat")
  assert.equal(now.flat_amount, 20000)
})

test("nilai rusak di database: bawaan dipakai, tidak 500", async () => {
  await query(
    `INSERT INTO settings (key, value) VALUES ('shipping', '"rusak"') ON CONFLICT (key) DO UPDATE SET value = '"rusak"'`
  )
  const res = await api("GET", "/api/shipping-config")
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), DEFAULT_SHIPPING)
  assert.deepEqual(await loadShippingSettings(queryOne), DEFAULT_SHIPPING)
})
