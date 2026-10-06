"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CartIcon, CloseIcon, StarIcon } from "@/components/icons";
import { QtyStepper } from "@/components/ui";
import { toProductLite, unitPrice, useCart, useSession, useToast } from "@/components/providers";
import { num, toFa } from "@/lib/format";
import type { CardProduct } from "@/components/product-card";

const RECENT_KEY = "ms_recent_v1";

/* ---------------- stars ---------------- */

export function Stars({
  value,
  count,
  size = 13,
  showValue = false,
}: {
  value: number;
  count?: number;
  size?: number;
  showValue?: boolean;
}) {
  if (!value && !count) return null;
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  const star = (color: string) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden>
      <path d="m12 4.6 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4L4.2 10.3l5.4-.8L12 4.6Z" />
    </svg>
  );
  return (
    <span className="flex items-center gap-1.5">
      <span className="relative inline-flex" dir="ltr">
        <span className="flex gap-[1px] text-line">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i}>{star("#E1E5DF")}</span>
          ))}
        </span>
        <span className="absolute inset-0 flex gap-[1px] overflow-hidden" style={{ width: `${pct}%` }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="shrink-0">
              {star("#D4A84F")}
            </span>
          ))}
        </span>
      </span>
      {showValue && value > 0 ? <span className="num text-[11px] font-semibold text-ink">{toFa(value.toFixed(1))}</span> : null}
      {count != null ? <span className="num text-[10.5px] text-muted">({toFa(count)})</span> : null}
    </span>
  );
}

