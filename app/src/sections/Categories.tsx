import { categories } from "@/data/store"
import { useNavigate } from "@/lib/navigate"
import {
  ShoppingCart,
  Calculator,
  Stethoscope,
  BedDouble,
  Receipt,
  MessageSquare,
  Globe,
  Smartphone,
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
}

export function Categories() {
  const navigate = useNavigate()

  return (
    <section id="categories" className="bg-background py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-10 flex flex-col items-start justify-between gap-3 md:flex-row md:items-end">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-widest text-primary">
              Kategori Software
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              Temukan software untuk bisnis Anda
            </h2>
          </div>
          <button
            onClick={() => navigate("store")}
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
          >
            Lihat semua kategori
            <ArrowRight className="size-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-4">
          {categories.map((cat) => {
            const Icon = iconMap[cat.icon] ?? ShoppingCart
            return (
              <button
                key={cat.id}
                onClick={() => navigate("category", cat.name)}
                className="group relative flex flex-col items-start gap-4 overflow-hidden rounded-2xl border border-border bg-card p-6 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer"
              >
                <div
                  className={`flex size-12 items-center justify-center rounded-xl bg-gradient-to-br ${cat.gradient}`}
                >
                  <Icon className="size-6 text-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{cat.name}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{cat.tagline}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground/80">
                    {cat.count} software
                  </p>
                </div>
                <ArrowRight className="size-4 -translate-x-1 text-primary opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
