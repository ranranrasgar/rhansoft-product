-- ============================================================
--  Migration: Tambah kolom yang hilang di tabel products
-- ============================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS download_links JSONB,
  ADD COLUMN IF NOT EXISTS install_tutorial TEXT,
  ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;

-- Verifikasi
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;
