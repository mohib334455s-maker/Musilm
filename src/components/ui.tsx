"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";

export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            window.setTimeout(() => setShown(true), delay);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={`reveal ${shown ? "is-visible" : ""} ${className}`}>
      {children}
    </div>
  );
}

export function SectionHead({
  title,
  note,
  href,
  linkLabel = "دیدن همه",
}: {
  title: string;
  note?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-7 flex items-end justify-between gap-4 border-b border-line pb-4">
      <div>
        <h2 className="text-[22px] font-bold leading-tight text-ink md:text-[26px]">{title}</h2>
        {note ? <p className="mt-1.5 text-[13.5px] text-muted">{note}</p> : null}
      </div>
      {href ? (
        <Link
          href={href}
          className="shrink-0 border-b border-brand/30 pb-0.5 text-[13px] font-medium text-brand transition hover:border-brand"
        >
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function Badge({
  children,
  tone = "#737B76",
  soft = true,
}: {
  children: ReactNode;
  tone?: string;
  soft?: boolean;
}) {
  return (
    <span
      className="num inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold"
      style={
        soft
          ? { color: tone, backgroundColor: `${tone}14`, boxShadow: `inset 0 0 0 1px ${tone}26` }
          : { color: "#fff", backgroundColor: tone }
      }
    >
      {children}
    </span>
  );
}

export function QtyStepper({
  value,
  min = 1,
  max = 999,
  onChange,
  size = "md",
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  size?: "sm" | "md";
}) {
  const h = size === "sm" ? "h-8 text-[13px]" : "h-10 text-sm";
  const w = size === "sm" ? "w-8" : "w-9";
  return (
    <div className={`inline-flex items-center overflow-hidden rounded-md border border-line ${h}`}>
      <button
        type="button"
        aria-label="کاهش"
        onClick={() => onChange(Math.max(min, value - 1))}
        className={`${w} h-full text-muted transition hover:bg-brand-soft hover:text-brand disabled:opacity-40`}
        disabled={value <= min}
      >
        −
      </button>
      <input
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value.replace(/[^\d]/g, ""));
          onChange(Number.isFinite(n) && n > 0 ? Math.min(max, n) : min);
        }}
        className="num h-full w-10 border-x border-line bg-white text-center outline-none focus:bg-brand-soft"
        inputMode="numeric"
        aria-label="تعداد"
      />
      <button
        type="button"
        aria-label="افزایش"
        onClick={() => onChange(Math.min(max, value + 1))}
        className={`${w} h-full text-muted transition hover:bg-brand-soft hover:text-brand disabled:opacity-40`}
        disabled={value >= max}
      >
        +
      </button>
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
  required,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-[13px] font-medium text-ink">
        {label}
        {required ? <span className="text-accent">*</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-[11.5px] text-muted">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/10";

export const areaClass =
  "w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/10";

export function Button({
  children,
  variant = "primary",
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "accent" | "danger";
}) {
  const styles: Record<string, string> = {
    primary: "bg-brand text-white hover:bg-brand-dark",
    accent: "bg-accent text-white hover:brightness-95",
    outline: "border border-line bg-white text-ink hover:border-brand hover:text-brand",
    ghost: "text-ink hover:bg-brand-soft",
    danger: "border border-danger/30 text-danger hover:bg-danger/5",
  };
  return (
    <button
      {...rest}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Empty({ title, note, action }: { title: string; note?: string; action?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-brand-soft/50 px-6 py-14 text-center">
      <p className="text-base font-semibold text-ink">{title}</p>
      {note ? <p className="mx-auto mt-2 max-w-sm text-[13px] leading-6 text-muted">{note}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
