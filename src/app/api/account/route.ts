import { asc, desc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { addresses, basketItems, baskets, customers, orderItems, orders, products } from "@/db/schema";
import { getSessionUser, hashPassword, verifyPassword } from "@/lib/auth";
import { cleanPhone, cleanText, guard, passwordIssue } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [userOrders, userAddresses, userBaskets] = await Promise.all([
    db.select().from(orders).where(eq(orders.customerId, user.id)).orderBy(desc(orders.id)).limit(30),
    db.select().from(addresses).where(eq(addresses.customerId, user.id)).orderBy(desc(addresses.isDefault), asc(addresses.id)),
    db.select().from(baskets).where(eq(baskets.customerId, user.id)).orderBy(desc(baskets.updatedAt)),
  ]);

  const orderIds = userOrders.map((o) => o.id);
  const items = orderIds.length ? await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds)) : [];
  const basketIds = userBaskets.map((b) => b.id);
  const bItems = basketIds.length
    ? await db
        .select({
          basketId: basketItems.basketId,
          qty: basketItems.qty,
          id: products.id,
          name: products.name,
          slug: products.slug,
          image: products.image,
          price: products.price,
          sizeLabel: products.sizeLabel,
          unit: products.unit,
          stock: products.stock,
        })
        .from(basketItems)
        .innerJoin(products, eq(products.id, basketItems.productId))
        .where(inArray(basketItems.basketId, basketIds))
        .orderBy(asc(basketItems.id))
    : [];

  return NextResponse.json({
    user,
    orders: userOrders.map((o) => ({ ...o, items: items.filter((i) => i.orderId === o.id) })),
    addresses: userAddresses,
    baskets: userBaskets.map((b) => ({ ...b, items: bItems.filter((i) => i.basketId === b.id) })),
  });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const blocked = guard(req, { route: "account", limit: 40, windowMs: 60_000 });
  if (blocked) return blocked;

  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "");

  if (action === "password:change") {
    const current = typeof body.current === "string" ? body.current.slice(0, 128) : "";
    const next = typeof body.next === "string" ? body.next.slice(0, 128) : "";
    const rows = await db
      .select({ passwordHash: customers.passwordHash })
      .from(customers)
      .where(eq(customers.id, user.id))
      .limit(1);
    if (!rows[0] || !verifyPassword(current, rows[0].passwordHash)) {
      return NextResponse.json({ error: "رمز عبور فعلی درست نیست" }, { status: 401 });
    }
    const issue = passwordIssue(next);
    if (issue) return NextResponse.json({ error: issue }, { status: 400 });
    await db.update(customers).set({ passwordHash: hashPassword(next) }).where(eq(customers.id, user.id));
    return NextResponse.json({ ok: true });
  }

  if (action === "profile:save") {
    const fields: Record<string, unknown> = {};
    if (body.name) fields.name = cleanText(body.name, 60);
    if (body.phone !== undefined) fields.phone = body.phone ? cleanPhone(body.phone) : null;
    if (Object.keys(fields).length) {
      await db.update(customers).set(fields).where(eq(customers.id, user.id));
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "address:save") {
    const values = {
      customerId: user.id,
      title: String(body.title ?? "خانه"),
      zoneId: body.zoneId ? Number(body.zoneId) : null,
      details: String(body.details ?? "").trim(),
      lat: body.lat != null && body.lat !== "" ? Number(body.lat) : null,
      lng: body.lng != null && body.lng !== "" ? Number(body.lng) : null,
      isDefault: Boolean(body.isDefault),
    };
    if (!values.details) return NextResponse.json({ error: "آدرس لازم است" }, { status: 400 });
    if (body.id) {
      await db.update(addresses).set(values).where(eq(addresses.id, Number(body.id)));
    } else {
      await db.insert(addresses).values(values);
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "address:delete") {
    await db.delete(addresses).where(eq(addresses.id, Number(body.id)));
    return NextResponse.json({ ok: true });
  }

  if (action === "basket:save") {
    const lines: { id: number; qty: number }[] = Array.isArray(body.items) ? body.items : [];
    const name = String(body.name ?? "سبد ماهانه").trim() || "سبد ماهانه";
    let basketId = Number(body.id) || 0;
    if (basketId) {
      await db.delete(basketItems).where(eq(basketItems.basketId, basketId));
      await db.update(baskets).set({ name, updatedAt: new Date() }).where(eq(baskets.id, basketId));
    } else {
      const [created] = await db
        .insert(baskets)
        .values({ customerId: user.id, name })
        .returning({ id: baskets.id });
      basketId = created!.id;
    }
    if (lines.length) {
      await db.insert(basketItems).values(
        lines.map((l) => ({ basketId, productId: Number(l.id), qty: Math.max(1, Number(l.qty) || 1) })),
      );
    }
    return NextResponse.json({ ok: true, id: basketId });
  }

  if (action === "basket:delete") {
    await db.delete(baskets).where(eq(baskets.id, Number(body.id)));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "action نامعتبر" }, { status: 400 });
}
