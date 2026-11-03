# Ongkos Kirim yang Diatur Admin — Rancangan

Tanggal: 3 November 2026 · Status: menunggu persetujuan · Cakupan: toko `app.rhantech.com`

## 1. Latar belakang dan tujuan

Checkout dulu menambahkan ongkos kirim Rp 25.000 (sisa template toko elektronik). PR #20 menghapusnya.
Pemilik toko ingin ongkos kirim **bisa diaktifkan atau dinonaktifkan sendiri** dari **Pengaturan Sistem**,
dengan dua cara bila aktif:

1. **Biaya tetap** yang sama untuk semua pelanggan (bisa diberi label "Ongkos Kirim" atau "Biaya Admin").
2. **Per wilayah**: tarif per provinsi, dengan **tarif standar** untuk provinsi yang tidak diisi.

Halaman Pengaturan Sistem saat ini tidak menyimpan apa pun (tombol Simpan hanya menampilkan pesan).
Bagian ongkos kirim dibuat berfungsi penuh; bagian lain diberi tanda "Belum aktif".

**Kriteria berhasil:** admin mengubah pengaturan ongkir, pelanggan melihat ongkir yang sesuai di checkout,
dan total yang tercatat di server serta dikirim ke Midtrans sama dengan yang dilihat pelanggan.

## 2. Di luar cakupan

- Fungsi lain di Pengaturan Sistem (Maintenance, SMTP, R2, Environment Midtrans, Nama/URL toko): tidak dibuat berfungsi.
  Kontrolnya dinonaktifkan dan diberi label "Belum aktif" agar tidak menyesatkan; pesan palsu "Pengaturan disimpan" dihapus.
- Ambang gratis ongkir, tarif per kota, tarif per produk, integrasi kurir (RajaOngkir dsb.).

## 3. Aturan bisnis

| Aturan | Keputusan |
|---|---|
| Bawaan | **Nonaktif** (ongkir 0), sama dengan perilaku setelah PR #20 |
| Mode `flat` | Satu nominal untuk semua pesanan |
| Mode `province` | Tarif sesuai provinsi yang dipilih pelanggan; provinsi tanpa tarif memakai tarif standar |
| Nominal | Bilangan bulat Rupiah 0 sampai 10.000.000 |
| Label | Teks yang tampil di checkout dan item Midtrans; bawaan "Ongkos Kirim"; maks. 40 karakter |
| PPN | 11% atas **subtotal saja**; ongkir tidak dikenai PPN |
| Satuan | Per pesanan (bukan per produk) |
| Provinsi | Hanya dari daftar 38 provinsi baku; nilai lain ditolak |
| Pesanan lama | Tidak berubah |

## 4. Model data

Migrasi `app/server/db/migrations/006_settings.sql` (idempotent):

```sql
CREATE TABLE IF NOT EXISTS settings (
    key         VARCHAR(50) PRIMARY KEY,
    value       JSONB NOT NULL,
    updated_by  INTEGER REFERENCES users(id),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

Satu baris `key = 'shipping'`, nilai:

```json
{ "enabled": false, "mode": "flat", "label": "Ongkos Kirim",
  "flat_amount": 0, "default_amount": 0, "province_rates": { "Jawa Barat": 15000 } }
```

Bila baris belum ada, server memakai bawaan di atas (tanpa perlu data awal).

## 5. Server

- `lib/provinces.mjs`: daftar 38 nama provinsi (salinan dari `src/lib/indonesia-provinces.ts`; tes memastikan keduanya sama).
- `lib/shippingSettings.mjs`:
  - `normalizeShippingSettings(input) -> { value } | { error }` — validasi semua aturan bagian 3, membuang provinsi tak dikenal.
  - `calculateShipping(settings, province) -> { amount, label } | { error }` — 0 bila nonaktif; mode `province` mewajibkan provinsi yang sah.
- `lib/pricing.mjs` (dari PR #20): `calculateOrderTotals(subtotal, shipping = 0)` — total = subtotal + PPN(subtotal) + shipping.
- Endpoint:
  - `GET /api/admin/settings/shipping`, `PUT /api/admin/settings/shipping` — hanya admin; PUT mencatat `updated_by`, `updated_at`.
  - `GET /api/shipping-config` — publik, hanya yang dibutuhkan checkout: `enabled`, `mode`, `label`, `flat_amount`, `default_amount`, `province_rates`.
- `POST /api/create-transaction`: membaca pengaturan dari database, menerima `province` dari body, menghitung ongkir di server
  (nilai dari browser diabaikan), 400 bila mode `province` aktif dan provinsi kosong/tidak dikenal. Item Midtrans memakai
  label pengaturan dan hanya dikirim bila ongkir > 0. `shipping_cost` tersimpan di `orders`.

## 6. Tampilan

- **Checkout:** memuat `/api/shipping-config`. Bila aktif dan mode `province`, muncul pilihan **Provinsi** (wajib) dari daftar baku.
  Baris ongkir dengan label pengaturan tampil di ringkasan hanya bila nilainya > 0. Tampilan hanya perkiraan; total resmi dari server.
- **Pengaturan Sistem → Ongkos Kirim:** saklar aktif, pilihan mode, label, biaya tetap, tarif standar, dan tabel 38 provinsi
  (kosong = tarif standar). Dimuat dari dan disimpan ke API; tombol Simpan menampilkan galat validasi dari server.
  Bagian lain halaman: kontrol nonaktif + label "Belum aktif".

## 7. Keamanan

Hanya admin yang bisa mengubah pengaturan (diperiksa di server). Semua masukan divalidasi dan kueri berparameter.
Ongkir dan total dihitung di server; nilai dari browser diabaikan seperti harga produk.

## 8. Pengujian

- Unit: validasi pengaturan (nominal negatif/besar/bukan angka, label kepanjangan, mode tak dikenal, provinsi tak dikenal dibuang);
  hitung ongkir (nonaktif, flat, provinsi bertarif, provinsi tanpa tarif = standar, provinsi kosong/tak dikenal = galat); total dan PPN.
- API: pelanggan biasa 403 pada endpoint admin; simpan lalu baca kembali; konfigurasi publik tanpa data admin;
  `create-transaction` mencatat ongkir sesuai pengaturan dan menolak provinsi tidak sah; nilai ongkir dari browser diabaikan.
- Tes daftar provinsi server sama dengan daftar frontend. Migrasi 006 dijalankan dua kali pada database kosong.
- Browser: aktifkan mode flat lalu provinsi dari halaman admin; checkout menampilkan pilihan provinsi dan total yang sama dengan yang tercatat.

## 9. Rilis

Dibangun di atas PR #20 (gabungkan dulu). Migrasi 006 berjalan otomatis lewat `bash update.sh`. Karena bawaan nonaktif,
tidak ada perubahan bagi pelanggan sampai admin mengaktifkannya.

## 10. Pertanyaan terbuka

Tidak ada yang menghalangi. Ambang gratis ongkir sengaja ditunda dan bisa ditambah kemudian.
