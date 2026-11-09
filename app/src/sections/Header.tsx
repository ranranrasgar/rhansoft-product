import { useState, useEffect, useRef } from "react"
import { useNavigate as useRouterNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  ShoppingBag,
  Menu,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  UserCircle,
  ExternalLink,
  Globe,
  Code,
  Wrench,
  Server,
  ArrowRight,
} from "lucide-react"
import { toast } from "sonner"
import { useCart } from "@/hooks/useCart"
import { useAuth } from "@/hooks/useAuth"
import { useNavigate } from "@/lib/navigate"
import { useProducts } from "@/hooks/useProducts"
import { SearchDialog } from "@/sections/SearchDialog"
import { CartSheet } from "@/sections/CartSheet"
import { MobileMenu } from "@/sections/MobileMenu"

const ecosystemLinks = [
  {
    id: "rhantech",
    title: "Rhantech",
    tagline: "Source Code & Software Solutions",
    description: "Katalog source code aplikasi web, desktop, dan mobile siap pakai dengan dokumentasi dan lisensi resmi.",
    url: "https://rhantech.com/",
    domain: "rhantech.com",
    badge: "Source Code",
    badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    icon: Code,
    thumbnail: "https://s0.wp.com/mshots/v1/https%3A%2F%2Frhantech.com%2F?w=600",
  },
  {
    id: "buatin",
    title: "Buatin Tech",
    tagline: "Website & Digital Tools",
    description: "Layanan pembuatan website profesional, otomasi sistem, integrasi API, dan online tools untuk bisnis.",
    url: "https://buatin.tech/",
    domain: "buatin.tech",
    badge: "Online Tools",
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    icon: Wrench,
    thumbnail: "https://s0.wp.com/mshots/v1/https%3A%2F%2Fbuatin.tech%2F?w=600",
  },
  {
    id: "noc",
    title: "NOC Rhantech",
    tagline: "Network Operations & Monitoring",
    description: "Pusat monitoring infrastruktur server 24/7, pemantauan jaringan, status uptime, dan cloud hosting.",
    url: "https://noc.rhantech.com/",
    domain: "noc.rhantech.com",
    badge: "Server & NOC",
    badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    icon: Server,
    thumbnail: "https://s0.wp.com/mshots/v1/https%3A%2F%2Fnoc.rhantech.com%2F?w=600",
  },
]

function WebThumbnailCard({ item }: { item: (typeof ecosystemLinks)[0] }) {
  const [imgError, setImgError] = useState(false)
  const Icon = item.icon

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col overflow-hidden rounded-none border border-border bg-card transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl cursor-pointer"
    >
      {/* Mockup browser bar */}
      <div className="flex items-center gap-1.5 border-b border-border/80 bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
        <span className="size-2 rounded-full bg-red-400/80" />
        <span className="size-2 rounded-full bg-amber-400/80" />
        <span className="size-2 rounded-full bg-emerald-400/80" />
        <span className="ml-2 font-mono text-[10px] text-muted-foreground/80 truncate">
          https://{item.domain}
        </span>
        <ExternalLink className="ml-auto size-3 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>

      {/* Website Thumbnail */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted/20">
        {!imgError ? (
          <img
            src={item.thumbnail}
            alt={item.title}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center">
            <div className="flex size-12 items-center justify-center rounded-none bg-primary/10 text-primary">
              <Icon className="size-6" />
            </div>
            <p className="font-mono text-xs font-semibold text-foreground">{item.domain}</p>
          </div>
        )}

        {/* Floating category badge */}
        <span className={`absolute right-2 top-2 rounded-none border px-2 py-0.5 text-[10px] font-semibold backdrop-blur-md ${item.badgeColor}`}>
          {item.badge}
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-primary shrink-0" />
          <h4 className="text-sm font-bold text-foreground transition-colors group-hover:text-primary">
            {item.title}
          </h4>
        </div>
        <p className="mt-1 text-[11px] font-medium text-muted-foreground">
          {item.tagline}
        </p>
        <p className="mt-2 text-xs text-muted-foreground/90 line-clamp-2">
          {item.description}
        </p>
        <div className="mt-auto pt-3 flex items-center gap-1 text-xs font-semibold text-primary">
          <span>Kunjungi Website</span>
          <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </a>
  )
}

