/**
 * Daftar 38 provinsi baku (salinan nama dari src/lib/indonesia-provinces.ts; tes memastikan keduanya sama).
 * Dipakai untuk tarif ongkos kirim per provinsi.
 */
export const PROVINCE_NAMES = [
  "Aceh",
  "Sumatera Utara",
  "Sumatera Barat",
  "Riau",
  "Kepulauan Riau",
  "Jambi",
  "Sumatera Selatan",
  "Kepulauan Bangka Belitung",
  "Bengkulu",
  "Lampung",
  "DKI Jakarta",
  "Banten",
  "Jawa Barat",
  "Jawa Tengah",
  "DI Yogyakarta",
  "Jawa Timur",
  "Bali",
  "Nusa Tenggara Barat",
  "Nusa Tenggara Timur",
  "Kalimantan Barat",
  "Kalimantan Tengah",
  "Kalimantan Selatan",
  "Kalimantan Timur",
  "Kalimantan Utara",
  "Sulawesi Utara",
  "Gorontalo",
  "Sulawesi Tengah",
  "Sulawesi Barat",
  "Sulawesi Selatan",
  "Sulawesi Tenggara",
  "Maluku",
  "Maluku Utara",
  "Papua",
  "Papua Barat",
  "Papua Barat Daya",
  "Papua Selatan",
  "Papua Tengah",
  "Papua Pegunungan",
]

const byKey = new Map(PROVINCE_NAMES.map((n) => [n.toLowerCase(), n]))

/** Nama provinsi baku dari teks (tidak peka huruf, spasi di ujung diabaikan); selain daftar baku null. */
export function findProvince(text) {
  if (typeof text !== "string") return null
  return byKey.get(text.trim().replace(/\s+/g, " ").toLowerCase()) ?? null
}
