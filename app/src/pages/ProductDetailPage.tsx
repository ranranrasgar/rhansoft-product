import { useState, useMemo } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Star,
  Plus,
  Minus,
  ShoppingBag,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Check,
  Cpu,
  Database,
  HardDrive,
  Tag,
  Monitor,
  Headphones,
  PackageCheck,
  Download,
  ExternalLink,
  Sparkles,
  Target,
  TrendingUp,
  Lightbulb,
  Settings2,
  Smartphone,
  ChevronRight,
  ChevronLeft,
  BarChart3,
  Cloud,
  Lock,
  MessageCircle,
  Laptop,
} from "lucide-react"
import { toast } from "sonner"
import { getRelatedProducts, type Product } from "@/data/store"
import { useProducts } from "@/hooks/useProducts"
import { useCart } from "@/hooks/useCart"
import { useNavContext } from "@/lib/navigate"

function formatPrice(n: number) {
  return n.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  })
}

const WHATSAPP_NUMBER = "6281333335871"

function StarRating({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`size-4 ${
              i < Math.round(rating)
                ? "fill-amber-400 text-amber-400"
                : "fill-muted text-muted-foreground/40"
            }`}
          />
        ))}
      </div>
      <span className="text-sm text-muted-foreground">
        {rating} ({reviews.toLocaleString()} ulasan)
      </span>
    </div>
  )
}

