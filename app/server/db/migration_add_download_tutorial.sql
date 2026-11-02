-- ============================================================
--  Migration: Tambah field download_links & install_tutorial
--  Jalankan jika database sudah ada (tanpa field baru)
-- ============================================================

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS download_links JSONB,
    ADD COLUMN IF NOT EXISTS install_tutorial TEXT,
    ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;

-- Done. Field baru sudah tersedia di tabel products.
