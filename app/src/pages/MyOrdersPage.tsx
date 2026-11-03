import { Fragment, useCallback, useEffect, useState } from "react"
import { Link, Navigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, Download, Loader2, Mail, Package, Plus, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import { authHeaders } from "@/lib/auth"
import { payWithSnap } from "@/lib/midtrans"
import { LicenseBlock, type LicenseRequestView } from "@/components/LicenseBlock"

type OrderItem = {
  id: number
  license_requests: LicenseRequestView[]
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
  const [pendingClaims, setPendingClaims] = useState(0)
  // Rincian terbuka/tertutup yang dipilih pengguna; bila belum dipilih, pakai bawaan needsAttention
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  // Bawaan terbuka bila masih ada yang perlu dilakukan: permintaan menunggu atau kuota tersisa
  const needsAttention = (o: MyOrder) =>
    o.items.some((it) => {
      const reqs = it.license_requests ?? []
      const used = reqs.filter((r) => r.status !== "rejected").length
      return used < it.quantity || reqs.some((r) => r.status === "pending")
    })
  const isOpen = (o: MyOrder) => expanded[o.order_id] ?? needsAttention(o)
  const toggle = (orderId: string, open: boolean) => setExpanded((e) => ({ ...e, [orderId]: open }))

  useEffect(() => {
    if (!user) return
    fetch("/api/my/legacy-claims", { headers: authHeaders() })
      .then((res) => (res.ok ? res.json() : []))
      .then((rows: { status: string }[]) => setPendingClaims(rows.filter((c) => c.status === "pending").length))
      .catch(() => {})
  }, [user])

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

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Package className="size-6" />
            Pesanan Saya
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Riwayat pembelian, pembayaran, nomor registrasi lisensi, dan unduhan.
          </p>
        </div>
        <Button asChild size="sm" variant="outline" className="rounded-full">
          <Link to="/klaim-lisensi">
            <Plus className="mr-1 size-4" />
            Minta lisensi produk lain
          </Link>
        </Button>
      </div>

      {pendingClaims > 0 && (
        <p className="mt-4 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
          {pendingClaims} klaim lisensi sedang diperiksa admin.{" "}
          <Link to="/klaim-lisensi" className="font-medium text-primary hover:underline">
            Lihat klaim
          </Link>
        </p>
      )}

      {/* Di HP tiap baris jadi kartu ringkas 2 kolom: pesanan + status, lalu produk + aksi */}
      <div className="mt-5 overflow-hidden rounded-xl border border-border bg-card">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-medium">Belum ada pesanan</p>
            <Button asChild className="mt-4 rounded-full">
              <Link to="/">Lihat produk</Link>
            </Button>
          </div>
        ) : (
          <table className="block w-full text-sm md:table">
            <thead className="hidden border-b border-border bg-muted/40 text-left text-xs text-muted-foreground md:table-header-group">
              <tr>
                <th className="px-3 py-2 font-medium">Pesanan</th>
                <th className="px-3 py-2 font-medium">Produk</th>
                <th className="hidden px-3 py-2 font-medium md:table-cell">Lisensi</th>
                <th className="hidden px-3 py-2 text-right font-medium md:table-cell">Total</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="block divide-y divide-border md:table-row-group">
              {orders.map((o) => {
                const legacy = o.payment_type === "legacy"
                const st = legacy
                  ? { label: "Pelanggan lama", variant: "default" as const }
                  : STATUS[o.transaction_status] ?? { label: o.transaction_status, variant: "outline" as const }
                const paid = isPaid(o.transaction_status)
                const working = busy === o.order_id
                const retryable = ["cancel", "expire", "deny", "failure"].includes(o.transaction_status)
                const quota = o.items.reduce((n, it) => n + it.quantity, 0)
                const issued = o.items.reduce(
                  (n, it) => n + (it.license_requests ?? []).filter((r) => r.status === "issued").length,
                  0
                )
                const open = isOpen(o)
                return (
                  <Fragment key={o.order_id}>
                    <tr className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 px-1 py-1 align-top md:table-row md:p-0">
                      <td className="order-1 block px-2 py-1 md:table-cell md:px-3 md:py-2.5">
                        <p className="font-mono text-xs break-all">{o.order_id}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(o.created_at)}</p>
                      </td>
                      <td className="order-3 block px-2 py-1 md:order-none md:table-cell md:px-3 md:py-2.5">
                        {o.items.map((it) => (
                          <p key={it.id} className="font-medium">
                            {it.product_name} <span className="font-normal text-muted-foreground">×{it.quantity}</span>
                          </p>
                        ))}
                        {/* Di HP kolom lisensi dan total digabung ke sini */}
                        <p className="text-xs text-muted-foreground md:hidden">
                          {paid && `${issued}/${quota} lisensi terbit · `}
                          {legacy ? "Pembelian lama" : formatPrice(o.total_amount)}
                        </p>
                      </td>
                      <td className="hidden px-3 py-2.5 text-xs md:table-cell">
                        {paid ? `${issued}/${quota} terbit` : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="hidden px-3 py-2.5 text-right whitespace-nowrap md:table-cell">
                        {legacy ? <span className="text-muted-foreground">—</span> : formatPrice(o.total_amount)}
                      </td>
                      <td className="order-2 block px-2 py-1 text-right md:order-none md:table-cell md:px-3 md:py-2.5 md:text-left">
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </td>
                      <td className="order-4 block self-end px-2 py-1 md:order-none md:table-cell md:px-3 md:py-2.5">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {o.transaction_status === "pending" && (
                            <>
                              <Button size="sm" className="h-7 rounded-full" disabled={working} onClick={() => handlePay(o.order_id)}>
                                {working && <Loader2 className="mr-1 size-3 animate-spin" />}
                                Bayar
                              </Button>
                              <Button
                                size="icon-sm"
                                variant="outline"
                                className="size-7 rounded-full"
                                disabled={working}
                                onClick={() => handleRefresh(o.order_id)}
                                aria-label="Cek status pembayaran"
                                title="Cek status pembayaran"
                              >
                                <RefreshCw className="size-3.5" />
                              </Button>
                            </>
                          )}
                          {retryable && o.items[0] && (
                            <Button asChild size="sm" variant="outline" className="h-7 rounded-full">
                              <Link to={`/product/${o.items[0].product_id}`}>Pesan lagi</Link>
                            </Button>
                          )}
                          {paid && (
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              className="size-7"
                              onClick={() => toggle(o.order_id, !open)}
                              aria-expanded={open}
                              aria-label={open ? "Tutup rincian" : "Buka rincian"}
                              title={open ? "Tutup rincian" : "Lisensi & unduhan"}
                            >
                              <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {paid && open && (
                      <tr className="block bg-muted/20 md:table-row">
                        <td colSpan={6} className="block px-2 pt-1 pb-3 md:table-cell md:px-3">
                          <div className="space-y-3">
                            {o.items.map((it) => (
                              <div key={it.id} className="rounded-lg border border-border bg-card p-3">
                                {o.items.length > 1 && <p className="mb-2 text-xs font-semibold">{it.product_name}</p>}
                                <LicenseBlock
                                  orderItemId={it.id}
                                  quantity={it.quantity}
                                  requests={it.license_requests ?? []}
                                  onChanged={load}
                                />
                                {(it.download_links.length > 0 || it.install_tutorial) && (
                                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-2">
                                    {it.download_links.map((dl, j) => (
                                      <a
                                        key={j}
                                        href={dl.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-xs font-medium hover:bg-accent"
                                      >
                                        <Download className="size-3" />
                                        {dl.label}
                                        {dl.size ? ` (${dl.size})` : ""}
                                      </a>
                                    ))}
                                    {it.install_tutorial && (
                                      <details className="w-full text-xs text-muted-foreground">
                                        <summary className="cursor-pointer font-medium text-foreground">Panduan instalasi</summary>
                                        <p className="mt-1 whitespace-pre-line">{it.install_tutorial}</p>
                                      </details>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                            <div className="flex justify-end">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs"
                                disabled={working}
                                onClick={() => handleResend(o.order_id)}
                              >
                                <Mail className="mr-1 size-3.5" />
                                Kirim ulang email lisensi
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
