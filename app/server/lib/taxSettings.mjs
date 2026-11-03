/**
 * Pengaturan pajak (PPN) yang diubah admin di Pengaturan Sistem, dan perhitungannya. Tanpa DB/Express.
 * Bawaan aktif 11% (perilaku sebelum pengaturan ini ada). Pajak dihitung atas subtotal saja.
 */
const MAX_LABEL = 20

export const DEFAULT_TAX = Object.freeze({ enabled: true, rate: 11, label: "PPN" })

/** { value } berisi pengaturan lengkap yang sah, atau { error } berbahasa Indonesia. */
export function normalizeTaxSettings(input) {
  const src = input && typeof input === "object" && !Array.isArray(input) ? input : {}

  const rate = typeof src.rate === "string" && src.rate.trim() !== "" ? Number(src.rate) : src.rate
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate < 0 || rate > 100) {
    return { error: "Tarif pajak harus angka 0 sampai 100" }
  }
  if (Math.round(rate * 100) !== rate * 100) return { error: "Tarif pajak maksimal 2 angka di belakang koma" }

  let label = DEFAULT_TAX.label
  if (src.label !== undefined) {
    if (typeof src.label !== "string") return { error: "Label harus berupa teks" }
    const trimmed = src.label.trim()
    if (trimmed.length > MAX_LABEL) return { error: `Label maksimal ${MAX_LABEL} karakter` }
    label = trimmed || DEFAULT_TAX.label
  }

  return { value: { enabled: src.enabled === true, rate, label } }
}

/** Pajak dalam Rupiah (dibulatkan); 0 bila nonaktif atau tarif 0. */
export function taxAmount(subtotal, tax = DEFAULT_TAX) {
  if (!tax.enabled || !tax.rate) return 0
  return Math.round((subtotal * tax.rate) / 100)
}
