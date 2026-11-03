# Ongkos Kirim yang Diatur Admin — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin mengaktifkan dan mengatur ongkos kirim (biaya tetap atau per provinsi + tarif standar) dari Pengaturan Sistem; checkout dan server memakai pengaturan itu.

**Architecture:** Tabel `settings` (JSONB per kunci). Modul murni `lib/shippingSettings.mjs` (validasi + hitung) dan `lib/provinces.mjs`; rute di `lib/settingsRoutes.mjs`; `create-transaction` membaca pengaturan dan menghitung ongkir di server. UI: blok Ongkos Kirim di Pengaturan Sistem, pilihan Provinsi di checkout.

**Tech Stack:** Node 22 (`node:test`), Express 4, PostgreSQL, React 19 + TypeScript + shadcn/ui.

**Spec:** `docs/superpowers/specs/2026-11-03-shipping-settings-design.md`

## Global Constraints

- Prasyarat: PR #20 (`lib/pricing.mjs`, ongkir lama dihapus) sudah di `main`. Bila belum digabung, cabang dibuat dari `origin/fix/no-shipping-cost`.
- Bawaan **nonaktif**: `{ enabled: false, mode: "flat", label: "Ongkos Kirim", flat_amount: 0, default_amount: 0, province_rates: {} }`.
- Nominal: bilangan bulat Rupiah 0–10.000.000. Label: 1–40 karakter, bawaan "Ongkos Kirim". Mode: `flat` | `province`.
- PPN 11% atas subtotal saja; ongkir per pesanan; tidak dikenai PPN.
- Provinsi hanya dari daftar 38 provinsi baku (nama persis seperti `src/lib/indonesia-provinces.ts`).
- Ongkir dan total dihitung di server; `shipping_cost` dari browser diabaikan.
- Hanya admin mengubah pengaturan; PUT mencatat `updated_by`, `updated_at`.
- Migrasi `app/server/db/migrations/006_settings.sql`, idempotent.
- Pesan kesalahan berbahasa Indonesia; kueri berparameter. Tes berjalan berurutan (`npm test`).

## Review Focus

1. Mode provinsi dengan semua tarif kosong dan tarif standar 0 → ongkir 0 di mana pun, provinsi tetap wajib dipilih (Task 2).
2. Provinsi dikirim dengan huruf/spasi berbeda (`" jawa barat "`) → dicocokkan ke nama baku (Task 2).
3. Nilai pengaturan rusak atau baris belum ada di database → bawaan dipakai, tidak 500 (Task 3).
4. Nominal berupa teks `"15.000"`, negatif, desimal, atau di atas 10.000.000 → 400 dengan pesan (Task 2, 3).
5. Browser mengirim `shipping_cost` palsu → server tetap memakai hitungannya sendiri (Task 4).

---

## File Structure

| File | Tanggung jawab |
|---|---|
| `app/server/db/migrations/006_settings.sql` | tabel `settings` |
| `app/server/lib/provinces.mjs` | `PROVINCE_NAMES` (38) + `findProvince(text)` |
| `app/server/lib/shippingSettings.mjs` | `DEFAULT_SHIPPING`, `normalizeShippingSettings`, `calculateShipping` |
| `app/server/lib/pricing.mjs` (ubah) | `calculateOrderTotals(subtotal, shipping = 0)` |
| `app/server/lib/settingsRoutes.mjs` | `loadShippingSettings`, `registerSettingsRoutes` |
| `app/server/index.mjs` (ubah) | daftarkan rute; `create-transaction` memakai pengaturan |
| `app/src/pages/CheckoutPage.tsx` (ubah) | pilihan Provinsi, baris ongkir |
| `app/src/pages/admin/SettingsPage.tsx` (ubah) | blok Ongkos Kirim berfungsi; bagian lain "Belum aktif" |

---

### Task 1: Migrasi tabel `settings`

**Files:** Create `app/server/db/migrations/006_settings.sql`; Test `app/server/tests/migration-006.test.mjs`

**Interfaces:** Produces tabel `settings(key VARCHAR(50) PK, value JSONB NOT NULL, updated_by INTEGER REFERENCES users(id), updated_at TIMESTAMPTZ DEFAULT NOW())`.

- [ ] **Step 1:** Tes (pola sama dengan `migration-005.test.mjs`: database sementara dari `schema.sql` + `001`–`005`): jalankan `006` dua kali; assert `to_regclass('public.settings')` ada; `INSERT ... ('shipping', '{"enabled":true}')` berhasil, kunci sama kedua kali gagal `23505`.
- [ ] **Step 2:** `node --test tests/migration-006.test.mjs` → FAIL (berkas tidak ada).
- [ ] **Step 3:** Tulis SQL sesuai spec bagian 4.
- [ ] **Step 4:** Tes → PASS.
- [ ] **Step 5:** Commit `feat(db): settings table`.

