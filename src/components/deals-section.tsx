"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronLeft, TagIcon } from "@/components/icons";
import { Countdown } from "@/components/motion";
import { ProductCard, type CardProduct } from "@/components/product-card";

const ITEM_CLASS =
  "w-[calc(50%-6px)] sm:w-[calc(33.333%-8px)] lg:w-[calc(25%-9px)] xl:w-[calc(20%-10px)] 2xl:w-[calc(16.666%-10px)]";

export function DealsSection({ deals }: { deals: (CardProduct & { claimed?: number })[] }) {
  const rail = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = rail.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const pos = Math.abs(el.scrollLeft);
    setEdge({ start: pos < 8, end: pos > max - 8 });
  }, []);

  useEffect(() => {
    measure();
    const el = rail.current;
    if (!el) return;
    el.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  function scroll(dir: 1 | -1) {
    const el = rail.current;
    if (!el) return;
    const rtl = document.documentElement.dir === "rtl" ? -1 : 1;
    el.scrollBy({ left: dir * rtl * el.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    <section className="overflow-hidden rounded-xl border border-line bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 bg-brand px-4 py-3 text-white md:px-5">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/12">
            <TagIcon width={18} height={18} className="text-accent" />
          </span>
          <span>
            <h2 className="text-[15px] font-bold leading-tight">پیشنهاد امروز</h2>
            <p className="mt-0.5 text-[11px] text-white/65">تخفیف محدود روی اقلام پرمصرف — تا پایان امروز</p>
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5">
            <span className="text-[11px] text-white/75">پایان تا</span>
            <Countdown tone="light" />
          </span>
          <Link
            href="/products"
            className="btn-shine hidden items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-[12px] font-semibold text-white transition hover:brightness-95 sm:flex"
          >
            همه تخفیف‌ها
            <ArrowLeft width={14} height={14} />
          </Link>
          <span className="flex gap-1.5">
            <button
              type="button"
              aria-label="قبلی"
              onClick={() => scroll(1)}
              disabled={edge.start}
              className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 transition hover:bg-white/20 disabled:opacity-30"
            >
              <ChevronLeft width={17} height={17} className="rotate-180" />
            </button>
            <button
              type="button"
              aria-label="بعدی"
              onClick={() => scroll(-1)}
              disabled={edge.end}
              className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 transition hover:bg-white/20 disabled:opacity-30"
            >
              <ChevronLeft width={17} height={17} />
            </button>
          </span>
        </div>
      </header>

      <div ref={rail} className="carousel no-bar flex gap-3 overflow-x-auto p-4">
        {deals.map((p) => (
          <div key={p.id} className={`shrink-0 ${ITEM_CLASS}`}>
            <ProductCard product={p} claimed={p.claimed} compact />
          </div>
        ))}
      </div>

      <div className="border-t border-line px-4 py-2.5 sm:hidden">
        <Link href="/products" className="flex items-center justify-center gap-1.5 text-[12.5px] font-semibold text-brand">
          همه تخفیف‌ها
          <ArrowLeft width={14} height={14} />
        </Link>
      </div>
    </section>
  );
}
