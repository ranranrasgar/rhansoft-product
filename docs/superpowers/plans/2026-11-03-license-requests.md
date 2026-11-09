# Permintaan Nomor Registrasi Lisensi via Web — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pelanggan yang sudah membayar meminta nomor registrasi lisensi lewat Pesanan Saya, admin menempelkan nomor hasil alat lama lewat menu baru, pelanggan melihat dan menerima emailnya.

**Architecture:** Satu tabel baru `license_requests`; modul rute terpisah `lib/licenseRoutes.mjs` (didaftarkan dari `index.mjs`) dan modul validasi murni `lib/license.mjs`. Frontend: blok lisensi di Pesanan Saya dan halaman admin baru. Server **tidak** menghitung nomor registrasi.

**Tech Stack:** Node 22 (`node:test`), Express 4, PostgreSQL (`pg`), nodemailer, React 19 + TypeScript + Tailwind + shadcn/ui.

**Spec:** `docs/superpowers/specs/2026-11-03-license-requests-design.md`

## Global Constraints

- Rumus nomor registrasi **tidak boleh** muncul di kode, komentar, tes, atau dokumen di repo (repo publik). Tes memakai nomor rekaan seperti `TEST-1234-ABCD`.
- Kode lisensi: dinormalisasi huruf besar tanpa spasi; hanya `A–Z`, `0–9`, `-`; panjang 8–80.
- Nomor registrasi (admin): huruf besar; hanya `A–Z`, `0–9`, `-`; panjang 4–120.
- Kuota per baris pesanan (`order_items`) = `quantity`; hanya status `pending`/`issued` memakai kuota; `rejected` tidak.
- Hanya pesanan `settlement`/`capture` yang boleh meminta atau diterbitkan.
- Batas laju: 10 permintaan per pengguna per jam.
- Nomor registrasi dikembalikan hanya ke pemilik (status `issued`) dan admin; tidak ditulis ke log.
- Semua pesan kesalahan berbahasa Indonesia; kueri SQL berparameter.
- Migrasi: `app/server/db/migrations/005_license_requests.sql`, idempotent.
- Env baru hanya `LICENSE_NOTIFY_EMAIL` (opsional, kosong = tidak ada email ke admin).
- Gaya kode mengikuti file sekitar: tanpa titik koma, tanda kutip ganda, komentar singkat berbahasa Indonesia.

## Review Focus

1. Kode ditempel dengan huruf kecil, spasi, atau baris baru di ujung → diterima setelah dinormalisasi (Task 2, 3).
2. Dua permintaan bersamaan untuk slot kuota terakhir → hanya satu berhasil (Task 3).
3. Pesanan di-refund setelah permintaan dibuat → admin tidak bisa menerbitkan (409) (Task 4).
4. Admin mengklik Terbitkan/Tolak dua kali atau pada permintaan yang sudah ditolak → 409, tidak ada perubahan (Task 4).
5. Pelanggan membuka permintaan atau pesanan milik orang lain → 404, tanpa membocorkan keberadaannya (Task 3, 4).

---

## File Structure

| File | Tanggung jawab |
|---|---|
| `app/server/db/migrations/005_license_requests.sql` | tabel + indeks |
| `app/server/lib/license.mjs` | validasi murni + pembatas laju (tanpa DB, tanpa Express) |
| `app/server/lib/licenseRoutes.mjs` | rute pelanggan + admin untuk permintaan lisensi |
| `app/server/lib/email.mjs` (ubah) | `sendLicenseIssuedEmail`, `notifyAdminLicenseRequest` |
| `app/server/index.mjs` (ubah) | daftarkan rute; perluas `GET /api/my/orders` |
| `app/server/tests/` | `license.test.mjs` (unit), `license-api.test.mjs` (integrasi), `fixtures.mjs` |
| `app/src/components/LicenseBlock.tsx` | blok lisensi per produk di Pesanan Saya |
| `app/src/pages/MyOrdersPage.tsx` (ubah) | menampilkan `LicenseBlock` |
| `app/src/pages/admin/LicenseRequestsPage.tsx` | halaman admin |
| `app/src/pages/admin/AdminLayout.tsx`, `app/src/App.tsx` (ubah) | menu, rute, lencana |

Tes integrasi hanya membutuhkan database lokal (dari `.env`). Setiap tes membuat aplikasi Express sendiri di port acak (`express()` + `registerLicenseRoutes(app, deps)` + `listen(0)`) dengan `authMiddleware` asli dan **email palsu** yang hanya mencatat panggilan, sehingga tidak ada email sungguhan terkirim dan backend tidak perlu berjalan.

