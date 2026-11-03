# Permintaan Nomor Registrasi Lisensi via Web — Rancangan

Tanggal: 3 November 2026 · Status: menunggu persetujuan · Cakupan: toko `app.rhantech.com`

## 1. Latar belakang dan tujuan

Aplikasi desktop Rhansoft diaktifkan **offline** dengan nomor registrasi. Saat ini pelanggan mengirim
**kode lisensi** (ditampilkan program) lewat WhatsApp, admin membuat nomor registrasi dengan alat yang ada,
lalu membalas lewat WhatsApp.

**Tujuan:** memindahkan alur itu ke web, tanpa mengubah cara nomor dibuat.

1. Pelanggan yang sudah membayar mengirim kode lisensinya lewat **Pesanan Saya**.
2. Admin melihat permintaan di menu admin, membuat nomor registrasi dengan alat yang sekarang, menempelkannya.
3. Pelanggan melihat nomor itu di **Pesanan Saya** dan menerima email.

**Kriteria berhasil:** pelanggan yang lunas bisa meminta dan menerima nomor tanpa WhatsApp; admin punya satu
daftar permintaan dengan status; setiap penerbitan tercatat (siapa, kapan, untuk pesanan mana).

## 2. Di luar cakupan (sengaja)

- **Rumus nomor registrasi tidak berubah dan tidak ada di web.** Aplikasi desktop yang sudah terpasang memakai
  rumus yang tertanam; mengubahnya merusak pelanggan lama. Rumus bersifat rahasia dan repo ini **publik**,
  jadi server tidak menghitung nomor. Admin menempel hasilnya secara manual.
- Perhitungan otomatis di server, aktivasi online, pencabutan lisensi, kebijakan ganti komputer.
- Perbaikan kelemahan skema yang ada (sudah didokumentasikan terpisah di luar git).

## 3. Alur

```
Pelanggan (Pesanan Saya)        Server                         Admin (Registrasi Lisensi)
  pesanan lunas ─► [Minta nomor registrasi] + tempel kode lisensi
                    └─► validasi + kuota ─► status MENUNGGU ──► lencana "n menunggu"
                                                              ◄── admin membuat nomor (alat lama)
                                                                  tempel nomor ─► [Terbitkan]
                    ◄── status DITERBITKAN, email pelanggan ◄──┘
  nomor tampil + tombol Salin                                     atau [Tolak] + alasan
```

## 4. Aturan bisnis

| Aturan | Keputusan |
|---|---|
| Siapa boleh meminta | Pemilik pesanan (`orders.user_id`) yang sudah login |
| Pesanan yang boleh | Status `settlement`/`capture` saja; pesanan refund/batal tidak boleh |
| Kuota | Tiap baris pesanan (`order_items`) berhak atas `quantity` permintaan **aktif** (menunggu atau diterbitkan). Yang **ditolak tidak memakai kuota**, jadi salah ketik bisa diulang. |
| Duplikat | Kode yang sama pada baris pesanan yang sama tidak boleh dua kali (selain yang ditolak) |
| Format kode | Dinormalisasi: huruf besar, spasi dihapus. Hanya `A–Z`, `0–9`, `-`; panjang 8–80. Selain itu ditolak dengan pesan jelas. |
| Nomor registrasi (admin) | Huruf besar, hanya `A–Z`, `0–9`, `-`; panjang 4–120; tidak boleh kosong |
| Ubah nomor yang sudah terbit | Boleh oleh admin (koreksi); dicatat sebagai penerbitan ulang |
| Batas laju | Maksimal 10 permintaan per pengguna per jam |

Satu permintaan = satu kode lisensi = satu komputer. Ganti komputer atau kuota habis ditangani manual
(WhatsApp) di versi pertama.

## 5. Model data

Migrasi baru `app/server/db/migrations/005_license_requests.sql` (idempotent):

```sql
CREATE TABLE IF NOT EXISTS license_requests (
    id                  SERIAL PRIMARY KEY,
    user_id             INTEGER NOT NULL REFERENCES users(id),
    order_item_id       INTEGER NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    license_code        VARCHAR(80) NOT NULL,
    registration_number VARCHAR(120),
    status              VARCHAR(20) NOT NULL DEFAULT 'pending',   -- pending | issued | rejected
    admin_note          TEXT,                                      -- alasan penolakan
    issued_by           INTEGER REFERENCES users(id),
    issued_at           TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_license_requests_status ON license_requests(status);
CREATE INDEX IF NOT EXISTS idx_license_requests_user ON license_requests(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_license_requests_code
    ON license_requests(order_item_id, license_code) WHERE status <> 'rejected';
```

