import { test } from "node:test"
import assert from "node:assert/strict"
import { priceOrder, checkClientTotal } from "../lib/pricing.mjs"
import { DEFAULT_SHIPPING, normalizeShippingSettings } from "../lib/shippingSettings.mjs"

const items = [{ id: "sw-toko", name: "Software Toko Rhansoft", price: 750000, quantity: 1, brand: "Rhansoft", category: "POS" }]
const settings = (over) => normalizeShippingSettings({ enabled: true, ...over }).value
const sumOf = (details) => details.reduce((s, d) => s + d.price * d.quantity, 0)

test("priceOrder: biaya tetap masuk total dan item Midtrans, jumlah item sama dengan total", () => {
  const r = priceOrder({ items, settings: settings({ mode: "flat", flat_amount: 20000, label: "Biaya Admin" }) })
  assert.equal(r.total, 852500)
  assert.equal(r.shipping, 20000)
  assert.equal(r.tax, 82500)
  assert.deepEqual(r.itemDetails.find((d) => d.id === "SHIPPING"), {
    id: "SHIPPING", name: "Biaya Admin", price: 20000, quantity: 1, brand: "Rhansoft", category: "Shipping",
  })
  assert.equal(sumOf(r.itemDetails), r.total)
})

test("priceOrder: per provinsi memakai tarif provinsi atau tarif standar", () => {
  const s = settings({ mode: "province", default_amount: 30000, province_rates: { "Jawa Barat": 15000 } })
  assert.equal(priceOrder({ items, settings: s, province: "jawa barat" }).total, 847500)
  assert.equal(priceOrder({ items, settings: s, province: "Bali" }).total, 862500)
})

test("priceOrder: mode provinsi tanpa provinsi mengembalikan error", () => {
  const s = settings({ mode: "province", default_amount: 30000 })
  assert.ok("error" in priceOrder({ items, settings: s }))
})

test("priceOrder: nonaktif tanpa item ongkir, jumlah item tetap sama dengan total", () => {
  const r = priceOrder({ items, settings: { ...DEFAULT_SHIPPING } })
  assert.equal(r.total, 832500)
  assert.equal(r.itemDetails.some((d) => d.id === "SHIPPING"), false)
  assert.equal(sumOf(r.itemDetails), r.total)
})

test("priceOrder: nama produk dipotong 50 karakter untuk Midtrans", () => {
  const long = [{ ...items[0], name: "x".repeat(80) }]
  assert.equal(priceOrder({ items: long, settings: { ...DEFAULT_SHIPPING } }).itemDetails[0].name.length, 50)
})

test("checkClientTotal: total dari browser harus sama dengan hitungan server", () => {
  assert.equal(checkClientTotal(832500, 832500), null)
  assert.equal(checkClientTotal("832500", 832500), null)
  assert.equal(checkClientTotal(undefined, 832500), null) // klien lama tanpa total: server tetap berwenang
  const err = checkClientTotal(812500, 832500)
  assert.ok(err && typeof err.error === "string")
  assert.equal(err.total, 832500)
})
