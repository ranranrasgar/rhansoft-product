-- Hubungkan pesanan ke akun login (users) agar pelanggan bisa melihat dan membayar ulang pesanannya.
DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL THEN
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);

    -- Pesanan lama: cocokkan lewat email pelanggan
    UPDATE orders o
       SET user_id = u.id
      FROM customers c
      JOIN users u ON lower(u.email) = lower(c.email)
     WHERE o.customer_id = c.id AND o.user_id IS NULL;
  END IF;
END $$;
