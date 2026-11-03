import { test } from "node:test"
import assert from "node:assert/strict"
import { calculateOrderTotals } from "../lib/pricing.mjs"

test("software dikirim digital: tidak ada ongkos kirim berapa pun subtotalnya", () => {
  for (const subtotal of [1, 2000, 999999, 1000000, 5000000]) {
    assert.equal(calculateOrderTotals(subtotal).shipping, 0, String(subtotal))
  }
})

test("PPN 11% dibulatkan, total = subtotal + PPN", () => {
  assert.deepEqual(calculateOrderTotals(2000), { subtotal: 2000, shipping: 0, tax: 220, total: 2220 })
  assert.deepEqual(calculateOrderTotals(750000), { subtotal: 750000, shipping: 0, tax: 82500, total: 832500 })
  assert.equal(calculateOrderTotals(1005).tax, 111) // 110.55 dibulatkan
})