### Task 2: Validasi dan perhitungan ongkir (murni)

**Files:** Create `app/server/lib/provinces.mjs`, `app/server/lib/shippingSettings.mjs`; Modify `app/server/lib/pricing.mjs`; Test `app/server/tests/shipping-settings.test.mjs`, `app/server/tests/pricing.test.mjs`

**Interfaces:** Produces:
- `PROVINCE_NAMES: string[]` (38), `findProvince(text: unknown): string | null` — trim, tidak peka huruf, kembalikan nama baku.
- `DEFAULT_SHIPPING` (nilai di Global Constraints).
- `normalizeShippingSettings(input: unknown): { value } | { error: string }` — provinsi tak dikenal di `province_rates` dibuang; nilai tarif kosong/`null` dibuang.
- `calculateShipping(settings, province: unknown): { amount: number, label: string } | { error: string }`.
- `calculateOrderTotals(subtotal: number, shipping = 0) -> { subtotal, shipping, tax, total }`.

- [ ] **Step 1: Tes yang gagal**
  - `normalizeShippingSettings`: input kosong → `DEFAULT_SHIPPING`; `flat_amount: "15.000"`, `-1`, `1.5`, `10000001` → `error`; `mode: "kurir"` → `error`; label 41 karakter → `error`; label `"  "` → bawaan "Ongkos Kirim"; `province_rates: { "Jawa Barat": 15000, "Atlantis": 5000, "Bali": null }` → `{ "Jawa Barat": 15000 }`; kunci provinsi `"jawa barat"` disimpan sebagai `"Jawa Barat"`.
  - `calculateShipping`: nonaktif → `{ amount: 0 }`; flat 20000 → 20000 untuk provinsi apa pun atau kosong; provinsi: `"Jawa Barat"` bertarif 15000 → 15000, `" jawa barat "` → 15000, `"Bali"` tanpa tarif → `default_amount`; semua tarif kosong dan standar 0 → 0; provinsi kosong/`"Atlantis"` di mode provinsi → `error`; label mengikuti pengaturan.
  - `PROVINCE_NAMES.length === 38` dan sama persis (urutan bebas) dengan semua `name: "..."` di `app/src/lib/indonesia-provinces.ts` (baca berkas, regex).
  - `pricing.test.mjs`: `calculateOrderTotals(750000, 20000)` → `{ subtotal: 750000, shipping: 20000, tax: 82500, total: 852500 }`; tanpa argumen kedua tetap seperti sekarang.
- [ ] **Step 2:** `node --test tests/shipping-settings.test.mjs tests/pricing.test.mjs` → FAIL.
- [ ] **Step 3:** Implementasi tiga modul (tanpa DB/Express).
- [ ] **Step 4:** Tes → PASS.
- [ ] **Step 5:** Commit `feat(shipping): settings validation and calculation`.

### Task 3: Penyimpanan dan API pengaturan

**Files:** Create `app/server/lib/settingsRoutes.mjs`; Modify `app/server/index.mjs` (daftarkan); Test `app/server/tests/settings-api.test.mjs`

**Interfaces:** Consumes Task 1–2. Produces:
- `loadShippingSettings(queryOne): Promise<settings>` — baris tidak ada atau nilainya tidak lolos `normalizeShippingSettings` → `DEFAULT_SHIPPING`.
- `registerSettingsRoutes(app, { authMiddleware, queryOne }): void` dengan `GET/PUT /api/admin/settings/shipping` (admin) dan `GET /api/shipping-config` (publik: `enabled, mode, label, flat_amount, default_amount, province_rates`).

- [ ] **Step 1: Tes yang gagal** (aplikasi Express sendiri di port acak, `fixtures.mjs` untuk pengguna; bersihkan `DELETE FROM settings WHERE key = 'shipping'` sebelum/sesudah):
  - pelanggan biasa 403 pada GET/PUT admin; tanpa login 401.
  - belum ada baris → GET admin dan publik mengembalikan bawaan.
  - PUT valid → 200; GET admin dan publik mengembalikan nilai yang sama (provinsi dinormalisasi); baris menyimpan `updated_by` = id admin.
  - PUT `flat_amount: -1` → 400 dan nilai tersimpan tidak berubah.
  - nilai rusak di DB (`UPDATE settings SET value = '"rusak"'`) → GET publik 200 dengan bawaan.
  - respons publik tidak memuat `updated_by`.
- [ ] **Step 2:** `npm test` → FAIL pada berkas baru.
- [ ] **Step 3:** Implementasi; PUT memakai `INSERT ... ON CONFLICT (key) DO UPDATE`. Daftarkan di `index.mjs`.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `feat(settings): shipping settings API`.

