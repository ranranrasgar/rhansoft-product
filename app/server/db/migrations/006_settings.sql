-- Pengaturan sistem yang diubah admin (mis. key 'shipping' untuk ongkos kirim). Aman diulang.
CREATE TABLE IF NOT EXISTS settings (
    key         VARCHAR(50) PRIMARY KEY,
    value       JSONB NOT NULL,
    updated_by  INTEGER REFERENCES users(id),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);
