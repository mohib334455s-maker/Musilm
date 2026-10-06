import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demo";
import { listProducts } from "@/lib/store-data";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { cleanText, escapeLike, intInRange } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const q = escapeLike((sp.get("q") ?? "").trim().slice(0, 80));
  const cat = (sp.get("cat") ?? "").trim().slice(0, 80);
  const slug = (sp.get("slug") ?? "").trim().slice(0, 120);
  const sort = sp.get("sort") ?? "popular";
  const admin = sp.get("all") === "1";
  const limit = Math.min(Number(sp.get("limit") ?? 48) || 48, admin ? 500 : 100);

  if (admin && !isDemoMode()) {
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const items = await listProducts({
    q: q || undefined,
    cat: cat || undefined,
    slug: slug || undefined,
    sort,
    limit,
    all: admin,
  });

  return NextResponse.json({ items, count: items.length, demo: isDemoMode() });
}

export async function POST(req: Request) {
  if (isDemoMode()) {
    return NextResponse.json({ error: "در حالت نمایشی امکان افزودن محصول نیست" }, { status: 503 });
  }
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { db } = await import("@/db");
  const { products } = await import("@/db/schema");
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
      description: body.description ? cleanText(String(body.description), 2000) : null,
      unit: String(body.unit ?? "عدد"),
      sizeLabel: body.sizeLabel ? String(body.sizeLabel) : null,
      sku: body.sku ? String(body.sku) : null,
      barcode: body.barcode ? String(body.barcode) : null,
      price: intInRange(body.price, 0, 10_000_000, 0),
      wholesalePrice: body.wholesalePrice != null ? intInRange(body.wholesalePrice, 0, 10_000_000, 0) : null,
      wholesaleMin: intInRange(body.wholesaleMin, 1, 10_000, 12),
      discount: intInRange(body.discount, 0, 90, 0),
      stock: intInRange(body.stock, 0, 1_000_000, 0),
      isPopular: Boolean(body.isPopular),
      isActive: body.isActive === undefined ? true : Boolean(body.isActive),
    })
    .returning();

  return NextResponse.json({ ok: true, item: created[0] });
}
