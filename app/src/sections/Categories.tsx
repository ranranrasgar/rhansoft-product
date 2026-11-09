import { useNavigate as useRouterNavigate } from "react-router-dom"
import { categories } from "@/data/store"
import { useNavigate } from "@/lib/navigate"
import { Button } from "@/components/ui/button"
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

export function Categories() {
  const navigate = useNavigate()
  const routerNavigate = useRouterNavigate()

  // Exactly 2 rows:
  // Desktop: 4 columns x 2 rows = 8 cards (slice 0 to 8)
  // Mobile: 2 columns x 2 rows = 4 cards (first 4 visible on mobile, all 8 on sm+)
  const displayedCategories = categories.slice(0, 8)

  const goToAllCategories = () => {
    routerNavigate("/categories")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <section id="categories" className="bg-background py-10 md:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-6 flex flex-col items-start justify-between gap-2 sm:mb-8 md:mb-10 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Kategori Software
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
              Temukan software untuk bisnis Anda
            </h2>
          </div>
          <button
            onClick={goToAllCategories}
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
          >
            Lihat semua kategori
            <ArrowRight className="size-3.5" />
          </button>
        </div>

        {/* 2-row grid: 4 on mobile (2 cols x 2 rows), 8 on desktop (4 cols x 2 rows) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-4">
          {displayedCategories.map((cat, idx) => {
            const Icon = iconMap[cat.icon] ?? ShoppingCart
            const isHiddenOnMobile = idx >= 4

            return (
              <button
                key={cat.id}
                onClick={() => navigate("category", cat.name)}
                className={`group relative flex-col items-start gap-3 overflow-hidden rounded-none border border-border bg-card p-3.5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer sm:gap-4 sm:p-5 md:p-6 ${
                  isHiddenOnMobile ? "hidden sm:flex" : "flex"
                }`}
              >
                <div className="flex size-10 items-center justify-center rounded-none border border-border bg-muted/60 sm:size-12">
                  <Icon className="size-5 text-foreground sm:size-6" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold sm:text-sm">{cat.name}</h3>
                  <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1 sm:text-xs">
                    {cat.tagline}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground/80 sm:text-[11px]">
                    {cat.count} software
                  </p>
                </div>
                <ArrowRight className="size-3.5 -translate-x-1 text-primary opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 sm:size-4" />
              </button>
            )
          })}
        </div>

        {/* CTA to view all remaining categories */}
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            onClick={goToAllCategories}
            className="rounded-none border-border px-6 py-2.5 text-xs sm:text-sm font-semibold hover:border-primary hover:text-primary transition-colors cursor-pointer"
          >
            Lihat Semua Kategori ({categories.length} Kategori)
            <ArrowRight className="size-3.5 sm:size-4 ml-1.5" />
          </Button>
        </div>
      </div>
    </section>
  )
}
