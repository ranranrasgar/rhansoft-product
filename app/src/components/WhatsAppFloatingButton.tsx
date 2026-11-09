import { useState, useEffect } from "react"
import { MessageCircle, X, Sparkles } from "lucide-react"

const WHATSAPP_NUMBER = "6281333355871"

export function WhatsAppFloatingButton() {
  const [showTooltip, setShowTooltip] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // Show tooltip bubble after 4 seconds to catch attention without being annoying
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!dismissed) {
        setShowTooltip(true)
      }
    }, 4000)
    return () => clearTimeout(timer)
  }, [dismissed])

  const defaultMsg = encodeURIComponent(
    "Halo Tim Teknisi Rhansoft, saya ingin konsultasi rekomendasi software bisnis yang cocok untuk usaha saya dan cara coba demonya."
  )
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${defaultMsg}`

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2.5">
      {/* ════════ ATTRACTIVE GREETING BUBBLE ════════ */}
      {showTooltip && !dismissed && (
        <div className="relative w-72 border border-border bg-card p-4 shadow-2xl animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
          <button
            onClick={() => {
              setShowTooltip(false)
              setDismissed(true)
            }}
            aria-label="Tutup pesan bantuan"
            className="absolute right-2 top-2 text-muted-foreground hover:text-foreground p-1 transition-colors"
          >
            <X className="size-3.5" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Konsultan Software Online
            </span>
          </div>

          <h4 className="text-xs font-bold text-foreground leading-snug">
            Butuh Rekomendasi Software Usaha Anda?
          </h4>
          <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
            Bingung pilih yang cocok? Chat tim teknisi Rhansoft untuk konsultasi gratis & panduan coba demo.
          </p>

          <div className="mt-3 flex items-center gap-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                setShowTooltip(false)
                setDismissed(true)
              }}
              className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white px-3 py-1.5 text-xs font-semibold rounded-none transition-colors w-full justify-center shadow-sm"
            >
              <MessageCircle className="size-3.5" />
              <span>Chat WhatsApp Sekarang</span>
            </a>
          </div>
        </div>
      )}

      {/* ════════ MAIN FLOATING BUTTON ════════ */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Hubungi kami via WhatsApp"
        className="group flex items-center gap-2.5 border border-emerald-600/40 bg-[#25D366] hover:bg-[#20bd5a] text-white px-3.5 py-2.5 shadow-xl transition-all duration-200 hover:-translate-y-0.5"
      >
        <div className="relative">
          <MessageCircle className="size-5" />
          <span className="absolute -top-1 -right-1 size-2 rounded-full bg-white animate-ping" />
          <span className="absolute -top-1 -right-1 size-2 rounded-full bg-white" />
        </div>
        <div className="hidden sm:flex flex-col text-left">
          <span className="text-xs font-bold leading-tight flex items-center gap-1">
            Konsultasi / Demo
            <Sparkles className="size-3 text-amber-200" />
          </span>
          <span className="text-[10px] text-white/90 font-medium leading-none">
            Online • Respon Cepat
          </span>
        </div>
      </a>
    </div>
  )
}
