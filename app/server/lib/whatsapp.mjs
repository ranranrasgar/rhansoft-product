/**
 * WhatsApp notification module — kirim pesan otomatis via Fonnte API.
 *
 * Digunakan untuk:
 *   - Notifikasi admin saat ada pendaftar uji coba gratis baru
 *   - Notifikasi admin saat ada pesanan baru
 *
 * Konfigurasi (di .env):
 *   WHATSAPP_ADMIN_NUMBER=6281333355871   (nomor admin, format internasional tanpa +)
 *   WHATSAPP_FONNTE_TOKEN=xxx             (token API dari fonnte.com)
 *
 * Jika token tidak ada, fallback: log pesan ke console saja (tidak error).
 */
import { COMPANY } from "./email.mjs"

const FONNTE_TOKEN = process.env.WHATSAPP_FONNTE_TOKEN || ""
const ADMIN_NUMBER = process.env.WHATSAPP_ADMIN_NUMBER || COMPANY.whatsapp

/**
 * Kirim pesan WhatsApp via Fonnte API.
 * @param {string} to — nomor tujuan (format internasional tanpa +, contoh: 6281234567890)
 * @param {string} message — isi pesan
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendWhatsApp(to, message) {
  if (!FONNTE_TOKEN) {
    console.warn("⚠️ WHATSAPP_FONNTE_TOKEN belum diset di .env — pesan WhatsApp tidak terkirim otomatis.")
    console.log(`   To: ${to}`)
    console.log(`   Message: ${message.substring(0, 100)}...`)
    return { success: false, error: "Token tidak dikonfigurasi" }
  }

  try {
    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: FONNTE_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target: to,
        message: message,
        countryCode: "62",
      }),
    })

    const data = await res.json()

    if (data.status === true || data.status === "success") {
      console.log(`📱 WhatsApp terkirim ke ${to}`)
      return { success: true }
    } else {
      console.error("⚠️ WhatsApp API error:", data.reason || data.message || "Unknown error")
      return { success: false, error: data.reason || data.message || "Unknown error" }
    }
  } catch (err) {
    console.error("⚠️ WhatsApp send error:", err.message)
    return { success: false, error: err.message }
  }
}

/**
 * Kirim notifikasi ke admin saat ada pendaftar uji coba gratis baru.
 * @param {object} reg — data pendaftar dari database
 */
export async function sendTrialAdminNotification(reg) {
  const msg = `🔔 *PENDAFTARAN UJI COBARU*

📋 *Detail Pendaftar:*
• Nama: ${reg.full_name}
• Email: ${reg.email}
• WhatsApp: ${reg.whatsapp}
• Kota: ${reg.city || "-"}
• Provinsi: ${reg.province || "-"}
• Produk: ${reg.product_name || "-"}
• Instansi: ${reg.company || "-"}
• No. Registrasi: ${reg.registration_id}
• Tanggal: ${new Date(reg.created_at || Date.now()).toLocaleString("id-ID")}

✅ Surat konfirmasi email telah dikirim ke pendaftar.
Mohon hubungi pendaftar via WhatsApp dalam 1×24 jam untuk setup akun demo.

— ${COMPANY.name}`

  return sendWhatsApp(ADMIN_NUMBER, msg)
}
