# Dokumentasi — Produk Webbase & Mobile + Integrasi Midtrans

**Tanggal:** 26 Oktober 2026  
**File yang diubah:** `src/lib/midtrans.ts`, `src/data/store.ts`, `src/sections/Categories.tsx`

---

## 1. Integrasi Midtrans Payment Gateway

### Konfigurasi yang dipasang

File: `src/lib/midtrans.ts`

Merchant ID: `G627599304`

**Sandbox (untuk local dev):**
- Client Key: `SB-Mid-client-xxxx` (lihat file `.env`)
- Server Key: `SB-Mid-server-xxxx` (lihat file `.env`)
- Snap URL: `https://app.sandbox.midtrans.com/snap/snap.js`

**Production (untuk deploy):**
- Client Key: `Mid-client-xxxx` (lihat file `.env`)
- Server Key: `Mid-server-xxxx` (lihat file `.env`)
- Snap URL: `https://app.midtrans.com/snap/snap.js`

### Auto Environment Detection

```typescript
const isProduction =
  window.location.hostname !== "localhost" &&
  window.location.hostname !== "127.0.0.1" &&
  !window.location.hostname.includes("preview")
```

- Di **localhost** → otomatis pakai **sandbox**
- Di **domain production** → otomatis pakai **production keys**
- `MIDTRANS_CONFIG` di-export untuk akses konfigurasi dari komponen lain

### Integrasi yang sudah ada
- `CheckoutPage.tsx` sudah memanggil `requestSnapToken()` → `payWithSnap()`
- Snap.js script di-load dengan `data-client-key` yang sesuai environment
- Pembayaran: hanya melalui Midtrans (tidak ada metode lain)

---

## 2. Kategori Baru

Ditambahkan 2 kategori baru di `categories[]`:

| Kategori | ID | Icon | Tagline | Jumlah Produk |
|----------|----|------|---------|---------------|
| **Web Based** | `webbase` | Globe | Aplikasi berbasis web | 6 |
| **Mobile App** | `mobile` | Smartphone | Android & iOS apps | 4 |

### Update Categories.tsx
- Import `Globe` dan `Smartphone` dari lucide-react
- Tambahkan ke `iconMap`
- Grid diubah dari `lg:grid-cols-6` → `lg:grid-cols-4` (8 kategori = 2 baris × 4 kolom)

---

## 3. Produk Web Based (6 produk)

| # | ID | Nama | Harga | Badge |
|---|----|------|-------|-------|
| 1 | `web-tabungan-siswa` | Tabungan Siswa Online | Rp 1.750.000 | New |
| 2 | `web-pegawai` | Sistem Informasi Kepegawaian | Rp 2.200.000 | Hot |
| 3 | `web-perpustakaan` | Sistem Perpustakaan Digital | Rp 1.500.000 | Sale |
| 4 | `web-ecommerce` | E-Commerce Multi Vendor | Rp 3.500.000 | Best Seller |
| 5 | `web-siakad` | Sistem Akademik Sekolah (SiAkad) | Rp 2.800.000 | New |
| 6 | `web-pengaduan` | Sistem Pengaduan Masyarakat | Rp 1.800.000 | — |

### Detail Teknis Produk Web Based
- **Platform:** Web Based (PHP/Laravel atau CodeIgniter)
- **Database:** MySQL / MariaDB
- **Lisensi:** Lifetime + Source Code
- **Akses:** Via browser (tanpa instalasi client)
- **Responsive:** Desktop, tablet, mobile

---

## 4. Produk Mobile App (4 produk)

| # | ID | Nama | Harga | Badge |
|---|----|------|-------|-------|
| 1 | `mobile-laundry` | Aplikasi Laundry Mobile | Rp 2.500.000 | Best Seller |
| 2 | `mobile-jajanan` | Aplikasi Jajanan Online | Rp 2.000.000 | Hot |
| 3 | `mobile-absensi` | Aplikasi Absensi GPS Mobile | Rp 1.800.000 | Sale |
| 4 | `mobile-berita` | Aplikasi Berita & Portal Mobile | Rp 1.500.000 | — |

### Detail Teknis Produk Mobile
- **Platform:** Android & iOS (Flutter / React Native / Kotlin Native)
- **Backend:** PHP/Laravel API atau Node.js
- **Database:** MySQL / PostgreSQL
- **Lisensi:** Lifetime + Source Code (APK + Source Code)
- **Fitur umum:** Push notification (Firebase FCM), Google Maps integration

---

## 5. Screenshot Assets

- **Source:** `C:\Users\rhansoft\OneDrive\Pictures\Screenshots\` (646 file PNG)
- **Destination:** `app/public/img/screenshots/` 
- **Rename:** Semua file di-rename ke format `ss-001.png` s/d `ss-646.png` untuk referensi mudah
- **Penggunaan:** Setiap produk punya 4 screenshot di gallery (ss-001 s/d ss-040 untuk 10 produk baru)

---

## 6. Total Produk Sekarang

| Kategori | Jumlah |
|----------|--------|
| POS & Retail | 5 |
| Accounting | 1 |
| Healthcare | 2 |
| Hospitality | 3 |
| Billing System | 1 |
| Communication | 2 |
| **Web Based** | **6** (baru) |
| **Mobile App** | **4** (baru) |
| **TOTAL** | **24 produk** |

---

## 7. Verifikasi

- `tsc -b --noEmit` — 0 error TypeScript
- Dev server running di `http://localhost:5173/`
- Preview homepage berhasil — kategori & produk baru tampil
- Midtrans sandbox keys terpasang di Snap.js script
- Auto-detect environment berfungsi (localhost → sandbox)

---

## 8. Catatan untuk Production

Ketika deploy ke production:

1. **Midtrans otomatis switch** ke production keys (deteksi hostname)
2. **Backend API diperlukan** untuk `requestSnapToken()`:
   - Buat endpoint `POST /api/create-transaction`
   - Gunakan `midtransClient.Snap` dengan server key production
   - Return `{ token, redirect_url }` ke frontend
3. **Server key** hanya boleh di backend — tidak boleh expose di frontend
4. **Webhook** untuk handle payment notification dari Midtrans
