-- ============================================================
--  Rhansoft Store — PostgreSQL Schema
--  Database: rhansoft_store
--  Tables: categories, products, product_specs, product_highlights,
--          customers, orders, order_items, payment_notifications
-- ============================================================

-- ── CATEGORIES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
    id          VARCHAR(50) PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    tagline     VARCHAR(200),
    icon        VARCHAR(50),
    count       INTEGER DEFAULT 0,
    gradient    VARCHAR(100),
    sort_order  INTEGER DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── PRODUCTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
    id              VARCHAR(50) PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    category_id     VARCHAR(50) REFERENCES categories(id),
    price           BIGINT NOT NULL,           -- in IDR (no decimal)
    original_price  BIGINT,
    rating          DECIMAL(2,1) DEFAULT 0,
    reviews         INTEGER DEFAULT 0,
    badge           VARCHAR(50),
    image           TEXT,
    color           VARCHAR(20),
    description     TEXT,
    platform        VARCHAR(200),
    version         VARCHAR(50),
    license         VARCHAR(200),
    download_size   VARCHAR(50),
    gallery         JSONB,                     -- array of image paths
    download_links  JSONB,                     -- array of {label, url, size}
    install_tutorial TEXT,                     -- markdown/html tutorial instalasi
    featured        BOOLEAN DEFAULT FALSE,     -- tampil di mega menu header
    is_active       BOOLEAN DEFAULT TRUE,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── PLATFORMS (master data) ─────────────────────────────────
-- Tempat aplikasi berjalan: Desktop, Web, Android, iOS, dll.
-- Satu produk bisa punya banyak platform (many-to-many).
CREATE TABLE IF NOT EXISTS platforms (
    id          VARCHAR(50) PRIMARY KEY,      -- 'desktop', 'web', 'android', 'ios'
    name        VARCHAR(100) NOT NULL,         -- 'Desktop (Windows)'
    icon        VARCHAR(50),                   -- Lucide icon name: 'Monitor', 'Globe', 'Smartphone', 'Apple'
    sort_order  INTEGER DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── PRODUCT ↔ PLATFORMS (many-to-many) ───────────────────────
-- Satu produk bisa berjalan di multiple platform sekaligus.
-- Contoh: Aplikasi Klinik → Desktop + Web + Android
CREATE TABLE IF NOT EXISTS product_platforms (
    product_id  VARCHAR(50) REFERENCES products(id) ON DELETE CASCADE,
    platform_id VARCHAR(50) REFERENCES platforms(id) ON DELETE CASCADE,
    sort_order  INTEGER DEFAULT 0,
    PRIMARY KEY (product_id, platform_id)
);

-- ── PRODUCT SPECS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_specs (
    id          SERIAL PRIMARY KEY,
    product_id  VARCHAR(50) REFERENCES products(id) ON DELETE CASCADE,
    label       VARCHAR(100) NOT NULL,
    value       VARCHAR(200) NOT NULL,
    sort_order  INTEGER DEFAULT 0
);

-- ── PRODUCT HIGHLIGHTS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_highlights (
    id          SERIAL PRIMARY KEY,
    product_id  VARCHAR(50) REFERENCES products(id) ON DELETE CASCADE,
    highlight   TEXT NOT NULL,
    sort_order  INTEGER DEFAULT 0
);

-- ── CUSTOMERS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
    id              SERIAL PRIMARY KEY,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100),
    email           VARCHAR(200) NOT NULL,
    phone           VARCHAR(50) NOT NULL,
    address         TEXT,
    city            VARCHAR(100),
    postal_code     VARCHAR(20),
    country_code    VARCHAR(10) DEFAULT 'ID',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- ── ORDERS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
    id                  SERIAL PRIMARY KEY,
    order_id            VARCHAR(100) UNIQUE NOT NULL,  -- VE-{timestamp}
    customer_id         INTEGER REFERENCES customers(id),
    gross_amount        BIGINT NOT NULL,
    shipping_cost       BIGINT DEFAULT 0,
    tax                 BIGINT DEFAULT 0,
    total_amount        BIGINT NOT NULL,
    payment_method      VARCHAR(50),
    snap_token           TEXT,
    redirect_url        TEXT,
    midtrans_order_id   VARCHAR(100),
    transaction_id      VARCHAR(100),
    transaction_status  VARCHAR(50) DEFAULT 'pending', -- pending, settlement, capture, deny, cancel, expire, failure
    payment_type        VARCHAR(50),                   -- credit_card, gopay, bank_transfer, qris, etc.
    paid_at             TIMESTAMPTZ,
    expires_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(transaction_status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);

