import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { useNavigate as useRouterNavigate } from "react-router-dom"

export type NavTarget = "store" | "categories" | "footer"

type NavigateFn = {
  (target: NavTarget): void
  (target: "category", categoryName: string): void
}

type NavContextValue = {
  navigate: NavigateFn
  filterCategory: string | null
  setFilterCategory: (c: string | null) => void
}

const NavContext = createContext<NavContextValue | null>(null)

export function NavProvider({ children }: { children: ReactNode }) {
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const routerNavigate = useRouterNavigate()

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (el) {
      try {
        el.scrollIntoView({ behavior: "smooth", block: "start" })
        return true
      } catch {
        return false
      }
    }
    return false
  }, [])

  const navigate = useCallback<NavigateFn>(
    (target: NavTarget | "category", categoryName?: string) => {
      if (target === "category" && categoryName) {
        setFilterCategory(categoryName)
        if (window.location.pathname === "/" && scrollTo("store")) {
          return
        }
        routerNavigate(
          `/?category=${encodeURIComponent(categoryName)}#store`,
          { replace: false }
        )
        return
      }

      setFilterCategory(null)
      const id = target as string
      if (window.location.pathname === "/" && scrollTo(id)) {
        return
      }
      routerNavigate(`/#${id}`, { replace: false })
    },
    [routerNavigate, scrollTo]
  )

  const value = useMemo(
    () => ({ navigate, filterCategory, setFilterCategory }),
    [navigate, filterCategory]
  )

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>
}

export function useNavigate() {
  const ctx = useContext(NavContext)
  if (!ctx) throw new Error("useNavigate must be used within NavProvider")
  return ctx.navigate
}

export function useNavContext() {
  const ctx = useContext(NavContext)
  if (!ctx) throw new Error("useNavContext must be used within NavProvider")
  return ctx
}
