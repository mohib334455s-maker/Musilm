import { isDemoMode } from "@/lib/demo";

export const DEFAULT_SETTINGS: Record<string, string> = {
  siteName: "Muslim Store",
  city: "مزارشریف",
  phone: "+93 700 123 456",
  whatsapp: "+93 700 123 456",
  email: "info@muslimstore.af",
  address: "مزارشریف، چهارراهی حاجی کامران، سرک اول",
  workingHours: "شنبه تا پنجشنبه — ۸:۰۰ صبح تا ۸:۰۰ شب",
  freeDeliveryThreshold: "2000",
  defaultDeliveryFee: "80",
  defaultZoneEta: "۲۴ ساعت",
  codEnabled: "true",
  bankEnabled: "true",
  onlineEnabled: "true",
  cardEnabled: "false",
  bankName: "Afghanistan International Bank",
  bankAccount: "1234-5678-9012",
  bankHolder: "Muslim Store Trading Co.",
  pickupAddress: "مزارشریف، چهارراهی حاجی کامران — انبار مسلم استور",
  adminEmail: "admin@muslimstore.af",
};

export async function getSettings(): Promise<Record<string, string>> {
  if (isDemoMode() || process.env.NEXT_PHASE === "phase-production-build") {
    return { ...DEFAULT_SETTINGS };
  }
  try {
    const { db } = await import("@/db");
    const { settings } = await import("@/db/schema");
    const rows = await db.select().from(settings);
    const merged: Record<string, string> = { ...DEFAULT_SETTINGS };
    for (const row of rows) merged[row.key] = row.value;
    return merged;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function setSettings(values: Record<string, string>): Promise<void> {
  if (isDemoMode()) throw new Error("demo mode");
  const { db } = await import("@/db");
  const { settings } = await import("@/db/schema");
  for (const [key, value] of Object.entries(values)) {
    await db
      .insert(settings)
      .values({ key, value: String(value ?? "") })
      .onConflictDoUpdate({ target: settings.key, set: { value: String(value ?? "") } });
  }
}
