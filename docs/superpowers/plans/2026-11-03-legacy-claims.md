# Klaim Lisensi Pelanggan Lama Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pelanggan lama mengirim klaim di `/klaim-lisensi`; admin menyetujui; sistem membuat pesanan `LEGACY-` Rp 0 lunas beserta permintaan lisensinya, sehingga alur lisensi yang sudah ada langsung dipakai.

**Architecture:** Tabel `legacy_claims` (migrasi 007). Validasi murni di `lib/legacyClaims.mjs`; rute di `lib/legacyClaimRoutes.mjs` dengan pola `registerXRoutes(app, deps)`. Persetujuan membuat customers → orders → order_items → license_requests dalam satu transaksi. Frontend: halaman baru `ClaimLicensePage`, panel admin `LegacyClaimsPanel` di halaman Lisensi, label "Pelanggan lama" di Pesanan Saya/Admin Pesanan, dashboard mengecualikan `legacy`.

**Tech Stack:** Express 4 + pg, node:test (serial, DB lokal), React 19 + Vite + shadcn/ui.

**Spec:** `docs/superpowers/specs/2026-11-03-legacy-claims-design.md`

## Global Constraints

- Repo publik: tidak ada rumus/konstanta registrasi di kode. Sebelum push: `git grep --cached -i -f docs-private/secret-patterns.txt -- .` harus kosong.
- Kode lisensi: `normalizeLicenseCode` lalu `validateLicenseCode` dari `lib/license.mjs`.
- Pesanan lama: `order_id` berawalan `LEGACY-`, `payment_type = 'legacy'`, `transaction_status = 'settlement'`, `gross_amount = total_amount = 0`, `price = 0`.
- Jumlah komputer 1–20; kode 1..jumlah, tanpa kembar; WA 10–15 digit; perusahaan 2–100 karakter; "Lainnya" 3–100 karakter; catatan/alasan ≤ 500.
- Teks UI berbahasa Indonesia. Tidak mengumpulkan NIK/GPS.
- Tes: `cd app/server && npm test` (serial). Typecheck: `cd app && npx tsc -b`.

## Review Focus

- Dua admin menekan Setujui bersamaan → hanya satu pesanan LEGACY tercipta (kunci baris `FOR UPDATE`, status harus `pending`).
- Kode lisensi yang sama dikirim di klaim dan sudah ada sebagai permintaan aktif → unik index `uq_license_requests_code` hanya per item, item baru jadi tidak bentrok; pastikan persetujuan tidak gagal 500.
- `product_id` dari body pelanggan yang tidak ada di `products` → 400, bukan 500 (FK).
- Id rute bukan angka (`/approve` pada `abc`) → 404, bukan 500.
- Pesanan `legacy` menerima aksi admin approve/cancel/refund/sync → harus 409 (tidak ada di Midtrans).

---

### Task 1: Migrasi 007 + validasi murni

**Files:**
- Create: `app/server/db/migrations/007_legacy_claims.sql` (isi persis dari spec bagian Data)
- Create: `app/server/lib/legacyClaims.mjs`
- Test: `app/server/tests/legacy-claims.test.mjs`

**Interfaces:**
- Produces: `validateClaim(body) -> { value: { product_id: string|null, product_other: string|null, company: string, phone: string, quantity: number, license_codes: string[], note: string|null } } | { error: string }`
- Produces: `isLegacyOrder(order: { payment_type?: string|null }) -> boolean`
- Produces: `LEGACY_PREFIX = "LEGACY-"`

- [ ] **Step 1: Tulis tes gagal** — `legacy-claims.test.mjs` (murni, tanpa DB):
  - sah: `{ product_id: "pos", company: "Toko A", phone: "0812-3456-7890", quantity: 2, license_codes: ["ab12-cd34-ef56"], note: "" }` → `value.phone === "081234567890"`, `value.license_codes` = `[normalizeLicenseCode("ab12-cd34-ef56")]`, `value.note === null`, `value.product_other === null`.
  - "Lainnya": `{ product_id: null, product_other: "Jadwal Sekolah", ... }` sah; `product_id` dan `product_other` dua-duanya kosong → error; dua-duanya terisi → error; `product_other` 2 karakter → error.
  - `quantity` 0, 21, `"2"` (string non-integer diterima hanya bila `Number.isInteger(Number(x))`) — 0 dan 21 error, `"2"` sah jadi 2.
  - kode kosong `[]` → error; 3 kode dengan `quantity: 2` → error; kode kembar setelah normalisasi → error; kode tidak sah → error berisi pesan `validateLicenseCode`.
  - phone 9 digit → error; 16 digit → error. company 1 karakter → error. note 501 karakter → error.
  - `isLegacyOrder({ payment_type: "legacy" }) === true`, `isLegacyOrder({ payment_type: "qris" }) === false`, `isLegacyOrder({}) === false`.
