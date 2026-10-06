const faDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toFa(input: string | number): string {
  return String(input).replace(/\d/g, (d) => faDigits[Number(d)]);
}

export function num(value: number): string {
  return toFa(Math.round(value).toLocaleString("en-US"));
}

export function money(value: number): string {
  return `${num(value)} افغانی`;
}

export function shortMoney(value: number): string {
  return `${num(value)} ؋`;
}

export function slugify(input: string): string {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[\s_/\\]+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "")
    .replace(/^-|-$/g, "");
  return base || `item-${Date.now().toString(36)}`;
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "همین حالا";
  if (mins < 60) return `${toFa(mins)} دقیقه پیش`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${toFa(hours)} ساعت پیش`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${toFa(days)} روز پیش`;
  return d.toLocaleDateString("fa-AF");
}

export const ORDER_STATUS: { value: string; label: string; tone: string }[] = [
  { value: "pending", label: "در انتظار", tone: "#B26B00" },
  { value: "confirmed", label: "تأیید شد", tone: "#0F5132" },
  { value: "preparing", label: "در حال آماده‌سازی", tone: "#1F5FA8" },
  { value: "shipped", label: "ارسال شد", tone: "#6B4EAE" },
  { value: "delivered", label: "تحویل شد", tone: "#146C43" },
  { value: "cancelled", label: "لغو شد", tone: "#B3261E" },
];

export function statusLabel(value: string): string {
  return ORDER_STATUS.find((s) => s.value === value)?.label ?? value;
}

export function statusTone(value: string): string {
  return ORDER_STATUS.find((s) => s.value === value)?.tone ?? "#737B76";
}

export const PAYMENTS: { value: string; label: string; hint: string }[] = [
  { value: "cod", label: "پرداخت هنگام تحویل", hint: "پول را به مامور تحویل بپردازید" },
  { value: "bank", label: "حواله بانکی", hint: "انتقال به حساب بانک ملی / Azizi Bank" },
  { value: "online", label: "پرداخت آنلاین", hint: "از طریق درگاه پرداخت آنلاین" },
  { value: "card", label: "کارت بانکی", hint: "در صورت اتصال Gateway فعال است" },
];
