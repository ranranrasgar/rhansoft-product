import type { LucideIcon } from "lucide-react"
import { productIconMap, categoryIconMap } from "@/data/navigation"
import type { Product } from "@/data/store"

export function getProductIcon(product: Product): LucideIcon {
  return productIconMap[product.id] ?? categoryIconMap[product.category] ?? (() => null)
}

export function getCategoryIcon(name: string): LucideIcon {
  return categoryIconMap[name] ?? (() => null)
}