### Task 4: `create-transaction` memakai pengaturan

**Files:** Modify `app/server/index.mjs` (blok harga di `POST /api/create-transaction`, sekitar `calculateOrderTotals(subtotal)` dan item `SHIPPING`)

**Interfaces:** Consumes `loadShippingSettings`, `calculateShipping`, `calculateOrderTotals(subtotal, shipping)`.

- [ ] **Step 1:** Ambil `province` dari body; `const settings = await loadShippingSettings(queryOne)`; `calculateShipping(settings, province)` → `error` = 400 dengan pesan; `calculateOrderTotals(subtotal, amount)`. Item Midtrans `SHIPPING` memakai `name: label` (maks. 50 karakter) bila `amount > 0`. `shipping_cost` dari body tidak dipakai.
- [ ] **Step 2: Verifikasi ke server lokal** (skrip sementara dengan `fixtures.mjs`, dihapus setelahnya): set pengaturan provinsi `{ "Jawa Barat": 15000 }`, standar 30000 → buat transaksi `province: "Jawa Barat"` dengan `shipping_cost: 1` → `orders.shipping_cost = 15000`, `total = harga + PPN + 15000`; `province: "Bali"` → 30000; tanpa provinsi → 400; nonaktifkan → 0. Bersihkan pesanan dan pengaturan uji.
- [ ] **Step 3:** `npm test` → PASS; commit `feat(checkout): server applies admin shipping settings`.

### Task 5: Checkout — pilihan Provinsi dan baris ongkir

**Files:** Modify `app/src/pages/CheckoutPage.tsx`

- [ ] **Step 1:** Muat `/api/shipping-config` saat halaman dibuka. Bila `enabled && mode === "province"`: tambah `<Select>` **Provinsi** (wajib, dari `PROVINCES` di `src/lib/indonesia-provinces.ts`) di samping Kota; validasi "Mohon pilih provinsi". Hitung ongkir tampilan: flat → `flat_amount`; provinsi → `province_rates[p] ?? default_amount`; nonaktif → 0. Baris `{label}` di ringkasan hanya bila > 0; total = subtotal + PPN + ongkir. Kirim `province` ke `requestSnapToken`.
- [ ] **Step 2:** `npx tsc -b` → bersih.
- [ ] **Step 3: Browser** (lokal): nonaktif → tidak ada pilihan Provinsi dan baris ongkir; flat 20000 → baris "Ongkos Kirim Rp 20.000"; mode provinsi → pilihan muncul, Jawa Barat 15000 dan Bali (standar) sesuai, total sama dengan hasil Task 4.
- [ ] **Step 4:** Commit `feat(checkout): province picker and shipping line from settings`.

### Task 6: Pengaturan Sistem

**Files:** Modify `app/src/pages/admin/SettingsPage.tsx`

- [ ] **Step 1:** Bagian baru **Ongkos Kirim**: saklar Aktif, pilihan mode (Biaya tetap / Per provinsi), Label, Biaya tetap (mode flat), Tarif standar dan tabel 38 provinsi dengan input angka (kosong = standar) (mode provinsi). Muat dari `GET /api/admin/settings/shipping`; tombol **Simpan ongkos kirim** memanggil PUT dengan `authHeaders()`; tampilkan pesan galat server; sukses → toast "Pengaturan ongkos kirim disimpan".
- [ ] **Step 2:** Bagian lain (Informasi Toko, Midtrans, Maintenance, Email, R2): semua kontrol `disabled`, lencana **Belum aktif** di judul; hapus tombol Simpan global dan pesan "Perubahan akan diterapkan setelah server di-restart".
- [ ] **Step 3:** `npx tsc -b` dan `npx vite build` → bersih.
- [ ] **Step 4: Browser** (admin lokal): simpan flat 20000 → muat ulang halaman, nilai tetap; isi tarif Jawa Barat → checkout memakai tarif itu; nominal `-1` → pesan galat, tidak tersimpan.
- [ ] **Step 5:** Commit `feat(admin): functional shipping settings; mark other settings inactive`.

### Task 7: Verifikasi akhir dan PR

- [ ] **Step 1:** `cd app/server && npm test` → semua PASS; `cd app && npx tsc -b && npx vite build` → bersih.
- [ ] **Step 2:** Migrasi 006 dua kali pada database lokal → tanpa galat; hapus data uji (`settings`, pesanan `LICTEST-`).
- [ ] **Step 3:** `git grep --cached -i -f docs-private/secret-patterns.txt -- .` → kosong.
- [ ] **Step 4:** PR berbahasa Indonesia: bawaan nonaktif, migrasi 006 lewat `update.sh`, cara mengaktifkan di Pengaturan Sistem.
