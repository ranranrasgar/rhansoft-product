/**
 * Perhitungan total pesanan (satu sumber di server; nilai dari browser selalu diabaikan).
 * Produk berupa software yang dikirim lewat unduhan dan lisensi, jadi tidak ada ongkos kirim.
 * Rumus yang sama dipakai di tampilan checkout (src/pages/CheckoutPage.tsx): ubah keduanya bersamaan.
 */
const VAT_RATE = 0.11

export function calculateOrderTotals(subtotal) {
  const shipping = 0
  const tax = Math.round(subtotal * VAT_RATE)
  return { subtotal, shipping, tax, total: subtotal + shipping + tax }
}
