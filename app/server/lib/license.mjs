/**
 * Validasi permintaan nomor registrasi lisensi + pembatas laju sederhana.
 * Tidak ada perhitungan nomor registrasi di sini: nomor dibuat admin di luar sistem.
 */

const LICENSE_CODE_RE = /^[A-Z0-9-]{8,80}$/
const REGISTRATION_RE = /^[A-Z0-9-]{4,120}$/

/** Huruf besar, semua spasi/baris baru dibuang. Bukan string menjadi "". */
export function normalizeLicenseCode(input) {
  if (typeof input !== "string") return ""
  return input.replace(/\s+/g, "").toUpperCase()
}

/** null bila sah, selain itu pesan kesalahan (kode sudah dinormalisasi). */
export function validateLicenseCode(code) {
  if (typeof code !== "string" || code.length < 8) return "Kode lisensi terlalu pendek (minimal 8 karakter)"
  if (code.length > 80) return "Kode lisensi terlalu panjang (maksimal 80 karakter)"
  if (!LICENSE_CODE_RE.test(code)) return "Kode lisensi hanya boleh berisi huruf, angka, dan tanda hubung"
  return null
}

/** { value } bila sah (huruf besar, tanpa spasi di ujung), selain itu { error }. */
export function validateRegistrationNumber(input) {
  if (typeof input !== "string") return { error: "Nomor registrasi wajib diisi" }
  const value = input.trim().toUpperCase()
  if (!REGISTRATION_RE.test(value)) {
    return { error: "Nomor registrasi 4-120 karakter, hanya huruf, angka, dan tanda hubung" }
  }
  return { value }
}

/** Mengembalikan fungsi (kunci) => boolean; true bila masih dalam batas. Disimpan di memori. */
export function createRateLimiter(limit, windowMs) {
  const hits = new Map()
  return (key) => {
    const now = Date.now()
    const recent = (hits.get(key) || []).filter((t) => now - t < windowMs)
    if (recent.length >= limit) {
      hits.set(key, recent)
      return false
    }
    recent.push(now)
    hits.set(key, recent)
    return true
  }
}
