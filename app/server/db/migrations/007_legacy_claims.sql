-- Klaim pelanggan lama (beli lewat WA sebelum platform ada), diverifikasi admin.
-- Saat disetujui dibuat pesanan LEGACY- Rp 0; order_id menunjuk ke pesanan itu.
-- Aman diulang.

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
CREATE INDEX IF NOT EXISTS idx_legacy_claims_user ON legacy_claims(user_id);
