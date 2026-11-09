import { Star, CheckCircle2, Store, HeartPulse, Building, MessageCircle } from "lucide-react"

const WHATSAPP_NUMBER = "6281333355871"

const testimonials = [
  {
    name: "Bpk. Hendra Wijaya",
    business: "Minimarket Jaya Sentosa — Surabaya",
    software: "Software Toko Rhansoft (POS)",
    icon: Store,
    rating: 5,
    quote:
      "Aplikasi kasirnya sangat stabil dan cepat. Yang paling saya suka adalah sistem sekali bayar tanpa biaya bulanan sama sekali. Printer thermal dan barcode scanner langsung terdeteksi, dibantu setting via AnyDesk sampai tuntas.",
    metrics: "4 Mesin Kasir • 6.500+ SKU Barang",
  },
  {
    name: "dr. Ratna Kartika",
    business: "Klinik & Apotek Sehat Mandiri — Bandung",
    software: "Software Klinik & Puskesmas",
    icon: HeartPulse,
    rating: 5,
    quote:
      "Pencatatan rekam medis pasien dan stok obat jadi sangat rapi. Peringatan masa kedaluwarsa obat sangat membantu menghindari kerugian. Tim support Rhansoft sangat ramah dan sabar memandu staf kami.",
    metrics: "2 Cabang Apotek • 120 Pasien/Hari",
  },
  {
    name: "Bpk. Agus Prasetyo",
    business: "CV Mitra Distribusi — Semarang",
    software: "Accounting Rhansoft",
    icon: Building,
    rating: 5,
    quote:
      "Laporan laba rugi, neraca saldo, dan arus kas otomatis terbentuk tanpa perlu pusing rumus Excel lagi. Sangat memudahkan pembuatan SPT tahunan dan evaluasi keuangan usaha setiap bulan.",
    metrics: "Omzet Ratusan Juta • Multi-Akun",
  },
]

const stats = [
  { value: "1.200+", label: "Lisensi Aktif Terpasang" },
  { value: "34", label: "Provinsi di Seluruh Indonesia" },
  { value: "99.4%", label: "Kepuasan Pemasangan & Panduan" },
  { value: "0 Rupiah", label: "Biaya Bulanan (100% Milik Anda)" },
]

export function SocialProofSection() {
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    "Halo Tim Rhansoft, saya ingin tanya testimoni dan demo software untuk usaha saya."
  )}`

  return (
    <section className="border-t border-border bg-muted/30 py-12 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 border border-border bg-card px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary mb-3">
            <CheckCircle2 className="size-3.5" />
            Bukti Nyata Penggunaan
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            Dipercaya Pemilik Bisnis & Toko di Indonesia
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Dengarkan pengalaman langsung dari pelaku usaha yang telah mengotomatisasi operasional toko, klinik, dan kantor mereka bersama Rhansoft.
          </p>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-12">
          {stats.map((s, idx) => (
            <div
              key={idx}
              className="border border-border bg-card p-4 sm:p-6 text-center transition-all hover:border-primary/40"
            >
              <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
                {s.value}
              </div>
              <p className="mt-1 text-[11px] sm:text-xs font-medium text-muted-foreground">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Testimonials 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, idx) => {
            const Icon = t.icon
            return (
              <div
                key={idx}
                className="flex flex-col justify-between border border-border bg-card p-5 sm:p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex size-10 items-center justify-center border border-border bg-muted/40 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed italic">
                    "{t.quote}"
                  </p>
                </div>

                <div className="mt-6 border-t border-border pt-4">
                  <h4 className="text-xs sm:text-sm font-bold text-foreground">
                    {t.name}
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    {t.business}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[10px] font-semibold">
                    <span className="text-primary">{t.software}</span>
                    <span className="text-muted-foreground/80">{t.metrics}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom banner for hesitant customers */}
        <div className="mt-12 border border-border bg-card p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h4 className="text-sm sm:text-base font-bold text-foreground">
              Masih Ragu Apakah Software Ini Cocok untuk Usaha Anda?
            </h4>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Ceritakan alur usaha Anda, tim teknisi kami akan mendemokan alurnya secara langsung via WhatsApp atau video call.
            </p>
          </div>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-none transition-colors shrink-0 justify-center"
          >
            <MessageCircle className="size-4" />
            Minta Demo Alur Usaha Saya
          </a>
        </div>
      </div>
    </section>
  )
}

