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
    <div className="text-xs">
      <p className="flex items-center gap-1.5 font-semibold">
        <KeyRound className="size-3.5" />
        Nomor registrasi
        <span className="font-normal text-muted-foreground">
          ({used} dari {quantity} terpakai)
        </span>
      </p>

      {requests.length > 0 && (
        <table className="mt-1.5 w-full">
          <thead className="text-left text-muted-foreground">
            <tr className="border-b border-border">
              <th className="py-1 pr-2 font-normal">Kode lisensi</th>
              <th className="py-1 pr-2 font-normal">Nomor registrasi</th>
              <th className="py-1 text-right font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => {
              const st = STATUS_LABEL[r.status]
              return (
                <tr key={r.id} className="border-b border-border/60 align-middle last:border-0">
                  <td className="py-1.5 pr-2 font-mono break-all">{r.license_code}</td>
                  <td className="py-1.5 pr-2">
                    {r.status === "issued" && r.registration_number ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="font-mono font-bold break-all">{r.registration_number}</span>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="size-6 shrink-0"
                          aria-label="Salin nomor registrasi"
                          onClick={() => copy(r.registration_number!)}
                        >
                          <Copy className="size-3" />
                        </Button>
                      </span>
                    ) : r.status === "rejected" && r.admin_note ? (
                      <span className="text-destructive">Alasan: {r.admin_note}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-1.5 text-right">
                    <Badge variant={st.variant} className="text-[10px]">
                      {st.label}
                    </Badge>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {remaining > 0 ? (
        <div className="mt-2 flex gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Tempel kode lisensi dari program"
            className="h-8 font-mono text-xs"
          />
          <Button
            size="sm"
            className="h-8 shrink-0 rounded-full"
            disabled={sending || code.trim().length === 0}
            onClick={submit}
          >
            {sending && <Loader2 className="mr-1 size-4 animate-spin" />}
            Minta nomor
          </Button>
        </div>
      ) : (
        <p className="mt-1.5 text-muted-foreground">
          Kuota sudah terpakai. Hubungi kami untuk menambah atau mengganti komputer.
        </p>
      )}
    </div>
  )
}
