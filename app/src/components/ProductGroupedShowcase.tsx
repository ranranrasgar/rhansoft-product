import { useState, useMemo } from "react"
import {
  Smartphone,
  CheckCircle2,
  Maximize2,
  X,
  ChevronRight,
  Laptop,
  Sparkles,
  Layers,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { normalizeGalleryItem, type Product, type ProductGalleryItem } from "@/data/store"

export function ProductGroupedShowcase({ product }: { product: Product }) {
  const normalizedItems = useMemo(() => {
    return (product.gallery ?? [])
      .map(normalizeGalleryItem)
      .filter((item) => Boolean(item.url))
  }, [product.gallery])

  // Extract all distinct groups
  const groups = useMemo(() => {
    const list: string[] = []
    normalizedItems.forEach((item) => {
      const g = item.group?.trim() || "Galeri Umum"
      if (!list.includes(g)) list.push(g)
    })
    return list
  }, [normalizedItems])

  // Only render grouped showcase if there are structured items (either multiple groups or items with titles/features)
  const hasStructuredShowcase = useMemo(() => {
    if (normalizedItems.length === 0) return false
    if (groups.length > 1) return true
    return normalizedItems.some((item) => Boolean(item.title || item.caption || item.features?.length))
  }, [normalizedItems, groups])

  const [activeGroup, setActiveGroup] = useState<string>(() => groups[0] || "Galeri Umum")
  const [activeScreenIdx, setActiveScreenIdx] = useState<number>(0)
  const [previewItem, setPreviewItem] = useState<ProductGalleryItem | null>(null)

  // Items in currently active group
  const currentGroupItems = useMemo(() => {
    return normalizedItems.filter((item) => (item.group?.trim() || "Galeri Umum") === activeGroup)
  }, [normalizedItems, activeGroup])

  if (!hasStructuredShowcase) return null

  // Helper to determine layout flavor
  const isMobileGroup = (g: string) => {
    const s = g.toLowerCase()
    return s.includes("mobile") || s.includes("hp") || s.includes("smartphone") || s.includes("pwa") || s.includes("android") || s.includes("ios")
  }

  const isSosmedGroup = (g: string) => {
    const s = g.toLowerCase()
    return s.includes("sosmed") || s.includes("sosial") || s.includes("social") || s.includes("komunitas") || s.includes("temanviora")
  }

  const currentIsMobile = isMobileGroup(activeGroup)
  const currentIsSosmed = isSosmedGroup(activeGroup)

  const activeItem = currentGroupItems[activeScreenIdx] || currentGroupItems[0]

  return (
    <div className="w-full border-b border-border bg-background">
      {/* Lightbox Preview Modal */}
      {previewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden border border-border bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-none font-semibold text-primary">
                  {previewItem.group || "Fitur"}
                </Badge>
                <h3 className="text-base font-bold text-foreground">
                  {previewItem.title || product.name}
                </h3>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="flex size-8 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                aria-label="Tutup"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto lg:flex-row">
              <div className="flex flex-1 items-center justify-center bg-black/95 p-4">
                <img
                  src={previewItem.url}
                  alt={previewItem.title || product.name}
                  className={`max-h-[65vh] w-auto object-contain ${
                    isMobileGroup(previewItem.group || "") || isSosmedGroup(previewItem.group || "")
                      ? "max-w-[320px]"
                      : "max-w-full"
                  }`}
                />
              </div>

              <div className="w-full border-t border-border p-6 lg:w-80 lg:border-l lg:border-t-0">
                <Badge className="rounded-none bg-primary font-medium text-primary-foreground">
                  {previewItem.group || "Screenshot"}
                </Badge>
                {previewItem.caption ? (
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {previewItem.caption}
                  </p>
                ) : (
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    Tangkapan layar antarmuka sistem {product.name}.
                  </p>
                )}

                {previewItem.features && previewItem.features.length > 0 && (
                  <>
                    <h4 className="mt-6 text-xs font-bold uppercase tracking-wider text-foreground">
                      Sorotan Fitur Layar Ini:
                    </h4>
                    <ul className="mt-3 space-y-2">
                      {previewItem.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
        {/* Section Header */}
        <div className="flex flex-col items-start justify-between gap-4 border-l-4 border-primary pl-4 md:flex-row md:items-end">
          <div>
            <Badge variant="outline" className="rounded-none font-semibold text-primary">
              Eksplorasi Screenshot & Modul Sistem
            </Badge>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground md:text-4xl">
              Antarmuka & Fitur Unggulan {product.name}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Pilih kelompok layout di bawah untuk melihat rincian tangkapan layar, fitur operasional,
              dan simulasi tampilan pada berbagai perangkat.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <Layers className="size-4 text-primary" />
            <span>Total {normalizedItems.length} Tangkapan Layar Terkelompok</span>
          </div>
        </div>

        {/* Group Tabs Selector */}
        <div className="mt-8 flex flex-wrap items-center gap-2 border-b border-border pb-4">
          {groups.map((groupName) => {
            const count = normalizedItems.filter((i) => (i.group?.trim() || "Galeri Umum") === groupName).length
            const isMobile = isMobileGroup(groupName)
            const isSosmed = isSosmedGroup(groupName)
            const isActive = activeGroup === groupName

            return (
              <button
                key={groupName}
                onClick={() => {
                  setActiveGroup(groupName)
                  setActiveScreenIdx(0)
                }}
                className={`flex items-center gap-2 border px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {isMobile ? <Smartphone className="size-3.5" /> : isSosmed ? <Sparkles className="size-3.5" /> : <Laptop className="size-3.5" />}
                <span>{groupName}</span>
                <span
                  className={`ml-1 px-1.5 py-0.2 text-[10px] font-semibold ${
                    isActive ? "bg-black/20 text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* ── LAYOUT 1: SMARTPHONE MOCKUP (Jika Kelompok Mobile) ────────── */}
        {currentIsMobile && (
          <div className="mt-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            {/* Left: Screens Selector */}
            <div className="space-y-2 lg:col-span-5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Pilih Tampilan Layar {activeGroup}:
              </p>
              {currentGroupItems.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveScreenIdx(idx)}
                  className={`group flex cursor-pointer items-start gap-3 border p-3.5 transition-all duration-200 ${
                    idx === activeScreenIdx
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-card/60 hover:bg-card"
                  }`}
                >
                  <div
                    className={`flex size-7 shrink-0 items-center justify-center font-bold text-xs ${
                      idx === activeScreenIdx
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground group-hover:text-foreground"
                    }`}
                  >
                    0{idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-foreground">
                      {item.title || `Layar #${idx + 1}`}
                    </h4>
                    {item.caption && (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{item.caption}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Realistic Phone Frame */}
            <div className="flex flex-col items-center justify-center lg:col-span-7">
              {activeItem && (
                <div className="relative flex max-w-sm flex-col items-center border border-border bg-card p-4 shadow-xl">
                  <div className="mb-3 flex w-full items-center justify-between border-b border-border pb-2 text-xs">
                    <span className="font-semibold text-primary">{activeItem.group}</span>
                    <button
                      onClick={() => setPreviewItem(activeItem)}
                      className="flex items-center gap-1 font-medium text-primary hover:underline cursor-pointer"
                    >
                      <Maximize2 className="size-3" />
                      Perbesar Layar Penuh
                    </button>
                  </div>

                  <div
                    className="relative group cursor-pointer overflow-hidden bg-black/90"
                    onClick={() => setPreviewItem(activeItem)}
                  >
                    <img
                      src={activeItem.url}
                      alt={activeItem.title || activeGroup}
                      className="h-[480px] w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="flex items-center gap-1.5 border border-white/40 bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                        <Maximize2 className="size-3.5" /> Klik untuk Zoom
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 w-full">
                    <h4 className="text-sm font-bold text-foreground">
                      {activeItem.title || activeGroup}
                    </h4>
                    {activeItem.caption && (
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {activeItem.caption}
                      </p>
                    )}
                    {activeItem.features && activeItem.features.length > 0 && (
                      <div className="mt-3 grid grid-cols-1 gap-1.5">
                        {activeItem.features.map((f, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-emerald-600" />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── LAYOUT 2: SOSMED / SOCIAL NETWORK HIGHLIGHT ─────────────── */}
        {currentIsSosmed && (
          <div className="mt-10 grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            <div className="flex justify-center lg:col-span-5">
              {activeItem && (
                <div
                  className="group relative cursor-pointer border-2 border-primary/40 bg-card p-3 shadow-2xl transition-all hover:border-primary"
                  onClick={() => setPreviewItem(activeItem)}
                >
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold text-primary">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="size-3.5" />
                      {activeItem.title || "Sosial Media Sekolah"}
                    </span>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Maximize2 className="size-3" /> Zoom
                    </span>
                  </div>
                  <div className="relative overflow-hidden bg-black/95">
                    <img
                      src={activeItem.url}
                      alt={activeItem.title || "Sosial Media"}
                      className="h-[500px] w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="flex items-center gap-1.5 border border-white/40 bg-black/80 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                        <Maximize2 className="size-3.5" /> Klik untuk Memperbesar
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-7">
              <Badge className="rounded-none bg-primary text-primary-foreground">
                FITUR KOMUNITAS & JEJARING SOSIAL
              </Badge>
              <h3 className="mt-3 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                {activeItem?.title || "Sosial Media Internal Sekolah"}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                {activeItem?.caption ||
                  "Platform jejaring sosial internal khusus sekolah untuk berbagi karya, momen belajar, dan membangun iklim komunitas yang aman dan terawasi."}
              </p>

              {activeItem?.features && activeItem.features.length > 0 && (
                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {activeItem.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2.5 border border-border bg-card p-3.5 text-xs">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                      <span className="leading-relaxed text-foreground">{feat}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── LAYOUT 3: DESKTOP / WEB / MODUL GRID ─────────────────────── */}
        {!currentIsMobile && !currentIsSosmed && (
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {currentGroupItems.map((item, idx) => (
              <div
                key={idx}
                className="group flex flex-col border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl"
              >
                {/* Image */}
                <div
                  className="relative aspect-[16/10] w-full overflow-hidden bg-black/90 cursor-pointer"
                  onClick={() => setPreviewItem(item)}
                >
                  <img
                    src={item.url}
                    alt={item.title || `${product.name} screenshot ${idx + 1}`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <Badge className="absolute left-3 top-3 rounded-none bg-black/75 text-[11px] font-semibold text-white backdrop-blur">
                    Modul {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                  </Badge>
                  {item.group && (
                    <Badge className="absolute right-3 top-3 rounded-none bg-primary text-[10px] font-semibold text-primary-foreground">
                      {item.group}
                    </Badge>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="flex items-center gap-1.5 border border-white/30 bg-black/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
                      <Maximize2 className="size-3.5" /> Lihat Detail
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                    {item.title || `Layar Fitur #${idx + 1}`}
                  </h3>
                  {item.caption && (
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-3">
                      {item.caption}
                    </p>
                  )}

                  {item.features && item.features.length > 0 && (
                    <div className="mt-4 border-t border-border/60 pt-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                        Sorotan Fitur:
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {item.features.slice(0, 2).map((feat, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-emerald-600" />
                            <span className="line-clamp-2">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/60">
                    <span className="text-[11px] text-muted-foreground font-medium">
                      Fitur Asli Sistem
                    </span>
                    <button
                      onClick={() => setPreviewItem(item)}
                      className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                    >
                      Buka Preview
                      <ChevronRight className="size-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
