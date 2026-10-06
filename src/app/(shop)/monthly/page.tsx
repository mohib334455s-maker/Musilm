import { listProducts } from "@/lib/store-data";
import { MonthlyBuilder } from "@/components/monthly-builder";
import { Reveal } from "@/components/ui";
import { BoxIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "خرید ماهانه | Muslim Store",
  description: "سبد مواد خوراکی ماهانه خود را یک بار بسازید و هر ماه دوباره سفارش دهید.",
};

export default async function MonthlyPage() {
  const items = await listProducts({ limit: 60, sort: "popular" });

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-6 md:py-14">
      <div className="grid items-center gap-8 border-b border-line pb-8 md:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-[12px] text-muted">
            <BoxIcon width={15} height={15} className="text-brand" />
            خرید ماهانه
          </p>
          <h1 className="mt-5 text-[28px] font-bold leading-tight text-ink md:text-[38px]">خرید ماهانه خانه</h1>
          <p className="mt-4 max-w-lg text-[14.5px] leading-8 text-muted">
            سبد مواد خوراکی خود را یک بار بسازید و ماه بعد دوباره سفارش دهید.
          </p>
        </div>
        <Reveal>
          <ul className="space-y-2.5 text-[13px] text-ink">
            {["یک‌بار انتخاب کنید", "هر ماه با یک کلیک سفارش دهید", "تعداد را هر زمان تغییر دهید"].map((t) => (
              <li key={t} className="rounded-lg border border-line bg-white px-4 py-3">{t}</li>
            ))}
          </ul>
        </Reveal>
      </div>

      <div className="mt-10">
        <MonthlyBuilder products={items} />
      </div>
    </div>
  );
}
