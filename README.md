# Rhansoft Product Store

Website katalog & checkout produk software dengan integrasi Midtrans (sandbox) dan backend PostgreSQL.

## Pekerjaan Terakhir

### 1. Halaman Detail Produk — Portfolio Style
- 11 section: Hero, Quick Info, Overview, Gallery, Spesifikasi, Why Choose, Stats, FAQ, CTA, Related
- Setiap produk punya warna sendiri yang dipakai konsisten di seluruh halaman

### 2. Produk Webbase & Mobile (dari screenshot)
- **Web Based (6 produk):** Tabungan Siswa, Kepegawaian, Perpustakaan, E-Commerce Multi Vendor, SiAkad, Pengaduan Masyarakat
- **Mobile App (4 produk):** Laundry, Jajanan Online, Absensi GPS, Berita Portal

### 3. Integrasi Midtrans Sandbox
- Merchant ID: `G627599304`
- Environment auto-detect: sandbox di local, production saat deploy
- Keys sandbox & production terpasang di `app/server/index.mjs` & `app/src/lib/midtrans.ts`

### 4. Bug Fix
- **Midtrans error 400 `country_code wrong length`** — normalisasi `ID` → `IDN` (ISO alpha-3)
- **React key duplikat** — query PostgreSQL cross-join specs×highlights diganti dengan LATERAL subquery
- **`getBoundingClientRect` null** — dampak dari React key duplikat, otomatis hilang
- **Transform highlights** — hapus `.map(h => h.highlight)` karena LATERAL sudah return array string

### 5. Fitur Pendaftaran Uji Coba Gratis
- Halaman `/trial-register` — form pendaftaran sederhana (nama, email, WhatsApp)
- Field wajib: Email & WhatsApp
- Backend API `POST /api/trial/register` — simpan ke DB + kirim email surat resmi
- **Email surat resmi berkop** Rhansoft (nodemailer SMTP Gmail)
- Notifikasi WhatsApp otomatis setelah submit
- Tabel DB baru: `trial_registrations`
- Tombol "Uji coba gratis" di Header & MobileMenu → link ke halaman pendaftaran

### 6. Rhansoft Ads (iklan produk untuk aplikasi lain)
- Produk Rhansoft bisa tampil sebagai iklan di aplikasi lain (mis. dashboard NOCR untuk tenant paket gratis).
- **Slot iklan** dikelola di Admin → Pengaturan → "Iklan Produk": nama, format (horizontal / vertikal / kotak), gaya (gambar saja / gambar + deskripsi), jumlah produk, aktif/nonaktif, statistik tayang & klik. Tiap slot punya `slot_key`.
- Produk mana yang boleh diiklankan: saklar per produk di bagian yang sama (`products.ad_enabled`).
- API publik (CORS `*`): `GET /api/ads?key=SLOT_KEY` → JSON produk acak; `GET /api/ads/click?key=&p=` → hitung klik lalu buka `/product/:id` (dengan UTM). Kode di `server/lib/ads.mjs`.
- Pasang di situs lain:
  ```html
  <div data-rhansoft-ad data-key="SLOT_KEY" data-format="horizontal" data-style="image_text"></div>
  <script async src="https://app.rhantech.com/api/ads/embed.js"></script>
  ```
  Opsional: `data-limit`, `data-note` + `data-note-url` (mis. ajakan upgrade).
- **Migrasi DB wajib** di server yang sudah jalan: `psql -U postgres -d rhansoft_store -f app/server/db/migration_ads.sql`.

## Tech Stack
- **Frontend:** React + Vite + TypeScript + Tailwind + shadcn/ui
- **Backend:** Express + PostgreSQL + midtrans-client + nodemailer
- **Payment:** Midtrans Snap.js (sandbox)

## Menjalankan
```bash
# Frontend + Backend sekaligus
cd app && npm run dev:all

# Atau terpisah
cd app/server && npm run dev   # backend :3001
cd app && npm run dev          # frontend :5173
```

## Database
```bash
cd app/server
node db/seed.mjs    # import data dari seed-data.json
```

## Environment Variables
Buat file `app/server/.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rhansoft_store
DB_USER=postgres
DB_PASSWORD=your_password

# Email (SMTP Gmail)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_FROM_ADDRESS=your@gmail.com

# Midtrans
MIDTRANS_SERVER_KEY=SB-Mid-server-xxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxx
MIDTRANS_IS_PRODUCTION=false
```
