import { useCallback, useEffect, useState } from "react"
import { Link, Navigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Loader2, Mail, Package, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import { authHeaders } from "@/lib/auth"
import { payWithSnap } from "@/lib/midtrans"

type OrderItem = {
  product_id: string
  product_name: string
  price: number
  quantity: number
  download_links: { label: string; url: string; size?: string }[]
  install_tutorial: string | null
}

type MyOrder = {
  order_id: string
  created_at: string
  paid_at: string | null
  total_amount: number
  transaction_status: string
  payment_type: string | null
  items: OrderItem[]
}

const formatPrice = (n: number) => `Rp ${Number(n).toLocaleString("id-ID")}`
const isPaid = (s: string) => s === "settlement" || s === "capture"

const STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Menunggu pembayaran", variant: "secondary" },
  settlement: { label: "Lunas", variant: "default" },
  capture: { label: "Lunas", variant: "default" },
  cancel: { label: "Dibatalkan", variant: "destructive" },
  expire: { label: "Kedaluwarsa", variant: "destructive" },
  deny: { label: "Ditolak", variant: "destructive" },
  failure: { label: "Gagal", variant: "destructive" },
  refund: { label: "Dikembalikan", variant: "outline" },
}

export function MyOrdersPage() {
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState<MyOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/my/orders", { headers: authHeaders() })
      if (!res.ok) throw new Error()
      setOrders(await res.json())
    } catch {
      toast.error("Gagal memuat pesanan")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) load()
  }, [user, load])

  const post = async (orderId: string, action: "pay" | "refresh" | "resend-email") => {
    const res = await fetch(`/api/my/orders/${orderId}/${action}`, {
      method: "POST",
      headers: authHeaders(),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || "Gagal")
    return data
  }

  const handlePay = async (orderId: string) => {
    setBusy(orderId)
    try {
      const { token, snap_url, client_key } = await post(orderId, "pay")
      const result = await payWithSnap(token, snap_url, client_key)
      if (result.status === "success") toast.success("Pembayaran berhasil")
      else if (result.status === "pending") toast.info("Pembayaran tertunda, selesaikan sesuai instruksi")
      else if (result.status === "error") toast.error("Pembayaran gagal, coba metode lain")
      // Status resmi datang dari Midtrans; ambil yang terbaru lalu muat ulang daftar
      await post(orderId, "refresh").catch(() => {})
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memproses pembayaran")
    } finally {
      setBusy(null)
    }
  }

  const handleRefresh = async (orderId: string) => {
    setBusy(orderId)
    try {
      const { status } = await post(orderId, "refresh")
      toast.success(`Status: ${STATUS[status]?.label ?? status}`)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memeriksa status")
    } finally {
      setBusy(null)
    }
  }

  const handleResend = async (orderId: string) => {
    setBusy(orderId)
    try {
      await post(orderId, "resend-email")
      toast.success("Email lisensi dikirim ulang")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim email")
    } finally {
      setBusy(null)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace state={{ from: "/akun/pesanan" }} />

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <Package className="size-6" />
        Pesanan Saya
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Riwayat pembelian, lanjutkan pembayaran, dan akses lisensi serta unduhan.
      </p>

      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-border p-10 text-center">
            <p className="font-medium">Belum ada pesanan</p>
            <Button asChild className="mt-4 rounded-full">
              <Link to="/">Lihat produk</Link>
            </Button>
          </div>
        ) : (
          orders.map((o) => {
            const st = STATUS[o.transaction_status] ?? { label: o.transaction_status, variant: "outline" as const }
            const paid = isPaid(o.transaction_status)
            const working = busy === o.order_id
            const retryable = ["cancel", "expire", "deny", "failure"].includes(o.transaction_status)
            return (
              <div key={o.order_id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">{o.order_id}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <Badge variant={st.variant}>{st.label}</Badge>
                </div>

                <ul className="mt-4 space-y-3">
                  {o.items.map((it, i) => (
                    <li key={i} className="text-sm">
                      <div className="flex justify-between gap-3">
                        <span className="font-medium">
                          {it.product_name} <span className="text-muted-foreground">×{it.quantity}</span>
                        </span>
                        <span>{formatPrice(it.price * it.quantity)}</span>
                      </div>
                      {paid && it.download_links.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {it.download_links.map((dl, j) => (
                            <a
                              key={j}
                              href={dl.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-accent"
                            >
                              <Download className="size-3" />
                              {dl.label}
                              {dl.size ? ` (${dl.size})` : ""}
                            </a>
                          ))}
                        </div>
                      )}
                      {paid && it.install_tutorial && (
                        <details className="mt-2 text-xs text-muted-foreground">
                          <summary className="cursor-pointer font-medium text-foreground">Panduan instalasi</summary>
                          <p className="mt-1 whitespace-pre-line">{it.install_tutorial}</p>
                        </details>
                      )}
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                  <p className="text-sm">
                    Total <span className="text-base font-bold">{formatPrice(o.total_amount)}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {o.transaction_status === "pending" && (
                      <>
                        <Button size="sm" className="rounded-full" disabled={working} onClick={() => handlePay(o.order_id)}>
                          {working ? <Loader2 className="mr-1 size-4 animate-spin" /> : null}
                          Bayar sekarang
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-full" disabled={working} onClick={() => handleRefresh(o.order_id)}>
                          <RefreshCw className="mr-1 size-4" />
                          Cek status
                        </Button>
                      </>
                    )}
                    {paid && (
                      <Button size="sm" variant="outline" className="rounded-full" disabled={working} onClick={() => handleResend(o.order_id)}>
                        <Mail className="mr-1 size-4" />
                        Kirim ulang email lisensi
                      </Button>
                    )}
                    {retryable && o.items[0] && (
                      <Button asChild size="sm" variant="outline" className="rounded-full">
                        <Link to={`/product/${o.items[0].product_id}`}>Pesan lagi</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
