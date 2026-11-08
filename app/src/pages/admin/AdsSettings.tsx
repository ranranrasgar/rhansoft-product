import { useEffect, useState } from "react"
import { Megaphone, Copy, Trash2, Plus, Eye, MousePointerClick } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { API_BASE } from "@/lib/env"
import { getToken } from "@/lib/auth"

type AdSlot = {
  id: number
  slot_key: string
  name: string
  site_url: string | null
  format: "horizontal" | "vertical" | "square"
  style: "image" | "image_text"
  max_items: number
  is_active: boolean
  impressions: string | number
  clicks: string | number
}
type AdProduct = { id: string; name: string; image: string | null; ad_enabled: boolean }

const selectClass = "h-9 rounded-md border border-input bg-background px-2 text-sm"

async function api(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken() || ""}`, ...(init?.headers || {}) },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

function embedSnippet(slot: AdSlot) {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://app.rhantech.com"
  return `<div data-rhansoft-ad data-key="${slot.slot_key}" data-format="${slot.format}" data-style="${slot.style}"></div>\n<script async src="${origin}/api/ads/embed.js"></script>`
}

/** Admin: ad slots (where Rhansoft products are advertised in other apps) and which products may appear. */
export function AdsSettings() {
  const [slots, setSlots] = useState<AdSlot[]>([])
  const [products, setProducts] = useState<AdProduct[]>([])
  const [newName, setNewName] = useState("")
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const [s, p] = await Promise.all([api("/api/admin/ad-slots"), api("/api/admin/ad-products")])
      setSlots(s)
      setProducts(p)
    } catch (e: any) {
      toast.error("Gagal memuat data iklan", { description: e.message })
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const createSlot = async () => {
    if (!newName.trim()) return toast.error("Isi nama slot, mis. 'NOCR - tenant gratis'")
    try {
      const row = await api("/api/admin/ad-slots", { method: "POST", body: JSON.stringify({ name: newName }) })
      setSlots((prev) => [row, ...prev])
      setNewName("")
      toast.success("Slot iklan dibuat")
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const updateSlot = async (slot: AdSlot, patch: Partial<AdSlot>) => {
    try {
      const row = await api(`/api/admin/ad-slots/${slot.id}`, { method: "PUT", body: JSON.stringify(patch) })
      setSlots((prev) => prev.map((s) => (s.id === slot.id ? row : s)))
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const deleteSlot = async (slot: AdSlot) => {
    if (!confirm(`Hapus slot "${slot.name}"? Aplikasi yang memakai key ini berhenti menampilkan iklan.`)) return
    try {
      await api(`/api/admin/ad-slots/${slot.id}`, { method: "DELETE" })
      setSlots((prev) => prev.filter((s) => s.id !== slot.id))
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const toggleProduct = async (p: AdProduct, enabled: boolean) => {
    try {
      await api(`/api/admin/ad-products/${encodeURIComponent(p.id)}`, { method: "PUT", body: JSON.stringify({ ad_enabled: enabled }) })
      setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, ad_enabled: enabled } : x)))
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const copy = (text: string, what: string) => {
    navigator.clipboard?.writeText(text).then(() => toast.success(`${what} disalin`), () => toast.error("Gagal menyalin"))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Megaphone className="size-5" />
          Iklan Produk (Rhansoft Ads)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Tampilkan produk Rhansoft di aplikasi lain (mis. dashboard NOCR untuk tenant gratis). Setiap tempat tayang punya slot key sendiri.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
          <Input placeholder="Nama slot baru, mis. NOCR - tenant gratis" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Button onClick={createSlot}><Plus className="size-4" />Buat slot</Button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Memuat...</p>
        ) : slots.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada slot iklan.</p>
        ) : (
          <div className="space-y-4">
            {slots.map((slot) => (
              <div key={slot.id} className="space-y-3 rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold">{slot.name}</p>
                    <button type="button" onClick={() => copy(slot.slot_key, "Slot key")} className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground">
                      {slot.slot_key} <Copy className="size-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Eye className="size-3.5" />{Number(slot.impressions).toLocaleString("id-ID")} tayang</span>
                    <span className="inline-flex items-center gap-1"><MousePointerClick className="size-3.5" />{Number(slot.clicks).toLocaleString("id-ID")} klik</span>
                    <label className="inline-flex items-center gap-2">
                      <Switch checked={slot.is_active} onCheckedChange={(v) => updateSlot(slot, { is_active: v })} />
                      {slot.is_active ? "Aktif" : "Nonaktif"}
                    </label>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <select className={selectClass} value={slot.format} onChange={(e) => updateSlot(slot, { format: e.target.value as AdSlot["format"] })}>
                    <option value="horizontal">Horizontal (banner)</option>
                    <option value="vertical">Vertikal (sidebar)</option>
                    <option value="square">Kotak (kartu)</option>
                  </select>
                  <select className={selectClass} value={slot.style} onChange={(e) => updateSlot(slot, { style: e.target.value as AdSlot["style"] })}>
                    <option value="image_text">Gambar + deskripsi</option>
                    <option value="image">Gambar saja</option>
                  </select>
                  <select className={selectClass} value={slot.max_items} onChange={(e) => updateSlot(slot, { max_items: Number(e.target.value) })}>
                    {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} produk</option>)}
                  </select>
                  <Button variant="ghost" size="sm" className="ml-auto text-destructive" onClick={() => deleteSlot(slot)}>
                    <Trash2 className="size-4" />Hapus
                  </Button>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Kode sematan (untuk situs/aplikasi lain):</p>
                  <pre className="overflow-x-auto rounded-md bg-muted p-2 text-xs">{embedSnippet(slot)}</pre>
                  <Button variant="outline" size="sm" onClick={() => copy(embedSnippet(slot), "Kode sematan")}><Copy className="size-3.5" />Salin kode</Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-semibold">Produk yang boleh diiklankan</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {products.map((p) => (
              <label key={p.id} className="flex items-center gap-3 rounded-md border p-2">
                {p.image ? <img src={p.image} alt="" className="size-10 rounded object-cover" /> : <div className="size-10 rounded bg-muted" />}
                <span className="min-w-0 flex-1 truncate text-sm">{p.name}</span>
                <Switch checked={p.ad_enabled} onCheckedChange={(v) => toggleProduct(p, v)} />
              </label>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
