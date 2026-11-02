import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react"
import {
  type AuthUser,
  getToken,
  setToken,
  clearToken,
  fetchCurrentUser,
} from "@/lib/auth"

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  login: (user: AuthUser, token: string) => void
  logout: () => void
  isAdmin: boolean
  isEditor: boolean
  canEdit: boolean // admin or editor
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // On mount: check if token exists, fetch user
  useEffect(() => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }

    fetchCurrentUser(token)
      .then((u) => setUser(u))
      .catch(() => {
        clearToken()
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback((u: AuthUser, token: string) => {
    setToken(token)
    setUser(u)
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login,
      logout,
      isAdmin: user?.role === "admin",
      isEditor: user?.role === "editor",
      canEdit: user?.role === "admin" || user?.role === "editor",
    }),
    [user, loading, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
