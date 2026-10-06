"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckIcon, CloseIcon, PinIcon, SearchIcon, TruckIcon } from "@/components/icons";
import { Badge, Button, Field, inputClass } from "@/components/ui";
import { num, statusLabel, statusTone, timeAgo, toFa } from "@/lib/format";

const PIPELINE = [
  { value: "pending", label: "در انتظار تأیید", hint: "سفارش ثبت شد و در صف بررسی است" },
  { value: "confirmed", label: "تأیید شد", hint: "سفارش شما تأیید و ثبت انبار شد" },
  { value: "preparing", label: "در حال آماده‌سازی", hint: "اقلام در انبار بسته‌بندی می‌شوند" },
  { value: "shipped", label: "ارسال شد", hint: "بسته به پیک تحویل داده شد" },
  { value: "delivered", label: "تحویل شد", hint: "بسته به دست شما رسید" },
];

type Tracked = {
  order: {
    number: string;
    status: string;
    createdAt: string;
    zoneName: string | null;
    delivery: string;
    payment: string;
    address: string;
    lat: number | null;
    lng: number | null;
    subtotal: number;
    discount: number;
    deliveryFee: number;
    total: number;
    note: string | null;
  };
  items: { id: number; name: string; sizeLabel: string | null; qty: number; unitPrice: number; lineTotal: number; priceType: string }[];
};

