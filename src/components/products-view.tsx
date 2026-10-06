"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CartIcon, GridIcon, HeartIcon, MenuIcon, TruckIcon } from "@/components/icons";
import { ProductCard, type CardProduct } from "@/components/product-card";
import { QtyStepper, Button, Empty, Reveal } from "@/components/ui";
import { toProductLite, unitPrice, useCart, useFavorites } from "@/components/providers";
import { num, toFa } from "@/lib/format";

const SORTS = [
  { value: "popular", label: "پرفروش‌ترین" },
  { value: "new", label: "جدیدترین" },
  { value: "cheap", label: "ارزان‌ترین" },
  { value: "expensive", label: "گران‌ترین" },
];

export function ProductsView({
  items,
  sort,
  q,
  cat,
}: {
  items: CardProduct[];
  sort: string;
  q: string;
  cat: string;
}) {
  const router = useRouter();
  const [view, setView] = useState<"grid" | "list">("grid");

  useEffect(() => {
    const saved = window.localStorage.getItem("ms_view");
    if (saved === "list" || saved === "grid") setView(saved);
  }, []);

  function changeView(next: "grid" | "list") {
    setView(next);
    window.localStorage.setItem("ms_view", next);
  }

  function changeSort(next: string) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (cat) params.set("cat", cat);
    if (next !== "popular") params.set("sort", next);
    router.push(`/products${params.toString() ? `?${params}` : ""}`);
  }

  if (!items.length) {
    return (
      <div className="mt-8">
        <Empty
          title="محصولی پیدا نشد"
          note="عبارت دیگری را جستجو کنید یا دسته‌بندی را تغییر دهید."
          action={
            <Link href="/products" className="rounded-md bg-brand px-5 py-2.5 text-sm text-white">
              همه محصولات
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <>
      <div className="sticky top-[62px] z-30 -mx-4 mt-5 border-b border-line bg-white/95 px-4 py-2.5 backdrop-blur md:-mx-6 md:top-[124px] md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="num text-[12.5px] text-muted">
            <span className="font-semibold text-ink">{toFa(items.length)}</span> محصول یافت شد
            {q ? <span className="text-muted"> برای «{q}»</span> : null}
          </p>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 rounded-md border border-line px-2.5 py-1.5">
              <span className="text-[11.5px] text-muted">مرتب‌سازی</span>
              <select
                value={sort}
                onChange={(e) => changeSort(e.target.value)}
                className="bg-transparent text-[12.5px] font-medium text-ink outline-none"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex overflow-hidden rounded-md border border-line">
              <button
                type="button"
                aria-label="نمای شبکه‌ای"
                onClick={() => changeView("grid")}
                className={`grid h-9 w-9 place-items-center transition ${
                  view === "grid" ? "bg-brand text-white" : "text-muted hover:text-brand"
                }`}
              >
                <GridIcon width={16} height={16} />
              </button>
              <button
                type="button"
                aria-label="نمای فهرستی"
                onClick={() => changeView("list")}
                className={`grid h-9 w-9 place-items-center border-r border-line transition ${
                  view === "list" ? "bg-brand text-white" : "text-muted hover:text-brand"
                }`}
              >
                <MenuIcon width={16} height={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {view === "grid" ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((p, i) => (
            <Reveal key={p.id} delay={Math.min(i, 10) * 30}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((p, i) => (
            <Reveal key={p.id} delay={Math.min(i, 8) * 25}>
              <ListRow product={p} />
            </Reveal>
          ))}
        </div>
      )}
    </>
  );
}

function ListRow({ product }: { product: CardProduct }) {
  const { add } = useCart();
  const { has, toggle } = useFavorites();
  const [qty, setQty] = useState(1);
  const out = product.stock <= 0;
  const price = product.discount > 0 ? Math.round((product.price * (100 - product.discount)) / 100) : product.price;
  const unit = unitPrice({ ...product, qty });
  const liked = has(product.id);

  return (
    <article className="card-lift grid gap-4 rounded-lg border border-line bg-white p-3.5 sm:grid-cols-[120px_1fr_auto] sm:p-4">
      <Link href={`/products/${product.slug}`} className="block aspect-square overflow-hidden rounded-md bg-brand-soft">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover" />
        ) : null}
      </Link>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {product.brand ? <span className="rounded bg-brand-soft px-1.5 py-0.5 text-[10.5px] text-brand">{product.brand}</span> : null}
          {product.discount > 0 ? (
            <span className="num rounded bg-accent px-1.5 py-0.5 text-[10.5px] font-bold text-white">{toFa(product.discount)}٪ تخفیف</span>
          ) : null}
          {out ? <span className="rounded bg-danger/10 px-1.5 py-0.5 text-[10.5px] font-semibold text-danger">ناموجود</span> : null}
          {(product.sold ?? 0) > 0 ? <span className="num text-[10.5px] text-muted">{toFa(product.sold ?? 0)} فروش</span> : null}
        </div>

        <Link href={`/products/${product.slug}`} className="mt-1.5 block text-[15px] font-semibold text-ink transition hover:text-brand">
          {product.name}
        </Link>
        <p className="num mt-1 text-[11.5px] text-muted">{product.sizeLabel ?? product.unit}</p>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12px]">
          {product.wholesalePrice ? (
            <span className="num flex items-center gap-1.5 text-muted">
              <TruckIcon width={14} height={14} className="text-brand" />
              عمده از {toFa(product.wholesaleMin)} عدد: <span className="font-semibold text-brand">{num(product.wholesalePrice)} ؋</span>
            </span>
          ) : null}
          <span className="num text-muted">
            موجودی:{" "}
            <span className={out ? "font-semibold text-danger" : product.stock <= 10 ? "font-semibold text-accent" : "text-ink"}>
              {out ? "ناموجود" : `${toFa(product.stock)} ${product.unit}`}
            </span>
          </span>
        </div>
      </div>

      <div className="flex flex-row items-center justify-between gap-3 border-t border-line pt-3 sm:flex-col sm:items-end sm:justify-start sm:border-t-0 sm:pt-0">
        <div className="text-right">
          <p className="num text-[19px] font-bold leading-none text-brand">{num(unit)}</p>
          <p className="num mt-1 text-[11px] text-muted">
            افغانی / {product.unit}
            {product.discount > 0 ? <span className="mr-1 line-through">{num(product.price)}</span> : null}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <QtyStepper size="sm" value={qty} min={1} max={Math.max(product.stock, 1)} onChange={setQty} />
          <button
            type="button"
            aria-label="علاقه‌مندی"
            onClick={() => toggle(product.id)}
            className={`grid h-9 w-9 place-items-center rounded-md border transition ${
              liked ? "border-accent bg-accent text-white" : "border-line text-muted hover:border-accent hover:text-accent"
            }`}
          >
            <HeartIcon width={16} height={16} />
          </button>
        </div>
        <Button type="button" className="btn-shine h-10 w-full px-4 text-[13px] sm:w-auto" disabled={out} onClick={() => add(toProductLite(product), qty)}>
          <CartIcon width={16} height={16} />
          {out ? "ناموجود" : "افزودن به سبد"}
        </Button>
      </div>
    </article>
  );
}
