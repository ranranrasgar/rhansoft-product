import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Settings as SettingsIcon,
  Store,
  CreditCard,
  Mail,
  Database,
  Save,
  Truck,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { authHeaders } from "@/lib/auth"
import { PROVINCES } from "@/lib/indonesia-provinces"

function SettingsSection({
  icon: Icon,
  title,
  description,
  inactive = false,
  children,
}: {
  icon: typeof Store
  title: string
  description: string
  inactive?: boolean
  children: React.ReactNode
}) {
  return (
    <Card className={inactive ? "opacity-70" : undefined}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-5" />
          {title}
          {inactive && <Badge variant="outline">Belum aktif</Badge>}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* fieldset disabled mengunci semua kontrol di bagian yang belum berfungsi */}
        <fieldset disabled={inactive} className="space-y-4">
          {children}
        </fieldset>
      </CardContent>
    </Card>
  )
}

type ShippingSettings = {
  enabled: boolean
  mode: "flat" | "province"
  label: string
  flat_amount: number
  default_amount: number
  province_rates: Record<string, number>
}

// Nominal disimpan sebagai teks angka saja agar "15.000" tidak terbaca sebagai 15
const digitsOnly = (v: string) => v.replace(/\D/g, "")
const toAmount = (v: string) => (v === "" ? 0 : Number(v))

function ShippingSection() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [mode, setMode] = useState<"flat" | "province">("flat")
  const [label, setLabel] = useState("Ongkos Kirim")
  const [flatAmount, setFlatAmount] = useState("")
  const [defaultAmount, setDefaultAmount] = useState("")
  const [rates, setRates] = useState<Record<string, string>>({})

  const apply = (s: ShippingSettings) => {
    setEnabled(s.enabled)
    setMode(s.mode)
    setLabel(s.label)
    setFlatAmount(String(s.flat_amount))
    setDefaultAmount(String(s.default_amount))
    setRates(Object.fromEntries(Object.entries(s.province_rates).map(([k, v]) => [k, String(v)])))
  }

  // Bila gagal dimuat, form disembunyikan: menyimpan nilai awal akan menimpa pengaturan yang sebenarnya
  const [loadError, setLoadError] = useState(false)
  const load = () => {
    setLoading(true)
    setLoadError(false)
    fetch("/api/admin/settings/shipping", { headers: authHeaders() })
      .then(async (res) => {
        if (!res.ok) throw new Error()
        apply(await res.json())
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const save = async () => {
    setSaving(true)
    try {
      const province_rates = Object.fromEntries(
        Object.entries(rates)
          .filter(([, v]) => v !== "")
          .map(([k, v]) => [k, Number(v)])
      )
      const res = await fetch("/api/admin/settings/shipping", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          enabled,
          mode,
          label,
          flat_amount: toAmount(flatAmount),
          default_amount: toAmount(defaultAmount),
          province_rates,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan")
      apply(data)
      toast.success("Pengaturan ongkos kirim disimpan")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan")
    } finally {
      setSaving(false)
    }
  }

  return (
    <SettingsSection
      icon={Truck}
      title="Ongkos Kirim"
      description="Biaya tambahan per pesanan di checkout. Dihitung di server; nonaktif berarti tanpa ongkir."
    >
      {loading ? (
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      ) : loadError ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          Gagal memuat pengaturan ongkos kirim. Pengaturan tidak bisa diubah sampai berhasil dimuat.
          <Button size="sm" variant="outline" onClick={load}>
            Coba lagi
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Aktifkan ongkos kirim</p>
              <p className="text-xs text-muted-foreground">Bila nonaktif, pelanggan tidak dikenai ongkir</p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
          <Separator />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Cara menghitung</Label>
              <div className="flex gap-2">
                <Button size="sm" variant={mode === "flat" ? "default" : "outline"} onClick={() => setMode("flat")}>
                  Biaya tetap
                </Button>
                <Button
                  size="sm"
                  variant={mode === "province" ? "default" : "outline"}
                  onClick={() => setMode("province")}
                >
                  Per provinsi
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="shipLabel">Label di checkout</Label>
              <Input id="shipLabel" value={label} maxLength={40} onChange={(e) => setLabel(e.target.value)} />
            </div>
          </div>

          {mode === "flat" ? (
            <div className="flex flex-col gap-1.5 sm:max-w-xs">
              <Label htmlFor="flatAmount">Biaya tetap (Rp)</Label>
              <Input
                id="flatAmount"
                inputMode="numeric"
                value={flatAmount}
                onChange={(e) => setFlatAmount(digitsOnly(e.target.value))}
                placeholder="0"
              />
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1.5 sm:max-w-xs">
                <Label htmlFor="defaultAmount">Tarif standar (Rp)</Label>
                <Input
                  id="defaultAmount"
                  inputMode="numeric"
                  value={defaultAmount}
                  onChange={(e) => setDefaultAmount(digitsOnly(e.target.value))}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">Dipakai untuk provinsi yang dikosongkan di bawah</p>
              </div>
              <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                {PROVINCES.map((p) => (
                  <div key={p.name} className="flex items-center gap-2">
                    <Label htmlFor={`rate-${p.name}`} className="w-40 shrink-0 text-xs font-normal">
                      {p.name}
                    </Label>
                    <Input
                      id={`rate-${p.name}`}
                      inputMode="numeric"
                      className="h-8"
                      value={rates[p.name] ?? ""}
                      onChange={(e) => setRates((r) => ({ ...r, [p.name]: digitsOnly(e.target.value) }))}
                      placeholder="standar"
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="flex justify-end">
            <Button onClick={save} disabled={saving} className="rounded-full">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Simpan ongkos kirim
            </Button>
          </div>
        </>
      )}
    </SettingsSection>
  )
}

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <SettingsIcon className="size-6" />
          Pengaturan Sistem
        </h1>
        <p className="text-sm text-muted-foreground">
          Konfigurasi global aplikasi dan integrasi. Bagian berlabel "Belum aktif" belum tersambung ke server.
        </p>
      </div>

      <ShippingSection />

      {/* Bagian di bawah ini belum tersambung ke server: ditampilkan sebagai informasi saja */}
      <SettingsSection icon={Store} title="Informasi Toko" description="Identitas dan URL toko Anda" inactive>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="storeName">Nama Toko</Label>
            <Input id="storeName" value="Rhansoft Store" readOnly />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="storeUrl">URL Toko</Label>
            <Input id="storeUrl" value="https://app.rhantech.com" readOnly />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={CreditCard}
        title="Payment Gateway (Midtrans)"
        description="Environment yang dipakai ditentukan MIDTRANS_ENV di .env server"
        inactive
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Mode Maintenance</p>
            <p className="text-xs text-muted-foreground">Nonaktifkan transaksi sementara</p>
          </div>
          <Switch checked={false} />
        </div>
      </SettingsSection>

      <SettingsSection
        icon={Mail}
        title="Email Konfigurasi"
        description="Pengaturan SMTP diatur di .env server"
        inactive
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>SMTP Host</Label>
            <Input value="smtp.gmail.com" readOnly />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>SMTP Port</Label>
            <Input value="587" readOnly />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={Database}
        title="Cloudflare R2 Storage"
        description="Penyimpanan gambar produk, diatur di .env server"
        inactive
      >
        <div className="flex flex-col gap-1.5 sm:max-w-sm">
          <Label>Bucket Name</Label>
          <Input value="rhansoft-product" readOnly />
        </div>
      </SettingsSection>
    </div>
  )
}