-- ── ORDER ITEMS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
    id          SERIAL PRIMARY KEY,
    order_id    INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id  VARCHAR(50),
    product_name VARCHAR(200) NOT NULL,
    price       BIGINT NOT NULL,
    quantity    INTEGER NOT NULL DEFAULT 1,
    brand       VARCHAR(100) DEFAULT 'Rhansoft',
    category    VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- ── PAYMENT NOTIFICATIONS (webhook log) ─────────────────────
CREATE TABLE IF NOT EXISTS payment_notifications (
    id                  SERIAL PRIMARY KEY,
    order_id            VARCHAR(100),
    transaction_id      VARCHAR(100),
    transaction_status  VARCHAR(50),
    payment_type        VARCHAR(50),
    gross_amount        BIGINT,
    fraud_status        VARCHAR(50),
    status_code         VARCHAR(10),
    status_message      TEXT,
    raw_notification    JSONB,
    created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_paynot_order ON payment_notifications(order_id);

-- ── PROMOS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promos (
    id          VARCHAR(50) PRIMARY KEY,
    eyebrow     VARCHAR(100),
    title       VARCHAR(200) NOT NULL,
    subtitle    TEXT,
    cta         VARCHAR(200),
    theme       VARCHAR(20) DEFAULT 'accent',
    image       TEXT,
    is_active   BOOLEAN DEFAULT TRUE,
    sort_order  INTEGER DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── HERO SLIDES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hero_slides (
    id              VARCHAR(50) PRIMARY KEY,
    eyebrow         VARCHAR(100),
    title           VARCHAR(200) NOT NULL,
    subtitle        TEXT,
    cta             VARCHAR(200),
    secondary_cta   VARCHAR(200),
    image           TEXT,
    align           VARCHAR(20) DEFAULT 'left',
    color           VARCHAR(20),
    sort_order      INTEGER DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE
);

-- ── AUTO-UPDATE updated_at trigger ──────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_categories
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_platforms
    BEFORE UPDATE ON platforms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_products
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_orders
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Done. Run seed.sql to populate initial data.
-- ============================================================

-- ── TRIAL REGISTRATIONS (uji coba gratis) ─────────────────────
CREATE TABLE IF NOT EXISTS trial_registrations (
    id              SERIAL PRIMARY KEY,
    registration_id VARCHAR(30) UNIQUE NOT NULL,    -- TR-{timestamp}
    full_name       VARCHAR(200) NOT NULL,
    nik             VARCHAR(16) NOT NULL,
    email           VARCHAR(200) NOT NULL,
    whatsapp        VARCHAR(20) NOT NULL,
    address         TEXT,
    city            VARCHAR(100),
    province        VARCHAR(100),
    company         VARCHAR(200),
    position        VARCHAR(200),
    product_name    VARCHAR(200),
    status          VARCHAR(30) DEFAULT 'pending',  -- pending, contacted, active, expired
    email_sent      BOOLEAN DEFAULT FALSE,
    email_sent_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trial_email ON trial_registrations(email);
CREATE INDEX IF NOT EXISTS idx_trial_wa ON trial_registrations(whatsapp);
CREATE INDEX IF NOT EXISTS idx_trial_status ON trial_registrations(status);

CREATE TRIGGER set_updated_at_trial
    BEFORE UPDATE ON trial_registrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

