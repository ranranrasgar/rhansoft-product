# Dokumentasi — PostgreSQL + Backend + Midtrans Integration

**Tanggal:** 26 Oktober 2026  
**Database:** PostgreSQL 14.5 (Laragon) — `rhansoft_store`  
**Backend:** Express.js + node-postgres (pg)  
**Frontend:** React + Vite (fetch API dari backend)

---

## 1. Arsitektur

```
┌─────────────────┐     /api/* (proxy)     ┌──────────────────┐
│  React Frontend  │ ──────────────────────▶│  Express Backend  │
│  (Vite :5173)    │◀──────────────────────│  (:3001)          │
└─────────────────┘     JSON response      └────────┬─────────┘
                                                           │
                                            ┌──────────────┼──────────────┐
                                            ▼              ▼              ▼
                                    ┌──────────────┐ ┌───────────┐ ┌──────────┐
                                    │ PostgreSQL   │ │ Midtrans  │ │ Webhook  │
                                    │ rhansoft_store│ │ Snap API  │ │ Handler  │
                                    └──────────────┘ └───────────┘ └──────────┘
```

---

## 2. Database PostgreSQL (Laragon)

### Konfigurasi
- **Host:** localhost
- **Port:** 5432
- **Database:** `rhansoft_store`
- **User:** `postgres` (password kosong)
- **Binary:** `C:\laragon\bin\postgresql\postgresql-14.5-1\bin\`

### Tabel

| Tabel | Deskripsi |
|-------|-----------|
| `categories` | 8 kategori (POS, Accounting, Healthcare, Hospitality, Billing, Communication, Web Based, Mobile App) |
| `products` | 24 produk dengan gallery JSONB, harga, rating, badge, dll |
| `product_specs` | Spesifikasi teknis per produk (label, value) |
| `product_highlights` | Highlight fitur per produk |
| `customers` | Data customer (nama, email, phone, alamat) |
| `orders` | Transaksi pesanan (order_id, status, snap_token, dll) |
| `order_items` | Item per pesanan (product, qty, price) |
| `payment_notifications` | Log webhook dari Midtrans |
| `promos` | Data promosi |
| `hero_slides` | Slide carousel homepage |

### Schema SQL
File: `server/db/schema.sql`

### Seed Data
File: `server/db/seed.mjs` + `server/db/seed-data.json`

```bash
# Jalankan migration (buat tabel)
cd server && npm run migrate

# Jalankan seed (import data)
cd app && npm run seed
```

**Data yang di-seed:**
- 8 kategori
- 24 produk (dengan specs & highlights)
- 2 promos
- 3 hero slides

---

## 3. Backend Express (server/)

### Struktur File
```
server/
├── index.mjs          # Express server + semua API routes
├── package.json       # Backend dependencies
├── .env               # Konfigurasi DB & Midtrans
├── .env.example       # Template .env
└── db/
    ├── pool.mjs        # PostgreSQL connection pool
    ├── schema.sql      # DDL schema
    ├── seed.mjs        # Seed script
    └── seed-data.json  # Data ekstrak dari store.ts
```

### API Endpoints

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/api/health` | Health check + DB status |
| GET | `/api/categories` | List semua kategori |
| GET | `/api/products` | List semua produk (dengan specs & highlights) |
| GET | `/api/products?category=X` | Filter produk by kategori |
| GET | `/api/products/:id` | Detail 1 produk |
| GET | `/api/promos` | List promosi |
| GET | `/api/hero-slides` | List hero slides |
| POST | `/api/create-transaction` | Buat transaksi Midtrans → return Snap token |
| GET | `/api/transaction-status/:orderId` | Cek status transaksi |
| POST | `/api/webhook` | Webhook Midtrans payment notification |
| GET | `/api/orders` | List semua pesanan |

### Dependencies
- `express` — Web framework
- `pg` — PostgreSQL client (node-postgres)
- `midtrans-client` — Midtrans Snap API client
- `cors` — Cross-origin
- `dotenv` — Environment variables

---

## 4. Midtrans Integration (Real API)

### Konfigurasi
File: `server/.env`

```
MIDTRANS_MERCHANT_ID=your_merchant_id
MIDTRANS_SANDBOX_CLIENT_KEY=SB-Mid-client-xxxx
MIDTRANS_SANDBOX_SERVER_KEY=SB-Mid-server-xxxx
MIDTRANS_PRODUCTION_CLIENT_KEY=Mid-client-xxxx
MIDTRANS_PRODUCTION_SERVER_KEY=Mid-server-xxxx
MIDTRANS_ENV=sandbox
```

