import "dotenv/config"
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"

const dir = path.dirname(fileURLToPath(import.meta.url))
const dbDir = path.join(dir, "..", "db")
const DB = "tmp_benefits_test"
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
  // Keadaan production: schema.sql + migrasi 001-007
  await client.query(fs.readFileSync(path.join(dbDir, "schema.sql"), "utf8"))
  for (const f of ["001_drop_nik.sql", "002_orders_user_id.sql", "003_users_table.sql", "004_seed_platforms.sql", "005_license_requests.sql", "006_settings.sql", "007_legacy_claims.sql"]) {
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

test("migrasi 008 menambah kolom benefits (JSONB) dan aman dijalankan dua kali", async () => {
  const sql = fs.readFileSync(path.join(dbDir, "migrations", "008_product_benefits.sql"), "utf8")
  await client.query(sql)
  await client.query(sql)
  const col = await client.query(
    `SELECT data_type FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'benefits'`
  )
  assert.equal(col.rows[0]?.data_type, "jsonb")
})
