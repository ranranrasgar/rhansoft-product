import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, Plus, Check } from "lucide-react"
import { toast } from "sonner"
import { useProducts } from "@/hooks/useProducts"
import { useCart } from "@/hooks/useCart"
import { useNavContext } from "@/lib/navigate"
import type { Product } from "@/data/store"

function formatPrice(n: number) {
  return n.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  })
}

export function FeaturedProducts() {
  const { products } = useProducts()
  const { addItem } = useCart()
  const { filterCategory, setFilterCategory } = useNavContext()
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    if (!filterCategory) return products
    return products.filter((p) => p.category === filterCategory)
  }, [products, filterCategory])

  const handleAdd = (e: React.MouseEvent, p: Product) => {
    e.stopPropagation()
    addItem(p)
    toast.success(`${p.name} ditambahkan ke keranjang`, {
      description: formatPrice(p.price),
    })
  }

  const goToProduct = (id: string) => {
    navigate(`/product/${id}`)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <section id="store" className="bg-secondary/40 py-10 md:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:mb-8 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Software Katalog
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
              {filterCategory ? filterCategory : "Semua Software"}
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full text-xs sm:text-sm"
            onClick={() => setFilterCategory(null)}
          >
            Lihat semua
          </Button>
        </div>

        {filterCategory && (
          <div className="mb-6 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Filter:
            </span>
            <Badge variant="secondary" className="gap-1">
              {filterCategory}
              <button
                onClick={() => setFilterCategory(null)}
                className="ml-1 text-xs hover:text-foreground"
                aria-label="Hapus filter"
              >
                ✕
              </button>
            </Badge>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            Belum ada software di kategori ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <div
                key={p.id}
                onClick={() => goToProduct(p.id)}
                className="group relative flex flex-col overflow-hidden rounded-none border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
              >
                <div className="relative aspect-[4/3] flex items-center justify-center overflow-hidden rounded-none bg-muted/20 p-2">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="max-h-full max-w-full object-contain"
                    loading="lazy"
                  />
                  {p.badge && (
                    <Badge
                      variant={p.badge === "Sale" ? "destructive" : "default"}
                      className="absolute left-3 top-3 rounded-none"
                    >
                      {p.badge}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {p.category}
                  </p>
                  <h3 className="mt-1 text-base font-semibold leading-tight">{p.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {p.description}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`size-3 ${
                            i < Math.round(p.rating)
                              ? "fill-amber-400 text-amber-400"
                              : "fill-muted text-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {p.rating} ({p.reviews})
                    </span>
                  </div>
                  <div className="mt-auto flex items-end justify-between pt-4">
                    <div className="flex flex-col">
                      <span className="text-lg font-semibold">{formatPrice(p.price)}</span>
                      {p.originalPrice && (
                        <span className="text-xs text-muted-foreground line-through">
                          {formatPrice(p.originalPrice)}
                        </span>
                      )}
                    </div>
                    <Button
                      size="icon-sm"
                      variant="default"
                      aria-label={`Tambah ${p.name} ke keranjang`}
                      className="rounded-full transition-all"
                      onClick={(e) => handleAdd(e, p)}
                    >
                      <Plus className="size-4 group-hover:hidden" />
                      <Check className="size-4 hidden group-hover:block" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