---

### Task 1: Migrasi tabel `license_requests`

**Files:**
- Create: `app/server/db/migrations/005_license_requests.sql`
- Test: `app/server/tests/migration-005.test.mjs`

**Interfaces:**
- Produces: tabel `license_requests(id, user_id, order_item_id, license_code, registration_number, status, admin_note, issued_by, issued_at, created_at, updated_at)` dan indeks unik parsial `uq_license_requests_code` pada `(order_item_id, license_code) WHERE status <> 'rejected'`.

- [ ] **Step 1: Tulis tes yang gagal** `migration-005.test.mjs`: buat database sementara `tmp_lic_test` dari `db/schema.sql` + `001`–`004`, jalankan `005` **dua kali**; assert `to_regclass('public.license_requests') IS NOT NULL`, indeks `uq_license_requests_code` ada, dan memasukkan dua baris dengan `(order_item_id, license_code)` sama dan `status='pending'` gagal dengan kode `23505`, sedangkan satu `pending` + satu `rejected` berhasil. Hapus database sementara di akhir.
- [ ] **Step 2: Jalankan** `cd app/server && node --test tests/migration-005.test.mjs` — Expected: FAIL (berkas migrasi belum ada).
- [ ] **Step 3: Tulis migrasi** sesuai SQL di bagian 5 spesifikasi (`CREATE TABLE IF NOT EXISTS`, dua indeks biasa, satu indeks unik parsial).
- [ ] **Step 4: Jalankan tes** — Expected: PASS.
- [ ] **Step 5: Commit** `feat(db): license_requests table`.

### Task 2: Validasi dan pembatas laju (`lib/license.mjs`)

**Files:**
- Create: `app/server/lib/license.mjs`
- Test: `app/server/tests/license.test.mjs`

**Interfaces:**
- Produces:
  - `normalizeLicenseCode(input: unknown): string` — huruf besar, semua spasi/baris baru dibuang; bukan string → `""`.
  - `validateLicenseCode(code: string): string | null` — `null` bila sah, selain itu pesan Indonesia.
  - `validateRegistrationNumber(input: unknown): { value: string } | { error: string }` — trim + huruf besar, aturan 4–120 dan `A–Z0–9-`.
  - `createRateLimiter(limit: number, windowMs: number): (key: string | number) => boolean` — `true` bila masih diizinkan; menyimpan di memori.

- [ ] **Step 1: Tulis tes yang gagal** (`node:test`, `assert/strict`): `normalizeLicenseCode("  ab12-cd34\n")` → `"AB12-CD34"`; `normalizeLicenseCode(42)` → `""`; `validateLicenseCode("AB12-CD3")` → `null`, `validateLicenseCode("AB1")` → pesan, `validateLicenseCode("AB12 CD34")` → pesan (setelah normalisasi spasi hilang, jadi uji `"AB12*CD34"`), panjang 81 → pesan, 80 → `null`; `validateRegistrationNumber(" test-1234 ")` → `{ value: "TEST-1234" }`, `"AB"` → `{ error }`, `"A_B-1234"` → `{ error }`; pembatas laju dengan `limit=2`: panggilan ke-3 untuk kunci sama `false`, kunci lain `true`, dan setelah jendela lewat (pakai `windowMs=20` dan tunggu 30 ms) `true` lagi.
- [ ] **Step 2: Jalankan** `node --test tests/license.test.mjs` — Expected: FAIL (modul belum ada).
- [ ] **Step 3: Implementasikan** keempat fungsi di `lib/license.mjs`; pembatas laju menyimpan larik waktu per kunci dan membuang yang di luar jendela.
- [ ] **Step 4: Jalankan tes** — Expected: PASS.
- [ ] **Step 5: Commit** `feat(license): validation helpers and rate limiter`.

### Task 3: API pelanggan (minta nomor, daftar di Pesanan Saya)

**Files:**
- Create: `app/server/lib/licenseRoutes.mjs`, `app/server/tests/fixtures.mjs`
- Modify: `app/server/index.mjs` (daftarkan rute; perluas handler `GET /api/my/orders`, ±baris 1340–1390)
- Modify: `app/server/lib/email.mjs` (tambah `notifyAdminLicenseRequest`)
- Modify: `app/server/package.json` (script `"test": "node --test tests/"`)
- Test: `app/server/tests/license-api.test.mjs`

