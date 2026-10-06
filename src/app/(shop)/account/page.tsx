"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BoxIcon,
  CalendarIcon,
  CartIcon,
  CheckIcon,
  HeartIcon,
  LogoutIcon,
  PinIcon,
  TrashIcon,
  UserIcon,
} from "@/components/icons";
import { Badge, Button, Empty, Field, QtyStepper, areaClass, inputClass } from "@/components/ui";
import { ProductCard, type CardProduct } from "@/components/product-card";
import { toProductLite, useCart, useFavorites, useSession, useToast } from "@/components/providers";
import { num, statusLabel, statusTone, timeAgo, toFa } from "@/lib/format";

const MapPicker = dynamic(() => import("@/components/map-picker").then((m) => m.MapPicker), { ssr: false });

type OrderItem = { id: number; name: string; qty: number; unitPrice: number; lineTotal: string | number; sizeLabel: string | null };
type Order = {
  id: number;
  number: string;
  status: string;
  total: number;
  createdAt: string;
  address: string;
  zoneName: string | null;
  payment: string;
  delivery: string;
  items: OrderItem[];
};
type Address = { id: number; title: string; details: string; zoneId: number | null; lat: number | null; lng: number | null; isDefault: boolean };
type Basket = { id: number; name: string; updatedAt: string; items: { id: number; name: string; slug: string; image: string | null; price: number; qty: number; sizeLabel: string | null; unit: string; stock: number }[] };
type Zone = { id: number; name: string };

const TABS = [
  { key: "profile", label: "پروفایل", Icon: UserIcon },
  { key: "orders", label: "سفارش‌ها", Icon: CalendarIcon },
  { key: "addresses", label: "آدرس‌ها", Icon: PinIcon },
  { key: "baskets", label: "سبدهای ماهانه", Icon: BoxIcon },
  { key: "favorites", label: "علاقه‌مندی‌ها", Icon: HeartIcon },
];

