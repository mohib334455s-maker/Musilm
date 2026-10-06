"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { ChevronLeft } from "@/components/icons";
import { toFa } from "@/lib/format";

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/* ---------- horizontal product rail ---------- */

export function Rail({
  title,
  note,
  href,
  linkLabel = "دیدن همه",
  badge,
  children,
  itemClass = "w-[calc(50%-6px)] sm:w-[calc(33.333%-8px)] lg:w-[calc(20%-10px)]",
}: {
  title: string;
  note?: string;
  href?: string;
  linkLabel?: string;
  badge?: ReactNode;
  children: ReactNode;
  itemClass?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const pos = Math.abs(el.scrollLeft);
    setEdge({ start: pos < 8, end: pos > max - 8 });
  }, []);

  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  function scrollBy(dir: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    const rtl = document.documentElement.dir === "rtl" ? -1 : 1;
    el.scrollBy({ left: dir * rtl * el.clientWidth * 0.82, behavior: "smooth" });
  }

  return (
    <section className="relative">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-end gap-3">
          <h2 className="text-[20px] font-bold leading-tight text-ink md:text-[24px]">{title}</h2>
          {badge}
          {note ? <p className="hidden pb-1 text-[12.5px] text-muted sm:block">{note}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          {href ? (
            <Link
              href={href}
              className="border-b border-brand/30 pb-0.5 text-[12.5px] font-medium text-brand transition hover:border-brand"
            >
              {linkLabel}
            </Link>
          ) : null}
          <span className="flex gap-1.5">
            <button
              type="button"
              aria-label="قبلی"
              onClick={() => scrollBy(1)}
              disabled={edge.start}
              className="grid h-9 w-9 place-items-center rounded-md border border-line bg-white text-ink transition hover:border-brand hover:text-brand disabled:opacity-30"
            >
              <ChevronLeft width={18} height={18} className="rotate-180" />
            </button>
            <button
              type="button"
              aria-label="بعدی"
              onClick={() => scrollBy(-1)}
              disabled={edge.end}
              className="grid h-9 w-9 place-items-center rounded-md border border-line bg-white text-ink transition hover:border-brand hover:text-brand disabled:opacity-30"
            >
              <ChevronLeft width={18} height={18} />
            </button>
          </span>
        </div>
      </header>

      <div ref={ref} className="carousel no-bar -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
        {Array.isArray(children)
          ? (children as ReactNode[]).map((child, i) => (
              <div key={i} className={`shrink-0 ${itemClass}`}>
                {child}
              </div>
            ))
          : children}
      </div>
    </section>
  );
}

/* ---------- countdown ---------- */

function pad(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

export function Countdown({ hours = 24, tone = "dark" }: { hours?: number; tone?: "dark" | "light" }) {
  const reduced = usePrefersReducedMotion();
  const target = useMemo(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    if (end.getTime() - Date.now() < 3600_000) end.setTime(Date.now() + hours * 3600_000);
    return end.getTime();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [left, setLeft] = useState(Math.max(0, target - Date.now()));

  useEffect(() => {
    if (reduced) return;
    const t = window.setInterval(() => setLeft(Math.max(0, target - Date.now())), 1000);
    return () => window.clearInterval(t);
  }, [target, reduced]);

  const s = Math.floor(left / 1000);
  const parts = [pad(Math.floor(s / 3600)), pad(Math.floor((s % 3600) / 60)), pad(s % 60)];

  return (
    <span className="flex items-center gap-1" dir="ltr">
      {parts.map((p, i) => (
        <span key={i} className="flex items-center gap-1">
          <span
            className={`num rounded px-1.5 py-1 text-[12px] font-bold tabular ${
              tone === "light" ? "bg-white text-brand" : "bg-ink text-white"
            }`}
          >
            {toFa(p)}
          </span>
          {i < 2 ? (
            <span className={`text-[12px] font-bold ${tone === "light" ? "text-white/70" : "text-ink"}`}>:</span>
          ) : null}
        </span>
      ))}
    </span>
  );
}

/* ---------- scramble decode ---------- */

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ·/—0123456789";

export function Scramble({ text, className = "" }: { text: string; className?: string }) {
  const reduced = usePrefersReducedMotion();
  const [out, setOut] = useState(reduced ? text : "");

  useEffect(() => {
    if (reduced) {
      setOut(text);
      return;
    }
    let frame = 0;
    const total = text.length * 3 + 12;
    const id = window.setInterval(() => {
      frame += 1;
      const revealed = Math.floor((frame / total) * text.length * 1.35);
      setOut(
        text
          .split("")
          .map((ch, i) => {
            if (ch === " ") return " ";
            if (i < revealed) return ch;
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          })
          .join(""),
      );
      if (frame >= total) {
        setOut(text);
        window.clearInterval(id);
      }
    }, 34);
    return () => window.clearInterval(id);
  }, [text, reduced]);

  return <span className={`display-font ${className}`}>{out || text}</span>;
}

/* ---------- count up ---------- */

export function CountUp({ value, className = "" }: { value: number; className?: string }) {
  const reduced = usePrefersReducedMotion();
  const [shown, setShown] = useState(reduced ? value : 0);

  useEffect(() => {
    if (reduced) {
      setShown(value);
      return;
    }
    const start = performance.now();
    const duration = 1100;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, reduced]);

  return <span className={`num ${className}`}>{toFa(shown.toLocaleString("en-US"))}</span>;
}

/* ---------- ticker ---------- */

export function Ticker({ items }: { items: string[] }) {
  const row = [...items, ...items];
  return (
    <div className="marquee">
      <div className="marquee-track gap-8">
        {row.map((item, i) => (
          <span key={i} className="flex shrink-0 items-center gap-2 text-[12px] whitespace-nowrap">
            <span className="h-1 w-1 rounded-full bg-accent" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- back to top ---------- */

export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!show) return null;
  return (
    <button
      type="button"
      aria-label="بازگشت به بالا"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="animate-rise fixed bottom-24 left-4 z-40 grid h-11 w-11 place-items-center rounded-full border border-line bg-white text-brand shadow-[0_8px_24px_rgba(15,81,50,0.14)] transition hover:bg-brand hover:text-white md:bottom-8"
    >
      <ChevronLeft width={18} height={18} className="rotate-90" />
    </button>
  );
}
