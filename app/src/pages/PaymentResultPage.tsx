import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react"
import { FeaturedProducts } from "@/sections/FeaturedProducts"

type Props = { outcome: "success" | "failed" }
type Verified = { status: "paid" | "pending" | "failed" | "unknown"; own_store: boolean }

/**
 * Halaman tujuan pengalihan Midtrans (Settings > Snap Checkout > Redirection URLs).
 * Alamat itu berlaku untuk seluruh akun Midtrans, jadi pelanggan website lain juga mendarat di sini:
 * isinya netral (status pembayaran) ditambah etalase aplikasi di platform ini.
 * Parameter di alamat (order_id, status) bisa diketik siapa saja, jadi status "berhasil" hanya
 * dinyatakan bila server (yang bertanya ke Midtrans) memastikannya.
 */
export function PaymentResultPage({ outcome }: Props) {
  const [params] = useSearchParams()
  const orderId = params.get("order_id")
  const [verified, setVerified] = useState<Verified | null>(null)
  const [checking, setChecking] = useState(Boolean(orderId))

  useEffect(() => {
    if (!orderId) return
    let cancelled = false
    fetch(`/api/payment-result/${encodeURIComponent(orderId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => !cancelled && setVerified(data))
      .catch(() => {})
      .finally(() => !cancelled && setChecking(false))
    return () => {
      cancelled = true
    }
  }, [orderId])

  const status = verified?.status
  const view =
    status === "paid"
      ? "paid"
      : status === "pending"
        ? "pending"
        : status === "failed"
          ? "failed"
          : outcome === "success"
            ? "verifying"
            : "failed-unverified"

  const content = {
    paid: {
      icon: <CheckCircle2 className="size-14 text-emerald-600" />,
      title: "Pembayaran berhasil",
      text: "Terima kasih. Konfirmasi dan detail pesanan dikirim ke email Anda oleh website tempat Anda berbelanja.",
    },
    pending: {
      icon: <Clock className="size-14 text-amber-600" />,
      title: "Menunggu pembayaran",
      text: "Pembayaran belum kami terima. Selesaikan pembayaran sesuai instruksi pada metode yang Anda pilih.",
    },
    verifying: {
      icon: <Clock className="size-14 text-primary" />,
      title: "Pembayaran sedang diverifikasi",
      text: "Terima kasih. Kami sedang memeriksa pembayaran Anda. Konfirmasi akan dikirim ke email Anda.",
    },
    failed: {
      icon: <XCircle className="size-14 text-destructive" />,
      title: "Pembayaran tidak berhasil",
      text: "Pembayaran tidak dapat diproses atau dibatalkan. Silakan kembali ke website tempat Anda berbelanja dan coba lagi dengan metode lain.",
    },
    "failed-unverified": {
      icon: <XCircle className="size-14 text-destructive" />,
      title: "Pembayaran tidak berhasil",
      text: "Pembayaran tidak dapat diproses. Silakan kembali ke website tempat Anda berbelanja dan coba lagi.",
    },
  }[view]

  return (
    <div>
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center">
        {checking ? <Loader2 className="size-10 animate-spin text-muted-foreground" /> : content.icon}
        <h1 className="mt-6 text-2xl font-bold tracking-tight">
          {checking ? "Memeriksa status pembayaran..." : content.title}
        </h1>
        {!checking && <p className="mt-2 text-muted-foreground">{content.text}</p>}

        {orderId && !checking && (
          <p className="mt-4 rounded-lg bg-muted px-3 py-1.5 font-mono text-xs text-muted-foreground">
            Nomor pesanan: {orderId}
          </p>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {verified?.own_store && (
            <Button asChild className="rounded-full">
              <Link to="/akun/pesanan">Lihat Pesanan Saya</Link>
            </Button>
          )}
          <Button asChild variant={verified?.own_store ? "outline" : "default"} className="rounded-full">
            <Link to="/trial-register">Coba aplikasi gratis 14 hari</Link>
          </Button>
        </div>
      </div>

      {/* Etalase aplikasi di platform ini, apa pun asal transaksinya */}
      <FeaturedProducts />
    </div>
  )
}
