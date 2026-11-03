/**
 * Perhitungan total pesanan (satu sumber di server; nilai dari browser selalu diabaikan).
 * Ongkos kirim berasal dari pengaturan admin (lib/shippingSettings.mjs); bawaan 0. PPN hanya atas subtotal.
 * Rumus yang sama dipakai di tampilan checkout (src/pages/CheckoutPage.tsx): ubah keduanya bersamaan.
 */
import { calculateShipping } from "./shippingSettings.mjs"

const VAT_RATE = 0.11

export function calculateOrderTotals(subtotal, shipping = 0) {
  const tax = Math.round(subtotal * VAT_RATE)
  return { subtotal, shipping, tax, total: subtotal + shipping + tax }
}

/**
 * Harga lengkap satu pesanan dari item (harga database), pengaturan ongkir, dan provinsi:
 * total + item_details Midtrans (jumlahnya selalu sama dengan total). { error } bila provinsi wajib tapi tidak sah.
 */
export function priceOrder({ items, settings, province }) {
  const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0)
  const ship = calculateShipping(settings, province)
  if ("error" in ship) return { error: ship.error }
  const totals = calculateOrderTotals(subtotal, ship.amount)
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
      ? [{ id: "TAX", name: "PPN 11%", price: totals.tax, quantity: 1, brand: "Rhansoft", category: "Tax" }]
      : []),
  ]
  return { ...totals, shippingLabel: ship.label, itemDetails }
}

/** Total yang dilihat pelanggan harus sama dengan hitungan server; null bila cocok atau klien tidak mengirim total. */
export function checkClientTotal(clientGross, serverTotal) {
  if (clientGross === undefined || clientGross === null) return null
  if (Number(clientGross) === serverTotal) return null
  return { error: "Total pesanan berubah (harga atau ongkos kirim diperbarui). Silakan periksa kembali.", total: serverTotal }
}
