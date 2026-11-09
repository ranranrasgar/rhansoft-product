import { lazy, Suspense, useState, useEffect, useMemo } from "react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Gift, Search, Loader2, MessageCircle, MapPin } from "lucide-react"
import { toast } from "sonner"
import { authHeaders } from "@/lib/auth"
import { matchProvince, normalizeCity } from "@/lib/indonesia-provinces"

const TrialMap = lazy(() => import("@/pages/admin/TrialMap"))

type Trial = {
  id: number
  registration_id: string
  full_name: string
  email: string
  whatsapp: string
  company: string | null
  city: string | null
  province: string | null
  product_name: string | null
  status: string
  created_at: string
}

const STATUSES = [
  { value: "pending", label: "Baru" },
  { value: "contacted", label: "Sudah dihubungi" },
  { value: "active", label: "Aktif" },
  { value: "expired", label: "Berakhir" },
]

export function TrialsPage() {
  const [trials, setTrials] = useState<Trial[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  useEffect(() => {
    fetch("/api/trial/registrations", { headers: authHeaders() })
      .then(async (res) => {
        if (!res.ok) throw new Error("Gagal")
        return res.json()
      })
      .then(setTrials)
      .catch(() => toast.error("Gagal memuat pendaftar uji coba"))
      .finally(() => setLoading(false))
  }, [])

  const changeStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/trial/registrations/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error("Gagal")
      setTrials((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
      toast.success("Status diperbarui")
    } catch {
      toast.error("Gagal memperbarui status")
    }
  }

  // Sebaran dari Kota/Provinsi yang diisi pendaftar (tanpa GPS)
  const spread = useMemo(() => {
    const byProvince = new Map<string, { name: string; lat: number; lng: number; count: number }>()
    const byCity = new Map<string, number>()
    let unknown = 0
    for (const t of trials) {
      const prov = matchProvince(t.province, t.city)
      if (prov) {
        const cur = byProvince.get(prov.name) ?? { name: prov.name, lat: prov.lat, lng: prov.lng, count: 0 }
        cur.count += 1
        byProvince.set(prov.name, cur)
      } else {
        unknown += 1
      }
      const city = normalizeCity(t.city)
      if (city) byCity.set(city, (byCity.get(city) ?? 0) + 1)
    }
    const provinces = [...byProvince.values()].sort((a, b) => b.count - a.count)
    const cities = [...byCity.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
    return { provinces, cities, unknown }
  }, [trials])

  const q = search.toLowerCase()
  const filtered = trials.filter(
    (t) =>
      (filterStatus === "all" || t.status === filterStatus) &&
      (t.full_name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.whatsapp.includes(q) ||
        (t.company || "").toLowerCase().includes(q))
  )

  const waLink = (phone: string) =>
    `https://wa.me/${phone.startsWith("0") ? "62" + phone.slice(1) : phone}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Gift className="size-6" />
          Uji Coba Gratis
        </h1>
        <p className="text-sm text-muted-foreground">
          Calon pelanggan yang mendaftar uji coba. Hubungi lewat WhatsApp lalu perbarui statusnya.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {STATUSES.map((s) => (
          <div key={s.value} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold">
              {trials.filter((t) => t.status === s.value).length}
            </p>
          </div>
        ))}
      </div>

      {!loading && trials.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <MapPin className="size-4" />
            <h2 className="font-semibold">Sebaran Pendaftar</h2>
            <span className="text-xs text-muted-foreground">
              berdasarkan Kota/Provinsi yang diisi pendaftar
            </span>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Suspense fallback={<div className="h-[360px] animate-pulse rounded-xl bg-muted" />}>
                <TrialMap points={spread.provinces} />
              </Suspense>
            </div>
            <div className="space-y-5 text-sm">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Provinsi terbanyak</p>
                <ul className="space-y-1.5">
                  {spread.provinces.slice(0, 6).map((p) => (
                    <li key={p.name} className="flex items-center gap-2">
                      <span className="w-36 truncate">{p.name}</span>
                      <span className="h-2 flex-1 rounded-full bg-muted">
                        <span
                          className="block h-2 rounded-full bg-primary"
                          style={{ width: `${(p.count / spread.provinces[0].count) * 100}%` }}
                        />
                      </span>
                      <span className="w-6 text-right font-medium">{p.count}</span>
                    </li>
                  ))}
                  {spread.provinces.length === 0 && <li className="text-muted-foreground">Belum ada data provinsi</li>}
                </ul>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Kota terbanyak</p>
                <ul className="space-y-1">
                  {spread.cities.map(([city, n]) => (
                    <li key={city} className="flex justify-between">
                      <span className="truncate">{city}</span>
                      <span className="font-medium">{n}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {spread.unknown > 0 && (
                <p className="text-xs text-muted-foreground">
                  {spread.unknown} pendaftar tidak dikenali provinsinya, tidak tampil di peta.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, email, WhatsApp, perusahaan..."
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium text-muted-foreground">Pendaftar</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Kontak</th>
              <th className="hidden px-4 py-3 font-medium text-muted-foreground md:table-cell">
                Produk
              </th>
              <th className="hidden px-4 py-3 font-medium text-muted-foreground md:table-cell">
                Tanggal
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center">
                  <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-muted-foreground">
                  Belum ada pendaftar
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{t.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.company || t.registration_id}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{t.email}</p>
                    <a
                      href={waLink(t.whatsapp)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:underline"
                    >
                      <MessageCircle className="size-3" />
                      {t.whatsapp}
                    </a>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">{t.product_name || "-"}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {new Date(t.created_at).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-4 py-3">
                    <Select value={t.status} onValueChange={(v) => changeStatus(t.id, v)}>
                      <SelectTrigger className="h-8 w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
