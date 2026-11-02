/**
 * Email module — nodemailer + HTML template dengan kop perusahaan.
 *
 * Mengirim email konfirmasi pesanan ke pelanggan setelah pembayaran sukses.
 * Berisi: kop perusahaan, detail pesanan, deskripsi produk, tutorial
 * instalasi, dan link download (disetting per produk oleh admin).
 */
import nodemailer from "nodemailer"

// ── SMTP Configuration ─────────────────────────────────────────
// Baca env MAIL_* (dari .env) dengan fallback SMTP_* untuk kompatibilitas
const SMTP_HOST = process.env.MAIL_HOST || process.env.SMTP_HOST || "smtp.gmail.com"
const SMTP_PORT = parseInt(process.env.MAIL_PORT || process.env.SMTP_PORT || "587")
const SMTP_USER = process.env.MAIL_USERNAME || process.env.SMTP_USER || ""
const SMTP_PASS = process.env.MAIL_PASSWORD || process.env.SMTP_PASS || ""

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
})

export const COMPANY = {
  name: "Rhansoft Management",
  tagline: "Software Solutions Since 2008",
  email: process.env.MAIL_FROM_ADDRESS || "noreply@rhansoft.com",
  sales: "support@rhansoft.com",
  phone: "+62 813-3333-5871",
  whatsapp: "6281333355871",
  address: "Jl. Griya Hamdan Asri No. 09, Arcamanik, Kota Bandung 40195, Indonesia",
  website: "https://www.rhansoft.com",
  logoColor: "#0ea5e9",
}

