import { authHeaders } from "@/lib/auth"
import { useState, useRef, useCallback } from "react"
import imageCompression from "browser-image-compression"
import { Loader2, Upload, X, ImageIcon } from "lucide-react"
import { toast } from "sonner"

type ImageUploadProps = {
  value?: string
  onChange: (url: string) => void
  label?: string
  aspectRatio?: "square" | "wide"
  className?: string
}

const MAX_SIZE_MB = 2

export function ImageUpload({
  value,
  onChange,
  label = "Gambar",
  aspectRatio = "wide",
  className = "",
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    async (file: File) => {
      // Validasi tipe file
      const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"]
      if (!allowed.includes(file.type)) {
        toast.error("Format harus JPG, PNG, WebP, atau GIF")
        return
      }

      // Validasi size sebelum kompres (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Ukuran file terlalu besar (max 10MB)")
        return
      }

      setIsUploading(true)

      try {
        // Kompres di sisi client sebelum upload
        const compressed = await imageCompression(file, {
          maxSizeMB: MAX_SIZE_MB,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
          fileType: "image/jpeg",
        })

        // Upload ke backend → R2
        const formData = new FormData()
        formData.append("image", compressed, file.name.replace(/\.(png|gif|webp)$/i, ".jpg"))

        const res = await fetch("/api/upload", {
          method: "POST",
          headers: authHeaders(),
          body: formData,
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || "Upload gagal")
        }

        const data = await res.json()
        onChange(data.url)
        toast.success(`Gambar terupload (${data.sizeFormatted})`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload gagal"
        toast.error(msg)
      } finally {
        setIsUploading(false)
      }
    },
    [onChange]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const aspectClass =
    aspectRatio === "square" ? "aspect-square" : "aspect-video"

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <Label>{label}</Label>}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isUploading && inputRef.current?.click()}
        className={`relative ${aspectClass} cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-input hover:border-muted-foreground/40"
        }`}
      >
        {value ? (
          <>
            <img
              src={value}
              alt="Preview"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all hover:bg-black/40 hover:opacity-100">
              <p className="flex items-center gap-2 text-sm font-medium text-white">
                <Upload className="size-4" /> Ganti gambar
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onChange("")
              }}
              className="absolute right-2 top-2 rounded-lg bg-destructive p-1.5 text-destructive-foreground shadow-md transition-transform hover:scale-110"
            >
              <X className="size-4" />
            </button>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            {isUploading ? (
              <>
                <Loader2 className="size-8 animate-spin" />
                <p className="text-xs">Mengupload & kompres...</p>
              </>
            ) : (
              <>
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  {isDragging ? (
                    <Upload className="size-6" />
                  ) : (
                    <ImageIcon className="size-6" />
                  )}
                </div>
                <p className="text-sm font-medium">
                  {isDragging ? "Lepaskan di sini" : "Drag & drop atau klik"}
                </p>
                <p className="text-xs">JPG/PNG/WebP · Max 10MB · Auto-kompres</p>
              </>
            )}
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ""
        }}
      />
    </div>
  )
}

// Inline Label to avoid import issues
function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
      {children}
    </label>
  )
}