- [ ] **Step 2: Jalankan** `node --test tests/legacy-claims.test.mjs` → FAIL (modul tidak ada).
- [ ] **Step 3: Implementasi** `lib/legacyClaims.mjs` sesuai Interfaces dan Global Constraints; trim semua string.
- [ ] **Step 4: Jalankan** lagi → PASS. Terapkan migrasi ke DB lokal: `node -e "import('dotenv/config').then(async()=>{const {pool}=await import('./db/pool.mjs');const fs=await import('node:fs');await pool.query(fs.readFileSync('db/migrations/007_legacy_claims.sql','utf8'));await pool.end()})"` → tanpa error; jalankan dua kali (aman diulang).
- [ ] **Step 5: Commit** `feat(legacy): tabel klaim dan validasi`.

### Task 2: Rute pelanggan (kirim + lihat klaim)

**Files:**
- Create: `app/server/lib/legacyClaimRoutes.mjs`
- Modify: `app/server/tests/fixtures.mjs` — tambah `createProduct()` (INSERT `products (id, name, price)` = `('lictest-product','Produk Uji',1000) ON CONFLICT DO NOTHING`, kembalikan id) dan `cleanupFixtures` menghapus `legacy_claims` milik user `lictest-%` sebelum users, lalu produk `lictest-product` setelah orders.
- Test: `app/server/tests/legacy-claims-api.test.mjs`

**Interfaces:**
- Consumes: `validateClaim`, `createRateLimiter` (lib/license.mjs)
- Produces: `registerLegacyClaimRoutes(app, { authMiddleware, queryOne, queryAll, pool, notifyAdminLegacyClaim })` — mendaftarkan semua 5 rute di spec (Task 3 menambah rute admin ke fungsi yang sama).
- Produces: `notifyAdminLegacyClaim({ customerName, productName })` di `lib/email.mjs` (pola sama dengan `notifyAdminLicenseRequest`, subjek `Klaim pelanggan lama — <produk>`).

- [ ] **Step 1: Tulis tes gagal** (server express pada port acak seperti `license-api.test.mjs`, notifikasi palsu dikumpulkan ke array):
  - tanpa token → 401.
  - klaim sah → 201 `{ status: "pending" }`, satu notifikasi tercatat, baris DB `license_codes` berupa array.
  - klaim pending kedua untuk produk sama → 409; untuk "Lainnya" dengan nama beda huruf besar/kecil → 409.
  - `product_id: "tidak-ada"` → 400.
  - notifikasi yang melempar error → tetap 201.
  - `GET /api/my/legacy-claims` hanya berisi klaim milik pengguna, dengan `product_name` (nama produk atau `product_other`); `admin_note` hanya ada bila `rejected`.
- [ ] **Step 2: Jalankan** `node --test tests/legacy-claims-api.test.mjs` → FAIL.
- [ ] **Step 3: Implementasi** rute `POST /api/legacy-claims` dan `GET /api/my/legacy-claims`; rate limit 5/jam per user (429); cek produk ada sebelum INSERT; cek duplikat pending dengan `lower(product_other)`; notifikasi dibungkus `Promise.resolve(...).catch(log)`.
- [ ] **Step 4: Jalankan** → PASS.
- [ ] **Step 5: Commit** `feat(legacy): pelanggan mengirim klaim`.

### Task 3: Rute admin (daftar, setujui, tolak) + blokir aksi pesanan legacy

**Files:**
- Modify: `app/server/lib/legacyClaimRoutes.mjs`
- Modify: `app/server/index.mjs` — import & panggil `registerLegacyClaimRoutes` di dekat `registerLicenseRoutes`; di `POST /api/admin/orders/:orderId/action` setelah pesanan ditemukan: `if (isLegacyOrder(order)) return res.status(409).json({ error: "Pesanan pelanggan lama tidak terhubung ke Midtrans" })`.
- Test: `app/server/tests/legacy-claims-api.test.mjs`

**Interfaces:**
- Produces: `GET /api/admin/legacy-claims?status=pending|approved|rejected|all` → array `{ id, status, company, phone, quantity, license_codes, note, admin_note, product_id, product_name, product_other, customer_name, customer_email, order_id (string order_id pesanan atau null), created_at }`.
- Produces: `PUT /api/admin/legacy-claims/:id/approve` body `{ product_id, quantity }` → 200 `{ order_id }`.
- Produces: `PUT /api/admin/legacy-claims/:id/reject` body `{ reason }` → 200 `{ status: "rejected" }`.

- [ ] **Step 1: Tulis tes gagal:**
  - user biasa ke rute admin → 403.
  - setujui klaim 2 kode, `quantity: 3` → 200; pesanan `LEGACY-…` ada dengan `transaction_status='settlement'`, `payment_type='legacy'`, `total_amount=0`, `user_id` pemilik; item `quantity=3`, `price=0`, `product_name` = nama produk; 2 baris `license_requests` `pending` untuk item itu; klaim `approved` dengan `order_id`.
  - setujui lagi → 409.
  - klaim "Lainnya" disetujui tanpa `product_id` → 400; `quantity` 1 padahal 2 kode → 400; `product_id` tidak ada → 400.
  - id `abc` → 404; id angka tidak ada → 404.
  - dua persetujuan bersamaan (`Promise.all`) → tepat satu 200 dan satu 409; hanya satu pesanan LEGACY.
  - tolak tanpa alasan → 400; tolak → 200; lalu pelanggan bisa POST klaim baru produk sama → 201.
  - `isLegacyOrder` sudah diuji di Task 1; blokir di index.mjs diperiksa manual di Task 6.
  - `cleanupFixtures` juga menghapus `orders` berawalan `LEGACY-` milik user `lictest-%` (hapus `legacy_claims` dulu karena FK `order_id`).
