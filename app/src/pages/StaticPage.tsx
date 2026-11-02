import { useParams, useNavigate as useRouterNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Mail, Phone, MapPin } from "lucide-react"
import { useEffect } from "react"

type Section = {
  heading: string
  body: string | string[]
}

type PageContent = {
  title: string
  subtitle: string
  sections: Section[]
}

const pages: Record<string, PageContent> = {
  "privacy-policy": {
    title: "Kebijakan Privasi",
    subtitle: "Bagaimana Rhansoft mengumpulkan, menggunakan, dan melindungi data Anda.",
    sections: [
      {
        heading: "1. Pendahuluan",
        body: 'Rhansoft Management ("Rhansoft") berkomitmen melindungi privasi pengguna aplikasi dan layanan kami. Kebijakan ini menjelaskan jenis data yang kami kumpulkan, bagaimana data digunakan, dan hak Anda atas data tersebut.',
      },
      {
        heading: "2. Data yang Kami Kumpulkan",
        body: [
          "Data identitas: nama, nama perusahaan, nomor telepon, dan alamat email yang Anda berikan saat registrasi.",
          "Data transaksi: riwayat pembelian, lisensi software, dan metode pembayaran (kami tidak menyimpan data kartu kredit secara langsung).",
          "Data teknis: alamat IP, jenis browser, sistem operasi, dan log aktivitas untuk keperluan keamanan dan peningkatan layanan.",
        ],
      },
      {
        heading: "3. Penggunaan Data",
        body: "Data yang dikumpulkan digunakan untuk: memproses pesanan dan lisensi software, memberikan dukungan teknis, mengirim informasi pembaruan produk, serta meningkatkan kualitas layanan kami. Kami tidak menjual data pribadi Anda kepada pihak ketiga.",
      },
      {
        heading: "4. Keamanan Data",
        body: "Kami menerapkan langkah-langkah keamanan teknis dan organisasi yang wajar untuk melindungi data Anda, termasuk enkripsi, kontrol akses, dan audit berkala. Namun, tidak ada metode transmisi internet yang 100% aman.",
      },
      {
        heading: "5. Hak Pengguna",
        body: "Anda berhak mengakses, memperbaiki, atau menghapus data pribadi yang tersimpan. Untuk permintaan tersebut, silakan hubungi kami melalui email support@rhansoft.com.",
      },
      {
        heading: "6. Perubahan Kebijakan",
        body: "Kebijakan privasi ini dapat diperbarui sewaktu-waktu. Perubahan akan dipublikasikan di halaman ini dengan tanggal pembaruan terbaru.",
      },
    ],
  },
  "terms-of-use": {
    title: "Syarat & Ketentuan",
    subtitle: "Ketentuan penggunaan software dan layanan Rhansoft.",
    sections: [
      {
        heading: "1. Penerimaan Ketentuan",
        body: "Dengan mengakses dan menggunakan software, website, atau layanan Rhansoft, Anda menyetujui untuk terikat oleh syarat dan ketentuan ini. Jika Anda tidak menyetujui, mohon tidak menggunakan layanan kami.",
      },
      {
        heading: "2. Lisensi Software",
        body: "Lisensi software yang Anda beli bersifat non-eksklusif dan tidak dapat dipindahtangankan tanpa izin tertulis dari Rhansoft. Setiap lisensi berlaku untuk satu entitas/perusahaan kecuali dinyatakan lain.",
      },
      {
        heading: "3. Pembayaran & Refund",
        body: [
          "Pembayaran dilakukan melalui transfer bank atau metode pembayaran yang disediakan.",
          "Lisensi tahunan dapat di-refund dalam 14 hari setelah pembelian jika software tidak berfungsi sesuai deskripsi dan masalah teknis tidak dapat diselesaikan.",
          "Biaya implementasi dan training yang sudah dimulai tidak dapat di-refund.",
        ],
      },
      {
        heading: "4. Larangan",
        body: "Pengguna dilarang: menyalin, mendistribusikan, atau memodifikasi software tanpa izin; menggunakan software untuk aktivitas ilegal; atau melakukan reverse engineering.",
      },
      {
        heading: "5. Batasan Tanggung Jawab",
        body: "Rhansoft tidak bertanggung jawab atas kerugian tidak langsung, kehilangan keuntungan, atau kerusakan data akibat penggunaan software. Tanggung jawab maksimal kami terbatas pada harga pembelian lisensi.",
      },
      {
        heading: "6. Hukum yang Berlaku",
        body: "Syarat dan ketentuan ini diatur oleh hukum Republik Indonesia. Setiap sengketa akan diselesaikan di pengadilan Bandung, Indonesia.",
      },
    ],
  },
  "kebijakan": {
    title: "Kebijakan Perusahaan",
    subtitle: "Kebijakan operasional dan standar layanan Rhansoft Management.",
    sections: [
      {
        heading: "Kebijakan Kualitas",
        body: "Rhansoft berkomitmen menghadirkan software berkualitas tinggi yang andal, aman, dan mudah digunakan. Setiap produk melalui pengujian menyeluruh sebelum dirilis.",
      },
      {
        heading: "Kebijakan Dukungan Pelanggan",
        body: "Kami menyediakan dukungan teknis melalui email, telepon, dan WhatsApp pada jam kerja (Senin–Jumat, 09.00–17.00 WIB). Respons dijamin dalam maksimal 1×24 jam untuk email dan 2 jam untuk WhatsApp.",
      },
      {
        heading: "Kebijakan Pembaruan",
        body: "Lisensi tahunan mencakup pembaruan minor dan major selama masa berlaku lisensi. Pembaruan keamanan diberikan gratis untuk semua pengguna aktif.",
      },
      {
        heading: "Kebijakan Privasi Data",
        body: "Kami menghormati privasi pelanggan. Data yang dikumpulkan hanya digunakan untuk operasional dan peningkatan layanan. Lihat Kebijakan Privasi untuk detail lengkap.",
      },
      {
        heading: "Kebijakan Reseller & Partner",
        body: "Rhansoft terbuka untuk kerja sama reseller dan partner. Hubungi kami untuk informasi program partner dan ketentuan kerja sama.",
      },
    ],
  },
  "tentang": {
    title: "Tentang Rhansoft",
    subtitle: "Mitra software bisnis Indonesia sejak 2008.",
    sections: [
      {
        heading: "Tentang Kami",
        body: "Rhansoft Management adalah perusahaan pengembang software bisnis yang berbasis di Bandung, Indonesia. Sejak 2008, kami telah mengembangkan lebih dari 30 aplikasi untuk berbagai industri: retail, kesehatan, perhotelan, pendidikan, dan lainnya.",
      },
      {
        heading: "Visi & Misi",
        body: "Visi kami menjadi penyedia software bisnis terdepan untuk UMKM hingga enterprise di Indonesia. Misi kami menghadirkan solusi software yang terjangkau, andal, dan mudah digunakan untuk meningkatkan efisiensi bisnis pelanggan.",
      },
      {
        heading: "Lokasi Kantor",
        body: "Head Office: Jl. Griya Hamdan Asri No 09, Arcamanik, Bandung. Kami melayani pelanggan di seluruh Indonesia secara online dan onsite untuk wilayah Bandung dan sekitarnya.",
      },
      {
        heading: "Hubungi Kami",
        body: "Phone: 081333335871 | Email: support@rhansoft.com / rhansoft.indonesia@gmail.com. Tim kami siap membantu kebutuhan software bisnis Anda.",
      },
    ],
  },
  "kontak": {
    title: "Hubungi Kami",
    subtitle: "Tim Rhansoft siap membantu kebutuhan software bisnis Anda.",
    sections: [
      {
        heading: "Informasi Kontak",
        body: "Hubungi kami untuk konsultasi gratis, demo software, atau pertanyaan teknis. Kami merespons dengan cepat pada jam kerja.",
      },
      {
        heading: "Kantor Pusat",
        body: "Rhansoft Management — Jl. Griya Hamdan Asri No 09, Arcamanik, Bandung.",
      },
      {
        heading: "Telepon & WhatsApp",
        body: "081333335871 — Hubungi kami via telepon atau WhatsApp untuk respons cepat.",
      },
      {
        heading: "Email",
        body: "support@rhansoft.com (support teknis) | rhansoft.indonesia@gmail.com (umum & sales).",
      },
    ],
  },
  "faq": {
    title: "Pertanyaan Umum (FAQ)",
    subtitle: "Jawaban untuk pertanyaan yang sering diajukan.",
    sections: [
      {
        heading: "Bagaimana cara membeli software Rhansoft?",
        body: "Anda dapat membeli melalui website ini dengan menambahkan produk ke keranjang dan menyelesaikan checkout, atau menghubungi kami langsung via WhatsApp/telepon untuk konsultasi dan pemesanan.",
      },
      {
        heading: "Apakah tersedia versi demo/uji coba?",
        body: "Ya, kami menyediakan uji coba gratis untuk sebagian besar produk. Hubungi tim kami untuk mendapatkan akses demo.",
      },
      {
        heading: "Bagaimana proses installasi?",
        body: "Lisensi mencakup panduan installasi. Untuk pelanggan yang membutuhkan, kami juga menyediakan layanan installasi onsite (Bandung dan sekitar) atau remote untuk seluruh Indonesia.",
      },
      {
        heading: "Apakah lisensi mencakup update?",
        body: "Lisensi tahunan mencakup semua pembaruan (minor & major) selama masa berlaku. Setelah berakhir, software tetap dapat digunakan tanpa update terbaru.",
      },
      {
        heading: "Apakah software bisa dikustom?",
        body: "Ya, kami menerima request custom software dan modifikasi produk existing. Hubungi tim sales untuk diskusi kebutuhan dan penawaran.",
      },
      {
        heading: "Metode pembayaran apa saja?",
        body: "Kami menerima transfer bank (BCA, BNI, Mandiri, BRI) dan pembayaran lain yang disepakati. Untuk pelanggan enterprise, tersedia opsi invoice.",
      },
    ],
  },
}

