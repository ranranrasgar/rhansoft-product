import "dotenv/config"
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"

const dir = path.dirname(fileURLToPath(import.meta.url))
const dbDir = path.join(dir, "..", "db")
const DB = "tmp_settings_test"
const cfg = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
}

let client

before(async () => {
  const admin = new pg.Client({ ...cfg, database: "postgres" })
  await admin.connect()
  await admin.query(`DROP DATABASE IF EXISTS ${DB}`)
  await admin.query(`CREATE DATABASE ${DB}`)
  await admin.end()

  client = new pg.Client({ ...cfg, database: DB })
  await client.connect()
  // Keadaan production: schema.sql + migrasi 001-005
  await client.query(fs.readFileSync(path.join(dbDir, "schema.sql"), "utf8"))
  for (const f of ["001_drop_nik.sql", "002_orders_user_id.sql", "003_users_table.sql", "004_seed_platforms.sql", "005_license_requests.sql"]) {
    await client.query(fs.readFileSync(path.join(dbDir, "migrations", f), "utf8"))
  }
})

after(async () => {
  await client.end()
  const admin = new pg.Client({ ...cfg, database: "postgres" })
  await admin.connect()
  await admin.query(`DROP DATABASE IF EXISTS ${DB}`)
  await admin.end()
})

test("migrasi 006 membuat tabel settings dan aman dijalankan dua kali", async () => {
  const sql = fs.readFileSync(path.join(dbDir, "migrations", "006_settings.sql"), "utf8")
  await client.query(sql)
  await client.query(sql)
  const t = await client.query("SELECT to_regclass('public.settings') AS t")
  assert.ok(t.rows[0].t)
})

test("satu kunci hanya satu baris", async () => {
  await client.query(`INSERT INTO settings (key, value) VALUES ('shipping', '{"enabled": true}')`)
  await assert.rejects(
    client.query(`INSERT INTO settings (key, value) VALUES ('shipping', '{"enabled": false}')`),
    (e) => e.code === "23505"
  )
})
