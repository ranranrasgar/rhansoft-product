-- ============================================================
--  Auth Migration — Users table with roles
--  Roles: admin, user, editor
--  Supports: email/password (manual) + Google OAuth
-- ============================================================

-- ── USERS ───────────────────────────────────────────────────
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

-- Auto-update updated_at trigger
CREATE TRIGGER set_updated_at_users
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Seed default admin (password: admin123) ─────────────────
-- Password hash untuk "admin123" — generate ulang dengan bcrypt saat deploy production
-- Sementara: insert via seed script / register endpoint
