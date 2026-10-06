import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { CARD_COLUMNS } from "@/lib/queries";
import { cleanText, escapeLike, guard, intInRange } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const q = escapeLike((sp.get("q") ?? "").trim().slice(0, 80));
  const cat = (sp.get("cat") ?? "").trim().slice(0, 80);
  const slug = (sp.get("slug") ?? "").trim().slice(0, 120);
  const sort = sp.get("sort") ?? "popular";
  const admin = sp.get("all") === "1";
  if (admin) {
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }
  const limit = Math.min(Number(sp.get("limit") ?? 48) || 48, admin ? 500 : 100);

  const conds = [];
  if (!admin) conds.push(eq(products.isActive, true));
  if (slug) conds.push(eq(products.slug, slug));
  if (cat) conds.push(eq(categories.slug, cat));
  if (q) {
    conds.push(
      or(
        ilike(products.name, `%${q}%`),
        ilike(products.brand, `%${q}%`),
        ilike(products.sku, `%${q}%`),
        ilike(products.barcode, `%${q}%`),
        ilike(categories.name, `%${q}%`),
      )!,
    );
  }

  const order =
    sort === "cheap"
      ? [asc(products.price)]
      : sort === "expensive"
        ? [desc(products.price)]
        : sort === "new"
          ? [desc(products.createdAt)]
          : [desc(products.isPopular), desc(products.id)];

  const rows = await db
    .select({
      ...CARD_COLUMNS,
      categoryId: products.categoryId,
      categorySlug: categories.slug,
      categoryName: categories.name,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(...order)
    .limit(limit);

  return NextResponse.json({ items: rows, count: rows.length });
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "نام محصول لازم است" }, { status: 400 });

  const slug = `${slugify(name)}-${Date.now().toString(36).slice(-4)}`;
  const created = await db
    .insert(products)
    .values({
      slug,
      name,
      brand: body.brand ? String(body.brand) : null,
      categoryId: body.categoryId ? Number(body.categoryId) : null,
      image: body.image ? String(body.image) : null,
      description: body.description ? String(body.description) : null,
      unit: body.unit ? String(body.unit) : "عدد",
      sizeLabel: body.sizeLabel ? String(body.sizeLabel) : null,
      sku: body.sku ? String(body.sku) : `MS-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: body.barcode ? String(body.barcode) : null,
      price: Number(body.price) || 0,
      wholesalePrice: body.wholesalePrice ? Number(body.wholesalePrice) : null,
      wholesaleMin: Number(body.wholesaleMin) || 12,
      discount: Number(body.discount) || 0,
      stock: Number(body.stock) || 0,
      lowStockAt: Number(body.lowStockAt) || 10,
      isPopular: Boolean(body.isPopular),
      isActive: body.isActive === undefined ? true : Boolean(body.isActive),
    })
    .returning({ id: products.id });

  return NextResponse.json({ id: created[0]?.id, slug });
}

export async function stockCount() {
  const [row] = await db.select({ c: sql<number>`count(*)::int` }).from(products);
  return row?.c ?? 0;
}
