-- Tabel users dan orders.user_id.
-- Database production dibuat dari schema.sql saja, jadi tabel users (migration_users.sql)
-- belum ada dan migrasi 002 tidak berbuat apa-apa. Migrasi ini aman diulang.

CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) DEFAULT '',
    email           VARCHAR(200) UNIQUE NOT NULL,
    password_hash   TEXT,                          -- NULL jika Google OAuth only
    google_id       VARCHAR(200) UNIQUE,           -- Google sub ID
    avatar_url      TEXT,
    role            VARCHAR(20) DEFAULT 'user',     -- admin, user, editor
    is_active       BOOLEAN DEFAULT TRUE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_users') THEN
    CREATE TRIGGER set_updated_at_users
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- Hubungkan pesanan ke akun (yang dilewati migrasi 002)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);

UPDATE orders o
   SET user_id = u.id
  FROM customers c
  JOIN users u ON lower(u.email) = lower(c.email)
 WHERE o.customer_id = c.id AND o.user_id IS NULL;