// ── HTML Email Template ─────────────────────────────────────────
function emailTemplate({ customer, order, items }) {
  const fullName = `${customer.first_name} ${customer.last_name || ""}`.trim()
  const orderDate = new Date(order.created_at || Date.now()).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  // ── Build product cards ────────────────────────────────────
  const productCards = items
    .map((item, idx) => {
      const dl = item.download_links || []
      const tutorial = item.install_tutorial || ""

      // Download links section
      const downloadLinksHtml =
        dl.length > 0
          ? dl
              .map(
                (link) => `
          <tr>
            <td style="padding:8px 16px;background:#f8fafc;border-radius:8px;">
              <a href="${link.url}"
                 style="display:inline-block;padding:10px 24px;background:${COMPANY.logoColor};color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
                ⬇ Download ${link.label || "File"}
              </a>
              ${link.size ? `<span style="margin-left:12px;color:#64748b;font-size:13px;">(${link.size})</span>` : ""}
            </td>
          </tr>`
              )
              .join("")
          : `
          <tr>
            <td style="padding:12px 16px;background:#fef3c7;border-radius:8px;color:#92400e;font-size:13px;">
              Link download belum tersedia. Hubungi ${COMPANY.sales} untuk mendapatkan file.
            </td>
          </tr>`

      // Tutorial section
      const tutorialHtml = tutorial
        ? `
        <tr>
          <td style="padding:16px;background:#f1f5f9;border-radius:8px;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:${COMPANY.logoColor};text-transform:uppercase;letter-spacing:0.05em;">📋 Tutorial Instalasi</p>
            <div style="font-size:14px;line-height:1.7;color:#334155;white-space:pre-wrap;">${tutorial}</div>
          </td>
        </tr>`
        : ""

      return `
      <!-- Product ${idx + 1} -->
      <tr>
        <td style="padding:0 0 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
            <!-- Product header -->
            <tr>
              <td style="padding:16px 20px;background:linear-gradient(135deg,${COMPANY.logoColor}15,#f0f9ff);">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:${COMPANY.logoColor};text-transform:uppercase;letter-spacing:0.08em;">${item.category || "Software"}</p>
                      <h3 style="margin:0;font-size:18px;font-weight:700;color:#0f172a;">${item.product_name}</h3>
                    </td>
                    <td align="right" valign="top">
                      <p style="margin:0;font-size:13px;color:#64748b;">${item.quantity} × ${formatPrice(item.price)}</p>
                      <p style="margin:2px 0 0;font-size:15px;font-weight:700;color:#0f172a;">${formatPrice(item.price * item.quantity)}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Download links -->
            <tr>
              <td style="padding:16px 20px;">
                <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:${COMPANY.logoColor};text-transform:uppercase;letter-spacing:0.05em;">⬇ Link Download</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-spacing:0 4px;">
                  ${downloadLinksHtml}
                </table>
              </td>
            </tr>
            ${tutorialHtml ? `<tr><td style="padding:0 20px 16px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td>${tutorialHtml.replace(/^<tr>/, "").replace(/<\/tr>$/, "")}</td></tr></table></td></tr>` : ""}
          </table>
        </td>
      </tr>`
    })
    .join("")

  // ── Full HTML ──────────────────────────────────────────────
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Konfirmasi Pesanan ${order.order_id}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- ════════ KOP PERUSAHAAN ════════ -->
          <tr>
            <td style="background:linear-gradient(135deg,${COMPANY.logoColor} 0%,#0284c7 100%);padding:32px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <h1 style="margin:0;font-size:28px;font-weight:800;color:#fff;letter-spacing:-0.02em;">
                      ${COMPANY.name}
                    </h1>
                    <p style="margin:4px 0 0;font-size:13px;color:#fff/80;color:rgba(255,255,255,0.85);">
                      ${COMPANY.tagline}
                    </p>
                  </td>
                  <td align="right" valign="middle">
                    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.6);text-align:right;line-height:1.6;">
                      ${COMPANY.address}<br>
                      ${COMPANY.phone}<br>
                      <a href="${COMPANY.website}" style="color:rgba(255,255,255,0.9);text-decoration:none;">${COMPANY.website}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ════════ HEADER ════════ -->
          <tr>
            <td style="padding:32px 40px 16px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:${COMPANY.logoColor};text-transform:uppercase;letter-spacing:0.08em;">
                ✅ Pembayaran Dikonfirmasi
              </p>
              <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">
                Terima kasih atas pembelian Anda, ${fullName}!
              </h2>
              <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">
                Pesanan Anda telah dikonfirmasi dan pembayaran berhasil diterima.
                Berikut adalah detail pesanan dan link download produk digital Anda.
              </p>
            </td>
          </tr>

          <!-- ════════ ORDER INFO ════════ -->
          <tr>
            <td style="padding:0 40px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;padding:20px;">
                <tr>
                  <td style="padding:4px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:13px;color:#64748b;">Nomor Pesanan</td>
                        <td align="right" style="font-size:14px;font-weight:700;color:#0f172a;font-family:monospace;">${order.order_id}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:13px;color:#64748b;">Tanggal</td>
                        <td align="right" style="font-size:14px;color:#0f172a;">${orderDate}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:13px;color:#64748b;">Metode Pembayaran</td>
                        <td align="right" style="font-size:14px;color:#0f172a;text-transform:capitalize;">${order.payment_type || order.payment_method || "—"}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:13px;color:#64748b;">Status</td>
                        <td align="right">
                          <span style="display:inline-block;padding:3px 10px;background:#dcfce7;color:#16a34a;border-radius:99px;font-size:12px;font-weight:600;">
                            Lunas ✓
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ════════ PRODUCT CARDS ════════ -->
          <tr>
            <td style="padding:8px 40px 0;">
              <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#0f172a;">
                📦 Produk Digital Anda
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${productCards}
              </table>
            </td>
          </tr>

          <!-- ════════ ORDER SUMMARY ════════ -->
          <tr>
            <td style="padding:16px 40px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
                <tr>
                  <td style="padding:4px 0;font-size:14px;color:#64748b;">
                    Subtotal
                  </td>
                  <td align="right" style="padding:4px 0;font-size:14px;color:#0f172a;">
                    ${formatPrice(order.gross_amount)}
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 0;font-size:14px;color:#64748b;">
                    Ongkos Kirim
                  </td>
                  <td align="right" style="padding:4px 0;font-size:14px;color:#0f172a;">
                    ${order.shipping_cost > 0 ? formatPrice(order.shipping_cost) : "Gratis"}
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 0;font-size:14px;color:#64748b;">
                    PPN (11%)
                  </td>
                  <td align="right" style="padding:4px 0;font-size:14px;color:#0f172a;">
                    ${formatPrice(order.tax)}
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:8px 0 4px;">
                    <hr style="border:none;border-top:1px solid #e2e8f0;margin:0;">
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0 0;font-size:16px;font-weight:700;color:#0f172a;">
                    Total
                  </td>
                  <td align="right" style="padding:8px 0 0;font-size:20px;font-weight:800;color:${COMPANY.logoColor};">
                    ${formatPrice(order.total_amount)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ════════ SUPPORT INFO ════════ -->
          <tr>
            <td style="padding:0 40px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7;border-radius:12px;padding:20px;">
                <tr>
                  <td>
                    <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#92400e;">
                      💬 Butuh Bantuan?
                    </p>
                    <p style="margin:0;font-size:13px;color:#78350f;line-height:1.7;">
                      Jika ada kendala dalam instalasi atau aktivasi, hubungi tim support kami:<br>
                      📧 Email: <a href="mailto:${COMPANY.sales}" style="color:#92400e;">${COMPANY.sales}</a><br>
                      📱 WhatsApp: <a href="https://wa.me/${COMPANY.phone.replace(/[^0-9]/g, "")}" style="color:#92400e;">${COMPANY.phone}</a><br>
                      🕒 Jam Operasional: Senin–Sabtu, 09.00–18.00 WIB
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ════════ LISENSI INFO ════════ -->
          <tr>
            <td style="padding:0 40px 24px;">
              <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#64748b;">
                ⚠️ Informasi Penting
              </p>
              <ul style="margin:8px 0 0;padding-left:20px;font-size:13px;color:#64748b;line-height:1.8;">
                <li>Link download berlaku selamanya. Simpan email ini sebagai bukti pembelian.</li>
                <li>Lisensi berlaku untuk 1 komputer (sesuai ketentuan masing-masing produk).</li>
                <li>Update minor (bug fix) gratis selamanya. Update major tersedia dengan biaya upgrade.</li>
                <li>Jangan bagikan link download atau serial number kepada pihak lain.</li>
              </ul>
            </td>
          </tr>

          <!-- ════════ FOOTER ════════ -->
          <tr>
            <td style="background:#0f172a;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#fff;">
                ${COMPANY.name}
              </p>
              <p style="margin:0 0 8px;font-size:12px;color:rgba(255,255,255,0.5);">
                ${COMPANY.address}
              </p>
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.4);line-height:1.6;">
                Email ini dikirim secara otomatis sebagai konfirmasi pesanan.<br>
                Mohon jangan balas email ini. Untuk pertanyaan, hubungi ${COMPANY.sales}.<br>
                © ${new Date().getFullYear()} ${COMPANY.name}. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── Format price ─────────────────────────────────────────────────
function formatPrice(n) {
  const num = typeof n === "number" ? n : parseInt(n) || 0
  return num.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  })
}

// ── Send order confirmation email ────────────────────────────────
export async function sendOrderEmail(order, items) {
  const customer = {
    first_name: order.first_name,
    last_name: order.last_name,
    email: order.email,
    phone: order.phone,
  }

  const html = emailTemplate({ customer, order, items })

  const mailOptions = {
    from: `"${COMPANY.name}" <${process.env.SMTP_USER || COMPANY.email}>`,
    to: customer.email,
    subject: `✅ Konfirmasi Pesanan ${order.order_id} — ${COMPANY.name}`,
    html,
  }

  const info = await transporter.sendMail(mailOptions)
  console.log(`📧 Email sent to ${customer.email}: ${info.messageId}`)
  return info
}

// ── Trial Registration Email (surat resmi dengan kop) ────────────
export async function sendTrialRegistrationEmail(reg) {
  const fullName = reg.full_name
  const regDate = new Date(reg.created_at || Date.now()).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  const regNumber = reg.registration_id
  const expiryDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Surat Konfirmasi Pendaftaran Uji Coba — ${COMPANY.name}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Times New Roman',Georgia,serif;color:#1e293b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="700" cellpadding="0" cellspacing="0" style="background:#ffffff;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- ════════ KOP SURAT RESMI ════════ -->
          <tr>
            <td style="padding:0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom:3px double ${COMPANY.logoColor};">
                <tr>
                  <td style="padding:24px 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td valign="top" style="width:80px;">
                          <div style="width:60px;height:60px;border-radius:12px;background:linear-gradient(135deg,${COMPANY.logoColor},#0284c7);display:flex;align-items:center;justify-content:center;">
                            <span style="color:#fff;font-size:24px;font-weight:800;font-family:Arial,sans-serif;">R</span>
                          </div>
                        </td>
                        <td valign="middle">
                          <h1 style="margin:0;font-size:26px;font-weight:800;color:#0f172a;letter-spacing:0.02em;font-family:Arial,sans-serif;">
                            ${COMPANY.name}
                          </h1>
                          <p style="margin:4px 0 0;font-size:12px;color:#64748b;font-family:Arial,sans-serif;letter-spacing:0.05em;text-transform:uppercase;">
                            ${COMPANY.tagline}
                          </p>
                          <p style="margin:2px 0 0;font-size:11px;color:#94a3b8;font-family:Arial,sans-serif;">
                            ${COMPANY.address}
                          </p>
                        </td>
                        <td align="right" valign="middle" style="font-size:11px;color:#64748b;font-family:Arial,sans-serif;line-height:1.6;">
                          <strong style="color:#0f172a;">Kontak:</strong><br>
                          📞 ${COMPANY.phone}<br>
                          ✉ ${COMPANY.sales}<br>
                          🌐 ${COMPANY.website}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ════════ ISI SURAT ════════ -->
          <tr>
            <td style="padding:40px 50px;">
              <!-- Header surat -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:14px;">Nomor: <strong>REG/${regNumber}/${COMPANY.name.split(" ")[0]}/XI/2026</strong></p>
                    <p style="margin:4px 0 0;font-size:14px;">Perihal: <strong>Konfirmasi Pendaftaran Uji Coba Gratis</strong></p>
                  </td>
                  <td align="right">
                    <p style="margin:0;font-size:14px;">Bandung, ${regDate}</p>
                  </td>
                </tr>
              </table>

              <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">

              <!-- Salam pembuka -->
              <p style="margin:0 0 20px;font-size:15px;">Kepada Yth,</p>
              <p style="margin:0 0 4px;font-size:15px;"><strong>${fullName}</strong></p>
              <p style="margin:0 0 24px;font-size:14px;color:#64748b;">${reg.city ? reg.city + ", " : ""}${reg.province || "Indonesia"}</p>

              <p style="margin:0 0 16px;font-size:15px;text-align:justify;line-height:1.8;">
                Dengan hormat,
              </p>
              <p style="margin:0 0 16px;font-size:15px;text-align:justify;line-height:1.8;text-indent:40px;">
                Sehubungan dengan pendaftaran uji coba gratis produk ${COMPANY.name} yang Bapak/Ibu <strong>${fullName}</strong>
                lakukan pada ${regDate}, bersama ini kami sampaikan konfirmasi bahwa pendaftaran Anda telah <strong>diterima dan disetujui</strong>.
                Uji coba gratis berlaku selama <strong>14 (empat belas) hari kalender</strong> terhitung sejak email ini diterima,
                dan akan berakhir pada <strong>${expiryDate}</strong>.
              </p>

              <!-- Data pendaftar -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border:1px solid #e2e8f0;">
                <tr>
                  <td colspan="2" style="padding:12px 20px;background:${COMPANY.logoColor};color:#fff;font-family:Arial,sans-serif;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">
                    📋 Data Pendaftar
                  </td>
                </tr>
                <tr><td style="padding:8px 20px;font-size:14px;color:#64748b;width:180px;border-bottom:1px solid #f1f5f9;">Nama Lengkap</td><td style="padding:8px 20px;font-size:14px;font-weight:600;border-bottom:1px solid #f1f5f9;">${fullName}</td></tr>
                <tr><td style="padding:8px 20px;font-size:14px;color:#64748b;border-bottom:1px solid #f1f5f9;">Email</td><td style="padding:8px 20px;font-size:14px;font-weight:600;border-bottom:1px solid #f1f5f9;">${reg.email}</td></tr>
                <tr><td style="padding:8px 20px;font-size:14px;color:#64748b;border-bottom:1px solid #f1f5f9;">WhatsApp</td><td style="padding:8px 20px;font-size:14px;font-weight:600;border-bottom:1px solid #f1f5f9;">${reg.whatsapp}</td></tr>
                ${reg.product_name ? `<tr><td style="padding:8px 20px;font-size:14px;color:#64748b;border-bottom:1px solid #f1f5f9;">Produk Diminati</td><td style="padding:8px 20px;font-size:14px;font-weight:600;border-bottom:1px solid #f1f5f9;">${reg.product_name}</td></tr>` : ""}
                ${reg.company ? `<tr><td style="padding:8px 20px;font-size:14px;color:#64748b;border-bottom:1px solid #f1f5f9;">Instansi</td><td style="padding:8px 20px;font-size:14px;font-weight:600;border-bottom:1px solid #f1f5f9;">${reg.company}</td></tr>` : ""}
                <tr><td style="padding:8px 20px;font-size:14px;color:#64748b;border-bottom:1px solid #f1f5f9;">Nomor Registrasi</td><td style="padding:8px 20px;font-size:14px;font-weight:600;font-family:monospace;border-bottom:1px solid #f1f5f9;">${regNumber}</td></tr>
                <tr><td style="padding:8px 20px;font-size:14px;color:#64748b;">Berlaku Sampai</td><td style="padding:8px 20px;font-size:14px;font-weight:600;">${expiryDate}</td></tr>
              </table>

              <p style="margin:16px 0;font-size:15px;text-align:justify;line-height:1.8;text-indent:40px;">
                Selama masa uji coba, Bapak/Ibu dapat mengakses seluruh fitur produk tanpa biaya. Tim teknis kami akan
                menghubungi via WhatsApp (<strong>${COMPANY.phone}</strong>) dalam 1×24 jam untuk melakukan setup akun
                dan membimbing penggunaan. Apabila terdapat pertanyaan, silakan hubungi kami melalui email atau WhatsApp.
              </p>

              <p style="margin:16px 0;font-size:15px;text-align:justify;line-height:1.8;text-indent:40px;">
                Demikian surat konfirmasi ini kami sampaikan. Atas kepercayaan Bapak/Ibu, kami mengucapkan terima kasih.
                Kami berharap kerja sama ini dapat memberikan manfaat bagi pengembangan usaha Bapak/Ibu.
              </p>

              <p style="margin:32px 0 8px;font-size:15px;">Hormat kami,</p>
              <p style="margin:0 0 4px;font-size:15px;color:#64748b;font-style:italic;">(Tanda tangan elektronik)</p>
              <p style="margin:48px 0 0;font-size:15px;font-weight:700;"><strong>Tim Pendaftaran</strong></p>
              <p style="margin:0;font-size:14px;color:#64748b;">${COMPANY.name}</p>
            </td>
          </tr>

          <!-- ════════ FOOTER ════════ -->
          <tr>
            <td style="background:#0f172a;padding:20px 40px;text-align:center;">
              <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#fff;font-family:Arial,sans-serif;">
                ${COMPANY.name}
              </p>
              <p style="margin:0 0 8px;font-size:11px;color:rgba(255,255,255,0.5);font-family:Arial,sans-serif;">
                ${COMPANY.address} • ${COMPANY.phone}
              </p>
              <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.4);line-height:1.6;font-family:Arial,sans-serif;">
                Email ini dikirim secara otomatis sebagai surat konfirmasi resmi pendaftaran.<br>
                Mohon jangan balas email ini. Untuk pertanyaan, hubungi ${COMPANY.sales}.<br>
                © ${new Date().getFullYear()} ${COMPANY.name}. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const mailOptions = {
    from: `"${COMPANY.name}" <${process.env.MAIL_FROM_ADDRESS || process.env.SMTP_USER || COMPANY.email}>`,
    to: reg.email,
    subject: `Surat Konfirmasi Pendaftaran Uji Coba — ${regNumber} — ${COMPANY.name}`,
    html,
    text: `Kepada Yth. ${fullName},\n\nDengan hormat, pendaftaran uji coba gratis Anda telah diterima dan disetujui.\nNomor Registrasi: ${regNumber}\nBerlaku sampai: ${expiryDate}\n\nTim kami akan menghubungi via WhatsApp dalam 1x24 jam.\n\nHormat kami,\nTim Pendaftaran\n${COMPANY.name}`,
  }

  const info = await transporter.sendMail(mailOptions)
  console.log(`📧 Trial email sent to ${reg.email}: ${info.messageId}`)
  return info
}

