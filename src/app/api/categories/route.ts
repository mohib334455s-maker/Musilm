import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demo";
import { listCategories } from "@/lib/store-data";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const admin = sp.get("all") === "1";
  if (admin && !isDemoMode()) {
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  if (isDemoMode() || !admin) {
    const items = await listCategories();
    return NextResponse.json({ items, demo: isDemoMode() });
  }

  const { db } = await import("@/db");
  const { categories, products } = await import("@/db/schema");
  const { asc, eq, sql } = await import("drizzle-orm");
  const rows = await db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      image: categories.image,
      sortOrder: categories.sortOrder,
      isActive: categories.isActive,
      count: sql<number>`count(${products.id})::int`,
    })
    .from(categories)
    .leftJoin(products, sql`${products.categoryId} = ${categories.id} and ${products.isActive} = true`)
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder), asc(categories.id));
  return NextResponse.json({ items: rows });
}

export async function POST(req: Request) {
  if (isDemoMode()) {
    return NextResponse.json({ error: "در حالت نمایشی امکان افزودن دسته نیست" }, { status: 503 });
  }
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { db } = await import("@/db");
  const { categories } = await import("@/db/schema");
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "نام دسته لازم است" }, { status: 400 });
  const created = await db
    .insert(categories)
    .values({
      name,
      slug: String(body.slug ?? "").trim() || `${slugify(name)}-${Date.now().toString(36).slice(-4)}`,
      image: body.image ? String(body.image) : null,
      sortOrder: Number(body.sortOrder) || 0,
      isActive: body.isActive === undefined ? true : Boolean(body.isActive),
    })
    .returning();
  return NextResponse.json({ ok: true, item: created[0] });
}