### Flow Checkout (Real)
1. User klik **"Bayar"** di CheckoutPage
2. Frontend POST `/api/create-transaction` dengan data customer + items + payment_method
3. Backend:
   - Insert customer ke `customers` table
   - Insert order ke `orders` table
   - Insert items ke `order_items` table
   - Panggil **Midtrans Snap API** (`snap.createTransaction()`)
   - Simpan snap_token ke `orders` table
   - Return `{ token, redirect_url }` ke frontend
4. Frontend panggil `snap.pay(token)` → buka Midtrans Snap modal
5. User bayar di Snap modal (sandbox: kartu test, VA, GoPay, QRIS, dll)
6. Midtrans kirim webhook → `/api/webhook` → update `orders.transaction_status`
7. Frontend handle result (success/pending/closed/error)

### Payment Methods (Midtrans)
| ID | Metode | Enabled Payments |
|----|--------|-----------------|
| `card` | Kartu Kredit/Debit | credit_card |
| `gopay` | GoPay | gopay |
| `shopeepay` | ShopeePay | shopeepay |
| `bank_transfer` | Transfer Bank (VA) | bca_va, bni_va, bri_va, mandiri_va, echannel |
| `qris` | QRIS | qris |

### Sandbox Test Cards
- **Visa:** `4811 1111 1111 1111` — exp `01/30` — CVV `123`
- **Mastercard:** `5211 1111 1111 1111` — exp `01/30` — CVV `123`

---

## 5. Frontend Changes

### `src/hooks/useProducts.tsx`
- **Sebelum:** Load dari `localStorage` (statis dari `store.ts`)
- **Sesudah:** Fetch dari `/api/products` (PostgreSQL via backend)
- Fallback ke `initialProducts` jika API gagal
- Loading & error states

### `src/lib/midtrans.ts`
- **Sebelum:** `requestSnapToken()` return fake token
- **Sesudah:** `requestSnapToken()` POST ke `/api/create-transaction` → real Midtrans token
- Auto-detect sandbox vs production berdasarkan hostname

### `src/pages/CheckoutPage.tsx`
- Kirim `payment_method` ke backend untuk enable specific payment

### `vite.config.ts`
- Proxy `/api/*` → `http://localhost:3001` (backend)

### `package.json` scripts
```json
{
  "dev": "vite",
  "dev:backend": "cd server && npm run dev",
  "dev:all": "concurrently \"npm run dev\" \"npm run dev:backend\"",
  "seed": "node server/db/seed.mjs"
}
```

---

## 6. Cara Menjalankan

### Prasyarat
- Laragon running (PostgreSQL aktif di port 5432)
- Database `rhansoft_store` sudah dibuat

### Step-by-step

```bash
# 1. Backend: install dependencies
cd app/server && npm install

# 2. Jalankan migration (buat tabel)
npm run migrate
# atau: psql -h localhost -U postgres -d rhansoft_store -f db/schema.sql

# 3. Jalankan seed (import 24 produk + kategori)
cd app && npm run seed

# 4. Start backend (terminal 1)
cd app/server && npm run dev

# 5. Start frontend (terminal 2)
cd app && npm run dev

# ATAU jalankan keduanya sekaligus:
cd app && npm run dev:all
```

### Akses
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001/api`
- Health check: `http://localhost:3001/api/health`
- Products API: `http://localhost:3001/api/products`

---

## 7. Verifikasi

- ✅ PostgreSQL connected (14.5 via Laragon)
- ✅ 8 tabel berhasil dibuat
- ✅ 24 produk + 8 kategori + 2 promos + 3 hero slides di-seed
- ✅ Backend running di port 3001
- ✅ API `/api/health` → status OK, database connected
- ✅ API `/api/products` → return 24 produk dari PostgreSQL
- ✅ Frontend fetch produk dari API (bukan localStorage lagi)
- ✅ Midtrans Snap menggunakan real sandbox API (bukan fake token)
- ✅ Vite proxy `/api` → `localhost:3001`
- ✅ `tsc -b` — 0 error TypeScript
- ✅ Checkout flow: customer → order → Midtrans Snap → webhook
