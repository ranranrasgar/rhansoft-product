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
  ArrowRight,
  LogOut,
  LayoutDashboard,
  UserCircle,
} from "lucide-react"
import { toast } from "sonner"
import { useCart } from "@/hooks/useCart"
import { useAuth } from "@/hooks/useAuth"
import { useNavigate } from "@/lib/navigate"
import { useProducts } from "@/hooks/useProducts"
import { SearchDialog } from "@/sections/SearchDialog"
import { CartSheet } from "@/sections/CartSheet"
import { MobileMenu } from "@/sections/MobileMenu"
import { categories } from "@/data/store"
import { industries, categoryIconMap, productIconMap } from "@/data/navigation"
import type { Product } from "@/data/store"

function getIconForCategory(name: string) {
  return categoryIconMap[name] ?? Search
}

function getIconForProduct(product: Product) {
  return productIconMap[product.id] ?? getIconForCategory(product.category)
}

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeMenu, setActiveMenu] = useState<"apps" | "industries" | null>(null)
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

  // Close mega menu when clicking outside.
  // NOTE: use "click" (not "mousedown") so button onClick handlers inside the
  // mega menu panel fire before the panel is torn down. The mega menu panel is
  // rendered as a sibling of <nav> (still inside <header>), so we attach the
  // ref to a wrapper that contains BOTH the nav triggers and the panels.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null)
      }
    }
    if (activeMenu) {
      document.addEventListener("click", onClick)
      return () => document.removeEventListener("click", onClick)
    }
  }, [activeMenu])

  const featuredProducts = products.filter((p) => p.featured)

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
              {/* Aplikasi mega menu trigger */}
              <button
                className={`relative flex items-center gap-1 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors cursor-pointer ${
                  activeMenu === "apps"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
                onMouseEnter={() => setActiveMenu("apps")}
                onClick={() => setActiveMenu("apps")}
              >
                Aplikasi
                <ChevronDown
                  className={`size-3.5 transition-transform duration-200 ${
                    activeMenu === "apps" ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Industri mega menu trigger */}
              <button
                className={`relative flex items-center gap-1 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors cursor-pointer ${
                  activeMenu === "industries"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
                onMouseEnter={() => setActiveMenu("industries")}
                onClick={() => setActiveMenu("industries")}
              >
                Industri
                <ChevronDown
                  className={`size-3.5 transition-transform duration-200 ${
                    activeMenu === "industries" ? "rotate-180" : ""
                  }`}
                />
              </button>

              <a
                href="#store"
                onClick={(e) => {
                  e.preventDefault()
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
                      className="ml-1 flex cursor-pointer items-center gap-1.5 rounded-full border border-border py-0.5 pl-0.5 pr-2 transition-colors hover:border-primary/40 hover:bg-accent/50"
                      aria-label="User menu"
                    >
                      <Avatar className="size-7">
                        <AvatarImage src={user.avatar_url || undefined} alt={user.first_name} />
                        <AvatarFallback className="text-[11px]">
                          {user.first_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden text-xs font-medium lg:inline">
                        {user.first_name}
                      </span>
                      <ChevronDown className="size-3 text-muted-foreground" />
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
              onClick={() => navigate("/trial-register")}
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

        {/* ════════ MEGA MENU: APLIKASI ════════ */}
        {activeMenu === "apps" && (
          <div
            className="absolute left-0 right-0 top-full border-b border-border bg-background/95 shadow-xl backdrop-blur-xl"
            onMouseLeave={() => setActiveMenu(null)}
          >
            <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_1fr]">
                {/* Apps: featured grid */}
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Aplikasi paling dicari
                    </h3>
                    <button
                      onClick={() => {
                        setActiveMenu(null)
                        navigate("store")
                      }}
                      className="flex items-center gap-1 text-xs font-medium text-primary hover:underline cursor-pointer"
                    >
                      Lihat semua aplikasi
                      <ArrowRight className="size-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {featuredProducts.map((p) => {
                      const PIcon = getIconForProduct(p)
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            setActiveMenu(null)
                            routerNavigate(`/product/${p.id}`)
                            window.scrollTo({ top: 0, behavior: "smooth" })
                          }}
                          className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-3 text-center transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent/50 hover:shadow-sm cursor-pointer"
                        >
                          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                            <PIcon className="size-5" />
                          </div>
                          <span className="line-clamp-2 text-[12px] font-medium leading-tight text-foreground">
                            {p.name.replace("Software ", "").replace("Aplikasi ", "")}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Highlight card */}
                <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                    Solusi Lengkap
                  </p>
                  <h4 className="mt-2 text-xl font-bold">
                    Semua kebutuhan bisnis dalam satu platform
                  </h4>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Dari toko retail, klinik, hotel, hingga aplikasi mobile —
                    Rhansoft punya software yang Anda butuhkan.
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {categories.slice(0, 4).map((cat) => {
                      const Icon = getIconForCategory(cat.name)
                      return (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setActiveMenu(null)
                            navigate("category", cat.name)
                          }}
                          className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-left text-[13px] font-medium transition-colors hover:border-primary/40 hover:bg-accent/50 cursor-pointer"
                        >
                          <Icon className="size-4 text-primary" />
                          {cat.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════ MEGA MENU: INDUSTRI ════════ */}
        {activeMenu === "industries" && (
          <div
            className="absolute left-0 right-0 top-full border-b border-border bg-background/95 shadow-xl backdrop-blur-xl"
            onMouseLeave={() => setActiveMenu(null)}
          >
            <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Pilih solusi sesuai industri Anda
                    </h3>
                    <button
                      onClick={() => {
                        setActiveMenu(null)
                        navigate("store")
                      }}
                      className="flex items-center gap-1 text-xs font-medium text-primary hover:underline cursor-pointer"
                    >
                      Telusuri semua industri
                      <ArrowRight className="size-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {industries.slice(0, 6).map((ind) => {
                      const Icon = ind.icon
                      return (
                        <button
                          key={ind.id}
                          onClick={() => {
                            setActiveMenu(null)
                            navigate("category", ind.category)
                          }}
                          className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md cursor-pointer"
                        >
                          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Icon className="size-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{ind.label}</p>
                            <p className="text-[11px] text-muted-foreground line-clamp-2">
                              {ind.description}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-950 p-6 text-white">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
                    Butuh rekomendasi?
                  </p>
                  <h4 className="mt-2 text-lg font-bold">
                    Konsultasikan kebutuhan bisnis Anda
                  </h4>
                  <p className="mt-2 text-sm text-white/70">
                    Tim kami siap membantu memilih software terbaik untuk industri
                    dan skala bisnis Anda.
                  </p>
                  <Button
                    variant="secondary"
                    className="mt-4 w-full rounded-full"
                    onClick={() => window.open("https://wa.me/6281234567890", "_blank")}
                  >
                    Hubungi tim sales
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
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
