import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  LogOut,
  Shield,
  LayoutDashboard,
  Package,
  Mail,
  ChevronRight,
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"

const roleLabel: Record<string, string> = {
  admin: "Administrator",
  user: "Member",
  editor: "Editor",
}

const roleColor: Record<string, string> = {
  admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  user: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  editor: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
}

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, logout, isAdmin, canEdit } = useAuth()

  if (!user) {
    navigate("/login")
    return null
  }

  const initials = `${user.first_name.charAt(0)}${(user.last_name || "").charAt(0) || ""}`.toUpperCase()

  const handleLogout = () => {
    logout()
    toast.success("Anda telah keluar")
    navigate("/")
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 md:px-6">
      <h1 className="text-2xl font-bold tracking-tight">Akun Saya</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Kelola profil dan akses fitur khusus akun
      </p>

      {/* Profile card */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarImage src={user.avatar_url || undefined} alt={user.first_name} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">
              {user.first_name} {user.last_name}
            </h2>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="size-3.5" />
              {user.email}
            </p>
            <span
              className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${roleColor[user.role] || roleColor.user}`}
            >
              <Shield className="size-3" />
              {roleLabel[user.role] || "Member"}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="size-4" />
            Keluar
          </Button>
        </div>
      </div>

      {/* Menu items */}
      <div className="mt-4 space-y-2">
        {/* Admin Panel */}
        {isAdmin && (
          <button
            onClick={() => navigate("/admin")}
            className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-accent/50 cursor-pointer"
          >
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <LayoutDashboard className="size-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Admin Dashboard</p>
              <p className="text-xs text-muted-foreground">
                Kelola produk, user, pesanan, refund & pengaturan
              </p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
        )}

        {/* Editor / Admin: Product Management */}
        {canEdit && (
          <button
            onClick={() => navigate("/admin/products")}
            className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-accent/50 cursor-pointer"
          >
            <div className="flex size-10 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
              <Package className="size-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Manajemen Produk</p>
              <p className="text-xs text-muted-foreground">
                Tambah, edit, dan kelola katalog software
              </p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
        )}

        {/* My Orders */}
        <button
          onClick={() => navigate("/akun/pesanan")}
          className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-accent/50 cursor-pointer"
        >
          <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            <Package className="size-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium">Pesanan Saya</p>
            <p className="text-xs text-muted-foreground">
              Lihat riwayat pembelian dan download
            </p>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  )
}
