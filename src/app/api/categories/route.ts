import { asc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const admin = sp.get("all") === "1";
  if (admin) {
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }
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
    .where(admin ? undefined : eq(categories.isActive, true))
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder), asc(categories.id));
  return NextResponse.json({ items: rows });
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "نام دسته لازم است" }, { status: 400 });
  const created = await db
    .insert(categories)
    .values({
      name,
      slug: body.slug ? slugify(String(body.slug)) : slugify(name),
      image: body.image ? String(body.image) : null,
      sortOrder: Number(body.sortOrder) || 0,
      isActive: body.isActive === undefined ? true : Boolean(body.isActive),
    })
    .returning();
  return NextResponse.json({ ok: true, category: created[0] });
}
