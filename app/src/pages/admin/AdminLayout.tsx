import { useState } from "react"
import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  RotateCcw,
  Settings,
  Mail,
  LogOut,
  Menu,
  X,
  ChevronLeft,
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"

type NavItem = {
  to: string
  label: string
  icon: typeof LayoutDashboard
  roles: ("admin" | "editor" | "user")[]
}

const navItems: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "editor"] },
  { to: "/admin/products", label: "Produk", icon: Package, roles: ["admin", "editor"] },
  { to: "/admin/users", label: "User & Hak Akses", icon: Users, roles: ["admin"] },
  { to: "/admin/orders", label: "Pesanan", icon: ShoppingCart, roles: ["admin"] },
  { to: "/admin/refunds", label: "Refund", icon: RotateCcw, roles: ["admin"] },
  { to: "/admin/customers", label: "Pelanggan", icon: Mail, roles: ["admin"] },
  { to: "/admin/settings", label: "Pengaturan Sistem", icon: Settings, roles: ["admin"] },
]

export function AdminLayout() {
  const { user, logout, isAdmin, canEdit } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  // Guard: hanya admin & editor yang bisa akses
  if (!user || !canEdit) {
    navigate("/login")
    return null
  }

  const visibleItems = navItems.filter((item) =>
    item.roles.includes(user.role)
  )

  const handleLogout = () => {
    logout()
    toast.success("Anda telah keluar")
    navigate("/")
  }

  const initials = user.first_name.charAt(0).toUpperCase()

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-card transition-all duration-300 lg:static lg:translate-x-0 ${
          collapsed ? "w-16" : "w-64"
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Logo header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          {!collapsed && (
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 cursor-pointer"
            >
              <img
                src="/img/logorhn.png"
                alt="Rhansoft"
                className="h-7 w-auto object-contain"
                />
                <span className="text-sm font-bold">Admin Panel</span>
                </button>
                )}
                {collapsed && (
                <img
                src="/img/logorhn.png"
              alt="Rhansoft"
              className="h-7 w-auto object-contain mx-auto"
            />
          )}
          <button
            className="hidden lg:flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed ? <Menu className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>
          <button
            className="lg:hidden size-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {visibleItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/admin"}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`
                }
                title={collapsed ? item.label : undefined}
              >
                <Icon className="size-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-border p-2">
          <div className="flex items-center gap-2 rounded-lg px-2 py-2">
            <Avatar className="size-8 shrink-0">
              <AvatarImage src={user.avatar_url || undefined} alt={user.first_name} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-semibold">
                  {user.first_name} {user.last_name}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">{user.email}</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="size-4" />
              Keluar
            </Button>
          )}
          {collapsed && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="w-full text-destructive hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="size-4" />
            </Button>
          )}
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="flex h-16 items-center gap-3 border-b border-border bg-card px-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>
          <span className="text-sm font-bold">Admin Panel</span>
          {isAdmin && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-red-700">
              Admin
            </span>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
