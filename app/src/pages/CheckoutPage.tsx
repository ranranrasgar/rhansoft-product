import { useState, useEffect } from "react"
import { useNavigate, Link, Navigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Loader2,
  CreditCard,
  Wallet,
  Landmark,
  Check,
} from "lucide-react"
import { toast } from "sonner"
import { useCart } from "@/hooks/useCart"
import { PROVINCES } from "@/lib/indonesia-provinces"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/useAuth"
import {
  loadSnapScript,
  requestSnapToken,
  payWithSnap,
  type MidtransCustomer,
} from "@/lib/midtrans"

function formatPrice(n: number) {
  return n.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  })
}

type TaxConfig = { enabled: boolean; rate: number; label: string }

type ShippingConfig = {
  enabled: boolean
  mode: "flat" | "province"
  label: string
  flat_amount: number
  default_amount: number
  province_rates: Record<string, number>
}

type PaymentMethod = "card" | "gopay" | "bank_transfer" | "shopeepay"

const paymentOptions: {
  id: PaymentMethod
  label: string
  description: string
  icon: typeof CreditCard
}[] = [
  {
    id: "card",
    label: "Kartu Kredit / Debit",
    description: "Visa, Mastercard, JCB, Amex",
    icon: CreditCard,
  },
  {
    id: "gopay",
    label: "GoPay",
    description: "Bayar dengan e-wallet GoPay",
    icon: Wallet,
  },
  {
    id: "bank_transfer",
    label: "Transfer Bank (VA)",
    description: "BCA, BNI, BRI, Mandiri",
    icon: Landmark,
  },
  {
    id: "shopeepay",
    label: "ShopeePay",
    description: "Bayar dengan e-wallet ShopeePay",
    icon: Wallet,
  },
]

const trustBadges = [
  "Pembayaran Aman",
  "Enkripsi SSL 256-bit",
  "Garansi Lisensi",
  "Support Indonesia",
]

