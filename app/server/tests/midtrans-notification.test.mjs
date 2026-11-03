import { test } from "node:test"
import assert from "node:assert/strict"
import midtransClient from "midtrans-client"
import { applyAppendNotification, parseNotificationUrls } from "../lib/midtransNotification.mjs"

/** Snap sungguhan dengan jaringan diganti penangkap: mengembalikan header yang dikirim per permintaan. */
function snapWithCapture() {
  const snap = new midtransClient.Snap({ isProduction: false, serverKey: "SB-Mid-server-TEST", clientKey: "SB-Mid-client-TEST" })
  const sent = []
  snap.httpClient.http_client.defaults.adapter = async (config) => {
    const h = config.headers
    sent.push({
      method: String(config.method).toLowerCase(),
      url: config.url,
      header: (typeof h.get === "function" ? h.get("X-Append-Notification") : h["X-Append-Notification"]) ?? null,
    })
    return { data: { token: "t", redirect_url: "u", transaction_status: "pending" }, status: 200, statusText: "OK", headers: {}, config }
  }
  return { snap, sent }
}

test("parseNotificationUrls: satu atau beberapa alamat http(s), maksimal tiga, yang tidak sah dibuang", () => {
  assert.deepEqual(parseNotificationUrls("https://app.rhantech.com/api/webhook"), ["https://app.rhantech.com/api/webhook"])
  assert.deepEqual(parseNotificationUrls(" https://a.test/x , https://b.test/y "), ["https://a.test/x", "https://b.test/y"])
  assert.deepEqual(parseNotificationUrls("ftp://a.test, javascript:alert(1), https://ok.test/z"), ["https://ok.test/z"])
  assert.deepEqual(parseNotificationUrls("https://1.test,https://2.test,https://3.test,https://4.test"), [
    "https://1.test",
    "https://2.test",
    "https://3.test",
  ])
  assert.deepEqual(parseNotificationUrls(""), [])
  assert.deepEqual(parseNotificationUrls(undefined), [])
})

test("header hanya ikut pada pembuatan transaksi Snap, tidak pada cek status", async () => {
  const { snap, sent } = snapWithCapture()
  assert.equal(applyAppendNotification(snap, "https://app.rhantech.com/api/webhook"), true)

  await snap.createTransaction({ transaction_details: { order_id: "X-1", gross_amount: 1000 } })
  await snap.transaction.status("X-1")

  const create = sent.find((r) => r.method === "post")
  const status = sent.find((r) => r.method === "get")
  assert.equal(create.header, "https://app.rhantech.com/api/webhook")
  assert.equal(status.header, null)
})

test("beberapa alamat dikirim dipisah koma", async () => {
  const { snap, sent } = snapWithCapture()
  applyAppendNotification(snap, "https://a.test/x,https://b.test/y")
  await snap.createTransaction({})
  assert.equal(sent.find((r) => r.method === "post").header, "https://a.test/x,https://b.test/y")
})

test("tanpa alamat atau alamat tidak sah: tidak ada header dan mengembalikan false", async () => {
  for (const value of [undefined, "", "bukan-url", "ftp://x.test"]) {
    const { snap, sent } = snapWithCapture()
    assert.equal(applyAppendNotification(snap, value), false)
    await snap.createTransaction({})
    assert.equal(sent.find((r) => r.method === "post").header, null, String(value))
  }
})
