/**
 * Perhitungan total pesanan (satu sumber di server; nilai dari browser selalu diabaikan).
 * Ongkos kirim berasal dari pengaturan admin (lib/shippingSettings.mjs); bawaan 0. PPN hanya atas subtotal.
 * Rumus yang sama dipakai di tampilan checkout (src/pages/CheckoutPage.tsx): ubah keduanya bersamaan.
 */
const VAT_RATE = 0.11

export function calculateOrderTotals(subtotal, shipping = 0) {
  const tax = Math.round(subtotal * VAT_RATE)
  return { subtotal, shipping, tax, total: subtotal + shipping + tax }
}
