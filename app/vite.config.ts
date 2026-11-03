import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  // Absolut: situs dilayani dari akar domain. Base relatif ('./') membuat /assets dicari di
  // /admin/assets, /pembayaran/assets, dst., sehingga halaman bertingkat kosong saat di-refresh.
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          // UI components
          "ui-vendor": [
            "@/components/ui/button",
            "@/components/ui/dialog",
            "@/components/ui/select",
            "@/components/ui/dropdown-menu",
            "@/components/ui/avatar",
            "@/components/ui/input",
            "@/components/ui/badge",
            "@/components/ui/textarea",
          ],
          // Third-party
          "vendor-misc": [
            "@react-oauth/google",
            "sonner",
            "lucide-react",
          ],
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