**Interfaces:**
- Consumes: Task 1 (tabel), Task 2 (`normalizeLicenseCode`, `validateLicenseCode`, `createRateLimiter`).
- Produces:
  - `registerLicenseRoutes(app: Express, deps: { authMiddleware, queryOne, queryAll, pool, notifyAdminLicenseRequest }): void` — Task 4 menambah rute admin di fungsi yang sama dan menambah `sendLicenseIssuedEmail` pada `deps`.
  - `fetchMyLicenseRequests(queryAll: Function, userId: number): Promise<Record<number, LicenseRequestView[]>>` — dikelompokkan per `order_item_id`; dipakai handler `GET /api/my/orders` dan tes. `LicenseRequestView` seperti di Task 5 (`registration_number` hanya bila `issued`, `admin_note` hanya bila `rejected`).
  - `POST /api/my/order-items/:id/license-requests` body `{ license_code }` → `201 { id, status: "pending" }`; galat: 400 format, 403 tidak dipakai, 404 bukan milik/ tidak ada, 409 pesanan belum lunas / kuota habis / duplikat, 429 batas laju.
  - `GET /api/my/orders` tiap item menambah `id: number`, `quantity: number`, `license_requests: { id, license_code, status, created_at, registration_number?, admin_note? }[]` (`registration_number` hanya bila `status = 'issued'`, `admin_note` hanya bila `rejected`).
  - `notifyAdminLicenseRequest(info: { customerName: string, productName: string, orderId: string }): Promise<void>` — tidak berbuat apa-apa bila `LICENSE_NOTIFY_EMAIL` kosong.
  - `fixtures.mjs`: `createUser(email: string): Promise<{ id: number, token: string }>`, `createOrderItem(opts: { userId: number, quantity?: number, status?: string }): Promise<{ orderId: string, orderItemId: number }>`, `cleanupFixtures(): Promise<void>` (menghapus semua yang dibuat dengan awalan `LICTEST-`).

- [ ] **Step 1: Tulis tes yang gagal** `license-api.test.mjs` memakai `fixtures.mjs`:
  - `"tanpa login ditolak"` → POST 401.
  - `"kode huruf kecil dengan spasi dan baris baru diterima dan disimpan huruf besar"` → 201; `fetchMyLicenseRequests` memuat `license_code === "AB12-CD34-EF56"`.
  - `"format salah ditolak"` → kode `"AB*12"` 400.
  - `"pesanan belum lunas ditolak"` (status `pending`) 409; `"pesanan refund ditolak"` (status `refund`) 409.
  - `"kuota habis"` (`quantity=1`): permintaan kedua dengan kode lain 409; setelah permintaan pertama ditolak lewat SQL (`status='rejected'`), permintaan baru 201 (tidak memakai kuota).
  - `"duplikat ditolak"` kode sama dua kali 409.
  - `"dua permintaan bersamaan untuk slot terakhir hanya satu berhasil"` (`quantity=1`, `Promise.all` dua POST berbeda kode) → tepat satu 201 dan satu 409.
  - `"pengguna lain mendapat 404"` POST oleh pengguna lain 404, dan `fetchMyLicenseRequests` untuk pengguna lain tidak memuat permintaan itu.
  - `"nomor registrasi tidak bocor sebelum diterbitkan"`: set `registration_number` lewat SQL pada permintaan `pending`; hasil `fetchMyLicenseRequests` tidak mengandung field itu.
  - `"batas laju"`: 11 POST cepat oleh pengguna dengan `quantity=20` → permintaan ke-11 429.
- [ ] **Step 2: Jalankan** `npm test` di `app/server` — Expected: FAIL (rute belum ada, `fixtures.mjs` kosong).
- [ ] **Step 3: Implementasikan** `fixtures.mjs` (insert langsung ke `users`, `customers`, `orders`, `order_items`) dan `registerLicenseRoutes` untuk rute pelanggan. Cek berurutan sesuai spesifikasi: kepemilikan → lunas → format → batas laju → kuota+duplikat. Kuota dan sisipan dilakukan **dalam satu transaksi** dengan `SELECT ... FROM order_items WHERE id = $1 FOR UPDATE` agar permintaan bersamaan tidak melampaui kuota; pelanggaran indeks unik `23505` dipetakan ke 409. Setelah sukses, panggil `notifyAdminLicenseRequest` tanpa menunggu hasilnya (galatnya hanya dicatat).
- [ ] **Step 4: Perluas** handler `GET /api/my/orders` di `index.mjs`: tambahkan `oi.id` dan `oi.quantity` pada kueri item, panggil `fetchMyLicenseRequests(queryAll, req.user.id)` dan lampirkan hasilnya per item sebagai `license_requests`. Daftarkan `registerLicenseRoutes(app, {...})` setelah rute `/api/my/orders`.
- [ ] **Step 5: Jalankan** `npm test` — Expected: semua PASS.
- [ ] **Step 6: Commit** `feat(license): customer endpoints for registration requests`.

