import "dotenv/config"
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"

const dir = path.dirname(fileURLToPath(import.meta.url))
const dbDir = path.join(dir, "..", "db")
const DB = "tmp_lic_test"
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
  // Keadaan production: schema.sql + migrasi 001-003
  await client.query(fs.readFileSync(path.join(dbDir, "schema.sql"), "utf8"))
  for (const f of ["001_drop_nik.sql", "002_orders_user_id.sql", "003_users_table.sql"]) {
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

test("migrasi 005 membuat tabel license_requests dan aman dijalankan dua kali", async () => {
  const sql = fs.readFileSync(path.join(dbDir, "migrations", "005_license_requests.sql"), "utf8")
  await client.query(sql)
  await client.query(sql)

  const t = await client.query("SELECT to_regclass('public.license_requests') AS t")
  assert.ok(t.rows[0].t)
  const idx = await client.query("SELECT 1 FROM pg_indexes WHERE indexname = 'uq_license_requests_code'")
  assert.equal(idx.rowCount, 1)
})

test("indeks unik: kode sama pada item yang sama hanya boleh satu yang aktif, yang ditolak tidak dihitung", async () => {
  const u = await client.query("INSERT INTO users (first_name, email) VALUES ('T', 't@x.test') RETURNING id")
  const c = await client.query("INSERT INTO customers (first_name, last_name, email, phone) VALUES ('T','T','t@x.test','0812') RETURNING id")
  const o = await client.query(
    "INSERT INTO orders (order_id, customer_id, gross_amount, total_amount, transaction_status) VALUES ('LICTEST-1', $1, 1, 1, 'settlement') RETURNING id",
    [c.rows[0].id]
  )
  const it = await client.query(
    "INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES ($1, 'p', 'P', 1, 3) RETURNING id",
    [o.rows[0].id]
  )
  const ins = (code, status) =>
    client.query(
      "INSERT INTO license_requests (user_id, order_item_id, license_code, status) VALUES ($1, $2, $3, $4)",
      [u.rows[0].id, it.rows[0].id, code, status]
    )

  await ins("AB12-CD34", "pending")
  await assert.rejects(ins("AB12-CD34", "issued"), (e) => e.code === "23505")
  await ins("AB12-CD34", "rejected")
  await ins("AB12-CD34", "rejected")
})
