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
    <section className="bg-background py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {promos.map((promo) => (
            <div
              key={promo.id}
              className={`relative flex flex-col justify-between overflow-hidden rounded-3xl p-8 md:min-h-[360px] md:p-10 ${themeStyles[promo.theme]}`}
            >
              <div className="relative z-10 max-w-[60%]">
                <p className="text-[12px] font-semibold uppercase tracking-widest opacity-70">
                  {promo.eyebrow}
                </p>
                <h3 className="mt-2 text-2xl font-semibold leading-tight md:text-3xl">
                  {promo.title}
                </h3>
                <p className="mt-3 text-sm opacity-80 md:text-base">{promo.subtitle}</p>
                <Button
                  variant={promo.theme === "dark" ? "secondary" : "default"}
                  className="mt-6 rounded-full"
                  onClick={() => handlePromoClick(promo.id)}
                >
                  {promo.cta}
                  <ArrowRight className="size-4" />
                </Button>
              </div>
              <img
                src={promo.image}
                alt={promo.title}
                className="absolute right-0 top-1/2 h-[120%] w-[45%] -translate-y-1/2 object-cover opacity-90"
                loading="lazy"
              />
              <div
                className={`absolute right-0 top-0 h-full w-[55%] ${
                  promo.theme === "dark"
                    ? "bg-gradient-to-l from-transparent to-foreground"
                    : promo.theme === "accent"
                      ? "bg-gradient-to-l from-transparent to-accent"
                      : "bg-gradient-to-l from-transparent to-background"
                }`}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
