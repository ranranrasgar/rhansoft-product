import type { LucideIcon } from "lucide-react"
import {
  ShoppingCart,
  Calculator,
  Stethoscope,
  BedDouble,
  Receipt,
  MessageSquare,
  Globe,
  Smartphone,
  Store,
  Monitor,
  Landmark,
  Fuel,
  Pill,
  Wrench,
  UtensilsCrossed,
  Trophy,
  MessageCircle,
  Brain,
  Wallet,
  Users,
  BookOpen,
  ShoppingBag,
  GraduationCap,
  Megaphone,
  Shirt,
  Pizza,
  MapPin,
  Newspaper,
  Building2,
  Factory,
  School,
  HeartPulse,
  Car,
  Utensils,
  type LucideIcon as LucideIconType,
} from "lucide-react"

// Map product id → icon for mega menu / apps grid
export const productIconMap: Record<string, LucideIconType> = {
  "sw-toko": Store,
  "sw-pos": Monitor,
  "sw-koperasi": Landmark,
  "sw-spbu": Fuel,
  "sw-kontraktor": Building2,
  "sw-accounting": Calculator,
  "sw-klinik": Stethoscope,
  "sw-apotik": Pill,
  "sw-hotel": BedDouble,
  "sw-bengkel": Wrench,
  "sw-cafe": UtensilsCrossed,
  "sw-futsal": Trophy,
  "sw-wablast": MessageCircle,
  "sw-diagnosa": Brain,
  "web-tabungan-siswa": Wallet,
  "web-pegawai": Users,
  "web-perpustakaan": BookOpen,
  "web-ecommerce": ShoppingBag,
  "web-siakad": GraduationCap,
  "web-pengaduan": Megaphone,
  "mobile-laundry": Shirt,
  "mobile-jajanan": Pizza,
  "mobile-absensi": MapPin,
  "mobile-berita": Newspaper,
}

// Fallback icon for category
export const categoryIconMap: Record<string, LucideIconType> = {
  "POS & Retail": ShoppingCart,
  Accounting: Calculator,
  Healthcare: Stethoscope,
  Hospitality: BedDouble,
  "Billing System": Receipt,
  Communication: MessageSquare,
  "Web Based": Globe,
  "Mobile App": Smartphone,
}

// Industry / business sectors shown in "Industri" mega menu
export type IndustryItem = {
  id: string
  label: string
  icon: LucideIcon
  href: string
  description?: string
  category: string
}

export const industries: IndustryItem[] = [
  { id: "retail", label: "Retail & Toko", icon: Store, description: "Software toko, minimarket, & POS", href: "/", category: "POS & Retail" },
  { id: "finance", label: "Keuangan & Koperasi", icon: Landmark, description: "Akuntansi, koperasi, & keuangan", href: "/", category: "Accounting" },
  { id: "healthcare", label: "Kesehatan", icon: HeartPulse, description: "Klinik, apotik, & puskesmas", href: "/", category: "Healthcare" },
  { id: "hospitality", label: "Hospitality & Jasa", icon: BedDouble, description: "Hotel, bengkel, cafe, & resto", href: "/", category: "Hospitality" },
  { id: "education", label: "Pendidikan", icon: School, description: "Sekolah, perpustakaan, & kampus", href: "/", category: "Web Based" },
  { id: "government", label: "Pemerintahan", icon: Building2, description: "Pengaduan masyarakat & kepegawaian", href: "/", category: "Web Based" },
  { id: "manufacturing", label: "Manufaktur", icon: Factory, description: "Produksi & distribusi", href: "/", category: "POS & Retail" },
  { id: "fnb", label: "F&B", icon: Utensils, description: "Restoran, cafe, & jajanan online", href: "/", category: "Hospitality" },
  { id: "transport", label: "Transportasi & SPBU", icon: Car, description: "SPBU, rental, & bengkel", href: "/", category: "POS & Retail" },
  { id: "communication", label: "Komunikasi", icon: MessageSquare, description: "WA blast, SMS, & diagnosa", href: "/", category: "Communication" },
]

// Resource links for footer / support menu
export const resourceLinks = [
  { label: "Tutorial", href: "#" },
  { label: "Dokumentasi", href: "#" },
  { label: "Sertifikasi", href: "#" },
  { label: "Pelatihan", href: "#" },
  { label: "Blog", href: "#" },
]

export const serviceLinks = [
  { label: "Installasi", href: "#" },
  { label: "Training", href: "#" },
  { label: "Custom Software", href: "#" },
  { label: "Support Online", href: "#" },
  { label: "Update Software", href: "#" },
]

export const companyLinks = [
  { label: "Tentang Kami", href: "#" },
  { label: "Portfolio", href: "#" },
  { label: "Testimoni", href: "#" },
  { label: "Kontak", href: "#" },
  { label: "Karir", href: "#" },
]

export const helpLinks = [
  { label: "FAQ", href: "#" },
  { label: "Panduan", href: "#" },
  { label: "Garansi", href: "#" },
  { label: "Kebijakan Privasi", href: "#" },
  { label: "Syarat & Ketentuan", href: "#" },
]

export const productLinks = [
  { label: "POS & Retail", category: "POS & Retail" },
  { label: "Accounting", category: "Accounting" },
  { label: "Healthcare", category: "Healthcare" },
  { label: "Hospitality", category: "Hospitality" },
  { label: "Billing System", category: "Billing System" },
  { label: "Communication", category: "Communication" },
  { label: "Web Based", category: "Web Based" },
  { label: "Mobile App", category: "Mobile App" },
]
