import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demo";
import { cleanPhone, cleanText, guard } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const blocked = guard(req, { route: "contact", limit: 4, windowMs: 10 * 60_000 });
  if (blocked) return blocked;

  const body = await req.json().catch(() => ({}));
  const name = cleanText(body.name, 60);
  const phone = cleanPhone(body.phone);
  const text = cleanText(body.body, 800);
  if (!name || !phone || !text) {
    return NextResponse.json({ error: "نام، شماره تماس و پیام لازم است" }, { status: 400 });
  }

  if (isDemoMode()) {
    // Display-only deploy: accept the form without persistence
    return NextResponse.json({ ok: true, demo: true });
  }

  const { db } = await import("@/db");
  const { messages } = await import("@/db/schema");
  await db.insert(messages).values({ name, phone, body: text });
  return NextResponse.json({ ok: true });
}
