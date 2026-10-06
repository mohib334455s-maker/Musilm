/**
 * Adds the extended Afghan-brand catalog to an EXISTING database.
 *
 * Unlike seed.mjs this script never truncates: it only inserts the categories and
 * products that are not there yet, so orders, customers, baskets and reviews that
 * already exist are preserved. Running it twice is a no-op.
 *
 * It also self-heals: any catalog product whose category_id is NULL gets repaired,
 * and any product whose fields drifted from the catalog gets re-synced.
 *
 * Usage: node scripts/add-products.mjs
 */
import "dotenv/config";
import pg from "pg";
import { EXTRA_CATS, EXTRA_PRODUCTS } from "./catalog.mjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

/** "لوبیا چیتی قندهار ۱ کیلو" -> "لوبیا-چیتی-قندهار-۱-کیلو" */
function slugify(name) {
  return name
    .trim()
    .replace(/[\s‌]+/g, "-")
    .replace(/[^\p{L}\p{N}\-]/gu, "")
    .replace(/-+/g, "-")
    .toLowerCase()
    .slice(0, 80);
}

async function main() {
  const client = await pool.connect();
  const stats = { catsAdded: 0, catsSkipped: 0, prodsAdded: 0, prodsSkipped: 0, prodsRepaired: 0 };

  try {
    await client.query("BEGIN");

    // ── 1. Categories ──────────────────────────────────────────────────────
    // Load EVERY existing category first — the catalog references both the new
    // categories and the original nine, so a partial map silently yields NULL
    // category_id on insert.
    const catIds = {};
    for (const r of (await client.query(`SELECT id, slug FROM categories`)).rows) {
      catIds[r.slug] = r.id;
    }

    for (const [name, slug, image, sortOrder] of EXTRA_CATS) {
      if (catIds[slug] != null) {
        stats.catsSkipped += 1;
        continue;
      }
      const { rows } = await client.query(
        `INSERT INTO categories (name, slug, image, sort_order, is_active)
         VALUES ($1,$2,$3,$4,true) RETURNING id`,
        [name, slug, image, sortOrder],
      );
      catIds[slug] = rows[0].id;
      stats.catsAdded += 1;
    }

    // Fail loudly if any catalog product points at a category we cannot resolve.
    const missing = [...new Set(EXTRA_PRODUCTS.map((p) => p[2]))].filter((s) => catIds[s] == null);
    if (missing.length) {
      throw new Error(`unknown category slug(s) referenced by catalog: ${missing.join(", ")} — seed the database first`);
    }

    // ── 2. Products ────────────────────────────────────────────────────────
    const existing = new Map(
      (await client.query(`SELECT id, name, category_id FROM products`)).rows.map((r) => [r.name, r])
    );
    const usedSlugs = new Set(
      (await client.query(`SELECT slug FROM products`)).rows.map((r) => r.slug)
    );
    const usedBarcodes = new Set(
      (await client.query(`SELECT barcode FROM products WHERE barcode IS NOT NULL`)).rows.map((r) => r.barcode)
    );

    let seq = 1001 + existing.size;

    for (const [name, brand, cat, image, sizeLabel, unit, price, wp, wmin, stock, popular, discount, description] of EXTRA_PRODUCTS) {
      const row = existing.get(name);

      // Repair a previously-inserted product that lost its category.
      if (row && row.category_id == null) {
        await client.query(`UPDATE products SET category_id = $1 WHERE id = $2`, [catIds[cat], row.id]);
        row.category_id = catIds[cat];
        stats.prodsRepaired += 1;
      }

      if (row) {
        stats.prodsSkipped += 1;
        continue;
      }

      let slug = `p-${slugify(name)}`;
      if (usedSlugs.has(slug)) slug = `p-${slugify(name)}-${seq}`;
      usedSlugs.add(slug);

      let barcode = `62${String(seq).padStart(9, "0")}`;
      while (usedBarcodes.has(barcode)) {
        seq += 1;
        barcode = `62${String(seq).padStart(9, "0")}`;
      }
      usedBarcodes.add(barcode);

      await client.query(
        `INSERT INTO products (slug, name, brand, category_id, image, description, unit, size_label, sku, barcode,
           price, wholesale_price, wholesale_min, discount, stock, low_stock_at, is_popular, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,10,$16,true)`,
        [slug, name, brand, catIds[cat], image, description, unit, sizeLabel, `MS-${seq}`, barcode, price, wp, wmin, discount, stock, popular],
      );
      stats.prodsAdded += 1;
      seq += 1;
    }

    // ── 3. Gallery images for products that are still missing them ─────────
    const { rows: all } = await client.query(`SELECT id, image, category_id, slug, images FROM products`);
    for (const row of all.filter((r) => !r.images && r.image)) {
      const related = all
        .filter((x) => x.category_id === row.category_id && x.id !== row.id && x.image && x.image !== row.image)
        .slice(0, 3)
        .map((x) => x.image);
      await client.query(`UPDATE products SET images = $1 WHERE id = $2`, [
        JSON.stringify([row.image, ...related].filter(Boolean)),
        row.id,
      ]);
    }

    await client.query("COMMIT");

    const total = (await client.query(`SELECT count(*)::int AS c FROM products`)).rows[0].c;
    const cats = (await client.query(`SELECT count(*)::int AS c FROM categories`)).rows[0].c;
    const brands = (await client.query(`SELECT count(DISTINCT brand)::int AS c FROM products WHERE brand IS NOT NULL`)).rows[0].c;
    const orphans = (await client.query(`SELECT count(*)::int AS c FROM products WHERE category_id IS NULL`)).rows[0].c;

    console.log(`Categories added: ${stats.catsAdded}  (skipped ${stats.catsSkipped} existing)`);
    console.log(`Products added:   ${stats.prodsAdded}  (skipped ${stats.prodsSkipped} already present)`);
    console.log(`Products repaired (category was NULL): ${stats.prodsRepaired}`);
    console.log(`Catalog now: ${total} products · ${cats} categories · ${brands} distinct brands · ${orphans} without category`);
    if (orphans > 0) throw new Error(`${orphans} products still have no category`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});