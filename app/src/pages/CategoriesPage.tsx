import { useState, useMemo } from "react"
import { useNavigate as useRouterNavigate, Link } from "react-router-dom"
import { categories } from "@/data/store"
import { useProducts } from "@/hooks/useProducts"
import { useNavigate } from "@/lib/navigate"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ShoppingCart,
  Calculator,
  Stethoscope,
  BedDouble,
  Receipt,
  MessageSquare,
  Globe,
  Smartphone,
  GraduationCap,
  Users,
  Boxes,
  UtensilsCrossed,
  Building2,
  Truck,
  Factory,
  Sprout,
  Landmark,
  Clapperboard,
  ArrowRight,
  ArrowLeft,
  Search,
  MessageCircle,
  Layers,
  Sparkles,
  type LucideIcon,
} from "lucide-react"

const iconMap: Record<string, LucideIcon> = {
  ShoppingCart,
  Calculator,
  Stethoscope,
  BedDouble,
  Receipt,
  MessageSquare,
  Globe,
  Smartphone,
  GraduationCap,
  Users,
  Boxes,
  UtensilsCrossed,
  Building2,
  Truck,
  Factory,
  Sprout,
  Landmark,
  Clapperboard,
}

export function CategoriesPage() {
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState<"all" | "available">("all")
  const { products } = useProducts()
  const navigate = useNavigate()
  const routerNavigate = useRouterNavigate()

  const categoryListWithRealCount = useMemo(() => {
    return categories.map((cat) => {
      const realCount = products.filter((p) => p.category === cat.name).length
      return {
        ...cat,
        realCount: realCount > 0 ? realCount : cat.count,
      }
    })
  }, [products])

  const filteredCategories = useMemo(() => {
    return categoryListWithRealCount.filter((cat) => {
      const matchSearch =
        cat.name.toLowerCase().includes(search.toLowerCase()) ||
        cat.tagline.toLowerCase().includes(search.toLowerCase())

      if (!matchSearch) return false
      if (filterType === "available") return cat.realCount > 0
      return true
    })
  }, [categoryListWithRealCount, search, filterType])

  const totalSoftware = products.length

  const handleCategoryClick = (catName: string) => {
    navigate("category", catName)
    routerNavigate(`/?category=${encodeURIComponent(catName)}#store`)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ════════ HEADER BANNER ════════ */}
      <section className="border-b border-border bg-muted/20 py-10 md:py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
              <ArrowLeft className="size-3" />
              Beranda
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Kategori Software</span>
          </div>

          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-none border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                <Layers className="size-3.5" />
                Katalog Lengkap
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                • {totalSoftware} Software Siap Pakai
              </span>
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-5xl">
              Semua Kategori Software
            </h1>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed md:text-base">
              Jelajahi seluruh kategori solusi software bisnis, operasional, dan produktivitas dari Rhansoft yang dirancang khusus untuk memajukan usaha Anda.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari kategori (contoh: Toko, Akuntansi, Klinik)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-none border-border bg-card text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("all")}
                className="rounded-none text-xs"
              >
                Semua ({categories.length})
              </Button>
              <Button
                variant={filterType === "available" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("available")}
                className="rounded-none text-xs"
              >
                Tersedia Software ({categoryListWithRealCount.filter((c) => c.realCount > 0).length})
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ CATEGORIES GRID ════════ */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          {filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border p-8">
              <Layers className="size-10 text-muted-foreground/50 mb-3" />
              <h3 className="text-base font-semibold text-foreground">Tidak Ada Kategori Ditemukan</h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                Kategori dengan kata kunci "{search}" tidak ditemukan. Coba gunakan kata kunci lain.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 rounded-none"
                onClick={() => setSearch("")}
              >
                Reset Pencarian
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {filteredCategories.map((cat) => {
                const Icon = iconMap[cat.icon] ?? ShoppingCart
                const hasSoftware = cat.realCount > 0

                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.name)}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-none border border-border bg-card p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl cursor-pointer min-h-[170px]"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3.5">
                        <div className="flex size-11 items-center justify-center rounded-none border border-border bg-muted/40 transition-colors group-hover:border-primary/40 group-hover:bg-primary/5">
                          <Icon className="size-5 text-foreground transition-colors group-hover:text-primary" />
                        </div>
                        {hasSoftware ? (
                          <span className="rounded-none border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                            {cat.realCount} Software
                          </span>
                        ) : (
                          <span className="rounded-none border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            Segera Hadir
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-foreground transition-colors group-hover:text-primary">
                        {cat.name}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {cat.tagline}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors group-hover:text-primary">
                      <span>{hasSoftware ? "Lihat Software" : "Konsultasi Kategori"}</span>
                      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* ════════ BOTTOM CTA BANNER ════════ */}
          <div className="mt-16 border border-border bg-card p-6 sm:p-10 md:p-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                  <Sparkles className="size-3.5" />
                  Solusi Custom
                </span>
                <h3 className="mt-2 text-xl font-bold sm:text-2xl text-foreground">
                  Belum Menemukan Kategori yang Sesuai?
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Tim pengembang Rhansoft dapat merancang software dan aplikasi kustom dari nol yang disesuaikan dengan alur kerja, SOP, dan format laporan bisnis Anda.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <a
                  href="https://wa.me/6281333355871?text=Halo%20Rhansoft,%20saya%20tertarik%20konsultasi%20software%20custom"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-none transition-colors"
                >
                  <MessageCircle className="size-4" />
                  Konsultasi Gratis via WhatsApp
                </a>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 border border-border hover:bg-accent px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-none transition-colors"
                >
                  Katalog Beranda
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