## 6. API

Semua endpoint wajib login. Tidak ada satu pun yang menghitung atau mencatat rumus.

**Pelanggan**
- `GET /api/my/orders` (sudah ada) ditambah per item: `id`, `quantity`, dan `license_requests`
  (`id`, `license_code`, `status`, `created_at`; `registration_number` **hanya bila diterbitkan**; `admin_note`
  hanya bila ditolak).
- `POST /api/my/order-items/:id/license-requests` `{ license_code }` → 201. Cek berurutan: kepemilikan, pesanan
  lunas, format, kuota, duplikat, batas laju. Kesalahan menjawab 4xx dengan pesan berbahasa Indonesia.

**Admin** (`authMiddleware("admin")`)
- `GET /api/admin/license-requests?status=pending|issued|rejected` → daftar dengan pelanggan, produk, nomor
  pesanan, status pembayaran, kode lisensi.
- `PUT /api/admin/license-requests/:id/issue` `{ registration_number }` → status `issued`, mengisi `issued_by`
  dan `issued_at`, mengirim email ke pelanggan. Pesanan harus masih lunas.
- `PUT /api/admin/license-requests/:id/reject` `{ note }` (wajib) → status `rejected`.
- Jumlah yang menunggu ikut dikembalikan di daftar (untuk lencana).

**Email** (`lib/email.mjs`): `sendLicenseIssuedEmail` ke pelanggan berisi nama produk, nomor registrasi, dan
petunjuk memasukkannya. Pemberitahuan opsional ke admin lewat env `LICENSE_NOTIFY_EMAIL`; bila kosong, hanya lencana.
Kegagalan email **tidak** membatalkan penerbitan.

## 7. Tampilan

- **Pesanan Saya:** untuk tiap produk di pesanan lunas ada blok "Lisensi": daftar permintaan dengan lencana
  status (Menunggu / Diterbitkan / Ditolak + alasan), nomor registrasi dengan tombol **Salin**, dan form
  "Kode lisensi" + tombol **Minta nomor registrasi** selama kuota tersisa (menampilkan "1 dari 2 terpakai").
- **Admin → menu baru "Registrasi Lisensi"** (hanya admin): tab Menunggu / Diterbitkan / Ditolak; tiap baris
  menampilkan pelanggan, produk, nomor pesanan, kode lisensi (tombol **Salin**), kolom nomor registrasi dan
  tombol **Terbitkan**, serta **Tolak** (dialog alasan). Lencana jumlah "Menunggu" di sidebar.

## 8. Keamanan

- Otorisasi di setiap endpoint dan kepemilikan diperiksa di sisi server (pelanggan lain mendapat 404).
- Nomor registrasi hanya dikembalikan ke pemilik permintaan dan admin; tidak ditulis ke log.
- Semua input divalidasi dengan daftar karakter yang diizinkan dan kueri berparameter.
- Batas laju mencegah penyalahgunaan; setiap penerbitan mencatat admin dan waktu.
- Tidak ada rahasia baru di repo atau variabel lingkungan; satu-satunya env baru (`LICENSE_NOTIFY_EMAIL`) opsional.

## 9. Pengujian

- **API (lokal):** tanpa login 401; pelanggan lain 404; pesanan belum lunas/refund ditolak; format salah ditolak;
  kuota habis ditolak; duplikat ditolak; permintaan yang ditolak tidak memakai kuota; hanya admin yang bisa
  menerbitkan/menolak; nomor registrasi tidak muncul di daftar pelanggan sebelum diterbitkan.
- **Migrasi:** dijalankan dua kali pada database kosong dari `schema.sql` (keadaan production) tanpa error.
- **Browser:** alur pelanggan mengirim → admin menerbitkan → pelanggan melihat dan menyalin; alur tolak lalu kirim ulang.

## 10. Rilis

Satu PR: migrasi 005 + API + halaman. Naik lewat `bash update.sh` (migrasi otomatis). Tidak ada perubahan pada
aplikasi desktop. Pelanggan lama tidak terpengaruh; permintaan hanya untuk pesanan yang tercatat di toko.

## 11. Pertanyaan terbuka

Tidak ada yang menghalangi. Dua hal yang bisa diputuskan sambil jalan: (1) apakah pemberitahuan email ke admin
diaktifkan di awal, dan (2) berapa batas laju yang pas. Bawaan: email admin mati, 10 per jam.
