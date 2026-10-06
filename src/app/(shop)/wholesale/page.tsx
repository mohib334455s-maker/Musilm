import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { getSettings } from "@/lib/settings";
import { num } from "@/lib/format";
import { WholesaleList } from "@/components/wholesale-list";
import { Reveal, SectionHead } from "@/components/ui";
import { BoxIcon, PhoneIcon, TruckIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "خرید عمده | Muslim Store",
  description: "قیمت عمده مواد خوراکی برای دکان‌ها و مصرف‌کنندگان عمده در مزارشریف",
};

export default async function WholesalePage() {
  const s = await getSettings();
  const items = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      brand: products.brand,
      image: products.image,
      sizeLabel: products.sizeLabel,
      unit: products.unit,
      price: products.price,
      wholesalePrice: products.wholesalePrice,
      wholesaleMin: products.wholesaleMin,
      discount: products.discount,
      stock: products.stock,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(sql`${products.isActive} = true and ${products.wholesalePrice} is not null`)
    .orderBy(asc(categories.sortOrder), asc(products.price))
    .limit(100);

  const bestSaving = items.reduce(
    (acc, p) => Math.max(acc, p.price - (p.wholesalePrice ?? p.price)),
    0,
  );

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-6 md:py-14">
      <div className="grid items-center gap-8 md:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-[12px] text-muted">
            <BoxIcon width={15} height={15} className="text-brand" />
            عمده‌فروشی مواد خوراکی
          </p>
          <h1 className="mt-5 text-[28px] font-bold leading-tight text-ink md:text-[40px]">خرید عمده</h1>
          <p className="mt-4 max-w-lg text-[14.5px] leading-8 text-muted">
            برای دکان‌ها، رستوران‌ها و خانواده‌های پرجمعیت. وقتی تعداد سفارش به حد عمده برسد، قیمت
            به صورت خودکار از پرچون به عمده تغییر می‌کند و هیچ کاری لازم نیست انجام دهید.
          </p>
          <div className="mt-7 flex flex-wrap gap-6 border-t border-line pt-6">
            {[
              ["بیشترین صرفه‌جویی", `${num(bestSaving)} ؋ در هر قلم`],
              ["حداقل تعداد عمده", "از ۴ تا ۴۸ عدد"],
              ["ارسال رایگان", `سفارش بالای ${num(Number(s.freeDeliveryThreshold))} ؋`],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-[12px] text-muted">{k}</p>
                <p className="num mt-1 text-[15px] font-semibold text-ink">{v}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border border-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/wholesale.jpg" alt="انبار عمده‌فروشی مسلم استور" className="h-full min-h-[240px] w-full object-cover" />
        </div>
      </div>

      <div className="mt-12">
        <Reveal>
          <SectionHead title="لیست قیمت عمده" note={`${items.length} محصول با قیمت عمده`} />
        </Reveal>
        <Reveal>
          <WholesaleList products={items} />
        </Reveal>
      </div>

      <div className="mt-10 grid gap-3 md:grid-cols-3">
        {[
          { Icon: BoxIcon, title: "قیمت خودکار", text: "با رسیدن تعداد به حد عمده، قیمت در سبد خرید خودکار تغییر می‌کند." },
          { Icon: TruckIcon, title: "تحویل به دکان", text: "سفارش‌های عمده در تمام مناطق شهر با موتر شرکت تحویل داده می‌شود." },
          { Icon: PhoneIcon, title: "سفارش تلفنی", text: `برای مقدارهای بزرگ‌تر با ${s.phone} تماس بگیرید.` },
        ].map(({ Icon, title, text }) => (
          <div key={title} className="rounded-lg border border-line p-5">
            <Icon width={18} height={18} className="text-brand" />
            <p className="mt-3 text-[14px] font-semibold text-ink">{title}</p>
            <p className="num mt-1.5 text-[12.5px] leading-6 text-muted">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
