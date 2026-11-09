import { useNavigate as useRouterNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { promos } from "@/data/store"
import { useProducts } from "@/hooks/useProducts"
import { useNavigate } from "@/lib/navigate"

const themeStyles = {
  dark: "bg-foreground text-background",
  light: "bg-background text-foreground border border-border",
  accent: "bg-accent text-accent-foreground",
}

export function PromotionalSections() {
  const navigate = useNavigate()
  const routerNavigate = useRouterNavigate()
  const { products } = useProducts()

  const handlePromoClick = (promoId: string) => {
    if (promoId === "promo1") {
      // Promo 1 — go to first POS product
      const product = products.find((p) => p.category === "POS & Retail")
      if (product) {
        routerNavigate(`/product/${product.id}`)
        window.scrollTo({ top: 0, behavior: "smooth" })
        return
      }
    }
    if (promoId === "promo2") {
      // Promo 2 — go to Accounting product
      const product = products.find((p) => p.category === "Accounting")
      if (product) {
        routerNavigate(`/product/${product.id}`)
        window.scrollTo({ top: 0, behavior: "smooth" })
        return
      }
    }
    navigate("store")
  }

  return (
    <section className="bg-background py-10 md:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {promos.map((promo) => (
            <div
              key={promo.id}
              className={`relative flex flex-col justify-between overflow-hidden rounded-none border border-border p-5 sm:p-8 md:min-h-[360px] md:p-10 ${themeStyles[promo.theme]}`}
            >
              <div className="relative z-10 max-w-full sm:max-w-[55%]">
                <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-widest opacity-70">
                  {promo.eyebrow}
                </p>
                <h3 className="mt-1.5 text-xl font-semibold leading-tight sm:mt-2 sm:text-2xl md:text-3xl">
                  {promo.title}
                </h3>
                <p className="mt-2 text-xs opacity-80 sm:mt-3 sm:text-sm md:text-base">{promo.subtitle}</p>
                <Button
                  variant={promo.theme === "dark" ? "secondary" : "default"}
                  className="mt-4 sm:mt-6 rounded-none text-xs sm:text-sm"
                  onClick={() => handlePromoClick(promo.id)}
                >
                  {promo.cta}
                  <ArrowRight className="size-3.5 sm:size-4" />
                </Button>
              </div>
              <div className="mt-5 flex h-40 w-full items-center justify-center overflow-hidden rounded-none sm:absolute sm:right-4 sm:top-1/2 sm:mt-0 sm:h-[90%] sm:w-[45%] sm:-translate-y-1/2 shadow-2xl">
                <img
                  src={promo.image}
                  alt={promo.title}
                  className="max-h-full max-w-full object-contain"
                  loading="lazy"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
