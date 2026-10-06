import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { MonthlyBuilder } from "@/components/monthly-builder";
import { SLIM_COLUMNS } from "@/lib/queries";
import { Reveal } from "@/components/ui";
import { BoxIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "خرید ماهانه | Muslim Store",
  description: "سبد مواد خوراکی ماهانه خود را یک بار بسازید و هر ماه دوباره سفارش دهید.",
};

export default async function MonthlyPage() {
  const items = await db
    .select(SLIM_COLUMNS)
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(sql`${products.isActive} = true`)
    .orderBy(sql`${products.isPopular} desc`, asc(categories.sortOrder), asc(products.id))
    .limit(60);

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
            سبد مواد خوراکی خود را یک بار بسازید و ماه بعد دوباره سفارش دهید. سبد در حساب کاربری
            شما ذخیره می‌شود و هر زمان می‌توانید آن را تغییر دهید یا با یک کلیک به سبد خرید اضافه
            کنید.
          </p>
        </div>
        <ul className="space-y-2.5 text-[13px] text-ink">
          {[
            "۱. محصولات پرمصرف ماهانه را انتخاب کنید",
            "۲. تعداد هر محصول را تعیین کنید",
            "۳. سبد را ذخیره کنید یا مستقیم سفارش دهید",
          ].map((line, i) => (
            <li key={line} className="flex items-center gap-3 rounded-md border border-line bg-brand-soft px-4 py-3">
              <span className="num grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-[11px] text-white">
                {["۱", "۲", "۳"][i]}
              </span>
              {line}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8">
        <Reveal>
          <MonthlyBuilder products={items} />
        </Reveal>
      </div>
    </div>
  );
}