export function StaticPage() {
  const { slug } = useParams<{ slug: string }>()
  const routerNavigate = useRouterNavigate()
  const page = slug ? pages[slug] : null

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [slug])

  if (!page) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Halaman tidak ditemukan</h1>
        <p className="mt-2 text-muted-foreground">
          Maaf, halaman yang Anda cari tidak tersedia.
        </p>
        <Button
          className="mt-6 rounded-full"
          onClick={() => routerNavigate("/")}
        >
          <ArrowLeft className="size-4" />
          Kembali ke beranda
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-secondary/20">
      {/* Hero */}
      <div className="border-b border-border bg-background">
        <div className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-20">
          <button
            onClick={() => routerNavigate("/")}
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            Beranda
          </button>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            {page.title}
          </h1>
          <p className="mt-3 text-base text-muted-foreground md:text-lg">
            {page.subtitle}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
        <div className="space-y-8">
          {page.sections.map((section, idx) => (
            <section key={idx} className="rounded-2xl border border-border bg-background p-6 md:p-8">
              <h2 className="text-lg font-semibold md:text-xl">
                {section.heading}
              </h2>
              {Array.isArray(section.body) ? (
                <ul className="mt-3 space-y-2">
                  {section.body.map((item, i) => (
                    <li
                      key={i}
                      className="flex gap-2 text-sm leading-relaxed text-muted-foreground md:text-[15px]"
                    >
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-[15px]">
                  {section.body}
                </p>
              )}
            </section>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 rounded-2xl bg-slate-950 p-8 text-white">
          <h3 className="text-lg font-bold">Masih ada pertanyaan?</h3>
          <p className="mt-2 text-sm text-white/70">
            Tim Rhansoft siap membantu. Hubungi kami melalui kontak di bawah ini.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <a
              href="tel:081333335871"
              className="flex items-center gap-2 text-sm text-white/90 hover:text-white"
            >
              <Phone className="size-4" />
              081333335871
            </a>
            <a
              href="mailto:support@rhansoft.com"
              className="flex items-center gap-2 text-sm text-white/90 hover:text-white"
            >
              <Mail className="size-4" />
              support@rhansoft.com
            </a>
            <a
              href="https://maps.google.com/?q=Jl.+Griya+Hamdan+Asri+No+09+Arcamanik+Bandung"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-white/90 hover:text-white"
            >
              <MapPin className="size-4" />
              Arcamanik, Bandung
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
