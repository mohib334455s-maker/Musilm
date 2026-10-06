"use client";

import { useState } from "react";

export function Gallery({
  images,
  name,
  discount,
  out,
  sold,
}: {
  images: string[];
  name: string;
  discount: number;
  out: boolean;
  sold: number;
}) {
  const list = images.length ? images : [];
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const current = list[active] ?? null;

  return (
    <div className="lg:sticky lg:top-32 lg:h-fit">
      <div className="group relative overflow-hidden rounded-xl border border-line bg-brand-soft">
        <div
          className="aspect-square overflow-hidden"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setZoom({
              x: ((e.clientX - rect.left) / rect.width) * 100,
              y: ((e.clientY - rect.top) / rect.height) * 100,
            });
          }}
          onMouseLeave={() => setZoom(null)}
        >
          {current ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current}
              alt={`${name} — تصویر ${active + 1}`}
              className="h-full w-full object-cover transition-transform duration-300"
              style={
                zoom
                  ? { transform: "scale(1.9)", transformOrigin: `${zoom.x}% ${zoom.y}%` }
                  : { transform: "scale(1)" }
              }
            />
          ) : (
            <div className="grid h-full place-items-center text-sm text-muted">بدون تصویر</div>
          )}
        </div>

        <span className="absolute right-3 top-3 flex flex-col items-start gap-1.5">
          {discount > 0 && !out ? (
            <span className="num rounded-md bg-accent px-2 py-1 text-[11.5px] font-bold text-white shadow-sm">
              {discount.toLocaleString("fa-AF")}٪ تخفیف
            </span>
          ) : null}
          {sold >= 50 ? (
            <span className="rounded-md bg-brand px-2 py-1 text-[11px] font-medium text-white shadow-sm">پرفروش</span>
          ) : null}
          {out ? (
            <span className="rounded-md bg-ink/85 px-2 py-1 text-[11px] font-medium text-white">ناموجود</span>
          ) : null}
        </span>

        {list.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="تصویر قبلی"
              onClick={() => setActive((a) => (a - 1 + list.length) % list.length)}
              className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-line bg-white/92 text-ink opacity-0 transition group-hover:opacity-100 hover:text-brand max-md:opacity-100"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="تصویر بعدی"
              onClick={() => setActive((a) => (a + 1) % list.length)}
              className="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-line bg-white/92 text-ink opacity-0 transition group-hover:opacity-100 hover:text-brand max-md:opacity-100"
            >
              ›
            </button>
          </>
        ) : null}

        {zoom ? (
          <span className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-ink/75 px-3 py-1 text-[10.5px] text-white md:hidden">
            برای بزرگ‌نمایی نشانگر را روی تصویر ببرید
          </span>
        ) : null}
      </div>

      {list.length > 1 ? (
        <div className="no-bar mt-3 flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {list.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`تصویر ${i + 1}`}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-brand-soft transition lg:h-[68px] lg:w-[68px] ${
                i === active ? "border-brand" : "border-line opacity-70 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      <p className="num mt-3 hidden text-center text-[11px] text-muted lg:block">
        {list.length > 1 ? `تصویر ${(active + 1).toLocaleString("fa-AF")} از ${list.length.toLocaleString("fa-AF")}` : "تصویر محصول"}
        {" · "}برای بزرگ‌نمایی نشانگر را روی تصویر نگه دارید
      </p>
    </div>
  );
}
