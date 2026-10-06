"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CardIcon, CheckIcon, PinIcon, TruckIcon } from "@/components/icons";
import { unitPrice, useCart, useSession, useToast } from "@/components/providers";
import { Button, Field, areaClass, inputClass } from "@/components/ui";
import { num, toFa, PAYMENTS, statusLabel } from "@/lib/format";

const MapPicker = dynamic(() => import("@/components/map-picker").then((m) => m.MapPicker), {
  ssr: false,
  loading: () => <div className="h-[280px] w-full animate-pulse rounded-md bg-brand-soft md:h-[320px]" />,
});

type Zone = { id: number; name: string; fee: number; minOrder: number; freeOver: number; eta: string };
type SavedAddress = { id: number; title: string; details: string; zoneId: number | null; lat: number | null; lng: number | null };

const STEPS = ["آدرس", "تحویل", "پرداخت", "تأیید"];
const SLOTS = [
  { value: "morning", label: "صبح (۸ تا ۱۲)", note: "تحویل در همان روز" },
  { value: "afternoon", label: "بعدازظهر (۱۲ تا ۱۷)", note: "تحویل در همان روز" },
  { value: "asap", label: "هر چه زودتر", note: "ارسال فوری در محدوده شهر" },
];

export default function CheckoutPage() {
  const { items, ready, subtotal, clear } = useCart();
  const user = useSession();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [zones, setZones] = useState<Zone[]>([]);
  const [flags, setFlags] = useState({ cod: true, bank: true, online: true, card: false });
  const [bank, setBank] = useState({ name: "", account: "", holder: "" });
  const [pickupAddress, setPickupAddress] = useState("");
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    delivery: "delivery" as "delivery" | "pickup",
    zoneId: 0,
    address: "",
    lat: null as number | null,
    lng: null as number | null,
    slot: "morning",
    payment: "cod",
    coupon: "",
    note: "",
  });
  const [discount, setDiscount] = useState(0);
  const [appliedCode, setAppliedCode] = useState("");
  const [couponMsg, setCouponMsg] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState<{ number: string; total: number } | null>(null);

  useEffect(() => {
    fetch("/api/zones")
      .then((r) => r.json())
      .then((d) => {
        setZones(d.items ?? []);
        setFlags(d.payments ?? flags);
        setBank(d.bank ?? { name: "", account: "", holder: "" });
        setPickupAddress(d.pickupAddress ?? "");
        if (d.items?.length) setForm((f) => ({ ...f, zoneId: f.zoneId || d.items[0].id }));
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) {
      setForm((f) => ({ ...f, name: f.name || user.name, phone: f.phone || user.phone || "" }));
      fetch("/api/account")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.addresses?.length) {
            setSavedAddresses(d.addresses);
            const first = d.addresses[0] as SavedAddress;
            setForm((f) => ({
              ...f,
              address: f.address || first.details,
              zoneId: f.zoneId || first.zoneId || 0,
              lat: f.lat ?? first.lat,
              lng: f.lng ?? first.lng,
            }));
          }
        })
        .catch(() => undefined);
    }
  }, [user]);

  const zone = useMemo(() => zones.find((z) => z.id === form.zoneId) ?? zones[0] ?? null, [zones, form.zoneId]);
  const afterDiscount = subtotal - discount;
  const freeThreshold = zone?.freeOver || 2000;
  const deliveryFee = form.delivery === "pickup" || afterDiscount >= freeThreshold ? 0 : (zone?.fee ?? 0);
  const total = Math.max(0, afterDiscount + deliveryFee);
  const lines = items.map((i) => ({ ...i, unit: unitPrice(i) }));

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(current: number): string {
    if (!items.length) return "سبد خرید خالی است";
    if (current === 0) {
      if (!form.name.trim()) return "نام گیرنده لازم است";
      if (!/^[\d+\-\s]{7,}$/.test(form.phone.trim())) return "شماره تماس معتبر نیست";
      if (form.delivery === "delivery") {
        if (!form.address.trim()) return "آدرس تحویل لازم است";
        if (!form.zoneId) return "منطقه تحویل را انتخاب کنید";
        if (zone && afterDiscount < zone.minOrder) return `حداقل سفارش برای ${zone.name} ${zone.minOrder} افغانی است`;
      }
    }
    if (current === 2) {
      const enabled = flags[form.payment as keyof typeof flags];
      if (!enabled) return "این روش پرداخت فعلاً فعال نیست";
    }
    return "";
  }

  function next() {
    const msg = validate(step);
    if (msg) {
      setError(msg);
      toast(msg);
      return;
    }
    setError("");
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function applyCoupon() {
    setCouponMsg("");
    if (!form.coupon.trim()) return;
    const res = await fetch("/api/coupon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: form.coupon, subtotal }),
    });
    const data = await res.json();
    if (!res.ok) {
      setDiscount(0);
      setAppliedCode("");
      setCouponMsg(data.error ?? "کد تخفیف معتبر نیست");
      return;
    }
    setDiscount(data.discount);
    setAppliedCode(data.code);
    setCouponMsg(`کد ${data.code} اعمال شد — ${num(data.discount)} افغانی تخفیف`);
  }

  async function placeOrder() {
    const msg = validate(0) || validate(2);
    if (msg) {
      setError(msg);
      setStep(msg.includes("پرداخت") || msg.includes("روش") ? 2 : 0);
      return;
    }
    setPlacing(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ id: i.id, qty: i.qty })),
          customerName: form.name,
          phone: form.phone,
          address: form.delivery === "pickup" ? pickupAddress : form.address,
          zoneId: form.zoneId,
          lat: form.lat,
          lng: form.lng,
          delivery: form.delivery,
          payment: form.payment,
          coupon: appliedCode || undefined,
          note: [form.note, `بازه تحویل: ${SLOTS.find((s) => s.value === form.slot)?.label}`].filter(Boolean).join(" — "),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "ثبت سفارش ناموفق بود");
        toast(data.error ?? "ثبت سفارش ناموفق بود");
        return;
      }
      setPlaced({ number: data.order.number, total: data.order.total });
      clear();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("ارتباط با سرور برقرار نشد");
    } finally {
      setPlacing(false);
    }
  }

  if (!ready) {
    return <div className="mx-auto max-w-[1280px] px-4 py-24 text-center text-sm text-muted">در حال بارگذاری…</div>;
  }

  if (placed) {
    return (
      <div className="mx-auto max-w-[640px] px-4 py-16 text-center md:py-24">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand/10 text-brand">
          <CheckIcon width={30} height={30} />
        </div>
        <h1 className="mt-6 text-[26px] font-bold text-ink">سفارش شما ثبت شد</h1>
        <p className="num mt-2 text-[13.5px] text-muted">
          شماره سفارش: <span className="font-semibold text-brand" dir="ltr">{placed.number}</span>
        </p>
        <div className="mt-6 divide-y divide-line rounded-lg border border-line text-right text-[13.5px]">
          <div className="flex justify-between px-4 py-3">
            <span className="text-muted">وضعیت</span>
            <span className="font-medium text-ink">{statusLabel("pending")}</span>
          </div>
          <div className="flex justify-between px-4 py-3">
            <span className="text-muted">مبلغ قابل پرداخت</span>
            <span className="num font-bold text-brand">{num(placed.total)} افغانی</span>
          </div>
          <div className="flex justify-between px-4 py-3">
            <span className="text-muted">روش پرداخت</span>
            <span className="font-medium text-ink">{PAYMENTS.find((p) => p.value === form.payment)?.label}</span>
          </div>
          <div className="flex justify-between px-4 py-3">
            <span className="text-muted">تحویل</span>
            <span className="font-medium text-ink">
              {form.delivery === "pickup" ? "دریافت از انبار" : zone?.name} · {zone?.eta}
            </span>
          </div>
        </div>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/account?tab=orders">
            <Button type="button">پیگیری سفارش</Button>
          </Link>
          <Link href="/products">
            <Button type="button" variant="outline">
              ادامه خرید
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="mx-auto max-w-[640px] px-4 py-24 text-center">
        <h1 className="text-[24px] font-bold text-ink">سبد خرید خالی است</h1>
        <p className="mt-2 text-[13.5px] text-muted">برای تکمیل سفارش ابتدا محصول اضافه کنید.</p>
        <Link href="/products" className="mt-6 inline-block">
          <Button type="button">دیدن محصولات</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-6 md:py-14">
      <h1 className="text-[26px] font-bold text-ink md:text-[32px]">تکمیل سفارش</h1>

      <ol className="mt-6 flex items-center gap-2 border-b border-line pb-5">
        {STEPS.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={label} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                onClick={() => (done ? setStep(i) : undefined)}
                className={`num grid h-8 w-8 shrink-0 place-items-center rounded-full border text-[12.5px] transition ${
                  active
                    ? "border-brand bg-brand text-white"
                    : done
                      ? "border-brand/40 bg-brand/10 text-brand"
                      : "border-line text-muted"
                }`}
              >
                {done ? <CheckIcon width={15} height={15} /> : toFa(i + 1)}
              </button>
              <span className={`hidden text-[13px] sm:inline ${active ? "font-semibold text-ink" : "text-muted"}`}>{label}</span>
              {i < STEPS.length - 1 ? <span className={`h-px flex-1 ${done ? "bg-brand/40" : "bg-line"}`} /> : null}
            </li>
          );
        })}
      </ol>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-lg border border-line p-5 md:p-6">
          {step === 0 ? (
            <div className="space-y-5">
              <h2 className="text-[16px] font-bold text-ink">۱. آدرس تحویل</h2>

              {savedAddresses.length ? (
                <div className="space-y-2">
                  {savedAddresses.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          address: a.details,
                          zoneId: a.zoneId ?? f.zoneId,
                          lat: a.lat,
                          lng: a.lng,
                        }))
                      }
                      className={`flex w-full items-start gap-3 rounded-md border px-4 py-3 text-right transition ${
                        form.address === a.details ? "border-brand bg-brand/5" : "border-line hover:border-brand/40"
                      }`}
                    >
                      <PinIcon width={16} height={16} className="mt-0.5 text-brand" />
                      <span>
                        <span className="block text-[13px] font-medium text-ink">{a.title}</span>
                        <span className="mt-0.5 block text-[12px] text-muted">{a.details}</span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="نام و نام خانوادگی" required>
                  <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="مثلاً احمد رضایی" />
                </Field>
                <Field label="شماره تماس" required>
                  <input className={inputClass} dir="ltr" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+93 700 000 000" />
                </Field>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {(
                  [
                    { value: "delivery", label: "ارسال به آدرس", note: "تحویل در محل توسط پیک مسلم استور" },
                    { value: "pickup", label: "دریافت از انبار", note: pickupAddress || "بدون کرایه" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set("delivery", opt.value)}
                    className={`rounded-md border px-4 py-3 text-right transition ${
                      form.delivery === opt.value ? "border-brand bg-brand/5" : "border-line hover:border-brand/40"
                    }`}
                  >
                    <span className="block text-[13.5px] font-medium text-ink">{opt.label}</span>
                    <span className="mt-0.5 block text-[11.5px] text-muted">{opt.note}</span>
                  </button>
                ))}
              </div>

              {form.delivery === "delivery" ? (
                <>
                  <Field label="منطقه" required>
                    <select className={inputClass} value={form.zoneId} onChange={(e) => set("zoneId", Number(e.target.value))}>
                      {zones.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.name} — کرایه {z.fee} ؋ / رایگان بالای {z.freeOver} ؋
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="آدرس دقیق" required hint="نام سرک، خانه یا دکان و نقطه شناسایی">
                    <textarea className={areaClass} rows={3} value={form.address} onChange={(e) => set("address", e.target.value)} />
                  </Field>
                  <div>
                    <p className="mb-1.5 text-[13px] font-medium text-ink">محل روی نقشه</p>
                    <MapPicker lat={form.lat} lng={form.lng} onChange={(lat, lng) => setForm((f) => ({ ...f, lat, lng }))} />
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <Field label="Latitude">
                        <input className={`${inputClass} num`} dir="ltr" value={form.lat ?? ""} onChange={(e) => set("lat", e.target.value ? Number(e.target.value) : null)} />
                      </Field>
                      <Field label="Longitude">
                        <input className={`${inputClass} num`} dir="ltr" value={form.lng ?? ""} onChange={(e) => set("lng", e.target.value ? Number(e.target.value) : null)} />
                      </Field>
                    </div>
                  </div>
                </>
              ) : (
                <p className="rounded-md border border-line bg-brand-soft px-4 py-3 text-[13px] leading-7 text-muted">
                  {pickupAddress} — سفارش شما آماده تحویل نگه داشته می‌شود و کرایه‌ای محاسبه نمی‌گردد.
                </p>
              )}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-5">
              <h2 className="text-[16px] font-bold text-ink">۲. روش و زمان تحویل</h2>
              <div className="grid gap-2 sm:grid-cols-3">
                {SLOTS.map((slot) => (
                  <button
                    key={slot.value}
                    type="button"
                    onClick={() => set("slot", slot.value)}
                    className={`rounded-md border px-4 py-3 text-right transition ${
                      form.slot === slot.value ? "border-brand bg-brand/5" : "border-line hover:border-brand/40"
                    }`}
                  >
                    <span className="block text-[13px] font-medium text-ink">{slot.label}</span>
                    <span className="mt-0.5 block text-[11px] text-muted">{slot.note}</span>
                  </button>
                ))}
              </div>

              <div className="rounded-md border border-line p-4 text-[13px]">
                <p className="flex items-center gap-2 font-medium text-ink">
                  <TruckIcon width={16} height={16} className="text-brand" />
                  {form.delivery === "pickup" ? "دریافت حضوری از انبار" : `ارسال به ${zone?.name ?? "منطقه"}`}
                </p>
                <p className="num mt-2 text-muted">
                  زمان تحویل: {form.delivery === "pickup" ? "۱ تا ۲ ساعت پس از تأیید" : zone?.eta}
                </p>
                <p className="num mt-1 text-muted">
                  کرایه: {deliveryFee === 0 ? "رایگان" : `${num(deliveryFee)} افغانی`}
                </p>
                <p className="num mt-1 text-muted">حداقل سفارش این منطقه: {num(zone?.minOrder ?? 0)} افغانی</p>
              </div>

              <Field label="توضیح برای پیک (اختیاری)">
                <textarea className={areaClass} rows={3} value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="مثلاً: زنگ دروازه خراب است، تماس بگیرید" />
              </Field>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-5">
              <h2 className="text-[16px] font-bold text-ink">۳. روش پرداخت</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {PAYMENTS.map((p) => {
                  const enabled = flags[p.value as keyof typeof flags];
                  return (
                    <button
                      key={p.value}
                      type="button"
                      disabled={!enabled}
                      onClick={() => set("payment", p.value)}
                      className={`rounded-md border px-4 py-3 text-right transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        form.payment === p.value ? "border-brand bg-brand/5" : "border-line hover:border-brand/40"
                      }`}
                    >
                      <span className="flex items-center gap-2 text-[13.5px] font-medium text-ink">
                        <CardIcon width={16} height={16} className="text-brand" />
                        {p.label}
                      </span>
                      <span className="mt-1 block text-[11.5px] text-muted">
                        {enabled ? p.hint : "فعلاً غیرفعال — در انتظار اتصال Gateway"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {form.payment === "bank" ? (
                <div className="rounded-md border border-line bg-brand-soft p-4 text-[13px] leading-7">
                  <p className="font-medium text-ink">{bank.name}</p>
                  <p className="num text-muted" dir="ltr">Account: {bank.account}</p>
                  <p className="text-muted">{bank.holder}</p>
                  <p className="mt-1 text-[12px] text-muted">پس از حواله، سفارش شما تأیید و آماده ارسال می‌شود.</p>
                </div>
              ) : null}

              <div>
                <Field label="کد تخفیف">
                  <div className="flex gap-2">
                    <input
                      className={inputClass}
                      dir="ltr"
                      value={form.coupon}
                      onChange={(e) => set("coupon", e.target.value.toUpperCase())}
                      placeholder="RAMAZAN10"
                    />
                    <Button type="button" variant="outline" onClick={applyCoupon} className="shrink-0 px-4">
                      اعمال
                    </Button>
                  </div>
                </Field>
                {couponMsg ? (
                  <p className={`num mt-1.5 text-[12px] ${discount > 0 ? "text-brand" : "text-danger"}`}>{couponMsg}</p>
                ) : null}
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-5">
              <h2 className="text-[16px] font-bold text-ink">۴. تأیید نهایی</h2>
              <dl className="divide-y divide-line rounded-md border border-line text-[13px]">
                {[
                  ["گیرنده", `${form.name} — ${form.phone}`],
                  ["تحویل", form.delivery === "pickup" ? `دریافت از انبار: ${pickupAddress}` : `${zone?.name} — ${form.address}`],
                  ["موقعیت", form.lat != null && form.lng != null ? `${form.lat}, ${form.lng}` : "روی نقشه ثبت نشده"],
                  ["بازه زمانی", SLOTS.find((s) => s.value === form.slot)?.label ?? ""],
                  ["پرداخت", PAYMENTS.find((p) => p.value === form.payment)?.label ?? ""],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-4 px-4 py-3">
                    <dt className="w-24 shrink-0 text-muted">{k}</dt>
                    <dd className="num flex-1 text-ink">{v}</dd>
                  </div>
                ))}
              </dl>

              <ul className="divide-y divide-line rounded-md border border-line text-[13px]">
                {lines.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <span className="min-w-0 flex-1 truncate">{l.name}</span>
                    <span className="num shrink-0 text-muted">
                      {toFa(l.qty)} × {num(l.unit)}
                    </span>
                    <span className="num w-24 shrink-0 text-left font-medium">{num(l.unit * l.qty)} ؋</span>
                  </li>
                ))}
              </ul>

              {error ? <p className="rounded-md border border-danger/30 bg-danger/5 px-4 py-3 text-[12.5px] text-danger">{error}</p> : null}
            </div>
          ) : null}

          {error && step < 3 ? (
            <p className="mt-4 rounded-md border border-danger/30 bg-danger/5 px-4 py-2.5 text-[12.5px] text-danger">{error}</p>
          ) : null}

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-5">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="inline-flex items-center gap-1.5 text-[13px] text-muted transition hover:text-ink disabled:opacity-40"
            >
              <ArrowLeft width={15} height={15} className="rotate-180" />
              مرحله قبل
            </button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={next}>
                ادامه
                <ArrowLeft width={16} height={16} />
              </Button>
            ) : (
              <Button type="button" onClick={placeOrder} disabled={placing}>
                {placing ? "در حال ثبت…" : "ثبت نهایی سفارش"}
              </Button>
            )}
          </div>
        </div>

        <aside className="h-fit rounded-lg border border-line bg-brand-soft/50 p-5">
          <h2 className="text-[15px] font-bold text-ink">خلاصه سفارش</h2>
          <ul className="mt-4 space-y-2.5 text-[12.5px]">
            {lines.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-2">
                <span className="min-w-0 flex-1 truncate text-muted">
                  {l.name} <span className="num">× {toFa(l.qty)}</span>
                </span>
                <span className="num font-medium text-ink">{num(l.unit * l.qty)} ؋</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-line pt-4 text-[13px]">
            <div className="flex justify-between">
              <dt className="text-muted">جمع محصولات</dt>
              <dd className="num">{num(subtotal)} ؋</dd>
            </div>
            {discount > 0 ? (
              <div className="flex justify-between text-brand">
                <dt>تخفیف {appliedCode}</dt>
                <dd className="num">− {num(discount)} ؋</dd>
              </div>
            ) : null}
            <div className="flex justify-between">
              <dt className="text-muted">کرایه</dt>
              <dd className="num">{deliveryFee === 0 ? "رایگان" : `${num(deliveryFee)} ؋`}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-line pt-3">
              <dt className="font-semibold">جمع کل</dt>
              <dd className="num text-[18px] font-bold text-brand">{num(total)} ؋</dd>
            </div>
          </dl>
          <Link href="/cart" className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] text-muted transition hover:text-brand">
            <ArrowLeft width={14} height={14} className="rotate-180" />
            ویرایش سبد خرید
          </Link>
        </aside>
      </div>
    </div>
  );
}
