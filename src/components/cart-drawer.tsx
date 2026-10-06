"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowLeft, CartIcon, CloseIcon, TrashIcon, TruckIcon } from "@/components/icons";
import { unitPrice, useCart } from "@/components/providers";
import { QtyStepper } from "@/components/ui";
import { num, toFa } from "@/lib/format";

export function CartDrawer({ onClose }: { onClose: () => void }) {
  const { items, setQty, remove, subtotal, savings, count } = useCart();
  const freeOver = 2000;
  const remaining = Math.max(0, freeOver - subtotal);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} />
      <aside className="animate-rise absolute inset-y-0 left-0 flex w-full max-w-[400px] flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-line bg-brand px-4 py-3.5 text-white">
          <span className="flex items-center gap-2.5">
            <CartIcon width={19} height={19} />
            <span>
              <span className="block text-[14px] font-bold leading-tight">سبد خرید</span>
              <span className="num mt-0.5 block text-[11px] text-white/70">{toFa(count)} قلم</span>
            </span>
          </span>
          <button type="button" aria-label="بستن" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg bg-white/12 transition hover:bg-white/22">
            <CloseIcon width={18} height={18} />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-brand">
              <CartIcon width={24} height={24} />
            </span>
            <div>
              <p className="text-[14px] font-semibold text-ink">سبد خرید شما خالی است</p>
              <p className="mt-1.5 text-[12.5px] leading-6 text-muted">
                از صفحه محصولات یا خرید عمده کالا اضافه کنید؛ قیمت عمده خودکار محاسبه می‌شود.
              </p>
            </div>
            <Link
              href="/products"
              onClick={onClose}
              className="btn-shine inline-flex h-10 items-center rounded-md bg-brand px-5 text-[13px] font-medium text-white transition hover:bg-brand-dark"
            >
              شروع خرید
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              {remaining > 0 ? (
                <div className="border-b border-line bg-brand-soft px-4 py-3">
                  <p className="num flex items-center gap-2 text-[11.5px] text-ink">
                    <TruckIcon width={14} height={14} className="text-brand" />
                    <span>{num(remaining)} افغانی دیگر تا ارسال رایگان</span>
                  </p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${Math.min(100, (subtotal / freeOver) * 100)}%` }} />
                  </div>
                </div>
              ) : (
                <p className="num flex items-center gap-2 border-b border-line bg-brand/8 px-4 py-3 text-[11.5px] font-medium text-brand">
                  <TruckIcon width={14} height={14} />
                  سفارش شما شامل ارسال رایگان می‌شود
                </p>
              )}

              <ul className="divide-y divide-line">
                {items.map((item) => {
                  const unit = unitPrice(item);
                  const wholesale = item.wholesalePrice != null && item.qty >= item.wholesaleMin;
                  return (
                    <li key={item.id} className="flex gap-3 p-3.5">
                      <Link href={`/products/${item.slug}`} onClick={onClose} className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-brand-soft">
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                        ) : null}
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link href={`/products/${item.slug}`} onClick={onClose} className="line-clamp-2 text-[12.5px] font-medium leading-5 text-ink hover:text-brand">
                          {item.name}
                        </Link>
                        <p className="num mt-1 text-[11px] text-muted">
                          {num(unit)} ؋ / {item.unit}
                          {wholesale ? <span className="mr-1.5 font-semibold text-brand">· قیمت عمده</span> : null}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <QtyStepper size="sm" value={item.qty} max={Math.max(item.stock, 1)} onChange={(v) => setQty(item.id, v)} />
                          <span className="num text-[13px] font-bold text-ink">{num(unit * item.qty)} ؋</span>
                          <button type="button" aria-label="حذف" onClick={() => remove(item.id)} className="grid h-8 w-8 place-items-center rounded-md border border-line text-muted transition hover:border-danger hover:text-danger">
                            <TrashIcon width={15} height={15} />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <footer className="border-t border-line p-4">
              <dl className="space-y-1.5 text-[12.5px]">
                {savings > 0 ? (
                  <div className="num flex justify-between text-brand">
                    <dt>سود شما از قیمت عمده</dt>
                    <dd className="font-semibold">{num(savings)} ؋</dd>
                  </div>
                ) : null}
                <div className="num flex items-baseline justify-between border-t border-line pt-2">
                  <dt className="text-[13px] font-semibold text-ink">جمع سبد</dt>
                  <dd className="text-[18px] font-bold text-brand">{num(subtotal)} ؋</dd>
                </div>
              </dl>
              <div className="mt-3 grid gap-2">
                <Link href="/checkout" onClick={onClose} className="btn-shine inline-flex h-11 items-center justify-center gap-2 rounded-md bg-brand text-[13.5px] font-semibold text-white transition hover:bg-brand-dark">
                  تکمیل سفارش
                  <ArrowLeft width={16} height={16} />
                </Link>
                <Link href="/cart" onClick={onClose} className="inline-flex h-10 items-center justify-center rounded-md border border-line text-[12.5px] text-ink transition hover:border-brand hover:text-brand">
                  دیدن سبد خرید
                </Link>
              </div>
              <p className="mt-2.5 text-center text-[10.5px] text-muted">کرایه در مرحله تحویل بر اساس منطقه محاسبه می‌شود.</p>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
