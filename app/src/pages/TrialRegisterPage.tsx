import { useState } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  ShieldCheck,
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Check,
  FileText,
  MessageCircle,
} from "lucide-react"
import { toast } from "sonner"

const WHATSAPP_NUMBER = "6281333355871"


export function TrialRegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const productId = searchParams.get("product") || ""

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    whatsapp: "",
    address: "",
    city: "",
    province: "",
    company: "",
    position: "",
    productName: productId,
  })

  const [agreeTerms, setAgreeTerms] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)

  const update = (field: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [field]: value }))

  const validate = (): boolean => {
    if (!form.fullName || form.fullName.trim().length < 3) {
      toast.error("Mohon isi nama lengkap")
      return false
    }
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Email wajib diisi dan harus valid")
      return false
    }
    if (!form.whatsapp || form.whatsapp.replace(/\D/g, "").length < 10) {
      toast.error("Nomor WhatsApp wajib diisi (minimal 10 digit)")
      return false
    }
    if (!form.address || !form.city) {
      toast.error("Mohon lengkapi alamat domisili")
      return false
    }
    if (!agreeTerms) {
      toast.error("Mohon centang persetujuan syarat & ketentuan")
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setProcessing(true)

    try {
      const res = await fetch("/api/trial/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Network error" }))
        throw new Error(err.error || `HTTP ${res.status}`)
      }

      const data = await res.json()
      setSuccess(true)
      toast.success("Pendaftaran berhasil!", {
        description: `Email konfirmasi telah dikirim ke ${form.email}`,
      })

      // Auto-redirect to WhatsApp after 3 seconds
      setTimeout(() => {
        const waText = encodeURIComponent(
          `Halo Rhansoft, saya ${form.fullName} telah mendaftar uji coba gratis (No. ${data.registrationId}). Mohon info lanjutan.`
        )
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`, "_blank")
      }, 3000)
    } catch (err) {
      toast.error("Gagal mendaftar", { description: (err as Error).message })
    } finally {
      setProcessing(false)
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-green-200 bg-green-50 p-12 text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-green-500">
            <Check className="size-10 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-green-900">Pendaftaran Berhasil!</h1>
            <p className="mt-2 text-green-700">
              Terima kasih telah bergabung. Email surat resmi konfirmasi telah dikirim ke{" "}
              <strong>{form.email}</strong>.
            </p>
          </div>
          <div className="w-full rounded-xl bg-white p-6 text-left shadow-sm">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Langkah Selanjutnya
            </h3>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  1
                </span>
                <span>Cek email Anda (termasuk folder spam) untuk surat resmi konfirmasi dari Rhansoft.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  2
                </span>
                <span>Tim kami akan menghubungi via WhatsApp untuk konfirmasi & penjadwalan demo.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  3
                </span>
                <span>Akses uji coba gratis selama 14 hari, tanpa biaya.</span>
              </li>
            </ol>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/")}>
              Kembali ke Beranda
            </Button>
            <Button asChild>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                  `Halo Rhansoft, saya ${form.fullName} telah mendaftar uji coba gratis. Mohon info lanjutan.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="size-4" />
                Chat WhatsApp Sekarang
              </a>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Kembali ke Beranda
      </Link>

      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5">
          <ShieldCheck className="size-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Gratis 14 Hari • Tanpa Biaya
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Pendaftaran Uji Coba Gratis</h1>
        <p className="mt-3 text-muted-foreground">
          Lengkapi data berikut untuk mengaktifkan akun uji coba. Email & WhatsApp wajib diisi
          agar tim kami dapat mengirimkan surat resmi & konfirmasi.
        </p>
      </div>

      {/* Form */}
      <div className="space-y-8 rounded-2xl border border-border bg-card p-8 shadow-sm">
        {/* Section: Data Diri */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <User className="size-4 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Data Diri</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="fullName">
                Nama Lengkap <span className="text-destructive">*</span>
              </Label>
              <div className="relative mt-1.5">
                <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="fullName"
                  className="pl-10"
                  placeholder="Nama lengkap"
                  value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Section: Kontak (Wajib) */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <Mail className="size-4 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">
              Kontak <span className="text-sm font-normal text-destructive">(Wajib)</span>
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  className="pl-10"
                  placeholder="email@anda.com"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Surat resmi konfirmasi akan dikirim ke email ini.
              </p>
            </div>
            <div>
              <Label htmlFor="whatsapp">
                Nomor WhatsApp <span className="text-destructive">*</span>
              </Label>
              <div className="relative mt-1.5">
                <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="whatsapp"
                  className="pl-10"
                  placeholder="08xxxxxxxxxx"
                  inputMode="tel"
                  value={form.whatsapp}
                  onChange={(e) => update("whatsapp", e.target.value)}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Tim kami akan menghubungi via WhatsApp untuk konfirmasi.
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Section: Domisili */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <MapPin className="size-4 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Alamat Domisili</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="address">Alamat Lengkap</Label>
              <Input
                id="address"
                placeholder="Jalan, RT/RW, Kelurahan"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="city">Kota / Kabupaten</Label>
              <Input
                id="city"
                placeholder="Kota domisili"
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="province">Provinsi</Label>
              <Input
                id="province"
                placeholder="Provinsi"
                value={form.province}
                onChange={(e) => update("province", e.target.value)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Section: Produk & Organisasi */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="size-4 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Produk & Organisasi</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="productName">Produk yang Diminati (opsional)</Label>
              <Input
                id="productName"
                placeholder="Nama produk software yang ingin diuji coba"
                value={form.productName}
                onChange={(e) => update("productName", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="company">Nama Perusahaan / Instansi</Label>
              <Input
                id="company"
                placeholder="Opsional"
                value={form.company}
                onChange={(e) => update("company", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="position">Jabatan</Label>
              <Input
                id="position"
                placeholder="Opsional"
                value={form.position}
                onChange={(e) => update("position", e.target.value)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Persetujuan */}
        <div className="space-y-3">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-1 size-4 rounded border-border"
            />
            <span className="text-sm text-muted-foreground">
              Saya menyatakan data di atas benar dan menyetujui{" "}
              <Link to="/page/syarat-ketentuan" className="font-medium text-primary hover:underline">
                Syarat & Ketentuan
              </Link>{" "}
              serta{" "}
              <Link to="/page/privasi" className="font-medium text-primary hover:underline">
                Kebijakan Privasi
              </Link>{" "}
              Rhansoft. Saya mengizinkan Rhansoft mengirimkan email & WhatsApp konfirmasi.
            </span>
          </label>
        </div>

        {/* Submit */}
        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full"
            disabled={processing || !agreeTerms}
            onClick={handleSubmit}
          >
            {processing ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                Memproses pendaftaran...
              </>
            ) : (
              <>
                <FileText className="size-5" />
                Daftar Uji Coba Gratis
              </>
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Dengan mendaftar, Anda mendapatkan akses uji coba gratis 14 hari + surat resmi via email.
          </p>
        </div>
      </div>

      {/* Trust badges */}
      <div className="mt-6 grid grid-cols-3 gap-4 text-center">
        <div className="rounded-lg border border-border bg-card p-4">
          <ShieldCheck className="mx-auto mb-2 size-6 text-primary" />
          <p className="text-xs font-medium">Data Terenkripsi</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <Mail className="mx-auto mb-2 size-6 text-primary" />
          <p className="text-xs font-medium">Surat Resmi via Email</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <MessageCircle className="mx-auto mb-2 size-6 text-primary" />
          <p className="text-xs font-medium">Konfirmasi via WhatsApp</p>
        </div>
      </div>
    </div>
  )
}