export function StarsInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <span className="flex items-center gap-1" dir="ltr">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} ستاره`}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          className="transition-transform hover:scale-110"
        >
          <StarIcon
            width={22}
            height={22}
            fill={n <= shown ? "#D4A84F" : "none"}
            stroke={n <= shown ? "#D4A84F" : "#C9CFC8"}
            strokeWidth={1.5}
          />
        </button>
      ))}
      <span className="num mr-2 text-[11.5px] text-muted">{shown ? `${toFa(shown)} از ۵` : "امتیاز دهید"}</span>
    </span>
  );
}

/* ---------------- recently viewed ---------------- */

export function rememberProduct(p: CardProduct) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const list: CardProduct[] = raw ? JSON.parse(raw) : [];
    const next = [p, ...list.filter((x) => x.id !== p.id)].slice(0, 12);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function TrackView({ product }: { product: CardProduct }) {
  useEffect(() => {
    rememberProduct(product);
  }, [product]);
  return null;
}

export function RecentlyViewed({ exceptId }: { exceptId?: number }) {
  const [items, setItems] = useState<CardProduct[]>([]);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_KEY);
      const list: CardProduct[] = raw ? JSON.parse(raw) : [];
      setItems(list.filter((p) => p.id !== exceptId).slice(0, 10));
    } catch {
      setItems([]);
    }
  }, [exceptId]);

  if (items.length < 2) return null;

  return (
    <section className="mt-12">
      <div className="mb-4 flex items-end justify-between gap-3 border-b border-line pb-3">
        <h2 className="text-[18px] font-bold text-ink md:text-[21px]">اخیراً دیده‌اید</h2>
        <button type="button" onClick={() => { window.localStorage.removeItem(RECENT_KEY); setItems([]); }} className="text-[12px] text-muted transition hover:text-danger">
          پاک کردن تاریخچه
        </button>
      </div>
      <div className="carousel no-bar flex gap-3 overflow-x-auto pb-2">
        {items.map((p) => (
          <Link
            key={p.id}
            href={`/products/${p.slug}`}
            className="card-lift flex w-[168px] shrink-0 items-center gap-3 rounded-lg border border-line bg-white p-2.5 sm:w-[210px]"
          >
            <span className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-brand-soft">
              {p.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
              ) : null}
            </span>
            <span className="min-w-0">
              <span className="line-clamp-2 block text-[12px] font-medium leading-5 text-ink">{p.name}</span>
              <span className="num mt-1 block text-[12.5px] font-bold text-brand">{num(p.price)} ؋</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ---------------- quick view ---------------- */

export function QuickView({ slug, onClose }: { slug: string; onClose: () => void }) {
  const { add } = useCart();
  const { toast } = useToast();
  const user = useSession();
  const [item, setItem] = useState<(CardProduct & { description?: string | null; rating?: number; reviewCount?: number }) | null>(null);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    let alive = true;
    fetch(`/api/products?slug=${encodeURIComponent(slug)}&limit=1`)
      .then((r) => r.json())
      .then((d) => {
        if (alive && d.items?.[0]) {
          setItem(d.items[0]);
          setQty(d.items[0].wholesaleMin > 1 ? 1 : 1);
        }
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [slug]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const price = item ? unitPrice({ ...item, qty }) : 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} />
      <div className="animate-rise relative w-full max-w-3xl overflow-hidden rounded-t-xl border border-line bg-white sm:rounded-xl">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="text-[13.5px] font-bold text-ink">نمای سریع محصول</p>
          <button type="button" aria-label="بستن" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-md text-muted transition hover:bg-brand-soft hover:text-ink">
            <CloseIcon width={18} height={18} />
          </button>
        </div>

        {!item ? (
          <div className="grid h-64 place-items-center text-[13px] text-muted">در حال بارگذاری…</div>
        ) : (
          <div className="grid gap-5 p-4 sm:grid-cols-[220px_1fr] sm:p-5">
            <div className="overflow-hidden rounded-lg border border-line bg-brand-soft">
              <div className="aspect-square">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                ) : null}
              </div>
            </div>

            <div>
              {item.brand ? <p className="text-[11.5px] text-muted">{item.brand}</p> : null}
              <h3 className="mt-1 text-[17px] font-bold leading-snug text-ink">{item.name}</h3>
              <div className="mt-1.5">
                <Stars value={item.rating ?? 0} count={item.reviewCount ?? 0} showValue />
              </div>
              <p className="num mt-2 text-[11.5px] text-muted">
                {item.sizeLabel ?? item.unit} · موجودی {toFa(item.stock)}
              </p>
              {item.description ? <p className="mt-3 line-clamp-3 text-[12.5px] leading-7 text-muted">{item.description}</p> : null}

              <div className="mt-4 flex items-end gap-3">
                <p className="num text-[24px] font-bold leading-none text-brand">{num(price)}</p>
                <p className="pb-1 text-[11.5px] text-muted">افغانی / {item.unit}</p>
                {item.discount > 0 ? <span className="num mb-1 rounded bg-accent px-1.5 py-0.5 text-[10.5px] font-bold text-white">{toFa(item.discount)}٪−</span> : null}
              </div>

              {item.wholesalePrice != null ? (
                <p className="num mt-1.5 rounded-md bg-brand-soft px-3 py-2 text-[11.5px] text-ink">
                  قیمت عمده <span className="font-bold text-brand">{num(item.wholesalePrice)} ؋</span> از{" "}
                  {toFa(item.wholesaleMin)} {item.unit} به بالا
                  {qty >= item.wholesaleMin ? <span className="mr-1 font-semibold text-brand">— فعال شد</span> : null}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <QtyStepper value={qty} min={1} max={Math.max(item.stock, 1)} onChange={setQty} />
                <button
                  type="button"
                  disabled={item.stock <= 0}
                  onClick={() => {
                    add(toProductLite(item), qty);
                    onClose();
                  }}
                  className="btn-shine inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-brand px-5 text-[13px] font-medium text-white transition hover:bg-brand-dark disabled:bg-line disabled:text-muted sm:flex-none"
                >
                  <CartIcon width={16} height={16} />
                  افزودن به سبد
                </button>
                <Link
                  href={`/products/${item.slug}`}
                  onClick={onClose}
                  className="inline-flex h-10 items-center rounded-md border border-line px-4 text-[12.5px] text-ink transition hover:border-brand hover:text-brand"
                >
                  جزئیات کامل
                </Link>
              </div>

              <p className="mt-3 text-[11px] text-muted">
                {user ? "نقد خریداران ثبت‌شده در صفحه محصول قابل نوشتن است." : "برای نوشتن نقد، وارد حساب کاربری شوید."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- review form ---------------- */

export function ReviewBox({ productId, slug }: { productId: number; slug: string }) {
  const user = useSession();
  const { toast } = useToast();
  const [rating, setRating] = useState(5);
  const [name, setName] = useState(user?.name ?? "");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");

  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast("نام خود را بنویسید");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, name, rating, body }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      toast(data.error ?? "ثبت نقد ناموفق بود");
      return;
    }
    setDone(data.message ?? "نقد شما ثبت شد");
    setBody("");
    toast("نقد شما ثبت شد");
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-line bg-brand-soft/50 p-4 md:p-5">
      <h3 className="text-[14.5px] font-bold text-ink">نقد و امتیاز شما</h3>
      <p className="mt-1 text-[12px] text-muted">
        تجربه خود را از این محصول بنویسید؛ نقد خریداران ثبت‌شده فوراً و بقیه پس از تأیید مدیریت منتشر می‌شود.
      </p>
      <div className="mt-3">
        <StarsInput value={rating} onChange={setRating} />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[200px_1fr]">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="نام شما"
          className="h-10 rounded-md border border-line bg-white px-3 text-[13px] outline-none focus:border-brand"
        />
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="کیفیت، بسته‌بندی، تازگی و سرعت تحویل چگونه بود؟"
          className="h-10 rounded-md border border-line bg-white px-3 text-[13px] outline-none focus:border-brand"
        />
      </div>
      {done ? <p className="mt-2.5 text-[12px] text-brand">{done}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="btn-shine mt-3 inline-flex h-10 items-center rounded-md bg-brand px-5 text-[13px] font-medium text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {busy ? "در حال ثبت…" : "ثبت نقد"}
      </button>
      <Link href={`/products/${slug}`} className="mr-3 text-[11.5px] text-muted hover:text-brand">
        قوانین نوشتن نقد
      </Link>
    </form>
  );
}
