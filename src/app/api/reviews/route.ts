import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demo";
import { listProductReviews, getProductBySlug } from "@/lib/store-data";
import { getSessionUser } from "@/lib/auth";
import { cleanText, guard, intInRange } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const slug = sp.get("slug") ?? "";
  const productId = Number(sp.get("product") ?? 0);

  let pid = productId;
  if (!pid && slug) {
    const row = await getProductBySlug(slug);
    pid = row?.id ?? 0;
  }
  if (!pid) return NextResponse.json({ items: [], summary: null });

  if (isDemoMode()) {
    const items = await listProductReviews(pid);
    const sum = items.reduce((s, r) => s + r.rating, 0);
    return NextResponse.json({
      items,
      summary: {
        avg: items.length ? Math.round((sum / items.length) * 100) / 100 : 0,
        count: items.length,
        dist: [5, 4, 3, 2, 1].map((star) => items.filter((r) => r.rating === star).length),
      },
      demo: true,
    });
  }

  const { db } = await import("@/db");
  const { reviews } = await import("@/db/schema");
  const { and, desc, eq } = await import("drizzle-orm");
  const user = await getSessionUser();
  const includePending = user?.role === "admin";

  const items = await db
    .select()
    .from(reviews)
    .where(includePending ? eq(reviews.productId, pid) : and(eq(reviews.productId, pid), eq(reviews.isApproved, true)))
    .orderBy(desc(reviews.createdAt))
    .limit(60);

  const approved = items.filter((r) => r.isApproved);
  const sum = approved.reduce((s, r) => s + r.rating, 0);

  return NextResponse.json({
    items,
    summary: {
      avg: approved.length ? Math.round((sum / approved.length) * 100) / 100 : 0,
      count: approved.length,
      dist: [5, 4, 3, 2, 1].map((star) => approved.filter((r) => r.rating === star).length),
    },
  });
}

export async function POST(req: Request) {
  if (isDemoMode()) {
    return NextResponse.json({ error: "در حالت نمایشی امکان ثبت نقد نیست" }, { status: 503 });
  }

  const blocked = guard(req, { route: "reviews", limit: 8, windowMs: 10 * 60_000 });
  if (blocked) return blocked;

  const user = await getSessionUser();
  const body = await req.json().catch(() => ({}));
  const productId = Number(body.productId);
  const rating = intInRange(body.rating, 1, 5, 5);
  const name = cleanText(body.name ?? user?.name ?? "خریدار", 60);
  const text = body.body ? cleanText(body.body, 1000) : "";
  if (!productId || !name) {
    return NextResponse.json({ error: "اطلاعات ناقص است" }, { status: 400 });
  }

  const { db } = await import("@/db");
  const { reviews, orderItems, orders } = await import("@/db/schema");
  const { and, eq, sql } = await import("drizzle-orm");

  let verified = false;
  if (user) {
    const bought = await db
      .select({ id: orderItems.id })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(and(eq(orderItems.productId, productId), eq(orders.customerId, user.id), sql`${orders.status} <> 'cancelled'`))
      .limit(1);
    verified = bought.length > 0;
  }

  const [row] = await db
    .insert(reviews)
    .values({
      productId,
      customerId: user?.id ?? null,
      name,
      rating,
      body: text || null,
      isApproved: verified || user?.role === "admin",
    })
    .returning();

  return NextResponse.json({ ok: true, item: row });
}
