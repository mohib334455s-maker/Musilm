import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { zones } from "@/db/schema";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const [items, s] = await Promise.all([
    db.select().from(zones).where(eq(zones.isActive, true)).orderBy(asc(zones.id)),
    getSettings(),
  ]);
  return NextResponse.json({
    items,
    city: s.city,
    freeDeliveryThreshold: Number(s.freeDeliveryThreshold) || 0,
    payments: {
      cod: s.codEnabled === "true",
      bank: s.bankEnabled === "true",
      online: s.onlineEnabled === "true",
      card: s.cardEnabled === "true",
    },
    bank: { name: s.bankName, account: s.bankAccount, holder: s.bankHolder },
    pickupAddress: s.pickupAddress,
  });
}
