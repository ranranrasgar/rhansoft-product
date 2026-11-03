import { lazy, Suspense } from "react"
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom"
import { GoogleOAuthProvider } from "@react-oauth/google"
import { Toaster } from "@/components/ui/sonner"
import { CartProvider } from "@/hooks/useCart"
import { NavProvider } from "@/lib/navigate"
import { AuthProvider } from "@/hooks/useAuth"
import { ProductProvider } from "@/hooks/useProducts"
import { MasterDataProvider } from "@/hooks/useMasterData"
import { GOOGLE_CLIENT_ID } from "@/lib/env"
import { Header } from "@/sections/Header"
import { HeroCarousel } from "@/sections/HeroCarousel"
import { Categories } from "@/sections/Categories"
import { FeaturedProducts } from "@/sections/FeaturedProducts"
import { PromotionalSections } from "@/sections/PromotionalSections"
import { Footer } from "@/sections/Footer"

// Lazy-loaded pages for code-splitting
const ProductDetailPage = lazy(() => import("@/pages/ProductDetailPage").then((m) => ({ default: m.ProductDetailPage })))
const CheckoutPage = lazy(() => import("@/pages/CheckoutPage").then((m) => ({ default: m.CheckoutPage })))
const StaticPage = lazy(() => import("@/pages/StaticPage").then((m) => ({ default: m.StaticPage })))
const AuthPage = lazy(() => import("@/pages/AuthPage").then((m) => ({ default: m.AuthPage })))
const TrialRegisterPage = lazy(() => import("@/pages/TrialRegisterPage").then((m) => ({ default: m.TrialRegisterPage })))
const ProfilePage = lazy(() => import("@/pages/ProfilePage").then((m) => ({ default: m.ProfilePage })))
const AdminLayout = lazy(() => import("@/pages/admin/AdminLayout").then((m) => ({ default: m.AdminLayout })))
const DashboardPage = lazy(() => import("@/pages/admin/DashboardPage").then((m) => ({ default: m.DashboardPage })))
const ProductsPage = lazy(() => import("@/pages/admin/ProductsPage").then((m) => ({ default: m.ProductsPage })))
const UsersPage = lazy(() => import("@/pages/admin/UsersPage").then((m) => ({ default: m.UsersPage })))
const OrdersPage = lazy(() => import("@/pages/admin/OrdersPage").then((m) => ({ default: m.OrdersPage })))
const RefundsPage = lazy(() => import("@/pages/admin/RefundsPage").then((m) => ({ default: m.RefundsPage })))
const CustomersPage = lazy(() => import("@/pages/admin/CustomersPage").then((m) => ({ default: m.CustomersPage })))
const PaymentResultPage = lazy(() => import("@/pages/PaymentResultPage").then((m) => ({ default: m.PaymentResultPage })))
const MyOrdersPage = lazy(() => import("@/pages/MyOrdersPage").then((m) => ({ default: m.MyOrdersPage })))
const LicenseRequestsPage = lazy(() => import("@/pages/admin/LicenseRequestsPage").then((m) => ({ default: m.LicenseRequestsPage })))
const TrialsPage = lazy(() => import("@/pages/admin/TrialsPage").then((m) => ({ default: m.TrialsPage })))
const SettingsPage = lazy(() => import("@/pages/admin/SettingsPage").then((m) => ({ default: m.SettingsPage })))

function HomePage() {
  return (
    <>
      <HeroCarousel />
      <Categories />
      <FeaturedProducts />
      <PromotionalSections />
    </>
  )
}

function AppLayout() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith("/admin")

  return (
    <AuthProvider>
      <NavProvider>
        <ProductProvider>
          <MasterDataProvider>
            <CartProvider>
              <div className="min-h-screen bg-background text-foreground antialiased">
                {!isAdmin && <Header />}
                <main>
                  <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center"><span className="size-6 animate-spin rounded-full border-2 border-muted border-t-primary" /></div>}>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/product/:id" element={<ProductDetailPage />} />
                      <Route path="/checkout" element={<CheckoutPage />} />
                      <Route path="/akun/pesanan" element={<MyOrdersPage />} />
                      <Route path="/pembayaran/berhasil" element={<PaymentResultPage outcome="success" />} />
                      <Route path="/pembayaran/gagal" element={<PaymentResultPage outcome="failed" />} />
                      <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<DashboardPage />} />
                        <Route path="products" element={<ProductsPage />} />
                        <Route path="users" element={<UsersPage />} />
                        <Route path="orders" element={<OrdersPage />} />
                        <Route path="refunds" element={<RefundsPage />} />
                        <Route path="customers" element={<CustomersPage />} />
                        <Route path="trials" element={<TrialsPage />} />
                        <Route path="licenses" element={<LicenseRequestsPage />} />
                        <Route path="settings" element={<SettingsPage />} />
                      </Route>
                      <Route path="/page/:slug" element={<StaticPage />} />
                      <Route path="/login" element={<AuthPage />} />
                      <Route path="/register" element={<AuthPage />} />
                      <Route path="/trial-register" element={<TrialRegisterPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </main>
                {!isAdmin && <Footer />}
              </div>
              <Toaster position="bottom-right" richColors theme="light" />
            </CartProvider>
          </MasterDataProvider>
        </ProductProvider>
      </NavProvider>
    </AuthProvider>
  )
}

function App() {
  return (
    <BrowserRouter>
      {GOOGLE_CLIENT_ID ? (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}><AppLayout /></GoogleOAuthProvider>
      ) : (
        <AppLayout />
      )}
    </BrowserRouter>
  )
}

export default App
