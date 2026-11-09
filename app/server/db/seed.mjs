#!/usr/bin/env node
/**
 * Seed script — import all categories, products, promos, and hero slides
 * from seed-data.json (extracted from store.ts) into PostgreSQL.
 *
 * Usage:  node server/db/seed.mjs
 */
import pg from "pg"
import dotenv from "dotenv"
import fs from "fs"

dotenv.config()

const { Pool } = pg

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "rhansoft_store",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
})

// ── Load data from JSON ─────────────────────────────────────────
import { fileURLToPath } from "url"
import path from "path"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataPath = path.join(__dirname, "seed-data.json")
let raw = fs.readFileSync(dataPath, "utf-8")
// Strip BOM if present
if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1)
const data = JSON.parse(raw)

const { categories, initialProducts, heroSlides, promos } = data

async function seed() {
  console.log("━".repeat(60))
  console.log("  Rhansoft Store — Database Seeder")
  console.log("━".repeat(60))
  console.log(`  Categories : ${categories.length}`)
  console.log(`  Products   : ${initialProducts.length}`)
  console.log(`  Promos     : ${promos?.length || 0}`)
  console.log(`  Hero       : ${heroSlides?.length || 0}`)
  console.log("─".repeat(60))

  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    // ── Clear existing data ───────────────────────────────────
    console.log("\n🧹 Clearing existing data...")
    await client.query("TRUNCATE order_items, orders, customers, product_highlights, product_specs, products, categories, promos, hero_slides, payment_notifications RESTART IDENTITY CASCADE")

    // ── Insert categories ─────────────────────────────────────
    console.log(`📁 Inserting ${categories.length} categories...`)
    for (let i = 0; i < categories.length; i++) {
      const c = categories[i]
      await client.query(
        `INSERT INTO categories (id, name, tagline, icon, count, gradient, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [c.id, c.name, c.tagline, c.icon, c.count, c.gradient, i]
      )
    }

    // ── Insert products ───────────────────────────────────────
    console.log(`📦 Inserting ${initialProducts.length} products...`)
    for (let i = 0; i < initialProducts.length; i++) {
      const p = initialProducts[i]
      const cat = categories.find((c) => c.name === p.category)
      const categoryId = cat ? cat.id : null

      await client.query(
        `INSERT INTO products
          (id, name, category_id, price, original_price, rating, reviews, badge,
           image, color, description, platform, version, license, download_size,
           gallery, download_links, install_tutorial, featured, is_active, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, TRUE, $20)`,
        [
          p.id,
          p.name,
          categoryId,
          p.price,
          p.originalPrice || null,
          p.rating,
          p.reviews,
          p.badge || null,
          p.image,
          p.color,
          p.description,
          p.platform,
          p.version,
          p.license,
          p.downloadSize,
          JSON.stringify(p.gallery),
          p.downloadLinks ? JSON.stringify(p.downloadLinks) : null,
          p.installTutorial || null,
          p.featured === true,
          i,
        ]
      )

      // Insert specs
      for (let j = 0; j < p.specs.length; j++) {
        await client.query(
          `INSERT INTO product_specs (product_id, label, value, sort_order)
           VALUES ($1, $2, $3, $4)`,
          [p.id, p.specs[j].label, p.specs[j].value, j]
        )
      }

      // Insert highlights
      for (let j = 0; j < p.highlights.length; j++) {
        await client.query(
          `INSERT INTO product_highlights (product_id, highlight, sort_order)
           VALUES ($1, $2, $3)`,
          [p.id, p.highlights[j], j]
        )
      }
    }

    // ── Insert promos ─────────────────────────────────────────
    if (promos && promos.length) {
      console.log(`🎉 Inserting ${promos.length} promos...`)
      for (let i = 0; i < promos.length; i++) {
        const pr = promos[i]
        await client.query(
          `INSERT INTO promos (id, eyebrow, title, subtitle, cta, theme, image, is_active, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, $8)`,
          [pr.id, pr.eyebrow, pr.title, pr.subtitle, pr.cta, pr.theme, pr.image, i]
        )
      }
    }

    // ── Insert hero slides ────────────────────────────────────
    if (heroSlides && heroSlides.length) {
      console.log(`🖼️  Inserting ${heroSlides.length} hero slides...`)
      for (let i = 0; i < heroSlides.length; i++) {
        const h = heroSlides[i]
        await client.query(
          `INSERT INTO hero_slides (id, eyebrow, title, subtitle, cta, secondary_cta, image, align, color, sort_order, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE)`,
          [
            h.id,
            h.eyebrow,
            h.title,
            h.subtitle,
            h.cta,
            h.secondaryCta || null,
            h.image,
            h.align,
            h.color,
            i,
          ]
        )
      }
    }

    // ── Update category counts ────────────────────────────────
    console.log("🔄 Updating category counts...")
    await client.query(`
      UPDATE categories c
      SET count = (
        SELECT COUNT(*) FROM products p
        WHERE p.category_id = c.id AND p.is_active = TRUE
      )
    `)

    await client.query("COMMIT")

    console.log("\n✅ Seed completed successfully!")
    console.log("━".repeat(60))
  } catch (err) {
    await client.query("ROLLBACK")
    console.error("❌ Seed failed:", err.message)
    console.error(err.stack)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

seed()
