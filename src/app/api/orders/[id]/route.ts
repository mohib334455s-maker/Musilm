import { and, desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { orderItems, orders, products } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const isNumber = id.startsWith("MS-");
  const [order] = await db
    .select()
    .from(orders)
    .where(isNumber ? eq(orders.number, id) : eq(orders.id, Number(id)))
    .limit(1);
  if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (user.role !== "admin" && order.customerId !== user.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 403 });
  }
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id))
    .orderBy(desc(orderItems.id));
  return NextResponse.json({ order, items });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const orderId = Number(id);
  const body = await req.json().catch(() => ({}));
  const fields: Record<string, unknown> = {};
  const allowed = ["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"];
  if (body.status && allowed.includes(String(body.status))) fields.status = String(body.status);
  if (body.payment !== undefined) fields.payment = String(body.payment);
  if (body.note !== undefined) fields.note = body.note ? String(body.note) : null;

  const [current] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!current) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Restock once when moving into cancelled
  if (fields.status === "cancelled" && current.status !== "cancelled") {
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    for (const item of items) {
      if (!item.productId) continue;
      await db
        .update(products)
        .set({ stock: sql`${products.stock} + ${item.qty}` })
        .where(eq(products.id, item.productId));
    }
  }

  const updated = await db
    .update(orders)
    .set(fields)
    .where(and(eq(orders.id, orderId)))
    .returning();
  return NextResponse.json({ ok: true, order: updated[0] });
}
