import { test } from "node:test"
import assert from "node:assert/strict"
import { integrationStatus } from "../lib/integrationStatus.mjs"

const full = {
  MIDTRANS_ENV: "production",
  MIDTRANS_PRODUCTION_SERVER_KEY: "Mid-server-RAHASIA",
  MIDTRANS_PRODUCTION_CLIENT_KEY: "Mid-client-RAHASIA",
  MAIL_HOST: "smtp.example.com",
  MAIL_PORT: "465",
  MAIL_USERNAME: "toko@example.com",
  MAIL_PASSWORD: "sandi-RAHASIA",
  R2_ACCOUNT_ID: "akun-RAHASIA",
  R2_BUCKET_NAME: "rhansoft-product",
  R2_ACCESS_KEY_ID: "kunci-RAHASIA",
  R2_SECRET_ACCESS_KEY: "rahasia-RAHASIA",
  R2_PUBLIC_URL: "https://cdn.example.com",
}

test("semua terisi: Midtrans production aktif, email dan R2 terkonfigurasi", () => {
  const s = integrationStatus(full)
  assert.deepEqual(s.midtrans, { configured: true, environment: "production" })
  assert.deepEqual(s.email, { configured: true, host: "smtp.example.com", port: 465, sender: "toko@example.com" })
  assert.deepEqual(s.storage, { configured: true, bucket: "rhansoft-product" })
})

test("tidak pernah membocorkan kunci atau sandi", () => {
  const json = JSON.stringify(integrationStatus(full))
  assert.doesNotMatch(json, /RAHASIA/)
})

test("sandbox memakai kunci sandbox; kunci production tidak dihitung", () => {
  const s = integrationStatus({ ...full, MIDTRANS_ENV: "sandbox" })
  assert.deepEqual(s.midtrans, { configured: false, environment: "sandbox" })
  const ok = integrationStatus({ MIDTRANS_ENV: "", MIDTRANS_SANDBOX_SERVER_KEY: "a", MIDTRANS_SANDBOX_CLIENT_KEY: "b" })
  assert.deepEqual(ok.midtrans, { configured: true, environment: "sandbox" })
})

test("kosong: semuanya belum dikonfigurasi, email memakai fallback SMTP_*", () => {
  const s = integrationStatus({})
  assert.equal(s.midtrans.configured, false)
  assert.equal(s.email.configured, false)
  assert.equal(s.storage.configured, false)
  const smtp = integrationStatus({ SMTP_HOST: "smtp.gmail.com", SMTP_USER: "a@b.c", SMTP_PASS: "x" })
  assert.deepEqual(smtp.email, { configured: true, host: "smtp.gmail.com", port: 587, sender: "a@b.c" })
})

test("R2 tanpa salah satu kunci dianggap belum dikonfigurasi", () => {
  const { R2_SECRET_ACCESS_KEY, ...partial } = full
  void R2_SECRET_ACCESS_KEY
  assert.equal(integrationStatus(partial).storage.configured, false)
})
