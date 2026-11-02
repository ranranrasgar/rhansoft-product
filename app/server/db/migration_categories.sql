-- ============================================================
--  Migration: Tambah kategori baru yang belum ada
-- ============================================================
INSERT INTO categories (id, name, tagline, icon, count, gradient, sort_order) VALUES
  ('education', 'Education', 'Sekolah & akademik', 'GraduationCap', 0, 'from-sky-50 to-sky-100', 8),
  ('hr', 'HR & Payroll', 'Kepegawaian & gaji', 'Users', 0, 'from-violet-50 to-violet-100', 9),
  ('inventory', 'Inventory', 'Stok & gudang', 'Boxes', 0, 'from-orange-50 to-orange-100', 10),
  ('restaurant', 'Restaurant', 'Cafe & resto', 'UtensilsCrossed', 0, 'from-red-50 to-red-100', 11),
  ('property', 'Property & Real Estate', 'Sewa & properti', 'Building2', 0, 'from-teal-50 to-teal-100', 12),
  ('transport', 'Transport & Logistics', 'Pengiriman & armada', 'Truck', 0, 'from-indigo-50 to-indigo-100', 13),
  ('manufacturing', 'Manufacturing', 'Produksi & pabrik', 'Factory', 0, 'from-stone-50 to-stone-100', 14),
  ('agriculture', 'Agriculture', 'Pertanian & perkebunan', 'Sprout', 0, 'from-green-50 to-green-100', 15),
  ('government', 'Government & Public Service', 'Layanan publik', 'Landmark', 0, 'from-blue-50 to-blue-100', 16),
  ('entertainment', 'Entertainment', 'Hiburan & media', 'Clapperboard', 0, 'from-pink-50 to-pink-100', 17)
ON CONFLICT (id) DO NOTHING;

-- Update count untuk semua kategori berdasarkan jumlah produk aktif
UPDATE categories SET count = sub.cnt
FROM (
  SELECT c.id, COUNT(p.id)::int as cnt
  FROM categories c
  LEFT JOIN products p ON p.category_id = c.id AND p.is_active = TRUE
  GROUP BY c.id
) sub
WHERE categories.id = sub.id;

SELECT id, name, tagline, icon, count FROM categories ORDER BY sort_order;
