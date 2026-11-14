-- Migration 009: Perbarui data produk web-siakad (Sistem Akademik Sekolah SMP/SMK)
-- Memperbarui gambar utama, galeri 17 screenshot (termasuk mobile PWA), deskripsi, spek, dan highlight.

UPDATE products
SET
  name = 'Sistem Akademik Sekolah (SiAkad & CBT SMP/SMK)',
  image = '/img/siakad/01-dashboard-administrator.jpg',
  color = '#059669',
  rating = 4.9,
  reviews = 142,
  badge = 'Terlaris',
  original_price = 4500000,
  description = 'Sistem Informasi Akademik Sekolah (SiAkad) & Computer Based Test (CBT) modern terpadu untuk jenjang SMP, SMK, dan Pondok Pesantren. Dilengkapi Smart Absensi AI Face Recognition, monitoring KBM, kalender presensi bulanan, manajemen jadwal & guru pengganti (inval), buku nilai & e-rapor digital, database kesiswaan, gamifikasi Hall of Fame prestasi siswa, bank soal CBT dengan live smartphone preview, serta portal mobile PWA (Progressive Web App) responsif untuk smartphone guru dan siswa.',
  platform = 'Web Based & Mobile PWA (iOS / Android)',
  version = '5.0',
  license = 'Lifetime + Full Source Code',
  download_size = 'Cloud VPS / Server Lokal (Offline LAN Ready)',
  gallery = '[
    "/img/siakad/01-dashboard-administrator.jpg",
    "/img/siakad/02-absensi-face-recognition.jpg",
    "/img/siakad/03-absensi-kbm-mapel.jpg",
    "/img/siakad/04-absensi-kalender-bulanan.jpg",
    "/img/siakad/05-rekap-kehadiran-persentase.jpg",
    "/img/siakad/06-gamifikasi-hall-of-fame.jpg",
    "/img/siakad/07-jadwal-pelajaran-kolom.jpg",
    "/img/siakad/08-guru-pengganti-inval.png",
    "/img/siakad/09-rekap-nilai-harian-erapor.jpg",
    "/img/siakad/10-kesiswaan-database-siswa.jpg",
    "/img/siakad/11-ujian-cbt-bank-soal.jpg",
    "/img/siakad/12-cbt-editor-live-preview.png",
    "/img/siakad/mobile-01-beranda-pwa.jpg",
    "/img/siakad/mobile-02-jadwal-libur.png",
    "/img/siakad/mobile-03-daftar-sesi-mengajar.png",
    "/img/siakad/mobile-04-presensi-capaian-guru.png",
    "/img/siakad/mobile-05-absensi-siswa-mobile.png"
  ]'::jsonb,
  benefits = '[
    "Efisiensi operasional sekolah hingga 85%: rekap presensi, jadwal, dan nilai otomatis tanpa kalkulasi manual berulang.",
    "Tingkat kehadiran terpantau ketat secara real-time via kamera Face Recognition AI, mencegah titip absen dan keterlambatan.",
    "Guru mengajar lebih nyaman dengan portal mobile di smartphone, siap mencatat kehadiran kelas kapan saja dan mengajukan guru pengganti saat berhalangan.",
    "Pelaksanaan ujian PTS/PAS/PSAT hemat biaya cetak jutaan rupiah dengan sistem CBT anti-kecurangan dan penilaian instan.",
    "Meningkatkan reputasi sekolah di mata orang tua dan dinas pendidikan dengan sistem digital modern, rapi, dan terintegrasi.",
    "Beli sekali untuk selamanya tanpa biaya langganan bulanan / tahunan per siswa, bebas dipasang di VPS maupun server lokal sekolah."
  ]'::jsonb,
  updated_at = NOW()
WHERE id = 'web-siakad';

-- Perbarui Specs
DELETE FROM product_specs WHERE product_id = 'web-siakad';
INSERT INTO product_specs (product_id, label, value, sort_order) VALUES
  ('web-siakad', 'Platform', 'Web Based + Mobile PWA (iOS/Android)', 1),
  ('web-siakad', 'Smart Absensi', 'AI Face Recognition (Biometric Camera)', 2),
  ('web-siakad', 'Ujian CBT', 'PG, Multi-Choice, Jodoh, Essay + MathJax', 3),
  ('web-siakad', 'Jadwal & Inval', 'Tampilan Kolom & Kelola Guru Pengganti', 4),
  ('web-siakad', 'Gamifikasi', 'Hall of Fame & Leaderboard Prestasi Siswa', 5),
  ('web-siakad', 'E-Rapor & Nilai', 'Buku Nilai Digital & Normalisasi Skala 100', 6),
  ('web-siakad', 'Multi User', 'Superadmin, Kepala Sekolah, Guru, Siswa, Wali', 7),
  ('web-siakad', 'Deployment', 'Cloud VPS atau Server Lokal Sekolah (Offline LAN)', 8),
  ('web-siakad', 'Lisensi', 'Lifetime + Full Source Code (Bebas Biaya Bulanan)', 9);

-- Perbarui Highlights
DELETE FROM product_highlights WHERE product_id = 'web-siakad';
INSERT INTO product_highlights (product_id, highlight, sort_order) VALUES
  ('web-siakad', 'Smart Absensi AI Face Recognition (Biometric Scanner kamera touchless)', 1),
  ('web-siakad', 'Portal Mobile PWA guru & siswa (Add to Home Screen tanpa ribet PlayStore)', 2),
  ('web-siakad', 'CBT Ujian Sekolah interaktif lengkap dengan Live Smartphone Preview siswa', 3),
  ('web-siakad', 'Manajemen jadwal pelajaran format kolom & sistem izin Guru Pengganti (Inval)', 4),
  ('web-siakad', 'Gamifikasi ''Hall of Fame'' ranking performa siswa untuk dorong motivasi', 5),
  ('web-siakad', 'Rekap kehadiran & JP (Jam Pelajaran) akurat per mapel dan bulanan', 6),
  ('web-siakad', 'Master kesiswaan lengkap: cetak info login PDF massal & kartu pelajar', 7),
  ('web-siakad', 'Buku nilai digital dengan kalkulasi & normalisasi otomatis skala 100', 8);
