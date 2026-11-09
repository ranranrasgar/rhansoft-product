import { authHeaders } from "@/lib/auth"
import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Package,
  RotateCcw,
  Eye,
  Loader2,
  Layers,
  Copy,
} from "lucide-react"
import { toast } from "sonner"
import { useProducts } from "@/hooks/useProducts"
import { useMasterData } from "@/hooks/useMasterData"
import { ImageUpload } from "@/components/ImageUpload"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import {
  categories as fallbackCategories,
  type Product,
  type ProductSpec,
  type DownloadLink,
} from "@/data/store"

function formatPrice(n: number) {
  return n.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  })
}

type EditState = {
  mode: "add" | "edit" | "copy"
  product: Product | null
}

function ProductForm({
  initial,
  asNew = false,
  saving = false,
  onSave,
  onCancel,
}: {
  initial: Product | null
  /** true = data awal dari produk lain (Salin); disimpan sebagai produk baru */
  asNew?: boolean
  saving?: boolean
  onSave: (data: Omit<Product, "id"> | Product) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(asNew && initial ? `${initial.name} (Salinan)` : (initial?.name ?? ""))
  const [category, setCategory] = useState(initial?.category ?? "")
  const [price, setPrice] = useState(initial?.price?.toString() ?? "")
  const [originalPrice, setOriginalPrice] = useState(initial?.originalPrice?.toString() ?? "")
  const [description, setDescription] = useState(initial?.description ?? "")
  const [image, setImage] = useState(initial?.image ?? "")
  const [badge, setBadge] = useState(initial?.badge ?? "")
  const [version, setVersion] = useState(initial?.version ?? "1.0")
  const [license, setLicense] = useState(initial?.license ?? "Lifetime License")
  const [downloadSize, setDownloadSize] = useState(initial?.downloadSize ?? "50 MB")
  const [color, setColor] = useState(initial?.color ?? "#0ea5e9")
  const [highlights, setHighlights] = useState((initial?.highlights ?? []).join("\n"))
  const [specsText, setSpecsText] = useState(
    (initial?.specs ?? []).map((s) => `${s.label}: ${s.value}`).join("\n")
  )
  const [gallery, setGallery] = useState<string[]>(initial?.gallery ?? [])
  const [downloadLinks, setDownloadLinks] = useState<DownloadLink[]>(
    initial?.downloadLinks ?? []
  )
  const [installTutorial, setInstallTutorial] = useState(initial?.installTutorial ?? "")
  const [featured, setFeatured] = useState(initial?.featured ?? false)
  const [benefits, setBenefits] = useState((initial?.benefits ?? []).join("\n"))
  const { categories: apiCategories, platforms } = useMasterData()
  const categories = apiCategories.length > 0 ? apiCategories : fallbackCategories
  const [platformIds, setPlatformIds] = useState<string[]>(
    initial?.platformIds ?? initial?.platforms?.map((p) => p.id) ?? []
  )

  const togglePlatform = (id: string) => {
    setPlatformIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const handleSave = () => {
    if (!name || !price || !description) {
      toast.error("Lengkapi nama, harga, dan deskripsi")
      return
    }
    if (!category) {
      toast.error("Pilih kategori")
      return
    }
    if (platformIds.length === 0) {
      toast.error("Pilih minimal 1 platform")
      return
    }

    const specs: ProductSpec[] = specsText
      .split("\n")
      .filter((line) => line.includes(":"))
      .map((line) => {
        const [label, ...rest] = line.split(":")
        return { label: label.trim(), value: rest.join(":").trim() }
      })

    const data = {
      name,
      category,
      price: parseInt(price) || 0,
      originalPrice: originalPrice ? parseInt(originalPrice) : undefined,
      description,
      image,
      badge: badge || undefined,
      version,
      license,
      downloadSize,
      color,
      // Ulasan milik produk asal, bukan salinannya
      rating: asNew ? 4.5 : (initial?.rating ?? 4.5),
      reviews: asNew ? 0 : (initial?.reviews ?? 0),
      highlights: highlights.split("\n").filter((h) => h.trim()),
      specs,
      gallery: gallery.filter((g) => g.trim()),
      downloadLinks: downloadLinks.filter((dl) => dl.url.trim()),
      installTutorial: installTutorial.trim() || undefined,
      platformIds,
      featured,
      benefits: benefits.split("\n").map((b) => b.trim()).filter(Boolean),
    }

    if (initial && !asNew) {
      onSave({ ...data, id: initial.id })
    } else {
      onSave(data)
    }
  }

  const field = "flex flex-col gap-1.5"
  const textareaClass =
    "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"

  return (
    // Isi bergulir, tombol Simpan/Batal tetap terlihat di bawah
    <div className="flex max-h-[85vh] flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto px-6 pb-6">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_300px]">
          <div className="grid content-start gap-4 sm:grid-cols-2">
            <div className={`${field} sm:col-span-2`}>
              <Label htmlFor="name">Nama Software *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Software Toko Rhansoft" />
            </div>
            <div className={field}>
              <Label htmlFor="category">Kategori *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category" className="w-full"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className={field}>
              <Label htmlFor="badge">Badge (opsional)</Label>
              <Select value={badge || "none"} onValueChange={(v) => setBadge(v === "none" ? "" : v)}>
                <SelectTrigger id="badge" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak ada</SelectItem>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Sale">Sale</SelectItem>
                  <SelectItem value="Hot">Hot</SelectItem>
                  <SelectItem value="Best Seller">Best Seller</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className={field}>
              <Label htmlFor="price">Harga (Rp) *</Label>
              <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="750000" />
            </div>
            <div className={field}>
              <Label htmlFor="originalPrice">Harga Coret (opsional)</Label>
              <Input id="originalPrice" type="number" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} placeholder="1200000" />
            </div>
            <div className={field}>
              <Label htmlFor="version">Versi</Label>
              <Input id="version" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.0" />
            </div>
            <div className={field}>
              <Label htmlFor="license">Lisensi</Label>
              <Input id="license" value={license} onChange={(e) => setLicense(e.target.value)} placeholder="Lifetime License" />
            </div>
            <div className={field}>
              <Label htmlFor="downloadSize">Ukuran Download</Label>
              <Input id="downloadSize" value={downloadSize} onChange={(e) => setDownloadSize(e.target.value)} placeholder="50 MB" />
            </div>
            <div className={field}>
              <Label htmlFor="color">Warna Accent</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  aria-label="Pilih warna"
                  value={/^#[0-9a-f]{6}$/i.test(color) ? color : "#0ea5e9"}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-9 w-12 shrink-0 cursor-pointer p-1"
                />
                <Input id="color" value={color} onChange={(e) => setColor(e.target.value)} placeholder="#0ea5e9" />
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-border p-3 sm:col-span-2">
              <button
                type="button"
                onClick={() => setFeatured((v) => !v)}
                className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  featured ? "bg-primary" : "bg-muted"
                }`}
                role="switch"
                aria-checked={featured}
                aria-label="Tampilkan di Menu Header"
              >
                <span
                  className={`inline-block size-4 transform rounded-full bg-white transition-transform ${
                    featured ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <div>
                <p className="text-sm font-medium">Tampilkan di Menu Header</p>
                <p className="text-xs text-muted-foreground">Produk ini muncul di mega-menu "Aplikasi" &amp; menu mobile</p>
              </div>
            </div>
          </div>
          <div className={field}>
            <ImageUpload value={image} onChange={setImage} label="Gambar Utama" aspectRatio="wide" />
          </div>
        </div>

        <div className={field}>
          <Label>Platform (pilih satu atau lebih) *</Label>
          <div className="flex flex-wrap gap-2">
            {platforms.map((p) => {
              const checked = platformIds.includes(p.id)
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePlatform(p.id)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    checked
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-transparent hover:bg-accent"
                  }`}
                >
                  <span className="font-medium">{p.name}</span>
                  {checked && <span className="text-xs">✓</span>}
                </button>
              )
            })}
          </div>
        </div>

        <div className={field}>
          <Label htmlFor="description">Deskripsi *</Label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className={textareaClass}
            placeholder="Deskripsi lengkap software..."
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className={field}>
            <Label htmlFor="benefits">Manfaat Produk (1 per baris)</Label>
            <textarea
              id="benefits"
              value={benefits}
              onChange={(e) => setBenefits(e.target.value)}
              rows={5}
              className={textareaClass}
              placeholder={"Menghemat waktu operasional 50%\nLaporan keuangan real-time\nMudah digunakan tanpa pelatihan panjang"}
            />
          </div>
          <div className={field}>
            <Label htmlFor="highlights">Highlights (1 per baris)</Label>
            <textarea
              id="highlights"
              value={highlights}
              onChange={(e) => setHighlights(e.target.value)}
              rows={5}
              className={textareaClass}
              placeholder={"Fitur unggulan 1\nFitur unggulan 2"}
            />
          </div>
        </div>

        <div className={field}>
          <Label htmlFor="specs">Spesifikasi (format: Label: Nilai, 1 per baris)</Label>
          <textarea
            id="specs"
            value={specsText}
            onChange={(e) => setSpecsText(e.target.value)}
            rows={4}
            className={textareaClass}
            placeholder={"Platform: Windows\nDatabase: MySQL"}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Gallery Images</Label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {gallery.map((img, idx) => (
              <div key={idx} className="relative aspect-video flex items-center justify-center overflow-hidden rounded-none bg-muted/20 p-1">
                <img src={img} alt={`Gallery ${idx + 1}`} className="max-h-full max-w-full object-contain" />
                <button
                  type="button"
                  onClick={() => setGallery((prev) => prev.filter((_, i) => i !== idx))}
                  className="absolute right-1.5 top-1.5 rounded-lg bg-destructive p-1 text-destructive-foreground shadow-md transition-transform hover:scale-110"
                  aria-label="Hapus gambar"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
            {gallery.length < 8 && (
              <ImageUpload value="" onChange={(url) => setGallery((prev) => [...prev, url])} aspectRatio="wide" />
            )}
          </div>
        </div>

        <div className={field}>
          <Label>Link Download (Produk Digital)</Label>
          {downloadLinks.map((dl, idx) => (
            <div key={idx} className="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)_6rem_auto] items-center gap-2">
              <Input
                value={dl.label}
                onChange={(e) => {
                  const next = [...downloadLinks]
                  next[idx] = { ...dl, label: e.target.value }
                  setDownloadLinks(next)
                }}
                placeholder="Label (cth: Installer v1.0)"
              />
              <Input
                value={dl.url}
                onChange={(e) => {
                  const next = [...downloadLinks]
                  next[idx] = { ...dl, url: e.target.value }
                  setDownloadLinks(next)
                }}
                placeholder="https://drive.google.com/..."
              />
              <Input
                value={dl.size ?? ""}
                onChange={(e) => {
                  const next = [...downloadLinks]
                  next[idx] = { ...dl, size: e.target.value }
                  setDownloadLinks(next)
                }}
                placeholder="45 MB"
              />
              <Button
                size="icon-sm"
                variant="ghost"
                className="text-destructive"
                aria-label="Hapus link"
                onClick={() => setDownloadLinks((prev) => prev.filter((_, i) => i !== idx))}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => setDownloadLinks((prev) => [...prev, { label: "", url: "", size: "" }])}
          >
            <Plus className="size-4" />
            Tambah Link
          </Button>
        </div>

        <div className={field}>
          <Label htmlFor="installTutorial">Tutorial Instalasi</Label>
          <textarea
            id="installTutorial"
            value={installTutorial}
            onChange={(e) => setInstallTutorial(e.target.value)}
            rows={6}
            className={`${textareaClass} font-mono`}
            placeholder={"1. Download installer dari link di atas\n2. Run as Administrator\n3. Ikuti wizard instalasi"}
          />
        </div>
      </div>
      <Separator />
      <DialogFooter className="gap-2 p-4">
        <Button variant="outline" onClick={onCancel} disabled={saving}>Batal</Button>
        <Button onClick={handleSave} disabled={saving}>
          {initial && !asNew ? "Simpan Perubahan" : "Tambah Produk"}
        </Button>
      </DialogFooter>
    </div>
  )
}

export function ProductsPage() {
  const navigate = useNavigate()
  const { products, addProduct, updateProduct, deleteProduct, resetProducts } = useProducts()
  const { categories: apiCategories } = useMasterData()
  const categories = apiCategories.length > 0 ? apiCategories : fallbackCategories

  const [search, setSearch] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [editState, setEditState] = useState<EditState>({ mode: "add", product: null })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showCategories, setShowCategories] = useState(false)

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
      const matchCategory = filterCategory === "all" || p.category === filterCategory
      return matchSearch && matchCategory
    })
  }, [products, search, filterCategory])

  const totalValue = products.reduce((sum, p) => sum + p.price, 0)
  const avgPrice = products.length > 0 ? Math.round(totalValue / products.length) : 0

  const handleAdd = () => {
    setEditState({ mode: "add", product: null })
    setDialogOpen(true)
  }

  const handleEdit = (product: Product) => {
    setEditState({ mode: "edit", product })
    setDialogOpen(true)
  }

  // Form Tambah Produk terisi data produk lain; baru tersimpan saat Tambah Produk ditekan
  const handleCopy = (product: Product) => {
    setEditState({ mode: "copy", product })
    setDialogOpen(true)
  }

  const [saving, setSaving] = useState(false)
  const handleSave = async (data: Omit<Product, "id"> | Product) => {
    if ("id" in data) {
      updateProduct(data.id, data)
      toast.success("Produk diperbarui", { description: data.name })
      setDialogOpen(false)
      return
    }
    setSaving(true)
    try {
      await addProduct(data)
      toast.success("Produk ditambahkan", { description: data.name })
      setDialogOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan produk")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const product = products.find((p) => p.id === id)
    try {
      await deleteProduct(id)
      toast.success("Produk dihapus", { description: product?.name })
      setDeleteId(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus produk")
    }
  }

  const handleReset = () => {
    resetProducts()
    toast.success("Produk direset ke default")
  }

  // Category management
  const [catForm, setCatForm] = useState({ id: "", name: "", tagline: "", icon: "Package", gradient: "from-slate-50 to-slate-100" })
  const [editCat, setEditCat] = useState<any | null>(null)
  const [savingCat, setSavingCat] = useState(false)

  const resetCatForm = () => {
    setCatForm({ id: "", name: "", tagline: "", icon: "Package", gradient: "from-slate-50 to-slate-100" })
    setEditCat(null)
    setShowCategories(false)
  }

  const handleCatSave = async () => {
    if (!catForm.name) {
      toast.error("Nama kategori wajib diisi")
      return
    }
    setSavingCat(true)
    try {
      const method = editCat ? "PUT" : "POST"
      const url = editCat ? `/api/categories/${editCat.id}` : "/api/categories"
      const body = editCat
        ? { name: catForm.name, tagline: catForm.tagline, icon: catForm.icon, gradient: catForm.gradient }
        : {
            id: catForm.id || catForm.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
            name: catForm.name,
            tagline: catForm.tagline,
            icon: catForm.icon,
            gradient: catForm.gradient,
          }
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Gagal simpan kategori")
      }
      toast.success(editCat ? "Kategori diperbarui" : "Kategori ditambahkan")
      resetCatForm()
      setTimeout(() => window.location.reload(), 800)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal simpan")
    } finally {
      setSavingCat(false)
    }
  }

  const handleCatDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus kategori "${name}"?`)) return
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE", headers: authHeaders() })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Gagal hapus")
      }
      toast.success("Kategori dihapus")
      setTimeout(() => window.location.reload(), 800)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal hapus")
    }
  }

  const startEditCat = (cat: any) => {
    setEditCat(cat)
    setCatForm({
      id: cat.id,
      name: cat.name,
      tagline: cat.tagline || "",
      icon: cat.icon || "Package",
      gradient: cat.gradient || "from-slate-50 to-slate-100",
    })
    setShowCategories(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Package className="size-6" />
            Manajemen Produk
          </h1>
          <p className="text-sm text-muted-foreground">Kelola katalog software Anda</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowCategories((s) => !s)}>
            <Layers className="size-4" />
            Kategori
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="size-4" />
            Reset
          </Button>
          <Button size="sm" onClick={handleAdd}>
            <Plus className="size-4" />
            Tambah Produk
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Produk</p>
          <p className="text-2xl font-bold">{products.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Nilai Katalog</p>
          <p className="text-2xl font-bold">{formatPrice(totalValue)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Harga Rata-rata</p>
          <p className="text-2xl font-bold">{formatPrice(avgPrice)}</p>
        </div>
      </div>

      {/* Category manager */}
      {showCategories && (
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Master Data Kategori</h2>
            <Button size="sm" variant="ghost" onClick={resetCatForm}>Tutup</Button>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-3">
            {!editCat && (
              <div className="flex flex-col gap-1">
                <Label>ID (slug)</Label>
                <Input value={catForm.id} onChange={(e) => setCatForm({ ...catForm, id: e.target.value })} placeholder="otomatis dari nama" className="text-sm" />
              </div>
            )}
            <div className="flex flex-col gap-1">
              <Label>Nama Kategori *</Label>
              <Input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} placeholder="Contoh: Education" className="text-sm" />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Tagline</Label>
              <Input value={catForm.tagline} onChange={(e) => setCatForm({ ...catForm, tagline: e.target.value })} placeholder="Sekolah & akademik" className="text-sm" />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Icon (Lucide)</Label>
              <Input value={catForm.icon} onChange={(e) => setCatForm({ ...catForm, icon: e.target.value })} placeholder="GraduationCap" className="text-sm" />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Gradient (Tailwind)</Label>
              <Input value={catForm.gradient} onChange={(e) => setCatForm({ ...catForm, gradient: e.target.value })} placeholder="from-sky-50 to-sky-100" className="text-sm" />
            </div>
          </div>
          <div className="mb-4 flex gap-2">
            <Button size="sm" onClick={handleCatSave} disabled={savingCat}>
              {savingCat && <Loader2 className="size-4 animate-spin" />}
              {editCat ? "Update" : "Simpan"}
            </Button>
            <Button size="sm" variant="outline" onClick={resetCatForm}>Batal</Button>
          </div>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Nama</th>
                  <th className="px-3 py-2 text-left font-medium">Tagline</th>
                  <th className="px-3 py-2 text-center font-medium">Produk</th>
                  <th className="px-3 py-2 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2 font-medium">{c.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{c.tagline || "-"}</td>
                    <td className="px-3 py-2 text-center">{c.count ?? 0}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon-sm" variant="ghost" onClick={() => startEditCat(c)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button size="icon-sm" variant="ghost" className="text-destructive" onClick={() => handleCatDelete(c.id, c.name)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari produk..." className="pl-9" />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Product table */}
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium text-muted-foreground">Produk</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Kategori</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Harga</th>
              <th className="hidden px-4 py-3 font-medium text-muted-foreground md:table-cell">Versi</th>
              <th className="hidden px-4 py-3 font-medium text-muted-foreground md:table-cell">Badge</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Menu</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  Tidak ada produk ditemukan
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-none bg-muted/20 p-0.5">
                        <img src={p.image} alt={p.name} className="max-h-full max-w-full object-contain" />
                      </div>
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                  <td className="px-4 py-3 font-semibold">{formatPrice(p.price)}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{p.version}</td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    {p.badge ? <Badge variant="secondary">{p.badge}</Badge> : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => {
                        updateProduct(p.id, { featured: !p.featured })
                        toast.success(
                          p.featured ? "Dihapus dari menu" : "Ditambahkan ke menu",
                          { description: p.name }
                        )
                      }}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        p.featured ? "bg-primary" : "bg-muted"
                      }`}
                      role="switch"
                      aria-checked={p.featured}
                      title={p.featured ? "Tampil di menu" : "Tidak tampil di menu"}
                    >
                      <span
                        className={`inline-block size-3.5 transform rounded-full bg-white transition-transform ${
                          p.featured ? "translate-x-5" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon-sm" variant="ghost" onClick={() => navigate(`/product/${p.id}`)}>
                        <Eye className="size-4" />
                      </Button>
                      <Button size="icon-sm" variant="ghost" onClick={() => handleEdit(p)} title="Edit" aria-label="Edit produk">
                        <Pencil className="size-4" />
                      </Button>
                      <Button size="icon-sm" variant="ghost" onClick={() => handleCopy(p)} title="Salin produk" aria-label="Salin produk">
                        <Copy className="size-4" />
                      </Button>
                      <Button size="icon-sm" variant="ghost" className="text-destructive" onClick={() => setDeleteId(p.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="gap-0 p-0 sm:max-w-5xl">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>
              {editState.mode === "edit" ? "Edit Produk" : editState.mode === "copy" ? "Salin Produk" : "Tambah Produk Baru"}
            </DialogTitle>
            <DialogDescription>
              {editState.mode === "edit"
                ? "Perbarui informasi produk"
                : editState.mode === "copy"
                  ? `Data disalin dari ${editState.product?.name}. Ubah seperlunya lalu tekan Tambah Produk.`
                  : "Isi detail produk software baru"}
            </DialogDescription>
          </DialogHeader>
          <ProductForm
            // key memaksa form diisi ulang saat berganti produk atau mode
            key={`${editState.mode}-${editState.product?.id ?? "new"}`}
            initial={editState.product}
            asNew={editState.mode === "copy"}
            saving={saving}
            onSave={handleSave}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus produk?</DialogTitle>
            <DialogDescription>
              Produk hilang dari katalog dan menu. Pesanan, lisensi, dan unduhan pelanggan yang sudah membeli tetap
              tersimpan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Batal</Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>
              <Trash2 className="size-4" />
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
