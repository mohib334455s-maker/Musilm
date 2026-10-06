import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";
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
  const body = await req.json();
  const fields: Record<string, unknown> = {};
  if (body.name !== undefined) fields.name = String(body.name);
  if (body.slug !== undefined) fields.slug = String(body.slug);
  if (body.image !== undefined) fields.image = body.image ? String(body.image) : null;
  if (body.sortOrder !== undefined) fields.sortOrder = Number(body.sortOrder) || 0;
  if (body.isActive !== undefined) fields.isActive = Boolean(body.isActive);
  const updated = await db.update(categories).set(fields).where(eq(categories.id, Number(id))).returning();
  return NextResponse.json({ ok: true, category: updated[0] });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  await db.delete(categories).where(eq(categories.id, Number(id)));
  return NextResponse.json({ ok: true });
}
