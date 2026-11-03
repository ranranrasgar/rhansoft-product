import { useCallback, useEffect, useState } from "react"
import { Link, Navigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { KeyRound, Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import { authHeaders } from "@/lib/auth"

const OTHER = "__other__"
const MAX_COMPUTERS = 20

type Product = { id: string; name: string }
type MyClaim = {
  id: number
  status: "pending" | "approved" | "rejected"
  quantity: number
  created_at: string
  product_name: string
  admin_note?: string
}

const CLAIM_STATUS: Record<MyClaim["status"], { label: string; variant: "default" | "secondary" | "destructive" }> = {
  pending: { label: "Sedang diperiksa", variant: "secondary" },
  approved: { label: "Disetujui", variant: "default" },
  rejected: { label: "Ditolak", variant: "destructive" },
}

export function ClaimLicensePage() {
  const { user, loading: authLoading } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [claims, setClaims] = useState<MyClaim[]>([])
  const [product, setProduct] = useState("")
  const [productOther, setProductOther] = useState("")
  const [company, setCompany] = useState("")
  const [phone, setPhone] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [codes, setCodes] = useState<string[]>([""])
  const [note, setNote] = useState("")
  const [sending, setSending] = useState(false)

  const loadClaims = useCallback(async () => {
    try {
      const res = await fetch("/api/my/legacy-claims", { headers: authHeaders() })
      if (res.ok) setClaims(await res.json())
    } catch {
      // daftar klaim hanya informasi; form tetap bisa dipakai
    }
  }, [])

  useEffect(() => {
    if (!user) return
    loadClaims()
    fetch("/api/products")
      .then((res) => (res.ok ? res.json() : []))
      .then((list: Product[]) => setProducts(list.map(({ id, name }) => ({ id, name }))))
      .catch(() => toast.error("Gagal memuat daftar produk"))
  }, [user, loadClaims])

  const maxCodes = Math.min(Math.max(Number(quantity) || 1, 1), MAX_COMPUTERS)

  const reset = () => {
    setProduct("")
    setProductOther("")
    setCompany("")
    setPhone("")
    setQuantity("1")
    setCodes([""])
    setNote("")
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return toast.error("Pilih produk yang Anda pakai")
    setSending(true)
    try {
      const res = await fetch("/api/legacy-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          product_id: product === OTHER ? null : product,
          product_other: product === OTHER ? productOther : null,
          company,
          phone,
          quantity: Number(quantity),
          license_codes: codes.filter((c) => c.trim() !== ""),
          note,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Gagal mengirim klaim")
      toast.success("Klaim terkirim. Kami akan memeriksanya segera.")
      reset()
      await loadClaims()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim klaim")
    } finally {
      setSending(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace state={{ from: "/klaim-lisensi" }} />

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:py-12">
      <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <KeyRound className="size-6" />
        Klaim Lisensi Pelanggan Lama
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Untuk pelanggan yang membeli aplikasi Rhansoft sebelum toko online ini ada. Setelah klaim diperiksa dan
        disetujui, nomor registrasi bisa diminta dan dilihat di Pesanan Saya.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-col gap-1.5">
          <Label>Aplikasi yang dipakai</Label>
          <Select value={product} onValueChange={setProduct}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih aplikasi" />
            </SelectTrigger>
            <SelectContent>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
              <SelectItem value={OTHER}>Lainnya (tidak ada di daftar)</SelectItem>
            </SelectContent>
          </Select>
          {product === OTHER && (
            <Input
              value={productOther}
              maxLength={100}
              onChange={(e) => setProductOther(e.target.value)}
              placeholder="Nama aplikasi, mis. Jadwal Sekolah"
            />
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="company">Nama toko / perusahaan</Label>
            <Input id="company" value={company} maxLength={100} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Nomor WA saat membeli dulu</Label>
            <Input
              id="phone"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08xxxxxxxxxx"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 sm:max-w-[12rem]">
          <Label htmlFor="quantity">Jumlah komputer</Label>
          <Input
            id="quantity"
            type="number"
            min={1}
            max={MAX_COMPUTERS}
            value={quantity}
            onChange={(e) => {
              setQuantity(e.target.value)
              const n = Math.min(Math.max(Number(e.target.value) || 1, 1), MAX_COMPUTERS)
              setCodes((c) => (c.length > n ? c.slice(0, n) : c))
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Kode lisensi dari aplikasi</Label>
          <p className="text-xs text-muted-foreground">
            Kode tampil di jendela registrasi aplikasi desktop. Satu kode untuk setiap komputer.
          </p>
          {codes.map((code, i) => (
            <div key={i} className="flex gap-2">
              <Input
                className="font-mono"
                value={code}
                onChange={(e) => setCodes((c) => c.map((v, j) => (j === i ? e.target.value : v)))}
                placeholder={`Kode komputer ${i + 1}`}
              />
              {codes.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Hapus kode"
                  onClick={() => setCodes((c) => c.filter((_, j) => j !== i))}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          ))}
          {codes.length < maxCodes && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit rounded-full"
              onClick={() => setCodes((c) => [...c, ""])}
            >
              <Plus className="mr-1 size-4" />
              Tambah kode
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="note">Catatan (opsional)</Label>
          <Textarea
            id="note"
            value={note}
            maxLength={500}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Mis. tahun pembelian atau nama penjual"
          />
        </div>

        <Button type="submit" className="w-full rounded-full" disabled={sending}>
          {sending && <Loader2 className="mr-1 size-4 animate-spin" />}
          Kirim klaim
        </Button>
      </form>

      {claims.length > 0 && (
        <div className="mt-8 space-y-3">
          <h2 className="font-semibold">Klaim Anda</h2>
          {claims.map((c) => {
            const st = CLAIM_STATUS[c.status]
            return (
              <div key={c.id} className="rounded-xl border border-border bg-card p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    {c.product_name} <span className="text-muted-foreground">×{c.quantity}</span>
                  </p>
                  <Badge variant={st.variant}>{st.label}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(c.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </p>
                {c.status === "approved" && (
                  <Link to="/akun/pesanan" className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
                    Lihat nomor registrasi di Pesanan Saya →
                  </Link>
                )}
                {c.status === "rejected" && c.admin_note && (
                  <p className="mt-2 text-xs text-destructive">Alasan: {c.admin_note}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
