import { authHeaders } from "@/lib/auth"
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from "react"
import type { Product } from "@/data/store"
import { initialProducts } from "@/data/store"

type ProductContextValue = {
  products: Product[]
  loading: boolean
  error: string | null
  getProductById: (id: string) => Product | undefined
  addProduct: (product: Omit<Product, "id">) => Product
  updateProduct: (id: string, updates: Partial<Product>) => void
  deleteProduct: (id: string) => void
  resetProducts: () => void
  refetch: () => void
}

const ProductContext = createContext<ProductContextValue | null>(null)

export function ProductProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refetchTrigger, setRefetchTrigger] = useState(0)

  // ── Fetch products from backend API (PostgreSQL) ──────────────
  useEffect(() => {
    let cancelled = false

    async function fetchProducts() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/products")
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()

        if (!cancelled && Array.isArray(data) && data.length > 0) {
          setProducts(data)
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Unknown error"
          setError(msg)
          // Fallback to static data if API fails
          setProducts(initialProducts)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchProducts()
    return () => {
      cancelled = true
    }
  }, [refetchTrigger])

  const refetch = useCallback(() => {
    setRefetchTrigger((n) => n + 1)
  }, [])

  const getProductById = useCallback(
    (id: string) => products.find((p) => p.id === id),
    [products]
  )

  const addProduct = useCallback(
    (product: Omit<Product, "id">) => {
      const newProduct: Product = {
        ...product,
        id: `sw-${Date.now()}`,
      }
      setProducts((prev) => [...prev, newProduct])
      return newProduct
    },
    []
  )

  const updateProduct = useCallback(
    (id: string, updates: Partial<Product>) => {
      // Update local state immediately
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      )

      // Also send to backend API
      fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(updates),
      }).catch((err) => {
        console.error("Failed to sync product update to backend:", err)
      })
    },
    []
  )

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const resetProducts = useCallback(() => {
    refetch()
  }, [refetch])

  const value = useMemo(
    () => ({
      products,
      loading,
      error,
      getProductById,
      addProduct,
      updateProduct,
      deleteProduct,
      resetProducts,
      refetch,
    }),
    [products, loading, error, getProductById, addProduct, updateProduct, deleteProduct, resetProducts, refetch]
  )

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
}

export function useProducts() {
  const ctx = useContext(ProductContext)
  if (!ctx) throw new Error("useProducts must be used within ProductProvider")
  return ctx
}
