import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react"
import type { Category, Platform } from "@/data/store"

type MasterDataContextValue = {
  categories: Category[]
  platforms: Platform[]
  loading: boolean
}

const MasterDataContext = createContext<MasterDataContextValue | null>(null)

export function MasterDataProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchAll() {
      setLoading(true)
      try {
        const [catRes, platRes] = await Promise.all([
          fetch("/api/categories").then((r) => r.json()),
          fetch("/api/platforms").then((r) => r.json()),
        ])

        if (!cancelled) {
          if (Array.isArray(catRes)) setCategories(catRes)
          if (Array.isArray(platRes))
            setPlatforms(platRes.map((p: Platform) => ({ id: p.id, name: p.name, icon: p.icon })))
        }
      } catch (err) {
        console.error("Failed to fetch master data:", err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchAll()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <MasterDataContext.Provider value={{ categories, platforms, loading }}>
      {children}
    </MasterDataContext.Provider>
  )
}

export function useMasterData() {
  const ctx = useContext(MasterDataContext)
  if (!ctx) throw new Error("useMasterData must be used within MasterDataProvider")
  return ctx
}
