import { authHeaders } from "@/lib/auth"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Mail, Search, Loader2, Users as UsersIcon } from "lucide-react"
import { toast } from "sonner"

type Customer = {
  id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  address: string | null
  city: string | null
  postal_code: string | null
  country_code: string
  created_at: string
}

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch("/api/admin/orders", { headers: authHeaders() })
      .then(async (res) => {
        if (!res.ok) throw new Error("Gagal")
        return res.json()
      })
      .then((orders: any[]) => {
        // Extract unique customers from orders
        const map = new Map<number, Customer>()
        for (const o of orders) {
          if (o.customer_id && !map.has(o.customer_id)) {
            map.set(o.customer_id, {
              id: o.customer_id,
              first_name: o.first_name || "",
              last_name: o.last_name || "",
              email: o.email || "",
              phone: o.phone || "",
              address: null,
              city: null,
              postal_code: null,
              country_code: "ID",
              created_at: o.created_at,
            })
          }
        }
        setCustomers(Array.from(map.values()))
      })
      .catch(() => toast.error("Gagal memuat data pelanggan"))
      .finally(() => setLoading(false))
  }, [])

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase()
    return (
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <UsersIcon className="size-6" />
          Pelanggan
        </h1>
        <p className="text-sm text-muted-foreground">
          Daftar semua pelanggan yang pernah bertransaksi
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Pelanggan</p>
          <p className="text-2xl font-bold">{customers.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Email Terdaftar</p>
          <p className="text-2xl font-bold">
            {new Set(customers.map((c) => c.email)).size}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">No. Telepon Unik</p>
          <p className="text-2xl font-bold">
            {new Set(customers.map((c) => c.phone)).size}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama, email, telepon..."
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium text-muted-foreground">Nama</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Kontak</th>
              <th className="hidden px-4 py-3 font-medium text-muted-foreground md:table-cell">
                Terdaftar
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={3} className="py-12 text-center">
                  <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-12 text-center text-muted-foreground">
                  Belum ada pelanggan
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-full bg-accent text-xs font-semibold">
                        {c.first_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">
                        {c.first_name} {c.last_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="flex items-center gap-1 text-xs">
                      <Mail className="size-3 text-muted-foreground" />
                      {c.email}
                    </p>
                    <p className="text-xs text-muted-foreground">{c.phone}</p>
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">
                    {new Date(c.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
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
