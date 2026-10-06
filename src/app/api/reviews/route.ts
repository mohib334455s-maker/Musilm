import { and, desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { orderItems, orders, products, reviews } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { cleanText, guard, intInRange } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const slug = sp.get("slug") ?? "";
  const productId = Number(sp.get("product") ?? 0);
  const user = await getSessionUser();
  const includePending = user?.role === "admin";

  let pid = productId;
  if (!pid && slug) {
    const [row] = await db.select({ id: products.id }).from(products).where(eq(products.slug, slug)).limit(1);
    pid = row?.id ?? 0;
  }
  if (!pid) return NextResponse.json({ items: [], summary: null });

  const items = await db
    .select()
    .from(reviews)
    .where(includePending ? eq(reviews.productId, pid) : and(eq(reviews.productId, pid), eq(reviews.isApproved, true)))
    .orderBy(desc(reviews.createdAt))
    .limit(60);

  const dist = [5, 4, 3, 2, 1].map(
    (star) => items.filter((r) => r.rating === star && r.isApproved).length,
  );
  const approved = items.filter((r) => r.isApproved);
  const sum = approved.reduce((s, r) => s + r.rating, 0);

  return NextResponse.json({
    items,
    summary: {
      avg: approved.length ? Math.round((sum / approved.length) * 100) / 100 : 0,
      count: approved.length,
      dist,
      pending: items.length - approved.length,
    },
  });
}

export async function POST(req: Request) {
  const blocked = guard(req, { route: "reviews", limit: 5, windowMs: 10 * 60_000 });
  if (blocked) return blocked;

  const user = await getSessionUser();
  const body = await req.json().catch(() => ({}));
  const productId = intInRange(body.productId, 1, 1_000_000, 0);
  const rating = intInRange(body.rating, 1, 5, 5);
  const name = cleanText(body.name ?? user?.name ?? "", 60);
  const text = cleanText(body.body, 600);

  if (!productId) return NextResponse.json({ error: "محصول مشخص نیست" }, { status: 400 });
  if (!name) return NextResponse.json({ error: "نام شما لازم است" }, { status: 400 });
  if (text.length > 600) return NextResponse.json({ error: "متن نقد خیلی طولانی است" }, { status: 400 });

  const [product] = await db.select({ id: products.id }).from(products).where(eq(products.id, productId)).limit(1);
  if (!product) return NextResponse.json({ error: "محصول پیدا نشد" }, { status: 404 });

  // verified purchase → publish immediately, otherwise wait for admin approval
  let verified = false;
  if (user) {
    const [row] = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(and(eq(orderItems.productId, productId), eq(orders.customerId, user.id)));
    verified = (row?.c ?? 0) > 0;
  }

  await db.insert(reviews).values({
    productId,
    customerId: user?.id ?? null,
    name,
    rating,
    body: text || null,
    isApproved: verified || user?.role === "admin",
  });

  return NextResponse.json({
    ok: true,
    verified,
    message: verified
      ? "نقد شما به عنوان خریدار ثبت و منتشر شد"
      : "نقد شما ثبت شد و پس از تأیید مدیریت نمایش داده می‌شود",
  });
}
