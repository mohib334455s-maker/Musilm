"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useState } from "react";
import {
  AlertIcon,
  ArrowLeft,
  BoxIcon,
  CardIcon,
  CartIcon,
  ChartIcon,
  CheckIcon,
  GearIcon,
  GridIcon,
  LogoutIcon,
  StarIcon,
  TagIcon,
  TruckIcon,
  UsersIcon,
} from "@/components/icons";
import { LogoMark } from "@/components/logo";
import { Badge, Button, inputClass } from "@/components/ui";
import { useToast } from "@/components/providers";
import { num, statusLabel, statusTone, timeAgo, toFa, ORDER_STATUS } from "@/lib/format";
import { AdminCatalog } from "@/components/admin-catalog";
import type { SessionUser } from "@/lib/auth";

const NAV_GROUPS: { title: string; items: { key: SectionKey; label: string; fa: string; Icon: typeof ChartIcon }[] }[] = [
  {
    title: "نمای کلی",
    items: [{ key: "dashboard", label: "Dashboard", fa: "داشبورد", Icon: ChartIcon }],
  },
  {
    title: "فروشگاه",
    items: [
      { key: "products", label: "Products", fa: "محصولات", Icon: BoxIcon },
      { key: "categories", label: "Categories", fa: "دسته‌بندی‌ها", Icon: GridIcon },
      { key: "orders", label: "Orders", fa: "سفارش‌ها", Icon: CartIcon },
    ],
  },
  {
    title: "مشتریان و انبار",
    items: [
      { key: "customers", label: "Customers", fa: "مشتریان", Icon: UsersIcon },
      { key: "messages", label: "Messages", fa: "پیام‌ها", Icon: AlertIcon },
      { key: "reviews", label: "Reviews", fa: "نقدها", Icon: StarIcon },
      { key: "inventory", label: "Inventory", fa: "موجودی", Icon: AlertIcon },
    ],
  },
  {
    title: "عملیات",
    items: [
      { key: "delivery", label: "Delivery", fa: "تحویل و مناطق", Icon: TruckIcon },
      { key: "payments", label: "Payments", fa: "پرداخت‌ها", Icon: CardIcon },
      { key: "discounts", label: "Discounts", fa: "تخفیف‌ها", Icon: TagIcon },
      { key: "settings", label: "Settings", fa: "تنظیمات", Icon: GearIcon },
    ],
  },
];

export type SectionKey =
  | "dashboard"
  | "products"
  | "categories"
  | "orders"
  | "customers"
  | "messages"
  | "reviews"
  | "inventory"
  | "delivery"
  | "payments"
  | "discounts"
  | "settings";

type Stats = {
  stats: {
    todaySales: number;
    todayOrders: number;
    monthSales: number;
    monthOrders: number;
    pending: number;
    totalOrders: number;
    totalRevenue: number;
    products: number;
    categories: number;
    customers: number;
    unread: number;
  };
  byStatus: { status: string; count: number; total: number }[];
  yesterdaySales: number;
  yesterdayOrders: number;
  avgOrderValue: number;
  lowStock: { id: number; name: string; stock: number; lowStockAt: number; unit: string; image: string | null }[];
  recentOrders: OrderRow[];
  topProducts: { name: string; qty: number; revenue: number }[];
  series: { day: string; total: number; count: number }[];
};

export type OrderRow = {
  id: number;
  number: string;
  customerName: string;
  phone: string;
  status: string;
  total: number;
  createdAt: string;
  zoneName: string | null;
  payment: string;
  delivery: string;
  address: string;
  items?: { id: number; name: string; qty: number; unitPrice: number; lineTotal: number }[];
};

export type CustomerRow = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
  ordersCount: number;
  spent: number;
};

export type ProductRow = {
  id: number;
  slug: string;
  name: string;
  brand: string | null;
  categoryId: number | null;
  image: string | null;
  description: string | null;
  unit: string;
  sizeLabel: string | null;
  sku: string | null;
  barcode: string | null;
  price: number;
  wholesalePrice: number | null;
  wholesaleMin: number;
  discount: number;
  stock: number;
  lowStockAt: number;
  isPopular: boolean;
  isActive: boolean;
  categoryName?: string | null;
  sold?: number;
};

export type CategoryRow = {
  id: number;
  slug: string;
  name: string;
  image: string | null;
  sortOrder: number;
  isActive: boolean;
  count?: number;
};

export type MessageRow = {
  id: number;
  name: string;
  phone: string;
  body: string;
  isRead: boolean;
  createdAt: string;
};

