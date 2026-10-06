import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { coupons, orderItems, orders, products, zones } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { cleanPhone, cleanText, guard, intInRange } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sp = new URL(req.url).searchParams;
  const status = sp.get("status") ?? "";
  const q = sp.get("q")?.trim() ?? "";

  const conds = [];
  if (user.role !== "admin") conds.push(eq(orders.customerId, user.id));
  if (status) conds.push(eq(orders.status, status));
  if (q) {
    conds.push(
      or(
        ilike(orders.number, `%${q}%`),
        ilike(orders.customerName, `%${q}%`),
        ilike(orders.phone, `%${q}%`),
      )!,
    );
  }

  const rows = await db
    .select()
    .from(orders)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(orders.id))
    .limit(200);

  const ids = rows.map((r) => r.id);
  const items = ids.length
    ? await db.select().from(orderItems).where(inArray(orderItems.orderId, ids))
    : [];

  return NextResponse.json({
    items: rows.map((r) => ({ ...r, items: items.filter((i) => i.orderId === r.id) })),
  });
}

export async function POST(req: Request) {
  const blocked = guard(req, { route: "orders", limit: 10, windowMs: 10 * 60_000 });
  if (blocked) return blocked;

  const body = await req.json().catch(() => ({}));
  const user = await getSessionUser();
  const s = await getSettings();

  const lines: { id: number; qty: number }[] = Array.isArray(body.items) ? body.items : [];
  if (!lines.length) return NextResponse.json({ error: "سبد خرید خالی است" }, { status: 400 });

  const ids = lines.map((l) => Number(l.id)).filter(Boolean);
  const rows = await db.select().from(products).where(inArray(products.id, ids));
  const map = new Map(rows.map((r) => [r.id, r]));

  const customerName = cleanText(body.customerName ?? user?.name ?? "", 60);
  const phone = cleanPhone(body.phone ?? user?.phone ?? "");
  const address = cleanText(body.address, 300);
  const delivery = body.delivery === "pickup" ? "pickup" : "delivery";

  if (!customerName || !phone) {
    return NextResponse.json({ error: "نام و شماره تماس لازم است" }, { status: 400 });
  }
  if (delivery === "delivery" && !address) {
    return NextResponse.json({ error: "آدرس تحویل لازم است" }, { status: 400 });
  }

  let subtotal = 0;
  const items: {
    productId: number;
    name: string;
    sizeLabel: string | null;
    unitPrice: number;
    qty: number;
    priceType: string;
    lineTotal: number;
  }[] = [];

  for (const line of lines) {
    const product = map.get(Number(line.id));
    const qty = Math.max(1, Math.min(Number(line.qty) || 1, 999));
    if (!product || !product.isActive) continue;
    if (product.stock < qty) {
      return NextResponse.json(
        { error: `موجودی «${product.name}» کافی نیست — ${product.stock} عدد باقی مانده` },
        { status: 409 },
      );
    }
    const wholesale = product.wholesalePrice != null && qty >= product.wholesaleMin;
    const unit = wholesale
      ? product.wholesalePrice!
      : product.discount > 0
        ? Math.round((product.price * (100 - product.discount)) / 100)
        : product.price;
    const lineTotal = unit * qty;
    subtotal += lineTotal;
    items.push({
      productId: product.id,
      name: product.name,
      sizeLabel: product.sizeLabel,
      unitPrice: unit,
      qty,
      priceType: wholesale ? "wholesale" : "retail",
      lineTotal,
    });
  }

  if (!items.length) return NextResponse.json({ error: "محصولات سبد معتبر نیست" }, { status: 400 });

  let discount = 0;
  const couponCode = body.coupon ? String(body.coupon).trim().toUpperCase() : null;
  if (couponCode) {
    const [coupon] = await db
      .select()
      .from(coupons)
      .where(and(eq(coupons.code, couponCode), eq(coupons.isActive, true)))
      .limit(1);
    if (coupon && subtotal >= coupon.minOrder) {
      discount = coupon.percent > 0 ? Math.round((subtotal * coupon.percent) / 100) : coupon.amount;
      discount = Math.min(discount, subtotal);
    }
  }

  let deliveryFee = 0;
  let zoneName: string | null = null;
  let zoneId: number | null = null;

  if (delivery === "delivery") {
    const zoneRows = await db.select().from(zones).where(eq(zones.isActive, true));
    const zone = zoneRows.find((z) => z.id === Number(body.zoneId)) ?? zoneRows[0] ?? null;
    const globalThreshold = Number(s.freeDeliveryThreshold) || 0;
    if (zone) {
      zoneId = zone.id;
      zoneName = zone.name;
      const threshold = zone.freeOver > 0 ? zone.freeOver : globalThreshold;
      const afterDiscount = subtotal - discount;
      if (afterDiscount < zone.minOrder) {
        return NextResponse.json(
          { error: `حداقل سفارش برای ${zone.name} ${zone.minOrder} افغانی است` },
          { status: 400 },
        );
      }
      deliveryFee = afterDiscount >= threshold ? 0 : zone.fee;
    } else {
      deliveryFee = subtotal - discount >= globalThreshold ? 0 : Number(s.defaultDeliveryFee) || 0;
      zoneName = s.city;
    }
  }

  const total = Math.max(0, subtotal - discount + deliveryFee);
  const number = `MS-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`;

  const [order] = await db
    .insert(orders)
    .values({
      number,
      customerId: user?.id ?? null,
      customerName,
      phone,
      zoneId,
      zoneName,
      address: delivery === "pickup" ? s.pickupAddress : address,
      lat: body.lat != null ? Number(body.lat) : null,
      lng: body.lng != null ? Number(body.lng) : null,
      delivery,
      payment: String(body.payment ?? "cod"),
      status: "pending",
      note: body.note ? cleanText(body.note, 300) : null,
      subtotal,
      discount,
      deliveryFee,
      total,
      couponCode: discount > 0 ? couponCode : null,
    })
    .returning();

  await db.insert(orderItems).values(items.map((i) => ({ ...i, orderId: order.id })));

  for (const item of items) {
    await db
      .update(products)
      .set({ stock: sql`greatest(0, ${products.stock} - ${item.qty})` })
      .where(eq(products.id, item.productId));
  }

  return NextResponse.json({ ok: true, order: { id: order.id, number, total, status: order.status } });
}
