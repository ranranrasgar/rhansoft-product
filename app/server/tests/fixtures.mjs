import "dotenv/config"
import crypto from "node:crypto"
import { pool, query, queryOne } from "../db/pool.mjs"
import { signToken } from "../lib/auth.mjs"

const rand = () => crypto.randomBytes(4).toString("hex")

/** Pengguna uji (email berawalan lictest-). Mengembalikan id dan token login. */
export async function createUser({ role = "user" } = {}) {
  const row = await queryOne(
    `INSERT INTO users (first_name, last_name, email, role) VALUES ('Tes', 'Lisensi', $1, $2) RETURNING *`,
    [`lictest-${rand()}@example.test`, role]
  )
  return { id: row.id, token: signToken(row) }
}

/** Pesanan + satu baris item milik userId (order_id berawalan LICTEST-). */
export async function createOrderItem({ userId, quantity = 1, status = "settlement" }) {
  const customer = await queryOne(
    `INSERT INTO customers (first_name, last_name, email, phone) VALUES ('Tes', 'Lisensi', $1, '081200000000') RETURNING id`,
    [`lictest-${rand()}@example.test`]
  )
  const orderId = `LICTEST-${rand()}`
  const order = await queryOne(
    `INSERT INTO orders (order_id, customer_id, user_id, gross_amount, total_amount, transaction_status)
     VALUES ($1, $2, $3, 1000, 1000, $4) RETURNING id`,
    [orderId, customer.id, userId, status]
  )
  const item = await queryOne(
    `INSERT INTO order_items (order_id, product_id, product_name, price, quantity)
     VALUES ($1, 'lictest-product', 'Produk Uji', 1000, $2) RETURNING id`,
    [order.id, quantity]
  )
  return { orderId, orderItemId: item.id }
}

/** Hapus semua data uji (pesanan -> item -> permintaan lisensi ikut terhapus lewat cascade). */
export async function cleanupFixtures() {
  await query(`DELETE FROM orders WHERE order_id LIKE 'LICTEST-%'`)
  await query(`DELETE FROM customers WHERE email LIKE 'lictest-%'`)
  await query(`DELETE FROM users WHERE email LIKE 'lictest-%'`)
}

export async function closePool() {
  await pool.end()
}