export default function AccountPage() {
  const user = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const { favorites } = useFavorites();
  const { add } = useCart();

  const [tab, setTab] = useState("profile");
  const [data, setData] = useState<{ orders: Order[]; addresses: Address[]; baskets: Basket[] } | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [allProducts, setAllProducts] = useState<CardProduct[]>([]);
  const [profile, setProfile] = useState({ name: "", phone: "" });
  const [addr, setAddr] = useState({ title: "خانه", details: "", zoneId: 0, lat: null as number | null, lng: null as number | null });
  const [openOrder, setOpenOrder] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState("");

  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get("tab");
    if (initial && TABS.some((t) => t.key === initial)) setTab(initial);
  }, []);

  useEffect(() => {
    fetch("/api/zones")
      .then((r) => r.json())
      .then((d) => setZones(d.items ?? []))
      .catch(() => undefined);
    fetch("/api/products?limit=200")
      .then((r) => r.json())
      .then((d) => setAllProducts(d.items ?? []))
      .catch(() => undefined);
  }, []);

  async function load() {
    const res = await fetch("/api/account");
    if (!res.ok) return;
    const d = await res.json();
    setData({ orders: d.orders ?? [], addresses: d.addresses ?? [], baskets: d.baskets ?? [] });
  }

  useEffect(() => {
    if (!user) {
      setData(null);
      return;
    }
    setProfile({ name: user.name, phone: user.phone ?? "" });
    load();
  }, [user]);

  async function saveProfile() {
    setBusy(true);
    await fetch("/api/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "profile:save", ...profile }),
    });
    setBusy(false);
    toast("پروفایل به‌روز شد");
    router.refresh();
  }

  async function changePassword() {
    setPwMsg("");
    if (!pw.current || !pw.next) {
      setPwMsg("رمز فعلی و رمز جدید را وارد کنید");
      return;
    }
    if (pw.next !== pw.confirm) {
      setPwMsg("تکرار رمز جدید مطابقت ندارد");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "password:change", current: pw.current, next: pw.next }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setPwMsg(data.error ?? "تغییر رمز عبور ناموفق بود");
      return;
    }
    setPw({ current: "", next: "", confirm: "" });
    setPwMsg("رمز عبور با موفقیت تغییر کرد");
    toast("رمز عبور تغییر کرد");
  }

  async function saveAddress() {
    if (!addr.details.trim()) {
      toast("آدرس را بنویسید");
      return;
    }
    setBusy(true);
    await fetch("/api/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "address:save", ...addr, zoneId: addr.zoneId || null }),
    });
    setBusy(false);
    setAddr({ title: "خانه", details: "", zoneId: 0, lat: null, lng: null });
    toast("آدرس ذخیره شد");
    load();
  }

  async function deleteAddress(id: number) {
    await fetch("/api/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "address:delete", id }),
    });
    load();
  }

  async function deleteBasket(id: number) {
    await fetch("/api/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "basket:delete", id }),
    });
    toast("سبد حذف شد");
    load();
  }

  async function logout() {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    router.refresh();
    router.push("/");
  }

  const favProducts = allProducts.filter((p) => favorites.includes(p.id));

  if (!user) return <AuthForms />;

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-6 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          <h1 className="text-[26px] font-bold text-ink md:text-[32px]">حساب کاربری</h1>
          <p className="num mt-1.5 text-[13px] text-muted">
            {user.name} · {user.email}
            {user.role === "admin" ? " · ادمین" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {user.role === "admin" ? (
            <Link href="/admin">
              <Button type="button" variant="outline" className="h-10 px-4 text-[13px]">
                پنل ادمین
              </Button>
            </Link>
          ) : null}
          <Button type="button" variant="ghost" className="h-10 px-4 text-[13px]" onClick={logout}>
            <LogoutIcon width={16} height={16} />
            خروج
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-2 overflow-x-auto no-bar lg:flex-col lg:gap-1">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`flex shrink-0 items-center gap-2.5 rounded-md px-3.5 py-2.5 text-[13.5px] transition lg:w-full ${
                tab === key ? "bg-brand text-white" : "text-ink hover:bg-brand-soft"
              }`}
            >
              <Icon width={17} height={17} />
              {label}
            </button>
          ))}
        </nav>

        <div>
          {tab === "profile" ? (
            <section className="rounded-lg border border-line p-5 md:p-6">
              <h2 className="text-[16px] font-bold text-ink">پروفایل</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="نام و نام خانوادگی">
                  <input className={inputClass} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                </Field>
                <Field label="شماره تماس">
                  <input className={inputClass} dir="ltr" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                </Field>
                <Field label="ایمیل" hint="ایمیل قابل تغییر نیست">
                  <input className={`${inputClass} bg-brand-soft text-muted`} dir="ltr" value={user.email} readOnly />
                </Field>
              </div>
              <Button type="button" className="mt-5" onClick={saveProfile} disabled={busy}>
                ذخیره تغییرات
              </Button>

              <div className="mt-8 border-t border-line pt-6">
                <h3 className="text-[15px] font-bold text-ink">تغییر رمز عبور</h3>
                <p className="mt-1.5 text-[12px] leading-6 text-muted">
                  برای امنیت حساب، رمز عبور را هر چند وقت یک‌بار تغییر دهید. رمز جدید باید حداقل ۸
                  نویسه و شامل حرف و عدد باشد.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <Field label="رمز فعلی" required>
                    <input
                      className={inputClass}
                      dir="ltr"
                      type="password"
                      autoComplete="current-password"
                      value={pw.current}
                      onChange={(e) => setPw({ ...pw, current: e.target.value })}
                    />
                  </Field>
                  <Field label="رمز جدید" required>
                    <input
                      className={inputClass}
                      dir="ltr"
                      type="password"
                      autoComplete="new-password"
                      value={pw.next}
                      onChange={(e) => setPw({ ...pw, next: e.target.value })}
                    />
                  </Field>
                  <Field label="تکرار رمز جدید" required>
                    <input
                      className={inputClass}
                      dir="ltr"
                      type="password"
                      autoComplete="new-password"
                      value={pw.confirm}
                      onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                    />
                  </Field>
                </div>
                {pwMsg ? (
                  <p className={`mt-2.5 text-[12px] ${pwMsg.startsWith("رمز عبور") && pwMsg.includes("تغییر") ? "text-brand" : "text-danger"}`}>
                    {pwMsg}
                  </p>
                ) : null}
                <Button type="button" variant="outline" className="mt-4" onClick={changePassword} disabled={busy}>
                  تغییر رمز عبور
                </Button>
              </div>
            </section>
          ) : null}

          {tab === "orders" ? (
            <section>
              <h2 className="mb-4 text-[16px] font-bold text-ink">سفارش‌ها</h2>
              {!data?.orders.length ? (
                <Empty
                  title="هنوز سفارشی ثبت نکرده‌اید"
                  note="اولین سفارش خود را از صفحه محصولات ثبت کنید."
                  action={<Link href="/products"><Button type="button">شروع خرید</Button></Link>}
                />
              ) : (
                <div className="space-y-3">
                  {data.orders.map((o) => (
                    <article key={o.id} className="overflow-hidden rounded-lg border border-line">
                      <button
                        type="button"
                        onClick={() => setOpenOrder(openOrder === o.id ? null : o.id)}
                        className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3.5 text-right transition hover:bg-brand-soft/60"
                      >
                        <span>
                          <span className="num block text-[13.5px] font-semibold text-ink" dir="ltr">{o.number}</span>
                          <span className="num mt-0.5 block text-[11.5px] text-muted">{timeAgo(o.createdAt)}</span>
                        </span>
                        <span className="flex items-center gap-3">
                          <Badge tone={statusTone(o.status)}>{statusLabel(o.status)}</Badge>
                          <span className="num text-[14px] font-bold text-brand">{num(o.total)} ؋</span>
                        </span>
                      </button>
                      {openOrder === o.id ? (
                        <div className="animate-rise border-t border-line px-4 py-4">
                          <ul className="divide-y divide-line text-[13px]">
                            {o.items.map((it) => (
                              <li key={it.id} className="flex items-center justify-between gap-3 py-2.5">
                                <span className="min-w-0 flex-1 truncate">
                                  {it.name}
                                  <span className="num text-muted"> × {toFa(it.qty)}</span>
                                </span>
                                <span className="num text-muted">{num(Number(it.unitPrice))} ؋</span>
                                <span className="num w-20 text-left font-medium">{num(Number(it.lineTotal))} ؋</span>
                              </li>
                            ))}
                          </ul>
                          <dl className="num mt-3 space-y-1.5 border-t border-line pt-3 text-[12.5px] text-muted">
                            <div className="flex justify-between"><dt>تحویل</dt><dd>{o.delivery === "pickup" ? "دریافت از انبار" : o.zoneName}</dd></div>
                            <div className="flex justify-between"><dt>آدرس</dt><dd className="max-w-[60%] text-left">{o.address}</dd></div>
                          </dl>
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {tab === "addresses" ? (
            <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
              <div>
                <h2 className="mb-4 text-[16px] font-bold text-ink">آدرس‌های من</h2>
                {!data?.addresses.length ? (
                  <Empty title="آدرسی ثبت نشده است" note="آدرس خود را همراه با موقعیت روی نقشه ذخیره کنید." />
                ) : (
                  <div className="space-y-3">
                    {data.addresses.map((a) => (
                      <article key={a.id} className="rounded-lg border border-line p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="flex items-center gap-2 text-[13.5px] font-semibold text-ink">
                              {a.title}
                              {a.isDefault ? <Badge tone="#0F5132">پیش‌فرض</Badge> : null}
                            </p>
                            <p className="mt-1.5 text-[12.5px] leading-6 text-muted">{a.details}</p>
                            <p className="num mt-1.5 text-[11.5px] text-muted">
                              {zones.find((z) => z.id === a.zoneId)?.name ?? "بدون منطقه"}
                              {a.lat != null && a.lng != null ? (
                                <span dir="ltr"> · {a.lat}, {a.lng}</span>
                              ) : null}
                            </p>
                          </div>
                          <button type="button" aria-label="حذف" onClick={() => deleteAddress(a.id)} className="text-muted transition hover:text-danger">
                            <TrashIcon width={16} height={16} />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAddr({ title: a.title, details: a.details, zoneId: a.zoneId ?? 0, lat: a.lat, lng: a.lng })}
                          className="mt-3 text-[12.5px] font-medium text-brand"
                        >
                          ویرایش
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              <div className="h-fit rounded-lg border border-line p-5">
                <h3 className="text-[15px] font-bold text-ink">افزودن آدرس جدید</h3>
                <div className="mt-4 space-y-4">
                  <Field label="عنوان">
                    <input className={inputClass} value={addr.title} onChange={(e) => setAddr({ ...addr, title: e.target.value })} />
                  </Field>
                  <Field label="منطقه">
                    <select className={inputClass} value={addr.zoneId} onChange={(e) => setAddr({ ...addr, zoneId: Number(e.target.value) })}>
                      <option value={0}>انتخاب کنید</option>
                      {zones.map((z) => (
                        <option key={z.id} value={z.id}>{z.name}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="آدرس دقیق" required>
                    <textarea className={areaClass} rows={3} value={addr.details} onChange={(e) => setAddr({ ...addr, details: e.target.value })} />
                  </Field>
                  <div>
                    <p className="mb-1.5 text-[13px] font-medium text-ink">محل روی نقشه</p>
                    <MapPicker lat={addr.lat} lng={addr.lng} onChange={(lat, lng) => setAddr((a) => ({ ...a, lat, lng }))} />
                  </div>
                  <Button type="button" className="w-full" onClick={saveAddress} disabled={busy}>
                    ذخیره آدرس
                  </Button>
                </div>
              </div>
            </section>
          ) : null}

          {tab === "baskets" ? (
            <section>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-[16px] font-bold text-ink">سبدهای ماهانه</h2>
                <Link href="/monthly">
                  <Button type="button" variant="outline" className="h-10 px-4 text-[13px]">
                    ساخت سبد جدید
                  </Button>
                </Link>
              </div>
              {!data?.baskets.length ? (
                <Empty
                  title="سبد ماهانه‌ای ذخیره نشده است"
                  note="یک بار سبد ماهانه خود را بسازید تا هر ماه با یک کلیک سفارش دهید."
                  action={<Link href="/monthly"><Button type="button">ساخت سبد ماهانه</Button></Link>}
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {data.baskets.map((b) => {
                    const total = b.items.reduce((s, i) => s + i.price * i.qty, 0);
                    return (
                      <article key={b.id} className="rounded-lg border border-line p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[14.5px] font-semibold text-ink">{b.name}</p>
                            <p className="num mt-1 text-[11.5px] text-muted">
                              {toFa(b.items.length)} قلم · به‌روزرسانی {timeAgo(b.updatedAt)}
                            </p>
                          </div>
                          <button type="button" aria-label="حذف" onClick={() => deleteBasket(b.id)} className="text-muted transition hover:text-danger">
                            <TrashIcon width={16} height={16} />
                          </button>
                        </div>
                        <ul className="mt-4 space-y-1.5 border-t border-line pt-3 text-[12.5px]">
                          {b.items.slice(0, 6).map((i) => (
                            <li key={i.id} className="flex justify-between gap-2">
                              <span className="min-w-0 flex-1 truncate text-muted">{i.name}</span>
                              <span className="num">{toFa(i.qty)} × {num(i.price)}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="num mt-4 flex items-baseline justify-between border-t border-line pt-3">
                          <span className="text-[12.5px] text-muted">جمع ماهانه</span>
                          <span className="text-[15px] font-bold text-brand">{num(total)} ؋</span>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Button
                            type="button"
                            className="h-10 flex-1 text-[13px]"
                            onClick={() => {
                              for (const i of b.items) {
                                add(
                                  toProductLite({
                                    id: i.id,
                                    slug: i.slug,
                                    name: i.name,
                                    image: i.image,
                                    sizeLabel: i.sizeLabel,
                                    unit: i.unit,
                                    price: i.price,
                                    wholesalePrice: null,
                                    wholesaleMin: 12,
                                    discount: 0,
                                    stock: i.stock,
                                  }),
                                  i.qty,
                                );
                              }
                              toast("سبد ماهانه به سبد خرید اضافه شد");
                            }}
                          >
                            <CartIcon width={16} height={16} />
                            سفارش دوباره
                          </Button>
                          <Link href="/monthly" className="flex-1">
                            <Button type="button" variant="outline" className="h-10 w-full text-[13px]">
                              ویرایش
                            </Button>
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          ) : null}

          {tab === "favorites" ? (
            <section>
              <h2 className="mb-4 text-[16px] font-bold text-ink">علاقه‌مندی‌ها</h2>
              {!favProducts.length ? (
                <Empty
                  title="لیست علاقه‌مندی خالی است"
                  note="روی آیکون قلب در کارت محصولات بزنید تا اینجا ذخیره شوند."
                  action={<Link href="/products"><Button type="button">دیدن محصولات</Button></Link>}
                />
              ) : (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {favProducts.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              )}
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function AuthForms() {
  const router = useRouter();
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: mode, ...form }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "خطا در ورود");
        return;
      }
      toast(mode === "login" ? "خوش آمدید" : "حساب کاربری ساخته شد");
      router.refresh();
    } catch {
      setError("ارتباط با سرور برقرار نشد");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-[980px] gap-8 px-4 py-14 md:grid-cols-2 md:py-20">
      <div>
        <h1 className="text-[26px] font-bold text-ink md:text-[32px]">حساب کاربری</h1>
        <p className="mt-3 text-[14px] leading-8 text-muted">
          با حساب کاربری می‌توانید سفارش‌ها را پیگیری کنید، آدرس و موقعیت نقشه را ذخیره کنید و سبد
          ماهانه خود را برای سفارش دوباره نگه دارید.
        </p>
        <ul className="mt-6 space-y-2.5 text-[13px] text-ink">
          {["پیگیری وضعیت سفارش‌ها", "ذخیره آدرس با موقعیت روی نقشه", "سبد ماهانه و سفارش دوباره", "لیست علاقه‌مندی‌ها"].map((line) => (
            <li key={line} className="flex items-center gap-2.5">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-brand/10 text-brand">
                <CheckIcon width={13} height={13} />
              </span>
              {line}
            </li>
          ))}
        </ul>
        <div className="mt-8 rounded-md border border-line bg-brand-soft px-4 py-3">
          <p className="text-[12px] font-semibold text-ink">امنیت حساب</p>
          <ul className="mt-2 space-y-1.5 text-[11.5px] leading-6 text-muted">
            <li>· رمز عبور باید حداقل ۸ نویسه و شامل حرف و عدد باشد.</li>
            <li>· رمزها به‌صورت درهم‌شده (scrypt + salt) ذخیره می‌شوند و هرگز نمایش داده نمی‌شوند.</li>
            <li>· پس از چند تلاش ناموفق، ورود برای چند دقیقه مسدود می‌شود.</li>
          </ul>
        </div>
      </div>

      <form onSubmit={submit} className="h-fit rounded-lg border border-line p-5 md:p-6">
        <div className="flex rounded-md border border-line p-1">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError("");
              }}
              className={`h-9 flex-1 rounded text-[13px] transition ${
                mode === m ? "bg-brand text-white" : "text-muted hover:text-ink"
              }`}
            >
              {m === "login" ? "ورود" : "ثبت‌نام"}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-4">
          {mode === "register" ? (
            <>
              <Field label="نام و نام خانوادگی" required>
                <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="شماره تماس">
                <input className={inputClass} dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Field>
            </>
          ) : null}
          <Field label="ایمیل" required>
            <input className={inputClass} dir="ltr" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field
            label="رمز عبور"
            required
            hint={mode === "register" ? "حداقل ۸ نویسه، شامل حرف و عدد" : undefined}
          >
            <input className={inputClass} dir="ltr" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
        </div>

        {error ? <p className="mt-3 text-[12.5px] text-danger">{error}</p> : null}

        <Button type="submit" className="mt-5 w-full" disabled={busy}>
          {busy ? "در حال ارسال…" : mode === "login" ? "ورود به حساب" : "ساخت حساب کاربری"}
        </Button>
        <p className="mt-4 text-center text-[12px] text-muted">
          ورود به عنوان مهمان هم برای ثبت سفارش امکان‌پذیر است.
        </p>
      </form>
    </div>
  );
}

export function AccountQty({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return <QtyStepper size="sm" value={value} onChange={onChange} />;
}
