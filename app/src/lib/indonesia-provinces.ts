/**
 * Titik tengah perkiraan tiap provinsi, untuk memetakan sebaran pendaftar
 * dari kolom Provinsi/Kota yang mereka isi sendiri (tanpa GPS).
 */
export type Province = { name: string; lat: number; lng: number; aliases?: string[] }

export const PROVINCES: Province[] = [
  { name: "Aceh", lat: 4.7, lng: 96.75, aliases: ["nanggroe aceh darussalam", "nad"] },
  { name: "Sumatera Utara", lat: 2.11, lng: 99.54, aliases: ["sumut", "medan"] },
  { name: "Sumatera Barat", lat: -0.74, lng: 100.8, aliases: ["sumbar", "padang"] },
  { name: "Riau", lat: 0.29, lng: 101.71, aliases: ["pekanbaru"] },
  { name: "Kepulauan Riau", lat: 3.95, lng: 108.14, aliases: ["kepri", "batam"] },
  { name: "Jambi", lat: -1.61, lng: 103.61 },
  { name: "Sumatera Selatan", lat: -3.32, lng: 104.91, aliases: ["sumsel", "palembang"] },
  { name: "Kepulauan Bangka Belitung", lat: -2.74, lng: 106.44, aliases: ["bangka belitung", "babel"] },
  { name: "Bengkulu", lat: -3.8, lng: 102.26 },
  { name: "Lampung", lat: -4.56, lng: 105.41 },
  { name: "DKI Jakarta", lat: -6.21, lng: 106.85, aliases: ["jakarta", "dki"] },
  { name: "Banten", lat: -6.41, lng: 106.06, aliases: ["tangerang", "serang"] },
  { name: "Jawa Barat", lat: -6.91, lng: 107.61, aliases: ["jabar", "bandung", "bekasi", "bogor", "depok"] },
  { name: "Jawa Tengah", lat: -7.15, lng: 110.14, aliases: ["jateng", "semarang"] },
  { name: "DI Yogyakarta", lat: -7.8, lng: 110.37, aliases: ["yogyakarta", "jogja", "diy"] },
  { name: "Jawa Timur", lat: -7.54, lng: 112.24, aliases: ["jatim", "surabaya", "malang"] },
  { name: "Bali", lat: -8.34, lng: 115.09, aliases: ["denpasar"] },
  { name: "Nusa Tenggara Barat", lat: -8.65, lng: 117.36, aliases: ["ntb", "mataram"] },
  { name: "Nusa Tenggara Timur", lat: -8.66, lng: 121.08, aliases: ["ntt", "kupang"] },
  { name: "Kalimantan Barat", lat: -0.28, lng: 111.47, aliases: ["kalbar", "pontianak"] },
  { name: "Kalimantan Tengah", lat: -1.68, lng: 113.38, aliases: ["kalteng", "palangka raya"] },
  { name: "Kalimantan Selatan", lat: -3.09, lng: 115.28, aliases: ["kalsel", "banjarmasin"] },
  { name: "Kalimantan Timur", lat: 0.54, lng: 116.42, aliases: ["kaltim", "samarinda", "balikpapan"] },
  { name: "Kalimantan Utara", lat: 3.07, lng: 116.04, aliases: ["kaltara"] },
  { name: "Sulawesi Utara", lat: 0.62, lng: 123.98, aliases: ["sulut", "manado"] },
  { name: "Gorontalo", lat: 0.7, lng: 122.45 },
  { name: "Sulawesi Tengah", lat: -1.43, lng: 121.45, aliases: ["sulteng", "palu"] },
  { name: "Sulawesi Barat", lat: -2.84, lng: 119.23, aliases: ["sulbar", "mamuju"] },
  { name: "Sulawesi Selatan", lat: -3.67, lng: 119.97, aliases: ["sulsel", "makassar"] },
  { name: "Sulawesi Tenggara", lat: -4.14, lng: 122.17, aliases: ["sultra", "kendari"] },
  { name: "Maluku", lat: -3.24, lng: 130.14, aliases: ["ambon"] },
  { name: "Maluku Utara", lat: 1.57, lng: 127.81, aliases: ["malut", "ternate"] },
  { name: "Papua", lat: -4.27, lng: 138.08, aliases: ["jayapura"] },
  { name: "Papua Barat", lat: -1.34, lng: 133.17, aliases: ["manokwari"] },
  { name: "Papua Barat Daya", lat: -1.0, lng: 131.5, aliases: ["sorong"] },
  { name: "Papua Selatan", lat: -7.5, lng: 139.5, aliases: ["merauke"] },
  { name: "Papua Tengah", lat: -3.9, lng: 136.5, aliases: ["nabire"] },
  { name: "Papua Pegunungan", lat: -4.1, lng: 139.0, aliases: ["wamena"] },
]

const clean = (s: string) =>
  s
    .toLowerCase()
    .replace(/\b(provinsi|prov\.?|kota|kabupaten|kab\.?|daerah|khusus|ibukota|istimewa)\b/g, " ")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

/** Cocokkan teks provinsi (lalu kota) yang diketik pendaftar ke provinsi baku. */
export function matchProvince(province?: string | null, city?: string | null): Province | null {
  for (const raw of [province, city]) {
    if (!raw) continue
    const text = clean(raw)
    if (!text) continue
    // nama baku lebih diutamakan daripada alias; yang lebih panjang menang (mis. "papua barat daya")
    const byName = PROVINCES.filter((p) => text === clean(p.name) || text.includes(clean(p.name)))
    if (byName.length) return byName.sort((a, b) => b.name.length - a.name.length)[0]
    const byAlias = PROVINCES.find((p) => p.aliases?.some((a) => text === a || text.includes(a)))
    if (byAlias) return byAlias
  }
  return null
}

/** Rapikan nama kota untuk peringkat: huruf awal besar, tanpa awalan Kota/Kab. */
export function normalizeCity(city?: string | null): string {
  const text = clean(city || "")
  if (!text) return ""
  return text.replace(/\b\w/g, (c) => c.toUpperCase())
}
