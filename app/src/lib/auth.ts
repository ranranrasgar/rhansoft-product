/**
 * Auth API client — register, login, Google OAuth
 */
import { googleLogout, type CredentialResponse } from "@react-oauth/google"

import { API_BASE } from "@/lib/env"

const AUTH_API_BASE = API_BASE

export type UserRole = "admin" | "user" | "editor"

export type AuthUser = {
  id: number
  first_name: string
  last_name: string
  email: string
  avatar_url: string | null
  role: UserRole
  is_active: boolean
}

const TOKEN_KEY = "rhansoft_token"

// ── Token management ──────────────────────────────────────────
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  try {
    googleLogout()
  } catch {
    // ignore
  }
}

// ── API calls ──────────────────────────────────────────────────
async function authRequest(path: string, body: Record<string, unknown>): Promise<{ user: AuthUser; token: string }> {
  const res = await fetch(`${AUTH_API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || `Error ${res.status}`)
  }
  return data
}

export async function register(data: {
  first_name: string
  last_name?: string
  email: string
  password: string
}): Promise<{ user: AuthUser; token: string }> {
  return authRequest("/api/auth/register", data)
}

export async function login(data: {
  email: string
  password: string
}): Promise<{ user: AuthUser; token: string }> {
  return authRequest("/api/auth/login", data)
}

export async function loginWithGoogle(credential: string): Promise<{ user: AuthUser; token: string }> {
  return authRequest("/api/auth/google", { credential })
}

export async function fetchCurrentUser(token: string): Promise<AuthUser> {
  const res = await fetch(`${AUTH_API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    throw new Error("Session expired")
  }
  const data = await res.json()
  return data.user
}

// ── Admin API ─────────────────────────────────────────────────
export type AdminUser = {
  id: number
  first_name: string
  last_name: string
  email: string
  avatar_url: string | null
  role: UserRole
  is_active: boolean
  last_login_at: string | null
  created_at: string
}

export async function fetchAdminUsers(token: string): Promise<AdminUser[]> {
  const res = await fetch(`${AUTH_API_BASE}/api/admin/users`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Failed to fetch users")
  return res.json()
}

export async function updateUserRole(
  token: string,
  userId: number,
  role: UserRole
): Promise<AdminUser> {
  const res = await fetch(`${AUTH_API_BASE}/api/admin/users/${userId}/role`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ role }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Failed to update role")
  return data
}

export async function updateUserStatus(
  token: string,
  userId: number,
  isActive: boolean
): Promise<AdminUser> {
  const res = await fetch(`${AUTH_API_BASE}/api/admin/users/${userId}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ is_active: isActive }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Failed to update status")
  return data
}

// Re-export for convenience
export type { CredentialResponse }
