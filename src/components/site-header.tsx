"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  CartIcon,
  ChevronDown,
  CloseIcon,
  HeartIcon,
  LogoutIcon,
  MenuIcon,
  PhoneIcon,
  PinIcon,
  SearchIcon,
  TruckIcon,
  UserIcon,
} from "@/components/icons";
import { Logo, LogoMark } from "@/components/logo";
import { CartDrawer } from "@/components/cart-drawer";
import { useCart, useFavorites, useSession } from "@/components/providers";
import { num, toFa } from "@/lib/format";

const NAV = [
  { href: "/", label: "صفحه اصلی" },
  { href: "/products", label: "همه محصولات" },
  { href: "/wholesale", label: "خرید عمده" },
  { href: "/monthly", label: "خرید ماهانه" },
  { href: "/products?sort=cheap", label: "بهترین قیمت" },
  { href: "/track", label: "پیگیری سفارش" },
  { href: "/contact", label: "تماس با ما" },
];

type Suggestion = { id: number; slug: string; name: string; image: string | null; price: number };
type Cat = { id: number; slug: string; name: string; image: string | null; count?: number };

const hoverLight =
  "rounded-lg transition duration-150 hover:outline hover:outline-1 hover:-outline-offset-1 hover:outline-brand/35";
const hoverDark =
  "rounded-md transition duration-150 hover:bg-white/10";

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { count, subtotal } = useCart();
  const { favorites } = useFavorites();
  const user = useSession();

  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [openSuggest, setOpenSuggest] = useState(false);
  const [results, setResults] = useState<Suggestion[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [mega, setMega] = useState(false);
  const [acct, setAcct] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [condensed, setCondensed] = useState(false);
  const [progress, setProgress] = useState(0);

  const searchBox = useRef<HTMLDivElement>(null);
  const mobileSearchBox = useRef<HTMLDivElement>(null);
  const acctBox = useRef<HTMLDivElement>(null);
  const megaBox = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCats(d.items ?? []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setCondensed(window.scrollY > 60);
      setProgress(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    if (q.trim().length < 1) {
      setResults([]);
      return;
    }
    const t = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q, limit: "7" });
        if (catFilter) params.set("cat", catFilter);
        const res = await fetch(`/api/products?${params.toString()}`);
        const data = (await res.json()) as { items: Suggestion[] };
        setResults(data.items ?? []);
      } catch {
        setResults([]);
      }
    }, 200);
    return () => window.clearTimeout(t);
  }, [q, catFilter]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (searchBox.current?.contains(target) || mobileSearchBox.current?.contains(target)) return;
      setOpenSuggest(false);
      if (acctBox.current && !acctBox.current.contains(target)) setAcct(false);
      if (megaBox.current && !megaBox.current.contains(target)) setMega(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    setSheet(false);
    setMega(false);
    setAcct(false);
    setOpenSuggest(false);
  }, [pathname]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setOpenSuggest(false);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (catFilter) params.set("cat", catFilter);
    router.push(`/products${params.toString() ? `?${params}` : ""}`);
  }

  async function logout() {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    setAcct(false);
    router.refresh();
  }

  const searchField = (mobile: boolean) => (
    <div ref={mobile ? mobileSearchBox : searchBox} className={`relative min-w-0 ${mobile ? "w-full" : "flex-1"}`}>
      <form
        onSubmit={submit}
        className={`flex w-full items-stretch overflow-hidden rounded-lg border bg-white transition ${
          mobile ? "h-11 border-line" : "h-12 border-line hover:border-brand/45 focus-within:border-brand focus-within:ring-[3px] focus-within:ring-brand/12"
        }`}
      >
        <div className="relative hidden shrink-0 md:block">
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            aria-label="دسته‌بندی جستجو"
            className="h-full w-[128px] appearance-none border-l border-line bg-brand-soft pr-3 pl-7 text-[12px] text-ink outline-none"
          >
            <option value="">همه دسته‌ها</option>
            {cats.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown width={13} height={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
        </div>
        <input
          value={q}
          onFocus={() => setOpenSuggest(true)}
          onChange={(e) => {
            setQ(e.target.value);
            setOpenSuggest(true);
          }}
          placeholder={mobile ? "جستجوی محصول، برند یا بارکد…" : "جستجو در نام محصول، برند، SKU یا بارکد…"}
          className="h-full min-w-0 flex-1 bg-white px-3 text-[13px] text-ink outline-none placeholder:text-muted/80"
        />
        <button
          type="submit"
          className="btn-shine flex shrink-0 items-center gap-1.5 bg-gradient-to-l from-[#D4A84F] to-[#C08F31] px-4 text-[12.5px] font-semibold text-white transition hover:brightness-105 active:scale-[0.98] sm:px-5"
        >
          <SearchIcon width={18} height={18} />
          <span className="hidden xl:inline">جستجو</span>
        </button>
      </form>

      {openSuggest && q.trim() ? (
        <div className="animate-slide-down absolute inset-x-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-lg border border-line bg-white shadow-[0_22px_50px_rgba(7,41,26,0.2)]">
          <p className="border-b border-line bg-brand-soft px-3 py-2 text-[11px] text-muted">
            {results.length ? `${toFa(results.length)} نتیجه برای «${q}»` : "در حال جستجو…"}
          </p>
          {results.length === 0 ? (
            <p className="px-4 py-4 text-[13px] text-muted">نتیجه‌ای پیدا نشد — عبارت دیگری را امتحان کنید.</p>
          ) : (
            results.map((r) => (
              <Link
                key={r.id}
                href={`/products/${r.slug}`}
                className="flex items-center gap-3 border-b border-line/70 px-3 py-2.5 last:border-0 transition hover:bg-brand-soft"
              >
                <span className="h-11 w-11 shrink-0 overflow-hidden rounded-md bg-brand-soft">
                  {r.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.image} alt={r.name} className="h-full w-full object-cover" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{r.name}</span>
                <span className="num shrink-0 text-[12.5px] font-semibold text-brand">{num(r.price)} ؋</span>
              </Link>
            ))
          )}
          <div className="flex items-center justify-between gap-2 bg-brand-soft px-3 py-2.5">
            <button type="button" onClick={submit} className="text-[12.5px] font-semibold text-brand transition hover:underline">
              دیدن همه نتایج
            </button>
            <Link href="/track" className="text-[11.5px] text-muted transition hover:text-brand">
              پیگیری سفارش
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );

  return (
    <header className="sticky top-0 z-50">
      {/* gold hairline */}
      <div className="h-[3px] w-full bg-gradient-to-l from-accent/70 via-brand to-accent/70" />

      <div className={`bg-white transition-shadow duration-300 ${condensed ? "shadow-[0_10px_30px_rgba(7,41,26,0.12)]" : ""}`}>
        <div className="mx-auto flex max-w-[1280px] items-center gap-2 px-3 md:gap-3 md:px-5 lg:gap-4">
          <button
            type="button"
            aria-label="منو"
            onClick={() => setSheet(true)}
            className={`${hoverLight} grid h-11 w-11 shrink-0 place-items-center text-ink md:hidden`}
          >
            <MenuIcon width={21} height={21} />
          </button>

          {/* mobile logo */}
          <Link href="/" className="group flex shrink-0 items-center gap-2 md:hidden">
            <span className="transition-transform duration-300 group-hover:-translate-y-0.5">
              <LogoMark size={34} />
            </span>
            <span className="leading-none">
              <span className="display-font block text-[15.5px] font-bold tracking-[-0.02em] text-brand">
                Muslim<span className="font-medium opacity-75"> Store</span>
              </span>
              <span className="mt-1 block text-[9px] text-muted">مسلم استور · مزارشریف</span>
            </span>
          </Link>

          {/* desktop logo */}
          <div className={`hidden shrink-0 md:block ${hoverLight} ${condensed ? "py-1.5" : "py-2.5"} transition-all duration-300`}>
            <Logo size={condensed ? 36 : 42} tagline={!condensed} />
          </div>

          <Link
            href="/checkout"
            className={`${hoverLight} hidden shrink-0 items-center gap-1.5 px-2.5 py-2 transition-all duration-300 xl:flex ${
              condensed ? "opacity-0" : "opacity-100"
            }`}
          >
            <PinIcon width={18} height={18} className="text-brand" />
            <span className="leading-tight">
              <span className="block text-[10px] text-muted">ارسال به</span>
              <span className="block text-[12.5px] font-semibold text-ink">مزارشریف</span>
            </span>
          </Link>

          <div className={`hidden min-w-0 flex-1 md:block transition-all duration-300 ${condensed ? "py-1.5" : "py-2.5"}`}>
            {searchField(false)}
          </div>

          <div className="mr-auto flex shrink-0 items-center gap-1 py-2 md:mr-0">
            {/* account */}
            <div ref={acctBox} className="relative hidden md:block">
              <button type="button" onClick={() => setAcct((v) => !v)} className={`${hoverLight} flex h-11 items-center gap-1.5 px-2.5`}>
                <UserIcon width={20} height={20} className="text-ink" />
                <span className="hidden leading-tight lg:block">
                  <span className="block text-[10px] text-muted">{user ? "حساب شما" : "سلام، وارد شوید"}</span>
                  <span className="block max-w-[96px] truncate text-[12.5px] font-semibold text-ink">
                    {user ? user.name : "حساب کاربری"}
                  </span>
                </span>
                <ChevronDown width={13} height={13} className="hidden text-muted lg:block" />
              </button>

              {acct ? (
                <div className="animate-slide-down absolute left-0 top-[calc(100%+6px)] z-50 w-64 overflow-hidden rounded-lg border border-line bg-white shadow-[0_22px_50px_rgba(7,41,26,0.2)]">
                  {!user ? (
                    <div className="p-4">
                      <Link href="/account" className="btn-shine block rounded-md bg-accent px-4 py-2.5 text-center text-[13px] font-semibold text-white transition hover:brightness-95">
                        ورود / ثبت‌نام
                      </Link>
                      <p className="mt-3 text-[11.5px] leading-6 text-muted">
                        با حساب کاربری سفارش‌ها را پیگیری کنید، آدرس نقشه‌دار بسازید و سبد ماهانه داشته باشید.
                      </p>
                    </div>
                  ) : (
                    <div className="p-2">
                      <p className="num border-b border-line px-2.5 py-2 text-[11.5px] text-muted" dir="ltr">
                        {user.email}
                      </p>
                      {[
                        { href: "/account", label: "پروفایل", Icon: UserIcon },
                        { href: "/account?tab=orders", label: "سفارش‌های من", Icon: TruckIcon },
                        { href: "/track", label: "پیگیری سریع سفارش", Icon: SearchIcon },
                        { href: "/account?tab=addresses", label: "آدرس‌ها", Icon: PinIcon },
                        { href: "/account?tab=baskets", label: "سبدهای ماهانه", Icon: CartIcon },
                      ].map(({ href, label, Icon }) => (
                        <Link key={href} href={href} className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-ink transition hover:bg-brand-soft hover:text-brand">
                          <Icon width={16} height={16} />
                          {label}
                        </Link>
                      ))}
                      {user.role === "admin" ? (
                        <Link href="/admin" className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-brand transition hover:bg-brand-soft">
                          <UserIcon width={16} height={16} />
                          پنل مدیریت
                        </Link>
                      ) : null}
                      <button type="button" onClick={logout} className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-muted transition hover:bg-brand-soft hover:text-danger">
                        <LogoutIcon width={16} height={16} />
                        خروج
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* orders */}
            <Link href="/account?tab=orders" className={`${hoverLight} hidden h-11 items-center gap-1.5 px-2.5 xl:flex`}>
              <TruckIcon width={20} height={20} className="text-ink" />
              <span className="leading-tight">
                <span className="block text-[10px] text-muted">پیگیری</span>
                <span className="block text-[12.5px] font-semibold text-ink">سفارش‌ها</span>
              </span>
            </Link>

            {/* wishlist */}
            <Link href="/account?tab=favorites" className={`${hoverLight} relative grid h-11 w-11 place-items-center sm:w-auto sm:gap-1.5 sm:px-2.5`}>
              <HeartIcon width={20} height={20} className="text-ink" />
              <span className="hidden leading-tight lg:block">
                <span className="block text-[10px] text-muted">لیست</span>
                <span className="block text-[12.5px] font-semibold text-ink">علاقه‌مندی</span>
              </span>
              {favorites.length > 0 ? (
                <span className="num absolute right-1.5 top-1 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                  {toFa(favorites.length)}
                </span>
              ) : null}
            </Link>

            {/* cart */}
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={`سبد خرید — ${toFa(count)} قلم`}
              className="relative flex h-11 items-center gap-2 rounded-lg bg-brand px-3 text-white transition duration-200 hover:bg-brand-dark hover:shadow-[0_8px_20px_rgba(15,81,50,0.28)] active:scale-[0.98] md:px-4"
            >
              <span className="relative">
                <CartIcon width={21} height={21} />
                <span className="num absolute -top-2 -left-2.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[10.5px] font-bold text-white">
                  {toFa(count)}
                </span>
              </span>
              <span className="hidden leading-tight lg:block">
                <span className="block text-[10px] text-white/70">سبد خرید</span>
                <span className="num block text-[12.5px] font-semibold">{subtotal > 0 ? `${num(subtotal)} ؋` : "خالی"}</span>
              </span>
            </button>
          </div>
        </div>

        {/* mobile search */}
        <div className="px-3 pb-2.5 pt-0.5 md:hidden">{searchField(true)}</div>

        {/* mobile category chips */}
        <div className="no-bar flex gap-2 overflow-x-auto px-3 pb-2.5 md:hidden">
          {cats.map((c) => (
            <Link
              key={c.id}
              href={`/products?cat=${c.slug}`}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1.5 text-[11.5px] text-ink transition active:border-brand"
            >
              <span className="h-5 w-5 shrink-0 overflow-hidden rounded-full bg-brand-soft">
                {c.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image} alt={c.name} className="h-full w-full object-cover" />
                ) : null}
              </span>
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      {/* ============ green nav row ============ */}
      <div className="hidden bg-brand text-white md:block">
        <div className="mx-auto flex max-w-[1280px] items-center gap-1 px-5">
          <div ref={megaBox} className="relative">
            <button
              type="button"
              onClick={() => setMega((v) => !v)}
              className={`flex h-11 items-center gap-2 rounded-md px-3 text-[13px] font-semibold transition ${
                mega ? "bg-brand-dark text-white" : "text-white hover:bg-white/10"
              }`}
            >
              <MenuIcon width={17} height={17} />
              همه دسته‌بندی‌ها
              <ChevronDown width={13} height={13} className={`transition-transform duration-200 ${mega ? "rotate-180" : ""}`} />
            </button>

            {mega ? (
              <div className="animate-slide-down absolute right-0 top-[calc(100%+4px)] z-50 w-[740px] overflow-hidden rounded-xl border border-line bg-white shadow-[0_28px_64px_rgba(7,41,26,0.26)]">
                <div className="grid grid-cols-[1.85fr_1fr]">
                  <div className="grid grid-cols-3 gap-px bg-line">
                    {cats.map((c) => (
                      <Link key={c.id} href={`/products?cat=${c.slug}`} className="group flex flex-col gap-2 bg-white p-3 transition hover:bg-brand-soft">
                        <span className="aspect-[5/4] overflow-hidden rounded-md bg-brand-soft">
                          {c.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={c.image} alt={c.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                          ) : null}
                        </span>
                        <span className="text-[12.5px] font-semibold text-ink group-hover:text-brand">{c.name}</span>
                        <span className="num text-[11px] text-muted">{toFa(c.count ?? 0)} محصول</span>
                      </Link>
                    ))}
                  </div>
                  <div className="flex flex-col justify-between gap-4 bg-brand-soft p-4">
                    <div>
                      <p className="text-[13px] font-bold text-ink">خرید عمده برای دکان‌ها</p>
                      <p className="num mt-1.5 text-[11.5px] leading-6 text-muted">
                        از ۱۲ عدد به بالا قیمت خودکار عمده می‌شود و تفاوت آن به عنوان «سود شما» در سبد نمایش داده می‌شود.
                      </p>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/banner-b2b.jpg" alt="عمده‌فروشی" className="h-24 w-full rounded-md object-cover" />
                    <div className="flex flex-col gap-2">
                      <Link href="/wholesale" className="btn-shine rounded-md bg-brand px-3 py-2 text-center text-[12.5px] font-semibold text-white transition hover:bg-brand-dark">
                        لیست قیمت عمده
                      </Link>
                      <Link href="/categories" className="rounded-md border border-line bg-white px-3 py-2 text-center text-[12.5px] text-ink transition hover:border-brand hover:text-brand">
                        همه دسته‌بندی‌ها
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <span className="mx-1 h-5 w-px bg-white/20" />

          <nav className="flex items-center">
            {NAV.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className="group relative px-3 py-2.5 text-[13px]">
                  <span className={`transition ${active ? "font-bold text-white" : "text-white/85 group-hover:text-white"}`}>
                    {item.label}
                  </span>
                  <span
                    className={`absolute inset-x-2 bottom-1.5 h-[2px] origin-center rounded-full bg-accent transition-transform duration-300 ${
                      active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="mr-auto flex items-center gap-3">
            <a href="tel:+93700123456" className="num flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] text-white/80 transition hover:bg-white/10 hover:text-white" dir="ltr">
              <PhoneIcon width={14} height={14} />
              +93 700 123 456
            </a>
            <Link href="/wholesale" className="btn-shine flex items-center gap-2 rounded-md bg-accent px-3 py-1.5 text-[12.5px] font-bold text-white transition hover:brightness-105">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-white" />
              پیشنهاد عمده امروز
            </Link>
          </div>
        </div>
      </div>

      {/* scroll progress */}
      <div className="h-[2px] w-full bg-transparent">
        <div className="h-full bg-accent/80 transition-[width] duration-150" style={{ width: `${progress}%` }} />
      </div>

      {/* ============ mobile sheet ============ */}
      {sheet ? (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setSheet(false)} />
          <div className="animate-rise absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-brand px-4 py-3.5 text-white">
              <div className="flex items-center gap-2.5">
                <LogoMark size={36} />
                <span>
                  <p className="display-font text-[15px] font-bold leading-none">Muslim Store</p>
                  <p className="mt-1 text-[11px] text-white/70">{user ? user.name : "ورود / ثبت‌نام"}</p>
                </span>
              </div>
              <button type="button" aria-label="بستن" onClick={() => setSheet(false)} className="grid h-9 w-9 place-items-center rounded-lg bg-white/12 transition hover:bg-white/22">
                <CloseIcon width={18} height={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-4 rounded-lg border border-accent/35 bg-accent/8 px-4 py-3">
                <p className="text-[12.5px] font-semibold text-ink">ارسال رایگان سفارش بالای ۲٬۰۰۰ افغانی</p>
                <p className="num mt-1 text-[11px] text-muted">تحویل همان روز در نواحی مرکزی مزارشریف</p>
              </div>

              {!user ? (
                <Link href="/account" className="btn-shine mb-4 block rounded-md bg-accent px-4 py-2.5 text-center text-[13px] font-semibold text-white">
                  ورود به حساب کاربری
                </Link>
              ) : (
                <div className="mb-4 grid grid-cols-2 gap-2">
                  {[
                    { href: "/account", label: "پروفایل" },
                    { href: "/account?tab=orders", label: "سفارش‌ها" },
                    { href: "/account?tab=addresses", label: "آدرس‌ها" },
                    { href: "/account?tab=baskets", label: "سبد ماهانه" },
                  ].map((l) => (
                    <Link key={l.href} href={l.href} className="rounded-md border border-line px-3 py-2 text-[12.5px] transition hover:border-brand">
                      {l.label}
                    </Link>
                  ))}
                </div>
              )}

              <p className="mb-2 text-[11.5px] font-medium text-muted">دسته‌بندی‌ها</p>
              <div className="grid grid-cols-2 gap-2">
                {cats.map((c) => (
                  <Link key={c.id} href={`/products?cat=${c.slug}`} className="flex items-center gap-2 rounded-md border border-line px-2.5 py-2 text-[12.5px] transition hover:border-brand hover:bg-brand-soft">
                    <span className="h-8 w-8 shrink-0 overflow-hidden rounded bg-brand-soft">
                      {c.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.image} alt={c.name} className="h-full w-full object-cover" />
                      ) : null}
                    </span>
                    <span className="truncate">{c.name}</span>
                  </Link>
                ))}
              </div>

              <p className="mb-2 mt-5 text-[11.5px] font-medium text-muted">دسترسی سریع</p>
              <div className="divide-y divide-line overflow-hidden rounded-md border border-line">
                {[...NAV, { href: "/account?tab=favorites", label: "علاقه‌مندی‌ها" }, { href: "/categories", label: "همه دسته‌بندی‌ها" }].map((l) => (
                  <Link key={l.href + l.label} href={l.href} className="block px-3.5 py-2.5 text-[13px] transition hover:bg-brand-soft">
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="border-t border-line p-4">
              <a href="tel:+93700123456" className="num flex items-center justify-center gap-2 rounded-md bg-brand-soft py-2.5 text-[13px] font-medium text-brand" dir="ltr">
                <PhoneIcon width={15} height={15} />
                +93 700 123 456
              </a>
            </div>
          </div>
        </div>
      ) : null}

      {cartOpen ? <CartDrawer onClose={() => setCartOpen(false)} /> : null}
    </header>
  );
}
