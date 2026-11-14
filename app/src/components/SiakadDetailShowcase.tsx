import { useState } from "react"
import {
  Smartphone,
  CheckCircle2,
  ShieldCheck,
  Maximize2,
  X,
  ChevronRight,
  UserCheck,
  LayoutDashboard,
  Laptop,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export type ShowcaseImage = {
  id: string
  title: string
  category: string
  src: string
  tag: string
  desc: string
  features: string[]
  type: "web" | "mobile"
}

export const siakadModules: ShowcaseImage[] = [
  {
    id: "dashboard",
    title: "Dashboard Eksekutif & Real-time Monitoring",
    category: "Admin & Yayasan",
    src: "/img/siakad/01-dashboard-administrator.jpg",
    tag: "Modul 01",
    type: "web",
    desc: "Pusat kendali utama bagi Administrator, Kepala Sekolah, dan Yayasan untuk memantau aktivitas operasional sekolah secara real-time dari satu layar terintegrasi.",
    features: [
      "Monitoring statistik harian: Total 447 Siswa Aktif, 32 Guru, dan Sesi KBM Berjalan.",
      "Grafik tren 7 hari pergerakan kehadiran siswa, guru, dan ketercapaian KBM.",
      "Snapshot indikator operasional cepat (Presensi Siswa %, Presensi Guru %, KBM Selesai %).",
      "Akses cepat ke database siswa, staf, akademik, dan konfigurasi multi-tahun ajaran (Ganjil/Genap).",
    ],
  },
  {
    id: "face-scan",
    title: "Smart Absensi AI - Face Recognition Scanner",
    category: "Smart Absensi AI",
    src: "/img/siakad/02-absensi-face-recognition.jpg",
    tag: "Modul 02",
    type: "web",
    desc: "Sistem presensi digital touchless berbasis kecerdasan buatan (Face Recognition). Mendeteksi wajah siswa dan pegawai secara otomatis dalam hitungan detik.",
    features: [
      "Biometric Scanner AI otomatis mengenali wajah tanpa kartu ataupun sentuhan fisik.",
      "Live Logs kedatangan real-time mencatat jam hadir presisi detik demi detik.",
      "Filter presensi cepat antara Siswa dan Pegawai/Guru dengan kontrol audio bersuara.",
      "Mendukung Kiosk Mode layar penuh untuk ditempatkan di tablet atau monitor lobi gerbang sekolah.",
    ],
  },
  {
    id: "absensi-kbm",
    title: "Absensi KBM Terpadu per Mata Pelajaran",
    category: "KBM & Akademik",
    src: "/img/siakad/03-absensi-kbm-mapel.jpg",
    tag: "Modul 03",
    type: "web",
    desc: "Pencatatan presensi kehadiran siswa per jam tatap muka pelajaran (KBM) langsung oleh guru pengampu mapel bersangkutan.",
    features: [
      "Matrix presensi harian per tanggal 1-31 dalam satu bulan kalender akademik.",
      "Status kehadiran berkode warna: Hadir (H - Hijau), Terlambat (T - Kuning), Sakit/Izin (S/I - Biru), Alpa (A - Merah).",
      "Filter dinamis berdasarkan Tahun Ajaran, Semester, Nama Guru Pengampu, Mapel, Bulan, dan Rombel.",
      "Tombol shortcut terhubung ke Face Scanner dan pengiriman Notifikasi kehadiran ke wali murid.",
    ],
  },
  {
    id: "kalender-bulanan",
    title: "Kalender Presensi Bulanan Seluruh Siswa",
    category: "Monitoring BK & Wali Kelas",
    src: "/img/siakad/04-absensi-kalender-bulanan.jpg",
    tag: "Modul 04",
    type: "web",
    desc: "Matriks kehadiran bulanan terpadu untuk memantau rekam jejak kedisiplinan dan absensi siswa dalam satu kelas penuh secara holistik.",
    features: [
      "Tampilan tabel matriks kalender presensi harian seluruh rombel kelas.",
      "Ringkasan otomatis di kolom kanan (Total Hadir, Terlambat, Sakit, Izin, Alpa, Cuti, dan Libur).",
      "Pencarian cepat nama siswa atau NIS dan filter kelas instan.",
      "Mempermudah guru Bimbingan Konseling (BK) dan Wali Kelas mengidentifikasi siswa yang membutuhkan pembinaan.",
    ],
  },
  {
    id: "rekap-kehadiran",
    title: "Rekap Kehadiran Siswa & Progress Akumulasi JP",
    category: "Analisis Kedisiplinan",
    src: "/img/siakad/05-rekap-kehadiran-persentase.jpg",
    tag: "Modul 05",
    type: "web",
    desc: "Visualisasi persentase kehadiran siswa dan akumulasi Jam Pelajaran (JP) KBM yang telah diikuti untuk evaluasi kelayakan ujian dan rapor.",
    features: [
      "Visual progress bar hari masuk efektif (misal 19 dari 22 hari, rincian tepat waktu vs alpa).",
      "Pelacakan total Jam Pelajaran (JP) KBM yang diikuti (contoh: 209 dari 240 JP atau 87%).",
      "Indikator warna batas minimal kehadiran (merah jika berada di bawah ambang batas minimal sekolah).",
      "Data rekap siap dicetak untuk bahan rapat evaluasi wali murid dan penilaian rapor digital.",
    ],
  },
  {
    id: "hall-of-fame",
    title: "Gamifikasi Siswa - 'Hall of Fame' Leaderboard",
    category: "Kesiswaan & Prestasi",
    src: "/img/siakad/06-gamifikasi-hall-of-fame.jpg",
    tag: "Modul 06",
    type: "web",
    desc: "Sistem peringkat performa siswa terintegrasi untuk menciptakan iklim belajar yang kompetitif, positif, dan memacu semangat siswa berprestasi.",
    features: [
      "Panggung juara Hall of Fame menampilkan Rank 1, 2, 3 dengan piala kehormatan dan persentase skor performa.",
      "Penilaian multi-segi: Kehadiran KBM, Kedisiplinan Harian, Pembiasaan Ibadah (Shalat Dhuha/Ekstra), dan Perilaku.",
      "Leaderboard dinamis dapat difilter per rombel, per jenjang (SMP/SMK), maupun per periode waktu.",
      "Menumbuhkan rasa percaya diri siswa dan transparansi penilaian prestasi.",
    ],
  },
  {
    id: "jadwal-pelajaran",
    title: "Manajemen Jadwal Pelajaran (Tampilan Kolom Jam)",
    category: "Kurikulum & Jadwal",
    src: "/img/siakad/07-jadwal-pelajaran-kolom.jpg",
    tag: "Modul 07",
    type: "web",
    desc: "Pengaturan dan penyusunan jadwal mengajar guru dari hari Senin sampai Jumat dalam format kolom jam terstruktur yang anti-bentrok.",
    features: [
      "Monitoring beban kurikulum: 501 Sesi Terjadwal, 15 Rombel Kelas, dan 25 Guru Pengajar.",
      "Format matriks kolom jam (06:30 - 07:00, 07:00 - 08:00, dst) memudahkan pembacaan jadwal harian.",
      "Mendukung slot pembiasaan karakter sekolah: Shalat Dhuha, Upacara Bendera, dan Kegiatan Literasi.",
      "Sistem anti-bentrok memastikan tidak ada guru atau ruang kelas yang terjadwal ganda pada jam yang sama.",
    ],
  },
  {
    id: "guru-pengganti",
    title: "Kelola Permintaan Guru Pengganti (Inval)",
    category: "Manajemen KBM & Inval",
    src: "/img/siakad/08-guru-pengganti-inval.png",
    tag: "Modul 08",
    type: "web",
    desc: "Solusi otomatisasi izin mengajar dan penugasan guru pengganti (inval) saat guru utama berhalangan hadir atau sedang tugas dinas luar.",
    features: [
      "Pencatatan jelas: Guru Utama, Guru Pengganti yang ditunjuk, Mapel, Kelas, dan Jam Pelajaran.",
      "Workflow persetujuan (approval) transparan oleh bagian Kurikulum atau Kepala Sekolah.",
      "Status pelacakan real-time (Disetujui, Ditolak, Telah Diproses).",
      "Menjamin kelas tidak mengalami jam kosong (zero free-hour) demi kualitas belajar mengajar.",
    ],
  },
  {
    id: "rekap-nilai",
    title: "Rekap Nilai Harian & Buku Nilai Digital Terpadu",
    category: "Penilaian & E-Rapor",
    src: "/img/siakad/09-rekap-nilai-harian-erapor.jpg",
    tag: "Modul 09",
    type: "web",
    desc: "Buku nilai digital komprehensif untuk mengelola nilai harian, tugas, asesmen, dan ujian siswa seluruh mata pelajaran.",
    features: [
      "Matriks nilai lengkap semua mapel: PAI, BTQ Al-Quran, Bhs Indonesia, Sunda, Inggris, IPA, IPS, Matematika, Informatika.",
      "Formula otomatis: normalisasi nilai asesmen & CBT ke skala 100 serta perhitungan rerata total per siswa.",
      "Filter fleksibel per rombel kelas (IX A Ganjil, dll), jenis asesmen, dan semester aktif.",
      "Fasilitas Input Nilai Baru, Cek Data per Tahun, serta export instan ke format Excel.",
    ],
  },
  {
    id: "database-siswa",
    title: "Kesiswaan & Database Induk Siswa (Master Siswa)",
    category: "Kesiswaan & Data Induk",
    src: "/img/siakad/10-kesiswaan-database-siswa.jpg",
    tag: "Modul 10",
    type: "web",
    desc: "Pusat database kesiswaan lengkap mulai dari profil siswa, biodata, NIS/NISN, data wali kelas, hingga status keaktifan siswa.",
    features: [
      "Profil siswa lengkap dengan foto, ID/NIS, kelas, rombel, dan wali kelas pendamping.",
      "Fitur 'Cetak Info Login (PDF)' massal untuk dibagikan ke siswa dan wali murid untuk akses portal.",
      "Export Excel dan Import Siswa baru via template Excel untuk mempermudah tahun ajaran baru & PPDB.",
      "Monitoring Siswa Online dan pencatatan aktivitas login siswa secara real-time.",
    ],
  },
  {
    id: "bank-soal-cbt",
    title: "Ujian & CBT / Bank Soal Komprehensif",
    category: "CBT & Asesmen Sekolah",
    src: "/img/siakad/11-ujian-cbt-bank-soal.jpg",
    tag: "Modul 11",
    type: "web",
    desc: "Platform Computer Based Test (CBT) mandiri untuk menyelenggarakan PTS, PAS, PSAT, Asesmen Madrasah, dan Ujian Sekolah secara paperless.",
    features: [
      "Manajemen paket soal terstruktur per jenjang SMP dan SMK beserta konfigurasi KKM.",
      "Fleksibilitas tipe soal: Pilihan Ganda (PG), Pilihan Ganda Kompleks (Multi), Menjodohkan (Matching), dan Essay.",
      "Modul terintegrasi: Bank Soal, Sesi Ujian (Jadwal & Token Acak), Live Monitoring Ujian, dan Analisis Hasil Nilai.",
      "Fasilitas Template Excel untuk impor puluhan bank soal sekaligus secara praktis.",
    ],
  },
  {
    id: "editor-cbt-preview",
    title: "Editor Soal CBT Interaktif & Live Smartphone Preview",
    category: "CBT & Soal Interaktif",
    src: "/img/siakad/12-cbt-editor-live-preview.png",
    tag: "Modul 12",
    type: "web",
    desc: "Editor penyusunan butir soal ujian mutakhir dengan simulator langsung tampilan di layar smartphone siswa.",
    features: [
      "Dukungan Rich HTML Editor & rumus matematika/sains dengan formula MathJax / LaTeX.",
      "Live Smartphone Preview di sisi kanan editor: guru melihat langsung persis bagaimana soal muncul di HP siswa.",
      "Navigasi nomor butir soal (1-40) dengan status kunci jawaban dan bobot poin otomatis.",
      "Opsi pilihan jawaban A, B, C, D, E dengan kemudahan penentuan kunci jawaban satu klik.",
    ],
  },
]

export const siakadMobileScreens: ShowcaseImage[] = [
  {
    id: "mobile-portal-guru",
    title: "Portal Guru Mobile & PWA Install to Home Screen",
    category: "PWA Mobile App",
    src: "/img/siakad/mobile-01-beranda-pwa.jpg",
    tag: "Mobile 01",
    type: "mobile",
    desc: "Tampilan beranda portal guru di smartphone yang dirancang sebagai Progressive Web App (PWA). Guru dapat memasang aplikasi langsung ke layar utama HP via 'Add to Home Screen' tanpa melalui Play Store.",
    features: [
      "Akses cepat dari browser smartphone iOS & Android tanpa makan memori penyimpanan HP.",
      "Menampilkan profil guru, status mengajar, jam mulai absen pagi (06:45), dan ranking performa guru.",
      "Notifikasi instan dan akses cepat menu Beranda, Jadwal, Presensi, dan Siswa.",
    ],
  },
  {
    id: "mobile-jadwal-libur",
    title: "Monitoring Jadwal Mengajar & Status Hari Libur",
    category: "Jadwal di Smartphone",
    src: "/img/siakad/mobile-02-jadwal-libur.png",
    tag: "Mobile 02",
    type: "mobile",
    desc: "Guru dapat memeriksa jadwal mengajar harian kapan saja dari HP, lengkap dengan pengingat otomatis hari libur.",
    features: [
      "Pemberitahuan status hari libur otomatis (contoh: Libur Rutin Sabtu, presensi dinonaktifkan sementara).",
      "Pilihan hari mengajar (Senin, Selasa, Rabu, Kamis) dengan jumlah sesi mengajar.",
      "Informasi waktu istirahat yang jelas dan terstruktur.",
    ],
  },
  {
    id: "mobile-sesi-mengajar",
    title: "Daftar Sesi Mata Pelajaran per Rombel di HP",
    category: "Sesi KBM Mobile",
    src: "/img/siakad/mobile-03-daftar-sesi-mengajar.png",
    tag: "Mobile 03",
    type: "mobile",
    desc: "Daftar lengkap sesi mengajar guru per hari dengan informasi jam pelajaran dan rombel kelas yang dituju.",
    features: [
      "Rincian jadwal mata pelajaran per jam (contoh: Perangkat Lunak Desain XII DKV 08:00-10:00, 10:30-12:15, 13:00-14:00).",
      "Status sesi aktif vs sesi yang telah lewat secara real-time.",
      "Mencegah guru salah masuk kelas atau terlambat memulai sesi pembelajaran.",
    ],
  },
  {
    id: "mobile-presensi-capaian",
    title: "Presensi Pegawai & Monitoring Capaian Mengajar",
    category: "Presensi Guru di HP",
    src: "/img/siakad/mobile-04-presensi-capaian-guru.png",
    tag: "Mobile 04",
    type: "mobile",
    desc: "Portal mandiri guru untuk memantau kehadiran pribadi dan ketercapaian jam mengajar (JP) bulanan.",
    features: [
      "Live clock waktu presensi (contoh: 10:49) dengan rekap Hadir, Izin, Sakit, dan Alpa bulan ini.",
      "Pelacakan capaian mengajar: Jumlah Sesi Mengajar (5/20), Jam Pelajaran (10.4/56 JP), dan Beban Kerja (5.2/28 Jam).",
      "Transparansi beban kerja guru untuk keperluan sertifikasi dan laporan bulanan dinas/sekolah.",
    ],
  },
  {
    id: "mobile-absensi-siswa",
    title: "Absensi Siswa Cepat di Dalam Kelas via Smartphone",
    category: "Absensi Kelas Mobile",
    src: "/img/siakad/mobile-05-absensi-siswa-mobile.png",
    tag: "Mobile 05",
    type: "mobile",
    desc: "Guru dapat mengabsen kehadiran siswa di dalam ruang kelas langsung menggunakan smartphone tanpa perlu membawa laptop.",
    features: [
      "Daftar nama siswa lengkap dengan foto profil, NIS, dan nomor urut presensi.",
      "Indikator status kehadiran instan ('Belum Scan', 'Hadir', 'Izin', 'Sakit').",
      "Pencarian cepat siswa dan tombol filter rombel kelas yang sangat responsif.",
    ],
  },
]

export function SiakadDetailShowcase() {
  const [activeTab, setActiveTab] = useState<"all" | "absensi" | "jadwal" | "kesiswaan" | "cbt" | "mobile">("all")
  const [activeMobileIdx, setActiveMobileIdx] = useState(0)
  const [previewItem, setPreviewItem] = useState<ShowcaseImage | null>(null)

  const filteredWebModules = siakadModules.filter((m) => {
    if (activeTab === "all") return true
    if (activeTab === "absensi") return ["face-scan", "absensi-kbm", "kalender-bulanan", "rekap-kehadiran"].includes(m.id)
    if (activeTab === "jadwal") return ["jadwal-pelajaran", "guru-pengganti"].includes(m.id)
    if (activeTab === "kesiswaan") return ["hall-of-fame", "rekap-nilai", "database-siswa"].includes(m.id)
    if (activeTab === "cbt") return ["bank-soal-cbt", "editor-cbt-preview"].includes(m.id)
    return false
  })

  return (
    <div className="w-full">
      {/* Lightbox Modal */}
      {previewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden border border-border bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-none font-semibold text-primary">
                  {previewItem.tag}
                </Badge>
                <h3 className="text-base font-bold text-foreground">{previewItem.title}</h3>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="flex size-8 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto lg:flex-row">
              <div className="flex flex-1 items-center justify-center bg-black/95 p-4">
                <img
                  src={previewItem.src}
                  alt={previewItem.title}
                  className={`max-h-[65vh] w-auto object-contain ${
                    previewItem.type === "mobile" ? "max-w-[320px]" : "max-w-full"
                  }`}
                />
              </div>

              <div className="w-full border-t border-border p-6 lg:w-80 lg:border-l lg:border-t-0">
                <Badge className="rounded-none bg-emerald-600 font-medium text-white hover:bg-emerald-600">
                  {previewItem.category}
                </Badge>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{previewItem.desc}</p>

                <h4 className="mt-6 text-xs font-bold uppercase tracking-wider text-foreground">
                  Fitur Utama Pada Layar Ini:
                </h4>
                <ul className="mt-3 space-y-2.5">
                  {previewItem.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION A: HIGHLIGHT MOBILE PWA ──────────────────────────── */}
      <section className="border-b border-border bg-emerald-950/20 py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex flex-col items-start justify-between gap-4 border-l-4 border-emerald-600 pl-4 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2">
                <Badge className="rounded-none bg-emerald-600 font-semibold text-white">
                  RESPONSIVE & PWA READY
                </Badge>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  Android & iOS Smartphone Support
                </span>
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                Dukungan Versi Mobile: Portal Guru & Pegawai di Genggaman
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
                Sistem SiAkad ini dirancang adaptif penuh dengan teknologi <strong>Progressive Web App (PWA)</strong>.
                Guru, wali kelas, dan siswa dapat membuka portal langsung dari smartphone apa pun via browser dan
                memasangnya ke layar utama (<strong>Add to Home Screen</strong>) layaknya aplikasi native tanpa perlu
                mengunduh berkas APK berat dari Play Store.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                className="rounded-none border-emerald-600 font-semibold text-emerald-600 hover:bg-emerald-600 hover:text-white"
                onClick={() => {
                  const el = document.getElementById("mobile-showcase")
                  el?.scrollIntoView({ behavior: "smooth" })
                }}
              >
                <Smartphone className="size-4" />
                Lihat 5 Tampilan HP
              </Button>
            </div>
          </div>

          {/* Interactive Mobile Slider / Tabs */}
          <div id="mobile-showcase" className="mt-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            {/* Left selector */}
            <div className="space-y-2 lg:col-span-5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Pilih Fitur Versi Mobile Smartphone:
              </p>
              {siakadMobileScreens.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => setActiveMobileIdx(idx)}
                  className={`group flex cursor-pointer items-start gap-3 border p-4 transition-all duration-200 ${
                    idx === activeMobileIdx
                      ? "border-emerald-600 bg-card shadow-sm"
                      : "border-border bg-background/60 hover:border-emerald-600/50 hover:bg-card"
                  }`}
                >
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center font-bold text-xs ${
                      idx === activeMobileIdx
                        ? "bg-emerald-600 text-white"
                        : "bg-muted text-muted-foreground group-hover:text-foreground"
                    }`}
                  >
                    0{idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Selected Mobile Phone Preview */}
            <div className="flex flex-col items-center justify-center lg:col-span-7">
              <div className="relative flex max-w-sm flex-col items-center border border-border bg-card p-4 shadow-xl">
                <div className="mb-3 flex w-full items-center justify-between border-b border-border pb-2 text-xs">
                  <span className="font-semibold text-emerald-600">
                    {siakadMobileScreens[activeMobileIdx].tag}
                  </span>
                  <span className="text-muted-foreground">
                    {siakadMobileScreens[activeMobileIdx].category}
                  </span>
                  <button
                    onClick={() => setPreviewItem(siakadMobileScreens[activeMobileIdx])}
                    className="flex items-center gap-1 font-medium text-primary hover:underline cursor-pointer"
                  >
                    <Maximize2 className="size-3" />
                    Perbesar
                  </button>
                </div>

                <div
                  className="relative group cursor-pointer overflow-hidden bg-black/90"
                  onClick={() => setPreviewItem(siakadMobileScreens[activeMobileIdx])}
                >
                  <img
                    src={siakadMobileScreens[activeMobileIdx].src}
                    alt={siakadMobileScreens[activeMobileIdx].title}
                    className="h-[480px] w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="flex items-center gap-1.5 border border-white/40 bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                      <Maximize2 className="size-3.5" /> Klik untuk Zoom Layar Penuh
                    </span>
                  </div>
                </div>

                <div className="mt-4 w-full">
                  <h4 className="text-sm font-bold text-foreground">
                    {siakadMobileScreens[activeMobileIdx].title}
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {siakadMobileScreens[activeMobileIdx].desc}
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-1.5">
                    {siakadMobileScreens[activeMobileIdx].features.map((f, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-emerald-600" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION B: 12 MODUL UTAMA SEKOLAH (BERDASARKAN SCREENSHOT) ── */}
      <section className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20">
        <div className="mb-10 text-center">
          <Badge variant="outline" className="rounded-none font-semibold text-emerald-600">
            Katalog Fitur Komprehensif
          </Badge>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground md:text-4xl">
            12 Modul Inti SiAkad & CBT Sekolah SMP/SMK
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Seluruh fitur di bawah ini diambil langsung dari tangkapan layar sistem yang beroperasi aktif
            di satuan pendidikan SMP/SMK IT. Klik pada gambar modul untuk memperbesar dan melihat detail antarmukanya.
          </p>

          {/* Filter Tab bar */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {[
              { id: "all", label: "Semua 12 Modul" },
              { id: "absensi", label: "Smart Absensi & AI Scanner" },
              { id: "jadwal", label: "Jadwal & Guru Pengganti" },
              { id: "kesiswaan", label: "Kesiswaan, Gamifikasi & Nilai" },
              { id: "cbt", label: "Ujian CBT & Bank Soal" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`border px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-border bg-card text-muted-foreground hover:border-emerald-600/50 hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredWebModules.map((item) => (
            <div
              key={item.id}
              className="group flex flex-col border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-emerald-600/50 hover:shadow-xl"
            >
              {/* Image Container with Zoom overlay */}
              <div
                className="relative aspect-[16/10] w-full overflow-hidden bg-black/90 cursor-pointer"
                onClick={() => setPreviewItem(item)}
              >
                <img
                  src={item.src}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <Badge className="absolute left-3 top-3 rounded-none bg-black/75 text-[11px] font-semibold text-white backdrop-blur">
                  {item.tag}
                </Badge>
                <Badge className="absolute right-3 top-3 rounded-none bg-emerald-600 text-[10px] font-semibold text-white">
                  {item.category}
                </Badge>
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="flex items-center gap-1.5 border border-white/30 bg-black/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
                    <Maximize2 className="size-3.5" /> Lihat Detail Tangkapan Layar
                  </span>
                </div>
              </div>

              {/* Content info */}
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-base font-bold text-foreground leading-snug group-hover:text-emerald-600 transition-colors">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {item.desc}
                </p>

                <div className="mt-4 border-t border-border/60 pt-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                    Sorotan Fitur:
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {item.features.slice(0, 2).map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-emerald-600" />
                        <span className="line-clamp-2">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/60">
                  <span className="text-[11px] text-muted-foreground font-medium">
                    SMP/SMK IT Teruji
                  </span>
                  <button
                    onClick={() => setPreviewItem(item)}
                    className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline cursor-pointer"
                  >
                    Buka Preview
                    <ChevronRight className="size-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION C: KEUNGGULAN INVESTASI & TEKNIS ───────────────────── */}
      <section className="border-t border-border bg-muted/20 py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="rounded-none font-semibold text-emerald-600">
              Kenapa Memilih Rhansoft SiAkad
            </Badge>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground md:text-4xl">
              Solusi Tepat untuk Efisiensi & Kemandirian Sekolah
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
              Bebaskan sekolah dari biaya langganan software bulanan yang mahal per siswa.
              Dengan SiAkad Rhansoft, seluruh sistem dan database menjadi aset milik sekolah sendiri.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border border-border bg-card p-6">
              <div className="flex size-12 items-center justify-center bg-emerald-600/10 text-emerald-600">
                <ShieldCheck className="size-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-foreground">Lisensi Seumur Hidup</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Bayar sekali dan gunakan selamanya tanpa biaya perpanjangan tahunan atau pungutan per kepala siswa.
              </p>
            </div>

            <div className="border border-border bg-card p-6">
              <div className="flex size-12 items-center justify-center bg-emerald-600/10 text-emerald-600">
                <LayoutDashboard className="size-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-foreground">Full Source Code</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Mendapatkan kode sumber utuh sehingga sekolah atau yayasan leluasa mengembangkan modul khusus di masa mendatang.
              </p>
            </div>

            <div className="border border-border bg-card p-6">
              <div className="flex size-12 items-center justify-center bg-emerald-600/10 text-emerald-600">
                <Laptop className="size-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-foreground">Online VPS / Offline LAN</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Fleksibel: dapat di-hosting di Cloud VPS agar diakses online dari rumah, atau di server lokal sekolah untuk ujian CBT tanpa kuota internet.
              </p>
            </div>

            <div className="border border-border bg-card p-6">
              <div className="flex size-12 items-center justify-center bg-emerald-600/10 text-emerald-600">
                <UserCheck className="size-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-foreground">Panduan & Setup Gratis</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Didampingi langsung oleh teknisi Rhansoft via remote desktop AnyDesk hingga aplikasi siap digunakan oleh guru dan staf sekolah.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
