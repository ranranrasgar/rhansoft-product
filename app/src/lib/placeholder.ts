/**
 * Generates an inline SVG data URI as a placeholder image.
 * Avoids external network dependencies (Unsplash etc.) that can fail
 * to load in restricted environments / WebViews.
 */

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

const palettes: Record<string, [string, string]> = {
  Smartphones: ["#7c3aed", "#a78bfa"],
  Laptops: ["#0f172a", "#475569"],
  Audio: ["#0ea5e9", "#38bdf8"],
  Wearables: ["#10b981", "#34d399"],
  "Smart Home": ["#8b5cf6", "#c4b5fd"],
  Gaming: ["#ef4444", "#f87171"],
  hero1: ["#7c3aed", "#1e1b4b"],
  hero2: ["#0f172a", "#334155"],
  hero3: ["#0ea5e9", "#0c4a6e"],
  promo1: ["#6366f1", "#a5b4fc"],
  promo2: ["#18181b", "#3f3f46"],
  default: ["#64748b", "#94a3b8"],
}

export function placeholderImage(
  label: string,
  variant: string = "default",
  width = 800,
  height = 600
): string {
  const [c1, c2] = palettes[variant] ?? palettes.default
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="40%" r="50%">
      <stop offset="0%" stop-color="white" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="white" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect width="${width}" height="${height}" fill="url(#glow)"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
    font-family="-apple-system, system-ui, sans-serif" font-size="${Math.min(width, height) / 14}"
    font-weight="600" fill="white" fill-opacity="0.9">${escapeXml(label)}</text>
</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}
