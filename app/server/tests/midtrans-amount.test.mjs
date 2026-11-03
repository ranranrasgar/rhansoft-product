import { test } from "node:test"
import assert from "node:assert/strict"
import { midtransAmount } from "../lib/pricing.mjs"

test("midtransAmount: nominal teks Midtrans '4440.00' jadi bilangan bulat untuk kolom BIGINT", () => {
  assert.equal(midtransAmount("4440.00"), 4440)
  assert.equal(midtransAmount("1500000.00"), 1500000)
  assert.equal(midtransAmount(4440), 4440)
})

test("midtransAmount: nilai kosong atau bukan angka jadi null, bukan NaN", () => {
  assert.equal(midtransAmount(undefined), null)
  assert.equal(midtransAmount(""), null)
  assert.equal(midtransAmount("abc"), null)
})
