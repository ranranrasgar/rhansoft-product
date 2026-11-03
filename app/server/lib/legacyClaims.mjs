/**
 * Klaim pelanggan lama (beli lewat WA sebelum platform ada): validasi isian.
 * Persetujuan admin membuat pesanan LEGACY- Rp 0 agar alur lisensi biasa bisa dipakai.
 */
import { normalizeLicenseCode, validateLicenseCode } from "./license.mjs"

export const LEGACY_PREFIX = "LEGACY-"
export const MAX_COMPUTERS = 20

const text = (v) => (typeof v === "string" ? v.trim() : "")

export function isLegacyOrder(order) {
  return order?.payment_type === "legacy"
}

/** Jumlah komputer 1-20 (angka dalam teks diterima); null bila tidak sah. */
export function parseQuantity(input) {
  const n = Number(input)
  return Number.isInteger(n) && n >= 1 && n <= MAX_COMPUTERS ? n : null
}

/** { value } dengan isian yang sudah dinormalisasi, atau { error }. */
export function validateClaim(body = {}) {
  const product_id = text(body.product_id) || null
  const product_other = text(body.product_other) || null
  if (!product_id && !product_other) return { error: "Pilih produk atau isi nama aplikasi" }
  if (product_id && product_other) return { error: "Pilih produk dari daftar atau isi nama aplikasi, bukan keduanya" }
  if (product_other && (product_other.length < 3 || product_other.length > 100)) {
    return { error: "Nama aplikasi 3-100 karakter" }
  }

  const company = text(body.company)
  if (company.length < 2 || company.length > 100) return { error: "Nama toko/perusahaan 2-100 karakter" }

  const phone = text(body.phone).replace(/\D/g, "")
  if (phone.length < 10 || phone.length > 15) return { error: "Nomor WA 10-15 digit" }

  const quantity = parseQuantity(body.quantity)
  if (quantity === null) return { error: `Jumlah komputer 1-${MAX_COMPUTERS}` }

  if (!Array.isArray(body.license_codes) || body.license_codes.length === 0) {
    return { error: "Isi minimal satu kode lisensi" }
  }
  const license_codes = body.license_codes.map(normalizeLicenseCode)
  if (license_codes.length > quantity) return { error: "Jumlah kode lisensi melebihi jumlah komputer" }
  for (const code of license_codes) {
    const invalid = validateLicenseCode(code)
    if (invalid) return { error: invalid }
  }
  if (new Set(license_codes).size !== license_codes.length) return { error: "Ada kode lisensi yang sama" }

  const note = text(body.note) || null
  if (note && note.length > 500) return { error: "Catatan maksimal 500 karakter" }

  return { value: { product_id, product_other, company, phone, quantity, license_codes, note } }
}
