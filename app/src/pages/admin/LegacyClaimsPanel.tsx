import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Copy, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { authHeaders } from "@/lib/auth"

type ClaimStatus = "pending" | "approved" | "rejected"

type LegacyClaim = {
  id: number
  status: ClaimStatus
  company: string
  phone: string
  quantity: number
  license_codes: string[]
  note: string | null
  admin_note: string | null
  product_id: string | null
  product_other: string | null
  product_name: string
  customer_name: string
  customer_email: string
  order_id: string | null
  created_at: string
}

type Product = { id: string; name: string }

const CLAIM_TABS: { value: ClaimStatus; label: string }[] = [
  { value: "pending", label: "Menunggu" },
  { value: "approved", label: "Disetujui" },
  { value: "rejected", label: "Ditolak" },
]

export const CLAIM_LINK = "https://app.rhantech.com/klaim-lisensi"

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success("Disalin")
  } catch {
    toast.error("Gagal menyalin")
  }
}

export function LegacyClaimsPanel({ onPendingCount }: { onPendingCount?: (n: number) => void }) {
  const [tab, setTab] = useState<ClaimStatus>("pending")
  const [claims, setClaims] = useState<LegacyClaim[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState<LegacyClaim | null>(null)
  const [approveProduct, setApproveProduct] = useState("")
  const [approveQty, setApproveQty] = useState("1")
  const [rejecting, setRejecting] = useState<LegacyClaim | null>(null)
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/legacy-claims?status=${tab}`, { headers: authHeaders() })
      if (!res.ok) throw new Error()
      const rows: LegacyClaim[] = await res.json()
      setClaims(rows)
      if (tab === "pending") onPendingCount?.(rows.length)
    } catch {
      toast.error("Gagal memuat klaim")
    } finally {
      setLoading(false)
    }
  }, [tab, onPendingCount])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    fetch("/api/products")
      .then((res) => (res.ok ? res.json() : []))
      .then((list: Product[]) => setProducts(list.map(({ id, name }) => ({ id, name }))))
      .catch(() => {})
  }, [])

  const openApprove = (c: LegacyClaim) => {
    setApproving(c)
    setApproveProduct(c.product_id ?? "")
    setApproveQty(String(c.quantity))
  }

  const send = async (url: string, body: object, okMessage: string) => {
    setBusy(true)
    try {
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Gagal")
      toast.success(okMessage)
      setApproving(null)
      setRejecting(null)
      setReason("")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-3 text-sm">
        <span>
          Link untuk pelanggan lama: <span className="font-mono">{CLAIM_LINK}</span>
        </span>
        <Button size="sm" variant="outline" className="rounded-full" onClick={() => copy(CLAIM_LINK)}>
          <Copy className="mr-1 size-3" />
          Salin link
        </Button>
      </div>

      <div className="flex gap-2">
        {CLAIM_TABS.map((t) => (
          <Button
            key={t.value}
            size="sm"
            variant={tab === t.value ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setTab(t.value)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : claims.length === 0 ? (
        <p className="rounded-xl border border-border py-12 text-center text-muted-foreground">Tidak ada klaim</p>
      ) : (
        claims.map((c) => (
          <div key={c.id} className="space-y-3 rounded-xl border border-border bg-card p-4 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">{c.customer_name}</p>
                <p className="text-xs text-muted-foreground">{c.customer_email}</p>
              </div>
              <div className="text-right text-xs">
                <p className="font-medium">
                  {c.product_name} ×{c.quantity}
                </p>
                {!c.product_id && <Badge variant="outline">Lainnya — pilih produk saat menyetujui</Badge>}
                {c.order_id && <p className="font-mono text-muted-foreground">{c.order_id}</p>}
              </div>
            </div>
            <dl className="grid gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
              <div>
                <dt className="inline text-muted-foreground">Toko/perusahaan: </dt>
                <dd className="inline font-medium">{c.company}</dd>
              </div>
              <div>
                <dt className="inline text-muted-foreground">WA saat membeli: </dt>
                <dd className="inline font-medium">{c.phone}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Kode lisensi:</dt>
                <dd className="font-mono break-all">{c.license_codes.join(", ")}</dd>
              </div>
              {c.note && (
                <div className="sm:col-span-2">
                  <dt className="inline text-muted-foreground">Catatan: </dt>
                  <dd className="inline">{c.note}</dd>
                </div>
              )}
              {c.status === "rejected" && c.admin_note && (
                <div className="sm:col-span-2 text-destructive">Alasan ditolak: {c.admin_note}</div>
              )}
            </dl>
            {c.status === "pending" && (
              <div className="flex gap-2">
                <Button size="sm" className="rounded-full" onClick={() => openApprove(c)}>
                  Setujui
                </Button>
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => setRejecting(c)}>
                  Tolak
                </Button>
              </div>
            )}
          </div>
        ))
      )}

      <Dialog open={!!approving} onOpenChange={(open) => !open && setApproving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Setujui klaim pelanggan lama</DialogTitle>
            <DialogDescription>
              Sistem membuat pesanan pelanggan lama (Rp 0, lunas) dan permintaan nomor registrasi untuk setiap kode.
              Nomornya diterbitkan di tab Permintaan nomor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <Label>Produk</Label>
              <Select value={approveProduct} onValueChange={setApproveProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih produk" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {approving?.product_other && (
                <p className="text-xs text-muted-foreground">Ditulis pelanggan: {approving.product_other}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="approveQty">Jumlah komputer</Label>
              <Input
                id="approveQty"
                type="number"
                min={approving?.license_codes.length ?? 1}
                max={20}
                value={approveQty}
                onChange={(e) => setApproveQty(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproving(null)}>
              Kembali
            </Button>
            <Button
              disabled={!approveProduct || busy}
              onClick={() =>
                approving &&
                send(
                  `/api/admin/legacy-claims/${approving.id}/approve`,
                  { product_id: approveProduct, quantity: Number(approveQty) },
                  "Disetujui — permintaan nomor siap di tab Permintaan nomor"
                )
              }
            >
              {busy && <Loader2 className="mr-1 size-4 animate-spin" />}
              Setujui
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejecting} onOpenChange={(open) => !open && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak klaim</DialogTitle>
            <DialogDescription>Alasan ini tampil di halaman klaim pelanggan. Pelanggan bisa mengirim klaim baru.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            maxLength={500}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Mis. data pembelian tidak ditemukan, mohon hubungi kami via WA"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>
              Kembali
            </Button>
            <Button
              disabled={reason.trim().length === 0 || busy}
              onClick={() =>
                rejecting && send(`/api/admin/legacy-claims/${rejecting.id}/reject`, { reason }, "Klaim ditolak")
              }
            >
              Tolak klaim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
