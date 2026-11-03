import { test } from "node:test"
import assert from "node:assert/strict"
import { validateClaim, isLegacyOrder, LEGACY_PREFIX } from "../lib/legacyClaims.mjs"
import { normalizeLicenseCode } from "../lib/license.mjs"

const ok = {
  product_id: "pos",
  company: "Toko A",
  phone: "0812-3456-7890",
  quantity: 2,
  license_codes: ["ab12-cd34-ef56"],
  note: "",
}
const errOf = (over) => validateClaim({ ...ok, ...over }).error

test("klaim sah dinormalisasi: WA hanya digit, kode huruf besar, catatan kosong jadi null", () => {
  const { value } = validateClaim(ok)
  assert.equal(value.phone, "081234567890")
  assert.deepEqual(value.license_codes, [normalizeLicenseCode("ab12-cd34-ef56")])
  assert.equal(value.note, null)
  assert.equal(value.product_id, "pos")
  assert.equal(value.product_other, null)
  assert.equal(value.company, "Toko A")
  assert.equal(value.quantity, 2)
})

test("produk Lainnya: nama bebas sah, harus salah satu dari katalog atau Lainnya", () => {
  const { value } = validateClaim({ ...ok, product_id: null, product_other: "  Jadwal Sekolah " })
  assert.equal(value.product_id, null)
  assert.equal(value.product_other, "Jadwal Sekolah")
  assert.ok(errOf({ product_id: null, product_other: "" }))
  assert.ok(errOf({ product_id: "pos", product_other: "Jadwal" }))
  assert.ok(errOf({ product_id: null, product_other: "ab" }))
})

test("jumlah komputer 1-20, angka dalam teks diterima", () => {
  assert.ok(errOf({ quantity: 0 }))
  assert.ok(errOf({ quantity: 21 }))
  assert.ok(errOf({ quantity: 1.5 }))
  assert.equal(validateClaim({ ...ok, quantity: "2" }).value.quantity, 2)
})

test("kode lisensi: minimal satu, tidak melebihi jumlah komputer, tidak kembar, harus sah", () => {
  assert.ok(errOf({ license_codes: [] }))
  assert.ok(errOf({ license_codes: "AB12-CD34-EF56" }))
  assert.ok(errOf({ quantity: 2, license_codes: ["AAAA-BBBB-1", "AAAA-BBBB-2", "AAAA-BBBB-3"] }))
  assert.ok(errOf({ license_codes: ["ab12-cd34-ef56", "AB12-CD34-EF56 "] }))
  assert.match(errOf({ license_codes: ["pendek"] }), /terlalu pendek/)
})

test("WA 10-15 digit, perusahaan 2-100, catatan maksimal 500", () => {
  assert.ok(errOf({ phone: "081234567" }))
  assert.ok(errOf({ phone: "0812345678901234" }))
  assert.ok(errOf({ company: "A" }))
  assert.ok(errOf({ company: "x".repeat(101) }))
  assert.ok(errOf({ note: "x".repeat(501) }))
  assert.equal(validateClaim({ ...ok, note: " beli 2019 " }).value.note, "beli 2019")
})

test("isLegacyOrder hanya untuk payment_type legacy", () => {
  assert.equal(isLegacyOrder({ payment_type: "legacy" }), true)
  assert.equal(isLegacyOrder({ payment_type: "qris" }), false)
  assert.equal(isLegacyOrder({}), false)
  assert.equal(LEGACY_PREFIX, "LEGACY-")
})
