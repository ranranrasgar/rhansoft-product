import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Users,
  Eye,
  ShoppingCart,
  Plus,
  Key,
  ChevronRight,
  AlertCircle,
  Clock,
  CheckCircle2,
  DollarSign,
  Loader2,
} from "lucide-react"
import {
  ResponsiveContainer,
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
  const [analytics, setAnalytics] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [periodDays, setPeriodDays] = useState<number>(30)

  useEffect(() => {
    const token = getToken()
    if (!token) return

    setLoading(true)
    fetch(`/api/admin/analytics?days=${periodDays}`, { headers: authHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setAnalytics(data)
        }
      })
      .catch((err) => console.error("Error fetching analytics:", err))
      .finally(() => setLoading(false))
  }, [periodDays])

  const summary = analytics?.summary || {
    totalVisitors: 0,
    totalPageviews: 0,
    browsersOnly: 0,
    browsersOnlyPercentage: 0,
    totalOrders: 0,
    paidOrders: 0,
    pendingOrders: 0,
    failedOrders: 0,
    conversionRate: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    totalUsers: 0,
    pendingLicenses: 0,
    topProduct: null,
  }

  const dailyTrends = analytics?.dailyTrends || []
  const topProducts = analytics?.topProducts || []
  const recentOrders = analytics?.recentOrders || []

  // Custom Recharts Tooltip
  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="border border-border bg-card p-3 shadow-md text-xs space-y-1.5 rounded-lg">
          <p className="font-bold text-foreground">
            {data.day}, {data.date}
          </p>
          <div className="border-t border-border/60 pt-1 space-y-1">
            <p className="flex items-center justify-between gap-4 text-emerald-600 font-semibold">
              <span>Pesanan Masuk:</span>
              <span>{data.orders} pesanan</span>
            </p>
            <p className="flex items-center justify-between gap-4 text-blue-600 font-semibold">
              <span>Pengunjung:</span>
              <span>{data.visitors} user</span>
            </p>
            <p className="flex items-center justify-between gap-4 text-primary font-semibold">
              <span>Omset Lunas:</span>
              <span>{formatPrice(data.revenue || 0)}</span>
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  const todayStr = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* ── HEADER & SHORTCUTS ────────────────────────────────────── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {todayStr} · superadmin
          </p>
        </div>

        {/* Quick Action Pills inspired by Koperasi Dashboard */}
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/admin/products">
            <Button variant="outline" size="sm" className="rounded-full text-xs gap-1.5 h-8">
              <Plus className="size-3.5 text-primary" />
              Tambah Produk
            </Button>
          </Link>
          <Link to="/admin/orders">
            <Button variant="outline" size="sm" className="rounded-full text-xs gap-1.5 h-8">
              <ShoppingCart className="size-3.5 text-blue-600" />
              Pesanan ({summary.totalOrders})
            </Button>
          </Link>
          <Link to="/admin/licenses">
            <Button variant="outline" size="sm" className="rounded-full text-xs gap-1.5 h-8">
              <Key className="size-3.5 text-amber-600" />
              Lisensi {summary.pendingLicenses > 0 && `(${summary.pendingLicenses})`}
            </Button>
          </Link>
          <Link to="/admin/customers">
            <Button variant="outline" size="sm" className="rounded-full text-xs gap-1.5 h-8">
              <Users className="size-3.5 text-indigo-600" />
              Pelanggan ({summary.totalCustomers})
            </Button>
          </Link>
          {loading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
        </div>
      </div>

      {/* ── 4 KPI CARDS (100% REAL DATA) ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Omset Penjualan Riil */}
        <Card className="rounded-xl border border-border/80 bg-card shadow-sm hover:shadow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-medium text-muted-foreground">
              Total Omset Penjualan
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {formatPrice(summary.totalRevenue)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              dari <span className="font-semibold text-emerald-600">{summary.paidOrders}</span> pesanan lunas
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Total Pesanan Masuk */}
        <Card className="rounded-xl border border-border/80 bg-card shadow-sm hover:shadow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-medium text-muted-foreground">
              Total Pesanan Masuk
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <ShoppingCart className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {summary.totalOrders} Pesanan
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              <span className="text-amber-600 font-semibold">{summary.pendingOrders} pending</span>, {summary.failedOrders} batal/expire
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Pengunjung Masuk */}
        <Card className="rounded-xl border border-border/80 bg-card shadow-sm hover:shadow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-medium text-muted-foreground">
              Pengunjung Masuk (Traffic)
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Users className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {summary.totalVisitors.toLocaleString()} User
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {summary.totalPageviews.toLocaleString()} total tayangan halaman
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Cuma Melihat-lihat */}
        <Card className="rounded-xl border border-border/80 bg-card shadow-sm hover:shadow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-medium text-muted-foreground">
              Cuma Melihat-lihat
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Eye className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {summary.browsersOnly.toLocaleString()} User
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{summary.browsersOnlyPercentage}%</span> dari total pengunjung
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── MAIN CONTENT (2 COLUMNS LAYOUT) ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: CHARTS & TOP PRODUCTS (8 COLS) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Chart Arus Pesanan Harian */}
          <Card className="rounded-xl border border-border/80 bg-card shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4">
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  Arus Pesanan &amp; Penjualan Harian
                </CardTitle>
                <CardDescription className="text-xs">
                  Pergerakan jumlah pesanan masuk secara riil dalam {periodDays} hari terakhir
                </CardDescription>
              </div>

              {/* Period selector */}
              <div className="flex items-center gap-1 border border-border rounded-lg p-0.5 mt-2 sm:mt-0 self-start">
                {[
                  { label: "7 Hari", days: 7 },
                  { label: "14 Hari", days: 14 },
                  { label: "30 Hari", days: 30 },
                ].map((item) => (
                  <button
                    key={item.days}
                    type="button"
                    onClick={() => setPeriodDays(item.days)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                      periodDays === item.days
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </CardHeader>

            <CardContent>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.6} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      allowDecimals={false}
                    />
                    <RechartsTooltip content={<CustomChartTooltip />} />
                    <Bar dataKey="orders" name="Pesanan Masuk" fill="#10b981" radius={[4, 4, 0, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-center gap-6 mt-3 text-xs text-muted-foreground border-t border-border/60 pt-3">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-sm bg-emerald-500" />
                  <span>Pesanan Masuk</span>
                </div>
                <div className="text-xs">
                  Total periode ini: <strong className="text-foreground">{dailyTrends.reduce((s: number, d: any) => s + (d.orders || 0), 0)} pesanan</strong>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subgrid: Ranking Produk Dipesan & Komposisi Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Produk Paling Banyak Dipesan (100% Data Riil dari order_items) */}
            <Card className="rounded-xl border border-border/80 bg-card shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span>Produk Paling Banyak Dipesan</span>
                  <Link to="/admin/products" className="text-xs text-primary hover:underline font-normal">
                    Lihat Semua
                  </Link>
                </CardTitle>
                <CardDescription className="text-xs">
                  Peringkat produk berdasarkan data transaksi aktual
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {topProducts.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">Belum ada pesanan produk.</p>
                ) : (
                  topProducts.slice(0, 5).map((prod: any, idx: number) => (
                    <div key={prod.id} className="flex items-center justify-between gap-2 text-xs border-b border-border/50 pb-2.5 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`size-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                          idx === 0 ? "bg-amber-100 text-amber-800" : idx === 1 ? "bg-slate-200 text-slate-800" : "bg-muted text-muted-foreground"
                        }`}>
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{prod.name}</p>
                          <p className="text-[11px] text-muted-foreground">{formatPrice(prod.price)}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-emerald-600">{prod.orders} order</span>
                        <p className="text-[10px] text-muted-foreground">{formatPrice(prod.revenue)}</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Komposisi Status Pesanan */}
            <Card className="rounded-xl border border-border/80 bg-card shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span>Status Transaksi Pesanan</span>
                  <Badge variant="outline" className="text-[11px] font-normal">
                    {summary.totalOrders} Total
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Distribusi status pembayaran dari database
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-1">
                {/* Status Lunas */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <CheckCircle2 className="size-3.5 text-emerald-600" /> Lunas (Settlement)
                    </span>
                    <span className="font-bold text-emerald-600">
                      {summary.paidOrders} ({summary.totalOrders > 0 ? ((summary.paidOrders / summary.totalOrders) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${summary.totalOrders > 0 ? (summary.paidOrders / summary.totalOrders) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Status Pending */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <Clock className="size-3.5 text-amber-600" /> Menunggu Bayar (Pending)
                    </span>
                    <span className="font-bold text-amber-600">
                      {summary.pendingOrders} ({summary.totalOrders > 0 ? ((summary.pendingOrders / summary.totalOrders) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${summary.totalOrders > 0 ? (summary.pendingOrders / summary.totalOrders) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Status Expire / Batal */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <AlertCircle className="size-3.5 text-red-600" /> Batal / Expire
                    </span>
                    <span className="font-bold text-red-600">
                      {summary.failedOrders} ({summary.totalOrders > 0 ? ((summary.failedOrders / summary.totalOrders) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${summary.totalOrders > 0 ? (summary.failedOrders / summary.totalOrders) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* RIGHT COLUMN: PERLU TINDAKAN & AKTIVITAS TERAKHIR (4 COLS) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Perlu Tindakan Card inspired directly by reference image */}
          <Card className="rounded-xl border border-border/80 bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-foreground">
                Perlu Tindakan
              </CardTitle>
              <CardDescription className="text-xs">
                Aktivitas yang memerlukan respon admin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {/* Item 1: Pending Orders */}
              <Link
                to="/admin/orders"
                className="flex items-center justify-between p-3 rounded-lg border border-amber-200/80 bg-amber-50/50 hover:bg-amber-50 transition-colors text-xs group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex size-6 items-center justify-center rounded-md bg-amber-100 text-amber-700 font-bold text-[11px]">
                    {summary.pendingOrders}
                  </span>
                  <span className="font-medium text-foreground group-hover:text-amber-900">
                    Pesanan pending menunggu
                  </span>
                </div>
                <ChevronRight className="size-4 text-muted-foreground group-hover:text-amber-800 transition-transform group-hover:translate-x-0.5" />
              </Link>

              {/* Item 2: Pending Licenses */}
              <Link
                to="/admin/licenses"
                className="flex items-center justify-between p-3 rounded-lg border border-blue-200/80 bg-blue-50/50 hover:bg-blue-50 transition-colors text-xs group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex size-6 items-center justify-center rounded-md bg-blue-100 text-blue-700 font-bold text-[11px]">
                    {summary.pendingLicenses}
                  </span>
                  <span className="font-medium text-foreground group-hover:text-blue-900">
                    Pengajuan lisensi baru
                  </span>
                </div>
                <ChevronRight className="size-4 text-muted-foreground group-hover:text-blue-800 transition-transform group-hover:translate-x-0.5" />
              </Link>

              {/* Item 3: Pelanggan Terdaftar */}
              <Link
                to="/admin/customers"
                className="flex items-center justify-between p-3 rounded-lg border border-indigo-200/80 bg-indigo-50/50 hover:bg-indigo-50 transition-colors text-xs group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex size-6 items-center justify-center rounded-md bg-indigo-100 text-indigo-700 font-bold text-[11px]">
                    {summary.totalCustomers}
                  </span>
                  <span className="font-medium text-foreground group-hover:text-indigo-900">
                    Total data pelanggan
                  </span>
                </div>
                <ChevronRight className="size-4 text-muted-foreground group-hover:text-indigo-800 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </CardContent>
          </Card>

          {/* Aktivitas Terakhir Card inspired by reference image */}
          <Card className="rounded-xl border border-border/80 bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
              <div>
                <CardTitle className="text-sm font-bold text-foreground">
                  Aktivitas Terakhir
                </CardTitle>
                <CardDescription className="text-xs">
                  Transaksi terbaru menurut database
                </CardDescription>
              </div>
              <Link to="/admin/orders" className="text-xs text-primary hover:underline font-medium">
                Lihat Semua
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentOrders.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">Belum ada transaksi terbaru.</p>
              ) : (
                recentOrders.map((ord: any) => (
                  <div key={ord.id} className="flex items-start justify-between gap-2 border-b border-border/50 pb-2.5 last:border-0 last:pb-0 text-xs">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {ord.first_name ? `${ord.first_name} ${ord.last_name || ""}` : ord.order_id}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {ord.items && ord.items.length > 0 ? ord.items[0].product_name : ord.order_id}
                      </p>
                      <p className="text-[10px] text-muted-foreground/80 mt-0.5">
                        {new Date(ord.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-bold text-foreground font-mono">
                        {formatPrice(parseInt(ord.total_amount || 0))}
                      </p>
                      <Badge
                        variant="outline"
                        className={`mt-1 text-[10px] px-1.5 py-0 rounded-md font-medium ${
                          ord.transaction_status === "settlement" || ord.transaction_status === "capture"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                            : ord.transaction_status === "pending"
                            ? "bg-amber-50 text-amber-700 border-amber-300"
                            : "bg-red-50 text-red-700 border-red-300"
                        }`}
                      >
                        {ord.transaction_status === "settlement" || ord.transaction_status === "capture"
                          ? "Lunas"
                          : ord.transaction_status === "pending"
                          ? "Pending"
                          : ord.transaction_status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
