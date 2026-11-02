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
// Sandbox (untuk local dev) — gunakan ini selama development
const MIDTRANS_MERCHANT_ID = "G627599304"
const MIDTRANS_SANDBOX_CLIENT_KEY = "SB-Mid-client-9UxxhPZV5Wxceplx"
const MIDTRANS_SANDBOX_SERVER_KEY = "SB-Mid-server-Z8f-7xh9csvMH3lbMrKyNkgx"
// Production keys (aktifkan ketika sudah deploy ke production)
const MIDTRANS_PRODUCTION_CLIENT_KEY = "Mid-client-evts-akuwPi7AsYI"
const MIDTRANS_PRODUCTION_SERVER_KEY = "Mid-server-i3TKwN3jE734174JkLkzwSLG"

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
const SNAP_URL = isProduction ? SNAP_PRODUCTION_URL : SNAP_SANDBOX_URL

let snapLoaded = false
let snapLoading: Promise<void> | null = null

export function loadSnapScript(): Promise<void> {
  if (snapLoaded && window.snap) return Promise.resolve()
  if (snapLoading) return snapLoading

  snapLoading = new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${SNAP_URL}"]`)) {
      snapLoaded = true
      resolve()
      return
    }

    const script = document.createElement("script")
    script.src = SNAP_URL
    script.async = true
    script.setAttribute("data-client-key", MIDTRANS_CONFIG.clientKey)

    script.onload = () => {
      snapLoaded = true
      resolve()
    }

    script.onerror = () => {
      reject(new Error("Failed to load Midtrans Snap.js. Check your network connection."))
    }

    document.head.appendChild(script)
  })

  return snapLoading
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
): Promise<{ token: string; redirect_url: string }> {
  const res = await fetch("/api/create-transaction", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
export async function payWithSnap(token: string): Promise<PayResult> {
  await loadSnapScript()

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
