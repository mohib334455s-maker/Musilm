import { isDemoMode } from "@/lib/demo";

export const dynamic = "force-dynamic";

export async function GET() {
  if (isDemoMode()) {
    return Response.json({ ok: true, demo: true, database: false });
  }
  try {
    const { db } = await import("@/db");
    const { sql } = await import("drizzle-orm");
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, demo: false, database: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
