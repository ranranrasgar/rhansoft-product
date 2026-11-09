import { test } from "node:test"
import assert from "node:assert/strict"
import {
  normalizeLicenseCode,
  validateLicenseCode,
  validateRegistrationNumber,
  createRateLimiter,
} from "../lib/license.mjs"

test("normalizeLicenseCode: huruf besar, spasi dan baris baru dibuang", () => {
  assert.equal(normalizeLicenseCode("  ab12-cd34\n"), "AB12-CD34")
  assert.equal(normalizeLicenseCode("ab12 cd34\r\n ef56"), "AB12CD34EF56")
})

test("normalizeLicenseCode: bukan string menjadi string kosong", () => {
  assert.equal(normalizeLicenseCode(42), "")
  assert.equal(normalizeLicenseCode(undefined), "")
})

test("validateLicenseCode: bentuk sah mengembalikan null", () => {
  assert.equal(validateLicenseCode("AB12-CD3"), null)
  assert.equal(validateLicenseCode("A".repeat(80)), null)
})

test("validateLicenseCode: terlalu pendek, terlalu panjang, atau karakter terlarang ditolak dengan pesan", () => {
  assert.equal(typeof validateLicenseCode("AB1"), "string")
  assert.equal(typeof validateLicenseCode("A".repeat(81)), "string")
  assert.equal(typeof validateLicenseCode("AB12*CD34"), "string")
  assert.equal(typeof validateLicenseCode("AB12_CD34"), "string")
})

test("validateRegistrationNumber: dirapikan menjadi huruf besar", () => {
  assert.deepEqual(validateRegistrationNumber(" test-1234 "), { value: "TEST-1234" })
})

test("validateRegistrationNumber: pendek, karakter terlarang, atau bukan string ditolak", () => {
  assert.ok("error" in validateRegistrationNumber("AB"))
  assert.ok("error" in validateRegistrationNumber("A_B-1234"))
  assert.ok("error" in validateRegistrationNumber("A".repeat(121)))
  assert.ok("error" in validateRegistrationNumber(null))
})

test("createRateLimiter: melewati batas ditolak per kunci, dan pulih setelah jendela habis", async () => {
  const allow = createRateLimiter(2, 20)
  assert.equal(allow("u1"), true)
  assert.equal(allow("u1"), true)
  assert.equal(allow("u1"), false)
  assert.equal(allow("u2"), true)
  await new Promise((r) => setTimeout(r, 30))
  assert.equal(allow("u1"), true)
})
