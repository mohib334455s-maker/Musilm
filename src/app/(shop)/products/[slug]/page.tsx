import Link from "next/link";
import { notFound } from "next/navigation";
import { getSettings } from "@/lib/settings";
import { getProductBySlug, listProductReviews, listProducts } from "@/lib/store-data";
import { num, toFa, timeAgo } from "@/lib/format";
import { BuyBox } from "@/components/buy-box";
import { Gallery } from "@/components/gallery";
import { ProductCard } from "@/components/product-card";
import { Rail } from "@/components/motion";
import { Reveal } from "@/components/ui";
import { RecentlyViewed, ReviewBox, Stars, TrackView } from "@/components/shop-widgets";
import { ArrowLeft, BoxIcon, CardIcon, CheckIcon, StarIcon, TruckIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

function parseGallery(raw: string | null | undefined, fallback: string | null | undefined): string[] {
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const clean = parsed.filter((x): x is string => typeof x === "string" && x.length > 0);
        if (clean.length) return Array.from(new Set(clean));
      }
    } catch {
      /* fall through */
    }
  }
  return fallback ? [fallback] : [];
}

export default async function ProductPage({ params }: Ctx) {
  const { slug } = await params;
  const s = await getSettings();
  const product = await getProductBySlug(slug);
  if (!product || !product.isActive) notFound();

  const related = product.categorySlug
    ? (await listProducts({ cat: product.categorySlug, limit: 13 })).filter((p) => p.slug !== slug).slice(0, 12)
    : [];

  const reviewRows = await listProductReviews(product.id);
  const reviewCount = reviewRows.length;
  const reviewAvg = reviewCount ? reviewRows.reduce((a, r) => a + r.rating, 0) / reviewCount : Number(product.rating ?? 0);
  const dist = [5, 4, 3, 2, 1].map((star) => reviewRows.filter((r) => r.rating === star).length);

  const out = product.stock <= 0;
  const price = product.discount > 0 ? Math.round((product.price * (100 - product.discount)) / 100) : product.price;
  const sold = product.sold ?? 0;
  const gallery = parseGallery(product.images, product.image);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: gallery,
    description: product.description ?? product.name,
    sku: product.sku ?? undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: "AFN",
      availability: out ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 md:px-6 md:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav aria-label="مسیر" className="flex flex-wrap items-center gap-1.5 text-[12px] text-muted">
        <Link href="/" className="transition hover:text-brand">خانه</Link>
        <span className="text-line">/</span>
        <Link href="/products" className="transition hover:text-brand">محصولات</Link>
        {product.categorySlug ? (
          <>
            <span className="text-line">/</span>
            <Link href={`/products?cat=${product.categorySlug}`} className="transition hover:text-brand">
              {product.categoryName}
            </Link>
          </>
        ) : null}
        <span className="text-line">/</span>
        <span className="truncate text-ink">{product.name}</span>
      </nav>

      <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)_360px] lg:gap-6">
        <Gallery images={gallery} name={product.name} discount={product.discount} out={out} sold={sold} />

        <div>
          {product.brand ? (
            <Link href={`/products?q=${encodeURIComponent(product.brand)}`} className="text-[12px] text-muted transition hover:text-brand">
              برند: {product.brand}
            </Link>
          ) : null}
          <h1 className="mt-1.5 text-[24px] font-bold leading-snug text-ink md:text-[30px]">{product.name}</h1>
          <TrackView product={product} />

          <div className="mt-2.5 flex flex-wrap items-center gap-3">
            <Stars value={product.rating ?? reviewAvg} count={product.reviewCount ?? reviewCount} size={15} showValue />
            <a href="#reviews" className="text-[11.5px] text-muted transition hover:text-brand">
              {reviewCount > 0 ? `خواندن ${toFa(reviewCount)} نقد خریدار` : "اولین نقد را بنویسید"}
            </a>
          </div>

          <div className="num mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-y border-line py-3 text-[12px] text-muted">
            {sold > 0 ? (
              <span className="flex items-center gap-1.5">
                <StarIcon width={13} height={13} className="text-accent" />
                {toFa(sold)} قلم فروخته شده
              </span>
            ) : (
              <span>تازه اضافه شده به فروشگاه</span>
            )}
            <span className="text-line">|</span>
            <span>{product.sizeLabel ?? product.unit}</span>
            {product.sku ? (
              <>
                <span className="text-line">|</span>
                <span dir="ltr">SKU: {product.sku}</span>
              </>
            ) : null}
          </div>

          {product.description ? (
            <p className="mt-5 max-w-prose text-[14px] leading-8 text-ink/85">{product.description}</p>
          ) : null}

          <div className="mt-6 overflow-hidden rounded-xl border border-line">
            <p className="border-b border-line bg-brand-soft px-4 py-2.5 text-[12.5px] font-semibold text-ink">
              پلکان قیمت (عمده و پرچون)
            </p>
            <table className="w-full text-right text-[13px]">
              <tbody className="divide-y divide-line">
                <tr>
                  <td className="px-4 py-3 text-muted">
                    <span className="num">۱ تا {toFa(product.wholesaleMin - 1)} {product.unit}</span>
                  </td>
                  <td className="num px-4 py-3 text-left font-semibold text-ink">{num(price)} ؋</td>
                </tr>
                {product.wholesalePrice != null ? (
                  <tr className="bg-brand/5">
                    <td className="px-4 py-3 text-brand">
                      <span className="num">{toFa(product.wholesaleMin)} {product.unit} به بالا</span>
                    </td>
                    <td className="num px-4 py-3 text-left font-bold text-brand">{num(product.wholesalePrice)} ؋</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              ["دسته‌بندی", product.categoryName ?? "—"],
              ["واحد فروش", product.unit],
              ["وزن / حجم", product.sizeLabel ?? "—"],
              ["موجودی انبار", out ? "ناموجود" : `${toFa(product.stock)} ${product.unit}`],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-3 rounded-lg border border-line px-3.5 py-2.5">
                <span className="text-[12px] text-muted">{k}</span>
                <span className="num text-[12.5px] font-medium text-ink">{v}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-2.5 rounded-xl border border-line p-4">
            {[
              { Icon: TruckIcon, text: `تحویل در ${s.city} بین ۲ تا ۸ ساعت برای نواحی مرکزی` },
              { Icon: BoxIcon, text: `ارسال رایگان برای سفارش بالای ${num(Number(s.freeDeliveryThreshold))} افغانی` },
              { Icon: CardIcon, text: "پرداخت هنگام تحویل، حواله بانکی و پرداخت آنلاین" },
            ].map(({ Icon, text }) => (
              <p key={text} className="num flex items-center gap-2.5 text-[12.5px] text-ink">
                <Icon width={15} height={15} className="shrink-0 text-brand" />
                {text}
              </p>
            ))}
          </div>
        </div>

        <div className="lg:sticky lg:top-32 lg:h-fit">
          <BuyBox product={product} freeDeliveryThreshold={Number(s.freeDeliveryThreshold) || 0} />
          <div className="mt-3 rounded-xl border border-line p-4">
            <p className="flex items-center gap-2 text-[12.5px] font-semibold text-ink">
              <CheckIcon width={15} height={15} className="text-brand" />
              ضمانت اصالت و تازگی کالا
            </p>
            <p className="num mt-2 text-[11.5px] leading-6 text-muted">
              اقلام تاریخ‌گذشته یا آسیب‌دیده تا ۲۴ ساعت پس از تحویل تعویض می‌شوند.
            </p>
            <Link href="/contact" className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-brand">
              سوال درباره این محصول؟
              <ArrowLeft width={14} height={14} />
            </Link>
          </div>
        </div>
      </div>

      <section id="reviews" className="mt-14 scroll-mt-36">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
          <div>
            <h2 className="text-[20px] font-bold text-ink md:text-[24px]">نقد و امتیاز خریداران</h2>
            <p className="num mt-1 text-[12.5px] text-muted">
              {reviewCount > 0 ? `${toFa(reviewCount)} نقد ثبت شده برای این محصول` : "هنوز نقدی ثبت نشده است"}
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
          <div className="space-y-4">
            {reviewCount > 0 ? (
              <div className="space-y-2 rounded-xl border border-line bg-white p-4">
                {dist.map((c, i) => {
                  const star = 5 - i;
                  const pct = Math.round((c / reviewCount) * 100);
                  return (
                    <div key={star} className="flex items-center gap-3 text-[11.5px]">
                      <span className="num w-12 shrink-0 text-muted">{toFa(star)} ستاره</span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EDEFEA]">
                        <span className="block h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                      </span>
                      <span className="num w-6 shrink-0 text-left text-muted">{toFa(c)}</span>
                    </div>
                  );
                })}
              </div>
            ) : null}
            <ReviewBox productId={product.id} slug={product.slug} />
          </div>

          <div className="space-y-3">
            {reviewRows.map((r) => (
              <article key={r.id} className="rounded-xl border border-line bg-white p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="display-font grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft text-[13px] font-bold text-brand">
                    {r.name.slice(0, 1)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold text-ink">{r.name}</span>
                    <span className="num mt-0.5 block text-[11px] text-muted">{timeAgo(r.createdAt)}</span>
                  </span>
                  <span className="mr-auto">
                    <Stars value={r.rating} size={13} />
                  </span>
                </div>
                {r.body ? <p className="mt-3 text-[13px] leading-7 text-ink/85">{r.body}</p> : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      <RecentlyViewed exceptId={product.id} />

      {related.length ? (
        <section className="mt-14">
          <Reveal>
            <Rail
              title="محصولات مشابه"
              href={`/products?cat=${product.categorySlug}`}
              note={`از دسته ${product.categoryName}`}
              itemClass="w-[calc(50%-6px)] sm:w-[calc(33.333%-8px)] lg:w-[calc(25%-9px)] xl:w-[calc(20%-10px)]"
            >
              {related.map((p) => (
                <ProductCard key={p.id} product={p} compact />
              ))}
            </Rail>
          </Reveal>
        </section>
      ) : null}
    </div>
  );
}

export async function generateMetadata({ params }: Ctx) {
  const { slug } = await params;
  const row = await getProductBySlug(slug);
  const title = row ? `${row.name} | Muslim Store` : "محصول | Muslim Store";
  return {
    title,
    description: row?.description ?? `خرید ${row?.name ?? "محصول"} از مسلم استور مزارشریف`,
    openGraph: {
      title,
      description: row?.description ?? undefined,
      images: row?.image ? [{ url: row.image }] : undefined,
    },
  };
}