function RelatedProductCard({ product }: { product: Product }) {
  const navigate = useNavigate()
  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-none border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
      onClick={() => {
        navigate(`/product/${product.id}`)
        window.scrollTo({ top: 0, behavior: "smooth" })
      }}
    >
      <div className="relative aspect-[4/3] flex items-center justify-center overflow-hidden rounded-none bg-muted/20 p-2">
        <img
          src={product.image}
          alt={product.name}
          className="max-h-full max-w-full object-contain"
          loading="lazy"
        />
        {product.badge && (
          <Badge
            variant={product.badge === "Sale" ? "destructive" : "default"}
            className="absolute left-3 top-3 rounded-none"
          >
            {product.badge}
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {product.category}
        </p>
        <h4 className="mt-1 text-sm font-semibold leading-tight">{product.name}</h4>
        <div className="mt-auto flex items-baseline gap-2 pt-3">
          <span className="text-base font-semibold">{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

const trustFeatures = [
  { icon: ShieldCheck, title: "Lisensi Seumur Hidup", desc: "Bayar sekali, gunakan selamanya tanpa biaya langganan." },
  { icon: RotateCcw, title: "Garansi 30 Hari", desc: "Jaminan uang kembali jika software tidak sesuai harapan." },
  { icon: Headphones, title: "Support Indonesia", desc: "Tim lokal siap bantu via WA, email, dan remote desktop." },
  { icon: PackageCheck, title: "Instalasi Gratis", desc: "Bantuan setup awal dan training penggunaan dasar." },
]

const defaultBenefits = [
  "Meningkatkan efisiensi operasional harian",
  "Mengurangi human error dalam pencatatan",
  "Laporan bisnis akurat dan real-time",
  "Mudah digunakan, bahkan untuk pemula",
]

const featureIcons = [
  Target, TrendingUp, BarChart3, Settings2, Lock, Lightbulb,
  Smartphone, Cpu, Database, Cloud, Sparkles, Check,
]

const faqItems = [
  { q: "Apakah lisensi bisa dipakai untuk lebih dari 1 komputer?", a: "Lisensi default untuk 1 PC. Untuk multi-PC tersedia lisensi LAN dengan harga khusus." },
  { q: "Apakah ada biaya langganan tahunan?", a: "Tidak. Lisensi bersifat lifetime — bayar sekali, gunakan selamanya. Update minor gratis." },
  { q: "Bagaimana cara mendapatkan support teknis?", a: "Support via WhatsApp, email, dan remote desktop Senin–Sabtu, 09.00–18.00 WIB." },
  { q: "Apakah software bisa dicoba sebelum beli?", a: "Ya, tersedia versi demo gratis. Klik tombol Demo / Konsultasi untuk mencoba fitur utama." },
]

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { products } = useProducts()
  const { navigate: navScroll } = useNavContext()

  const product = useMemo(() => (id ? products.find((p) => p.id === id) : undefined), [id, products])

  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)

  if (!product) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-32">
        <p className="text-lg font-semibold">Produk tidak ditemukan</p>
        <Button asChild className="mt-4 rounded-full">
          <Link to="/">Kembali ke beranda</Link>
        </Button>
      </div>
    )
  }

  const related = getRelatedProducts(product, products)
  const images = useMemo(() => {
    const list = product.gallery?.length ? product.gallery : [product.image]
    return list.filter(Boolean)
  }, [product])

  const benefits = product.benefits?.length ? product.benefits : defaultBenefits

  const steps = useMemo(() => {
    if (!product.installTutorial?.trim()) return []
    return product.installTutorial
      .split(/\n/)
      .map((s) => s.trim())
      .filter(Boolean)
  }, [product.installTutorial])

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) addItem(product)
    toast.success(`${product.name} ditambahkan ke keranjang`, {
      description: `${quantity} × ${formatPrice(product.price)}`,
    })
  }

  const handleBuyNow = () => {
    addItem(product)
    toast.success(`${product.name} ditambahkan ke keranjang`, {
      description: "Mengalihkan ke checkout...",
    })
    setTimeout(() => navigate("/checkout"), 400)
  }

  const openDemoWA = () => {
    const text = encodeURIComponent(`Halo Rhansoft, saya ingin demo / konsultasi untuk ${product.name}.`)
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank")
  }

  const openContactWA = () => {
    const text = encodeURIComponent(`Halo Rhansoft, saya tertarik dengan ${product.name}. Mohon info lebih lanjut.`)
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank")
  }

  const handleBreadcrumbCategory = () => {
    navScroll("category", product.category)
  }

  const nextImage = () => setSelectedImage((i) => (i + 1) % images.length)
  const prevImage = () => setSelectedImage((i) => (i - 1 + images.length) % images.length)

  return (
    <div className="bg-background">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-muted/30">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 text-sm text-muted-foreground md:px-6">
          <Link to="/" className="hover:text-foreground">Beranda</Link>
          <ChevronRight className="size-3" />
          <button className="hover:text-foreground cursor-pointer" onClick={handleBreadcrumbCategory}>
            {product.category}
          </button>
          <ChevronRight className="size-3" />
          <span className="text-foreground">{product.name}</span>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -right-40 -top-40 h-[28rem] w-[28rem] rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: product.color }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-16">
          <Button variant="ghost" size="sm" className="mb-6 -ml-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="size-4" />
            Kembali
          </Button>

          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
            {/* Text */}
            <div className="order-2 lg:order-1">
              <p className="text-[13px] font-semibold uppercase tracking-widest" style={{ color: product.color }}>
                {product.category}
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">
                {product.name}
              </h1>
              <div className="mt-4">
                <StarRating rating={product.rating} reviews={product.reviews} />
              </div>

              <div className="mt-6 flex items-baseline gap-3">
                <span className="text-3xl font-bold md:text-4xl">{formatPrice(product.price)}</span>
                {product.originalPrice && (
                  <>
                    <span className="text-lg text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
                    <Badge variant="destructive" className="text-xs">Hemat {formatPrice(product.originalPrice - product.price)}</Badge>
                  </>
                )}
              </div>

              <p className="mt-6 text-base leading-relaxed text-muted-foreground md:text-lg">
                {product.description}
              </p>

              {/* Highlights mini */}
              <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {product.highlights.slice(0, 4).map((h, idx) => {
                  const Icon = featureIcons[idx % featureIcons.length]
                  return (
                    <li key={h} className="flex items-center gap-2 text-sm">
                      <div className="flex size-6 items-center justify-center rounded-md" style={{ backgroundColor: `${product.color}15`, color: product.color }}>
                        <Icon className="size-3.5" />
                      </div>
                      <span className="text-muted-foreground">{h}</span>
                    </li>
                  )
                })}
              </ul>

              {/* Actions */}
              <div className="mt-8 flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Jumlah</span>
                  <div className="flex items-center gap-1">
                    <Button size="icon-sm" variant="outline" className="size-9 rounded-full" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                      <Minus className="size-4" />
                    </Button>
                    <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
                    <Button size="icon-sm" variant="outline" className="size-9 rounded-full" onClick={() => setQuantity((q) => q + 1)}>
                      <Plus className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button size="lg" className="flex-1 rounded-none font-semibold text-white cursor-pointer" style={{ backgroundColor: product.color, borderColor: product.color }} onClick={handleBuyNow}>
                    Beli Sekarang
                    <ArrowRight className="size-4.5" />
                  </Button>
                  <Button size="lg" variant="outline" className="flex-1 rounded-none font-semibold cursor-pointer" onClick={handleAddToCart}>
                    <ShoppingBag className="size-4.5" />
                    Tambah ke Keranjang
                  </Button>
                  <Button size="lg" className="flex-1 rounded-none font-semibold bg-[#25D366] hover:bg-[#20bd5a] text-white border-[#25D366] cursor-pointer" onClick={openDemoWA}>
                    <MessageCircle className="size-4.5" />
                    Coba Demo / Chat WA
                  </Button>
                </div>

                {/* Trust & Guarantee strip */}
                <div className="mt-2 border border-border bg-muted/20 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                    Beli Sekali (Tanpa Biaya Bulanan)
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <Laptop className="size-4 text-primary" />
                    Gratis Panduan Install via AnyDesk
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <Database className="size-4 text-amber-600 dark:text-amber-400" />
                    Database Mandiri / Bisa Offline
                  </span>
                </div>
              </div>
            </div>

            {/* Image */}
            <div className="order-1 lg:order-2">
              <div className="relative flex items-center justify-center overflow-hidden rounded-none shadow-2xl">
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className="w-full h-auto max-h-[550px] object-contain rounded-none block"
                />
                {product.badge && (
                  <Badge variant={product.badge === "Sale" ? "destructive" : "default"} className="absolute left-4 top-4 rounded-none">
                    {product.badge}
                  </Badge>
                )}
                {images.length > 1 && (
                  <>
                    <button onClick={prevImage} className="absolute left-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60">
                      <ChevronLeft className="size-5" />
                    </button>
                    <button onClick={nextImage} className="absolute right-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60">
                      <ChevronRight className="size-5" />
                    </button>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="mt-4 flex justify-center gap-2">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`relative h-2 rounded-full transition-all ${i === selectedImage ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30"}`}
                      aria-label={`Pilih gambar ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Quick info bar */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-border px-4 md:grid-cols-4 md:px-6">
          {[
            { icon: Monitor, label: "Platform", value: product.platforms?.length ? product.platforms.map((p) => p.name).join(", ") : product.platform || "Windows" },
            { icon: Tag, label: "Versi", value: product.version },
            { icon: ShieldCheck, label: "Lisensi", value: product.license },
            { icon: HardDrive, label: "Ukuran", value: product.downloadSize },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="flex items-center gap-3 px-4 py-5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${product.color}15`, color: product.color }}>
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{item.label}</p>
                  <p className="truncate text-sm font-semibold">{item.value}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Deskripsi lengkap */}
      <section className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[13px] font-semibold uppercase tracking-widest" style={{ color: product.color }}>Deskripsi Lengkap</p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-4xl">Kenapa memilih {product.name}?</h2>
        </div>
        <div className="mx-auto mt-8 max-w-3xl text-center text-base leading-relaxed text-muted-foreground md:text-lg">
          {product.description}
        </div>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {trustFeatures.map((f) => {
            const Icon = f.icon
            return (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-5 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-xl" style={{ backgroundColor: `${product.color}15`, color: product.color }}>
                  <Icon className="size-6" />
                </div>
                <h3 className="mt-4 text-sm font-bold">{f.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Fitur lengkap */}
      <section className="border-t border-border bg-muted/30 py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-10 text-center">
            <p className="text-[13px] font-semibold uppercase tracking-widest" style={{ color: product.color }}>Fitur Lengkap</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-4xl">Semua fungsi yang Anda butuhkan</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{product.name} dirancang untuk memudahkan operasional bisnis sehari-hari dengan fitur yang lengkap namun tetap mudah digunakan.</p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {product.highlights.map((h, idx) => {
              const Icon = featureIcons[idx % featureIcons.length]
              return (
                <div key={h} className="flex items-start gap-4 rounded-2xl border border-border bg-background p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${product.color}15`, color: product.color }}>
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{h}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">Fitur ini terintegrasi langsung dengan modul utama untuk mempercepat pekerjaan Anda.</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Cara pakai */}
      {(steps.length > 0 || product.downloadLinks?.length) && (
        <section className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20">
          <div className="mb-10 text-center">
            <p className="text-[13px] font-semibold uppercase tracking-widest" style={{ color: product.color }}>Cara Pakai</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-4xl">Mulai menggunakan dalam hitungan menit</h2>
          </div>

          {steps.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {steps.slice(0, 8).map((step, i) => (
                <div key={i} className="relative rounded-2xl border border-border bg-card p-6">
                  <span className="flex size-8 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: product.color }}>{i + 1}</span>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{step.replace(/^\d+[.\)\-]\s*/, "")}</p>
                </div>
              ))}
            </div>
          )}

          {product.downloadLinks && product.downloadLinks.length > 0 && (
            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {product.downloadLinks.map((dl, idx) => (
                <a
                  key={idx}
                  href={dl.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${product.color}15`, color: product.color }}>
                    <Download className="size-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{dl.label || `Download File ${idx + 1}`}</p>
                    {dl.size && <p className="text-xs text-muted-foreground">Ukuran: {dl.size}</p>}
                  </div>
                  <ExternalLink className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                </a>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Manfaat */}
      <section className="border-t border-border bg-muted/30 py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-widest" style={{ color: product.color }}>Manfaat</p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-4xl">Keuntungan menggunakan {product.name}</h2>
              <p className="mt-4 text-muted-foreground">Dengan {product.name}, bisnis Anda akan lebih terorganisir, cepat, dan mudah diawasi dari satu dashboard.</p>
              <ul className="mt-6 space-y-3">
                {benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${product.color}15`, color: product.color }}>
                      <Check className="size-3" />
                    </div>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center justify-center rounded-none shadow-xl">
              <img
                src={images[0]}
                alt={`${product.name} preview`}
                className="w-full h-auto max-h-[450px] rounded-none object-contain block"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Galeri */}
      {images.length > 1 && (
        <section className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20">
          <div className="mb-10 text-center">
            <p className="text-[13px] font-semibold uppercase tracking-widest" style={{ color: product.color }}>Galeri Produk</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-4xl">Lihat tampilan antarmuka</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((_img, i) => (
              <div key={i} className="group relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-none bg-muted/20 p-2">
                <img src={_img} alt={`${product.name} screenshot ${i + 1}`} className="max-h-full max-w-full object-contain" loading="lazy" />
                <p className="absolute bottom-2 left-2 rounded-none bg-black/75 px-2 py-0.5 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">Tampilan {i + 1}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Spesifikasi */}
      <section className="border-t border-border bg-muted/30 py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-10 text-center">
            <p className="text-[13px] font-semibold uppercase tracking-widest" style={{ color: product.color }}>Spesifikasi Teknis</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-4xl">Detail teknis & persyaratan sistem</h2>
          </div>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-background p-6">
              <h3 className="text-base font-bold">Informasi Produk</h3>
              <table className="mt-4 w-full text-sm">
                <tbody>
                  {product.specs.map((spec, i) => (
                    <tr key={spec.label} className={i % 2 === 0 ? "bg-muted/40" : "bg-background"}>
                      <td className="w-1/2 px-4 py-3 text-muted-foreground">{spec.label}</td>
                      <td className="px-4 py-3 font-semibold">{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-5">
              <div className="rounded-2xl border border-border bg-background p-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${product.color}15`, color: product.color }}>
                    <Cpu className="size-5" />
                  </div>
                  <h3 className="text-base font-bold">Persyaratan Minimum</h3>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {["OS: Windows 7/8/10/11 (64-bit)", "RAM: 2 GB (4 GB disarankan)", "Storage: 200 MB ruang kosong", "Prosesor: Intel Core i3 / setara", "Koneksi internet untuk aktivasi"].map((r) => (
                    <li key={r} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0" style={{ color: product.color }} />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-border bg-background p-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${product.color}15`, color: product.color }}>
                    <Database className="size-5" />
                  </div>
                  <h3 className="text-base font-bold">Database & Keamanan</h3>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {["MySQL 5.7+ / MariaDB 10+", "SQLite (embedded, single-user)", "Backup otomatis terjadwal", "Import/Export Excel & CSV", "Enkripsi data sensitif"].map((r) => (
                    <li key={r} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0" style={{ color: product.color }} />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-14 md:px-6 md:py-20">
        <div className="mb-8 text-center">
          <p className="text-[13px] font-semibold uppercase tracking-widest" style={{ color: product.color }}>FAQ</p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">Pertanyaan yang sering diajukan</h2>
        </div>
        <Accordion type="single" defaultValue="faq-0" className="space-y-3">
          {faqItems.map((item, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="rounded-2xl border border-border bg-card px-5">
              <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline">{item.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CTA bottom */}
      <section className="mx-auto max-w-7xl px-4 pb-14 md:px-6 md:pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-8 text-white md:p-12">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-20 blur-3xl"
            style={{ backgroundColor: product.color }}
          />
          <div className="relative flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
            <div className="max-w-xl">
              <h2 className="text-2xl font-bold tracking-tight md:text-4xl">Siap pakai {product.name}?</h2>
              <p className="mt-3 text-base text-white/70">Pesan sekarang dan mulai kelola bisnis Anda lebih rapi. Tersedia demo gratis, garansi 30 hari, dan support langsung dari tim Rhansoft.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="rounded-full" style={{ backgroundColor: product.color, borderColor: product.color }} onClick={handleBuyNow}>
                Order Sekarang
                <ArrowRight className="size-5" />
              </Button>
              <Button size="lg" variant="outline" className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white" onClick={openContactWA}>
                <Headphones className="size-5" />
                Hubungi Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Related products */}
      {related.length > 0 && (
        <section className="border-t border-border py-14 md:py-20">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <h2 className="mb-6 text-2xl font-bold tracking-tight md:text-3xl">Produk terkait</h2>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
              {related.map((p) => (
                <RelatedProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
