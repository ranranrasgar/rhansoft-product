/**
 * Pengaturan ongkos kirim (diubah admin di Pengaturan Sistem) dan perhitungannya. Tanpa DB/Express.
 * Mode "flat": satu nominal untuk semua pesanan. Mode "province": tarif per provinsi, sisanya tarif standar.
 */
import { findProvince } from "./provinces.mjs"

const MAX_AMOUNT = 10_000_000
const MAX_LABEL = 40

export const DEFAULT_SHIPPING = Object.freeze({
  enabled: false,
  mode: "flat",
  label: "Ongkos Kirim",
  flat_amount: 0,
  default_amount: 0,
  province_rates: Object.freeze({}),
})

const isAmount = (v) => Number.isInteger(v) && v >= 0 && v <= MAX_AMOUNT
const amountError = (field) => `${field} harus bilangan bulat Rupiah 0 sampai 10.000.000`

/** { value } berisi pengaturan lengkap yang sah, atau { error } berbahasa Indonesia. */
export function normalizeShippingSettings(input) {
  const src = input && typeof input === "object" && !Array.isArray(input) ? input : {}
  const value = { ...DEFAULT_SHIPPING, province_rates: {} }

  value.enabled = src.enabled === true

  if (src.mode !== undefined) {
    if (src.mode !== "flat" && src.mode !== "province") return { error: "Mode ongkos kirim tidak dikenal" }
    value.mode = src.mode
  }

  if (src.label !== undefined) {
    if (typeof src.label !== "string") return { error: "Label harus berupa teks" }
    const label = src.label.trim()
    if (label.length > MAX_LABEL) return { error: `Label maksimal ${MAX_LABEL} karakter` }
    value.label = label || DEFAULT_SHIPPING.label
  }

  for (const [field, name] of [
    ["flat_amount", "Biaya tetap"],
    ["default_amount", "Tarif standar"],
  ]) {
    if (src[field] === undefined) continue
    if (!isAmount(src[field])) return { error: amountError(name) }
    value[field] = src[field]
  }

  if (src.province_rates !== undefined) {
    const rates = src.province_rates
    if (!rates || typeof rates !== "object" || Array.isArray(rates)) return { error: "Tarif provinsi tidak valid" }
    for (const [key, amount] of Object.entries(rates)) {
      const province = findProvince(key)
      if (!province || amount === null || amount === "" || amount === undefined) continue
      if (!isAmount(amount)) return { error: amountError(`Tarif ${province}`) }
      value.province_rates[province] = amount
    }
  }

  return { value }
}

/** Ongkir untuk satu pesanan: { amount, label }, atau { error } bila mode provinsi tanpa provinsi yang sah. */
export function calculateShipping(settings, province) {
  const label = settings.label || DEFAULT_SHIPPING.label
  if (!settings.enabled) return { amount: 0, label }
  if (settings.mode === "flat") return { amount: settings.flat_amount, label }

  const name = findProvince(province)
  if (!name) return { error: "Mohon pilih provinsi pengiriman" }
  return { amount: settings.province_rates[name] ?? settings.default_amount, label }
}