export async function getJSON<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function AdminPanel({ user }: { user: SessionUser }) {
  const [section, setSection] = useState<SectionKey>("dashboard");
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [productList, setProductList] = useState<ProductRow[]>([]);
  const [categoryList, setCategoryList] = useState<CategoryRow[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const refresh = useCallback(async () => {
    const [s, o, c, p, cat, msg] = await Promise.all([
      getJSON<Stats>("/api/admin?action=stats"),
      getJSON<{ items: OrderRow[] }>("/api/orders"),
      getJSON<{ items: CustomerRow[] }>("/api/admin?action=customers"),
      getJSON<{ items: ProductRow[] }>("/api/products?all=1&limit=500"),
      getJSON<{ items: CategoryRow[] }>("/api/categories?all=1"),
      getJSON<{ items: MessageRow[] }>("/api/admin?action=messages"),
    ]);
    if (s) setStats(s);
    if (o) setOrders(o.items);
    if (c) setCustomers(c.items);
    if (p) setProductList(p.items);
    if (cat) setCategoryList(cat.items);
    if (msg) setMessages(msg.items);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const hash = window.location.hash.replace("#", "") as SectionKey;
    const all = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.key));
    if (all.includes(hash)) setSection(hash);
  }, [refresh]);

  useEffect(() => {
    window.location.hash = section;
  }, [section]);

  async function logout() {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    window.location.href = "/";
  }

  async function setStatus(order: OrderRow, status: string) {
    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      toast("تغییر وضعیت ناموفق بود");
      return;
    }
    toast(`سفارش ${order.number} → ${statusLabel(status)}`);
    refresh();
  }

  const current = NAV_GROUPS.flatMap((g) => g.items).find((i) => i.key === section);
  const lowStockCount = productList.filter((p) => p.stock <= p.lowStockAt).length;

  return (
    <div className="min-h-screen bg-[#F4F6F3]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* ---------- sidebar ---------- */}
        <aside className="dotted-dark shrink-0 bg-brand-dark text-white lg:sticky lg:top-0 lg:h-screen lg:w-[250px]">
          <div className="flex items-center justify-between gap-3 px-4 py-4 lg:block">
            <div className="flex items-center gap-2.5">
              <LogoMark size={38} />
              <span className="leading-none">
                <span className="display-font block text-[16px] font-bold">Muslim Store</span>
                <span className="mt-1.5 block text-[10.5px] text-white/55">پنل مدیریت فروشگاه</span>
              </span>
            </div>
            <Link href="/" className="rounded-md bg-white/10 px-2.5 py-1.5 text-[11.5px] transition hover:bg-white/20 lg:mt-5 lg:inline-flex lg:items-center lg:gap-1.5">
              <ArrowLeft width={13} height={13} className="rotate-180" />
              دیدن فروشگاه
            </Link>
          </div>

          <nav className="admin-scroll flex gap-1 overflow-x-auto px-3 pb-3 lg:h-[calc(100vh-186px)] lg:flex-col lg:overflow-y-auto lg:pb-0">
            {NAV_GROUPS.map((group) => (
              <div key={group.title} className="shrink-0 lg:shrink lg:mb-4">
                <p className="hidden px-3 pb-1.5 pt-3 text-[10px] font-semibold uppercase tracking-wider text-white/35 lg:block">
                  {group.title}
                </p>
                <div className="flex gap-1 lg:flex-col">
                  {group.items.map(({ key, label, fa, Icon }) => {
                    const active = section === key;
                    const badge =
                      key === "orders"
                        ? stats?.stats.pending
                        : key === "inventory"
                          ? lowStockCount
                          : key === "dashboard" || key === "messages"
                            ? stats?.stats.unread
                            : 0;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSection(key)}
                        className={`relative flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-[12.5px] transition lg:w-full ${
                          active ? "bg-white/12 font-semibold text-white" : "text-white/70 hover:bg-white/8 hover:text-white"
                        }`}
                      >
                        {active ? <span className="absolute inset-y-1.5 right-0 w-[3px] rounded-full bg-accent" /> : null}
                        <Icon width={17} height={17} className={active ? "text-accent" : ""} />
                        <span className="whitespace-nowrap">{fa}</span>
                        <span className="hidden text-[10px] text-white/35 lg:inline" dir="ltr">
                          {label}
                        </span>
                        {badge ? (
                          <span className="num mr-auto rounded-full bg-accent px-1.5 text-[10px] font-bold text-white lg:mr-auto">
                            {toFa(badge)}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="hidden items-center gap-3 border-t border-white/12 px-4 py-4 lg:flex">
            <span className="display-font grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-[13px] font-bold text-white">
              {user.name.slice(0, 1)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12.5px] font-medium">{user.name}</span>
              <span className="num block truncate text-[10.5px] text-white/50" dir="ltr">
                {user.email}
              </span>
            </span>
            <button type="button" aria-label="خروج" onClick={logout} className="text-white/50 transition hover:text-danger">
              <LogoutIcon width={17} height={17} />
            </button>
          </div>
        </aside>

        {/* ---------- main ---------- */}
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-7">
              <div>
                <p className="num text-[11px] text-muted">
                  پنل مدیریت <span className="mx-1 text-line">/</span> {current?.label}
                </p>
                <h1 className="mt-0.5 text-[18px] font-bold text-ink md:text-[21px]">{current?.fa}</h1>
              </div>
              <div className="flex items-center gap-2">
                <span className="num hidden rounded-md border border-line px-3 py-2 text-[11.5px] text-muted sm:block">
                  {new Date().toLocaleDateString("fa-AF", { weekday: "long", day: "numeric", month: "long" })}
                </span>
                <Button type="button" variant="outline" className="h-10 px-3.5 text-[12.5px]" onClick={() => { setLoading(true); refresh(); }}>
                  به‌روزرسانی
                </Button>
                <Link href="/" className="hidden md:block">
                  <Button type="button" className="btn-shine h-10 px-3.5 text-[12.5px]">
                    <ArrowLeft width={15} height={15} className="rotate-180" />
                    فروشگاه
                  </Button>
                </Link>
              </div>
            </div>
            {loading ? <div className="shimmer h-[2px] w-full bg-brand/20" /> : null}
          </header>

          <main className="px-4 py-6 md:px-7 md:py-8">
            {section === "dashboard" ? (
              <Dashboard
                stats={stats}
                onGo={setSection}
                messages={messages}
                onMessageRead={async (id: number) => {
                  await fetch(`/api/admin?action=message:read`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id }),
                  });
                  refresh();
                }}
                onMessageDelete={async (id: number) => {
                  await fetch(`/api/admin?action=message:delete`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id }),
                  });
                  refresh();
                }}
              />
            ) : null}

            {section === "orders" ? <OrdersSection orders={orders} setStatus={setStatus} /> : null}
            {section === "customers" ? (
              <CustomersSection customers={customers} refresh={refresh} toast={toast} currentUserId={user.id} />
            ) : null}
            {section === "messages" ? (
              <MessagesSection
                messages={messages}
                refresh={refresh}
                toast={toast}
              />
            ) : null}
            {section === "inventory" ? <InventorySection products={productList} refresh={refresh} toast={toast} /> : null}

            {section === "products" ||
            section === "categories" ||
            section === "reviews" ||
            section === "delivery" ||
            section === "payments" ||
            section === "discounts" ||
            section === "settings" ? (
              <AdminCatalog section={section} products={productList} categories={categoryList} refresh={refresh} />
            ) : null}
          </main>
        </div>
      </div>
    </div>
  );
}

