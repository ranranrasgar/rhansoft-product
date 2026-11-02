// ============================================================
//  Migrasi gambar lokal → Cloudflare R2
//  - Scan semua gambar di ../public/img/
//  - Kompres dengan sharp (max 1200px, JPEG quality 80)
//  - Upload ke R2 dengan path yang sama
//  - Update path di database products.image & gallery
// ============================================================
import dotenv from "dotenv"
import fs from "fs"
import path from "path"
import sharp from "sharp"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { Pool } from "pg"
import { fileURLToPath } from "url"

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ── Config R2 ──
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET = process.env.R2_BUCKET_NAME
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "")

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET || !R2_PUBLIC_URL) {
  console.error("❌ R2 belum dikonfigurasi di .env")
  process.exit(1)
}

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "rhansoft_store",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
})

const LOCAL_IMG_DIR = path.join(__dirname, "..", "public", "img")

// ── Helper: kompres & upload file ──
async function compressAndUpload(localPath, r2Key) {
  const buffer = await fs.promises.readFile(localPath)
  const ext = path.extname(localPath).toLowerCase()

  let processedBuffer
  let contentType

  if (ext === ".jpg" || ext === ".jpeg") {
    processedBuffer = await sharp(buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer()
    contentType = "image/jpeg"
  } else if (ext === ".png") {
    // PNG → convert ke JPEG jika besar, tapi kalau kecil tetap PNG
    const metadata = await sharp(buffer).metadata()
    if (buffer.length > 500 * 1024) {
      processedBuffer = await sharp(buffer)
        .resize({ width: 1200, withoutEnlargement: true })
        .jpeg({ quality: 80, mozjpeg: true })
        .toBuffer()
      contentType = "image/jpeg"
      r2Key = r2Key.replace(/\.png$/i, ".jpg")
    } else {
      processedBuffer = await sharp(buffer)
        .resize({ width: 1200, withoutEnlargement: true })
        .png({ compressionLevel: 9 })
        .toBuffer()
      contentType = "image/png"
    }
  } else if (ext === ".webp") {
    processedBuffer = await sharp(buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer()
    contentType = "image/webp"
  } else if (ext === ".gif") {
    // GIF tetap apa adanya (animasi bisa rusak)
    processedBuffer = buffer
    contentType = "image/gif"
  } else {
    throw new Error(`Unsupported format: ${ext}`)
  }

  // Jika masih > 500KB, kompres lebih agresif
  if (processedBuffer.length > 500 * 1024 && contentType !== "image/gif") {
    let quality = 70
    while (processedBuffer.length > 500 * 1024 && quality > 30) {
      processedBuffer = await sharp(buffer)
        .resize({ width: 1000, withoutEnlargement: true })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer()
      contentType = "image/jpeg"
      r2Key = r2Key.replace(/\.(png|webp)$/i, ".jpg")
      quality -= 10
    }
  }

  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: r2Key,
      Body: processedBuffer,
      ContentType: contentType,
    })
  )

  return {
    r2Key,
    publicUrl: `${R2_PUBLIC_URL}/${r2Key}`,
    size: processedBuffer.length,
    contentType,
  }
}

