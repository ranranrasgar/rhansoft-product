/**
 * Environment constants — centralized so they’re easy to check and reuse.
 */
export const API_BASE = (import.meta.env.VITE_API_BASE as string) || "http://localhost:3001"

export const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) || ""

export const GOOGLE_CONFIGURED = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID.includes(".apps.googleusercontent.com"))
