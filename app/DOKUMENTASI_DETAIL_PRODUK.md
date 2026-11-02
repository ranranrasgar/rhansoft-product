# Dokumentasi — Rombak Halaman Detail Produk

**Tanggal:** 26 Oktober 2026  
**File:** `src/pages/ProductDetailPage.tsx`

---

## Ringkasan

Halaman detail produk dirombak total dari layout sederhana (gambar + info + specs + related) menjadi **halaman portfolio produk profesional** yang full menjelaskan setiap aspek produk dalam 1 halaman lengkap.

---

## Struktur Halaman (8 Section)

### 1. Breadcrumb Bar
- Background `muted/30` dengan border bawah
- Link Beranda → Kategori (klik untuk filter) → Nama Produk

### 2. Hero Section
- Gallery: aspect-square + thumbnail grid (border highlight + ring)
- Color accent glow di belakang gambar (warna produk)
- Info: kategori, judul, star rating, harga + hemat badge
- Description + highlights grid dengan icon berwarna produk
- Quantity selector + 2 CTA buttons (warna produk untuk "Beli sekarang")
- Trust badges: Lisensi Seumur Hidup / Garansi 30 Hari / Instalasi Gratis

### 3. Quick Info Bar
Strip horizontal dengan 4 info cepat:
- Platform (Monitor icon)
- Versi (Tag icon)
- Lisensi (ShieldCheck icon)
- Ukuran download (HardDrive icon)

### 4. Overview Section
- Layout 2 kolom: konten utama + sidebar
- Penjelasan produk + paragraf context bisnis
- Feature grid 2 kolom dengan icon berwarna produk
- **Sidebar:**
  - Card "Keunggulan Utama" dengan 6 checklist
  - Card CTA "Butuh demo?" (background warna produk, tombol "Hubungi Sales")

### 5. Gallery Showcase
- Grid responsif (1/2/3 kolom)
- Setiap gambar: hover zoom + gradient overlay + label "Tampilan N"
- Klik untuk navigasi ke gallery utama

### 6. Specifications Section
- Layout 2 kolom:
  - **Tabel spec** dengan zebra striping (alternating row colors)
  - **System requirements** (CPU icon): OS, RAM, storage, processor, internet
  - **Database support** (Database icon): MySQL/MariaDB, SQLite, backup, import/export, enkripsi

### 7. Why Choose Us
- Background `muted/30`
- 4 card: Lisensi Seumur Hidup, Garansi 30 Hari, Support Indonesia, Instalasi Gratis
- Centered header dengan subtitle

### 8. Stats Banner
- Full-width banner dengan background warna produk
- 4 stats: 15+ Tahun, 5.000+ Pelanggan, 34 Kota, 4.8/5 Rating

### 9. FAQ Section
- Accordion dengan 6 Q&A
- Pertanyaan: lisensi multi-PC, biaya langganan, support, demo, database, update
- Default terbuka item pertama

### 10. CTA Banner
- Dark slate-950 background dengan glow warna produk
- "Siap meningkatkan bisnis Anda?" + 2 tombol (Beli sekarang + Tambah ke keranjang)

### 11. Related Products
- Grid 4 kolom produk terkait

---

## Desain & UX

| Aspek | Detail |
|-------|--------|
| Color theming | Setiap produk punya `color` sendiri — dipakai di: judul kategori, icon backgrounds, tombol CTA, glow effects, badge, sidebar CTA, stats banner, FAQ accents |
| Icons | 12 icon dari lucide-react dipakai rotasi untuk highlights (BarChart3, ScanLine, Users, Printer, Cloud, Wifi, Lock, FileText, CreditCard, Smartphone, Layers, Zap) |
| Responsive | Mobile: 1 kolom, tablet: 2 kolom, desktop: 2-4 kolom sesuai section |
| Animations | Hover scale pada gallery + related products, smooth transitions |
| Accessibility | Aria-labels pada tombol quantity, semantic section elements |

---

## Verifikasi

- `tsc -b` — 0 error TypeScript
- ESLint — 0 warnings
- Dev server running di `http://localhost:5173/`
- Preview `http://localhost:5173/product/sw-toko` berhasil
