/**
 * Auth library — JWT, password hashing, Google OAuth verification
 *
 * Roles: admin, user, editor
 */
import path from "path"
import { fileURLToPath } from "url"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { OAuth2Client } from "google-auth-library"
import dotenv from "dotenv"
import { queryOne } from "../db/pool.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, "../.env") })

// ── Configuration ──────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || "rhansoft-dev-secret-change-me"
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "365d"
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ""

const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null

// ── Password hashing ───────────────────────────────────────────
export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10)
}

export async function verifyPassword(plain, hash) {
  if (!hash) return false
  return bcrypt.compare(plain, hash)
}

// ── JWT ────────────────────────────────────────────────────────
export function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

// ── Convert DB row to safe user object (no password) ──────────
function toAuthUser(row) {
  if (!row) return null
  return {
    id: row.id,
    first_name: row.first_name,
    last_name: row.last_name || "",
    email: row.email,
    avatar_url: row.avatar_url || null,
    role: row.role,
    is_active: row.is_active,
  }
}

export async function getUserById(id) {
  const row = await queryOne("SELECT * FROM users WHERE id = $1", [id])
  return toAuthUser(row)
}

export async function getUserByEmail(email) {
  const row = await queryOne("SELECT * FROM users WHERE email = $1", [email])
  return { user: toAuthUser(row), row }
}

export async function getUserByGoogleId(googleId) {
  const row = await queryOne("SELECT * FROM users WHERE google_id = $1", [googleId])
  return { user: toAuthUser(row), row }
}

// ── Register (manual email/password) ──────────────────────────
export async function registerUser({ first_name, last_name, email, password }) {
  // Check if email already exists
  const existing = await queryOne("SELECT id FROM users WHERE email = $1", [email])
  if (existing) {
    throw new Error("Email sudah terdaftar. Silakan login.")
  }

  const passwordHash = await hashPassword(password)
  const row = await queryOne(
    `INSERT INTO users (first_name, last_name, email, password_hash, role, is_active)
     VALUES ($1, $2, $3, $4, 'user', TRUE)
     RETURNING *`,
    [first_name, last_name || "", email, passwordHash]
  )
  return toAuthUser(row)
}

// ── Login (manual) ─────────────────────────────────────────────
export async function loginUser({ email, password }) {
  const { row } = await getUserByEmail(email)
  if (!row) {
    throw new Error("Email atau password salah")
  }
  if (!row.is_active) {
    throw new Error("Akun Anda dinonaktifkan. Hubungi admin.")
  }
  if (!row.password_hash) {
    throw new Error("Akun ini terdaftar via Google. Silakan login dengan Google.")
  }

  const ok = await verifyPassword(password, row.password_hash)
  if (!ok) {
    throw new Error("Email atau password salah")
  }

  // Update last login
  await queryOne("UPDATE users SET last_login_at = NOW() WHERE id = $1", [row.id])

  return toAuthUser(row)
}

// ── Google OAuth login/register ────────────────────────────────
export async function loginWithGoogle(credential) {
  if (!googleClient) {
    throw new Error("Google OAuth belum dikonfigurasi. Set GOOGLE_CLIENT_ID di .env")
  }

  // Verify Google ID token
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: GOOGLE_CLIENT_ID,
  })
  const payload = ticket.getPayload()

  if (!payload || !payload.email) {
    throw new Error("Token Google tidak valid")
  }

  const googleId = payload.sub
  const email = payload.email
  const firstName = payload.given_name || email.split("@")[0]
  const lastName = payload.family_name || ""
  const avatarUrl = payload.picture || null

  // Check if user exists by google_id
  let { user, row } = await getUserByGoogleId(googleId)

  if (row) {
    // Existing Google user — update info
    if (!row.is_active) {
      throw new Error("Akun Anda dinonaktifkan. Hubungi admin.")
    }
    await queryOne(
      `UPDATE users SET first_name = $1, last_name = $2, avatar_url = $3, last_login_at = NOW()
       WHERE id = $4`,
      [firstName, lastName, avatarUrl, row.id]
    )
    user = await getUserById(row.id)
  } else {
    // Check if email exists (manual registration) — link Google account
    const { row: emailRow } = await getUserByEmail(email)
    if (emailRow) {
      if (!emailRow.is_active) {
        throw new Error("Akun Anda dinonaktifkan. Hubungi admin.")
      }
      await queryOne(
        `UPDATE users SET google_id = $1, avatar_url = $2, last_login_at = NOW()
         WHERE id = $3`,
        [googleId, avatarUrl, emailRow.id]
      )
      user = await getUserById(emailRow.id)
    } else {
      // Create new Google user
      const newRow = await queryOne(
        `INSERT INTO users (first_name, last_name, email, google_id, avatar_url, role, is_active)
         VALUES ($1, $2, $3, $4, $5, 'user', TRUE)
         RETURNING *`,
        [firstName, lastName, email, googleId, avatarUrl]
      )
      user = toAuthUser(newRow)
    }
  }

  return user
}

// ── Auth middleware for Express ────────────────────────────────
export function authMiddleware(requiredRole = null) {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Token tidak ditemukan" })
      }

      const token = authHeader.substring(7)
      const decoded = verifyToken(token)
      if (!decoded) {
        return res.status(401).json({ error: "Token tidak valid atau kedaluwarsa" })
      }

      const user = await getUserById(decoded.sub)
      if (!user || !user.is_active) {
        return res.status(401).json({ error: "Akun tidak ditemukan atau dinonaktifkan" })
      }

      // Role check
      if (requiredRole) {
        const roleHierarchy = { admin: 3, editor: 2, user: 1 }
        const userLevel = roleHierarchy[user.role] || 0
        const requiredLevel = roleHierarchy[requiredRole] || 0
        if (userLevel < requiredLevel) {
          return res.status(403).json({
            error: `Akses ditolak. Minimal role "${requiredRole}" diperlukan.`,
          })
        }
      }

      req.user = user
      next()
    } catch (err) {
      return res.status(401).json({ error: "Autentikasi gagal: " + err.message })
    }
  }
}
