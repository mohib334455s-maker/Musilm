import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";
import { listZones } from "@/lib/store-data";
import { isDemoMode } from "@/lib/demo";

export const dynamic = "force-dynamic";

export async function GET() {
  const [items, s] = await Promise.all([listZones(), getSettings()]);
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
    demo: isDemoMode(),
  });
}
