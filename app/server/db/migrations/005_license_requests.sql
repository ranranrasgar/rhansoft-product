-- Permintaan nomor registrasi lisensi dari pelanggan (diterbitkan manual oleh admin).
-- Nomor registrasi dibuat di luar sistem ini; tabel hanya menyimpan permintaan dan hasilnya.
-- Aman diulang.

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

-- Satu kode lisensi hanya boleh aktif sekali per item pesanan; yang ditolak boleh diulang
CREATE UNIQUE INDEX IF NOT EXISTS uq_license_requests_code
    ON license_requests(order_item_id, license_code) WHERE status <> 'rejected';
