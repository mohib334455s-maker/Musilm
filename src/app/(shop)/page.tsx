import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { getHomeBundles } from "@/lib/store-data";
import { num, toFa } from "@/lib/format";
import { ProductCard } from "@/components/product-card";
import { HeroSlider } from "@/components/hero-slider";
import { CountUp, Rail } from "@/components/motion";
import { DealsSection } from "@/components/deals-section";
import { RecentlyViewed } from "@/components/shop-widgets";
import { Reveal as RevealBox, SectionHead } from "@/components/ui";
import {
  ArrowLeft,
  BoxIcon,
  CalendarIcon,
  CardIcon,
  PhoneIcon,
  PinIcon,
  StarIcon,
  TruckIcon,
} from "@/components/icons";

export const dynamic = "force-dynamic";

const RAIL_ITEM =
  "w-[calc(50%-6px)] sm:w-[calc(33.333%-8px)] lg:w-[calc(25%-9px)] xl:w-[calc(20%-10px)] 2xl:w-[calc(16.666%-10px)]";

const AFGHAN_BRANDS = [
  { name: "الکوزی", note: "چای · روغن · آب" },
  { name: "شعیب", note: "روغن · آبمیوه" },
  { name: "سلطان تازه", note: "لبنیات مزار" },
  { name: "پامیر کولا", note: "نوشیدنی · چیپس" },
  { name: "هرات زعفران", note: "طلای سرخ" },
  { name: "رایان", note: "زعفران هرات" },
  { name: "صادق‌یار", note: "خشکبار · هلوا" },
  { name: "بشیر نوید", note: "آرد · روغن" },
  { name: "رومی", note: "بادام · کشمش" },
  { name: "کینگ‌خان", note: "خشکبار قندهار" },
];

