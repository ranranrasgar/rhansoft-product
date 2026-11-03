# Klaim Lisensi Pelanggan Lama — Rancangan

Tanggal: 2026-11-03 · Status: disetujui di percakapan, menunggu tinjauan dokumen

## Tujuan

Pelanggan yang membeli aplikasi desktop lewat WA sebelum platform ini ada belum punya pesanan
di sistem, sehingga tidak bisa meminta nomor registrasi lewat web. Admin membagikan satu link
lewat WA; pelanggan mengisi klaim; admin memverifikasi dan menyetujui; sejak itu pelanggan
memakai alur lisensi yang sudah ada (Pesanan Saya, Generate, email) seperti pembeli biasa.

Ukuran berhasil:
- Admin cukup mengirim `https://app.rhantech.com/klaim-lisensi` ke pelanggan.
- Setelah disetujui, permintaan nomor registrasi pelanggan langsung muncul di menu Lisensi
  dan bisa di-Generate lalu diterbitkan tanpa langkah tambahan.
- Klaim yang belum disetujui atau ditolak tidak pernah muncul sebagai pesanan, di laporan,
  maupun di menu Pelanggan.

## Batasan

- Rumus nomor registrasi dan aplikasi desktop tidak berubah. Kode lisensi divalidasi dengan
  `validateLicenseCode` yang sudah ada.
- Repo publik: tidak ada rumus atau konstanta registrasi di kode baru.
- Tidak mengumpulkan NIK, lokasi GPS, atau data pribadi selain yang tercantum di form.
- Pesanan lama tidak melewati Midtrans.

## Alur pelanggan — `/klaim-lisensi`

- Wajib login. Bila belum, diarahkan ke `/login` dengan `state.from = "/klaim-lisensi"`
  (AuthPage sudah mendukungnya) lalu kembali ke form.
- Isian:
  | Isian | Aturan |
  |---|---|
  | Produk | pilih dari katalog (`/api/products`) **atau** "Lainnya" + nama aplikasi (3–100 karakter) |
  | Nama toko/perusahaan | wajib, 2–100 karakter |
  | Nomor WA saat membeli dulu | wajib, 10–15 digit setelah karakter non-digit dibuang |
  | Jumlah komputer | bilangan bulat 1–20 |
  | Kode lisensi | 1 sampai *jumlah komputer* kode, masing-masing lolos `validateLicenseCode` setelah `normalizeLicenseCode`, tidak boleh kembar di dalam klaim |
  | Catatan | opsional, ≤ 500 karakter |
- Satu akun hanya boleh punya **satu klaim `pending` per produk** (per `product_id`, atau per
  nama "Lainnya" tanpa membedakan huruf besar/kecil). Klaim kedua → 409.
- Pembatas laju: 5 klaim per akun per jam (memakai `createRateLimiter`).
- Halaman juga menampilkan klaim milik pengguna beserta statusnya: *Sedang diperiksa*,
  *Disetujui* (dengan tautan ke Pesanan Saya), atau *Ditolak* (dengan alasan admin; boleh kirim klaim baru).
- Setelah klaim terkirim, admin diberi tahu lewat `LICENSE_NOTIFY_EMAIL` (gagal kirim email
  tidak menggagalkan klaim).

## Alur admin — menu Lisensi, tab "Klaim pelanggan lama"

- Daftar klaim (terbaru di atas, filter status, bawaan `pending`) dengan semua isian + nama dan email akun.
- **Setujui**: dialog berisi pilihan produk (bawaan = produk yang dipilih pelanggan; wajib
  dipilih bila pelanggan mengisi "Lainnya") dan jumlah komputer (bawaan dari klaim, 1–20, tidak
  boleh kurang dari banyaknya kode yang dikirim). Dalam **satu transaksi**:
  1. kunci baris klaim; harus masih `pending` (bila tidak → 409);
  2. buat baris `customers` dari akun (nama, email) dan nomor WA klaim;
  3. buat `orders`: `order_id = 'LEGACY-' || <timestamp>`, `user_id` pemilik klaim,
     `gross_amount = total_amount = 0`, `transaction_status = 'settlement'`,
     `payment_type = 'legacy'`, `paid_at = NOW()`;
  4. buat `order_items` untuk produk terpilih, `price = 0`, `quantity` = jumlah komputer;
  5. buat satu `license_requests` (`pending`) per kode lisensi klaim;
  6. ubah klaim menjadi `approved`, simpan `order_id`, `reviewed_by`, `reviewed_at`.
  Setelah itu permintaan lisensi tampil di tab permintaan yang sudah ada, siap di-Generate.
