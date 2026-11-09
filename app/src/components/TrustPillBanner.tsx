import { ShieldCheck, Infinity, Laptop, Database, ArrowRight, MessageCircle } from "lucide-react"

const WHATSAPP_NUMBER = "6281333355871"

const trustPillars = [
  {
    icon: Infinity,
    title: "Beli Sekali, Pakai Selamanya",
    desc: "Tanpa biaya langganan bulanan / tahunan. Lisensi resmi permanen.",
    badge: "Hemat 100%",
  },
  {
    icon: Laptop,
    title: "Gratis Bantuan Setting & Install",
    desc: "Dipandu langsung oleh teknisi lewat AnyDesk sampai software siap jalan.",
    badge: "Support Penuh",
  },
  {
    icon: Database,
    title: "Database Milik Anda Sendiri",
    desc: "Bisa berjalan offline tanpa internet. Data bisnis 100% aman & rahasia.",
    badge: "Bisa Offline",
  },
  {
    icon: ShieldCheck,
    title: "Garansi Error & Bug Seumur Hidup",
    desc: "Dukungan teknis responsif jika terjadi kendala operasional harian.",
    badge: "Garansi Resmi",
  },
]

export function TrustPillBanner() {
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    "Halo Tim Rhansoft, saya ingin konsultasi software bisnis dan minta rekomendasi paket yang cocok."
  )}`

  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        {/* Top header pill */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/80 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
              <ShieldCheck className="size-4" />
              Jaminan & Keamanan Pembelian Rhansoft
            </div>
            <h3 className="mt-1 text-lg font-bold text-foreground sm:text-xl">
              Mengapa 1.200+ Pemilik Bisnis Memilih Software Rhansoft?
            </h3>
          </div>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <MessageCircle className="size-3.5" />
            <span>Tanya Teknisi via WhatsApp</span>
            <ArrowRight className="size-3" />
          </a>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trustPillars.map((item, idx) => {
            const Icon = item.icon
            return (
              <div
                key={idx}
                className="group flex flex-col justify-between border border-border/90 bg-muted/20 p-4 transition-all duration-200 hover:border-primary/50 hover:bg-card"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex size-9 items-center justify-center border border-border bg-background text-primary">
                      <Icon className="size-4.5" />
                    </div>
                    <span className="border border-border bg-background px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                      {item.badge}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

