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
  ArrowRight,
  ExternalLink,
  Code,
  Wrench,
  Globe,
  Server,
} from "lucide-react"
import { categories } from "@/data/store"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileMenu({ open, onOpenChange }: Props) {
  const navigate = useNavigate()
  const routerNavigate = useRouterNavigate()
  const { products } = useProducts()
  const [expanded, setExpanded] = useState<"apps" | null>("apps")

  const go = (fn: () => void) => {
    fn()
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-80 overflow-y-auto p-0">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle className="text-lg">Menu</SheetTitle>
          <SheetDescription>Jelajahi Rhansoft Software</SheetDescription>
        </SheetHeader>
        <Separator />

        <div className="flex flex-col px-3 py-2">
          <p className="px-3 pt-1 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Layanan SaaS & Ekosistem
          </p>
          {/* External link: Rhantech */}
          <a
            href="https://rhantech.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <span className="flex items-center gap-2">
              <Code className="size-4 text-primary" />
              Rhantech (Source Code)
            </span>
            <ExternalLink className="size-3.5 text-muted-foreground" />
          </a>

          {/* External link: Buatin.tech */}
          <a
            href="https://buatin.tech/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <span className="flex items-center gap-2">
              <Wrench className="size-4 text-primary" />
              Buatin Tech (Tools)
            </span>
            <ExternalLink className="size-3.5 text-muted-foreground" />
          </a>

          {/* External link: NOC Rhantech */}
          <a
            href="https://noc.rhantech.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <span className="flex items-center gap-2">
              <Server className="size-4 text-primary" />
              NOC Rhantech (Monitoring)
            </span>
            <ExternalLink className="size-3.5 text-muted-foreground" />
          </a>

          <button
            onClick={() => go(() => navigate("store"))}
            className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <span className="flex items-center gap-2">
              <Globe className="size-4 text-primary" />
              Harga & Katalog
            </span>
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

        {/* Aplikasi accordion (Odoo style category list) */}
        <div className="px-3 py-2">
          <button
            onClick={() => setExpanded(expanded === "apps" ? null : "apps")}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
          >
            <span>Daftar Aplikasi</span>
            <ChevronDown
              className={`size-4 text-muted-foreground transition-transform ${
                expanded === "apps" ? "rotate-180" : ""
              }`}
            />
          </button>
          {expanded === "apps" && (
            <div className="mt-2 space-y-4 px-2 pb-2">
              {categories.map((cat) => {
                const catProducts = products.filter((p) => p.category === cat.name)
                if (catProducts.length === 0) return null
                return (
                  <div key={cat.id} className="space-y-1.5">
                    <button
                      onClick={() => go(() => navigate("category", cat.name))}
                      className="text-xs font-bold uppercase tracking-wider text-primary hover:underline text-left block"
                    >
                      {cat.name}
                    </button>
                    <ul className="space-y-1 pl-1">
                      {catProducts.map((p) => (
                        <li key={p.id}>
                          <button
                            onClick={() =>
                              go(() => {
                                routerNavigate(`/product/${p.id}`)
                                window.scrollTo({ top: 0, behavior: "smooth" })
                              })
                            }
                            className="text-[13px] text-muted-foreground hover:text-foreground text-left block w-full py-0.5 truncate"
                          >
                            {p.name.replace("Software ", "").replace("Aplikasi ", "")}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}

              <button
                onClick={() =>
                  go(() => {
                    routerNavigate("/categories")
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  })
                }
                className="flex w-full items-center gap-1 pt-2 text-xs font-semibold text-primary"
              >
                Lihat semua {categories.length} kategori software
                <ArrowRight className="size-3" />
              </button>
            </div>
          )}
        </div>

        <Separator />

        {/* CTA */}
        <div className="p-4">
          <button
            onClick={() => {
              onOpenChange(false)
              routerNavigate("/trial-register")
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
