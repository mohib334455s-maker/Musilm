"use client";

import Link from "next/link";
import { useState } from "react";
import { CartIcon, HeartIcon } from "@/components/icons";
import { toProductLite, useCart, useFavorites } from "@/components/providers";
import { QuickView, Stars, rememberProduct } from "@/components/shop-widgets";
import { num, toFa } from "@/lib/format";

export type CardProduct = {
  id: number;
  slug: string;
  name: string;
  brand?: string | null;
  image: string | null;
  sizeLabel: string | null;
  unit: string;
  price: number;
  wholesalePrice: number | null;
  wholesaleMin: number;
  discount: number;
  stock: number;
  sold?: number;
  rating?: number;
  reviewCount?: number;
};

export function effectivePrice(p: CardProduct): number {
  return p.discount > 0 ? Math.round((p.price * (100 - p.discount)) / 100) : p.price;
}

const EyeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2.6 12S6 6.4 12 6.4 21.4 12 21.4 12 18 17.6 12 17.6 2.6 12 2.6 12Z" />
    <circle cx="12" cy="12" r="2.6" />
  </svg>
);

export function ProductCard({
  product,
  claimed,
  compact = false,
}: {
  product: CardProduct;
  claimed?: number;
  compact?: boolean;
}) {
  const { add } = useCart();
  const { has, toggle } = useFavorites();
  const [quick, setQuick] = useState(false);
  const out = product.stock <= 0;
  const low = !out && product.stock <= 10;
  const price = effectivePrice(product);
  const liked = has(product.id);
  const save = product.price - price;
  const sold = product.sold ?? 0;

  return (
    <article className="card-lift group relative flex h-full flex-col overflow-hidden rounded-lg border border-line bg-white">
      <Link
        href={`/products/${product.slug}`}
        onClick={() => rememberProduct(product)}
        className="relative block aspect-[4/3] overflow-hidden bg-brand-soft"
      >
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className={`h-full w-full object-cover transition duration-700 group-hover:scale-[1.06] ${
              out ? "opacity-45 grayscale" : ""
            }`}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[11px] text-muted">بدون تصویر</span>
        )}

        <span className="absolute right-2 top-2 flex flex-col items-start gap-1">
          {product.discount > 0 && !out ? (
            <span className="num rounded bg-accent px-1.5 py-0.5 text-[10.5px] font-bold text-white">
              {toFa(product.discount)}٪−
            </span>
          ) : null}
          {sold >= 50 ? (
            <span className="rounded bg-brand px-1.5 py-0.5 text-[10px] font-medium text-white">پرفروش</span>
          ) : null}
        </span>

        <span className="absolute left-2 top-2 flex flex-col gap-1.5">
          <button
            type="button"
            aria-label="علاقه‌مندی"
            onClick={() => toggle(product.id)}
            className={`grid h-7 w-7 place-items-center rounded-full border transition max-md:opacity-100 ${
              liked
                ? "border-accent bg-accent text-white opacity-100"
                : "border-line bg-white/90 text-muted opacity-0 group-hover:opacity-100 hover:border-accent hover:text-accent"
            }`}
          >
            <HeartIcon width={14} height={14} />
          </button>
          <button
            type="button"
            aria-label="نمای سریع"
            onClick={() => setQuick(true)}
            className="grid h-7 w-7 place-items-center rounded-full border border-line bg-white/90 text-muted opacity-0 transition group-hover:opacity-100 hover:border-brand hover:text-brand max-md:opacity-100"
          >
            <EyeIcon width={14} height={14} />
          </button>
        </span>

        {out ? (
          <span className="absolute inset-x-2 bottom-2 rounded bg-ink/85 py-0.5 text-center text-[10.5px] font-medium text-white">
            ناموجود
          </span>
        ) : low ? (
          <span className="num absolute inset-x-2 bottom-2 rounded bg-white/92 py-0.5 text-center text-[10px] font-medium text-accent">
            فقط {toFa(product.stock)} عدد باقی مانده
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col p-2.5 md:p-3">
        {!compact && product.brand ? (
          <p className="text-[10px] font-medium tracking-wide text-brand/70">{product.brand}</p>
        ) : product.brand ? (
          <p className="mb-0.5 text-[10px] text-muted">{product.brand}</p>
        ) : null}

        <Link
          href={`/products/${product.slug}`}
          onClick={() => rememberProduct(product)}
          className={`line-clamp-2 text-[12.5px] font-medium leading-5 text-ink transition group-hover:text-brand ${
            compact ? "mt-0" : "mt-0.5 min-h-[40px]"
          }`}
        >
          {product.name}
        </Link>

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <Stars value={product.rating ?? 0} count={product.reviewCount ?? 0} size={12} />
          <p className="num line-clamp-1 text-[10.5px] text-muted">
            {product.sizeLabel ?? product.unit}
            {sold > 0 ? ` · ${toFa(sold)} فروش` : ""}
          </p>
        </div>

        {claimed != null && claimed > 0 && !out ? (
          <div className="mt-2">
            <div className="h-1 w-full overflow-hidden rounded-full bg-[#EDEFEA]">
              <div className="h-full rounded-full bg-accent transition-all duration-700" style={{ width: `${claimed}%` }} />
            </div>
            <p className="num mt-1 text-[10px] text-accent">{toFa(claimed)}٪ فروخته شد</p>
          </div>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-2 pt-2.5">
          <div className="min-w-0">
            <p className="num flex items-baseline gap-1">
              <span className="text-[15px] font-bold leading-none text-brand">{num(price)}</span>
              <span className="text-[10px] text-muted">افغانی</span>
            </p>
            {save > 0 ? (
              <p className="num mt-1 line-clamp-1 text-[10px] text-muted line-through">{num(product.price)}</p>
            ) : product.wholesalePrice ? (
              <p className="num mt-1 line-clamp-1 text-[10px] text-muted">
                عمده {num(product.wholesalePrice)} از {toFa(product.wholesaleMin)}+
              </p>
            ) : null}
          </div>

          <button
            type="button"
            disabled={out}
            onClick={() => add(toProductLite(product))}
            aria-label={out ? "ناموجود" : `افزودن ${product.name} به سبد`}
            className="btn-shine inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-brand px-2.5 text-[11.5px] font-medium text-white transition hover:bg-brand-dark active:scale-95 disabled:bg-line disabled:text-muted"
          >
            <CartIcon width={14} height={14} />
            {out ? "ناموجود" : "افزودن"}
          </button>
        </div>
      </div>

      {quick ? <QuickView slug={product.slug} onClose={() => setQuick(false)} /> : null}
    </article>
  );
}
