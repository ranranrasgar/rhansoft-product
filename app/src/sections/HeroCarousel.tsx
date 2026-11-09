import { useState, useCallback, useEffect } from "react"
import { useNavigate as useRouterNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowRight, ChevronLeft, ChevronRight, Check, Star, Sparkles } from "lucide-react"
import { heroSlides } from "@/data/store"
import { useProducts } from "@/hooks/useProducts"
import { useNavigate } from "@/lib/navigate"

export function HeroCarousel() {
  const [active, setActive] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const count = heroSlides.length
  const navigate = useNavigate()
  const routerNavigate = useRouterNavigate()
  const { products } = useProducts()

  const next = useCallback(() => setActive((i) => (i + 1) % count), [count])
  const prev = useCallback(() => setActive((i) => (i - 1 + count) % count), [count])

  useEffect(() => {
    const t = setInterval(next, 7000)
    return () => clearInterval(t)
  }, [next])

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return
    const diff = touchStart - e.changedTouches[0].clientX
    if (diff > 45) {
      next()
    } else if (diff < -45) {
      prev()
    }
    setTouchStart(null)
  }

  const goToProduct = (title: string) => {
    const product = products.find((p) => p.name === title)
    if (product) {
      routerNavigate(`/product/${product.id}`)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } else {
      navigate("store")
    }
  }

  return (
    <section
      className="relative w-full overflow-hidden bg-slate-950"
      aria-roledescription="carousel"
      aria-label="Produk unggulan"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full opacity-20 blur-3xl transition-all duration-1000"
          style={{ backgroundColor: heroSlides[active].color }}
        />
        <div
          className="absolute -right-32 top-1/4 h-[600px] w-[600px] rounded-full opacity-10 blur-3xl transition-all duration-1000"
          style={{ backgroundColor: heroSlides[active].color }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto min-h-[520px] max-w-7xl px-4 pt-6 pb-12 sm:min-h-[520px] sm:py-10 md:min-h-[560px] md:px-6 md:py-16 lg:py-20">
        {heroSlides.map((s, i) => {
          const isActive = i === active
          const product = products.find((p) => p.name === s.title)
          return (
            <div
              key={s.id}
              className={`absolute inset-0 transition-all duration-700 ease-out ${
                isActive ? "opacity-100 z-10" : "opacity-0 pointer-events-none"
              }`}
              aria-hidden={!isActive}
            >
              <div className="grid h-full grid-cols-1 items-center gap-4 px-4 pt-4 pb-10 sm:gap-6 sm:px-6 sm:py-8 md:grid-cols-2 md:gap-12 md:p-0">
                {/* Left: Text content (Order 1 on both mobile & desktop) */}
                <div className="order-1 flex flex-col justify-center">
                  {isActive && (
                    <>
                      <div
                        className="animate-fade-up inline-flex items-center gap-1.5 self-start rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 sm:px-3 sm:py-1 backdrop-blur-sm"
                        style={{ animationDelay: "0ms" }}
                      >
                        <Sparkles className="size-3 sm:size-3.5" style={{ color: s.color }} />
                        <span className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-wider text-white/70">
                          {s.eyebrow}
                        </span>
                      </div>

                      <h1
                        className="animate-fade-up mt-2.5 sm:mt-4 md:mt-5 text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold leading-tight md:leading-[1.1] text-white text-balance"
                        style={{ animationDelay: "80ms" }}
                      >
                        {s.title}
                      </h1>

                      <p
                        className="animate-fade-up mt-2 sm:mt-3 md:mt-5 max-w-md text-xs sm:text-sm md:text-base leading-relaxed text-white/70 line-clamp-2 md:line-clamp-none"
                        style={{ animationDelay: "160ms" }}
                      >
                        {s.subtitle}
                      </p>

                      {/* Feature pills (visible on sm+) */}
                      {product && (
                        <div
                          className="animate-fade-up mt-4 hidden sm:flex flex-wrap gap-2 md:mt-6"
                          style={{ animationDelay: "240ms" }}
                        >
                          {product.highlights.slice(0, 3).map((h) => (
                            <span
                              key={h}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-white/80 backdrop-blur-sm"
                            >
                              <Check className="size-3.5" style={{ color: s.color }} />
                              {h}
                            </span>
                          ))}
                        </div>
                      )}

                      <div
                        className="animate-fade-up mt-3.5 sm:mt-5 md:mt-8 flex flex-wrap items-center gap-2.5 sm:gap-3"
                        style={{ animationDelay: "320ms" }}
                      >
                        <Button
                          size="default"
                          className="rounded-full text-xs sm:text-sm font-semibold text-white shadow-lg md:text-base md:h-11 md:px-6"
                          style={{
                            backgroundColor: s.color,
                            borderColor: s.color,
                          }}
                          onClick={() => goToProduct(s.title)}
                        >
                          {s.cta}
                          <ArrowRight className="size-3.5 sm:size-4" />
                        </Button>
                        <Button
                          size="default"
                          variant="outline"
                          className="rounded-full border-white/15 bg-white/5 text-xs sm:text-sm text-white backdrop-blur-sm hover:bg-white/10 hover:text-white md:text-base md:h-11 md:px-6"
                          onClick={() => goToProduct(s.title)}
                        >
                          {s.secondaryCta}
                        </Button>
                      </div>
                    </>
                  )}
                </div>

                {/* Right: Product image card (Order 2 on both mobile & desktop) */}
                <div className="order-2 flex items-center justify-center">
                  {isActive && (
                    <div className="animate-fade-up relative flex w-full max-w-lg items-center justify-center">
                      <div className="relative flex items-center justify-center">
                        <img
                          src={s.image}
                          alt={s.title}
                          className="h-auto w-full max-h-[180px] sm:max-h-[250px] md:max-h-[460px] object-contain shadow-2xl"
                          loading={i === 0 ? "eager" : "lazy"}
                        />

                        {/* Rating badge */}
                        {product && (
                          <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 flex items-center gap-1.5 bg-black/80 px-2 py-0.5 sm:px-2.5 sm:py-1 backdrop-blur-md">
                            <Star className="size-3 sm:size-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-[11px] sm:text-xs font-semibold text-white">{product.rating}</span>
                            <span className="text-[9px] sm:text-[10px] text-white/60">
                              ({product.reviews} ulasan)
                            </span>
                          </div>
                        )}

                        {/* Price badge */}
                        {product && (
                          <div
                            className="absolute right-2 top-2 sm:right-3 sm:top-3 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-bold text-white shadow-lg backdrop-blur-md"
                            style={{ backgroundColor: `${s.color}E6` }}
                          >
                            {s.cta}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Controls: Next / Prev arrows on sm+ screens */}
        <button
          onClick={prev}
          aria-label="Slide sebelumnya"
          className="absolute left-1 top-1/2 z-20 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 backdrop-blur-md transition hover:bg-white/15 hover:text-white sm:flex md:left-2 md:size-11"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          onClick={next}
          aria-label="Slide berikutnya"
          className="absolute right-1 top-1/2 z-20 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 backdrop-blur-md transition hover:bg-white/15 hover:text-white sm:flex md:right-2 md:size-11"
        >
          <ChevronRight className="size-5" />
        </button>

        {/* Slide indicators */}
        <div className="absolute bottom-2.5 sm:bottom-3 md:bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
          {heroSlides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActive(i)}
              aria-label={`Ke slide ${i + 1}`}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === active
                  ? "w-8 sm:w-10 bg-white"
                  : "w-2 bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
