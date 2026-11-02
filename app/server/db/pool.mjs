import pg from "pg"

const { Pool } = pg

// ── Connection Pool ────────────────────────────────────────────
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "rhansoft_store",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

pool.on("connect", () => {
  console.log("📦 PostgreSQL connected")
})

pool.on("error", (err) => {
  console.error("❌ PostgreSQL pool error:", err.message)
})

// ── Helper: query with promise ─────────────────────────────────
export async function query(text, params) {
  const start = Date.now()
  const res = await pool.query(text, params)
  const duration = Date.now() - start
  if (process.env.NODE_ENV === "debug") {
    console.log(`📋 Query: ${text.substring(0, 80)}... | ${duration}ms | ${res.rowCount} rows`)
  }
  return res
}

// ── Helper: single row ─────────────────────────────────────────
export async function queryOne(text, params) {
  const res = await query(text, params)
  return res.rows[0] || null
}

// ── Helper: all rows ───────────────────────────────────────────
export async function queryAll(text, params) {
  const res = await query(text, params)
  return res.rows
}

// ── Test connection ────────────────────────────────────────────
export async function testConnection() {
  try {
    const res = await pool.query("SELECT NOW() as now, version() as version")
    console.log("✅ DB connection OK:", res.rows[0].now)
    console.log("   PostgreSQL version:", res.rows[0].version.split(" ").slice(0, 2).join(" "))
    return true
  } catch (err) {
    console.error("❌ DB connection failed:", err.message)
    return false
  }
}

export { pool }
