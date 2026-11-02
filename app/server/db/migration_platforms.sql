-- ============================================================
--  Migration: Master Data Platforms
--  Dijalankan ke database rhansoft_store yang sudah ada
-- ============================================================

-- 1. Buat tabel master platforms
CREATE TABLE IF NOT EXISTS platforms (
    id          VARCHAR(50) PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    icon        VARCHAR(50),
    sort_order  INTEGER DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Buat junction table product_platforms (many-to-many)
CREATE TABLE IF NOT EXISTS product_platforms (
    product_id  VARCHAR(50) REFERENCES products(id) ON DELETE CASCADE,
    platform_id VARCHAR(50) REFERENCES platforms(id) ON DELETE CASCADE,
    sort_order  INTEGER DEFAULT 0,
    PRIMARY KEY (product_id, platform_id)
);

-- 3. Trigger update_updated_at untuk platforms
CREATE TRIGGER set_updated_at_platforms
    BEFORE UPDATE ON platforms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 4. Seed master data platforms
INSERT INTO platforms (id, name, icon, sort_order) VALUES
    ('desktop', 'Desktop (Windows)', 'Monitor', 0),
    ('web', 'Web Based', 'Globe', 1),
    ('android', 'Android', 'Smartphone', 2),
    ('ios', 'iOS (iPhone/iPad)', 'Apple', 3),
    ('macos', 'macOS', 'Laptop', 4),
    ('linux', 'Linux', 'Terminal', 5)
ON CONFLICT (id) DO NOTHING;

-- 5. Migrasikan data platform lama (string bebas) ke junction table
--    Berdasarkan pattern matching pada kolom products.platform
INSERT INTO product_platforms (product_id, platform_id, sort_order)
SELECT p.id, 'desktop', 0
FROM products p
WHERE p.platform ILIKE '%windows%'
  AND NOT EXISTS (
    SELECT 1 FROM product_platforms pp WHERE pp.product_id = p.id AND pp.platform_id = 'desktop'
  )
ON CONFLICT DO NOTHING;

INSERT INTO product_platforms (product_id, platform_id, sort_order)
SELECT p.id, 'web', 1
FROM products p
WHERE p.platform ILIKE '%web%'
  AND NOT EXISTS (
    SELECT 1 FROM product_platforms pp WHERE pp.product_id = p.id AND pp.platform_id = 'web'
  )
ON CONFLICT DO NOTHING;

INSERT INTO product_platforms (product_id, platform_id, sort_order)
SELECT p.id, 'android', 2
FROM products p
WHERE (p.platform ILIKE '%android%' OR p.platform ILIKE '%flutter%' OR p.platform ILIKE '%react native%' OR p.platform ILIKE '%kotlin%')
  AND NOT EXISTS (
    SELECT 1 FROM product_platforms pp WHERE pp.product_id = p.id AND pp.platform_id = 'android'
  )
ON CONFLICT DO NOTHING;

INSERT INTO product_platforms (product_id, platform_id, sort_order)
SELECT p.id, 'ios', 3
FROM products p
WHERE (p.platform ILIKE '%ios%' OR p.platform ILIKE '%iphone%' OR p.platform ILIKE '%flutter%' OR p.platform ILIKE '%react native%')
  AND NOT EXISTS (
    SELECT 1 FROM product_platforms pp WHERE pp.product_id = p.id AND pp.platform_id = 'ios'
  )
ON CONFLICT DO NOTHING;

INSERT INTO product_platforms (product_id, platform_id, sort_order)
SELECT p.id, 'macos', 4
FROM products p
WHERE p.platform ILIKE '%macos%' OR p.platform ILIKE '%mac os%'
  AND NOT EXISTS (
    SELECT 1 FROM product_platforms pp WHERE pp.product_id = p.id AND pp.platform_id = 'macos'
  )
ON CONFLICT DO NOTHING;

INSERT INTO product_platforms (product_id, platform_id, sort_order)
SELECT p.id, 'linux', 5
FROM products p
WHERE p.platform ILIKE '%linux%'
  AND NOT EXISTS (
    SELECT 1 FROM product_platforms pp WHERE pp.product_id = p.id AND pp.platform_id = 'linux'
  )
ON CONFLICT DO NOTHING;

-- 6. Verifikasi
SELECT 'Platforms:' as info;
SELECT id, name, icon, sort_order FROM platforms ORDER BY sort_order;

SELECT 'Product-Platform relations:' as info;
SELECT pp.product_id, p.name as product_name, pp.platform_id, pl.name as platform_name
FROM product_platforms pp
JOIN products p ON p.id = pp.product_id
JOIN platforms pl ON pl.id = pp.platform_id
ORDER BY pp.product_id, pp.sort_order;
