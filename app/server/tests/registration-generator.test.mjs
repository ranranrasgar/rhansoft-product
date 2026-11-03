import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { loadRegistrationGenerator } from "../lib/registrationGenerator.mjs"

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "reggen-"))
const write = (name, src) => {
  const p = path.join(tmp, name)
  fs.writeFileSync(p, src)
  return p
}

test("tanpa berkas generator: tidak tersedia dan tidak melempar galat", async () => {
  const gen = await loadRegistrationGenerator(path.join(tmp, "tidak-ada.mjs"))
  assert.equal(gen.available, false)
  assert.deepEqual(gen.versions, [])
  assert.deepEqual(gen.generate("AB12-CD34"), [])
})

test("dengan berkas: tersedia, daftar versi hanya memuat id, label, verified, note (tanpa fungsi)", async () => {
  const file = write(
    "ok.mjs",
    `export const versions = [
       { id: "a", label: "Versi A", verified: true, generate: (c) => "A-" + c },
       { id: "b", label: "Versi B", verified: false, note: "catatan", generate: (c) => "B-" + c },
     ]`
  )
  const gen = await loadRegistrationGenerator(file)
  assert.equal(gen.available, true)
  assert.deepEqual(gen.versions, [
    { id: "a", label: "Versi A", verified: true },
    { id: "b", label: "Versi B", verified: false, note: "catatan" },
  ])
  assert.deepEqual(gen.generate("X1"), [
    { id: "a", label: "Versi A", verified: true, number: "A-X1" },
    { id: "b", label: "Versi B", verified: false, note: "catatan", number: "B-X1" },
  ])
})

test("satu versi yang melempar galat dilaporkan per versi tanpa menggagalkan yang lain", async () => {
  const file = write(
    "partial.mjs",
    `export const versions = [
       { id: "a", label: "A", verified: false, generate: () => { throw new Error("kode tidak mengandung angka") } },
       { id: "b", label: "B", verified: false, generate: () => "OK-1" },
     ]`
  )
  const gen = await loadRegistrationGenerator(file)
  const [a, b] = gen.generate("ZZ")
  assert.equal(a.number, undefined)
  assert.equal(a.error, "kode tidak mengandung angka")
  assert.equal(b.number, "OK-1")
})

test("berkas yang bentuknya salah dianggap tidak tersedia", async () => {
  const file = write("bad.mjs", `export const versions = "bukan larik"`)
  const gen = await loadRegistrationGenerator(file)
  assert.equal(gen.available, false)
})
