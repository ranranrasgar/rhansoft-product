import { useState } from "react"
import { Button } from "@/components/ui/button"
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
} from "lucide-react"
import { toast } from "sonner"
import { AdsSettings } from "./AdsSettings"

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Store
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-5" />
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}

export function SettingsPage() {
  const [storeName, setStoreName] = useState("Rhansoft Store")
  const [storeUrl, setStoreUrl] = useState("https://apps.rhantech.com")
  const [midtransEnv, setMidtransEnv] = useState("sandbox")
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [r2Enabled, setR2Enabled] = useState(true)
  const [maintenanceMode, setMaintenanceMode] = useState(false)

  const handleSave = () => {
    toast.success("Pengaturan disimpan", {
      description: "Perubahan akan diterapkan setelah server di-restart",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <SettingsIcon className="size-6" />
          Pengaturan Sistem
        </h1>
        <p className="text-sm text-muted-foreground">
          Konfigurasi global aplikasi dan integrasi
        </p>
      </div>

      {/* Store settings */}
      <SettingsSection
        icon={Store}
        title="Informasi Toko"
        description="Identitas dan URL toko Anda"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="storeName">Nama Toko</Label>
            <Input id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="storeUrl">URL Toko</Label>
            <Input id="storeUrl" value={storeUrl} onChange={(e) => setStoreUrl(e.target.value)} />
          </div>
        </div>
      </SettingsSection>

      {/* Payment settings */}
      <SettingsSection
        icon={CreditCard}
        title="Payment Gateway (Midtrans)"
        description="Konfigurasi payment gateway Midtrans"
      >
        <div className="flex flex-col gap-1.5">
          <Label>Environment</Label>
          <div className="flex gap-2">
            <Button
              variant={midtransEnv === "sandbox" ? "default" : "outline"}
              size="sm"
              onClick={() => setMidtransEnv("sandbox")}
            >
              Sandbox
            </Button>
            <Button
              variant={midtransEnv === "production" ? "default" : "outline"}
              size="sm"
              onClick={() => setMidtransEnv("production")}
            >
              Production
            </Button>
          </div>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Mode Maintenance</p>
            <p className="text-xs text-muted-foreground">
              Nonaktifkan transaksi sementara
            </p>
          </div>
          <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
        </div>
      </SettingsSection>

      {/* Email settings */}
      <SettingsSection
        icon={Mail}
        title="Email Konfigurasi"
        description="Pengaturan SMTP untuk email transaksional"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Aktifkan Email</p>
            <p className="text-xs text-muted-foreground">
              Kirim email konfirmasi pesanan ke pelanggan
            </p>
          </div>
          <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
        </div>
        <Separator />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>SMTP Host</Label>
            <Input value="smtp.gmail.com" disabled />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>SMTP Port</Label>
            <Input value="587" disabled />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>From Email</Label>
            <Input value="ranran.rhansoft@gmail.com" disabled />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>From Name</Label>
            <Input value="rhantech.com" disabled />
          </div>
        </div>
      </SettingsSection>

      {/* Storage settings */}
      <SettingsSection
        icon={Database}
        title="Cloudflare R2 Storage"
        description="Penyimpanan gambar produk"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Aktifkan R2 Upload</p>
            <p className="text-xs text-muted-foreground">
              Upload gambar produk ke Cloudflare R2
            </p>
          </div>
          <Switch checked={r2Enabled} onCheckedChange={setR2Enabled} />
        </div>
        <Separator />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Bucket Name</Label>
            <Input value="rhansoft-product" disabled />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Public URL</Label>
            <Input value="https://pub-d1a4a777f8474008ac7baf230a1e406c.r2.dev" disabled />
          </div>
        </div>
      </SettingsSection>

      {/* Rhansoft Ads: ad slots for other apps (saved directly, not by the button below) */}
      <AdsSettings />

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg" className="rounded-full">
          <Save className="size-4" />
          Simpan Pengaturan
        </Button>
      </div>
    </div>
  )
}
