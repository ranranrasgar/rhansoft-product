-- Manfaat produk (1 per baris di form admin) sebelumnya tidak punya kolom sehingga tidak pernah tersimpan.
-- Array teks JSON; NULL berarti halaman produk memakai manfaat bawaan.
-- Aman diulang.

ALTER TABLE products ADD COLUMN IF NOT EXISTS benefits JSONB;
