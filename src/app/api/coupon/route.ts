import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { guard } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const blocked = guard(req, { route: "coupon", limit: 12, windowMs: 60_000 });
  if (blocked) return blocked;

  const body = await req.json().catch(() => ({}));
  const code = String(body.code ?? "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 32);
  const subtotal = Math.min(100_000_000, Math.max(0, Number(body.subtotal) || 0));
  if (!code) return NextResponse.json({ error: "کد تخفیف را بنویسید" }, { status: 400 });

  const [coupon] = await db
    .select()
    .from(coupons)
    .where(and(eq(coupons.code, code), eq(coupons.isActive, true)))
    .limit(1);

  if (!coupon) return NextResponse.json({ error: "کد تخفیف معتبر نیست" }, { status: 404 });
  if (subtotal < coupon.minOrder) {
    return NextResponse.json(
      { error: `حداقل سفارش برای این کد ${coupon.minOrder} افغانی است` },
      { status: 400 },
    );
  }
  const discount = Math.min(
    subtotal,
    coupon.percent > 0 ? Math.round((subtotal * coupon.percent) / 100) : coupon.amount,
  );
  return NextResponse.json({ ok: true, discount, code: coupon.code });
}
