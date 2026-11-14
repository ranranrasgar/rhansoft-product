import { useState, useMemo, useEffect, useCallback } from "react"
import {
  Smartphone,
  CheckCircle2,
  Maximize2,
  X,
  ChevronRight,
  ChevronLeft,
  Laptop,
  Sparkles,
  Star,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Info,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { normalizeGalleryItem, type Product, type ProductGalleryItem } from "@/data/store"

export function ProductGroupedShowcase({ product }: { product: Product }) {
  const normalizedItems = useMemo(() => {
    return (product.gallery ?? [])
      .map(normalizeGalleryItem)
      .filter((item) => Boolean(item.url))
  }, [product.gallery])

  // Helper detection for mobile vs desktop vs sosmed
  const isMobileGroup = (g: string) => {
    const s = g.toLowerCase()
    return (
      s.includes("mobile") ||
      s.includes("hp") ||
      s.includes("smartphone") ||
      s.includes("pwa") ||
      s.includes("android") ||
      s.includes("ios")
    )
  }

  const isSosmedGroup = (g: string) => {
    const s = g.toLowerCase()
    return (
      s.includes("sosmed") ||
      s.includes("sosial") ||
      s.includes("social") ||
      s.includes("komunitas") ||
      s.includes("temanviora")
    )
  }

  // Segregate desktop items and mobile/community items
  const desktopItems = useMemo(() => {
    const list = normalizedItems.filter(
      (item) => !isMobileGroup(item.group || "") && !isSosmedGroup(item.group || "")
    )
    return list.length > 0 ? list : normalizedItems
  }, [normalizedItems])

  const mobileTeacherItems = useMemo(() => {
    return normalizedItems.filter((item) => {
      const g = (item.group || "").toLowerCase()
      const t = (item.title || "").toLowerCase()
      return isMobileGroup(item.group || "") && (g.includes("guru") || t.includes("guru") || t.includes("mengajar") || t.includes("sesi"))
    })
  }, [normalizedItems])

  const mobileStudentItems = useMemo(() => {
    return normalizedItems.filter((item) => {
      const g = (item.group || "").toLowerCase()
      const t = (item.title || "").toLowerCase()
      return isMobileGroup(item.group || "") && (g.includes("siswa") || t.includes("siswa") || t.includes("bintang") || t.includes("kantin"))
    })
  }, [normalizedItems])

  const sosmedItems = useMemo(() => {
    return normalizedItems.filter((item) => isSosmedGroup(item.group || ""))
  }, [normalizedItems])

  const allMobileItems = useMemo(() => {
    return normalizedItems.filter(
      (item) => isMobileGroup(item.group || "") || isSosmedGroup(item.group || "")
    )
  }, [normalizedItems])

  // Desktop Slider State
  const [desktopIdx, setDesktopIdx] = useState<number>(0)
  const currentDesktopItem = desktopItems[desktopIdx] || desktopItems[0]

  // Mobile Persona Selection State
  const availablePersonas = useMemo(() => {
    const p: { id: string; label: string; count: number; items: ProductGalleryItem[] }[] = []
    if (mobileTeacherItems.length > 0) {
      p.push({ id: "guru", label: "📱 Portal Guru Mobile (PWA)", count: mobileTeacherItems.length, items: mobileTeacherItems })
    }
    if (mobileStudentItems.length > 0) {
      p.push({ id: "siswa", label: "🎒 Portal Siswa Mobile", count: mobileStudentItems.length, items: mobileStudentItems })
    }
    if (sosmedItems.length > 0) {
      p.push({ id: "sosmed", label: "💬 TemanViora Sosmed Sekolah", count: sosmedItems.length, items: sosmedItems })
    }
    if (p.length === 0 && allMobileItems.length > 0) {
      p.push({ id: "all", label: "📱 Aplikasi Mobile", count: allMobileItems.length, items: allMobileItems })
    }
    return p
  }, [mobileTeacherItems, mobileStudentItems, sosmedItems, allMobileItems])

  const [activePersonaId, setActivePersonaId] = useState<string>(() => availablePersonas[0]?.id || "guru")
  const currentPersona = availablePersonas.find((p) => p.id === activePersonaId) || availablePersonas[0]
  const currentMobileList = currentPersona?.items || allMobileItems

  // Mobile Screen Index
  const [mobileIdx, setMobileIdx] = useState<number>(0)
  const currentMobileItem = currentMobileList[mobileIdx] || currentMobileList[0]

  // ── REAL FULLSCREEN LIGHTBOX & ZOOM STATE ──────────────────────
  const [previewItem, setPreviewItem] = useState<ProductGalleryItem | null>(null)
  const [zoomScale, setZoomScale] = useState<number>(1)
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [showCaptionDetails, setShowCaptionDetails] = useState<boolean>(true)

  // Reset zoom whenever preview image changes
  useEffect(() => {
    setZoomScale(1)
    setPanOffset({ x: 0, y: 0 })
    setIsDragging(false)
  }, [previewItem])

  const handleNextPreview = useCallback(() => {
    if (!previewItem) return
    const curIdx = normalizedItems.findIndex((i) => i.url === previewItem.url)
    const nextIdx = (curIdx + 1) % normalizedItems.length
    setPreviewItem(normalizedItems[nextIdx])
  }, [previewItem, normalizedItems])

  const handlePrevPreview = useCallback(() => {
    if (!previewItem) return
    const curIdx = normalizedItems.findIndex((i) => i.url === previewItem.url)
    const prevIdx = (curIdx - 1 + normalizedItems.length) % normalizedItems.length
    setPreviewItem(normalizedItems[prevIdx])
  }, [previewItem, normalizedItems])

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!previewItem) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewItem(null)
      if (e.key === "ArrowLeft") handlePrevPreview()
      if (e.key === "ArrowRight") handleNextPreview()
      if (e.key === "+" || e.key === "=") setZoomScale((s) => Math.min(s + 0.4, 3))
      if (e.key === "-") setZoomScale((s) => Math.max(s - 0.4, 1))
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [previewItem, handlePrevPreview, handleNextPreview])

  // Toggle Zoom on Click / Double Click
  const handleToggleZoom = () => {
    setZoomScale((s) => (s > 1 ? 1 : 1.8))
    setPanOffset({ x: 0, y: 0 })
  }

  // Mouse drag handlers for panning when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomScale <= 1) return
    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomScale <= 1) return
    e.preventDefault()
    setPanOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }

  const handleMouseUp = () => setIsDragging(false)

  if (normalizedItems.length === 0) return null

  const handlePrevDesktop = () => {
    setDesktopIdx((prev) => (prev - 1 + desktopItems.length) % desktopItems.length)
  }

  const handleNextDesktop = () => {
    setDesktopIdx((prev) => (prev + 1) % desktopItems.length)
  }

  const handlePrevMobile = () => {
    setMobileIdx((prev) => (prev - 1 + currentMobileList.length) % currentMobileList.length)
  }

  const handleNextMobile = () => {
    setMobileIdx((prev) => (prev + 1) % currentMobileList.length)
  }

  // Preview index counter
  const previewItemIndex = previewItem ? normalizedItems.findIndex((i) => i.url === previewItem.url) + 1 : 1

  // Key feature highlight cards
  const showcaseFeatureCards = [
    desktopItems.find((i) => (i.title || "").toLowerCase().includes("face recognition")) || desktopItems[1],
    desktopItems.find((i) => (i.title || "").toLowerCase().includes("editor soal") || (i.title || "").toLowerCase().includes("cbt")) || desktopItems[11],
    desktopItems.find((i) => (i.title || "").toLowerCase().includes("jadwal")) || desktopItems[6],
    desktopItems.find((i) => (i.title || "").toLowerCase().includes("hall of fame") || (i.title || "").toLowerCase().includes("gamifikasi")) || desktopItems[5],
  ].filter(Boolean) as ProductGalleryItem[]

  return (
    <div className="w-full bg-background">
      {/* ── REAL FULLSCREEN CINEMA LIGHTBOX (ZOOM NYATA & GAMBAR MAKSIMAL) ── */}
      {previewItem && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-neutral-950/95 backdrop-blur-md select-none animate-in fade-in duration-200"
          onClick={() => setPreviewItem(null)}
        >
          {/* Top Floating Header HUD */}
          <div
            className="flex items-center justify-between border-b border-white/10 bg-black/60 px-4 py-3 backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Title & Badge */}
            <div className="flex items-center gap-2.5 min-w-0">
              <Badge variant="outline" className="rounded-none border-primary/50 bg-primary/10 text-primary font-semibold text-xs">
                {previewItem.group || "Screenshot"}
              </Badge>
              <h3 className="text-sm sm:text-base font-bold text-white truncate max-w-[280px] sm:max-w-md md:max-w-xl">
                {previewItem.title || product.name}
              </h3>
            </div>

            {/* Controls: Zoom In, Zoom Out, Reset, Prev, Next, Close */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Zoom controls */}
              <div className="hidden sm:flex items-center gap-1 border border-white/15 bg-neutral-900/80 px-2 py-1">
                <button
                  type="button"
                  onClick={() => setZoomScale((s) => Math.max(s - 0.4, 1))}
                  disabled={zoomScale <= 1}
                  className="p-1 text-white/70 hover:text-white disabled:opacity-30 cursor-pointer"
                  title="Zoom Out (-)"
                >
                  <ZoomOut className="size-4" />
                </button>
                <span className="text-xs font-mono font-bold text-white px-1.5 min-w-[42px] text-center">
                  {Math.round(zoomScale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomScale((s) => Math.min(s + 0.4, 3))}
                  disabled={zoomScale >= 3}
                  className="p-1 text-white/70 hover:text-white disabled:opacity-30 cursor-pointer"
                  title="Zoom In (+)"
                >
                  <ZoomIn className="size-4" />
                </button>
                {zoomScale > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setZoomScale(1)
                      setPanOffset({ x: 0, y: 0 })
                    }}
                    className="p-1 text-amber-400 hover:text-amber-300 cursor-pointer ml-1 border-l border-white/20 pl-1.5"
                    title="Reset Zoom (100%)"
                  >
                    <RotateCcw className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Prev / Next */}
              <div className="flex items-center gap-1 border border-white/15 bg-neutral-900/80 px-1 py-1">
                <button
                  type="button"
                  onClick={handlePrevPreview}
                  className="p-1 text-white/80 hover:text-white cursor-pointer"
                  title="Layar Sebelumnya (Panah Kiri)"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <span className="text-xs font-mono text-white/70 px-1">
                  {previewItemIndex}/{normalizedItems.length}
                </span>
                <button
                  type="button"
                  onClick={handleNextPreview}
                  className="p-1 text-white/80 hover:text-white cursor-pointer"
                  title="Layar Selanjutnya (Panah Kanan)"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>

              {/* Toggle Info Bar */}
              <button
                type="button"
                onClick={() => setShowCaptionDetails((v) => !v)}
                className={`p-1.5 border border-white/15 cursor-pointer transition-colors ${
                  showCaptionDetails ? "bg-primary text-primary-foreground" : "bg-neutral-900/80 text-white/80 hover:text-white"
                }`}
                title="Sembunyikan/Tampilkan Penjelasan"
              >
                <Info className="size-4" />
              </button>

              {/* Close */}
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="flex size-8 items-center justify-center border border-white/20 bg-neutral-900/80 text-white/80 hover:bg-rose-600 hover:text-white cursor-pointer transition-colors"
                aria-label="Tutup Layar Penuh"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Center Stage: REAL IMAGE MAXIMIZED (No fake frames, crystal clear) */}
          <div
            className={`relative flex-1 flex items-center justify-center overflow-hidden p-2 sm:p-4 ${
              zoomScale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
            }`}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onDoubleClick={handleToggleZoom}
            title={zoomScale > 1 ? "Geser mouse untuk panning" : "Klik dua kali untuk Zoom 180%"}
          >
            {/* The Raw Clean Image */}
            <img
              src={previewItem.url}
              alt={previewItem.title || product.name}
              draggable={false}
              style={{
                transform: `scale(${zoomScale}) translate(${panOffset.x / zoomScale}px, ${panOffset.y / zoomScale}px)`,
                transformOrigin: "center center",
                transition: isDragging ? "none" : "transform 0.15s ease-out",
              }}
              className={`max-w-[96vw] max-h-[85vh] object-contain shadow-2xl transition-all ${
                isMobileGroup(previewItem.group || "") || isSosmedGroup(previewItem.group || "")
                  ? "max-h-[88vh] w-auto"
                  : "w-auto"
              }`}
            />

            {/* Floating Left & Right Arrows on the edges */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handlePrevPreview()
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex size-11 items-center justify-center border border-white/20 bg-black/60 text-white hover:bg-black/90 cursor-pointer shadow-2xl backdrop-blur transition-transform hover:scale-110"
              title="Layar Sebelumnya"
            >
              <ChevronLeft className="size-6" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleNextPreview()
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex size-11 items-center justify-center border border-white/20 bg-black/60 text-white hover:bg-black/90 cursor-pointer shadow-2xl backdrop-blur transition-transform hover:scale-110"
              title="Layar Selanjutnya"
            >
              <ChevronRight className="size-6" />
            </button>
          </div>

          {/* Bottom Floating Caption Overlay (Clean translucent bar, non-intrusive) */}
          {showCaptionDetails && (previewItem.caption || (previewItem.features && previewItem.features.length > 0)) && (
            <div
              className="border-t border-white/10 bg-black/80 px-5 py-3 backdrop-blur-md max-h-[30vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto max-w-5xl">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-xs text-white/90 leading-relaxed font-medium">
                      {previewItem.caption}
                    </p>
                  </div>
                  {previewItem.features && previewItem.features.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 md:border-l border-white/15 pt-2 md:pt-0 md:pl-4">
                      {previewItem.features.map((feat, fIdx) => (
                        <span
                          key={fIdx}
                          className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 text-[11px] text-white/90 border border-white/10"
                        >
                          <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
                          <span>{feat}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── BAGIAN 1: DESKTOP & WEB ADMIN SLIDER (BERSIH TANPA FRAME BERLAPIS) ── */}
      {desktopItems.length > 0 && (
        <section className="border-b border-border py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            {/* Header terinspirasi Odoo */}
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="outline" className="rounded-none border-primary/30 px-3 py-1 font-semibold text-primary">
                <Laptop className="mr-1.5 size-3.5" />
                ANTARMUKA SISTEM UTAMA
              </Badge>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground md:text-5xl">
                Evolusi Pengelolaan Sekolah Terpadu
              </h2>
              <p className="mt-4 text-base text-muted-foreground md:text-lg">
                Seluruh modul operasional dirancang dalam satu platform web yang cepat, responsif, dan mudah digunakan.
                Geser ke kanan atau kiri untuk mengeksplorasi setiap modul.
              </p>
            </div>

            {/* Quick Filter Module Pills */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
              {desktopItems.map((item, idx) => {
                const isActive = idx === desktopIdx
                const shortLabel = item.title
                  ? item.title.split("-")[0].replace("Smart Absensi AI", "Face Recognition").trim()
                  : `Modul 0${idx + 1}`
                return (
                  <button
                    key={idx}
                    onClick={() => setDesktopIdx(idx)}
                    className={`px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer border ${
                      isActive
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {shortLabel}
                  </button>
                )
              })}
            </div>

            {/* Main Interactive Desktop Slider */}
            {currentDesktopItem && (
              <div className="mt-8 border border-border bg-card shadow-xl">
                {/* Clean Module Bar Header (NO FAKE BROWSER TABS) */}
                <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Badge className="rounded-none bg-primary text-primary-foreground font-semibold">
                      Modul {String(desktopIdx + 1).padStart(2, "0")} dari {desktopItems.length}
                    </Badge>
                    <span className="text-xs sm:text-sm font-bold text-foreground truncate max-w-[200px] sm:max-w-md">
                      {currentDesktopItem.title || "Tampilan Layar Modul"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={handlePrevDesktop}
                      className="size-8 rounded-none"
                      title="Modul Sebelumnya (Slide Kiri)"
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={handleNextDesktop}
                      className="size-8 rounded-none"
                      title="Modul Selanjutnya (Slide Kanan)"
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>

                {/* Slider Content: Preview Screen & Functional Description Side-by-Side */}
                <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
                  {/* Left: Clean Raw Image without nested fake borders */}
                  <div
                    className="relative lg:col-span-8 flex items-center justify-center bg-black/95 p-2 sm:p-4 group cursor-pointer border-b lg:border-b-0 lg:border-r border-border overflow-hidden"
                    onClick={() => setPreviewItem(currentDesktopItem)}
                  >
                    <img
                      src={currentDesktopItem.url}
                      alt={currentDesktopItem.title || "Tangkapan Layar"}
                      className="max-h-[500px] w-full object-contain transition-transform duration-300 group-hover:scale-[1.01]"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="flex items-center gap-2 border border-white/50 bg-black/90 px-4 py-2 text-xs font-bold text-white backdrop-blur shadow-2xl">
                        <Maximize2 className="size-4" /> Klik untuk Zoom Resolusi Asli (Tajam)
                      </span>
                    </div>
                  </div>

                  {/* Right: Functional Description Panel */}
                  <div className="lg:col-span-4 flex flex-col justify-between p-6 sm:p-8 bg-card">
                    <div>
                      <Badge variant="outline" className="rounded-none border-primary/40 text-primary font-semibold text-xs">
                        {currentDesktopItem.group || "Desktop / Web Admin"}
                      </Badge>

                      <h3 className="mt-3 text-xl sm:text-2xl font-extrabold text-foreground leading-snug">
                        {currentDesktopItem.title || "Layar Modul Sistem"}
                      </h3>

                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {currentDesktopItem.caption ||
                          "Modul terintegrasi yang memudahkan staf dan pengajar menjalankan operasional sekolah harian secara efisien."}
                      </p>

                      {currentDesktopItem.features && currentDesktopItem.features.length > 0 && (
                        <div className="mt-6 border-t border-border pt-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                            Fitur &amp; Fungsi Utama:
                          </p>
                          <ul className="mt-3 space-y-2.5">
                            {currentDesktopItem.features.map((feat, fIdx) => (
                              <li key={fIdx} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                                <span className="text-foreground leading-relaxed">{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="mt-8 pt-4 border-t border-border flex items-center justify-between">
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={() => setPreviewItem(currentDesktopItem)}
                        className="rounded-none gap-2 font-semibold"
                      >
                        <Eye className="size-4" />
                        Perbesar Gambar Asli
                      </Button>
                      <div className="flex gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handlePrevDesktop}
                          className="rounded-none text-xs"
                        >
                          Prev
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleNextDesktop}
                          className="rounded-none text-xs"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Horizontal Thumbnail Strip */}
                <div className="flex items-center gap-2 overflow-x-auto border-t border-border bg-muted/20 p-3">
                  {desktopItems.map((item, idx) => {
                    const isActive = idx === desktopIdx
                    return (
                      <button
                        key={idx}
                        onClick={() => setDesktopIdx(idx)}
                        className={`relative h-14 w-24 shrink-0 overflow-hidden border-2 transition-all cursor-pointer ${
                          isActive
                            ? "border-primary shadow-md scale-105"
                            : "border-border opacity-50 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={item.url}
                          alt={item.title || `Thumbnail ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute bottom-0 right-0 bg-black/80 px-1 text-[9px] font-mono text-white">
                          0{idx + 1}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── BAGIAN 2: MOBILE APPS & SOSMED SHOWCASE ── */}
      {availablePersonas.length > 0 && (
        <section className="border-b border-border bg-muted/20 py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            {/* Header */}
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="outline" className="rounded-none border-primary/30 px-3 py-1 font-semibold text-primary">
                <Smartphone className="mr-1.5 size-3.5" />
                PORTAL MOBILE PWA &amp; SOSMED SEKOLAH
              </Badge>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground md:text-5xl">
                Akses Fleksibel di Smartphone Guru &amp; Siswa
              </h2>
              <p className="mt-4 text-base text-muted-foreground md:text-lg">
                Responsif, ringan, dan siap pakai. Dilengkapi fitur 'Add to Home Screen' (PWA) tanpa perlu instalasi aplikasi berat dari Play Store.
              </p>
            </div>

            {/* Persona Switcher Tabs */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              {availablePersonas.map((persona) => {
                const isActive = persona.id === activePersonaId
                return (
                  <button
                    key={persona.id}
                    onClick={() => {
                      setActivePersonaId(persona.id)
                      setMobileIdx(0)
                    }}
                    className={`flex items-center gap-2 border px-5 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      isActive
                        ? "border-primary bg-primary text-primary-foreground shadow-md"
                        : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    }`}
                  >
                    <span>{persona.label}</span>
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold ${
                        isActive ? "bg-black/20 text-white" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {persona.count} Layar
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Interactive Smartphone Slide Showcase */}
            {currentMobileItem && (
              <div className="mt-10 grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
                {/* Left/Middle: Smartphone Frame with Sliding Controls */}
                <div className="flex flex-col items-center justify-center lg:col-span-5">
                  <div className="relative">
                    {/* Realistic iPhone Device Frame */}
                    <div
                      className="group relative w-[290px] sm:w-[320px] rounded-[44px] border-[10px] border-neutral-900 bg-neutral-950 p-2 shadow-2xl transition-all cursor-pointer ring-1 ring-white/10"
                      onClick={() => setPreviewItem(currentMobileItem)}
                    >
                      {/* Dynamic Island / Notch */}
                      <div className="absolute left-1/2 top-4 z-20 h-5 w-28 -translate-x-1/2 rounded-full bg-neutral-950 flex items-center justify-end px-3">
                        <span className="size-2 rounded-full bg-neutral-800" />
                      </div>

                      {/* Screen Container */}
                      <div className="relative overflow-hidden rounded-[34px] bg-black">
                        <img
                          src={currentMobileItem.url}
                          alt={currentMobileItem.title || "Tampilan Smartphone"}
                          className="h-[560px] w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                          <span className="flex items-center gap-1.5 border border-white/40 bg-black/85 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur shadow-xl">
                            <Maximize2 className="size-3.5" /> Klik untuk Zoom Resolusi Asli
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Left & Right Floating Slide Controls */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePrevMobile()
                      }}
                      className="absolute -left-5 top-1/2 -translate-y-1/2 flex size-10 items-center justify-center rounded-full border border-border bg-card shadow-xl hover:bg-muted text-foreground cursor-pointer z-10 transition-transform hover:scale-110"
                      title="Layar Sebelumnya"
                    >
                      <ChevronLeft className="size-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleNextMobile()
                      }}
                      className="absolute -right-5 top-1/2 -translate-y-1/2 flex size-10 items-center justify-center rounded-full border border-border bg-card shadow-xl hover:bg-muted text-foreground cursor-pointer z-10 transition-transform hover:scale-110"
                      title="Layar Selanjutnya"
                    >
                      <ChevronRight className="size-5" />
                    </button>
                  </div>

                  {/* Dot Indicators */}
                  <div className="mt-6 flex items-center gap-2">
                    {currentMobileList.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setMobileIdx(idx)}
                        className={`transition-all cursor-pointer ${
                          idx === mobileIdx
                            ? "h-2 w-7 bg-primary"
                            : "h-2 w-2 bg-muted-foreground/30 hover:bg-muted-foreground"
                        }`}
                        aria-label={`Slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Right: Functional Details & Feature Highlights */}
                <div className="lg:col-span-7 flex flex-col justify-center">
                  <div className="flex items-center gap-2">
                    <Badge className="rounded-none bg-primary text-primary-foreground font-semibold">
                      {currentMobileItem.group || currentPersona.label}
                    </Badge>
                    <span className="text-xs font-bold text-muted-foreground">
                      Layar {mobileIdx + 1} dari {currentMobileList.length}
                    </span>
                  </div>

                  <h3 className="mt-3 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                    {currentMobileItem.title || "Tampilan Layar Mobile"}
                  </h3>

                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                    {currentMobileItem.caption ||
                      "Antarmuka yang dioptimalkan khusus layar sentuh smartphone untuk kemudahan akses cepat di mana saja."}
                  </p>

                  {/* Checklist of features */}
                  {currentMobileItem.features && currentMobileItem.features.length > 0 && (
                    <div className="mt-6 border-t border-border pt-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Fungsi Layar Ini:
                      </p>
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {currentMobileItem.features.map((feat, fIdx) => (
                          <div
                            key={fIdx}
                            className="flex items-start gap-2.5 border border-border bg-card p-3.5 text-xs shadow-sm"
                          >
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                            <span className="leading-relaxed text-foreground">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Thumbnail Selector Bar for Mobile Screens */}
                  <div className="mt-8">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Pilih Layar {currentPersona.label}:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {currentMobileList.map((item, idx) => {
                        const isActive = idx === mobileIdx
                        return (
                          <button
                            key={idx}
                            onClick={() => setMobileIdx(idx)}
                            className={`flex items-center gap-2 border px-3 py-1.5 text-xs transition-all cursor-pointer ${
                              isActive
                                ? "border-primary bg-primary text-primary-foreground font-semibold shadow-sm"
                                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                            }`}
                          >
                            <span>0{idx + 1}.</span>
                            <span className="truncate max-w-[140px] sm:max-w-[200px]">
                              {item.title || `Layar #${idx + 1}`}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="mt-8 flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPreviewItem(currentMobileItem)}
                      className="rounded-none gap-2 font-semibold"
                    >
                      <Maximize2 className="size-4" />
                      Perbesar Gambar Asli
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      *Buka layar penuh tanpa bingkai untuk ketajaman maksimal
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── BAGIAN 3: FEATURE SHOWCASE CARDS (ODOO STYLE) ─── */}
      {showcaseFeatureCards.length > 0 && (
        <section className="border-b border-border py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="outline" className="rounded-none border-primary/30 px-3 py-1 font-semibold text-primary">
                <Sparkles className="mr-1.5 size-3.5" />
                FITUR UNGGULAN PILIHAN
              </Badge>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground md:text-5xl">
                Semua Fitur Dirancang dengan Tepat
              </h2>
              <p className="mt-4 text-base text-muted-foreground md:text-lg">
                Keandalan teknologi dan presisi alur operasional dirancang untuk mempermudah sekolah setiap hari.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
              {showcaseFeatureCards.map((card, idx) => (
                <div
                  key={idx}
                  className="group flex flex-col justify-between border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                        {card.title || `Fitur Unggulan #${idx + 1}`}
                      </h4>
                      <Star className="size-4 fill-amber-400 text-amber-400" />
                    </div>
                    {card.caption && (
                      <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {card.caption}
                      </p>
                    )}
                  </div>

                  {/* Screenshot Thumbnail Inside the Card */}
                  <div
                    className="mt-5 relative aspect-[16/9] w-full overflow-hidden border border-border bg-black/95 cursor-pointer"
                    onClick={() => setPreviewItem(card)}
                  >
                    <img
                      src={card.url}
                      alt={card.title || "Feature Preview"}
                      className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="flex items-center gap-1.5 border border-white/40 bg-black/85 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur shadow">
                        <Maximize2 className="size-3.5" /> Klik untuk Zoom Resolusi Asli
                      </span>
                    </div>
                  </div>

                  {card.features && card.features.length > 0 && (
                    <div className="mt-4 space-y-1.5 border-t border-border pt-3">
                      {card.features.slice(0, 2).map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="size-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          <span className="line-clamp-1">{feat}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
