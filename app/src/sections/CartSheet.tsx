import { useNavigate } from "react-router-dom"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/hooks/useCart"
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatPrice(n: number) {
  return n.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  })
}

export function CartSheet({ open, onOpenChange }: Props) {
  const { items, subtotal, updateQuantity, removeItem, clear, itemCount } = useCart()
  const navigate = useNavigate()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <ShoppingBag className="size-5" />
            Keranjang Anda
          </SheetTitle>
          <SheetDescription>
            {itemCount > 0 ? `${itemCount} item dalam keranjang` : "Keranjang Anda kosong"}
          </SheetDescription>
        </SheetHeader>

        <Separator />

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
              <ShoppingBag className="size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Belum ada item. Jelajahi produk unggulan dan tambahkan yang Anda sukai.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 rounded-full"
                onClick={() => onOpenChange(false)}
              >
                Lanjut belanja
              </Button>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-none bg-muted/20 p-1">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="max-h-full max-w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium leading-tight">{item.name}</p>
                        <p className="text-[11px] text-muted-foreground">{item.category}</p>
                      </div>
                      <p className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                    <div className="mt-auto flex items-center gap-2 pt-2">
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon-sm"
                          variant="outline"
                          className="size-7 rounded-full"
                          onClick={() => updateQuantity(item.id, -1)}
                          aria-label={`Kurangi jumlah ${item.name}`}
                        >
                          <Minus className="size-3" />
                        </Button>
                        <span className="w-6 text-center text-xs font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          size="icon-sm"
                          variant="outline"
                          className="size-7 rounded-full"
                          onClick={() => updateQuantity(item.id, 1)}
                          aria-label={`Tambah jumlah ${item.name}`}
                        >
                          <Plus className="size-3" />
                        </Button>
                      </div>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="size-7 text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(item.id)}
                        aria-label={`Hapus ${item.name}`}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <>
            <Separator />
            <SheetFooter className="gap-3 px-6 pb-6 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-lg font-semibold">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Ongkos kirim dan pajak dihitung saat checkout.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-full"
                  onClick={clear}
                >
                  Kosongkan keranjang
                </Button>
                <Button className="flex-1 rounded-full"
                  onClick={() => {
                    onOpenChange(false)
                    navigate("/checkout")
                  }}
                >
                  Checkout
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