export default async function HomePage() {
  const s = await getSettings();
  const threshold = Number(s.freeDeliveryThreshold) || 0;
  const { cats, popular, deals, wholesale, newest, zoneRows, totals } = await getHomeBundles();

  const promo = [
    {
      Icon: TruckIcon,
      title: "ارسال رایگان",
      text: `سفارش بالای ${num(threshold)} افغانی در نواحی تعیین‌شده ${s.city}`,
      href: "/contact",
    },
    {
      Icon: BoxIcon,
      title: "قیمت عمده خودکار",
      text: "با رسیدن تعداد به حد عمده، قیمت در سبد تغییر می‌کند",
      href: "/wholesale",
    },
    {
      Icon: CardIcon,
      title: "پرداخت هنگام تحویل",
      text: "حواله بانکی، پرداخت آنلاین و کارت بانکی هم فعال است",
      href: "/checkout",
    },
    {
      Icon: CalendarIcon,
      title: "سبد ماهانه",
      text: "یک بار بسازید و هر ماه با یک کلیک سفارش دهید",
      href: "/monthly",
    },
  ];

  const claimedOf = (p: { sold?: number; stock: number }) => {
    const sold = p.sold ?? 0;
    const total = sold + p.stock;
    return total > 0 ? Math.min(96, Math.round((sold / total) * 100)) : 0;
  };

  return (
    <>
      <HeroSlider freeThreshold={threshold} />

      {/* brand strip */}
      <div className="border-b border-line bg-[#F4F7F2]">
        <div className="marquee py-4">
          <div className="marquee-track gap-10 px-6">
            {[...AFGHAN_BRANDS, ...AFGHAN_BRANDS].map((b, i) => (
              <span key={`${b.name}-${i}`} className="flex shrink-0 items-baseline gap-2">
                <span className="display-font text-[15px] font-semibold text-brand">{b.name}</span>
                <span className="text-[11px] text-muted">{b.note}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* trust / service — below hero, not overlays */}
      <div className="mx-auto max-w-[1280px] px-4 pt-10 md:px-6 md:pt-12">
        <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {promo.map(({ Icon, title, text, href }, i) => (
            <RevealBox key={title} delay={i * 60}>
              <Link
                href={href}
                className="group flex h-full items-start gap-3 bg-white p-5 transition hover:bg-brand-soft"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-brand text-white transition group-hover:bg-brand-dark">
                  <Icon width={20} height={20} />
                </span>
                <span>
                  <span className="block text-[13.5px] font-semibold text-ink">{title}</span>
                  <span className="num mt-1.5 block text-[12px] leading-6 text-muted">{text}</span>
                </span>
              </Link>
            </RevealBox>
          ))}
        </div>
      </div>

      {/* deal of the day */}
      <div className="mx-auto mt-12 max-w-[1280px] px-4 md:mt-14 md:px-6">
        <RevealBox>
          <DealsSection deals={deals.map((p) => ({ ...p, claimed: claimedOf(p) }))} />
        </RevealBox>
      </div>

      {/* categories */}
      <div className="mx-auto mt-14 max-w-[1280px] px-4 md:px-6">
        <RevealBox>
          <SectionHead
            title="خرید بر اساس دسته‌بندی"
            note="برنج، روغن، لبنیات، خشکبار افغانی و مصارف خانه"
            href="/categories"
            linkLabel="همه دسته‌بندی‌ها"
          />
        </RevealBox>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5">
          {cats.map((cat, i) => (
            <RevealBox key={cat.id} delay={i * 35}>
              <Link
                href={`/products?cat=${cat.slug}`}
                className="group relative block aspect-[4/5] overflow-hidden rounded-lg"
              >
                {cat.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cat.image}
                    alt={cat.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.06]"
                  />
                ) : (
                  <span className="block h-full w-full bg-brand-soft" />
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-[#07291A]/92% via-[#07291A]/25 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 p-3.5">
                  <span className="block text-[14px] font-semibold text-white">{cat.name}</span>
                  <span className="num mt-1 block text-[11.5px] text-white/65">{toFa(cat.count)} محصول</span>
                </span>
              </Link>
            </RevealBox>
          ))}
        </div>
      </div>

      {/* best sellers */}
      <div className="mx-auto mt-14 max-w-[1280px] px-4 md:px-6">
        <RevealBox>
          <Rail title="پرفروش‌ترین‌ها" href="/products" note="برندهای افغانستانی محبوب مشتریان" itemClass={RAIL_ITEM}>
            {popular.map((p) => (
              <ProductCard key={p.id} product={p} compact />
            ))}
          </Rail>
        </RevealBox>
      </div>

      {/* wholesale b2b */}
      <div className="mx-auto mt-14 max-w-[1280px] px-4 md:px-6">
        <RevealBox>
          <div className="relative overflow-hidden rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/banner-b2b.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(7,41,26,0.94)_0%,rgba(7,41,26,0.82)_48%,rgba(7,41,26,0.45)_100%)]" />
            <div className="relative grid gap-8 px-6 py-10 md:grid-cols-[1.05fr_1fr] md:px-10 md:py-12">
              <div className="text-white">
                <p className="flex items-center gap-2 text-[12px] text-accent">
                  <BoxIcon width={15} height={15} />
                  ویژه دکان‌ها و رستوران‌ها
                </p>
                <h2 className="mt-3 text-[26px] font-bold leading-tight md:text-[34px]">
                  قیمت عمده، بدون تماس و چانه‌زنی
                </h2>
                <p className="mt-4 max-w-md text-[13.5px] leading-8 text-white/70">
                  وقتی تعداد سفارش به حد عمده برسد، قیمت هر قلم به‌صورت خودکار از پرچون به عمده تغییر
                  می‌کند و تفاوت آن در سبد خرید به‌عنوان «سود شما» نمایش داده می‌شود.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    href="/wholesale"
                    className="btn-shine inline-flex h-11 items-center gap-2 rounded-md bg-accent px-5 text-[13px] font-semibold text-[#07291A] transition hover:brightness-105"
                  >
                    دیدن لیست قیمت عمده
                    <ArrowLeft width={16} height={16} />
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex h-11 items-center rounded-md border border-white/25 px-5 text-[13px] font-medium text-white transition hover:border-accent hover:text-accent"
                  >
                    سفارش بالای ۵۰۰ عدد
                  </Link>
                </div>
              </div>

              <ul className="divide-y divide-white/10 rounded-lg border border-white/15 bg-white/8 backdrop-blur-sm">
                {wholesale.slice(0, 4).map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-4 py-3.5">
                    <span className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-white/10">
                      {p.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <Link href={`/products/${p.slug}`} className="line-clamp-1 text-[13px] font-medium text-white hover:text-accent">
                        {p.name}
                      </Link>
                      <span className="num mt-0.5 block text-[11px] text-white/55">
                        از {toFa(p.wholesaleMin)} {p.unit}
                      </span>
                    </span>
                    <span className="shrink-0 text-left">
                      <span className="num block text-[11px] text-white/40 line-through">{num(p.price)} ؋</span>
                      <span className="num block text-[15px] font-bold text-accent">{num(p.wholesalePrice ?? p.price)} ؋</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </RevealBox>
      </div>

      {/* monthly basket */}
      <div className="mx-auto mt-14 max-w-[1280px] px-4 md:px-6">
        <RevealBox>
          <div className="grid items-center gap-8 overflow-hidden rounded-lg border border-line bg-[linear-gradient(135deg,#F7F8F5_0%,#EEF3EB_55%,#F7F1E3_100%)] px-6 py-9 md:grid-cols-[1.15fr_1fr] md:px-10">
            <div>
              <p className="flex items-center gap-2 text-[12px] text-muted">
                <CalendarIcon width={15} height={15} className="text-brand" />
                خرید ماهانه
              </p>
              <h2 className="mt-3 text-[24px] font-bold leading-tight text-ink md:text-[30px]">خرید ماهانه خانه</h2>
              <p className="mt-3 max-w-lg text-[13.5px] leading-8 text-muted">
                سبد مواد خوراکی خود را یک بار بسازید و ماه بعد دوباره سفارش دهید. سبد در حساب کاربری
                ذخیره می‌شود و هر زمان می‌توانید تعداد را تغییر دهید یا با یک کلیک همه را به سبد خرید
                اضافه کنید.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/monthly"
                  className="btn-shine inline-flex h-11 items-center gap-2 rounded-md bg-brand px-5 text-[13px] font-semibold text-white transition hover:bg-brand-dark"
                >
                  ساخت سبد ماهانه
                  <ArrowLeft width={16} height={16} />
                </Link>
                <Link
                  href="/account?tab=baskets"
                  className="inline-flex h-11 items-center rounded-md border border-line bg-white px-5 text-[13px] font-medium text-ink transition hover:border-brand hover:text-brand"
                >
                  سبدهای ذخیره‌شده
                </Link>
              </div>
            </div>
            <div className="rounded-lg border border-line bg-white/90 p-5 shadow-[0_20px_40px_rgba(7,41,26,0.06)] backdrop-blur-sm">
              <p className="text-[12.5px] text-muted">نمونه سبد ماهانه یک خانواده چهار نفره</p>
              <ul className="mt-3 divide-y divide-line">
                {[
                  ["برنج باسمتی هرات ۱۰ کیلو", "۲ بوجی"],
                  ["روغن آفتاب‌گردان الکوزی ۵ لیتر", "۲ بوتل"],
                  ["چای سیاه الکوزی ۱ کیلو", "۱ بسته"],
                  ["شیر سلطان تازه ۱ لیتر", "۱۲ بوتل"],
                  ["پودر لباس‌شویی الکوزی ۳ کیلو", "۱ بکس"],
                ].map(([name, qty]) => (
                  <li key={name} className="flex items-center justify-between gap-3 py-2.5 text-[12.5px]">
                    <span className="text-ink">{name}</span>
                    <span className="num text-muted">{qty}</span>
                  </li>
                ))}
              </ul>
              <p className="num mt-3 flex items-baseline justify-between border-t border-line pt-3 text-[13px]">
                <span className="text-muted">جمع تقریبی ماهانه</span>
                <span className="font-bold text-brand">{num(6580)} ؋</span>
              </p>
            </div>
          </div>
        </RevealBox>
      </div>

      {/* new arrivals */}
      <div className="mx-auto mt-14 max-w-[1280px] px-4 md:px-6">
        <RevealBox>
          <Rail title="تازه‌های انبار" href="/products?sort=new" note="آخرین اقلام اضافه‌شده به فروشگاه" itemClass={RAIL_ITEM}>
            {newest.map((p) => (
              <ProductCard key={p.id} product={p} compact />
            ))}
          </Rail>
        </RevealBox>
      </div>

      {/* stats band */}
      <div className="mt-14 bg-[linear-gradient(120deg,#0F5132_0%,#07291A_55%,#0A3D25_100%)] text-white">
        <div className="dotted-dark mx-auto grid max-w-[1280px] gap-6 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { value: totals[0]?.products ?? 0, label: "محصول فعال در فروشگاه" },
            { value: zoneRows.length, label: "منطقه تحت پوشش تحویل" },
            { value: totals[0]?.delivered ?? 0, label: "سفارش تحویل‌شده" },
            { value: totals[0]?.soldUnits ?? 0, label: "قلم فروخته‌شده" },
          ].map((item, i) => (
            <RevealBox key={item.label} delay={i * 60}>
              <div className="border-r border-white/15 pr-4 first:border-r-0 first:pr-0 max-lg:border-r-0 max-lg:pr-0">
                <p className="text-[34px] font-bold leading-none text-accent">
                  <CountUp value={item.value} />
                </p>
                <p className="mt-2.5 text-[12.5px] text-white/70">{item.label}</p>
              </div>
            </RevealBox>
          ))}
        </div>
      </div>

      {/* recently viewed */}
      <div className="mx-auto mt-14 max-w-[1280px] px-4 md:px-6">
        <RecentlyViewed />
      </div>

      {/* delivery */}
      <div className="mx-auto mt-14 max-w-[1280px] px-4 md:px-6">
        <RevealBox>
          <SectionHead
            title="تحویل و کرایه"
            note={`کرایه در ${s.city} بر اساس منطقه محاسبه می‌شود و پیش از پرداخت نمایش داده می‌شود`}
            href="/contact"
            linkLabel="مناطق تحت پوشش"
          />
        </RevealBox>
        <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          <RevealBox>
            <div className="h-full overflow-hidden rounded-lg border border-line bg-white">
              <table className="w-full text-right text-[13px]">
                <thead className="bg-brand-soft text-[11.5px] text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">منطقه</th>
                    <th className="px-4 py-3 font-medium">کرایه</th>
                    <th className="px-4 py-3 font-medium">حداقل سفارش</th>
                    <th className="px-4 py-3 font-medium">ارسال رایگان</th>
                    <th className="px-4 py-3 font-medium">زمان تحویل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {zoneRows.map((z) => (
                    <tr key={z.id} className="transition hover:bg-brand-soft/60">
                      <td className="px-4 py-3 font-medium text-ink">{z.name}</td>
                      <td className="num px-4 py-3 text-muted">{z.fee === 0 ? "رایگان" : `${num(z.fee)} ؋`}</td>
                      <td className="num px-4 py-3 text-muted">{num(z.minOrder)} ؋</td>
                      <td className="num px-4 py-3 font-medium text-brand">{num(z.freeOver)} ؋ به بالا</td>
                      <td className="num px-4 py-3 text-muted">{z.eta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </RevealBox>
          <RevealBox delay={80}>
            <div className="relative flex h-full min-h-[280px] flex-col overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/delivery.jpg" alt="تحویل سفارش مسلم استور" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07291A] via-[#07291A]/55 to-transparent" />
              <div className="relative mt-auto p-6 text-white">
                <p className="flex items-center gap-2 text-[15px] font-semibold">
                  <StarIcon width={16} height={16} className="text-accent" />
                  سفارش بالای {num(threshold)} افغانی
                </p>
                <p className="mt-2 text-[13px] leading-7 text-white/70">
                  در مناطق تعیین‌شده {s.city} ارسال رایگان است. کرایه بر اساس منطقه پیش از ثبت سفارش نمایش داده می‌شود.
                </p>
                <Link href="/checkout" className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-accent">
                  محاسبه کرایه در سبد خرید
                  <ArrowLeft width={15} height={15} />
                </Link>
              </div>
            </div>
          </RevealBox>
        </div>
      </div>

      {/* contact strip */}
      <div className="mx-auto mt-14 max-w-[1280px] px-4 pb-4 md:px-6">
        <RevealBox>
          <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
            {[
              { Icon: PhoneIcon, label: "سفارش تلفنی و واتساپ", value: s.phone, dir: "ltr" as const },
              { Icon: PinIcon, label: "آدرس انبار", value: s.address },
              { Icon: TruckIcon, label: "ساعات کاری", value: s.workingHours },
            ].map(({ Icon, label, value, dir }) => (
              <div key={label} className="flex items-start gap-3 bg-white p-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-brand text-white">
                  <Icon width={18} height={18} />
                </span>
                <span>
                  <span className="block text-[12px] text-muted">{label}</span>
                  <span className={`num mt-1 block text-[13px] font-medium text-ink`} dir={dir}>
                    {value}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </RevealBox>
      </div>
    </>
  );
}
