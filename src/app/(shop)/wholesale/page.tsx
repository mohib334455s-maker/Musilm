import { getSettings } from "@/lib/settings";
import { listProducts } from "@/lib/store-data";
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
  const items = await listProducts({ wholesale: true, limit: 100 });

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
            ویژه دکان‌ها و رستوران‌ها
          </p>
          <h1 className="mt-5 text-[28px] font-bold leading-tight text-ink md:text-[38px]">لیست قیمت عمده</h1>
          <p className="mt-4 max-w-lg text-[14.5px] leading-8 text-muted">
            وقتی تعداد به حد عمده برسد، قیمت در سبد خرید خودکار تغییر می‌کند. بیشترین صرفه‌جویی فعلی تا{" "}
            <span className="num font-semibold text-brand">{num(bestSaving)} افغانی</span> در هر قلم است.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { Icon: TruckIcon, title: "تحویل عمده", text: `ارسال در ${s.city}` },
            { Icon: PhoneIcon, title: "سفارش تلفنی", text: s.phone },
          ].map(({ Icon, title, text }) => (
            <Reveal key={title}>
              <div className="rounded-lg border border-line p-4">
                <Icon width={18} height={18} className="text-brand" />
                <p className="mt-3 text-[13px] font-semibold text-ink">{title}</p>
                <p className="num mt-1 text-[12px] text-muted" dir="ltr">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      <div className="mt-12">
        <SectionHead title="اقلام عمده" note="قیمت‌ها به افغانی است و با رسیدن به حد عمده اعمال می‌شود" />
        <WholesaleList products={items} />
      </div>
    </div>
  );
}
