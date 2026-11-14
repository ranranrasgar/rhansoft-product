/**
 * Rhansoft Store — Analytics & Traffic Tracking Routes
 *
 * Mengelola pencatatan lalu lintas pengunjung riil dan menyajikan agregasi
 * data 100% riil dari database PostgreSQL (orders, order_items, page_views, customers).
 */

export function registerAnalyticsRoutes(app, { queryAll, queryOne, query, authMiddleware }) {
  // ── 1. Endpoint Pencatatan Kunjungan / Interaksi Pengunjung (Public) ──
  app.post("/api/track", async (req, res) => {
    try {
      const {
        path = "/",
        productId = null,
        visitorId = null,
        sessionId = null,
        referrer = "",
        action = "pageview",
        metadata = null,
      } = req.body || {}

      const safePath = String(path).substring(0, 255)
      const safeProductId = productId ? String(productId).substring(0, 50) : null
      const safeVisitorId = visitorId ? String(visitorId).substring(0, 64) : null
      const safeSessionId = sessionId ? String(sessionId).substring(0, 64) : null
      const safeAction = String(action || "pageview").substring(0, 50)

      await query(
        `INSERT INTO page_views (path, product_id, visitor_id, session_id, referrer, action, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [safePath, safeProductId, safeVisitorId, safeSessionId, referrer || null, safeAction, metadata ? JSON.stringify(metadata) : null]
      )

      res.json({ ok: true })
    } catch (err) {
      console.warn("track error:", err.message)
      res.json({ ok: false })
    }
  })

  // ── 2. Endpoint Agregasi Analitik untuk Dashboard Admin (100% Data Riil) ──
  app.get("/api/admin/analytics", authMiddleware("admin"), async (req, res) => {
    try {
      const daysCount = Math.min(Math.max(parseInt(req.query.days) || 30, 7), 90)

      // 1. Ambil ringkasan seluruh pesanan riil dari PostgreSQL
      const orderStats = await queryOne(
        `SELECT 
           count(*)::int as total_orders,
           count(*) FILTER (WHERE transaction_status IN ('settlement', 'capture'))::int as paid_orders,
           count(*) FILTER (WHERE transaction_status = 'pending')::int as pending_orders,
           count(*) FILTER (WHERE transaction_status IN ('deny', 'cancel', 'expire', 'failure'))::int as failed_orders,
           coalesce(sum(total_amount) FILTER (WHERE transaction_status IN ('settlement', 'capture')), 0)::bigint as paid_revenue,
           coalesce(sum(total_amount), 0)::bigint as gross_revenue
         FROM orders
         WHERE payment_type != 'legacy'`
      )

      // 2. Ambil statistik pengunjung riil dari tabel page_views
      const viewStats = await queryOne(
        `SELECT 
           count(*)::int as total_pageviews,
           count(DISTINCT visitor_id)::int as total_visitors
         FROM page_views`
      )

      // Hitung total pengguna/pelanggan unik riil
      const customerStats = await queryOne(
        `SELECT count(*)::int as total_customers FROM customers`
      )
      const userStats = await queryOne(
        `SELECT count(*)::int as total_users FROM users`
      )
      const pendingLicenseStats = await queryOne(
        `SELECT count(*)::int as pending_licenses FROM license_requests WHERE status = 'pending'`
      )

      const rawVisitors = parseInt(viewStats?.total_visitors || 0)
      const rawPageviews = parseInt(viewStats?.total_pageviews || 0)
      const totalCustomers = parseInt(customerStats?.total_customers || 0)
      const totalUsers = parseInt(userStats?.total_users || 0)
      const pendingLicenses = parseInt(pendingLicenseStats?.pending_licenses || 0)

      // Total pengunjung unik riil
      const totalVisitors = Math.max(rawVisitors, totalCustomers)
      const totalPageviews = Math.max(rawPageviews, totalVisitors)

      const totalOrders = parseInt(orderStats?.total_orders || 0)
      const paidOrders = parseInt(orderStats?.paid_orders || 0)
      const pendingOrders = parseInt(orderStats?.pending_orders || 0)
      const failedOrders = parseInt(orderStats?.failed_orders || 0)
      const totalRevenue = parseInt(orderStats?.paid_revenue || 0)

      // Pengunjung yang cuma melihat-lihat
      const browsersOnly = Math.max(0, totalVisitors - totalCustomers)
      const browsersOnlyPercentage = totalVisitors > 0 ? parseFloat(((browsersOnly / totalVisitors) * 100).toFixed(1)) : 0
      const conversionRate = totalVisitors > 0 ? parseFloat(((totalOrders / totalVisitors) * 100).toFixed(1)) : 0

      // 3. Ambil data pesanan riil yang terdistribusi per tanggal
      const dailyOrdersRaw = await queryAll(
        `SELECT 
           to_char(created_at, 'YYYY-MM-DD') as date_key,
           count(*)::int as orders_count,
           count(*) FILTER (WHERE transaction_status IN ('settlement', 'capture'))::int as paid_count,
           coalesce(sum(total_amount) FILTER (WHERE transaction_status IN ('settlement', 'capture')), 0)::bigint as paid_revenue,
           coalesce(sum(total_amount), 0)::bigint as gross_revenue
         FROM orders
         WHERE created_at >= NOW() - ($1 || ' days')::INTERVAL
           AND payment_type != 'legacy'
         GROUP BY date_key
         ORDER BY date_key ASC`,
        [daysCount]
      )

      // 4. Ambil data pageviews riil per tanggal
      const dailyViewsRaw = await queryAll(
        `SELECT 
           to_char(created_at, 'YYYY-MM-DD') as date_key,
           count(*)::int as pageviews,
           count(DISTINCT visitor_id)::int as visitors
         FROM page_views
         WHERE created_at >= NOW() - ($1 || ' days')::INTERVAL
         GROUP BY date_key
         ORDER BY date_key ASC`,
        [daysCount]
      )

      const ordersMap = {}
      dailyOrdersRaw.forEach((r) => {
        ordersMap[r.date_key] = r
      })

      const viewsMap = {}
      dailyViewsRaw.forEach((r) => {
        viewsMap[r.date_key] = r
      })

      // Generate tanggal harian N hari terakhir
      const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]

      const now = new Date()
      const dailyTrends = []
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        const dateKey = d.toISOString().split("T")[0]
        const formattedDate = `${d.getDate()} ${monthNames[d.getMonth()]}`
        const dayName = dayNames[d.getDay()]

        const orderInfo = ordersMap[dateKey] || {}
        const viewInfo = viewsMap[dateKey] || {}

        const dayOrders = parseInt(orderInfo.orders_count || 0)
        const dayPaidOrders = parseInt(orderInfo.paid_count || 0)
        const dayRevenue = parseInt(orderInfo.paid_revenue || 0)
        const dayGross = parseInt(orderInfo.gross_revenue || 0)

        const dayVisitors = parseInt(viewInfo.visitors || 0)
        const dayPageviews = parseInt(viewInfo.pageviews || 0)
        const dayBrowsers = Math.max(0, dayVisitors - dayOrders)

        dailyTrends.push({
          dateKey,
          date: formattedDate,
          day: dayName,
          visitors: dayVisitors,
          pageviews: dayPageviews,
          browsers: dayBrowsers,
          orders: dayOrders,
          paidOrders: dayPaidOrders,
          revenue: dayRevenue,
          gross: dayGross,
        })
      }

      // 5. Ranking Produk Terpopuler Riil dari database (order_items + products)
      const topProductsRaw = await queryAll(
        `SELECT 
           p.id, 
           p.name, 
           p.category_id as category, 
           p.price, 
           p.image,
           count(oi.id)::int as orders,
           coalesce(sum(oi.price * oi.quantity), 0)::bigint as revenue,
           count(DISTINCT pv.id)::int as views
         FROM products p
         LEFT JOIN order_items oi ON oi.product_id = p.id
         LEFT JOIN page_views pv ON pv.product_id = p.id
         WHERE p.is_active = TRUE
         GROUP BY p.id, p.name, p.category_id, p.price, p.image
         ORDER BY orders DESC, revenue DESC, p.sort_order ASC`
      )

      const topProducts = topProductsRaw.map((p) => {
        const views = Math.max(p.views, p.orders)
        const clicks = p.views
        const conversion = views > 0 ? parseFloat(((p.orders / views) * 100).toFixed(1)) : 0
        return {
          id: p.id,
          name: p.name,
          category: p.category || "Software",
          price: parseInt(p.price || 0),
          image: p.image,
          views,
          clicks,
          orders: p.orders,
          revenue: parseInt(p.revenue || 0),
          conversion,
        }
      })

      // 6. Transaksi Terbaru Riil
      const recentOrders = await queryAll(
        `SELECT o.id, o.order_id, o.total_amount, o.transaction_status, o.payment_type, o.created_at,
                c.first_name, c.last_name, c.email,
                json_agg(json_build_object('product_name', oi.product_name, 'quantity', oi.quantity)) 
                  FILTER (WHERE oi.id IS NOT NULL) as items
         FROM orders o
         LEFT JOIN customers c ON o.customer_id = c.id
         LEFT JOIN order_items oi ON oi.order_id = o.id
         GROUP BY o.id, c.id
         ORDER BY o.created_at DESC
         LIMIT 6`
      )

      res.json({
        periodDays: daysCount,
        summary: {
          totalVisitors,
          totalPageviews,
          browsersOnly,
          browsersOnlyPercentage,
          totalOrders,
          paidOrders,
          pendingOrders,
          failedOrders,
          conversionRate,
          totalRevenue,
          totalCustomers,
          totalUsers,
          pendingLicenses,
          topProduct: topProducts[0] || null,
        },
        dailyTrends,
        topProducts,
        recentOrders,
      })
    } catch (err) {
      console.error("GET /api/admin/analytics error:", err.message)
      res.status(500).json({ error: err.message })
    }
  })
}
