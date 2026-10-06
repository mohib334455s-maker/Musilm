"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CartIcon, GridIcon, PhoneIcon, PinIcon, SearchIcon, UserIcon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { useCart } from "@/components/providers";
import { toFa } from "@/lib/format";

const CATS = [
  { href: "/products?cat=berenj-va-ghallat", label: "برنج و غلات" },
  { href: "/products?cat=roghan", label: "روغن" },
  { href: "/products?cat=labaniyat", label: "لبنیات" },
  { href: "/products?cat=khoshkbar", label: "خشکبار و زعفران" },
  { href: "/products?cat=chai-va-qahwa", label: "چای و قهوه" },
  { href: "/products?cat=noshidani", label: "نوشیدنی" },
];

const LINKS = [
  { href: "/products", label: "همه محصولات" },
  { href: "/wholesale", label: "خرید عمده" },
  { href: "/monthly", label: "سبد ماهانه" },
  { href: "/cart", label: "سبد خرید" },
  { href: "/track", label: "پیگیری سفارش" },
  { href: "/contact", label: "تماس با ما" },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-brand text-white">
      <div className="mx-auto max-w-[1280px] px-5 py-12">
        <div className="grid gap-9 md:grid-cols-[1.6fr_1fr_1fr_1.2fr]">
          <div>
            <Logo tone="dark" size={42} />
            <p className="mt-5 max-w-sm text-[13px] leading-7 text-white/70">
              عمده و پرچون برندهای افغانستانی — الکوزی، شعیب، سلطان تازه، پامیر، هرات زعفران و بیشتر.
              قیمت روشن، عمده خودکار و تحویل همان روز در مزارشریف.
            </p>
          </div>

          <div>
            <p className="text-[13px] font-semibold">دسته‌بندی‌ها</p>
            <ul className="mt-4 space-y-2 text-[12.5px] text-white/65">
              {CATS.map((c) => (
                <li key={c.href}>
                  <Link href={c.href} className="transition hover:text-white">{c.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[13px] font-semibold">خرید و راهنما</p>
            <ul className="mt-4 space-y-2 text-[12.5px] text-white/65">
              {LINKS.map((c) => (
                <li key={c.label}>
                  <Link href={c.href} className="transition hover:text-white">{c.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[13px] font-semibold">تماس با ما</p>
            <ul className="mt-4 space-y-3 text-[12.5px] text-white/70">
              <li className="flex items-start gap-2">
                <PhoneIcon width={15} height={15} className="mt-0.5 shrink-0 text-accent" />
                <span className="num" dir="ltr">+93 700 123 456</span>
              </li>
              <li className="flex items-start gap-2">
                <PinIcon width={15} height={15} className="mt-0.5 shrink-0 text-accent" />
                <span>مزارشریف، چهارراهی حاجی کامران، سرک اول</span>
              </li>
            </ul>
            <p className="mt-4 text-[12px] text-white/55">شنبه تا پنجشنبه — ۸ صبح تا ۸ شب</p>
            <div className="mt-4 flex gap-2 text-[12px] text-white/70">
              {["واتساپ", "تلگرام", "فیسبوک"].map((s) => (
                <Link key={s} href="/contact" className="rounded-md border border-white/20 px-2.5 py-1 transition hover:bg-white hover:text-brand">
                  {s}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/12">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-2 px-5 py-5 text-[12px] text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {toFa(new Date().getFullYear())} Muslim Store — تمام حقوق محفوظ است</p>
          <div className="flex items-center gap-4">
            <Link href="/contact" className="transition hover:text-white">شرایط ارسال</Link>
            <Link href="/contact" className="transition hover:text-white">روش‌های پرداخت</Link>
            <Link href="/track" className="transition hover:text-white">پیگیری سفارش</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

const TABS = [
  { href: "/", label: "خانه", Icon: GridIcon },
  { href: "/categories", label: "دسته‌ها", Icon: GridIcon },
  { href: "/products", label: "جستجو", Icon: SearchIcon },
  { href: "/cart", label: "سبد", Icon: CartIcon },
  { href: "/account", label: "حساب", Icon: UserIcon },
];

export function MobileNav() {
  const pathname = usePathname();
  const { count } = useCart();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/97 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-lg items-stretch">
        {TABS.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] transition ${
                active ? "text-brand" : "text-muted"
              }`}
            >
              <Icon width={20} height={20} />
              <span>{label}</span>
              {href === "/cart" && count > 0 ? (
                <span className="num absolute right-[26%] top-1.5 min-w-[16px] rounded-full bg-accent px-1 text-[9px] font-bold leading-4 text-white">
                  {toFa(count)}
                </span>
              ) : null}
              {active ? <span className="absolute inset-x-6 top-0 h-[2px] bg-brand" aria-hidden /> : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
