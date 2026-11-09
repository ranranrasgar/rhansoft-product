import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { PROVINCE_NAMES, findProvince } from "../lib/provinces.mjs"
import { DEFAULT_SHIPPING, normalizeShippingSettings, calculateShipping } from "../lib/shippingSettings.mjs"

const ok = (input) => {
  const r = normalizeShippingSettings(input)
  assert.ok("value" in r, `harus sah: ${JSON.stringify(input)} -> ${r.error}`)
  return r.value
}
const bad = (input) => assert.ok("error" in normalizeShippingSettings(input), `harus ditolak: ${JSON.stringify(input)}`)

test("daftar 38 provinsi server sama dengan daftar di frontend", () => {
  const ts = fs.readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "src", "lib", "indonesia-provinces.ts"),
    "utf8"
  )
  const front = [...ts.matchAll(/name:\s*"([^"]+)"/g)].map((m) => m[1])
  assert.equal(PROVINCE_NAMES.length, 38)
  assert.deepEqual([...PROVINCE_NAMES].sort(), [...front].sort())
})

test("findProvince: tidak peka huruf dan spasi, selain daftar baku null", () => {
  assert.equal(findProvince(" jawa barat "), "Jawa Barat")
  assert.equal(findProvince("DKI JAKARTA"), "DKI Jakarta")
  assert.equal(findProvince("Atlantis"), null)
  assert.equal(findProvince(""), null)
  assert.equal(findProvince(undefined), null)
})

test("normalize: masukan kosong menjadi bawaan nonaktif", () => {
  assert.deepEqual(ok({}), DEFAULT_SHIPPING)
  assert.deepEqual(DEFAULT_SHIPPING, {
    enabled: false,
    mode: "flat",
    label: "Ongkos Kirim",
    flat_amount: 0,
    default_amount: 0,
    province_rates: {},
  })
})

test("normalize: nominal harus bilangan bulat 0-10.000.000", () => {
  for (const v of ["15.000", -1, 1.5, 10000001, "abc", null]) bad({ flat_amount: v })
  for (const v of [-1, 1.5]) bad({ default_amount: v })
  assert.equal(ok({ flat_amount: 10000000 }).flat_amount, 10000000)
  assert.equal(ok({ flat_amount: 0 }).flat_amount, 0)
})

test("normalize: mode dan label", () => {
  bad({ mode: "kurir" })
  bad({ label: "x".repeat(41) })
  assert.equal(ok({ label: "   " }).label, "Ongkos Kirim")
  assert.equal(ok({ label: "  Biaya Admin " }).label, "Biaya Admin")
  assert.equal(ok({ enabled: "ya" }).enabled, false) // hanya true yang mengaktifkan
})

test("normalize: tarif provinsi dinormalisasi, yang tak dikenal atau kosong dibuang", () => {
  const v = ok({ province_rates: { "jawa barat": 15000, Atlantis: 5000, Bali: null, Aceh: "" } })
  assert.deepEqual(v.province_rates, { "Jawa Barat": 15000 })
  bad({ province_rates: { "Jawa Barat": -5 } })
  bad({ province_rates: "bukan objek" })
})

const settings = (over) => ok({ enabled: true, ...over })

test("calculateShipping: nonaktif selalu 0", () => {
  assert.deepEqual(calculateShipping(DEFAULT_SHIPPING, "Jawa Barat"), { amount: 0, label: "Ongkos Kirim" })
  assert.deepEqual(calculateShipping(DEFAULT_SHIPPING, undefined), { amount: 0, label: "Ongkos Kirim" })
})

test("calculateShipping: biaya tetap untuk semua, provinsi tidak diperlukan", () => {
  const s = settings({ mode: "flat", flat_amount: 20000, label: "Biaya Admin" })
  assert.deepEqual(calculateShipping(s, "Bali"), { amount: 20000, label: "Biaya Admin" })
  assert.deepEqual(calculateShipping(s, undefined), { amount: 20000, label: "Biaya Admin" })
})

test("calculateShipping: per provinsi, tanpa tarif memakai tarif standar", () => {
  const s = settings({ mode: "province", default_amount: 30000, province_rates: { "Jawa Barat": 15000 } })
  assert.equal(calculateShipping(s, "Jawa Barat").amount, 15000)
  assert.equal(calculateShipping(s, " jawa barat ").amount, 15000)
  assert.equal(calculateShipping(s, "Bali").amount, 30000)
})

test("calculateShipping: mode provinsi dengan semua tarif kosong dan standar 0 tetap 0, provinsi tetap wajib", () => {
  const s = settings({ mode: "province", default_amount: 0 })
  assert.equal(calculateShipping(s, "Papua").amount, 0)
  assert.ok("error" in calculateShipping(s, ""))
})

test("calculateShipping: mode provinsi tanpa provinsi atau provinsi tak dikenal ditolak", () => {
  const s = settings({ mode: "province", default_amount: 10000 })
  assert.ok("error" in calculateShipping(s, undefined))
  assert.ok("error" in calculateShipping(s, "Atlantis"))
})
