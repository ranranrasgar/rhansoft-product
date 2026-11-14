/**
 * Client-side Traffic & Interaction Tracker
 * Mencatat kunjungan, views produk, dan interaksi tanpa mengganggu performa halaman.
 */

function getVisitorId(): string {
  try {
    let id = localStorage.getItem("rh_vid")
    if (!id) {
      id = "v_" + Math.random().toString(36).substring(2, 12) + Date.now().toString(36)
      localStorage.setItem("rh_vid", id)
    }
    return id
  } catch {
    return "anon_" + Math.random().toString(36).substring(2, 10)
  }
}

function getSessionId(): string {
  try {
    let sid = sessionStorage.getItem("rh_sid")
    if (!sid) {
      sid = "s_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
      sessionStorage.setItem("rh_sid", sid)
    }
    return sid
  } catch {
    return "session"
  }
}

export function sendTrackEvent({
  path = window.location.pathname,
  productId = null,
  action = "pageview",
  metadata = null,
}: {
  path?: string
  productId?: string | null
  action?:
    | "pageview"
    | "product_view"
    | "product_click"
    | "add_to_cart"
    | "checkout_start"
    | "order_start"
    | "order_paid"
    | "consultation_click"
    | string
  metadata?: any
}) {
  try {
    const payload = {
      path,
      productId,
      action,
      visitorId: getVisitorId(),
      sessionId: getSessionId(),
      referrer: document.referrer || "",
      metadata,
    }

    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", JSON.stringify(payload))
    } else {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {})
    }
  } catch {
    // Non-blocking
  }
}
