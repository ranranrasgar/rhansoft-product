import { useState, useEffect } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Mail,
  Lock,
  User as UserIcon,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google"
import { useAuth } from "@/hooks/useAuth"
import { GOOGLE_CONFIGURED } from "@/lib/env"
import { register, login, loginWithGoogle } from "@/lib/auth"

type Mode = "login" | "register"

export function AuthPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login: authLogin, user: currentUser, loading: authLoading } = useAuth()
  const redirectTo = (location.state as { from?: string } | null)?.from || "/"

  // Sudah login: tidak perlu melihat halaman login/daftar lagi
  useEffect(() => {
    if (!authLoading && currentUser) navigate(redirectTo, { replace: true })
  }, [authLoading, currentUser, navigate, redirectTo])

  const [mode, setMode] = useState<Mode>(
    location.pathname.includes("register") ? "register" : "login"
  )
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
  })

  const update = (field: keyof typeof form, value: string) =>
    setForm((s) => ({ ...s, [field]: value }))

  // ── Manual submit ───────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === "register") {
        if (!form.first_name || !form.email || !form.password) {
          toast.error("Nama depan, email, dan password wajib diisi")
          return
        }
        if (form.password.length < 6) {
          toast.error("Password minimal 6 karakter")
          return
        }

        const { user, token } = await register({
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          password: form.password,
        })

        authLogin(user, token)
        toast.success(`Selamat datang, ${user.first_name}!`)
        navigate(redirectTo, { replace: true })
      } else {
        if (!form.email || !form.password) {
          toast.error("Email dan password wajib diisi")
          return
        }

        const { user, token } = await login({
          email: form.email,
          password: form.password,
        })

        authLogin(user, token)
        toast.success(`Selamat datang kembali, ${user.first_name}!`)
        navigate(redirectTo, { replace: true })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  // ── Google login ────────────────────────────────────────────
  const handleGoogle = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      toast.error("Login Google gagal — kredensial kosong")
      return
    }

    setGoogleLoading(true)
    try {
      const { user, token } = await loginWithGoogle(credentialResponse.credential)
      authLogin(user, token)
      toast.success(`Selamat datang, ${user.first_name}!`)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      const rawMsg = err instanceof Error ? err.message : "Login Google gagal"
      const msg = rawMsg.includes("Google OAuth belum dikonfigurasi")
        ? "Login Google sedang tidak tersedia. Silakan gunakan email/password."
        : rawMsg
      toast.error(msg)
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-12">
      <Button
        variant="ghost"
        size="sm"
        className="mb-6 -ml-2 w-fit"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="size-4" />
        Kembali ke beranda
      </Button>

      <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
        {/* Logo + Title */}
        <div className="mb-6 text-center">
          <img
            src="/img/logorhn.png"
            alt="Rhansoft"
            className="mx-auto mb-4 h-10 w-auto object-contain"
          />
          <h1 className="text-2xl font-bold tracking-tight">
            {mode === "login" ? "Masuk ke akun" : "Buat akun baru"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login"
              ? "Masuk untuk mengelola pembelian dan lisensi"
              : "Daftar gratis untuk mulai berbelanja software"}
          </p>
        </div>

        {/* Google button */}
        {GOOGLE_CONFIGURED ? (
          googleLoading ? (
            <Button variant="outline" className="w-full rounded-full" disabled>
              <Loader2 className="size-4 animate-spin" />
              Memproses...
            </Button>
          ) : (
            <GoogleLogin
              onSuccess={handleGoogle}
              onError={() => {
                toast.error("Login Google dibatalkan atau gagal")
              }}
              text={mode === "login" ? "signin_with" : "signup_with"}
              shape="pill"
              width="320"
            />
          )
        ) : (
          <Button
            variant="outline"
            className="w-full rounded-full text-muted-foreground"
            disabled
            title="Login Google belum dikonfigurasi"
          >
            <Mail className="size-4" />
            Login Google belum dikonfigurasi
          </Button>
        )}

        <div className="my-6 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">atau</span>
          <Separator className="flex-1" />
        </div>

        {/* Manual form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="first_name">Nama Depan</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="first_name"
                    value={form.first_name}
                    onChange={(e) => update("first_name", e.target.value)}
                    placeholder="Budi"
                    className="pl-9"
                    autoComplete="given-name"
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="last_name">Nama Belakang</Label>
                <Input
                  id="last_name"
                  value={form.last_name}
                  onChange={(e) => update("last_name", e.target.value)}
                  placeholder="Santoso"
                  autoComplete="family-name"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="budi@example.com"
                className="pl-9"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder={mode === "register" ? "Minimal 6 karakter" : "••••••"}
                className="pl-9"
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                required
                minLength={mode === "register" ? 6 : undefined}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full rounded-full"
            disabled={loading || googleLoading}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                {mode === "login" ? "Masuk" : "Daftar Sekarang"}
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>

        {/* Switch mode */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "login" ? "Belum punya akun? " : "Sudah punya akun? "}
          <button
            onClick={() => {
              setMode(mode === "login" ? "register" : "login")
              navigate(mode === "login" ? "/register" : "/login")
            }}
            className="font-semibold text-primary hover:underline cursor-pointer"
          >
            {mode === "login" ? "Daftar di sini" : "Masuk di sini"}
          </button>
        </p>

        {/* Trust badges */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="size-3.5" />
          <span>Enkripsi SSL 256-bit · Data Anda aman</span>
        </div>
      </div>

      <p className="mt-4 px-4 text-center text-[11px] text-muted-foreground">
        Dengan masuk atau mendaftar, Anda menyetujui{" "}
        <Link to="/page/terms-of-use" className="underline hover:text-foreground">
          Syarat & Ketentuan
        </Link>{" "}
        dan{" "}
        <Link to="/page/privacy-policy" className="underline hover:text-foreground">
          Kebijakan Privasi
        </Link>{" "}
        kami.
      </p>
    </div>
  )
}
