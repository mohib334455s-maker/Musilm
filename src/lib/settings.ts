import { db } from "@/db";
import { settings } from "@/db/schema";

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
  const rows = await db.select().from(settings);
  const merged: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const row of rows) merged[row.key] = row.value;
  return merged;
}

export async function setSettings(values: Record<string, string>): Promise<void> {
  const entries = Object.entries(values);
  for (const [key, value] of entries) {
    await db
      .insert(settings)
      .values({ key, value: String(value ?? "") })
      .onConflictDoUpdate({ target: settings.key, set: { value: String(value ?? "") } });
  }
}
