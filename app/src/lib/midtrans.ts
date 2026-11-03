import { authHeaders } from "@/lib/auth"
/**
 * Midtrans Snap.js integration helper.
 *
 * In production, you call your backend API to get a Snap Token,
 * then snap.pay(token) opens the Midtrans payment UI.
 *
 * For this demo we:
 * 1. Load the Snap.js sandbox script
 * 2. Simulate a token request (replace with real API call to your backend)
 * 3. Call snap.pay() with the token
 *
 * REAL BACKEND CALL (when you deploy):
 *   POST /api/create-transaction
 *   Body: { order_id, gross_amount, customer_details, item_details }
 *   Response: { token, redirect_url }
 *
 * Server-side (Node.js) uses:
 *   const snap = new midtransClient.Snap({
 *     isProduction: false,
 *     serverKey: process.env.MIDTRANS_SERVER_KEY,
 *     clientKey: process.env.MIDTRANS_CLIENT_KEY,
 *   })
 *   const transaction = await snap.createTransaction(parameter)
 *   // transaction.token -> send to frontend
 */

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options?: {
          onSuccess?: (result: unknown) => void
          onPending?: (result: unknown) => void
          onError?: (result: unknown) => void
          onClose?: () => void
        }
      ) => void
    }
  }
}

// ── Midtrans Configuration ──────────────────────────────────────
// Sandbox (untuk local dev) — baca dari env, fallback ke sandbox keys
const MIDTRANS_MERCHANT_ID = import.meta.env.VITE_MIDTRANS_MERCHANT_ID || "G627599304"
const MIDTRANS_SANDBOX_CLIENT_KEY = import.meta.env.VITE_MIDTRANS_SANDBOX_CLIENT_KEY || "SB-Mid-client-9UxxhPZV5Wxceplx"
const MIDTRANS_SANDBOX_SERVER_KEY = import.meta.env.VITE_MIDTRANS_SANDBOX_SERVER_KEY || ""
// Production keys (aktifkan ketika sudah deploy ke production)
const MIDTRANS_PRODUCTION_CLIENT_KEY = import.meta.env.VITE_MIDTRANS_PRODUCTION_CLIENT_KEY || "Mid-client-evts-akuwPi7AsYI"
const MIDTRANS_PRODUCTION_SERVER_KEY = import.meta.env.VITE_MIDTRANS_PRODUCTION_SERVER_KEY || ""

// Deteksi environment: gunakan sandbox jika di local, production jika di deploy
const isProduction =
  typeof window !== "undefined" &&
  window.location.hostname !== "localhost" &&
  window.location.hostname !== "127.0.0.1" &&
  !window.location.hostname.includes("preview")

export const MIDTRANS_CONFIG = {
  merchantId: MIDTRANS_MERCHANT_ID,
  isProduction,
  clientKey: isProduction ? MIDTRANS_PRODUCTION_CLIENT_KEY : MIDTRANS_SANDBOX_CLIENT_KEY,
  serverKey: isProduction ? MIDTRANS_PRODUCTION_SERVER_KEY : MIDTRANS_SANDBOX_SERVER_KEY,
}

const SNAP_SANDBOX_URL = "https://app.sandbox.midtrans.com/snap/snap.js"
const SNAP_PRODUCTION_URL = "https://app.midtrans.com/snap/snap.js"
export async function loadSnapScript(snapUrl?: string, clientKey?: string): Promise<void> {
  let url = snapUrl
  let key = clientKey

  if (!url || !key) {
    try {
      const res = await fetch("/api/midtrans-config")
      if (res.ok) {
        const conf = await res.json()
        url = url || conf.snapUrl
        key = key || conf.clientKey
      }
    } catch {
      // fallback
    }
  }

  url = url || (isProduction ? SNAP_PRODUCTION_URL : SNAP_SANDBOX_URL)
  key = key || (isProduction ? MIDTRANS_PRODUCTION_CLIENT_KEY : MIDTRANS_SANDBOX_CLIENT_KEY)

  if (document.querySelector(`script[src="${url}"]`) && window.snap) {
    return Promise.resolve()
  }

  const existing = document.querySelector('script[src*="midtrans.com/snap/snap.js"]')
  if (existing) {
    existing.remove()
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script")
    script.src = url!
    script.async = true
    if (key) {
      script.setAttribute("data-client-key", key)
    }

    script.onload = () => {
      resolve()
    }

    script.onerror = () => {
      reject(new Error("Failed to load Midtrans Snap.js. Check your network connection."))
    }

    document.head.appendChild(script)
  })
}

export type MidtransCustomer = {
  first_name: string
  last_name: string
  email: string
  phone: string
  shipping_address?: {
    first_name: string
    last_name: string
    address: string
    city: string
    postal_code: string
    country_code: string
    phone: string
  }
}

export type MidtransItem = {
  id: string
  name: string
  price: number
  quantity: number
  brand?: string
  category?: string
}

export type CreateTransactionParams = {
  order_id: string
  gross_amount: number
  customer: MidtransCustomer
  items: MidtransItem[]
  shipping_cost: number
  tax: number
}

/**
 * Requests a Snap token from your backend.
 *
 * Calls the backend API to get a real Snap token from Midtrans.
 */
export async function requestSnapToken(
  params: CreateTransactionParams & { payment_method?: string }
): Promise<{ token: string; redirect_url: string; snap_url?: string; client_key?: string }> {
  const res = await fetch("/api/create-transaction", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Network error" }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }

  const data = await res.json()
  return {
    token: data.token,
    redirect_url: data.redirect_url,
    snap_url: data.snap_url,
    client_key: data.client_key,
  }
}

export type PayResult = {
  status: "success" | "pending" | "error" | "closed"
  data?: unknown
}

/**
 * Opens the Midtrans Snap payment modal.
 * Returns a promise that resolves with the payment result.
 */
export async function payWithSnap(token: string, snapUrl?: string, clientKey?: string): Promise<PayResult> {
  await loadSnapScript(snapUrl, clientKey)

  if (!window.snap) {
    throw new Error("Midtrans Snap failed to initialize.")
  }

  return new Promise<PayResult>((resolve) => {
    window.snap!.pay(token, {
      onSuccess: (result) => resolve({ status: "success", data: result }),
      onPending: (result) => resolve({ status: "pending", data: result }),
      onError: (result) => resolve({ status: "error", data: result }),
      onClose: () => resolve({ status: "closed" }),
    })
  })
}