const appColumns = [
  [
    {
      name: "POS & Retail",
      label: "POS & Retail",
    },
    {
      name: "Billing System",
      label: "Billing & Service",
    },
  ],
  [
    {
      name: "Accounting",
      label: "Keuangan & Akuntansi",
    },
    {
      name: "Communication",
      label: "Marketing & Komunikasi",
    },
  ],
  [
    {
      name: "Web Based",
      label: "Web Based",
    },
    {
      name: "Healthcare",
      label: "Kesehatan (Healthcare)",
    },
  ],
  [
    {
      name: "Mobile App",
      label: "Mobile Apps",
    },
    {
      name: "Hospitality",
      label: "Hospitality & Resto",
    },
  ],
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeMenu, setActiveMenu] = useState<"apps" | "links" | null>(null)
  const menuRef = useRef<HTMLElement>(null)
  const { itemCount } = useCart()
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const routerNavigate = useRouterNavigate()
  const { products } = useProducts()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen((v) => !v)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Close mega menu when clicking outside or pressing Escape.
  // NOTE: use "click" (not "mousedown") so button onClick handlers inside the
  // mega menu panel fire before the panel is torn down.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null)
      }
    }
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveMenu(null)
      }
    }
    if (activeMenu) {
      document.addEventListener("click", onClick)
      window.addEventListener("keydown", onEsc)
      return () => {
        document.removeEventListener("click", onClick)
        window.removeEventListener("keydown", onEsc)
      }
    }
  }, [activeMenu])

  return (
    <>
      <header
        ref={menuRef}
        className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${
          scrolled || activeMenu
            ? "border-border bg-background/95 backdrop-blur-xl shadow-sm"
            : "border-transparent bg-background"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          {/* Left: Logo + Desktop Nav */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => routerNavigate("/")}
              className="cursor-pointer"
            >
              <img
                src="/img/logorhn.png"
                alt="Rhansoft"
                className="h-8 w-auto object-contain"
              />
            </button>

            <nav className="hidden items-center gap-1 md:flex">
              {/* Aplikasi mega menu trigger (click to toggle, no hover) */}
              <button
                className={`relative flex items-center gap-1 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors cursor-pointer ${
                  activeMenu === "apps"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
                onClick={() => setActiveMenu(activeMenu === "apps" ? null : "apps")}
              >
                Aplikasi
                <ChevronDown
                  className={`size-3.5 transition-transform duration-200 ${
                    activeMenu === "apps" ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* SaaS menu trigger (click to open panel with website thumbnails) */}
              <button
                className={`relative flex items-center gap-1 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors cursor-pointer ${
                  activeMenu === "links"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
                onClick={() => setActiveMenu(activeMenu === "links" ? null : "links")}
              >
                SaaS
                <ChevronDown
                  className={`size-3.5 transition-transform duration-200 ${
                    activeMenu === "links" ? "rotate-180" : ""
                  }`}
                />
              </button>

              <a
                href="#store"
                onClick={(e) => {
                  e.preventDefault()
                  setActiveMenu(null)
                  navigate("store")
                }}
                className="rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground cursor-pointer"
              >
                Harga
              </a>
              <a
                href="#footer"
                onClick={(e) => {
                  e.preventDefault()
                  setActiveMenu(null)
                  navigate("footer")
                }}
                className="rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground cursor-pointer"
              >
                Bantuan
              </a>
            </nav>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="size-4" />
            </Button>
            {/* Auth: user dropdown (admin only), else Sign in / Register */}
            {user ? (
              isAdmin ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="ml-1 flex cursor-pointer items-center rounded-full border border-border p-0.5 sm:gap-1.5 sm:py-0.5 sm:pl-0.5 sm:pr-2 transition-colors hover:border-primary/40 hover:bg-accent/50"
                      aria-label="User menu"
                    >
                      <Avatar className="size-7">
                        <AvatarImage src={user.avatar_url || undefined} alt={user.first_name} />
                        <AvatarFallback className="text-[11px]">
                          {user.first_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden text-xs font-medium sm:inline">
                        {user.first_name}
                      </span>
                      <ChevronDown className="hidden sm:inline size-3 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold">
                        {user.first_name} {user.last_name}
                      </span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {user.email}
                      </span>
                      <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase text-accent-foreground">
                        {user.role}
                      </span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => routerNavigate("/admin")}>
                      <LayoutDashboard className="size-4" />
                      Admin Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => routerNavigate("/profile")}>
                      <UserCircle className="size-4" />
                      Profil Saya
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        logout()
                        toast.success("Anda telah keluar")
                        routerNavigate("/")
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <LogOut className="size-4" />
                      Keluar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-1 hidden rounded-full sm:inline-flex"
                  onClick={() => routerNavigate("/profile")}
                >
                  {user.first_name}
                </Button>
              )
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-1 hidden rounded-full sm:inline-flex"
                  onClick={() => routerNavigate("/login")}
                >
                  Masuk
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-1 hidden rounded-full md:inline-flex"
                  onClick={() => routerNavigate("/register")}
                >
                  Daftar
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Cart"
              className="relative hidden sm:inline-flex"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingBag className="size-4" />
              {itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {itemCount}
                </span>
              )}
            </Button>

            <Button
              size="sm"
              className="ml-2 hidden rounded-full md:inline-flex"
              onClick={() => routerNavigate("/trial-register")}
            >
              Uji coba gratis
            </Button>

            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Menu"
              className="md:hidden"
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="size-4" />
            </Button>
          </div>
        </div>

        {/* ════════ MEGA MENU: APLIKASI (ODOO STYLE) ════════ */}
        {activeMenu === "apps" && (
          <div className="absolute left-0 right-0 top-full border-b border-border bg-background shadow-2xl animate-in fade-in-0 duration-150">
            <div className="mx-auto max-w-7xl px-6 py-8 md:px-10">
              <div className="grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
                {appColumns.map((colGroup, colIdx) => (
                  <div key={colIdx} className="space-y-7">
                    {colGroup.map((cat) => {
                      const prods = products.filter((p) => p.category === cat.name)
                      return (
                        <div key={cat.name}>
                          <button
                            onClick={() => {
                              setActiveMenu(null)
                              navigate("category", cat.name)
                            }}
                            className="text-[12px] font-bold uppercase tracking-wider text-foreground hover:text-primary transition-colors cursor-pointer text-left block"
                          >
                            {cat.label}
                          </button>
                          <div className="mt-1.5 mb-2.5 h-px w-full bg-border/70" />
                          <ul className="space-y-1.5">
                            {prods.length > 0 ? (
                              prods.map((p) => (
                                <li key={p.id}>
                                  <button
                                    onClick={() => {
                                      setActiveMenu(null)
                                      routerNavigate(`/product/${p.id}`)
                                      window.scrollTo({ top: 0, behavior: "smooth" })
                                    }}
                                    className="text-[13px] text-foreground/80 hover:text-primary transition-colors py-0.5 text-left block w-full truncate cursor-pointer"
                                    title={p.name}
                                  >
                                    {p.name.replace("Software ", "").replace("Aplikasi ", "")}
                                  </button>
                                </li>
                              ))
                            ) : (
                              <li className="text-xs text-muted-foreground/60 py-0.5">Segera hadir</li>
                            )}
                          </ul>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>

              {/* Mega Menu Footer (Odoo style) */}
              <div className="mt-8 border-t border-border pt-4 flex flex-wrap items-center justify-center gap-6 md:gap-10 text-[13px] text-muted-foreground">
                <button
                  onClick={() => {
                    setActiveMenu(null)
                    navigate("store")
                  }}
                  className="inline-flex items-center gap-2 hover:text-primary transition-colors cursor-pointer"
                >
                  <Globe className="size-4 text-primary" />
                  <span>Katalog Semua Software</span>
                </button>
                <span className="hidden sm:inline text-border">•</span>
                <a
                  href="https://rhantech.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <Code className="size-4 text-primary" />
                  <span>Source Code (rhantech.com)</span>
                  <ExternalLink className="size-3 opacity-60" />
                </a>
                <span className="hidden sm:inline text-border">•</span>
                <a
                  href="https://buatin.tech/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <Wrench className="size-4 text-primary" />
                  <span>Tools & Layanan (buatin.tech)</span>
                  <ExternalLink className="size-3 opacity-60" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ════════ MEGA MENU: SAAS & EKOSISTEM (THUMBNAILS) ════════ */}
        {activeMenu === "links" && (
          <div className="absolute left-0 right-0 top-full border-b border-border bg-background shadow-2xl animate-in fade-in-0 duration-150">
            <div className="mx-auto max-w-7xl px-6 py-8 md:px-10">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/70 pb-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
                    Layanan Cloud & SaaS Terhubung
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Jelajahi ekosistem SaaS, platform teknologi, online tools, dan monitoring server dari jaringan Rhansoft
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>3 Platform Aktif</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {ecosystemLinks.map((item) => (
                  <WebThumbnailCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      <CartSheet open={cartOpen} onOpenChange={setCartOpen} />
      <MobileMenu open={menuOpen} onOpenChange={setMenuOpen} />
    </>
  )
}
