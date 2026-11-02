import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { useNavigate as useRouterNavigate } from "react-router-dom"
import { useProducts } from "@/hooks/useProducts"
import { useNavigate } from "@/lib/navigate"
import {
  Settings,
  ChevronRight,
  ChevronDown,
  ShoppingBag,
  ArrowRight,
} from "lucide-react"
import { industries, categoryIconMap, productIconMap } from "@/data/navigation"
import type { Product } from "@/data/store"
import type { LucideIcon } from "lucide-react"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function getIconForCategory(name: string): LucideIcon {
  return categoryIconMap[name] ?? ShoppingBag
}

function getIconForProduct(product: Product): LucideIcon {
  return productIconMap[product.id] ?? getIconForCategory(product.category)
}

export function MobileMenu({ open, onOpenChange }: Props) {
  const navigate = useNavigate()
  const routerNavigate = useRouterNavigate()
  const { products } = useProducts()
  const [expanded, setExpanded] = useState<"apps" | "industries" | null>(null)

  const go = (fn: () => void) => {
    fn()
    onOpenChange(false)
  }

  const featuredProducts = products.filter((p) => p.featured)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-80 overflow-y-auto p-0">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle className="text-lg">Menu</SheetTitle>
          <SheetDescription>Jelajahi Rhansoft Software</SheetDescription>
        </SheetHeader>
        <Separator />

        <div className="flex flex-col px-3 py-2">
          <button
            onClick={() => go(() => navigate("store"))}
            className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Harga
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => go(() => navigate("footer"))}
            className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Bantuan
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => go(() => routerNavigate("/admin"))}
            className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Admin
            <Settings className="size-4 text-muted-foreground" />
          </button>
        </div>

        <Separator />

        {/* Aplikasi accordion */}
        <div className="px-3 py-2">
          <button
            onClick={() => setExpanded(expanded === "apps" ? null : "apps")}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
          >
            Aplikasi
            <ChevronDown
              className={`size-4 text-muted-foreground transition-transform ${
                expanded === "apps" ? "rotate-180" : ""
              }`}
            />
          </button>
          {expanded === "apps" && (
            <div className="mt-1 space-y-2 pb-2">
              <div className="grid grid-cols-2 gap-1.5">
                {featuredProducts.map((p) => {
                  const PIcon = getIconForProduct(p)
                  return (
                    <button
                      key={p.id}
                      onClick={() =>
                        go(() => {
                          routerNavigate(`/product/${p.id}`)
                          window.scrollTo({ top: 0, behavior: "smooth" })
                        })
                      }
                      className="group flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card p-2.5 text-center transition-colors hover:border-primary/40 hover:bg-accent/50"
                    >
                      <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <PIcon className="size-4" />
                      </div>
                      <span className="line-clamp-2 text-[11px] font-medium leading-tight">
                        {p.name.replace("Software ", "").replace("Aplikasi ", "")}
                      </span>
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => go(() => navigate("store"))}
                className="flex w-full items-center gap-1 px-3 py-2 text-xs font-medium text-primary"
              >
                Lihat semua aplikasi
                <ArrowRight className="size-3" />
              </button>
            </div>
          )}
        </div>

        <Separator />

        {/* Industri accordion */}
        <div className="px-3 py-2">
          <button
            onClick={() => setExpanded(expanded === "industries" ? null : "industries")}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
          >
            Industri
            <ChevronDown
              className={`size-4 text-muted-foreground transition-transform ${
                expanded === "industries" ? "rotate-180" : ""
              }`}
            />
          </button>
          {expanded === "industries" && (
            <div className="mt-1 grid grid-cols-1 gap-1 pb-2">
              {industries.slice(0, 6).map((ind) => {
                const Icon = ind.icon
                return (
                  <button
                    key={ind.id}
                    onClick={() => go(() => navigate("category", ind.category))}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                  >
                    <Icon className="size-4 text-primary" />
                    <span className="font-medium">{ind.label}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <Separator />

        {/* CTA */}
        <div className="p-4">
          <button
            onClick={() => {
              onOpenChange(false)
              navigate("/trial-register")
            }}
            className="w-full rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Uji coba gratis
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