/* ---------------- shared bits ---------------- */

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-line bg-white p-5 ${className}`}>{children}</section>;
}

function Spark({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  return (
    <span className="flex h-8 items-end gap-[3px]">
      {values.map((v, i) => (
        <span
          key={i}
          className={`w-1.5 rounded-sm transition-all duration-500 ${i === values.length - 1 ? "bg-accent" : "bg-brand/25"}`}
          style={{ height: `${Math.max(10, (v / max) * 100)}%` }}
        />
      ))}
    </span>
  );
}

function Delta({ now, before }: { now: number; before: number }) {
  if (!before) return <span className="num text-[11px] text-muted">بدون داده دیروز</span>;
  const pct = Math.round(((now - before) / before) * 100);
  const up = pct >= 0;
  return (
    <span className={`num flex items-center gap-1 text-[11.5px] font-semibold ${up ? "text-brand" : "text-danger"}`}>
      <span>{up ? "▲" : "▼"}</span>
      {toFa(Math.abs(pct))}٪ نسبت به دیروز
    </span>
  );
}

function Donut({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const R = 52;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="relative grid place-items-center">
      <svg viewBox="0 0 140 140" className="h-[168px] w-[168px] -rotate-90">
        <circle cx="70" cy="70" r={R} fill="none" stroke="#EDEFEA" strokeWidth="15" />
        {total > 0 &&
          data.map((d) => {
            const len = (d.value / total) * C;
            const el = (
              <circle
                key={d.label}
                cx="70"
                cy="70"
                r={R}
                fill="none"
                stroke={d.color}
                strokeWidth="15"
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-offset}
                className="transition-all duration-700"
              />
            );
            offset += len;
            return el;
          })}
      </svg>
      <div className="absolute text-center">
        <p className="num text-[22px] font-bold leading-none text-ink">{toFa(total)}</p>
        <p className="mt-1 text-[11px] text-muted">کل سفارش‌ها</p>
      </div>
    </div>
  );
}

/* ---------------- dashboard ---------------- */

function Dashboard({
  stats,
  onGo,
  messages,
  onMessageRead,
  onMessageDelete,
}: {
  stats: Stats | null;
  onGo: (s: SectionKey) => void;
  messages: MessageRow[];
  onMessageRead: (id: number) => void;
  onMessageDelete: (id: number) => void;
}) {
  if (!stats) return <p className="text-sm text-muted">در حال بارگذاری داده‌ها…</p>;

  const s = stats.stats;
  const last7 = stats.series.slice(-7).map((d) => d.total);
  const max = Math.max(1, ...stats.series.map((d) => d.total));
  const topMax = Math.max(1, ...stats.topProducts.map((p) => p.revenue));

  const donut = ORDER_STATUS.map((st) => ({
    label: st.label,
    color: st.tone,
    value: stats.byStatus.find((b) => b.status === st.value)?.count ?? 0,
  })).filter((d) => d.value > 0);

  const kpis = [
    { label: "فروش امروز", value: s.todaySales, unit: "افغانی", delta: <Delta now={s.todaySales} before={stats.yesterdaySales} />, spark: last7 },
    { label: "سفارش امروز", value: s.todayOrders, unit: "سفارش", delta: <Delta now={s.todayOrders} before={stats.yesterdayOrders} />, spark: stats.series.slice(-7).map((d) => d.count) },
    { label: "فروش این ماه", value: s.monthSales, unit: "افغانی", delta: <span className="num text-[11.5px] text-muted">{toFa(s.monthOrders)} سفارش</span>, spark: last7 },
    { label: "میانگین سبد", value: stats.avgOrderValue, unit: "افغانی", delta: <span className="num text-[11.5px] text-muted">کل {toFa(s.totalOrders)} سفارش</span>, spark: last7 },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="card-lift">
            <p className="text-[12px] text-muted">{k.label}</p>
            <p className="num mt-2 text-[26px] font-bold leading-none text-brand">
              {toFa(k.value.toLocaleString("en-US"))}
              <span className="mr-1.5 text-[11px] font-medium text-muted">{k.unit}</span>
            </p>
            <div className="mt-3 flex items-end justify-between gap-3">
              {k.delta}
              <Spark values={k.spark} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[14.5px] font-bold text-ink">روند فروش ۱۴ روز اخیر</h2>
            <span className="num text-[11.5px] text-muted">
              مجموع <span className="font-semibold text-brand">{num(s.totalRevenue)}</span> افغانی
            </span>
          </div>
          <div className="mt-6 flex h-44 items-end gap-1.5">
            {stats.series.length === 0 ? (
              <p className="text-[12.5px] text-muted">داده‌ای برای نمایش نیست</p>
            ) : (
              stats.series.map((d, i) => (
                <div key={d.day} className="group flex flex-1 flex-col items-center gap-2">
                  <span className="num rounded bg-ink px-1.5 py-0.5 text-[10px] text-white opacity-0 transition group-hover:opacity-100">
                    {num(d.total)}
                  </span>
                  <div
                    className={`w-full rounded-t transition-all duration-500 group-hover:bg-brand ${
                      i === stats.series.length - 1 ? "bg-accent" : "bg-brand/80"
                    }`}
                    style={{ height: `${Math.max(4, (d.total / max) * 100)}%` }}
                  />
                  <span className="num text-[9.5px] text-muted">{d.day.slice(3)}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-[14.5px] font-bold text-ink">وضعیت سفارش‌ها</h2>
          <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row">
            <Donut data={donut} />
            <ul className="w-full space-y-1.5">
              {donut.map((d) => (
                <li key={d.label} className="flex items-center gap-2 text-[12px]">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: d.color }} />
                  <span className="flex-1 text-muted">{d.label}</span>
                  <span className="num font-semibold text-ink">{toFa(d.value)}</span>
                </li>
              ))}
              {!donut.length ? <li className="text-[12px] text-muted">سفارشی ثبت نشده است</li> : null}
            </ul>
          </div>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-[14.5px] font-bold text-ink">پرفروش‌ترین محصولات</h2>
            <button type="button" onClick={() => onGo("products")} className="text-[11.5px] text-brand hover:underline">
              مدیریت محصولات
            </button>
          </div>
          <ul className="mt-4 space-y-3.5">
            {stats.topProducts.map((p) => (
              <li key={p.name}>
                <div className="flex items-center justify-between gap-3 text-[12.5px]">
                  <span className="min-w-0 flex-1 truncate text-ink">{p.name}</span>
                  <span className="num shrink-0 text-muted">{toFa(p.qty)} عدد</span>
                  <span className="num w-24 shrink-0 text-left font-semibold text-brand">{num(p.revenue)} ؋</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#EDEFEA]">
                  <div className="h-full rounded-full bg-brand transition-all duration-700" style={{ width: `${(p.revenue / topMax) * 100}%` }} />
                </div>
              </li>
            ))}
            {!stats.topProducts.length ? <li className="text-[12.5px] text-muted">هنوز فروشی ثبت نشده است</li> : null}
          </ul>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[14.5px] font-bold text-ink">
              <AlertIcon width={16} height={16} className="text-accent" />
              هشدار موجودی
            </h2>
            <button type="button" onClick={() => onGo("inventory")} className="text-[11.5px] text-brand hover:underline">
              مدیریت موجودی
            </button>
          </div>
          <ul className="mt-4 space-y-2">
            {stats.lowStock.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2.5">
                <span className="h-9 w-9 shrink-0 overflow-hidden rounded-md bg-brand-soft">
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-medium text-ink">{p.name}</span>
                  <span className="num block text-[11px] text-muted">حد هشدار: {toFa(p.lowStockAt)}</span>
                </span>
                <span className={`num shrink-0 rounded-md px-2 py-1 text-[11px] font-bold ${p.stock === 0 ? "bg-danger/10 text-danger" : "bg-accent/12 text-accent"}`}>
                  {p.stock === 0 ? "ناموجود" : `${toFa(p.stock)} باقی`}
                </span>
              </li>
            ))}
            {!stats.lowStock.length ? <li className="text-[12.5px] text-muted">همه محصولات موجودی کافی دارند</li> : null}
          </ul>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-[14.5px] font-bold text-ink">آخرین سفارش‌ها</h2>
            <button type="button" onClick={() => onGo("orders")} className="text-[11.5px] text-brand hover:underline">
              همه سفارش‌ها
            </button>
          </div>
          <div className="mt-4 overflow-hidden rounded-lg border border-line">
            <table className="w-full text-right text-[12.5px]">
              <thead className="bg-brand-soft text-[11px] text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">شماره</th>
                  <th className="px-3 py-2 font-medium">مشتری</th>
                  <th className="px-3 py-2 font-medium">وضعیت</th>
                  <th className="px-3 py-2 font-medium">مبلغ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {stats.recentOrders.map((o) => (
                  <tr key={o.id} className="transition hover:bg-brand-soft/50">
                    <td className="num px-3 py-2.5 text-muted" dir="ltr">{o.number}</td>
                    <td className="px-3 py-2.5 text-ink">{o.customerName}</td>
                    <td className="px-3 py-2.5">
                      <Badge tone={statusTone(o.status)}>{statusLabel(o.status)}</Badge>
                    </td>
                    <td className="num px-3 py-2.5 font-semibold text-brand">{num(o.total)} ؋</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h2 className="text-[14.5px] font-bold text-ink">پیام‌های مشتریان</h2>
          <ul className="mt-4 divide-y divide-line">
            {messages.map((m) => (
              <li key={m.id} className="flex flex-wrap items-start gap-2.5 py-3">
                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${m.isRead ? "bg-line" : "bg-accent"}`} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline gap-2">
                    <span className="text-[12.5px] font-medium text-ink">{m.name}</span>
                    <span className="num text-[11px] text-muted" dir="ltr">{m.phone}</span>
                    <span className="num text-[10.5px] text-muted">{timeAgo(m.createdAt)}</span>
                  </span>
                  <span className="mt-1 block text-[12px] leading-6 text-muted">{m.body}</span>
                </span>
                <span className="flex shrink-0 gap-2">
                  {!m.isRead ? (
                    <button type="button" onClick={() => onMessageRead(m.id)} className="text-[11px] text-brand hover:underline">
                      خوانده شد
                    </button>
                  ) : null}
                  <button type="button" onClick={() => onMessageDelete(m.id)} className="text-[11px] text-muted transition hover:text-danger">
                    حذف
                  </button>
                </span>
              </li>
            ))}
            {!messages.length ? <li className="py-6 text-center text-[12.5px] text-muted">پیامی دریافت نشده است</li> : null}
          </ul>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "محصولات فعال", value: s.products, key: "products" as SectionKey },
          { label: "دسته‌بندی‌ها", value: s.categories, key: "categories" as SectionKey },
          { label: "مشتریان", value: s.customers, key: "customers" as SectionKey },
          { label: "سفارش در انتظار", value: s.pending, key: "orders" as SectionKey },
        ].map((item) => (
          <button key={item.label} type="button" onClick={() => onGo(item.key)} className="card-lift rounded-xl border border-line bg-white p-4 text-right">
            <p className="text-[12px] text-muted">{item.label}</p>
            <p className="num mt-1.5 text-[20px] font-bold text-ink">{toFa(item.value)}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- orders ---------------- */

function OrdersSection({ orders, setStatus }: { orders: OrderRow[]; setStatus: (o: OrderRow, s: string) => void }) {
  const [filter, setFilter] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<number | null>(null);

  const list = orders.filter((o) => {
    if (filter && o.status !== filter) return false;
    if (q.trim()) {
      const needle = q.trim();
      return o.number.includes(needle) || o.customerName.includes(needle) || o.phone.includes(needle);
    }
    return true;
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="no-bar flex gap-2 overflow-x-auto">
          {[{ value: "", label: "همه" }, ...ORDER_STATUS].map((s) => {
            const c = s.value ? orders.filter((o) => o.status === s.value).length : orders.length;
            return (
              <button
                key={s.value || "all"}
                type="button"
                onClick={() => setFilter(s.value)}
                className={`num shrink-0 rounded-full border px-3.5 py-1.5 text-[12px] transition ${
                  filter === s.value ? "border-brand bg-brand text-white" : "border-line bg-white text-ink hover:border-brand"
                }`}
              >
                {s.label} ({toFa(c)})
              </button>
            );
          })}
        </div>
        <input
          className={`${inputClass} h-10 w-full max-w-xs`}
          placeholder="جستجوی شماره سفارش، مشتری یا تماس…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-line bg-white">
        <table className="w-full text-right text-[12.5px]">
          <thead className="bg-brand-soft text-[11px] text-muted">
            <tr>
              <th className="px-3 py-3 font-medium">شماره</th>
              <th className="px-3 py-3 font-medium">مشتری</th>
              <th className="hidden px-3 py-3 font-medium md:table-cell">منطقه</th>
              <th className="hidden px-3 py-3 font-medium sm:table-cell">پرداخت</th>
              <th className="px-3 py-3 font-medium">مبلغ</th>
              <th className="px-3 py-3 font-medium">وضعیت</th>
              <th className="hidden px-3 py-3 font-medium lg:table-cell">تاریخ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {list.map((o) => (
              <Fragment key={o.id}>
                <tr onClick={() => setOpen(open === o.id ? null : o.id)} className="cursor-pointer transition hover:bg-brand-soft/50">
                  <td className="num px-3 py-3 font-semibold text-brand" dir="ltr">{o.number}</td>
                  <td className="px-3 py-3">
                    <span className="block text-ink">{o.customerName}</span>
                    <span className="num block text-[11px] text-muted" dir="ltr">{o.phone}</span>
                  </td>
                  <td className="hidden px-3 py-3 text-muted md:table-cell">{o.delivery === "pickup" ? "تحویل حضوری" : o.zoneName}</td>
                  <td className="num hidden px-3 py-3 text-muted sm:table-cell">{o.payment}</td>
                  <td className="num px-3 py-3 font-semibold text-ink">{num(o.total)} ؋</td>
                  <td className="px-3 py-3">
                    <Badge tone={statusTone(o.status)}>{statusLabel(o.status)}</Badge>
                  </td>
                  <td className="num hidden px-3 py-3 text-muted lg:table-cell">{timeAgo(o.createdAt)}</td>
                </tr>
                {open === o.id ? (
                  <tr key={`${o.id}-detail`}>
                    <td colSpan={7} className="bg-brand-soft/40 px-3 py-4">
                      <div className="animate-slide-down grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-[11.5px] font-semibold text-muted">تغییر وضعیت سفارش</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {ORDER_STATUS.map((st) => (
                              <button
                                key={st.value}
                                type="button"
                                onClick={() => setStatus(o, st.value)}
                                className={`rounded-md border px-2.5 py-1.5 text-[11.5px] transition ${
                                  o.status === st.value ? "border-brand bg-brand text-white" : "border-line bg-white text-ink hover:border-brand"
                                }`}
                              >
                                {st.label}
                              </button>
                            ))}
                          </div>
                          <dl className="num mt-4 space-y-1.5 rounded-lg border border-line bg-white px-3 py-2.5 text-[12px] text-muted">
                            <div className="flex justify-between gap-3"><dt>تحویل</dt><dd className="text-ink">{o.delivery === "pickup" ? "دریافت از انبار" : o.zoneName}</dd></div>
                            <div className="flex justify-between gap-3"><dt>پرداخت</dt><dd className="text-ink">{o.payment}</dd></div>
                            <div className="flex justify-between gap-3"><dt>آدرس</dt><dd className="max-w-[62%] text-left text-ink">{o.address}</dd></div>
                          </dl>
                        </div>
                        <div>
                          <p className="text-[11.5px] font-semibold text-muted">اقلام سفارش</p>
                          <ul className="mt-2 divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
                            {(o.items ?? []).map((it) => (
                              <li key={it.id} className="num flex items-center justify-between gap-3 px-3 py-2 text-[12px]">
                                <span className="min-w-0 flex-1 truncate">{it.name}</span>
                                <span className="text-muted">{toFa(it.qty)} × {num(it.unitPrice)}</span>
                                <span className="w-20 text-left font-semibold">{num(it.lineTotal)} ؋</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
          </tbody>
        </table>
        {!list.length ? <p className="px-4 py-10 text-center text-[12.5px] text-muted">سفارشی با این فیلتر پیدا نشد</p> : null}
      </div>
    </div>
  );
}

/* ---------------- customers ---------------- */

function CustomersSection({
  customers,
  refresh,
  toast,
  currentUserId,
}: {
  customers: CustomerRow[];
  refresh: () => void;
  toast: (m: string) => void;
  currentUserId: number;
}) {
  const [q, setQ] = useState("");
  const list = customers.filter(
    (c) => !q.trim() || c.name.includes(q.trim()) || c.email.includes(q.trim()) || (c.phone ?? "").includes(q.trim()),
  );

  async function setRole(c: CustomerRow, role: "admin" | "customer") {
    if (c.id === currentUserId && role !== "admin") {
      toast("نمی‌توانید نقش خودتان را تغییر دهید");
      return;
    }
    const res = await fetch("/api/admin?action=customer:save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id, role }),
    });
    if (!res.ok) {
      toast("تغییر نقش ناموفق بود");
      return;
    }
    toast(`نقش ${c.name} به ${role === "admin" ? "ادمین" : "مشتری"} تغییر کرد`);
    refresh();
  }

  async function removeCustomer(c: CustomerRow) {
    if (c.id === currentUserId) {
      toast("نمی‌توانید حساب خودتان را حذف کنید");
      return;
    }
    if (!window.confirm(`حذف «${c.name}» قطعی است؟`)) return;
    const res = await fetch("/api/admin?action=customer:delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast(data.error ?? "حذف ناموفق بود");
      return;
    }
    toast("مشتری حذف شد");
    refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="num text-[12.5px] text-muted">
          <span className="font-semibold text-ink">{toFa(customers.length)}</span> کاربر ثبت‌نام شده — نقش و حذف از همین‌جا
        </p>
        <input className={`${inputClass} h-10 w-full max-w-xs`} placeholder="جستجوی نام، ایمیل یا تماس…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-line bg-white">
        <table className="w-full text-right text-[12.5px]">
          <thead className="bg-brand-soft text-[11px] text-muted">
            <tr>
              <th className="px-3 py-3 font-medium">مشتری</th>
              <th className="hidden px-3 py-3 font-medium sm:table-cell">تماس</th>
              <th className="px-3 py-3 font-medium">سفارش‌ها</th>
              <th className="px-3 py-3 font-medium">مجموع خرید</th>
              <th className="hidden px-3 py-3 font-medium md:table-cell">عضویت</th>
              <th className="px-3 py-3 font-medium">نقش</th>
              <th className="px-3 py-3 font-medium">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {list.map((c) => (
              <tr key={c.id} className="transition hover:bg-brand-soft/50">
                <td className="px-3 py-3">
                  <span className="flex items-center gap-2.5">
                    <span className="display-font grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft text-[13px] font-bold text-brand">
                      {c.name.slice(0, 1)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink">{c.name}</span>
                      <span className="num block truncate text-[11px] text-muted" dir="ltr">{c.email}</span>
                    </span>
                  </span>
                </td>
                <td className="num hidden px-3 py-3 text-muted sm:table-cell" dir="ltr">{c.phone ?? "—"}</td>
                <td className="num px-3 py-3 text-ink">{toFa(c.ordersCount)}</td>
                <td className="num px-3 py-3 font-semibold text-brand">{num(c.spent)} ؋</td>
                <td className="num hidden px-3 py-3 text-muted md:table-cell">{new Date(c.createdAt).toLocaleDateString("fa-AF")}</td>
                <td className="px-3 py-3">
                  <select
                    className="rounded-md border border-line bg-white px-2 py-1.5 text-[11.5px] outline-none"
                    value={c.role}
                    onChange={(e) => setRole(c, e.target.value as "admin" | "customer")}
                    disabled={c.id === currentUserId}
                  >
                    <option value="customer">مشتری</option>
                    <option value="admin">ادمین</option>
                  </select>
                </td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    disabled={c.id === currentUserId}
                    onClick={() => removeCustomer(c)}
                    className="text-[11.5px] text-muted transition hover:text-danger disabled:opacity-40"
                  >
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!list.length ? <p className="px-4 py-10 text-center text-[12.5px] text-muted">کاربری پیدا نشد</p> : null}
      </div>
    </div>
  );
}

/* ---------------- messages ---------------- */

function MessagesSection({
  messages,
  refresh,
  toast,
}: {
  messages: MessageRow[];
  refresh: () => void;
  toast: (m: string) => void;
}) {
  const unread = messages.filter((m) => !m.isRead).length;

  async function markRead(id: number) {
    await fetch("/api/admin?action=message:read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    refresh();
  }

  async function markAll() {
    await fetch("/api/admin?action=message:read-all", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    toast("همه پیام‌ها خوانده شدند");
    refresh();
  }

  async function remove(id: number) {
    await fetch("/api/admin?action=message:delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    toast("پیام حذف شد");
    refresh();
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="num text-[12.5px] text-muted">
          {toFa(messages.length)} پیام · <span className="font-semibold text-brand">{toFa(unread)} خوانده‌نشده</span>
        </p>
        {unread > 0 ? (
          <Button type="button" variant="outline" className="h-9 px-3 text-[12px]" onClick={markAll}>
            خواندن همه
          </Button>
        ) : null}
      </div>
      <div className="overflow-hidden rounded-xl border border-line bg-white">
        <ul className="divide-y divide-line">
          {messages.map((m) => (
            <li key={m.id} className="flex flex-wrap items-start gap-3 px-4 py-4">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${m.isRead ? "bg-line" : "bg-accent"}`} />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline gap-2">
                  <span className="text-[13px] font-semibold text-ink">{m.name}</span>
                  <span className="num text-[11.5px] text-muted" dir="ltr">{m.phone}</span>
                  <span className="num text-[11px] text-muted">{timeAgo(m.createdAt)}</span>
                </span>
                <p className="mt-1.5 text-[12.5px] leading-7 text-muted">{m.body}</p>
              </span>
              <span className="flex shrink-0 gap-2">
                {!m.isRead ? (
                  <button type="button" onClick={() => markRead(m.id)} className="rounded-md border border-line px-2.5 py-1.5 text-[11.5px] text-brand hover:bg-brand-soft">
                    خوانده شد
                  </button>
                ) : null}
                <button type="button" onClick={() => remove(m.id)} className="rounded-md border border-line px-2.5 py-1.5 text-[11.5px] text-muted hover:border-danger hover:text-danger">
                  حذف
                </button>
              </span>
            </li>
          ))}
          {!messages.length ? <li className="px-4 py-12 text-center text-[12.5px] text-muted">پیامی دریافت نشده است</li> : null}
        </ul>
      </div>
    </div>
  );
}

/* ---------------- inventory ---------------- */

function InventorySection({
  products,
  refresh,
  toast,
}: {
  products: ProductRow[];
  refresh: () => void;
  toast: (m: string) => void;
}) {
  const [q, setQ] = useState("");
  const [values, setValues] = useState<Record<number, string>>({});
  const [onlyLow, setOnlyLow] = useState(false);

  const low = products.filter((p) => p.stock <= p.lowStockAt);
  const list = products
    .filter((p) => !onlyLow || p.stock <= p.lowStockAt)
    .filter((p) => !q.trim() || p.name.includes(q.trim()) || (p.sku ?? "").includes(q.trim()) || (p.brand ?? "").includes(q.trim()));

  async function saveStock(p: ProductRow, stock: number) {
    const res = await fetch(`/api/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock: Math.max(0, stock) }),
    });
    if (!res.ok) {
      toast("ثبت موجودی ناموفق بود");
      return;
    }
    setValues((v) => ({ ...v, [p.id]: String(Math.max(0, stock)) }));
    toast(`موجودی ${p.name} = ${toFa(Math.max(0, stock))}`);
    refresh();
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "کل محصولات", value: products.length, tone: "#0F5132" },
          { label: "با موجودی کم", value: low.length, tone: "#D4A84F" },
          { label: "ناموجود", value: products.filter((p) => p.stock === 0).length, tone: "#B3261E" },
        ].map((k) => (
          <Card key={k.label}>
            <p className="text-[12px] text-muted">{k.label}</p>
            <p className="num mt-1.5 text-[22px] font-bold" style={{ color: k.tone }}>
              {toFa(k.value)}
            </p>
          </Card>
        ))}
      </div>

      {low.length ? (
        <div className="mt-3 space-y-2">
          {low.slice(0, 4).map((p) => (
            <p key={p.id} className="num flex items-center gap-2 rounded-lg border border-accent/35 bg-accent/8 px-4 py-2.5 text-[12.5px] text-ink">
              <AlertIcon width={15} height={15} className="shrink-0 text-accent" />
              موجودی <span className="font-semibold">{p.name}</span> کم شده است —{" "}
              <span className="font-semibold text-accent">{p.stock === 0 ? "ناموجود" : `${toFa(p.stock)} عدد باقی مانده`}</span>
            </p>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-[12.5px] text-ink">
          <input type="checkbox" checked={onlyLow} onChange={(e) => setOnlyLow(e.target.checked)} className="h-4 w-4 accent-[#0F5132]" />
          فقط کالاهای با موجودی کم
        </label>
        <input className={`${inputClass} h-10 w-full max-w-xs`} placeholder="جستجوی محصول، برند یا SKU…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-line bg-white">
        <table className="w-full text-right text-[12.5px]">
          <thead className="bg-brand-soft text-[11px] text-muted">
            <tr>
              <th className="px-3 py-3 font-medium">محصول</th>
              <th className="hidden px-3 py-3 font-medium sm:table-cell">SKU</th>
              <th className="px-3 py-3 font-medium">موجودی</th>
              <th className="hidden px-3 py-3 font-medium md:table-cell">سلامت موجودی</th>
              <th className="px-3 py-3 font-medium">تنظیم سریع</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {list.map((p) => {
              const current = values[p.id] ?? String(p.stock);
              const health = Math.min(100, Math.round((p.stock / Math.max(1, p.lowStockAt * 4)) * 100));
              return (
                <tr key={p.id} className="transition hover:bg-brand-soft/40">
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-2.5">
                      <span className="h-9 w-9 shrink-0 overflow-hidden rounded-md bg-brand-soft">
                        {p.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                        ) : null}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-ink">{p.name}</span>
                        <span className="num block text-[11px] text-muted">{p.sizeLabel ?? p.unit}</span>
                      </span>
                    </span>
                  </td>
                  <td className="num hidden px-3 py-3 text-muted sm:table-cell" dir="ltr">{p.sku}</td>
                  <td className="num px-3 py-3">
                    <span className={p.stock === 0 ? "font-bold text-danger" : p.stock <= p.lowStockAt ? "font-bold text-accent" : "font-semibold text-ink"}>
                      {toFa(p.stock)}
                    </span>
                    <span className="mr-1 text-[11px] text-muted">{p.unit}</span>
                  </td>
                  <td className="hidden px-3 py-3 md:table-cell">
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-24 overflow-hidden rounded-full bg-[#EDEFEA]">
                        <span
                          className={`block h-full rounded-full ${p.stock === 0 ? "bg-danger" : p.stock <= p.lowStockAt ? "bg-accent" : "bg-brand"}`}
                          style={{ width: `${health}%` }}
                        />
                      </span>
                      <span className="num text-[11px] text-muted">حد {toFa(p.lowStockAt)}</span>
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-1.5">
                      <button
                        type="button"
                        aria-label="کاهش"
                        onClick={() => saveStock(p, Number(current) - 1)}
                        className="grid h-9 w-9 place-items-center rounded-md border border-line text-muted transition hover:border-brand hover:text-brand"
                      >
                        −
                      </button>
                      <input
                        className="num h-9 w-16 rounded-md border border-line px-2 text-center text-[12.5px] outline-none focus:border-brand"
                        value={current}
                        onChange={(e) => setValues((v) => ({ ...v, [p.id]: e.target.value }))}
                        inputMode="numeric"
                      />
                      <button
                        type="button"
                        aria-label="افزایش"
                        onClick={() => saveStock(p, Number(current) + 1)}
                        className="grid h-9 w-9 place-items-center rounded-md border border-line text-muted transition hover:border-brand hover:text-brand"
                      >
                        +
                      </button>
                      <Button type="button" variant="outline" className="h-9 px-3 text-[12px]" onClick={() => saveStock(p, Number(current))}>
                        <CheckIcon width={14} height={14} />
                        ثبت
                      </Button>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!list.length ? <p className="px-4 py-10 text-center text-[12.5px] text-muted">محصولی پیدا نشد</p> : null}
      </div>
    </div>
  );
}
