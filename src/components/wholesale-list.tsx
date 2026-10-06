"use client";

import { useState } from "react";
import Link from "next/link";
import { CartIcon } from "@/components/icons";
import { QtyStepper } from "@/components/ui";
import { toProductLite, useCart } from "@/components/providers";
import { num, toFa } from "@/lib/format";
import type { CardProduct } from "@/components/product-card";

export function WholesaleList({ products }: { products: CardProduct[] }) {
  const { add } = useCart();
  const [qtys, setQtys] = useState<Record<number, number>>({});

  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <div className="hidden grid-cols-[2.4fr_1fr_1fr_1fr_auto] items-center gap-3 bg-brand-soft px-4 py-3 text-[12px] text-muted md:grid">
        <span>محصول</span>
        <span>پرچون</span>
        <span>عمده</span>
        <span>حداقل تعداد</span>
        <span className="pl-1">افزودن</span>
      </div>
      <div className="divide-y divide-line">
        {products.map((p) => {
          const qty = qtys[p.id] ?? p.wholesaleMin;
          const out = p.stock <= 0;
          return (
            <div
              key={p.id}
              className="grid gap-3 px-4 py-4 transition hover:bg-brand-soft/50 md:grid-cols-[2.4fr_1fr_1fr_1fr_auto] md:items-center"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-brand-soft">
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <Link href={`/products/${p.slug}`} className="line-clamp-1 text-[13.5px] font-medium hover:text-brand">
                    {p.name}
                  </Link>
                  <p className="num mt-0.5 text-[11px] text-muted">{p.sizeLabel ?? p.unit}</p>
                </div>
              </div>
              <p className="num text-[13px] text-muted line-through md:text-[13px]">{num(p.price)} ؋</p>
              <p className="num text-[14px] font-bold text-brand">{num(p.wholesalePrice ?? p.price)} ؋</p>
              <p className="num text-[12.5px] text-muted">از {toFa(p.wholesaleMin)} {p.unit}</p>
              <div className="flex items-center gap-2">
                <QtyStepper
                  size="sm"
                  value={qty}
                  min={1}
                  max={Math.max(p.stock, 1)}
                  onChange={(v) => setQtys((prev) => ({ ...prev, [p.id]: v }))}
                />
                <button
                  type="button"
                  disabled={out}
                  onClick={() => add(toProductLite(p), qty)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line px-3 text-[12px] font-medium transition hover:border-brand hover:bg-brand hover:text-white disabled:opacity-50"
                >
                  <CartIcon width={14} height={14} />
                  {out ? "ناموجود" : "افزودن"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
