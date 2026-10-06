"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ChevronLeft } from "@/components/icons";
import { Scramble, usePrefersReducedMotion } from "@/components/motion";
import { num } from "@/lib/format";

type Slide = {
  src: string;
  brand: string;
  title: string;
  text: string;
  primary: { href: string; label: string };
  secondary: { href: string; label: string };
};

export function HeroSlider({ freeThreshold }: { freeThreshold: number }) {
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const slides: Slide[] = [
    {
      src: "/images/hero-market.jpg",
      brand: "مسلم استور",
      title: "مواد خوراکی برندهای افغانستانی، مستقیم به در خانه",
      text: "الکوزی، شعیب، سلطان تازه، پامیر، هرات زعفران و بیش از چهل قلم دیگر — با قیمت پرچون یا عمده و تحویل همان روز در مزارشریف.",
      primary: { href: "/products", label: "شروع خرید" },
      secondary: { href: "/wholesale", label: "خرید عمده" },
    },
    {
      src: "/images/banner-b2b.jpg",
      brand: "Muslim Store",
      title: "از حد عمده به بالا، قیمت خودکار تغییر می‌کند",
      text: "برای دکان‌ها، رستوران‌ها و خرید سازمانی؛ بدون تماس و بدون چانه‌زنی، تفاوت قیمت به عنوان سود شما در سبد نمایش داده می‌شود.",
      primary: { href: "/wholesale", label: "لیست قیمت عمده" },
      secondary: { href: "/products?sort=expensive", label: "بسته‌های بزرگ" },
    },
    {
      src: "/images/delivery.jpg",
      brand: "مزارشریف",
      title: `سفارش بالای ${num(freeThreshold)} افغانی، ارسال رایگان`,
      text: "تحویل نواحی مرکزی شهر بین ۲ تا ۸ ساعت و برای ولسوالی‌ها یک‌روزه. کرایه پیش از پرداخت روشن است.",
      primary: { href: "/monthly", label: "ساخت سبد ماهانه" },
      secondary: { href: "/contact", label: "مناطق تحویل" },
    },
  ];

  const go = useCallback((next: number) => {
    setIndex((next + slides.length) % slides.length);
    setProgress(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (paused || reduced) return;
    const started = Date.now();
    const id = window.setInterval(() => {
      const p = Math.min(1, (Date.now() - started) / 7000);
      setProgress(p);
      if (p >= 1) go(index + 1);
    }, 60);
    return () => window.clearInterval(id);
  }, [index, paused, reduced, go]);

  const slide = slides[index];

  return (
    <section
      className="relative isolate min-h-[78vh] overflow-hidden bg-[#07291A] text-white sm:min-h-[72vh] lg:min-h-[640px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((s, i) => (
        <div
          key={s.src}
          className={`absolute inset-0 transition-opacity duration-1000 ${i === index ? "opacity-100" : "pointer-events-none opacity-0"}`}
          aria-hidden={i !== index}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={s.src}
            alt=""
            className={`h-full w-full object-cover ${i === index && !reduced ? "kenburns" : ""}`}
          />
          <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(7,41,26,0.92)_0%,rgba(7,41,26,0.72)_42%,rgba(7,41,26,0.28)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(212,168,79,0.18),transparent_55%)]" />
          <div className="dotted-dark absolute inset-0 opacity-40" />
        </div>
      ))}

      <div className="relative mx-auto flex min-h-[78vh] max-w-[1280px] flex-col justify-end px-4 pb-16 pt-24 sm:min-h-[72vh] sm:justify-center sm:pb-20 sm:pt-20 md:px-6 lg:min-h-[640px]">
        <div key={index} className="max-w-[620px]">
          <p className="display-font text-[13px] font-semibold tracking-[0.08em] text-accent sm:text-[14px]">
            <Scramble text={slide.brand} />
          </p>
          <h1 className="mask-up mt-4 text-[32px] font-bold leading-[1.25] text-white sm:text-[42px] lg:text-[52px] lg:leading-[1.18]">
            {slide.title}
          </h1>
          <p
            className="mask-up mt-5 max-w-lg text-[14px] leading-8 text-white/75 sm:text-[15.5px] sm:leading-9"
            style={{ animationDelay: "90ms" }}
          >
            {slide.text}
          </p>
          <div className="mask-up mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: "160ms" }}>
            <Link
              href={slide.primary.href}
              className="btn-shine inline-flex h-12 items-center gap-2 rounded-md bg-accent px-6 text-[13.5px] font-semibold text-[#07291A] transition hover:brightness-105"
            >
              {slide.primary.label}
              <ArrowLeft width={17} height={17} />
            </Link>
            <Link
              href={slide.secondary.href}
              className="inline-flex h-12 items-center rounded-md border border-white/30 bg-white/5 px-5 text-[13.5px] font-medium text-white backdrop-blur-sm transition hover:border-accent hover:text-accent"
            >
              {slide.secondary.label}
            </Link>
          </div>
        </div>
      </div>

      <button
        type="button"
        aria-label="اسلاید قبلی"
        onClick={() => go(index + 1)}
        className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20 md:grid"
      >
        <ChevronLeft width={18} height={18} className="rotate-180" />
      </button>
      <button
        type="button"
        aria-label="اسلاید بعدی"
        onClick={() => go(index - 1)}
        className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20 md:grid"
      >
        <ChevronLeft width={18} height={18} />
      </button>

      <div className="absolute inset-x-0 bottom-5 flex items-center justify-center gap-2">
        {slides.map((s, i) => (
          <button
            key={s.src}
            type="button"
            aria-label={`اسلاید ${i + 1}`}
            onClick={() => go(i)}
            className={`h-1.5 overflow-hidden rounded-full transition-all duration-300 ${
              i === index ? "w-14 bg-white/25" : "w-5 bg-white/25 hover:bg-accent/50"
            }`}
          >
            {i === index ? (
              <span
                className="block h-full rounded-full bg-accent transition-[width] duration-100"
                style={{ width: reduced ? "100%" : `${progress * 100}%` }}
              />
            ) : null}
          </button>
        ))}
      </div>
    </section>
  );
}
