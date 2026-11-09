import { test } from "node:test"
import assert from "node:assert/strict"
import { DEFAULT_TAX, normalizeTaxSettings, taxAmount } from "../lib/taxSettings.mjs"
import { calculateOrderTotals, priceOrder } from "../lib/pricing.mjs"
import { DEFAULT_SHIPPING } from "../lib/shippingSettings.mjs"

test("bawaan PPN tetap aktif 11% agar perilaku lama tidak berubah", () => {
  assert.deepEqual({ ...DEFAULT_TAX }, { enabled: true, rate: 11, label: "PPN" })
})

test("normalizeTaxSettings: tarif 0-100 dengan maksimal 2 desimal, label bawaan PPN", () => {
  assert.deepEqual(normalizeTaxSettings({ enabled: true, rate: 1.5, label: " PPh " }).value, { enabled: true, rate: 1.5, label: "PPh" })
  assert.deepEqual(normalizeTaxSettings({ enabled: false, rate: 0 }).value, { enabled: false, rate: 0, label: "PPN" })
  assert.deepEqual(normalizeTaxSettings({ enabled: true, rate: "11", label: "" }).value, { enabled: true, rate: 11, label: "PPN" })
  for (const rate of [-1, 100.01, 1.234, "abc", null, Number.NaN]) {
    assert.ok(normalizeTaxSettings({ enabled: true, rate }).error, String(rate))
  }
  assert.ok(normalizeTaxSettings({ enabled: true, rate: 11, label: "x".repeat(21) }).error)
})

test("taxAmount: nonaktif atau 0% berarti tanpa pajak; desimal dibulatkan", () => {
  assert.equal(taxAmount(1000, { enabled: false, rate: 11 }), 0)
  assert.equal(taxAmount(1000, { enabled: true, rate: 0 }), 0)
  assert.equal(taxAmount(1000, { enabled: true, rate: 11 }), 110)
  assert.equal(taxAmount(1005, { enabled: true, rate: 1.5 }), 15) // 15.075
})

test("calculateOrderTotals memakai pengaturan pajak; tanpa argumen tetap 11%", () => {
  assert.equal(calculateOrderTotals(2000).tax, 220)
  assert.deepEqual(calculateOrderTotals(2000, 0, { enabled: false, rate: 11, label: "PPN" }), {
    subtotal: 2000, shipping: 0, tax: 0, total: 2000,
  })
})

const items = [{ id: "sw", name: "Software", price: 1000, quantity: 1, brand: "Rhansoft", category: "POS" }]

test("priceOrder: PPN nonaktif tidak mengirim baris pajak ke Midtrans", () => {
  const r = priceOrder({ items, settings: { ...DEFAULT_SHIPPING }, tax: { enabled: false, rate: 11, label: "PPN" } })
  assert.equal(r.total, 1000)
  assert.equal(r.itemDetails.some((d) => d.id === "TAX"), false)
})

test("priceOrder: label dan tarif pajak tampil di item Midtrans, jumlah item = total", () => {
  const r = priceOrder({ items, settings: { ...DEFAULT_SHIPPING }, tax: { enabled: true, rate: 1.5, label: "PPh" } })
  assert.equal(r.tax, 15)
  assert.equal(r.itemDetails.find((d) => d.id === "TAX").name, "PPh 1.5%")
  assert.equal(r.itemDetails.reduce((s, d) => s + d.price * d.quantity, 0), r.total)
})
