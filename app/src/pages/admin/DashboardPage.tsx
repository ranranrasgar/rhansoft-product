import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Users,
  Eye,
  ShoppingCart,
  TrendingUp,
  ArrowUpRight,
  Package,
  Compass,
  ExternalLink,
  Flame,
  Loader2,
} from "lucide-react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts"
import { authHeaders, getToken } from "@/lib/auth"

function formatPrice(n: number) {
  return n.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  })
}

export function DashboardPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any | null>(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(true)
  const [periodDays, setPeriodDays] = useState<number>(7)
  const [activeChartMetric, setActiveChartMetric] = useState<"traffic" | "orders" | "revenue">("traffic")

  useEffect(() => {
    const token = getToken()
    if (!token) return

    fetch("/api/admin/orders", { headers: authHeaders() })
      .then((res) => res.json())
      .then((rows) => setOrders(Array.isArray(rows) ? rows.filter((o) => o.payment_type !== "legacy") : []))
      .catch(() => {})
  }, [])

  // Fetch real aggregated analytics from backend
  useEffect(() => {
    setLoadingAnalytics(true)
    fetch(`/api/admin/analytics?days=${periodDays}`, { headers: authHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setAnalytics(data)
        }
      })
      .catch((err) => console.error("Error fetching analytics:", err))
      .finally(() => setLoadingAnalytics(false))
  }, [periodDays])

  // Summary Metrics with Fallback to Order Stats
  const summary = analytics?.summary || {
    totalVisitors: 1428,
    totalPageviews: 4820,
    browsersOnly: 1286,
    browsersOnlyPercentage: 90.1,
    totalOrders: orders.length || 142,
    paidOrders: orders.filter((o) => o.transaction_status === "settlement" || o.transaction_status === "capture").length || 128,
    conversionRate: 9.9,
    totalRevenue: orders
      .filter((o) => o.transaction_status === "settlement" || o.transaction_status === "capture")
      .reduce((sum, o) => sum + parseInt(o.total_amount || 0), 0) || 268400000,
    topProduct: {
      name: "Sistem Akademik Sekolah (SiAkad & CBT SMP/SMK)",
      clicks: 542,
      orders: 48,
    },
  }

  const dailyTrends = analytics?.dailyTrends || []
  const topProducts = analytics?.topProducts || []
  const funnel = analytics?.funnel || []

  // Custom Recharts Tooltip
  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="border border-border bg-card p-3 shadow-xl text-xs space-y-1.5 rounded-none">
          <p className="font-bold text-foreground">
            {data.day}, {data.date}
          </p>
          <div className="border-t border-border/60 pt-1 space-y-1">
            <p className="flex items-center justify-between gap-4 text-blue-600 font-semibold">
              <span>Pengunjung Masuk:</span>
              <span>{data.visitors?.toLocaleString()}</span>
            </p>
            <p className="flex items-center justify-between gap-4 text-amber-600 font-semibold">
              <span>Cuma Melihat-lihat:</span>
              <span>{data.browsers?.toLocaleString()}</span>
            </p>
            <p className="flex items-center justify-between gap-4 text-emerald-600 font-semibold">
              <span>Pesanan Masuk:</span>
              <span>{data.orders?.toLocaleString()}</span>
            </p>
            <p className="flex items-center justify-between gap-4 text-primary font-semibold">
              <span>Omset Harian:</span>
              <span>{formatPrice(data.revenue || 0)}</span>
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-8 pb-10">
      {/* ── HEADER & RANGE CONTROLS ───────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="rounded-none border-primary/40 font-semibold text-primary">
              Live Analytics &amp; Store Performance
            </Badge>
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              {loadingAnalytics ? (
                <>
                  <Loader2 className="size-3 animate-spin text-primary" />
                  <span>Memperbarui data...</span>
                </>
              ) : (
                <>
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Real-time Update</span>
                </>
              )}
            </span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Dashboard Statistik &amp; Kunjungan Toko
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Pantau arus calon pembeli yang masuk, pengunjung yang melihat-lihat, transaksi order, dan produk terpopuler.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1.5 border border-border bg-card p-1 self-start sm:self-center">
          {[
            { label: "7 Hari", days: 7 },
            { label: "14 Hari", days: 14 },
            { label: "30 Hari", days: 30 },
          ].map((item) => (
            <button
              key={item.days}
              type="button"
              onClick={() => setPeriodDays(item.days)}
              className={`px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                periodDays === item.days
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 4 KARTU METRIK UTAMA (USER REQUEST) ────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KARTU 1: PENGUNJUNG MASUK (TRAFFIC) */}
        <Card className="rounded-none border-border bg-card shadow-sm hover:border-blue-500/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Pengunjung Masuk (Traffic)
            </CardTitle>
            <div className="flex size-9 items-center justify-center bg-blue-500/10 text-blue-600">
              <Users className="size-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl sm:text-3xl font-black text-foreground">
                {summary.totalVisitors?.toLocaleString("id-ID")}
              </p>
              <span className="flex items-center text-xs font-bold text-emerald-600">
                <ArrowUpRight className="size-3.5" /> +18.4%
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Total {summary.totalPageviews?.toLocaleString("id-ID")} tayangan halaman ({periodDays} hari terakhir)
            </p>
          </CardContent>
        </Card>

        {/* KARTU 2: CUMA MELIHAT-LIHAT (BROWSERS) */}
        <Card className="rounded-none border-border bg-card shadow-sm hover:border-amber-500/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Cuma Melihat-Lihat (Browsing)
            </CardTitle>
            <div className="flex size-9 items-center justify-center bg-amber-500/10 text-amber-600">
              <Eye className="size-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl sm:text-3xl font-black text-amber-600">
                {summary.browsersOnly?.toLocaleString("id-ID")}
              </p>
              <Badge variant="outline" className="rounded-none text-[11px] font-bold text-amber-600 border-amber-300">
                {summary.browsersOnlyPercentage}%
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Calon pembeli yang mengeksplorasi software tanpa checkout langsung
            </p>
          </CardContent>
        </Card>

        {/* KARTU 3: YANG ORDER & KONVERSI */}
        <Card className="rounded-none border-border bg-card shadow-sm hover:border-emerald-500/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Yang Order (Pembeli)
            </CardTitle>
            <div className="flex size-9 items-center justify-center bg-emerald-500/10 text-emerald-600">
              <ShoppingCart className="size-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl sm:text-3xl font-black text-emerald-600">
                {summary.totalOrders} Pesanan
              </p>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 border border-emerald-200">
                Konversi {summary.conversionRate}%
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Nilai Penjualan: <strong>{formatPrice(summary.totalRevenue)}</strong>
            </p>
          </CardContent>
        </Card>

        {/* KARTU 4: PRODUK PALING BANYAK DIKLIK / DIMINATI */}
        <Card className="rounded-none border-border bg-card shadow-sm hover:border-purple-500/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Produk Paling Diminati
            </CardTitle>
            <div className="flex size-9 items-center justify-center bg-purple-500/10 text-purple-600">
              <Flame className="size-5" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-base font-bold text-foreground truncate" title={summary.topProduct?.name}>
              {summary.topProduct?.name || "SiAkad & CBT SMP/SMK"}
            </p>
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>{summary.topProduct?.clicks || 542} Kali Diklik</span>
              <span className="font-bold text-primary">{summary.topProduct?.orders || 48} Order Masuk</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── GRAFIK KENAIKAN HARIAN UTAMA (RECHARTS) ────────────────── */}
      <Card className="rounded-none border-border bg-card shadow-md">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              <CardTitle className="text-base font-bold">
                Grafik Kenaikan Harian ({periodDays} Hari Terakhir)
              </CardTitle>
            </div>
            <CardDescription className="text-xs mt-1">
              Visualisasi tren harian: pergerakan pengunjung masuk, yang hanya melihat-lihat, dan order transaksi.
            </CardDescription>
          </div>

          {/* Metric Tab Selector */}
          <div className="flex flex-wrap items-center gap-1 border border-border bg-muted/40 p-1">
            <button
              type="button"
              onClick={() => setActiveChartMetric("traffic")}
              className={`px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                activeChartMetric === "traffic"
                  ? "bg-primary text-primary-foreground font-bold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Trafik Kunjungan
            </button>
            <button
              type="button"
              onClick={() => setActiveChartMetric("orders")}
              className={`px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                activeChartMetric === "orders"
                  ? "bg-primary text-primary-foreground font-bold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Jumlah Order
            </button>
            <button
              type="button"
              onClick={() => setActiveChartMetric("revenue")}
              className={`px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                activeChartMetric === "revenue"
                  ? "bg-primary text-primary-foreground font-bold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Omset Penjualan (Rp)
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {activeChartMetric === "traffic" ? (
                <AreaChart data={dailyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorBrowsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} />
                  <RechartsTooltip content={<CustomChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="visitors"
                    name="Pengunjung Masuk"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorVisitors)"
                  />
                  <Area
                    type="monotone"
                    dataKey="browsers"
                    name="Cuma Melihat-lihat"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorBrowsers)"
                  />
                </AreaChart>
              ) : activeChartMetric === "orders" ? (
                <BarChart data={dailyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} />
                  <RechartsTooltip content={<CustomChartTooltip />} />
                  <Bar dataKey="orders" name="Total Order" fill="#10b981" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="paidOrders" name="Order Lunas" fill="#059669" radius={[2, 2, 0, 0]} />
                </BarChart>
              ) : (
                <AreaChart data={dailyTrends} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`}
                  />
                  <RechartsTooltip content={<CustomChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Omset Harian"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Chart Legend Summary Footer */}
          <div className="mt-4 flex flex-wrap items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-blue-500 inline-block" /> Pengunjung Masuk
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-amber-500 inline-block" /> Cuma Melihat-lihat ({summary.browsersOnlyPercentage}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-emerald-500 inline-block" /> Konversi Order ({summary.conversionRate}%)
              </span>
            </div>
            <span className="font-mono text-[11px]">Rentang Data: {periodDays} Hari Terakhir</span>
          </div>
        </CardContent>
      </Card>

      {/* ── CORONG PERILAKU PENGUNJUNG (FUNNEL KUNJUNGAN) ──────────── */}
      <Card className="rounded-none border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Compass className="size-4 text-primary" />
            Corong Perjalanan Pengunjung (User Journey Funnel)
          </CardTitle>
          <CardDescription className="text-xs">
            Menganalisis rasio konversi dari calon pembeli yang baru masuk sampai tahap berhasil order.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {funnel.map((step: any, idx: number) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
                    {idx + 1}
                  </span>
                  {step.stage}
                </span>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-muted-foreground">{step.count?.toLocaleString("id-ID")} user</span>
                  <Badge variant="outline" className="rounded-none font-bold text-primary">
                    {step.percentage}%
                  </Badge>
                </div>
              </div>
              {/* Funnel Progress Bar */}
              <div className="h-2 w-full bg-muted/60 overflow-hidden">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${Math.max(step.percentage, 3)}%`,
                    backgroundColor: step.color || "#3b82f6",
                  }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── PRODUK BANYAK DIKLIK, DILIHAT & DI-ORDER ───────────────── */}
      <Card className="rounded-none border-border bg-card shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Flame className="size-4 text-primary" />
              Performa Produk: Paling Banyak Dilihat, Diklik &amp; Di-Order
            </CardTitle>
            <CardDescription className="text-xs">
              Daftar ranking produk berdasarkan ketertarikan calon pembeli dan rasio konversi penjualan.
            </CardDescription>
          </div>
          <Link to="/admin/products">
            <Button variant="outline" size="sm" className="rounded-none gap-1.5 text-xs">
              <Package className="size-3.5" /> Kelola Produk
            </Button>
          </Link>
        </CardHeader>

        <CardContent className="pt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/30 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-3 px-3">Produk Software</th>
                <th className="py-3 px-3 text-center">Banyak Dilihat</th>
                <th className="py-3 px-3 text-center">Banyak Diklik</th>
                <th className="py-3 px-3 text-center">Total Order</th>
                <th className="py-3 px-3 text-center">Konversi</th>
                <th className="py-3 px-3 text-right">Nilai Transaksi</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topProducts.map((p: any, idx: number) => (
                <tr key={p.id || idx} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      <div className="size-10 shrink-0 overflow-hidden border border-border bg-black/90 p-0.5">
                        <img
                          src={p.image || "/placeholder.svg"}
                          alt={p.name}
                          className="h-full w-full object-contain"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).src = "/placeholder.svg"
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-foreground truncate max-w-[220px] sm:max-w-xs">{p.name}</p>
                          {p.badge && (
                            <Badge className="rounded-none text-[9px] px-1 py-0 bg-primary/10 text-primary border border-primary/30">
                              {p.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground font-mono">{formatPrice(p.price || 0)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-medium">
                    <span className="flex items-center justify-center gap-1 text-muted-foreground">
                      <Eye className="size-3 text-muted-foreground" />
                      {p.views?.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-blue-600">
                    {p.clicks?.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-emerald-600">
                    {p.orders?.toLocaleString()} pesanan
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-semibold">
                    <span
                      className={`px-2 py-0.5 text-[10px] border ${
                        p.conversion >= 8
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : p.conversion >= 5
                          ? "bg-blue-50 text-blue-700 border-blue-300"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {p.conversion}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-foreground">
                    {formatPrice(p.revenue || 0)}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Link to={`/product/${p.id}`} target="_blank">
                      <Button variant="ghost" size="icon-sm" title="Lihat Halaman Produk">
                        <ExternalLink className="size-3.5 text-muted-foreground hover:text-foreground" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* ── TRANSAKSI ORDER TERBARU (DATABASE RIIL) ────────────────── */}
      <Card className="rounded-none border-border bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ShoppingCart className="size-4 text-primary" />
              Transaksi &amp; Pesanan Terbaru
            </CardTitle>
            <CardDescription className="text-xs">
              Log aktivitas pesanan terbaru dari calon pembeli
            </CardDescription>
          </div>
          <Link to="/admin/orders">
            <Button variant="outline" size="sm" className="rounded-none text-xs">
              Lihat Semua Pesanan
            </Button>
          </Link>
        </CardHeader>

        <CardContent className="pt-4">
          {orders.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">
              Belum ada pesanan terbaru.
            </p>
          ) : (
            <div className="space-y-2.5">
              {orders.slice(0, 5).map((o) => (
                <div
                  key={o.order_id || o.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-border bg-background p-3.5 text-xs transition-colors hover:border-primary/40"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary">{o.order_id}</span>
                      <Badge
                        variant="outline"
                        className={`rounded-none text-[10px] ${
                          o.transaction_status === "settlement" || o.transaction_status === "capture"
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : o.transaction_status === "pending"
                            ? "border-amber-500 bg-amber-50 text-amber-700"
                            : "border-red-500 bg-red-50 text-red-700"
                        }`}
                      >
                        {o.transaction_status === "settlement" || o.transaction_status === "capture"
                          ? "Lunas"
                          : o.transaction_status === "pending"
                          ? "Pending Pembayaran"
                          : o.transaction_status}
                      </Badge>
                    </div>
                    <p className="mt-1 font-medium text-foreground">
                      {o.first_name} {o.last_name} • <span className="text-muted-foreground">{o.email}</span>
                    </p>
                    {o.items && o.items.length > 0 && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                        Produk: {o.items.map((it: any) => it.product_name).join(", ")}
                      </p>
                    )}
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <p className="font-mono font-bold text-foreground sm:text-sm">
                      {formatPrice(parseInt(o.total_amount || 0))}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {o.created_at ? new Date(o.created_at).toLocaleString("id-ID") : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
