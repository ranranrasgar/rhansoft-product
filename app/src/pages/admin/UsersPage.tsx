import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Users as UsersIcon,
  Search,
  Shield,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"
import {
  fetchAdminUsers,
  updateUserRole,
  updateUserStatus,
  getToken,
  type AdminUser,
  type UserRole,
} from "@/lib/auth"
import { useAuth } from "@/hooks/useAuth"

const roleLabel: Record<string, string> = {
  admin: "Admin",
  user: "User",
  editor: "Editor",
}

const roleBadge: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  user: "bg-blue-100 text-blue-700",
  editor: "bg-purple-100 text-purple-700",
}

export function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterRole, setFilterRole] = useState<string>("all")

  const loadUsers = async () => {
    const token = getToken()
    if (!token) return
    setLoading(true)
    try {
      const data = await fetchAdminUsers(token)
      setUsers(data)
    } catch (err) {
      toast.error("Gagal memuat data user")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleRoleChange = async (userId: number, role: UserRole) => {
    const token = getToken()
    if (!token) return
    try {
      await updateUserRole(token, userId, role)
      toast.success("Role user diperbarui")
      loadUsers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal update role")
    }
  }

  const handleToggleStatus = async (userId: number, isActive: boolean) => {
    const token = getToken()
    if (!token) return
    try {
      await updateUserStatus(token, userId, !isActive)
      toast.success(`User ${!isActive ? "diaktifkan" : "dinonaktifkan"}`)
      loadUsers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal update status")
    }
  }

  const filtered = users.filter((u) => {
    const matchSearch =
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase())
    const matchRole = filterRole === "all" || u.role === filterRole
    return matchSearch && matchRole
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <UsersIcon className="size-6" />
          Manajemen User & Hak Akses
        </h1>
        <p className="text-sm text-muted-foreground">
          Kelola pengguna, role, dan status aktif
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total User</p>
          <p className="text-2xl font-bold">{users.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Admin</p>
          <p className="text-2xl font-bold">
            {users.filter((u) => u.role === "admin").length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Aktif</p>
          <p className="text-2xl font-bold">
            {users.filter((u) => u.is_active).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari user..."
            className="pl-9"
          />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Role</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* User table */}
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium text-muted-foreground">User</th>
              <th className="hidden px-4 py-3 font-medium text-muted-foreground sm:table-cell">
                Email
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Role</th>
              <th className="hidden px-4 py-3 font-medium text-muted-foreground md:table-cell">
                Status
              </th>
              <th className="hidden px-4 py-3 font-medium text-muted-foreground md:table-cell">
                Login Terakhir
              </th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground">
                  Tidak ada user
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-full bg-accent text-xs font-semibold">
                        {u.first_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">
                          {u.first_name} {u.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground sm:hidden">
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {u.email}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${roleBadge[u.role]}`}
                    >
                      <Shield className="size-3" />
                      {roleLabel[u.role]}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    {u.is_active ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                        <CheckCircle2 className="size-3.5" />
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-red-600">
                        <XCircle className="size-3.5" />
                        Nonaktif
                      </span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">
                    {u.last_login_at
                      ? new Date(u.last_login_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Select
                        value={u.role}
                        onValueChange={(v) => handleRoleChange(u.id, v as UserRole)}
                        disabled={u.id === currentUser?.id}
                      >
                        <SelectTrigger className="w-24 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => handleToggleStatus(u.id, u.is_active)}
                        disabled={u.id === currentUser?.id}
                        title={u.is_active ? "Nonaktifkan" : "Aktifkan"}
                        className={
                          u.is_active
                            ? "text-red-600 hover:text-red-700"
                            : "text-emerald-600 hover:text-emerald-700"
                        }
                      >
                        {u.is_active ? (
                          <XCircle className="size-4" />
                        ) : (
                          <CheckCircle2 className="size-4" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
