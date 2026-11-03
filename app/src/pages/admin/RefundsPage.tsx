import { authHeaders } from "@/lib/auth"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  RotateCcw,
  Search,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

type Order = {
  order_id: string
  first_name: string
  last_name: string
  email: string
  total_amount: number
  transaction_status: string
  payment_type: string
  created_at: string
  paid_at: string | null
}

function formatPrice(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`
}

export function RefundsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [refundTarget, setRefundTarget] = useState<Order | null>(null)
  const [refundReason, setRefundReason] = useState("")
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetch("/api/admin/orders", { headers: authHeaders() })
      .then((res) => res.json())
      .then((data) => {
        const paid = data.filter(
          (o: Order) =>
            o.transaction_status === "settlement" ||
            o.transaction_status === "capture"
        )
        setOrders(paid)
      })
      .catch(() => toast.error("Gagal memuat data"))
      .finally(() => setLoading(false))
  }, [])

  const filtered = orders.filter((o) => {
    return (
      o.order_id.toLowerCase().includes(search.toLowerCase()) ||
      o.email.toLowerCase().includes(search.toLowerCase()) ||
      `${o.first_name} ${o.last_name}`.toLowerCase().includes(search.toLowerCase())
    )
  })

  const handleRefund = async () => {
    if (!refundTarget) return
    if (!refundReason.trim()) {
      toast.error("Alasan refund wajib diisi")
      return
    }
    setProcessing(true)
    try {
      const res = await fetch(`/api/admin/orders/${refundTarget.order_id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ action: "refund", reason: refundReason.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Refund gagal")
      toast.success(`Refund ${refundTarget.order_id} berhasil`, {
        description: data.manual
          ? "Pembayaran manual: kembalikan dana ke pelanggan secara langsung."
          : "Dana dikembalikan lewat Midtrans.",
      })
      setOrders((prev) => prev.filter((o) => o.order_id !== refundTarget.order_id))
      setRefundTarget(null)
      setRefundReason("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Refund gagal")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <RotateCcw className="size-6" />
          Refund
        </h1>
        <p className="text-sm text-muted-foreground">
          Kelola permintaan pengembalian dana dari pesanan yang sudah dibayar
        </p>
      </div>

      {/* Info banner */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
        <p className="text-sm text-amber-800 dark:text-amber-400">
          Refund online diproses via Midtrans (tidak semua metode didukung); pesanan bayar manual hanya ditandai, dana dikembalikan langsung. Pastikan untuk
          mengkonfirmasi alasan refund sebelum menyetujui.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari pesanan yang bisa di-refund..."
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium text-muted-foreground">Order ID</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Pelanggan</th>
              <th className="hidden px-4 py-3 font-medium text-muted-foreground md:table-cell">Total</th>
              <th className="hidden px-4 py-3 font-medium text-muted-foreground md:table-cell">Metode</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Aksi</th>
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
                  Tidak ada pesanan yang dapat di-refund
                </td>
              </tr>
            ) : (
              filtered.map((o) => (
                <tr key={o.order_id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{o.order_id}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{o.first_name} {o.last_name}</p>
                    <p className="text-xs text-muted-foreground">{o.email}</p>
                  </td>
                  <td className="hidden px-4 py-3 font-semibold md:table-cell">
                    {formatPrice(o.total_amount)}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {o.payment_type || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="default">{o.transaction_status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-orange-600 hover:text-orange-700"
                      onClick={() => setRefundTarget(o)}
                    >
                      <RotateCcw className="size-4" />
                      Refund
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Refund dialog */}
      <Dialog open={!!refundTarget} onOpenChange={(open) => !open && setRefundTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Refund</DialogTitle>
            <DialogDescription>
              Pengembalian dana akan diproses via Midtrans. Tindakan ini tidak
              dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          {refundTarget && (
            <div className="space-y-3">
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order ID</span>
                  <span className="font-mono font-medium">{refundTarget.order_id}</span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-muted-foreground">Pelanggan</span>
                  <span className="font-medium">
                    {refundTarget.first_name} {refundTarget.last_name}
                  </span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-semibold">
                    {formatPrice(refundTarget.total_amount)}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Alasan Refund</label>
                <Textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={3}
                  placeholder="Jelaskan alasan pengembalian dana..."
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundTarget(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleRefund}
              disabled={processing}
            >
              {processing && <Loader2 className="size-4 animate-spin" />}
              Proses Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
