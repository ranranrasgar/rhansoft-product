import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ShoppingCart,
  Search,
  Loader2,
  Mail,
  Eye,
} from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Order = {
  id: number
  order_id: string
  customer_id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  gross_amount: number
  shipping_cost: number
  tax: number
  total_amount: number
  payment_method: string
  transaction_status: string
  payment_type: string
  paid_at: string | null
  created_at: string
  items?: { product_name: string; price: number; quantity: number; category: string }[]
}

function formatPrice(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`
}

const statusVariant = (status: string) => {
  if (status === "settlement" || status === "capture") return "default"
  if (status === "pending") return "secondary"
  return "destructive"
}

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/orders")
      const data = await res.json()
      setOrders(data)
    } catch {
      toast.error("Gagal memuat pesanan")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleResendEmail = async (orderId: string) => {
    toast.info("Mengirim ulang email...")
    try {
      const res = await fetch(`/api/admin/resend-email/${orderId}`, {
        method: "POST",
      })
      if (!res.ok) throw new Error("Gagal")
      toast.success("Email berhasil dikirim ulang")
    } catch {
      toast.error("Gagal mengirim email")
    }
  }

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.order_id.toLowerCase().includes(search.toLowerCase()) ||
      o.first_name.toLowerCase().includes(search.toLowerCase()) ||
      o.email.toLowerCase().includes(search.toLowerCase())
    const matchStatus =
      filterStatus === "all" || o.transaction_status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <ShoppingCart className="size-6" />
          Pesanan
        </h1>
        <p className="text-sm text-muted-foreground">
          Kelola semua transaksi pesanan
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{orders.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-amber-600">
            {orders.filter((o) => o.transaction_status === "pending").length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Sukses</p>
          <p className="text-2xl font-bold text-emerald-600">
            {orders.filter(
              (o) =>
                o.transaction_status === "settlement" ||
                o.transaction_status === "capture"
            ).length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Gagal/Batal</p>
          <p className="text-2xl font-bold text-red-600">
            {orders.filter(
              (o) =>
                o.transaction_status === "deny" ||
                o.transaction_status === "cancel" ||
                o.transaction_status === "expire" ||
                o.transaction_status === "failure"
            ).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari order ID, nama, email..."
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="settlement">Settlement</SelectItem>
            <SelectItem value="capture">Capture</SelectItem>
            <SelectItem value="deny">Deny</SelectItem>
            <SelectItem value="cancel">Cancel</SelectItem>
            <SelectItem value="expire">Expire</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium text-muted-foreground">Order ID</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Pelanggan</th>
              <th className="hidden px-4 py-3 font-medium text-muted-foreground md:table-cell">
                Total
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="hidden px-4 py-3 font-medium text-muted-foreground md:table-cell">
                Tanggal
              </th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground">
                  Tidak ada pesanan
                </td>
              </tr>
            ) : (
              filtered.map((o) => (
                <tr key={o.order_id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{o.order_id}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">
                      {o.first_name} {o.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{o.email}</p>
                  </td>
                  <td className="hidden px-4 py-3 font-semibold md:table-cell">
                    {formatPrice(o.total_amount)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(o.transaction_status)}>
                      {o.transaction_status}
                    </Badge>
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">
                    {new Date(o.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => setDetailOrder(o)}
                        title="Lihat detail"
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => handleResendEmail(o.order_id)}
                        title="Kirim ulang email"
                      >
                        <Mail className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail dialog */}
      <Dialog open={!!detailOrder} onOpenChange={(open) => !open && setDetailOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Pesanan</DialogTitle>
          </DialogHeader>
          {detailOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Order ID</p>
                  <p className="font-mono font-medium">{detailOrder.order_id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={statusVariant(detailOrder.transaction_status)}>
                    {detailOrder.transaction_status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Pelanggan</p>
                  <p className="font-medium">
                    {detailOrder.first_name} {detailOrder.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{detailOrder.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Telepon</p>
                  <p className="font-medium">{detailOrder.phone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Metode Bayar</p>
                  <p className="font-medium">{detailOrder.payment_method || "—"}</p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold">Item</p>
                <div className="space-y-2">
                  {detailOrder.items?.map((it, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-border p-2 text-sm"
                    >
                      <span>
                        {it.product_name} (×{it.quantity})
                      </span>
                      <span className="font-medium">
                        {formatPrice(it.price * it.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(detailOrder.gross_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ongkir</span>
                  <span>{formatPrice(detailOrder.shipping_cost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pajak</span>
                  <span>{formatPrice(detailOrder.tax)}</span>
                </div>
                <div className="mt-2 flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span>{formatPrice(detailOrder.total_amount)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