- **Tolak**: alasan wajib (≤ 500 karakter); klaim menjadi `rejected`.
- Semua rute admin memakai `authMiddleware("admin")`.

## Data — migrasi `007_legacy_claims.sql`

```sql
CREATE TABLE IF NOT EXISTS legacy_claims (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users(id),
  product_id     VARCHAR(50) REFERENCES products(id),   -- NULL bila "Lainnya"
  product_other  VARCHAR(100),                          -- diisi bila "Lainnya"
  company        VARCHAR(100) NOT NULL,
  phone          VARCHAR(20)  NOT NULL,
  quantity       INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 20),
  license_codes  JSONB NOT NULL,                         -- array kode yang sudah dinormalisasi
  note           TEXT,
  status         VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  admin_note     TEXT,
  order_id       INTEGER REFERENCES orders(id),
  reviewed_by    INTEGER REFERENCES users(id),
  reviewed_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_legacy_claims_status ON legacy_claims(status);
CREATE INDEX IF NOT EXISTS idx_legacy_claims_user   ON legacy_claims(user_id);
```
Aman diulang; dijalankan `update.sh` seperti migrasi lain.

## API

| Metode & rute | Akses | Hasil |
|---|---|---|
| `POST /api/legacy-claims` | login | 201 `{ id, status: "pending" }`; 400 isian tidak sah; 409 klaim pending ganda; 429 terlalu sering |
| `GET /api/my/legacy-claims` | login | klaim milik pengguna (tanpa catatan internal selain `admin_note` saat ditolak) |
| `GET /api/admin/legacy-claims?status=` | admin | daftar klaim + nama/email akun + nama produk |
| `PUT /api/admin/legacy-claims/:id/approve` | admin | body `{ product_id, quantity }` → `{ order_id }`; 400/404/409 |
| `PUT /api/admin/legacy-claims/:id/reject` | admin | body `{ reason }`; 400/404/409 |

Id rute yang bukan angka → 404 (bukan 500). Logika berada di `lib/legacyClaims.mjs`
(validasi murni) dan `lib/legacyClaimRoutes.mjs` (rute), didaftarkan dari `index.mjs`
dengan pola `registerXRoutes(app, deps)` yang sudah dipakai.

## Tampilan yang ikut berubah

- **Pesanan Saya**: pesanan `payment_type = 'legacy'` diberi label *Pelanggan lama*,
  tanpa total rupiah; blok lisensi berfungsi seperti biasa.
- **Admin → Pesanan**: label *Pelanggan lama*; aksi Setujui/Batal/Refund/Sinkron disembunyikan
  untuk pesanan ini, dan server menolaknya (409) karena tidak ada di Midtrans.
- **Dashboard admin**: pesanan `legacy` tidak dihitung pada jumlah pesanan maupun pendapatan.
- **Admin → Pelanggan**: pelanggan dari pesanan lama tetap tampil (untuk marketing).
- Menu admin: tab baru di halaman Lisensi, dengan jumlah klaim `pending` sebagai lencana.

## Pengujian (node:test, DB lokal, serial)

- Validasi murni: setiap aturan isian di tabel di atas, termasuk kode kembar dan
  jumlah kode > jumlah komputer.
- `POST` klaim: berhasil; tanpa login 401; klaim pending ganda 409; produk tidak dikenal 400.
- Setujui: membuat order `LEGACY-…` lunas Rp 0, item dengan kuota benar, dan satu permintaan
  lisensi per kode; menyetujui dua kali → 409; "Lainnya" tanpa `product_id` → 400;
  quantity < banyaknya kode → 400.
- Tolak: tanpa alasan 400; berhasil → pelanggan bisa kirim klaim baru.
- Non-admin ke rute admin → 403.
- Aksi pesanan admin (approve/cancel/refund/sync) pada pesanan `legacy` → 409.

## Di luar cakupan

- Impor massal pelanggan lama dari berkas.
- Bukti pembelian berupa unggahan foto/berkas.
- Pengingat otomatis ke pelanggan via WA.
