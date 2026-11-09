import { useEffect, useMemo, useState } from "react"
import { useNavigate as useRouterNavigate } from "react-router-dom"
import { useNavigate } from "@/lib/navigate"
import { Badge } from "@/components/ui/badge"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command"
import {
  ShoppingCart,
  Calculator,
  Stethoscope,
  BedDouble,
  Receipt,
  MessageSquare,
  Globe,
  Search,
  Clock,
  X,
  Package,
} from "lucide-react"
import { categories } from "@/data/store"
import { useProducts } from "@/hooks/useProducts"
import type { Product } from "@/data/store"

const iconMap: Record<string, React.ElementType> = {
  ShoppingCart,
  Calculator,
  Stethoscope,
  BedDouble,
  Receipt,
  MessageSquare,
  Globe,
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const RECENT_KEY = "rhansoft:recent-searches"
const MAX_RECENT = 5

function formatPrice(n: number) {
  return n.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function addRecentSearch(term: string) {
  if (!term.trim()) return
  try {
    const recent = getRecentSearches().filter((r) => r.toLowerCase() !== term.toLowerCase())
    localStorage.setItem(RECENT_KEY, JSON.stringify([term, ...recent].slice(0, MAX_RECENT)))
  } catch {
    // ignore
  }
}

function removeRecentSearch(term: string) {
  try {
    const recent = getRecentSearches().filter((r) => r !== term)
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent))
  } catch {
    // ignore
  }
}

export function SearchDialog({ open, onOpenChange }: Props) {
  const navigate = useNavigate()
  const routerNavigate = useRouterNavigate()
  const { products } = useProducts()
  const [query, setQuery] = useState("")
  const [recent, setRecent] = useState<string[]>([])

  useEffect(() => {
    if (open) {
      setRecent(getRecentSearches())
      setQuery("")
    }
  }, [open])

  const normalizedQuery = query.trim().toLowerCase()

  const filteredCategories = useMemo(() => {
    if (!normalizedQuery) return categories.slice(0, 6)
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(normalizedQuery) ||
        c.tagline.toLowerCase().includes(normalizedQuery)
    )
  }, [normalizedQuery])

  const filteredProducts = useMemo(() => {
    if (!normalizedQuery) return products.slice(0, 6)
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(normalizedQuery) ||
        p.category.toLowerCase().includes(normalizedQuery) ||
        p.description.toLowerCase().includes(normalizedQuery)
    )
  }, [normalizedQuery, products])

  const hasQuery = normalizedQuery.length > 0
  const hasResults = filteredCategories.length > 0 || filteredProducts.length > 0

  const go = (fn: () => void, term?: string) => {
    if (term) addRecentSearch(term)
    fn()
    onOpenChange(false)
  }

  const handleSelectProduct = (product: Product) => {
    go(() => routerNavigate(`/product/${product.id}`), product.name)
  }

  const handleSelectCategory = (name: string) => {
    go(() => navigate("category", name), name)
  }

  const handleRecentSearch = (term: string) => {
    setQuery(term)
    addRecentSearch(term)
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Cari software & kategori"
      description="Temukan software bisnis yang Anda butuhkan"
      className="max-w-2xl gap-0 overflow-hidden p-0 shadow-2xl"
    >
      {/* Input */}
      <div className="border-b">
        <CommandInput
          placeholder="Cari software, kategori, atau fitur..."
          value={query}
          onValueChange={setQuery}
          className="h-12 text-sm"
        />
      </div>

      <CommandList className="max-h-[70vh] overflow-y-auto p-2">
        {/* Recent searches */}
        {!hasQuery && recent.length > 0 && (
          <CommandGroup heading="Pencarian terakhir">
            {recent.map((term) => (
              <CommandItem
                key={term}
                value={`recent:${term}`}
                onSelect={() => handleRecentSearch(term)}
                className="group flex items-center justify-between rounded-lg px-2"
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="size-4 text-muted-foreground" />
                  <span className="text-sm">{term}</span>
                </div>
                <button
                  className="rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-accent"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeRecentSearch(term)
                    setRecent(getRecentSearches())
                  }}
                >
                  <X className="size-3.5 text-muted-foreground" />
                </button>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Categories */}
        {filteredCategories.length > 0 && (
          <CommandGroup heading="Kategori">
            {filteredCategories.map((cat) => {
              const Icon = iconMap[cat.icon] ?? Search
              return (
                <CommandItem
                  key={cat.id}
                  value={`cat:${cat.name} ${cat.tagline}`}
                  onSelect={() => handleSelectCategory(cat.name)}
                  className="flex items-center gap-3 rounded-lg px-2 py-2"
                >
                  <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: `${cat.gradient?.includes("blue") ? "#3b82f1" : "#6366f1"}15`,
                    }}
                  >
                    <Icon className="size-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{cat.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{cat.tagline}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {cat.count}
                  </Badge>
                </CommandItem>
              )
            })}
          </CommandGroup>
        )}

        {filteredCategories.length > 0 && filteredProducts.length > 0 && (
          <CommandSeparator className="my-1" />
        )}

        {/* Products */}
        {filteredProducts.length > 0 && (
          <CommandGroup heading="Software">
            {filteredProducts.map((p) => (
              <CommandItem
                key={p.id}
                value={`prod:${p.name} ${p.category} ${p.description}`}
                onSelect={() => handleSelectProduct(p)}
                className="flex items-center gap-3 rounded-lg px-2 py-2"
              >
                <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-none bg-muted/30 p-0.5">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="max-h-full max-w-full rounded-none object-contain"
                    loading="lazy"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.category}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5">
                  <span className="text-xs font-bold" style={{ color: p.color }}>
                    {formatPrice(p.price)}
                  </span>
                  {p.originalPrice && (
                    <span className="text-[10px] text-muted-foreground line-through">
                      {formatPrice(p.originalPrice)}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Empty states */}
        {hasQuery && !hasResults && (
          <CommandEmpty className="flex flex-col items-center justify-center py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Search className="size-5 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm font-medium">Tidak ada hasil untuk "{query}"</p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              Coba "kasir", "klinik", "hotel", atau "akuntansi".
            </p>
          </CommandEmpty>
        )}

        {!hasQuery && !recent.length && (
          <CommandEmpty className="py-10 text-center text-sm text-muted-foreground">
            Ketik nama software atau kategori untuk mulai mencari.
          </CommandEmpty>
        )}
      </CommandList>

      {/* Footer */}
      <div className="flex items-center justify-between border-t px-3 py-2 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <kbd className="rounded border bg-background px-1 font-mono text-[9px]">↑↓</kbd>
            pilih
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border bg-background px-1 font-mono text-[9px]">↵</kbd>
            buka
          </span>
        </div>
        <span className="flex items-center gap-1">
          <Package className="size-3" />
          {products.length} software
        </span>
      </div>
    </CommandDialog>
  )
}
