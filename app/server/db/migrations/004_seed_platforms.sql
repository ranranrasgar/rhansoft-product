-- Isi master data platform dan hubungkan ke produk.
-- Database production dibuat dari schema.sql saja: tabel platforms ada tetapi kosong
-- (isinya hanya ada di migration_platforms.sql), sehingga pilihan Platform di form
-- Edit Produk tidak muncul. Aman diulang.

INSERT INTO platforms (id, name, icon, sort_order) VALUES
    ('desktop', 'Desktop (Windows)', 'Monitor', 0),
    ('web', 'Web Based', 'Globe', 1),
    ('android', 'Android', 'Smartphone', 2),
    ('ios', 'iOS (iPhone/iPad)', 'Apple', 3),
    ('macos', 'macOS', 'Laptop', 4),
    ('linux', 'Linux', 'Terminal', 5)
ON CONFLICT (id) DO NOTHING;

-- Hubungkan produk yang sudah ada berdasarkan teks kolom products.platform
INSERT INTO product_platforms (product_id, platform_id, sort_order)
SELECT p.id, 'desktop', 0 FROM products p WHERE p.platform ILIKE '%windows%'
ON CONFLICT DO NOTHING;

INSERT INTO product_platforms (product_id, platform_id, sort_order)
SELECT p.id, 'web', 1 FROM products p WHERE p.platform ILIKE '%web%'
ON CONFLICT DO NOTHING;

INSERT INTO product_platforms (product_id, platform_id, sort_order)
SELECT p.id, 'android', 2 FROM products p
WHERE p.platform ILIKE '%android%' OR p.platform ILIKE '%flutter%'
   OR p.platform ILIKE '%react native%' OR p.platform ILIKE '%kotlin%'
ON CONFLICT DO NOTHING;

INSERT INTO product_platforms (product_id, platform_id, sort_order)
SELECT p.id, 'ios', 3 FROM products p
WHERE p.platform ILIKE '%ios%' OR p.platform ILIKE '%iphone%'
   OR p.platform ILIKE '%flutter%' OR p.platform ILIKE '%react native%'
ON CONFLICT DO NOTHING;

INSERT INTO product_platforms (product_id, platform_id, sort_order)
SELECT p.id, 'macos', 4 FROM products p
WHERE p.platform ILIKE '%macos%' OR p.platform ILIKE '%mac os%'
ON CONFLICT DO NOTHING;

INSERT INTO product_platforms (product_id, platform_id, sort_order)
SELECT p.id, 'linux', 5 FROM products p WHERE p.platform ILIKE '%linux%'
ON CONFLICT DO NOTHING;
