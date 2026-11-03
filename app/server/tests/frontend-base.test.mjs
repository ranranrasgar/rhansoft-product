import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const config = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "vite.config.ts"), "utf8")

test("vite base harus '/' (absolut): base relatif './' membuat /assets dicari di /admin/assets dan halaman kosong saat refresh", () => {
  const match = config.match(/^\s*base:\s*(["'])(.*?)\1/m)
  assert.ok(match, "vite.config.ts harus menetapkan base")
  assert.equal(match[2], "/")
})
