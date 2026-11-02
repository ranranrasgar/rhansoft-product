/**
 * Environment constants — centralized so they’re easy to check and reuse.
 */
export const API_BASE =
  typeof window !== "undefined" &&
  window.location.hostname !== "localhost" &&
  window.location.hostname !== "127.0.0.1"
    ? ""
    : (import.meta.env.VITE_API_BASE as string) || "http://localhost:3001"

export const GOOGLE_CLIENT_ID =
  (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) ||
  "456401864985-if66ro8vpmfoc4sat2d1nvnrt7vca73c.apps.googleusercontent.com"

export const GOOGLE_CONFIGURED = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID.includes(".apps.googleusercontent.com"))