### Task 4: API admin dan email penerbitan

**Files:**
- Modify: `app/server/lib/licenseRoutes.mjs` (rute admin)
- Modify: `app/server/lib/email.mjs` (`sendLicenseIssuedEmail`)
- Test: `app/server/tests/license-api.test.mjs` (tambah blok admin)

**Interfaces:**
- Consumes: Task 3 (`registerLicenseRoutes`, `fetchMyLicenseRequests`, `fixtures.mjs`); wiring di `index.mjs` menambahkan `sendLicenseIssuedEmail` (diimpor dari `lib/email.mjs`) ke `deps`.
- Produces:
  - `GET /api/admin/license-requests?status=pending|issued|rejected` → `{ items: { id, status, license_code, registration_number, admin_note, created_at, issued_at, customer_name, customer_email, product_name, order_id, order_status }[], pending_count: number }`.
  - `PUT /api/admin/license-requests/:id/issue` body `{ registration_number }` → `200 { id, status: "issued" }`; 400 format, 404, 409 (pesanan tidak lunas atau status `rejected`).
  - `PUT /api/admin/license-requests/:id/reject` body `{ note }` → `200 { id, status: "rejected" }`; 400 bila `note` kosong; 409 bila bukan `pending`.
  - `sendLicenseIssuedEmail(info: { to: string, firstName: string, productName: string, registrationNumber: string }): Promise<void>`.

- [ ] **Step 1: Tulis tes yang gagal** (tambahan di `license-api.test.mjs`, admin dibuat lewat `createUser` lalu `UPDATE users SET role='admin'`):
  - `"pelanggan biasa 403 di semua endpoint admin"`.
  - `"daftar admin menampilkan pending_count dan kode lisensi"`.
  - `"terbitkan: nomor huruf kecil disimpan huruf besar, pelanggan melihatnya"` → issue `" test-1234-abcd "` 200; `fetchMyLicenseRequests` pemilik memuat `registration_number === "TEST-1234-ABCD"`, `status === "issued"`; kolom `issued_by` terisi; email palsu dipanggil sekali dengan nomor itu.
  - `"nomor tidak sah ditolak"` (`"AB"`, `"A_B-1234"`) 400.
  - `"terbitkan ulang yang sudah terbit boleh (koreksi)"` 200 dan nomor berubah.
  - `"terbitkan dua kali cepat pada yang pending tidak merusak"` dua PUT bersamaan → keduanya 200 atau satu 200 dan satu 409, dan akhirnya satu baris `issued` dengan satu nomor.
  - `"pesanan yang di-refund tidak bisa diterbitkan"` (ubah `orders.transaction_status='refund'` lewat SQL) → 409.
  - `"tolak wajib alasan"` tanpa `note` 400; dengan `note` 200, pelanggan melihat `admin_note`; menolak yang sudah `rejected` 409; **menerbitkan yang `rejected`** 409.
  - `"email gagal tidak membatalkan penerbitan"`: aplikasi tes memakai `sendLicenseIssuedEmail` palsu yang melempar; PUT tetap 200 dan status `issued`.
- [ ] **Step 2: Jalankan** `npm test` — Expected: FAIL pada blok baru.
- [ ] **Step 3: Implementasikan** tiga rute admin di `registerLicenseRoutes` dengan `authMiddleware("admin")`. `issue` memakai `validateRegistrationNumber`, memeriksa status pesanan lunas, mengisi `issued_by = req.user.id`, `issued_at = NOW()`, lalu memanggil `sendLicenseIssuedEmail` dalam `try/catch` (galat hanya dicatat). `reject` memperbarui hanya `WHERE status = 'pending'`. Jangan mencatat nomor registrasi ke log.
- [ ] **Step 4: Implementasikan** `sendLicenseIssuedEmail` di `email.mjs`, memakai kop dan transporter yang sudah ada seperti `sendOrderEmail`: berisi nama produk, nomor registrasi, dan langkah memasukkannya di program.
- [ ] **Step 5: Jalankan** `npm test` — Expected: semua PASS.
- [ ] **Step 6: Commit** `feat(license): admin endpoints and issued-email`.

### Task 5: Blok lisensi di Pesanan Saya

**Files:**
- Create: `app/src/components/LicenseBlock.tsx`
- Modify: `app/src/pages/MyOrdersPage.tsx` (tipe `OrderItem` + render untuk pesanan lunas)

