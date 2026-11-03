import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Package,
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  RotateCcw,
  ArrowRight,
} from "lucide-react"
import { useProducts } from "@/hooks/useProducts"
import { useAuth } from "@/hooks/useAuth"
import { authHeaders, fetchAdminUsers, getToken, type AdminUser } from "@/lib/auth"

function StatCard({
  icon: Icon,
  label,
  value,
  to,
  color,
}: {
  icon: typeof Package
  label: string
  value: string
  to: string
  color: string
}) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <div className={`flex size-8 items-center justify-center rounded-lg ${color}`}>
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <p className="text-2xl font-bold">{value}</p>
          <Link to={to}>
            <Button variant="ghost" size="icon-sm">
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const { products } = useProducts()
  const { user, isAdmin } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [orders, setOrders] = useState<any[]>([])

  const totalValue = products.reduce((sum, p) => sum + p.price, 0)

  useEffect(() => {
    const token = getToken()
    if (!token) return

    if (isAdmin) {
      fetchAdminUsers(token)
        .then(setUsers)
        .catch(() => {})
    }

    fetch("/api/admin/orders", { headers: authHeaders() })
      .then((res) => res.json())
      .then(setOrders)
      .catch(() => {})
  }, [isAdmin])

  const pendingOrders = orders.filter(
    (o) => o.transaction_status === "pending"
  ).length
  const paidOrders = orders.filter(
    (o) =>
      o.transaction_status === "settlement" ||
      o.transaction_status === "capture"
  )
  const totalRevenue = paidOrders.reduce(
    (sum, o) => sum + parseInt(o.total_amount || 0),
    0
  )

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Selamat datang, {user?.first_name}!
        </h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan aktivitas dan statistik toko Anda
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Package}
          label="Total Produk"
          value={products.length.toString()}
          to="/admin/products"
          color="bg-blue-100 text-blue-700"
        />
        <StatCard
          icon={ShoppingCart}
          label="Total Pesanan"
          value={orders.length.toString()}
          to="/admin/orders"
          color="bg-green-100 text-green-700"
        />
        {isAdmin && (
          <StatCard
            icon={Users}
            label="Total User"
            value={users.length.toString()}
            to="/admin/users"
            color="bg-purple-100 text-purple-700"
          />
        )}
        {!isAdmin && (
          <StatCard
            icon={DollarSign}
            label="Nilai Katalog"
            value={`Rp ${totalValue.toLocaleString("id-ID")}`}
            to="/admin/products"
            color="bg-amber-100 text-amber-700"
          />
        )}
        <StatCard
          icon={DollarSign}
          label="Pendapatan"
          value={`Rp ${totalRevenue.toLocaleString("id-ID")}`}
          to="/admin/orders"
          color="bg-emerald-100 text-emerald-700"
        />
      </div>

      {/* Quick stats row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Pending orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="size-4" />
              Pesanan Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pendingOrders}</p>
            <p className="text-xs text-muted-foreground">
              Menunggu pembayaran
            </p>
          </CardContent>
        </Card>

        {/* Completed orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ShoppingCart className="size-4" />
              Pesanan Selesai
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{paidOrders.length}</p>
            <p className="text-xs text-muted-foreground">
              Pembayaran sukses
            </p>
          </CardContent>
        </Card>

        {/* Refund quick link */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <RotateCcw className="size-4" />
              Refund
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0</p>
            <Link to="/admin/refunds">
              <Button variant="outline" size="sm" className="mt-2">
                Kelola Refund
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent orders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pesanan Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Belum ada pesanan
            </p>
          ) : (
            <div className="space-y-2">
              {orders.slice(0, 5).map((o) => (
                <div
                  key={o.order_id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">
                      {o.order_id}
                    </p>
                    <p className="text-sm font-medium">
                      {o.first_name} {o.last_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      Rp {parseInt(o.total_amount || 0).toLocaleString("id-ID")}
                    </p>
                    <span
                      className={`text-xs ${
                        o.transaction_status === "settlement"
                          ? "text-emerald-600"
                          : o.transaction_status === "pending"
                          ? "text-amber-600"
                          : "text-red-600"
                      }`}
                    >
                      {o.transaction_status}
                    </span>
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
