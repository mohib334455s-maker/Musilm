import { asc, desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  categories,
  coupons,
  customers,
  messages,
  orderItems,
  orders,
  products,
  reviews,
  settings as settingsTable,
  zones,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { DEFAULT_SETTINGS, getSettings, setSettings } from "@/lib/settings";
import { slugify } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const action = new URL(req.url).searchParams.get("action") ?? "stats";

  if (action === "settings") {
    const values = await getSettings();
    return NextResponse.json({ settings: values, defaults: DEFAULT_SETTINGS });
  }

  if (action === "zones") {
    const items = await db.select().from(zones).orderBy(asc(zones.id));
    return NextResponse.json({ items });
  }

  if (action === "coupons") {
    const items = await db.select().from(coupons).orderBy(desc(coupons.id));
    return NextResponse.json({ items });
  }

  if (action === "customers") {
    const rows = await db
      .select({
        id: customers.id,
        name: customers.name,
        email: customers.email,
        phone: customers.phone,
        role: customers.role,
        createdAt: customers.createdAt,
        ordersCount: sql<number>`count(${orders.id})::int`,
        spent: sql<number>`coalesce(sum(${orders.total}), 0)::int`,
      })
      .from(customers)
      .leftJoin(orders, eq(orders.customerId, customers.id))
      .groupBy(customers.id)
      .orderBy(desc(customers.id));
    return NextResponse.json({ items: rows });
  }

  if (action === "messages") {
    const items = await db.select().from(messages).orderBy(desc(messages.id)).limit(60);
    return NextResponse.json({ items });
  }

  if (action === "reviews") {
    const items = await db
      .select({
        id: reviews.id,
        name: reviews.name,
        rating: reviews.rating,
        body: reviews.body,
        isApproved: reviews.isApproved,
        createdAt: reviews.createdAt,
        productId: reviews.productId,
        productName: products.name,
        productSlug: products.slug,
      })
      .from(reviews)
      .leftJoin(products, eq(products.id, reviews.productId))
      .orderBy(sql`${reviews.isApproved} asc`, desc(reviews.id))
      .limit(80);
    return NextResponse.json({ items });
  }

  // stats
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfDay.getTime() - 86400000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const byStatus = await db
    .select({
      status: orders.status,
      count: sql<number>`count(*)::int`,
      total: sql<number>`coalesce(sum(${orders.total}), 0)::int`,
    })
    .from(orders)
    .groupBy(orders.status);

  const [yesterdayAgg] = await db
    .select({
      sales: sql<number>`coalesce(sum(case when ${orders.status} <> 'cancelled' then ${orders.total} else 0 end), 0)::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(orders)
    .where(
      sql`${orders.createdAt} >= ${startOfYesterday.toISOString()}::timestamptz and ${orders.createdAt} < ${startOfDay.toISOString()}::timestamptz`,
    );

  const [todayAgg] = await db
    .select({
      sales: sql<number>`coalesce(sum(case when ${orders.status} <> 'cancelled' then ${orders.total} else 0 end), 0)::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(orders)
    .where(sql`${orders.createdAt} >= ${startOfDay.toISOString()}::timestamptz`);

  const [monthAgg] = await db
    .select({
      sales: sql<number>`coalesce(sum(case when ${orders.status} <> 'cancelled' then ${orders.total} else 0 end), 0)::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(orders)
    .where(sql`${orders.createdAt} >= ${startOfMonth.toISOString()}::timestamptz`);

  const [pendingRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orders)
    .where(eq(orders.status, "pending"));

  const [totalsRow] = await db
    .select({
      orders: sql<number>`count(*)::int`,
      revenue: sql<number>`coalesce(sum(${orders.total}), 0)::int`,
    })
    .from(orders);

  const [counts] = await db
    .select({
      products: sql<number>`(select count(*) from products)::int`,
      categories: sql<number>`(select count(*) from categories)::int`,
      customers: sql<number>`(select count(*) from customers)::int`,
      unread: sql<number>`(select count(*) from messages where is_read = false)::int`,
    })
    .from(products);

  const lowStock = await db
    .select({
      id: products.id,
      name: products.name,
      stock: products.stock,
      lowStockAt: products.lowStockAt,
      unit: products.unit,
      image: products.image,
    })
    .from(products)
    .where(sql`${products.stock} <= ${products.lowStockAt} and ${products.isActive} = true`)
    .orderBy(asc(products.stock))
    .limit(12);

  const recentOrders = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.id))
    .limit(8);

  const topProducts = await db
    .select({
      name: orderItems.name,
      qty: sql<number>`sum(${orderItems.qty})::int`,
      revenue: sql<number>`sum(${orderItems.lineTotal})::int`,
    })
    .from(orderItems)
    .groupBy(orderItems.name)
    .orderBy(sql`sum(${orderItems.lineTotal}) desc`)
    .limit(6);

  const series = await db
    .select({
      day: sql<string>`to_char(${orders.createdAt}, 'MM-DD')`,
      total: sql<number>`coalesce(sum(${orders.total}), 0)::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(orders)
    .where(sql`${orders.createdAt} >= (now() - interval '13 days')`)
    .groupBy(sql`to_char(${orders.createdAt}, 'MM-DD')`)
    .orderBy(asc(sql`to_char(${orders.createdAt}, 'MM-DD')`));

  return NextResponse.json({
    stats: {
      todaySales: todayAgg?.sales ?? 0,
      todayOrders: todayAgg?.count ?? 0,
      monthSales: monthAgg?.sales ?? 0,
      monthOrders: monthAgg?.count ?? 0,
      pending: pendingRow?.count ?? 0,
      totalOrders: totalsRow?.orders ?? 0,
      totalRevenue: totalsRow?.revenue ?? 0,
      products: counts?.products ?? 0,
      categories: counts?.categories ?? 0,
      customers: counts?.customers ?? 0,
      unread: counts?.unread ?? 0,
    },
    lowStock,
    recentOrders,
    topProducts,
    series,
    byStatus,
    yesterdaySales: yesterdayAgg?.sales ?? 0,
    yesterdayOrders: yesterdayAgg?.count ?? 0,
    avgOrderValue: totalsRow?.orders ? Math.round((totalsRow.revenue ?? 0) / totalsRow.orders) : 0,
  });
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const action = new URL(req.url).searchParams.get("action") ?? "";
  const body = await req.json().catch(() => ({}));

  if (action === "settings:save") {
    await setSettings(body.values ?? {});
    return NextResponse.json({ ok: true, settings: await getSettings() });
  }

  if (action === "zone:save") {
    const values = {
      name: String(body.name ?? "").trim(),
      fee: Number(body.fee) || 0,
      minOrder: Number(body.minOrder) || 0,
      freeOver: Number(body.freeOver) || 0,
      eta: String(body.eta ?? "۲۴ ساعت"),
      isActive: body.isActive === undefined ? true : Boolean(body.isActive),
    };
    if (!values.name) return NextResponse.json({ error: "نام منطقه لازم است" }, { status: 400 });
    if (body.id) {
      await db.update(zones).set(values).where(eq(zones.id, Number(body.id)));
    } else {
      await db.insert(zones).values(values);
    }
    return NextResponse.json({ ok: true, items: await db.select().from(zones).orderBy(asc(zones.id)) });
  }

  if (action === "zone:delete") {
    await db.delete(zones).where(eq(zones.id, Number(body.id)));
    return NextResponse.json({ ok: true, items: await db.select().from(zones).orderBy(asc(zones.id)) });
  }

  if (action === "coupon:save") {
    const values = {
      code: String(body.code ?? "").trim().toUpperCase(),
      percent: Number(body.percent) || 0,
      amount: Number(body.amount) || 0,
      minOrder: Number(body.minOrder) || 0,
      isActive: body.isActive === undefined ? true : Boolean(body.isActive),
    };
    if (!values.code) return NextResponse.json({ error: "کد تخفیف لازم است" }, { status: 400 });
    if (body.id) {
      await db.update(coupons).set(values).where(eq(coupons.id, Number(body.id)));
    } else {
      await db.insert(coupons).values(values).onConflictDoUpdate({ target: coupons.code, set: values });
    }
    return NextResponse.json({ ok: true, items: await db.select().from(coupons).orderBy(desc(coupons.id)) });
  }

  if (action === "coupon:delete") {
    await db.delete(coupons).where(eq(coupons.id, Number(body.id)));
    return NextResponse.json({ ok: true, items: await db.select().from(coupons).orderBy(desc(coupons.id)) });
  }

  if (action === "category:save") {
    const name = String(body.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "نام دسته لازم است" }, { status: 400 });
    const rawSlug = String(body.slug ?? "").trim();
    const values = {
      name,
      slug: rawSlug || `${slugify(name)}-${Date.now().toString(36).slice(-4)}`,
      image: body.image ? String(body.image) : null,
      sortOrder: Number(body.sortOrder) || 0,
      isActive: body.isActive === undefined ? true : Boolean(body.isActive),
    };
    if (body.id) {
      await db.update(categories).set(values).where(eq(categories.id, Number(body.id)));
    } else {
      await db.insert(categories).values(values);
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "category:delete") {
    await db.delete(categories).where(eq(categories.id, Number(body.id)));
    return NextResponse.json({ ok: true });
  }

  if (action === "product:stock") {
    await db
      .update(products)
      .set({ stock: Math.max(0, Number(body.stock) || 0) })
      .where(eq(products.id, Number(body.id)));
    return NextResponse.json({ ok: true });
  }

  if (action === "review:approve") {
    await db.update(reviews).set({ isApproved: true }).where(eq(reviews.id, Number(body.id)));
    return NextResponse.json({ ok: true });
  }

  if (action === "review:reject") {
    await db.update(reviews).set({ isApproved: false }).where(eq(reviews.id, Number(body.id)));
    return NextResponse.json({ ok: true });
  }

  if (action === "review:delete") {
    await db.delete(reviews).where(eq(reviews.id, Number(body.id)));
    return NextResponse.json({ ok: true });
  }

  if (action === "message:read") {
    await db.update(messages).set({ isRead: true }).where(eq(messages.id, Number(body.id)));
    return NextResponse.json({ ok: true });
  }

  if (action === "message:delete") {
    await db.delete(messages).where(eq(messages.id, Number(body.id)));
    return NextResponse.json({ ok: true });
  }

  if (action === "message:read-all") {
    await db.update(messages).set({ isRead: true }).where(eq(messages.isRead, false));
    return NextResponse.json({ ok: true });
  }

  if (action === "customer:save") {
    const id = Number(body.id);
    if (!id) return NextResponse.json({ error: "شناسه نامعتبر" }, { status: 400 });
    const fields: Record<string, unknown> = {};
    if (body.name !== undefined) fields.name = String(body.name).trim();
    if (body.phone !== undefined) fields.phone = body.phone ? String(body.phone).trim() : null;
    if (body.role === "admin" || body.role === "customer") fields.role = body.role;
    if (!Object.keys(fields).length) return NextResponse.json({ error: "چیزی برای ذخیره نیست" }, { status: 400 });
    await db.update(customers).set(fields).where(eq(customers.id, id));
    return NextResponse.json({ ok: true });
  }

  if (action === "customer:delete") {
    const id = Number(body.id);
    if (!id) return NextResponse.json({ error: "شناسه نامعتبر" }, { status: 400 });
    const me = await requireAdmin();
    if (me.id === id) return NextResponse.json({ error: "نمی‌توانید حساب خودتان را حذف کنید" }, { status: 400 });
    await db.delete(customers).where(eq(customers.id, id));
    return NextResponse.json({ ok: true });
  }

  if (action === "settings:reset") {
    await db.delete(settingsTable);
    await setSettings(DEFAULT_SETTINGS);
    return NextResponse.json({ ok: true, settings: DEFAULT_SETTINGS });
  }

  return NextResponse.json({ error: "action نامعتبر" }, { status: 400 });
}
