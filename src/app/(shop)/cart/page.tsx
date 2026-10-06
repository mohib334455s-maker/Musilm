"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CartIcon, TrashIcon, TruckIcon } from "@/components/icons";
import { unitPrice, useCart } from "@/components/providers";
import { Button, Empty, QtyStepper } from "@/components/ui";
import { num, toFa } from "@/lib/format";

type Zone = { id: number; name: string; fee: number; minOrder: number; freeOver: number; eta: string };

export default function CartPage() {
  const { items, ready, setQty, remove, clear, subtotal, savings, count } = useCart();
  const [zones, setZones] = useState<Zone[]>([]);
  const [zoneId, setZoneId] = useState<number | null>(null);
  const [threshold, setThreshold] = useState(2000);

  useEffect(() => {
    fetch("/api/zones")
      .then((r) => r.json())
      .then((d) => {
        setZones(d.items ?? []);
        setThreshold(d.freeDeliveryThreshold ?? 2000);
        if (d.items?.length) setZoneId(d.items[0].id);
      })
      .catch(() => undefined);
  }, []);

  const zone = zones.find((z) => z.id === zoneId) ?? null;
  const fee = !zone || subtotal >= (zone.freeOver || threshold) ? 0 : zone.fee;
  const total = subtotal + fee;
  const remaining = Math.max(0, (zone?.freeOver || threshold) - subtotal);

  if (!ready) {
    return <div className="mx-auto max-w-[1280px] px-4 py-24 text-center text-sm text-muted">در حال بارگذاری سبد…</div>;
  }

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-6 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-5">
        <div>
          <h1 className="text-[26px] font-bold text-ink md:text-[32px]">سبد خرید</h1>
          <p className="num mt-1.5 text-[13px] text-muted">{toFa(count)} قلم محصول</p>
        </div>
        {items.length ? (
          <button onClick={clear} className="text-[12.5px] text-muted transition hover:text-danger">
            خالی کردن سبد
          </button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="mt-10">
          <Empty
            title="سبد خرید شما خالی است"
            note="از صفحه محصولات یا خرید عمده، کالای مورد نیاز را اضافه کنید."
            action={
              <Link href="/products" className="rounded-md bg-brand px-5 py-2.5 text-sm text-white transition hover:bg-brand-dark">
                شروع خرید
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="overflow-hidden rounded-lg border border-line">
            <div className="hidden grid-cols-[3fr_1fr_1fr_auto] gap-3 bg-brand-soft px-4 py-3 text-[12px] text-muted md:grid">
              <span>محصول</span>
              <span>تعداد</span>
              <span>قیمت</span>
              <span>حذف</span>
            </div>
            <div className="divide-y divide-line">
              {items.map((item) => {
                const unit = unitPrice(item);
                const wholesale = item.wholesalePrice != null && item.qty >= item.wholesaleMin;
                return (
                  <div key={item.id} className="grid gap-3 px-4 py-4 md:grid-cols-[3fr_1fr_1fr_auto] md:items-center">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-brand-soft">
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <Link href={`/products/${item.slug}`} className="line-clamp-1 text-[13.5px] font-medium hover:text-brand">
                          {item.name}
                        </Link>
                        <p className="num mt-0.5 text-[11.5px] text-muted">
                          {item.sizeLabel ?? item.unit} · {num(unit)} ؋ / {item.unit}
                        </p>
                        {wholesale ? (
                          <p className="num mt-1 inline-block rounded bg-brand/10 px-1.5 py-0.5 text-[10.5px] font-semibold text-brand">
                            قیمت عمده فعال شد
                          </p>
                        ) : item.wholesalePrice ? (
                          <p className="num mt-1 text-[10.5px] text-muted">
                            {toFa(Math.max(1, item.wholesaleMin - item.qty))} عدد دیگر تا قیمت عمده
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <QtyStepper size="sm" value={item.qty} max={Math.max(item.stock, 1)} onChange={(v) => setQty(item.id, v)} />
                    <p className="num text-[14px] font-semibold text-ink">{num(unit * item.qty)} ؋</p>
                    <button
                      type="button"
                      aria-label="حذف"
                      onClick={() => remove(item.id)}
                      className="grid h-9 w-9 place-items-center rounded-md border border-line text-muted transition hover:border-danger hover:text-danger"
                    >
                      <TrashIcon width={16} height={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="h-fit rounded-lg border border-line p-5">
            <h2 className="text-[15px] font-bold text-ink">جمع سفارش</h2>

            <div className="mt-4">
              <label className="mb-1.5 block text-[12.5px] text-muted" htmlFor="zone">
                منطقه تحویل
              </label>
              <select
                id="zone"
                value={zoneId ?? ""}
                onChange={(e) => setZoneId(Number(e.target.value))}
                className="h-11 w-full rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-brand"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>

            <dl className="mt-5 space-y-2.5 border-t border-line pt-4 text-[13.5px]">
              <div className="flex justify-between">
                <dt className="text-muted">جمع محصولات</dt>
                <dd className="num font-medium">{num(subtotal)} ؋</dd>
              </div>
              {savings > 0 ? (
                <div className="flex justify-between text-brand">
                  <dt>سود شما از قیمت عمده</dt>
                  <dd className="num font-semibold">{num(savings)} ؋</dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt className="text-muted">کرایه ({zone?.name ?? "—"})</dt>
                <dd className="num font-medium">{fee === 0 ? "رایگان" : `${num(fee)} ؋`}</dd>
              </div>
              {remaining > 0 && zone ? (
                <div className="rounded-md bg-brand-soft px-3 py-2.5 text-[12px] text-muted">
                  <p className="flex items-center gap-1.5">
                    <TruckIcon width={14} height={14} className="text-brand" />
                    <span className="num">{num(remaining)} افغانی دیگر تا ارسال رایگان</span>
                  </p>
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full bg-brand transition-all duration-500"
                      style={{ width: `${Math.min(100, (subtotal / (zone.freeOver || threshold)) * 100)}%` }}
                    />
                  </div>
                </div>
              ) : null}
              <div className="flex items-baseline justify-between border-t border-line pt-3">
                <dt className="font-semibold">جمع کل</dt>
                <dd className="num text-[18px] font-bold text-brand">{num(total)} ؋</dd>
              </div>
            </dl>

            <Link href="/checkout" className="mt-5 block">
              <Button className="w-full" type="button">
                <CartIcon width={17} height={17} />
                تکمیل سفارش
              </Button>
            </Link>
            <Link
              href="/products"
              className="mt-2.5 flex items-center justify-center gap-1.5 text-[12.5px] text-muted transition hover:text-brand"
            >
              <ArrowLeft width={14} height={14} className="rotate-180" />
              ادامه خرید
            </Link>
            <p className="mt-4 text-center text-[11.5px] text-muted">سبد خرید شما ذخیره می‌شود و بعد از بستن مرورگر هم باقی می‌ماند.</p>
          </aside>
        </div>
      )}
    </div>
  );
}
