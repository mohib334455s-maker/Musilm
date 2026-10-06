"use client";

import { useState } from "react";
import { CartIcon, HeartIcon, TruckIcon } from "@/components/icons";
import { QtyStepper } from "@/components/ui";
import { toProductLite, useCart, useFavorites, useSession, useToast } from "@/components/providers";
import { num, toFa } from "@/lib/format";
import type { CardProduct } from "@/components/product-card";

export function BuyBox({
  product,
  freeDeliveryThreshold,
}: {
  product: CardProduct;
  freeDeliveryThreshold: number;
}) {
  const { add } = useCart();
  const { has, toggle } = useFavorites();
  const { toast } = useToast();
  const user = useSession();
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState<"piece" | "wholesale">("piece");

  const out = product.stock <= 0;
  const wholesaleAvailable = product.wholesalePrice != null;
  const min = wholesaleAvailable ? product.wholesaleMin : 1;
  const activeWholesale = wholesaleAvailable && qty >= product.wholesaleMin;
  const unitPriceNow = activeWholesale
    ? product.wholesalePrice!
    : product.discount > 0
      ? Math.round((product.price * (100 - product.discount)) / 100)
      : product.price;
  const liked = has(product.id);

  function applyUnit(next: "piece" | "wholesale") {
    setUnit(next);
    setQty(next === "wholesale" ? Math.max(product.wholesaleMin, min) : 1);
  }

  function addToCart() {
    add(toProductLite(product), qty);
  }

  async function toggleFav() {
    toggle(product.id);
    if (!user) toast("برای ذخیره دائمی وارد حساب شوید");
  }

  return (
    <div className="rounded-lg border border-line bg-white p-5 md:p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="num text-[12px] text-muted">
            قیمت پرچون <span className="line-through">{num(product.price)}</span> افغانی
          </p>
          <p className="num mt-1 text-[28px] font-bold leading-none text-brand">
            {num(unitPriceNow)} <span className="text-[13px] font-medium text-muted">افغانی</span>
          </p>
        </div>
        {product.discount > 0 ? (
          <span className="num rounded bg-accent px-2 py-1 text-[11.5px] font-bold text-white">
            {toFa(product.discount)}٪ تخفیف
          </span>
        ) : null}
      </div>

      {wholesaleAvailable ? (
        <div className="mt-4 rounded-md border border-line bg-brand-soft p-3.5">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-muted">قیمت عمده</span>
            <span className="num font-bold text-brand">{num(product.wholesalePrice!)} افغانی</span>
          </div>
          <p className="num mt-1 text-[11.5px] text-muted">از {toFa(product.wholesaleMin)} عدد به بالا</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => applyUnit("piece")}
              className={`h-9 flex-1 rounded-md border text-[12.5px] transition ${
                unit === "piece" ? "border-brand bg-white font-semibold text-brand" : "border-line text-muted hover:text-ink"
              }`}
            >
              واحد: {product.unit}
            </button>
            <button
              type="button"
              onClick={() => applyUnit("wholesale")}
              className={`h-9 flex-1 rounded-md border text-[12.5px] transition ${
                unit === "wholesale" ? "border-brand bg-white font-semibold text-brand" : "border-line text-muted hover:text-ink"
              }`}
            >
              خرید عمده ({toFa(product.wholesaleMin)}+)
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="text-[13px] text-muted">انتخاب تعداد</span>
        <QtyStepper value={qty} min={1} max={Math.max(product.stock, 1)} onChange={setQty} />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-[13px]">
        <span className="text-muted">جمع این محصول</span>
        <span className="num font-bold text-ink">{num(unitPriceNow * qty)} افغانی</span>
      </div>

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          disabled={out}
          onClick={addToCart}
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-md bg-brand text-sm font-medium text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
        >
          <CartIcon width={18} height={18} />
          {out ? "ناموجود" : "افزودن به سبد"}
        </button>
        <button
          type="button"
          aria-label="علاقه‌مندی"
          onClick={toggleFav}
          className={`grid h-12 w-12 place-items-center rounded-md border transition ${
            liked ? "border-accent bg-accent text-white" : "border-line text-muted hover:border-accent hover:text-accent"
          }`}
        >
          <HeartIcon width={19} height={19} />
        </button>
      </div>

      <p className="num mt-4 flex items-center gap-2 text-[12px] text-muted">
        <TruckIcon width={15} height={15} className="text-brand" />
        ارسال رایگان برای سفارش بالای {num(freeDeliveryThreshold)} افغانی
      </p>

      {/* sticky mobile buy bar */}
      <div className="fixed inset-x-0 bottom-[60px] z-30 flex items-center gap-3 border-t border-line bg-white/97 px-3 py-2.5 backdrop-blur md:hidden">
        <div className="min-w-0 flex-1">
          <p className="num text-[15px] font-bold leading-none text-brand">
            {num(unitPriceNow * qty)} <span className="text-[10.5px] font-medium text-muted">افغانی</span>
          </p>
          <p className="num mt-1 truncate text-[10.5px] text-muted">
            {toFa(qty)} {product.unit} × {num(unitPriceNow)}
            {activeWholesale ? " · قیمت عمده" : ""}
          </p>
        </div>
        <button
          type="button"
          disabled={out}
          onClick={addToCart}
          className="btn-shine inline-flex h-10 shrink-0 items-center gap-2 rounded-md bg-brand px-4 text-[12.5px] font-semibold text-white transition hover:bg-brand-dark disabled:bg-line disabled:text-muted"
        >
          <CartIcon width={16} height={16} />
          {out ? "ناموجود" : "افزودن به سبد"}
        </button>
      </div>

      <div className="mt-4 rounded-md border border-line px-3.5 py-3 text-[12.5px]">
        {out ? (
          <p className="font-medium text-danger">این محصول فعلاً ناموجود است</p>
        ) : product.stock <= 10 ? (
          <p className="num font-medium text-accent">موجودی کم — فقط {toFa(product.stock)} {product.unit} باقی مانده</p>
        ) : (
          <p className="num text-muted">
            موجودی: <span className="font-semibold text-brand">{toFa(product.stock)}</span> {product.unit}
          </p>
        )}
      </div>
    </div>
  );
}
