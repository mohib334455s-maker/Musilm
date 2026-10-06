"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BoxIcon, CartIcon, SearchIcon, TrashIcon } from "@/components/icons";
import { QtyStepper, Button, inputClass } from "@/components/ui";
import { toProductLite, unitPrice, useCart, useSession, useToast } from "@/components/providers";
import { num, toFa } from "@/lib/format";
import type { CardProduct } from "@/components/product-card";

type Basket = { id: number; name: string; updatedAt: string; items: { id: number; qty: number }[] };

export function MonthlyBuilder({ products }: { products: CardProduct[] }) {
  const { add } = useCart();
  const user = useSession();
  const { toast } = useToast();
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [q, setQ] = useState("");
  const [name, setName] = useState("سبد ماهانه خانه");
  const [baskets, setBaskets] = useState<Basket[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetch("/api/account")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.baskets) setBaskets(d.baskets);
      })
      .catch(() => undefined);
  }, [user]);

  const filtered = useMemo(() => {
    const needle = q.trim();
    if (!needle) return products;
    return products.filter((p) => p.name.includes(needle) || (p.brand ?? "").includes(needle));
  }, [products, q]);

  const chosen = useMemo(
    () =>
      products
        .filter((p) => (picked[p.id] ?? 0) > 0)
        .map((p) => ({ product: p, qty: picked[p.id] })),
    [products, picked],
  );

  const total = chosen.reduce((sum, c) => sum + unitPrice({ ...c.product, qty: c.qty }) * c.qty, 0);

  function setQty(id: number, qty: number) {
    setPicked((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });
  }

  function addAllToCart() {
    if (!chosen.length) return;
    for (const c of chosen) add(toProductLite(c.product), c.qty);
    toast("سبد ماهانه به سبد خرید اضافه شد");
  }

  async function saveBasket() {
    if (!user) {
      toast("برای ذخیره سبد، وارد حساب کاربری شوید");
      return;
    }
    if (!chosen.length) {
      toast("هیچ محصولی انتخاب نشده است");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "basket:save",
          name,
          items: chosen.map((c) => ({ id: c.product.id, qty: c.qty })),
        }),
      });
      if (!res.ok) throw new Error("save failed");
      toast("سبد ماهانه ذخیره شد");
      const data = await fetch("/api/account").then((r) => (r.ok ? r.json() : null));
      if (data?.baskets) setBaskets(data.baskets);
    } catch {
      toast("ذخیره سبد ناموفق بود");
    } finally {
      setSaving(false);
    }
  }

  async function deleteBasket(id: number) {
    await fetch("/api/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "basket:delete", id }),
    });
    setBaskets((prev) => prev.filter((b) => b.id !== id));
    toast("سبد حذف شد");
  }

  function loadBasket(b: Basket) {
    const next: Record<number, number> = {};
    for (const item of b.items) next[item.id] = item.qty;
    setPicked(next);
    setName(b.name);
    toast("سبد ذخیره‌شده بارگذاری شد");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div>
        {baskets.length ? (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="text-[12.5px] text-muted">سبدهای ذخیره‌شده:</span>
            {baskets.map((b) => (
              <span key={b.id} className="flex items-center gap-1 rounded-full border border-line bg-white">
                <button type="button" onClick={() => loadBasket(b)} className="px-3 py-1.5 text-[12.5px] text-ink transition hover:text-brand">
                  {b.name}
                </button>
                <button type="button" aria-label="حذف" onClick={() => deleteBasket(b.id)} className="pr-1 pl-2.5 text-muted transition hover:text-danger">
                  <TrashIcon width={14} height={14} />
                </button>
              </span>
            ))}
          </div>
        ) : null}

        <div className="relative mb-4">
          <SearchIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" width={17} height={17} />
          <input
            className={`${inputClass} pr-10`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جستجو در محصولات برای سبد ماهانه…"
          />
        </div>

        <div className="divide-y divide-line overflow-hidden rounded-lg border border-line">
          {filtered.map((p) => {
            const qty = picked[p.id] ?? 0;
            const unit = unitPrice({ ...p, qty: qty || 1 });
            return (
              <div key={p.id} className={`flex flex-wrap items-center gap-3 px-4 py-3 transition ${qty ? "bg-brand/5" : "hover:bg-brand-soft/60"}`}>
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-brand-soft">
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/products/${p.slug}`} className="line-clamp-1 text-[13.5px] font-medium hover:text-brand">
                    {p.name}
                  </Link>
                  <p className="num mt-0.5 text-[11.5px] text-muted">
                    {p.sizeLabel ?? p.unit} · {num(unit)} ؋
                  </p>
                </div>
                {qty > 0 ? (
                  <QtyStepper size="sm" value={qty} max={Math.max(p.stock, 1)} onChange={(v) => setQty(p.id, v)} />
                ) : (
                  <button
                    type="button"
                    disabled={p.stock <= 0}
                    onClick={() => setQty(p.id, 1)}
                    className="rounded-md border border-line px-3 py-1.5 text-[12px] transition hover:border-brand hover:bg-brand hover:text-white disabled:opacity-40"
                  >
                    {p.stock <= 0 ? "ناموجود" : "انتخاب"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <aside className="h-fit rounded-lg border border-line p-5 lg:sticky lg:top-24">
        <h2 className="flex items-center gap-2 text-[15px] font-bold text-ink">
          <BoxIcon width={17} height={17} className="text-brand" />
          سبد ماهانه
        </h2>
        <input className={`${inputClass} mt-3`} value={name} onChange={(e) => setName(e.target.value)} aria-label="نام سبد" />

        {chosen.length === 0 ? (
          <p className="mt-4 rounded-md border border-dashed border-line px-4 py-6 text-center text-[12.5px] text-muted">
            هنوز محصولی انتخاب نکرده‌اید.
          </p>
        ) : (
          <ul className="mt-4 max-h-[280px] space-y-2 overflow-auto text-[12.5px]">
            {chosen.map((c) => (
              <li key={c.product.id} className="flex items-center justify-between gap-2">
                <span className="min-w-0 flex-1 truncate text-muted">{c.product.name}</span>
                <span className="num shrink-0 text-ink">
                  {toFa(c.qty)} × {num(unitPrice({ ...c.product, qty: c.qty }))}
                </span>
                <button type="button" aria-label="حذف" onClick={() => setQty(c.product.id, 0)} className="text-muted transition hover:text-danger">
                  <TrashIcon width={14} height={14} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
          <span className="text-[13px] text-muted">جمع ماهانه</span>
          <span className="num text-[17px] font-bold text-brand">{num(total)} ؋</span>
        </div>

        <div className="mt-5 space-y-2">
          <Button type="button" className="w-full" onClick={saveBasket} disabled={saving}>
            {saving ? "در حال ذخیره…" : "ذخیره سبد ماهانه"}
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={addAllToCart}>
            <CartIcon width={16} height={16} />
            افزودن به سبد خرید
          </Button>
        </div>

        {!user ? (
          <p className="mt-4 text-[12px] leading-6 text-muted">
            برای ذخیره دائمی سبد،{" "}
            <Link href="/account" className="font-medium text-brand">
              وارد حساب کاربری
            </Link>{" "}
            شوید.
          </p>
        ) : null}
      </aside>
    </div>
  );
}
