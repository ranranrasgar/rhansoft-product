import "dotenv/config"
import { test } from "node:test"
import assert from "node:assert/strict"
import { notifyAdminLicenseRequest } from "../lib/email.mjs"

test("notifyAdminLicenseRequest: tanpa LICENSE_NOTIFY_EMAIL tidak berbuat apa-apa dan tidak error", async () => {
  const saved = process.env.LICENSE_NOTIFY_EMAIL
  delete process.env.LICENSE_NOTIFY_EMAIL
  try {
    const result = await notifyAdminLicenseRequest({ customerName: "Tes", productName: "Produk", orderId: "LICTEST-1" })
    assert.equal(result, undefined)
  } finally {
    if (saved !== undefined) process.env.LICENSE_NOTIFY_EMAIL = saved
  }
})