// ── Helper: recursive scan files ──
function walkDir(dir, base = "") {
  const results = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    const relPath = base ? `${base}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath, relPath))
    } else {
      const ext = path.extname(entry.name).toLowerCase()
      if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)) {
        results.push({
          fullPath,
          relPath: `img/${relPath}`,
          r2Key: `img/${relPath}`,
        })
      }
    }
  }
  return results
}

// ── Main ──
async function main() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("  Migrasi Gambar Lokal → Cloudflare R2")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log(`  Source : ${LOCAL_IMG_DIR}`)
  console.log(`  Bucket : ${R2_BUCKET}`)
  console.log(`  Public : ${R2_PUBLIC_URL}`)
  console.log("────────────────────────────────────────────────────")

  // Cek folder lokal ada
  if (!fs.existsSync(LOCAL_IMG_DIR)) {
    console.error("❌ Folder public/img tidak ditemukan:", LOCAL_IMG_DIR)
    process.exit(1)
  }

  // Scan semua file gambar
  const files = walkDir(LOCAL_IMG_DIR)
  console.log(`📁 Ditemukan ${files.length} file gambar\n`)

  // Upload semua gambar ke R2
  const pathMap = {} // localPath → R2 URL
  let uploaded = 0
  let failed = 0
  const totalSizeBefore = 0
  let totalSizeAfter = 0

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const localPath = `/img/${file.relPath.replace(/^img\//, "")}`
    try {
      const beforeSize = fs.statSync(file.fullPath).size
      const result = await compressAndUpload(file.fullPath, file.r2Key)
      pathMap[localPath] = result.publicUrl
      totalSizeAfter += result.size

      // Jika path berubah (png → jpg), mapping juga versi baru
      const newLocalPath = localPath.replace(/\.png$/i, ".jpg")
      if (newLocalPath !== localPath) {
        pathMap[newLocalPath] = result.publicUrl
      }

      uploaded++
      if (uploaded % 50 === 0 || uploaded === files.length) {
        console.log(`  [${uploaded}/${files.length}] uploaded...`)
      }
    } catch (err) {
      console.error(`  ❌ ${file.relPath}: ${err.message}`)
      failed++
    }
  }

  console.log(`\n✅ Uploaded: ${uploaded}, Failed: ${failed}`)
  console.log(`   Total size after compress: ${(totalSizeAfter / 1024 / 1024).toFixed(1)} MB\n`)

  // Simpan path map ke file JSON untuk referensi
  const mapFile = path.join(__dirname, "r2_path_map.json")
  fs.writeFileSync(mapFile, JSON.stringify(pathMap, null, 2))
  console.log(`💾 Path map saved: ${mapFile}`)

  // ── Update database ──
  console.log("\n── Updating database paths ──")
  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    // 1. Update products.image
    let imageUpdated = 0
    for (const [localPath, r2Url] of Object.entries(pathMap)) {
      const res = await client.query(
        `UPDATE products SET image = $1 WHERE image = $2`,
        [r2Url, localPath]
      )
      if (res.rowCount > 0) {
        imageUpdated += res.rowCount
        // Juga update varian .png → .jpg
        if (localPath.endsWith(".png")) {
          const jpgPath = localPath.replace(/\.png$/i, ".jpg")
          await client.query(
            `UPDATE products SET image = $1 WHERE image = $2`,
            [r2Url, jpgPath]
          )
        }
      }
    }
    console.log(`  products.image updated: ${imageUpdated} rows`)

    // 2. Update products.gallery (JSONB array)
    const products = await client.query(`SELECT id, gallery FROM products WHERE gallery IS NOT NULL AND gallery::text != '[]'`)
    let galleryUpdated = 0
    for (const p of products.rows) {
      if (!Array.isArray(p.gallery) || p.gallery.length === 0) continue
      let changed = false
      const newGallery = p.gallery.map((url) => {
        if (typeof url === "string") {
          // Coba match exact
          if (pathMap[url]) {
            changed = true
            return pathMap[url]
          }
          // Coba match dengan png→jpg
          if (url.endsWith(".png")) {
            const jpgUrl = url.replace(/\.png$/i, ".jpg")
            if (pathMap[jpgUrl]) {
              changed = true
              return pathMap[jpgUrl]
            }
          }
        }
        return url
      })
      if (changed) {
        await client.query(`UPDATE products SET gallery = $1 WHERE id = $2`, [
          JSON.stringify(newGallery),
          p.id,
        ])
        galleryUpdated++
      }
    }
    console.log(`  products.gallery updated: ${galleryUpdated} rows`)

    // 3. Update products.image untuk path yang pakai /img/ prefix
    const imgProducts = await client.query(`SELECT id, image FROM products WHERE image LIKE '/img/%' OR image LIKE 'img/%'`)
    let imgUpdated = 0
    for (const p of imgProducts.rows) {
      const cleanPath = p.image.startsWith("/") ? p.image : `/${p.image}`
      if (pathMap[cleanPath]) {
        await client.query(`UPDATE products SET image = $1 WHERE id = $2`, [
          pathMap[cleanPath],
          p.id,
        ])
        imgUpdated++
      } else if (cleanPath.endsWith(".png")) {
        const jpgPath = cleanPath.replace(/\.png$/i, ".jpg")
        if (pathMap[jpgPath]) {
          await client.query(`UPDATE products SET image = $1 WHERE id = $2`, [
            pathMap[jpgPath],
            p.id,
          ])
          imgUpdated++
        }
      }
    }
    if (imgUpdated > 0) {
      console.log(`  products.image (remaining /img/) updated: ${imgUpdated} rows`)
    }

    await client.query("COMMIT")
    console.log("\n✅ Database updated successfully!")
  } catch (err) {
    await client.query("ROLLBACK")
    console.error("❌ Database update failed:", err.message)
    throw err
  } finally {
    client.release()
  }

  // ── Verifikasi ──
  console.log("\n── Verifikasi: cek gambar yang masih pakai path lokal ──")
  const remaining = await pool.query(
    `SELECT id, name, image FROM products WHERE image LIKE '/img/%' OR image LIKE 'img/%'`
  )
  if (remaining.rows.length > 0) {
    console.log(`⚠️  Masih ada ${remaining.rows.length} produk dengan path lokal:`)
    for (const r of remaining.rows.slice(0, 5)) {
      console.log(`   - ${r.id}: ${r.image}`)
    }
  } else {
    console.log("✅ Semua produk sudah pakai URL R2!")
  }

  await pool.end()
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("  Migrasi selesai!")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
}

main().catch((err) => {
  console.error("Fatal:", err)
  process.exit(1)
})
