import { and, desc, eq, ilike } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { guard } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const blocked = guard(req, { route: "track", limit: 8, windowMs: 60_000, json: false });
  if (blocked) return blocked;

  const sp = new URL(req.url).searchParams;
  const number = (sp.get("number") ?? "").trim().slice(0, 40);
  const phone = (sp.get("phone") ?? "").trim().slice(0, 24);

  if (!number || !phone) {
    return NextResponse.json({ error: "شماره سفارش و شماره تماس لازم است" }, { status: 400 });
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(and(ilike(orders.number, number), eq(orders.phone, phone)))
    .limit(1);

  if (!order) {
    return NextResponse.json({ error: "سفارشی با این شماره و شماره تماس پیدا نشد" }, { status: 404 });
  }

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id)).orderBy(desc(orderItems.id));

  return NextResponse.json({
    order: {
      id: order.id,
      number: order.number,
      status: order.status,
      createdAt: order.createdAt,
      zoneName: order.zoneName,
      delivery: order.delivery,
      payment: order.payment,
      address: order.address,
      lat: order.lat,
      lng: order.lng,
      subtotal: order.subtotal,
      discount: order.discount,
      deliveryFee: order.deliveryFee,
      total: order.total,
      note: order.note,
    },
    items,
  });
}
