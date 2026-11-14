-- Migration 011: Tabel Analitik Kunjungan dan Perilaku Pengunjung
-- Mencatat traffic pengunjung masuk, pengunjung yang melihat-lihat, klik produk, dan konversi order.

CREATE TABLE IF NOT EXISTS page_views (
    id SERIAL PRIMARY KEY,
    path VARCHAR(255) NOT NULL,
    product_id VARCHAR(50),
    visitor_id VARCHAR(64),
    session_id VARCHAR(64),
    referrer TEXT,
    action VARCHAR(50) DEFAULT 'pageview', -- 'pageview', 'product_view', 'product_click', 'add_to_cart', 'order_start', 'order_paid'
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_product_id ON page_views(product_id);
CREATE INDEX IF NOT EXISTS idx_page_views_action ON page_views(action);
CREATE INDEX IF NOT EXISTS idx_page_views_visitor ON page_views(visitor_id);