**Interfaces:**
- Consumes: Task 3 (`GET /api/my/orders` dengan `id`, `quantity`, `license_requests`; `POST /api/my/order-items/:id/license-requests`).
- Produces: `LicenseBlock(props: { orderItemId: number; quantity: number; requests: LicenseRequestView[]; onChanged: () => void })`, dengan `LicenseRequestView = { id: number; license_code: string; status: "pending" | "issued" | "rejected"; created_at: string; registration_number?: string; admin_note?: string }`.

- [ ] **Step 1: Implementasikan** `LicenseBlock`: daftar permintaan dengan lencana (Menunggu / Diterbitkan / Ditolak), nomor registrasi dengan tombol **Salin** (`navigator.clipboard`, toast "Disalin"), alasan penolakan, teks "n dari quantity terpakai" (hitung `pending` + `issued`), dan bila kuota tersisa: input "Kode lisensi" + tombol **Minta nomor registrasi** yang memanggil POST dan `onChanged()`. Pesan galat server ditampilkan lewat toast.
- [ ] **Step 2: Render** `LicenseBlock` di `MyOrdersPage.tsx` di bawah tiap item hanya bila `paid`; sambungkan `onChanged` ke `load()`.
- [ ] **Step 3: Verifikasi tipe** `cd app && npx tsc -b` — Expected: tanpa error.
- [ ] **Step 4: Verifikasi di browser** (backend + Vite lokal, akun uji dengan pesanan lunas dari `fixtures`/SQL): halaman memuat blok, kode huruf kecil dengan spasi terkirim dan tampil huruf besar, kuota habis menyembunyikan form, tombol Salin menampilkan toast.
- [ ] **Step 5: Commit** `feat(orders): license request block in Pesanan Saya`.

### Task 6: Halaman admin Registrasi Lisensi

**Files:**
- Create: `app/src/pages/admin/LicenseRequestsPage.tsx`
- Modify: `app/src/pages/admin/AdminLayout.tsx` (item menu `/admin/licenses`, ikon `KeyRound`, hanya admin; lencana), `app/src/App.tsx` (rute `licenses`)

**Interfaces:**
- Consumes: Task 4 (`GET /api/admin/license-requests`, `PUT .../issue`, `PUT .../reject`).

- [ ] **Step 1: Implementasikan** `LicenseRequestsPage`: tab Menunggu / Diterbitkan / Ditolak; tiap baris menampilkan pelanggan, produk, nomor pesanan, status pembayaran, kode lisensi dengan tombol **Salin**; untuk `pending`: input nomor registrasi + tombol **Terbitkan** dan tombol **Tolak** (dialog dengan alasan wajib); untuk `issued`: nomor tampil dengan tombol **Ubah** (memakai input yang sama). Semua panggilan memakai `authHeaders()`.
- [ ] **Step 2: Lencana:** di `AdminLayout`, ambil `pending_count` saat layout dimuat dan setiap kali pindah halaman; tampilkan di samping menu "Registrasi Lisensi" bila lebih dari 0.
- [ ] **Step 3: Verifikasi tipe** `cd app && npx tsc -b` dan `npx vite build` — Expected: tanpa error.
- [ ] **Step 4: Verifikasi di browser** (login admin): permintaan dari Task 5 muncul dengan lencana 1; tempel nomor `test-1234-abcd`, Terbitkan; lencana hilang; di akun pelanggan nomor tampil `TEST-1234-ABCD`; Tolak dengan alasan tampil di sisi pelanggan dan pelanggan bisa mengirim ulang.
- [ ] **Step 5: Commit** `feat(admin): Registrasi Lisensi page`.

### Task 7: Verifikasi akhir dan PR

- [ ] **Step 1:** `cd app/server && npm test` — Expected: semua PASS; `cd app && npx tsc -b && npx vite build` — Expected: bersih.
- [ ] **Step 2:** Jalankan migrasi 005 dua kali pada database lokal nyata dan pastikan tidak ada galat.
- [ ] **Step 3:** `git grep -n -i -f docs-private/secret-patterns.txt -- .` (berkas pola ada di folder pribadi yang tidak masuk git; berisi konstanta rumus) — Expected: tidak ada hasil.
- [ ] **Step 4:** Bersihkan data uji (`cleanupFixtures()`), buka PR berbahasa Indonesia yang mencantumkan: migrasi 005 otomatis lewat `update.sh`, `LICENSE_NOTIFY_EMAIL` opsional, dan bagian yang belum diuji (email sungguhan).
