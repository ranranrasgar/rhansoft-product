/**
 * Perhitungan total pesanan (satu sumber di server; nilai dari browser selalu diabaikan).
 * Ongkos kirim dan pajak berasal dari pengaturan admin (lib/shippingSettings.mjs, lib/taxSettings.mjs).
 * Ongkir bawaan 0; pajak bawaan PPN 11% dan hanya atas subtotal.
 * Rumus yang sama dipakai di tampilan checkout (src/pages/CheckoutPage.tsx): ubah keduanya bersamaan.
 */
import { calculateShipping } from "./shippingSettings.mjs"
import { DEFAULT_TAX, taxAmount } from "./taxSettings.mjs"

export function calculateOrderTotals(subtotal, shipping = 0, taxSettings = DEFAULT_TAX) {
  const tax = taxAmount(subtotal, taxSettings)
  return { subtotal, shipping, tax, total: subtotal + shipping + tax }
}

/**
 * Harga lengkap satu pesanan dari item (harga database), pengaturan ongkir, provinsi, dan pengaturan pajak:
 * total + item_details Midtrans (jumlahnya selalu sama dengan total). { error } bila provinsi wajib tapi tidak sah.
 */
export function priceOrder({ items, settings, province, tax = DEFAULT_TAX }) {
  const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0)
  const ship = calculateShipping(settings, province)
  if ("error" in ship) return { error: ship.error }
  const totals = calculateOrderTotals(subtotal, ship.amount, tax)
  const itemDetails = [
    ...items.map((it) => ({
      id: it.id,
      name: it.name.length > 50 ? it.name.substring(0, 50) : it.name,
      price: it.price,
      quantity: it.quantity,
      brand: it.brand,
      category: it.category,
    })),
    ...(totals.shipping > 0
      ? [{ id: "SHIPPING", name: ship.label.slice(0, 50), price: totals.shipping, quantity: 1, brand: "Rhansoft", category: "Shipping" }]
      : []),
    ...(totals.tax > 0
      ? [{ id: "TAX", name: `${tax.label} ${tax.rate}%`.slice(0, 50), price: totals.tax, quantity: 1, brand: "Rhansoft", category: "Tax" }]
      : []),
  ]
  return { ...totals, shippingLabel: ship.label, itemDetails }
}

/** Nominal dari Midtrans berupa teks "4440.00"; kolom rupiah di database BIGINT. null bila bukan angka. */
export function midtransAmount(value) {
  if (value === undefined || value === null || value === "") return null
  const n = Number(value)
  return Number.isFinite(n) ? Math.round(n) : null
}

/** Total yang dilihat pelanggan harus sama dengan hitungan server; null bila cocok atau klien tidak mengirim total. */
export function checkClientTotal(clientGross, serverTotal) {
  if (clientGross === undefined || clientGross === null) return null
  if (Number(clientGross) === serverTotal) return null
  return { error: "Total pesanan berubah (harga atau ongkos kirim diperbarui). Silakan periksa kembali.", total: serverTotal }
}
