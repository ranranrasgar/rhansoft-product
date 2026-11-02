// Update store.ts: replace all /img/ paths with R2 URLs
import fs from "fs"
import path from "path"

const R2_PUBLIC_URL = "https://pub-d1a4a777f8474008ac7baf230a1e406c.r2.dev"
const storePath = path.join(process.cwd(), "src/data/store.ts")
const mapPath = path.join(process.cwd(), "server/r2_path_map.json")

const pathMap = JSON.parse(fs.readFileSync(mapPath, "utf8"))

let content = fs.readFileSync(storePath, "utf8")

// Replace all /img/ paths with R2 URLs
for (const [localPath, r2Url] of Object.entries(pathMap)) {
  // Replace in string literals: "/img/xxx" → "https://...img/xxx"
  // Need to handle both "/img/..." and "/img/..." in quotes
  const escaped = localPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const regex = new RegExp(`"${escaped}"`, "g")
  content = content.replace(regex, `"${r2Url}"`)
}

fs.writeFileSync(storePath, content)

// Count remaining /img/ references
const remaining = (content.match(/\/img\//g) || []).length
console.log(`Updated store.ts — remaining /img/ refs: ${remaining}`)
