/**
 * Pemuat generator nomor registrasi.
 *
 * Rumus TIDAK ada di repo ini (repo publik). Rumus ada di berkas pribadi di luar git,
 * bawaannya app/server/private/registrasi.mjs (bisa diganti lewat env REG_GENERATOR_PATH).
 * Bentuk berkas pribadi:
 *   export const versions = [
 *     { id: string, label: string, verified: boolean, note?: string, generate: (kodeLisensi: string) => string },
 *   ]
 * Bila berkas tidak ada atau bentuknya salah, generator dianggap tidak tersedia dan fitur
 * Generate di halaman admin tidak muncul.
 */
import path from "node:path"
import { pathToFileURL, fileURLToPath } from "node:url"

const DEFAULT_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "private", "registrasi.mjs")

const UNAVAILABLE = { available: false, versions: [], generate: () => [] }

const publicInfo = (v) => ({
  id: v.id,
  label: v.label,
  verified: Boolean(v.verified),
  ...(v.note ? { note: v.note } : {}),
})

export async function loadRegistrationGenerator(file = process.env.REG_GENERATOR_PATH || DEFAULT_PATH) {
  let mod
  try {
    mod = await import(pathToFileURL(path.resolve(file)).href)
  } catch (err) {
    if (err.code !== "ERR_MODULE_NOT_FOUND") console.error("Generator registrasi gagal dimuat:", err.message)
    return UNAVAILABLE
  }

  const versions = mod.versions
  const valid =
    Array.isArray(versions) &&
    versions.length > 0 &&
    versions.every((v) => v && typeof v.id === "string" && typeof v.label === "string" && typeof v.generate === "function")
  if (!valid) {
    console.error("Generator registrasi: bentuk berkas tidak sesuai, diabaikan")
    return UNAVAILABLE
  }

  return {
    available: true,
    versions: versions.map(publicInfo),
    generate: (code) =>
      versions.map((v) => {
        try {
          return { ...publicInfo(v), number: String(v.generate(code)) }
        } catch (err) {
          return { ...publicInfo(v), error: err.message }
        }
      }),
  }
}
