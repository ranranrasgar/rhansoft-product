import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calculator, Copy, KeyRound, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { authHeaders } from "@/lib/auth"

type Status = "pending" | "issued" | "rejected"

type LicenseRequest = {
  id: number
  status: Status
  license_code: string
  registration_number: string | null
  admin_note: string | null
  created_at: string
  issued_at: string | null
  customer_name: string
  customer_email: string
  product_name: string
  order_id: string
  order_status: string
}

type GeneratedNumber = {
  id: string
  label: string
  verified: boolean
  note?: string
  number?: string
  error?: string
}

const TABS: { value: Status; label: string }[] = [
  { value: "pending", label: "Menunggu" },
  { value: "issued", label: "Diterbitkan" },
  { value: "rejected", label: "Ditolak" },
]

const isPaid = (s: string) => s === "settlement" || s === "capture"

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success("Disalin")
  } catch {
    toast.error("Gagal menyalin")
  }
}

export function LicenseRequestsPage() {
  const [tab, setTab] = useState<Status>("pending")
  const [items, setItems] = useState<LicenseRequest[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<number | null>(null)
  const [numbers, setNumbers] = useState<Record<number, string>>({})
  const [editing, setEditing] = useState<number | null>(null)
  const [rejecting, setRejecting] = useState<LicenseRequest | null>(null)
  const [note, setNote] = useState("")
  const [generatorAvailable, setGeneratorAvailable] = useState(false)
  const [generated, setGenerated] = useState<Record<number, GeneratedNumber[]>>({})
  const [generating, setGenerating] = useState<number | null>(null)

  // Tombol Generate hanya muncul bila rumus terpasang di server (berkas pribadi di luar git)
  useEffect(() => {
    fetch("/api/admin/license-generator", { headers: authHeaders() })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setGeneratorAvailable(Boolean(data?.available)))
      .catch(() => {})
  }, [])

  const generate = async (id: number) => {
    setGenerating(id)
    try {
      const res = await fetch(`/api/admin/license-requests/${id}/generate`, {
        method: "POST",
        headers: authHeaders(),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Gagal membuat nomor registrasi")
      setGenerated((g) => ({ ...g, [id]: data.results }))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat nomor registrasi")
    } finally {
      setGenerating(null)
    }
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/license-requests?status=${tab}`, { headers: authHeaders() })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setItems(data.items)
      setPendingCount(data.pending_count)
    } catch {
      toast.error("Gagal memuat permintaan")
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    load()
  }, [load])

  const send = async (id: number, action: "issue" | "reject", body: object, okMessage: string) => {
    setBusy(id)
    try {
      const res = await fetch(`/api/admin/license-requests/${id}/${action}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Gagal")
      toast.success(okMessage)
      setEditing(null)
      setRejecting(null)
      setNote("")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <KeyRound className="size-6" />
          Registrasi Lisensi
        </h1>
        <p className="text-sm text-muted-foreground">
          Permintaan nomor registrasi dari pelanggan. Buat nomor dengan alat Anda, tempel di sini, lalu terbitkan.
        </p>
      </div>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <Button
            key={t.value}
            size="sm"
            variant={tab === t.value ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setTab(t.value)}
          >
            {t.label}
            {t.value === "pending" && pendingCount > 0 && (
              <span className="ml-1.5 rounded-full bg-white/25 px-1.5 text-xs">{pendingCount}</span>
            )}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <p className="rounded-xl border border-border py-12 text-center text-muted-foreground">
            Tidak ada permintaan
          </p>
        ) : (
          items.map((r) => {
            const paid = isPaid(r.order_status)
            const working = busy === r.id
            const showInput = r.status === "pending" || editing === r.id
            return (
              <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{r.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{r.customer_email}</p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-medium">{r.product_name}</p>
                    <p className="font-mono text-muted-foreground">{r.order_id}</p>
                    {!paid && <Badge variant="destructive">Pesanan {r.order_status}</Badge>}
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                  <span className="text-xs text-muted-foreground">Kode lisensi</span>
                  <span className="flex-1 font-mono text-sm break-all">{r.license_code}</span>
                  <Button size="sm" variant="outline" className="h-7 rounded-full" onClick={() => copy(r.license_code)}>
                    <Copy className="mr-1 size-3" />
                    Salin
                  </Button>
                </div>

                {r.status === "issued" && editing !== r.id && (
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <p className="text-sm">
                      Nomor registrasi: <span className="font-mono font-bold">{r.registration_number}</span>
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => {
                        setEditing(r.id)
                        setNumbers((n) => ({ ...n, [r.id]: r.registration_number ?? "" }))
                      }}
                    >
                      Ubah
                    </Button>
                  </div>
                )}

                {r.status === "rejected" && (
                  <p className="mt-3 text-sm text-destructive">Ditolak: {r.admin_note}</p>
                )}

                {showInput && (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Input
                      value={numbers[r.id] ?? ""}
                      onChange={(e) => setNumbers((n) => ({ ...n, [r.id]: e.target.value }))}
                      placeholder="Tempel nomor registrasi"
                      className="font-mono text-sm"
                      disabled={!paid}
                    />
                    {generatorAvailable && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        disabled={generating === r.id || !paid}
                        onClick={() => generate(r.id)}
                      >
                        {generating === r.id ? (
                          <Loader2 className="mr-1 size-4 animate-spin" />
                        ) : (
                          <Calculator className="mr-1 size-4" />
                        )}
                        Generate
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="rounded-full"
                      disabled={working || !paid || (numbers[r.id] ?? "").trim().length === 0}
                      onClick={() =>
                        send(r.id, "issue", { registration_number: numbers[r.id] }, "Nomor registrasi diterbitkan")
                      }
                    >
                      {working && <Loader2 className="mr-1 size-4 animate-spin" />}
                      Terbitkan
                    </Button>
                    {r.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full text-destructive"
                        disabled={working}
                        onClick={() => setRejecting(r)}
                      >
                        Tolak
                      </Button>
                    )}
                    {editing === r.id && (
                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                        Batal
                      </Button>
                    )}
                  </div>
                )}

                {showInput && generated[r.id] && (
                  <div className="mt-3 rounded-lg border border-border">
                    <p className="border-b border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
                      Hasil rumus untuk kode ini. Pilih versi yang dipakai program pelanggan, lalu periksa dan Terbitkan.
                    </p>
                    <ul className="divide-y divide-border">
                      {generated[r.id].map((g) => (
                        <li key={g.id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
                          <span className="w-24 font-medium">{g.label}</span>
                          {!g.verified && <Badge variant="outline">Belum terverifikasi</Badge>}
                          {g.error ? (
                            <span className="text-xs text-destructive">{g.error}</span>
                          ) : (
                            <>
                              <span className="flex-1 font-mono break-all">{g.number}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 rounded-full"
                                onClick={() => setNumbers((n) => ({ ...n, [r.id]: g.number ?? "" }))}
                              >
                                Pakai
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7" onClick={() => copy(g.number ?? "")}>
                                <Copy className="size-3" />
                              </Button>
                            </>
                          )}
                          {g.note && <p className="w-full text-xs text-muted-foreground">{g.note}</p>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      <Dialog open={!!rejecting} onOpenChange={(open) => !open && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak permintaan</DialogTitle>
            <DialogDescription>
              Alasan ini tampil di Pesanan Saya pelanggan. Pelanggan bisa mengirim ulang kode yang benar.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Mis. kode lisensi salah ketik, mohon salin ulang dari program"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>
              Kembali
            </Button>
            <Button
              disabled={note.trim().length === 0 || (rejecting ? busy === rejecting.id : false)}
              onClick={() => rejecting && send(rejecting.id, "reject", { note }, "Permintaan ditolak")}
            >
              Tolak permintaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
