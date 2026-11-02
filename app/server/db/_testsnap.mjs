import midtransClient from "midtrans-client"

const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: "SB-Mid-server-Z8f-7xh9csvMH3lbMrKyNkgx",
  clientKey: "SB-Mid-client-9UxxhPZV5Wxceplx",
})

const param = {
  transaction_details: {
    order_id: "TEST-" + Date.now(),
    gross_amount: 1942500,
  },
  customer_details: {
    first_name: "Ranran",
    last_name: "Test",
    email: "ranran250880@gmail.com",
    phone: "081333335871",
    shipping_address: {
      first_name: "Ranran",
      last_name: "Test",
      address: "Jl Gn Hadari Asri No 09",
      city: "KOTA BANDUNG",
      postal_code: "40195",
      country_code: "IDN",
      phone: "081333335871",
    },
  },
  item_details: [
    {
      id: "web-tabungan-siswa",
      name: "Tabungan Siswa Online",
      price: 1750000,
      quantity: 1,
      brand: "Rhansoft",
      category: "Web Based",
    },
    { id: "TAX", name: "PPN 11%", price: 192500, quantity: 1, brand: "Rhansoft", category: "Tax" },
  ],
  enabled_payments: process.argv[2] ? JSON.parse(process.argv[2]) : undefined,
}

try {
  const tx = await snap.createTransaction(param)
  console.log("TOKEN", tx.token)
  console.log("URL", tx.redirect_url)
} catch (e) {
  console.error("ERR", e.message)
  if (e.ApiResponse) console.error("API_RESP", JSON.stringify(e.ApiResponse, null, 2))
}