export function CheckoutPage() {
  const navigate = useNavigate()
  const { items, subtotal, clear, itemCount } = useCart()
  const { user, loading: authLoading } = useAuth()

  const [shipping, setShipping] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "IDN", // ISO 3166-1 alpha-3 untuk Midtrans
  })

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card")
  // null = belum dimuat; [] = pilihan default Midtrans (semua metode aktif); isi = daftar terbatas
  const [enabledMethods, setEnabledMethods] = useState<PaymentMethod[] | null>(null)
  const [processing, setProcessing] = useState(false)
  const [snapReady, setSnapReady] = useState(false)

  // Isi otomatis nama dan email dari akun yang login
  useEffect(() => {
    if (!user) return
    setShipping((s) => ({
      ...s,
      firstName: s.firstName || user.first_name,
      lastName: s.lastName || user.last_name,
      email: s.email || user.email,
    }))
  }, [user])

  // Hanya tampilkan metode yang aktif di server (sesuai channel Midtrans)
  useEffect(() => {
    fetch("/api/midtrans-config")
      .then((res) => (res.ok ? res.json() : null))
      .then((conf) => {
        const list: PaymentMethod[] = conf?.paymentMethods ?? []
        setEnabledMethods(list)
        if (list.length) setPaymentMethod((cur) => (list.includes(cur) ? cur : list[0]))
      })
      .catch(() => setEnabledMethods([]))
  }, [])

  // Pengaturan ongkos kirim dan pajak dari admin (perkiraan tampilan; total resmi dihitung server)
  const [shippingConfig, setShippingConfig] = useState<ShippingConfig | null>(null)
  const [taxConfig, setTaxConfig] = useState<TaxConfig | null>(null)
  const [province, setProvince] = useState("")
  const [shippingConfigError, setShippingConfigError] = useState(false)
  // Tombol Bayar menunggu kedua konfigurasi ini, agar total yang tampil sama dengan yang ditagih
  const loadShippingConfig = () => {
    setShippingConfigError(false)
    const get = (url: string) =>
      fetch(url).then((res) => {
        if (!res.ok) throw new Error()
        return res.json()
      })
    Promise.all([get("/api/shipping-config"), get("/api/tax-config")])
      .then(([shippingConf, taxConf]) => {
        setShippingConfig(shippingConf)
        setTaxConfig(taxConf)
      })
      .catch(() => setShippingConfigError(true))
  }
  useEffect(loadShippingConfig, [])
  const needsProvince = Boolean(shippingConfig?.enabled && shippingConfig.mode === "province")

  const useMidtransDefault = enabledMethods !== null && enabledMethods.length === 0
  const visiblePaymentOptions = paymentOptions.filter((o) => enabledMethods?.includes(o.id))

  // Sama dengan server (lib/shippingSettings.mjs): nonaktif 0, flat satu nominal, provinsi tarif atau tarif standar
  const shippingCost = !shippingConfig?.enabled
    ? 0
    : shippingConfig.mode === "flat"
      ? shippingConfig.flat_amount
      : province
        ? (shippingConfig.province_rates[province] ?? shippingConfig.default_amount)
        : 0
  const shippingLabel = shippingConfig?.label || "Ongkos Kirim"
  // Sama dengan server (lib/taxSettings.mjs): nonaktif atau 0% berarti tanpa pajak; hanya atas subtotal
  const tax = taxConfig?.enabled && taxConfig.rate ? Math.round((subtotal * taxConfig.rate) / 100) : 0
  const total = subtotal + shippingCost + tax

  const update = (field: keyof typeof shipping, value: string) =>
    setShipping((s) => ({ ...s, [field]: value }))

  const validate = (): boolean => {
    if (!shipping.firstName || !shipping.lastName) {
      toast.error("Mohon isi nama lengkap Anda")
      return false
    }
    if (!shipping.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipping.email)) {
      toast.error("Mohon masukkan email yang valid")
      return false
    }
    if (!shipping.phone || shipping.phone.length < 8) {
      toast.error("Mohon masukkan nomor telepon yang valid")
      return false
    }
    if (!shipping.address || !shipping.city || !shipping.postalCode) {
      toast.error("Mohon lengkapi alamat pengiriman")
      return false
    }
    if (needsProvince && !province) {
      toast.error("Mohon pilih provinsi")
      return false
    }
    return true
  }

  const handlePay = async () => {
    if (items.length === 0) {
      toast.error("Keranjang Anda kosong")
      navigate("/")
      return
    }

    if (!validate()) return

    setProcessing(true)

    try {
      // 1. Ensure Snap.js is loaded
      if (!snapReady) {
        toast.info("Memuat gateway pembayaran aman...")
        await loadSnapScript()
        setSnapReady(true)
      }

      // 2. Build Midtrans transaction parameters
      const orderId = `RSF-${Date.now()}`
      const customer: MidtransCustomer = {
        first_name: shipping.firstName,
        last_name: shipping.lastName,
        email: shipping.email,
        phone: shipping.phone,
        shipping_address: {
          first_name: shipping.firstName,
          last_name: shipping.lastName,
          address: shipping.address,
          city: shipping.city,
          postal_code: shipping.postalCode,
          country_code: shipping.country,
          phone: shipping.phone,
        },
      }

      const itemDetails = items.map((i) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        brand: "Rhansoft",
        category: i.category,
      }))

      // 3. Request Snap token from backend (real Midtrans API)
      toast.info("Membuat transaksi...")
      const { token, snap_url, client_key } = await requestSnapToken({
        order_id: orderId,
        gross_amount: Math.round(total),
        customer,
        items: itemDetails,
        shipping_cost: shippingCost,
        tax,
        payment_method: useMidtransDefault ? undefined : paymentMethod,
        province: needsProvince ? province : undefined,
      })

      // 4. Open Midtrans Snap payment modal
      toast.info("Membuka jendela pembayaran...")
      const result = await payWithSnap(token, snap_url, client_key)

      // 5. Handle payment result
      if (result.status === "success") {
        toast.success("Pembayaran berhasil!", {
          description: `Pesanan ${orderId} dikonfirmasi`,
        })
        clear()
        navigate("/akun/pesanan")
      } else if (result.status === "pending") {
        toast.info("Pembayaran tertunda", {
          description: "Selesaikan pembayaran dalam batas waktu yang ditentukan",
        })
        clear()
        navigate("/akun/pesanan")
      } else if (result.status === "closed") {
        // Pesanan sudah tercatat; lanjutkan pembayaran dari Pesanan Saya (tanpa membuat pesanan ganda)
        toast.warning("Pembayaran belum selesai", {
          description: "Pesanan Anda tersimpan. Lanjutkan pembayaran dari halaman Pesanan Saya.",
        })
        clear()
        navigate("/akun/pesanan")
      } else {
        toast.error("Pembayaran gagal", {
          description: "Silakan coba metode pembayaran lain",
        })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan"
      toast.error("Error pembayaran", { description: msg })
      // Server menolak bila total berubah (ongkir/harga diperbarui): muat ulang pengaturan agar total diperbarui
      loadShippingConfig()
    } finally {
      setProcessing(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span className="size-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-32">
        <p className="text-2xl font-semibold">Keranjang Anda kosong</p>
        <p className="mt-2 text-muted-foreground">
          Tambahkan beberapa produk sebelum checkout.
        </p>
        <Button asChild className="mt-6 rounded-full">
          <Link to="/">Lanjut belanja</Link>
        </Button>
      </div>
    )
  }

  // Wajib login agar pesanan terhubung ke akun (riwayat, bayar ulang, lisensi)
  if (!user) {
    return <Navigate to="/login" replace state={{ from: "/checkout" }} />
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <Button
        variant="ghost"
        size="sm"
        className="mb-6 -ml-2"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="size-4" />
        Kembali
      </Button>

      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Checkout</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {itemCount} item dalam keranjang Anda
      </p>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px] lg:gap-12">
        {/* Left: Forms */}
        <div className="flex flex-col gap-8">
          {/* Shipping info */}
          <div className="rounded-2xl border border-border p-6">
            <h2 className="text-lg font-semibold">Informasi Pengiriman</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Kemana kami kirim pesanan Anda?
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="firstName">Nama Depan</Label>
                <Input
                  id="firstName"
                  value={shipping.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                  placeholder="Budi"
                  autoComplete="given-name"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lastName">Nama Belakang</Label>
                <Input
                  id="lastName"
                  value={shipping.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                  placeholder="Santoso"
                  autoComplete="family-name"
                />
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={shipping.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="budi@example.com"
                  autoComplete="email"
                />
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="phone">Telepon</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={shipping.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="+62 812 3456 7890"
                  autoComplete="tel"
                />
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="address">Alamat Lengkap</Label>
                <Input
                  id="address"
                  value={shipping.address}
                  onChange={(e) => update("address", e.target.value)}
                  placeholder="Jl. Sudirman No. 1, Jakarta"
                  autoComplete="street-address"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="city">Kota</Label>
                <Input
                  id="city"
                  value={shipping.city}
                  onChange={(e) => update("city", e.target.value)}
                  placeholder="Jakarta"
                  autoComplete="address-level2"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="postalCode">Kode Pos</Label>
                <Input
                  id="postalCode"
                  value={shipping.postalCode}
                  onChange={(e) => update("postalCode", e.target.value)}
                  placeholder="12190"
                  autoComplete="postal-code"
                />
              </div>
              {needsProvince && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="province">Provinsi</Label>
                  <Select value={province} onValueChange={setProvince}>
                    <SelectTrigger id="province" className="w-full">
                      <SelectValue placeholder="Pilih provinsi" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVINCES.map((p) => (
                        <SelectItem key={p.name} value={p.name}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Payment method */}
          <div className="rounded-2xl border border-border p-6">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Metode Pembayaran</h2>
              <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">
                Midtrans
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Pilih metode pembayaran favorit Anda. Didukung oleh Midtrans.
            </p>

            {useMidtransDefault && (
              <p className="mt-6 rounded-xl border border-border p-4 text-sm text-muted-foreground">
                Anda akan memilih metode pembayaran (kartu, e-wallet, transfer bank, dan lainnya)
                di jendela pembayaran Midtrans setelah menekan tombol Bayar.
              </p>
            )}

            <RadioGroup
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
              className="mt-6 gap-3"
            >
              {visiblePaymentOptions.map((opt) => {
                const Icon = opt.icon
                const isSelected = paymentMethod === opt.id
                return (
                  <Label
                    key={opt.id}
                    htmlFor={`pay-${opt.id}`}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/20 bg-accent/50"
                        : "border-border hover:border-muted-foreground/40"
                    }`}
                  >
                    <RadioGroupItem value={opt.id} id={`pay-${opt.id}`} className="sr-only" />
                    <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                      <Icon className="size-5" />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <span className="text-sm font-semibold">{opt.label}</span>
                      <span className="text-xs text-muted-foreground">{opt.description}</span>
                    </div>
                    <div
                      className={`flex size-5 items-center justify-center rounded-full border-2 ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border"
                      }`}
                    >
                      {isSelected && <Check className="size-3" />}
                    </div>
                  </Label>
                )
              })}
            </RadioGroup>

            <div className="mt-4 flex items-start gap-2 rounded-lg bg-accent/50 p-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              <p className="text-xs text-muted-foreground">
                Pembayaran Anda diamankan oleh Midtrans Snap.
                Transaksi dienkripsi dengan SSL 256-bit.
                Kami tidak pernah menyimpan informasi kartu Anda.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Order summary */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border border-border p-6">
            <h2 className="text-lg font-semibold">Ringkasan Pesanan</h2>

            <ul className="mt-4 space-y-3">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-none bg-muted/20 p-1">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="max-h-full max-w-full object-contain"
                    />
                    <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col">
                    <p className="text-sm font-medium leading-tight">{item.name}</p>
                    <p className="text-[11px] text-muted-foreground">{item.category}</p>
                    <p className="mt-0.5 text-xs font-semibold">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <Separator className="my-4" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              {shippingCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{shippingLabel}</span>
                  <span className="font-medium">{formatPrice(shippingCost)}</span>
                </div>
              )}
              {tax > 0 && taxConfig && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {taxConfig.label} ({taxConfig.rate.toLocaleString("id-ID")}%)
                  </span>
                  <span className="font-medium">{formatPrice(tax)}</span>
                </div>
              )}
            </div>

            <Separator className="my-4" />

            <div className="flex items-center justify-between">
              <span className="text-base font-semibold">Total</span>
              <span className="text-2xl font-semibold">{formatPrice(total)}</span>
            </div>

            {shippingConfigError && (
              <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                Gagal memuat ongkos kirim dan pajak, jadi total belum bisa dipastikan.{" "}
                <button type="button" className="font-semibold underline" onClick={loadShippingConfig}>
                  Coba lagi
                </button>
              </div>
            )}

            <Button
              size="lg"
              className="mt-6 w-full rounded-full"
              onClick={handlePay}
              disabled={processing || shippingConfig === null || taxConfig === null}
            >
              {processing ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Memproses pembayaran...
                </>
              ) : (
                <>
                  Bayar {formatPrice(total)}
                  <ArrowRight className="size-5" />
                </>
              )}
            </Button>

            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              Dengan melakukan pemesanan, Anda menyetujui Syarat & Ketentuan dan Kebijakan Privasi kami.
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {trustBadges.map((badge) => (
                <span
                  key={badge}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground"
                >
                  <ShieldCheck className="size-3" />
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
