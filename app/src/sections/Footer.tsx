import {
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  Github,
  Twitter,
  MessageCircle,
  Mail,
  Phone,
  MapPin,
} from "lucide-react"
import { useNavigate as useRouterNavigate } from "react-router-dom"
import { useNavigate } from "@/lib/navigate"
import { categories } from "@/data/store"

const footerGroups = [
  {
    title: "Perusahaan",
    links: [
      { label: "Tentang Kami", slug: "tentang" },
      { label: "Hubungi Kami", slug: "kontak" },
      { label: "FAQ", slug: "faq" },
      { label: "Partner & Reseller", slug: "kontak" },
    ],
  },
  {
    title: "Produk & Layanan",
    links: [
      { label: "Semua Aplikasi", action: "store" },
      { label: "Harga & Lisensi", action: "store" },
      { label: "Custom Software", slug: "kontak" },
      { label: "Implementasi & Training", slug: "kontak" },
    ],
  },
  {
    title: "Dukungan",
    links: [
      { label: "Panduan Pengguna", slug: "faq" },
      { label: "Support Online", slug: "kontak" },
      { label: "Pembaruan Software", slug: "kebijakan" },
      { label: "WhatsApp Support", href: "https://wa.me/6281333335871" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Kebijakan Privasi", slug: "privacy-policy" },
      { label: "Syarat & Ketentuan", slug: "terms-of-use" },
      { label: "Kebijakan Perusahaan", slug: "kebijakan" },
      { label: "Cookie Settings", slug: "privacy-policy" },
    ],
  },
]

const socials = [
  { icon: Facebook, label: "Facebook", href: "https://www.facebook.com/Rhansoft" },
  { icon: Instagram, label: "Instagram", href: "https://www.instagram.com/rhansoft" },
  { icon: Youtube, label: "YouTube", href: "https://www.youtube.com/rhantech" },
  { icon: Linkedin, label: "LinkedIn", href: "https://www.linkedin.com/in/ranranrasgar/" },
  { icon: Github, label: "GitHub", href: "https://github.com/ranranrasgar" },
  { icon: Twitter, label: "X (Twitter)", href: "https://x.com/RanranRahayu" },
]

type FooterLink = {
  label: string
  slug?: string
  action?: string
  href?: string
}

function FooterLinkItem({ link }: { link: FooterLink }) {
  const navigate = useNavigate()
  const routerNavigate = useRouterNavigate()

  if (link.href) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-left text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        {link.label}
      </a>
    )
  }

  return (
    <button
      onClick={() => {
        if (link.slug) {
          routerNavigate(`/page/${link.slug}`)
        } else if (link.action === "store") {
          navigate("store")
        }
      }}
      className="text-left text-sm text-muted-foreground transition-colors hover:text-primary cursor-pointer"
    >
      {link.label}
    </button>
  )
}

export function Footer() {
  const navigate = useNavigate()
  const routerNavigate = useRouterNavigate()

  return (
    <footer id="footer" className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        {/* Main footer grid */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
          {/* Brand column */}
          <div className="col-span-2">
            <button
              onClick={() => routerNavigate("/")}
              className="cursor-pointer"
            >
              <img
                src="/img/logorhn.png"
                alt="Rhansoft"
                className="h-9 w-auto object-contain"
              />
            </button>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Rhansoft Management — Software bisnis Indonesia sejak 2008. POS,
              akuntansi, klinik, hotel, billing, dan sistem manajemen untuk
              UMKM hingga enterprise.
            </p>

            {/* Contact info */}
            <div className="mt-6 space-y-2.5 text-sm text-muted-foreground">
              <a
                href="https://maps.google.com/?q=Jl.+Griya+Hamdan+Asri+No+09+Arcamanik+Bandung"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 hover:text-foreground"
              >
                <MapPin className="mt-0.5 size-4 shrink-0" />
                <span>
                  Jl. Griya Hamdan Asri No 09,
                  <br />
                  Arcamanik, Bandung
                </span>
              </a>
              <a
                href="tel:081333335871"
                className="flex items-center gap-2 hover:text-foreground"
              >
                <Phone className="size-4" />
                081333335871
              </a>
              <a
                href="mailto:support@rhansoft.com"
                className="flex items-center gap-2 hover:text-foreground"
              >
                <Mail className="size-4" />
                support@rhansoft.com
              </a>
              <a
                href="https://wa.me/6281333335871"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-foreground"
              >
                <MessageCircle className="size-4" />
                WhatsApp Support
              </a>
            </div>

            {/* Socials */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <s.icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link groups */}
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                {group.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <FooterLinkItem link={link} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Categories quick nav */}
        <div className="mt-12 border-t border-border pt-8">
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Software by Category
          </h4>
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => navigate("category", cat.name)}
                className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground cursor-pointer"
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 md:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Rhansoft Management. All rights
            reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            <button
              onClick={() => routerNavigate("/admin")}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Admin Panel
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