- [ ] **Step 2: Jalankan** → FAIL.
- [ ] **Step 3: Implementasi.** Persetujuan dalam satu transaksi: `SELECT ... FROM legacy_claims WHERE id=$1 FOR UPDATE`; status ≠ pending → ROLLBACK 409; validasi produk & quantity ≥ jumlah kode; INSERT customers (nama dari users, email users, phone klaim); INSERT orders (`order_id = LEGACY_PREFIX + Date.now() + '-' + id` agar unik); INSERT order_items; INSERT license_requests per kode; UPDATE klaim. Penolakan: `UPDATE ... WHERE id=$1 AND status='pending' RETURNING id` (tidak ada → 409 bila klaim ada, 404 bila tidak).
- [ ] **Step 4: Jalankan** file tes → PASS, lalu `npm test` → semua PASS.
- [ ] **Step 5: Commit** `feat(legacy): admin menyetujui atau menolak klaim`.

### Task 4: Halaman pelanggan `/klaim-lisensi`

**Files:**
- Create: `app/src/pages/ClaimLicensePage.tsx`
- Modify: `app/src/App.tsx` — `<Route path="/klaim-lisensi" element={<ClaimLicensePage />} />`

**Interfaces:**
- Consumes: `POST /api/legacy-claims`, `GET /api/my/legacy-claims`, `GET /api/products`, `useAuth`, `authHeaders`.

- [ ] **Step 1:** Belum login → `<Navigate to="/login" replace state={{ from: "/klaim-lisensi" }} />` (pola MyOrdersPage).
- [ ] **Step 2:** Form sesuai spec: Select produk (katalog + opsi "Lainnya" yang memunculkan Input nama aplikasi), Input perusahaan, Input WA, Input jumlah (1–20), daftar Input kode lisensi dengan tombol "Tambah kode" (maks = jumlah) dan hapus, Textarea catatan. Kirim → toast sukses, reset form, muat ulang daftar; error server tampil sebagai toast.
- [ ] **Step 3:** Daftar "Klaim Anda": status *Sedang diperiksa* / *Disetujui* (tautan ke `/akun/pesanan`) / *Ditolak* + `admin_note`.
- [ ] **Step 4:** `cd app && npx tsc -b` → tanpa error.
- [ ] **Step 5: Commit** `feat(legacy): halaman klaim lisensi pelanggan lama`.

### Task 5: Panel admin + label pesanan + dashboard

**Files:**
- Create: `app/src/pages/admin/LegacyClaimsPanel.tsx`
- Modify: `app/src/pages/admin/LicenseRequestsPage.tsx` — `Tabs` (ui/tabs) dengan "Permintaan nomor" (isi lama) dan "Klaim pelanggan lama" (panel baru, lencana jumlah pending).
- Modify: `app/src/pages/MyOrdersPage.tsx` — bila `payment_type === "legacy"`: Badge "Pelanggan lama" menggantikan badge status, sembunyikan baris Total.
- Modify: `app/src/pages/admin/OrdersPage.tsx` — Badge "Pelanggan lama"; sembunyikan tombol aksi untuk pesanan legacy.
- Modify: `app/src/pages/admin/DashboardPage.tsx` — `const orders = all.filter(o => o.payment_type !== "legacy")` sebelum semua hitungan.

- [ ] **Step 1:** Panel: filter status (pending/approved/rejected/all), kartu per klaim, tombol Setujui → Dialog (Select produk, bawaan `product_id` klaim; Input jumlah, bawaan `quantity`) → PUT approve → toast "Disetujui — permintaan lisensi siap di tab Permintaan nomor"; tombol Tolak → Dialog alasan → PUT reject.
- [ ] **Step 2:** Perubahan label/dashboard di atas.
- [ ] **Step 3:** `npx tsc -b` → tanpa error.
- [ ] **Step 4: Commit** `feat(legacy): panel admin dan label pesanan lama`.

### Task 6: Verifikasi ujung ke ujung (lokal)

- [ ] **Step 1:** `npm test` (server) → semua PASS; `npx tsc -b` → bersih.
- [ ] **Step 2:** Jalankan app lokal; sebagai pelanggan buka `/klaim-lisensi` tanpa login → diarahkan ke login lalu kembali; kirim klaim.
- [ ] **Step 3:** Sebagai admin setujui di tab Klaim; pastikan permintaan muncul di tab Permintaan nomor, Generate tampil; pesanan LEGACY tampil di Pesanan Saya berlabel "Pelanggan lama"; dashboard tidak menghitungnya; aksi pesanan admin untuk LEGACY → 409.
- [ ] **Step 4:** Pemindaian rahasia bersih; commit perbaikan bila ada.
