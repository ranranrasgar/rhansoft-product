import { useState, useCallback, useEffect } from "react"
import { useNavigate as useRouterNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowRight, ChevronLeft, ChevronRight, Check, Star, Sparkles } from "lucide-react"
import { heroSlides } from "@/data/store"
import { useProducts } from "@/hooks/useProducts"
import { useNavigate } from "@/lib/navigate"

export function HeroCarousel() {
  const [active, setActive] = useState(0)
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

      {/* Ponsel: gambar dan teks bertumpuk (~720px) + ruang tombol di bawah */}
      <div className="relative mx-auto min-h-[880px] max-w-7xl px-4 py-12 md:min-h-[560px] md:px-6 md:py-20">
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
              <div className="grid h-full grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-16">
                {/* Left: Text content */}
                <div className="order-2 flex flex-col justify-center md:order-1">
                  {isActive && (
                    <>
                      <div
                        className="animate-fade-up inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/5 px-3 py-1 backdrop-blur-sm"
                        style={{ animationDelay: "0ms" }}
                      >
                        <Sparkles className="size-3.5" style={{ color: s.color }} />
                        <span className="text-[12px] font-semibold uppercase tracking-widest text-white/70">
                          {s.eyebrow}
                        </span>
                      </div>

                      <h1
                        className="animate-fade-up mt-5 text-4xl font-bold leading-[1.1] text-white text-balance md:text-6xl"
                        style={{ animationDelay: "80ms" }}
                      >
                        {s.title}
                      </h1>

                      <p
                        className="animate-fade-up mt-5 max-w-md text-base leading-relaxed text-white/60 md:text-lg"
                        style={{ animationDelay: "160ms" }}
                      >
                        {s.subtitle}
                      </p>

                      {/* Feature pills */}
                      {product && (
                        <div
                          className="animate-fade-up mt-6 flex flex-wrap gap-2"
                          style={{ animationDelay: "240ms" }}
                        >
                          {product.highlights.slice(0, 3).map((h) => (
                            <span
                              key={h}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm"
                            >
                              <Check className="size-3.5" style={{ color: s.color }} />
                              {h}
                            </span>
                          ))}
                        </div>
                      )}

                      <div
                        className="animate-fade-up mt-8 flex flex-wrap items-center gap-3"
                        style={{ animationDelay: "320ms" }}
                      >
                        <Button
                          size="lg"
                          className="rounded-full text-white shadow-lg"
                          style={{
                            backgroundColor: s.color,
                            borderColor: s.color,
                          }}
                          onClick={() => goToProduct(s.title)}
                        >
                          {s.cta}
                          <ArrowRight className="size-4" />
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          className="rounded-full border-white/15 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10 hover:text-white"
                          onClick={() => goToProduct(s.title)}
                        >
                          {s.secondaryCta}
                        </Button>
                      </div>
                    </>
                  )}
                </div>

                {/* Right: Product image card */}
                <div className="order-1 flex items-center justify-center md:order-2">
                  {isActive && (
                    <div className="animate-fade-up relative w-full max-w-md">
                      {/* Glass card */}
                      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-2 backdrop-blur-xl shadow-2xl">
                        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                          <img
                            src={s.image}
                            alt={s.title}
                            className="h-full w-full object-cover"
                            loading={i === 0 ? "eager" : "lazy"}
                          />
                          {/* Gradient overlay at bottom of image */}
                          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />

                          {/* Rating badge */}
                          {product && (
                            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg bg-black/50 px-2.5 py-1 backdrop-blur-md">
                              <Star className="size-3.5 fill-amber-400 text-amber-400" />
                              <span className="text-xs font-semibold text-white">{product.rating}</span>
                              <span className="text-[10px] text-white/60">
                                ({product.reviews} ulasan)
                              </span>
                            </div>
                          )}

                          {/* Price badge */}
                          {product && (
                            <div
                              className="absolute right-3 top-3 rounded-lg px-2.5 py-1 text-xs font-bold text-white shadow-lg backdrop-blur-md"
                              style={{ backgroundColor: `${s.color}E6` }}
                            >
                              {s.cta}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Floating accent glow */}
                      <div
                        className="absolute -inset-6 -z-10 rounded-3xl opacity-20 blur-2xl"
                        style={{ backgroundColor: s.color }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Kontrol di bawah (panah mengapit penanda slide) agar tidak menutupi teks dan gambar */}
        <div className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 items-center gap-4">
          <button
            onClick={prev}
            aria-label="Slide sebelumnya"
            className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 backdrop-blur-md transition hover:bg-white/15 hover:text-white"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="flex items-center gap-2.5">
            {heroSlides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setActive(i)}
                aria-label={`Ke slide ${i + 1}`}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === active
                    ? "w-10 bg-white"
                    : "w-2 bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
          <button
            onClick={next}
            aria-label="Slide berikutnya"
            className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 backdrop-blur-md transition hover:bg-white/15 hover:text-white"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </section>
  )
}
