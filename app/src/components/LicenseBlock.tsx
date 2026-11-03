import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Copy, KeyRound, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { authHeaders } from "@/lib/auth"

export type LicenseRequestView = {
  id: number
  license_code: string
  status: "pending" | "issued" | "rejected"
  created_at: string
  registration_number?: string
  admin_note?: string
}

type Props = {
  orderItemId: number
  quantity: number
  requests: LicenseRequestView[]
  onChanged: () => void
}

const STATUS_LABEL = {
  pending: { label: "Menunggu", variant: "secondary" },
  issued: { label: "Diterbitkan", variant: "default" },
  rejected: { label: "Ditolak", variant: "destructive" },
} as const

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success("Disalin")
  } catch {
    toast.error("Gagal menyalin, salin manual")
  }
}

/** Blok lisensi per produk di Pesanan Saya: minta nomor registrasi dan lihat hasilnya. */
export function LicenseBlock({ orderItemId, quantity, requests, onChanged }: Props) {
  const [code, setCode] = useState("")
  const [sending, setSending] = useState(false)

  const used = requests.filter((r) => r.status !== "rejected").length
  const remaining = Math.max(0, quantity - used)

  const submit = async () => {
    setSending(true)
    try {
      const res = await fetch(`/api/my/order-items/${orderItemId}/license-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ license_code: code }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Gagal mengirim permintaan")
      toast.success("Permintaan terkirim. Nomor registrasi akan muncul di sini setelah diterbitkan.")
      setCode("")
      onChanged()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim permintaan")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-border bg-muted/30 p-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold">
        <KeyRound className="size-3.5" />
        Nomor registrasi lisensi
        <span className="font-normal text-muted-foreground">
          ({used} dari {quantity} terpakai)
        </span>
      </p>

      {requests.length > 0 && (
        <ul className="mt-2 space-y-2">
          {requests.map((r) => {
            const st = STATUS_LABEL[r.status]
            return (
              <li key={r.id} className="rounded-lg border border-border bg-card p-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono break-all">{r.license_code}</span>
                  <Badge variant={st.variant}>{st.label}</Badge>
                </div>
                {r.status === "issued" && r.registration_number && (
                  <div className="mt-2 flex items-center justify-between gap-2 rounded-md bg-primary/10 px-2 py-1.5">
                    <span className="font-mono text-sm font-bold break-all">{r.registration_number}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 shrink-0 rounded-full"
                      onClick={() => copy(r.registration_number!)}
                    >
                      <Copy className="mr-1 size-3" />
                      Salin
                    </Button>
                  </div>
                )}
                {r.status === "rejected" && r.admin_note && (
                  <p className="mt-1 text-destructive">Alasan: {r.admin_note}</p>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {remaining > 0 ? (
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Tempel kode lisensi dari program"
            className="font-mono text-xs"
          />
          <Button
            size="sm"
            className="rounded-full"
            disabled={sending || code.trim().length === 0}
            onClick={submit}
          >
            {sending && <Loader2 className="mr-1 size-4 animate-spin" />}
            Minta nomor registrasi
          </Button>
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          Kuota lisensi untuk produk ini sudah terpakai. Hubungi kami untuk menambah atau mengganti komputer.
        </p>
      )}
    </div>
  )
}
