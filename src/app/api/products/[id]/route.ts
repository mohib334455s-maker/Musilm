import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const pid = Number(id);
  if (!pid) return NextResponse.json({ error: "bad id" }, { status: 400 });

  const body = await req.json();
  const fields: Record<string, unknown> = {};
  const numeric = ["price", "wholesalePrice", "wholesaleMin", "discount", "stock", "lowStockAt", "categoryId"];
  const strings = ["name", "brand", "image", "description", "unit", "sizeLabel", "sku", "barcode", "slug"];
  for (const key of numeric) {
    if (body[key] !== undefined) {
      fields[key] = body[key] === null || body[key] === "" ? null : Number(body[key]);
    }
  }
  for (const key of strings) {
    if (body[key] !== undefined) fields[key] = body[key] === "" ? null : String(body[key]);
  }
  for (const key of ["isPopular", "isActive"]) {
    if (body[key] !== undefined) fields[key] = Boolean(body[key]);
  }
  if (fields.categoryId === null) fields.categoryId = null;

  const updated = await db.update(products).set(fields).where(eq(products.id, pid)).returning();
  if (!updated.length) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true, product: updated[0] });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  await db.delete(products).where(eq(products.id, Number(id)));
  return NextResponse.json({ ok: true });
}
