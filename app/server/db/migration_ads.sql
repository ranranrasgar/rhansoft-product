-- ============================================================
--  Migration: Ad slots (iklan produk Rhansoft di aplikasi lain)
--  Jalankan ke database rhansoft_store yang sudah ada:
--    psql -U postgres -d rhansoft_store -f server/db/migration_ads.sql
-- ============================================================

-- Satu slot = satu tempat tayang di aplikasi lain (mis. dashboard NOCR untuk tenant gratis).
-- slot_key dipakai aplikasi tersebut untuk meminta iklan (API / skrip sematan).
CREATE TABLE IF NOT EXISTS ad_slots (
    id           SERIAL PRIMARY KEY,
    slot_key     VARCHAR(64) UNIQUE NOT NULL,
    name         VARCHAR(120) NOT NULL,
    site_url     TEXT,
    format       VARCHAR(20) NOT NULL DEFAULT 'horizontal',  -- horizontal | vertical | square
    style        VARCHAR(20) NOT NULL DEFAULT 'image_text',  -- image | image_text
    max_items    INTEGER NOT NULL DEFAULT 3,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    impressions  BIGINT NOT NULL DEFAULT 0,
    clicks       BIGINT NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Produk mana yang boleh tampil sebagai iklan (default: semua produk aktif).
ALTER TABLE products ADD COLUMN IF NOT EXISTS ad_enabled BOOLEAN DEFAULT TRUE;