export default function TrackPage() {
  const [form, setForm] = useState({ number: "", phone: "" });
  const [data, setData] = useState<Tracked | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const n = sp.get("number");
    const p = sp.get("phone");
    if (n) setForm((f) => ({ ...f, number: n }));
    if (p) setForm((f) => ({ ...f, phone: p }));
    if (n && p) run({ number: n, phone: p });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run(values = form) {
    setError("");
    setData(null);
    if (!values.number.trim() || !values.phone.trim()) {
      setError("شماره سفارش و شماره تماس را کامل وارد کنید");
      return;
    }
    setBusy(true);
    try {
      const params = new URLSearchParams({ number: values.number.trim(), phone: values.phone.trim() });
      const res = await fetch(`/api/track?${params}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "سفارش پیدا نشد");
        return;
      }
      setData(json);
    } catch {
      setError("ارتباط با سرور برقرار نشد");
    } finally {
      setBusy(false);
    }
  }

  const currentStep = data ? PIPELINE.findIndex((p) => p.value === data.order.status) : -1;
  const cancelled = data?.order.status === "cancelled";

  return (
    <div className="mx-auto max-w-[860px] px-4 py-10 md:py-14">
      <div className="text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-brand-soft text-brand">
          <TruckIcon width={22} height={22} />
        </span>
        <h1 className="mt-4 text-[26px] font-bold text-ink md:text-[32px]">پیگیری سفارش</h1>
        <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-7 text-muted">
          شماره سفارش و شماره تماسی که هنگام ثبت سفارش وارد کردید را بنویسید تا وضعیت لحظه‌ای، اقلام و
          مبلغ را ببینید.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
        className="mt-7 rounded-xl border border-line bg-white p-4 md:p-5"
      >
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <Field label="شماره سفارش" required hint="مثلاً MS-MUJVEB2490">
            <input className={inputClass} dir="ltr" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value.toUpperCase() })} placeholder="MS-…" />
          </Field>
          <Field label="شماره تماس" required>
            <input className={inputClass} dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+93 700 000 000" />
          </Field>
          <div className="flex items-end">
            <Button type="submit" className="btn-shine w-full md:w-auto" disabled={busy}>
              <SearchIcon width={17} height={17} />
              {busy ? "در حال جستجو…" : "پیگیری"}
            </Button>
          </div>
        </div>
        {error ? <p className="mt-3 rounded-md border border-danger/30 bg-danger/5 px-3.5 py-2.5 text-[12.5px] text-danger">{error}</p> : null}
        <p className="mt-3 text-[11.5px] text-muted">
          اگر حساب کاربری دارید، همه سفارش‌ها در{" "}
          <Link href="/account?tab=orders" className="font-medium text-brand hover:underline">
            حساب کاربری
          </Link>{" "}
          قابل مشاهده است.
        </p>
      </form>

      {data ? (
        <div className="animate-rise mt-6 space-y-4">
          <div className="rounded-xl border border-line bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
              <div>
                <p className="num text-[15px] font-bold text-ink" dir="ltr">{data.order.number}</p>
                <p className="num mt-1 text-[11.5px] text-muted">ثبت {timeAgo(data.order.createdAt)}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={statusTone(data.order.status)}>{statusLabel(data.order.status)}</Badge>
                <span className="num text-[17px] font-bold text-brand">{num(data.order.total)} ؋</span>
              </div>
            </div>

            {cancelled ? (
              <div className="mt-5 flex items-start gap-3 rounded-lg border border-danger/30 bg-danger/5 p-4">
                <CloseIcon width={18} height={18} className="mt-0.5 text-danger" />
                <div>
                  <p className="text-[13.5px] font-semibold text-danger">این سفارش لغو شده است</p>
                  <p className="mt-1 text-[12.5px] leading-6 text-muted">
                    برای ثبت سفارش جدید به صفحه محصولات بروید یا با ما تماس بگیرید.
                  </p>
                </div>
              </div>
            ) : (
              <ol className="mt-6 grid gap-4 md:grid-cols-5">
                {PIPELINE.map((step, i) => {
                  const done = i < currentStep;
                  const active = i === currentStep;
                  return (
                    <li key={step.value} className="relative flex gap-3 md:block">
                      <span className="flex flex-col items-center md:flex-row md:items-center">
                        <span
                          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 transition ${
                            active
                              ? "pulse-dot border-accent bg-accent text-white"
                              : done
                                ? "border-brand bg-brand text-white"
                                : "border-line bg-white text-muted"
                          }`}
                        >
                          {done ? <CheckIcon width={16} height={16} /> : <span className="num text-[12px] font-bold">{toFa(i + 1)}</span>}
                        </span>
                        {i < PIPELINE.length - 1 ? (
                          <span className={`mt-1 h-6 w-[2px] rounded-full md:mt-0 md:h-[2px] md:w-full ${done || active ? "bg-brand/40" : "bg-line"}`} />
                        ) : null}
                      </span>
                      <span className="md:mt-2 md:block">
                        <span className={`block text-[12.5px] font-semibold ${active ? "text-brand" : done ? "text-ink" : "text-muted"}`}>
                          {step.label}
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-5 text-muted md:pr-0">{step.hint}</span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}

            <dl className="num mt-6 grid gap-3 border-t border-line pt-4 text-[12.5px] sm:grid-cols-2">
              {[
                ["روش تحویل", data.order.delivery === "pickup" ? "دریافت از انبار" : `ارسال به ${data.order.zoneName ?? "منطقه"}`],
                ["روش پرداخت", data.order.payment === "cod" ? "پرداخت هنگام تحویل" : data.order.payment === "bank" ? "حواله بانکی" : data.order.payment === "online" ? "پرداخت آنلاین" : "کارت بانکی"],
                ["آدرس", data.order.address],
                ["توضیح سفارش", data.order.note ?? "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-3 rounded-lg border border-line px-3.5 py-2.5">
                  <dt className="w-24 shrink-0 text-muted">{k}</dt>
                  <dd className="flex-1 text-ink">{v}</dd>
                </div>
              ))}
            </dl>

            {data.order.lat != null && data.order.lng != null ? (
              <div className="mt-4 overflow-hidden rounded-lg border border-line">
                <iframe
                  title="محل تحویل سفارش"
                  className="h-[220px] w-full border-0"
                  loading="lazy"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${data.order.lng - 0.03}%2C${data.order.lat - 0.02}%2C${data.order.lng + 0.03}%2C${data.order.lat + 0.02}&layer=mapnik&marker=${data.order.lat}%2C${data.order.lng}`}
                />
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-line bg-white p-5">
            <h2 className="text-[14.5px] font-bold text-ink">اقلام سفارش</h2>
            <ul className="mt-3 divide-y divide-line">
              {data.items.map((it) => (
                <li key={it.id} className="flex items-center justify-between gap-3 py-2.5 text-[12.5px]">
                  <span className="min-w-0 flex-1 truncate text-ink">
                    {it.name}
                    <span className="num text-muted"> × {toFa(it.qty)}</span>
                    {it.priceType === "wholesale" ? <span className="mr-2 rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand">قیمت عمده</span> : null}
                  </span>
                  <span className="num shrink-0 text-muted">{num(it.unitPrice)} ؋</span>
                  <span className="num w-24 shrink-0 text-left font-semibold text-ink">{num(it.lineTotal)} ؋</span>
                </li>
              ))}
            </ul>
            <dl className="num mt-3 space-y-1.5 border-t border-line pt-3 text-[12.5px]">
              <div className="flex justify-between"><dt className="text-muted">جمع محصولات</dt><dd>{num(data.order.subtotal)} ؋</dd></div>
              {data.order.discount > 0 ? (
                <div className="flex justify-between text-brand"><dt>تخفیف</dt><dd>− {num(data.order.discount)} ؋</dd></div>
              ) : null}
              <div className="flex justify-between">
                <dt className="text-muted">کرایه</dt>
                <dd>{data.order.deliveryFee === 0 ? "رایگان" : `${num(data.order.deliveryFee)} ؋`}</dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-line pt-2">
                <dt className="font-semibold">مبلغ کل</dt>
                <dd className="text-[17px] font-bold text-brand">{num(data.order.total)} ؋</dd>
              </div>
            </dl>
          </div>

          <div className="no-print flex flex-wrap justify-center gap-3">
            <Button type="button" variant="outline" onClick={() => window.print()}>
              چاپ فاکتور
            </Button>
            <Link href="/products">
              <Button type="button" variant="outline">
                <ArrowLeft width={16} height={16} className="rotate-180" />
                ادامه خرید
              </Button>
            </Link>
            <Link href="/contact">
              <Button type="button" className="btn-shine">
                <PinIcon width={16} height={16} />
                سوال درباره این سفارش
              </Button>
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
