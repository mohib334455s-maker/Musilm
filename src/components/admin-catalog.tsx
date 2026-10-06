"use client";

import { useEffect, useState } from "react";
import { AlertIcon, CheckIcon, EditIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { Badge, Button, Field, inputClass, areaClass } from "@/components/ui";
import { num, timeAgo, toFa } from "@/lib/format";
import { getJSON, type CategoryRow, type ProductRow, type SectionKey } from "@/components/admin-panel";
import { Stars } from "@/components/shop-widgets";

type ZoneRow = { id: number; name: string; fee: number; minOrder: number; freeOver: number; eta: string; isActive: boolean };
type CouponRow = { id: number; code: string; percent: number; amount: number; minOrder: number; isActive: boolean };

const EMPTY_PRODUCT = {
  id: 0,
  name: "",
  brand: "",
  categoryId: "",
  image: "",
  sizeLabel: "",
  unit: "عدد",
  price: "",
  wholesalePrice: "",
  wholesaleMin: "12",
  discount: "0",
  stock: "0",
  lowStockAt: "10",
  sku: "",
  barcode: "",
  description: "",
  isPopular: false,
  isActive: true,
};

export function AdminCatalog({
  section,
  products,
  categories,
  refresh,
}: {
  section: SectionKey;
  products: ProductRow[];
  categories: CategoryRow[];
  refresh: () => void;
}) {
  const [zones, setZones] = useState<ZoneRow[]>([]);
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (section === "delivery") {
      getJSON<{ items: ZoneRow[] }>("/api/admin?action=zones").then((d) => d && setZones(d.items));
      getJSON<{ settings: Record<string, string> }>("/api/admin?action=settings").then(
        (d) => d && setSettings(d.settings),
      );
    }
    if (section === "discounts") {
      getJSON<{ items: CouponRow[] }>("/api/admin?action=coupons").then((d) => d && setCoupons(d.items));
    }
    if (section === "settings" || section === "payments") {
      getJSON<{ settings: Record<string, string> }>("/api/admin?action=settings").then(
        (d) => d && setSettings(d.settings),
      );
    }
  }, [section]);

  async function adminPost(action: string, payload: Record<string, unknown>) {
    const res = await fetch(`/api/admin?action=${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setNotice(data.error ?? "ذخیره ناموفق بود");
      return null;
    }
    setNotice("");
    return data;
  }

  if (section === "products") {
    return <ProductsSection products={products} categories={categories} refresh={refresh} notice={notice} setNotice={setNotice} />;
  }
  if (section === "categories") {
    return <CategoriesSection categories={categories} refresh={refresh} adminPost={adminPost} notice={notice} />;
  }
  if (section === "reviews") {
    return <ReviewsSection adminPost={adminPost} notice={notice} />;
  }
  if (section === "delivery") {
    return (
      <DeliverySection
        zones={zones}
        setZones={setZones}
        adminPost={adminPost}
        notice={notice}
        freeThreshold={Number(settings.freeDeliveryThreshold ?? 2000)}
      />
    );
  }
  if (section === "payments") {
    return <PaymentsSection settings={settings} setSettings={setSettings} adminPost={adminPost} refreshAll={refresh} notice={notice} />;
  }
  if (section === "discounts") {
    return <DiscountsSection coupons={coupons} setCoupons={setCoupons} products={products} adminPost={adminPost} refresh={refresh} notice={notice} />;
  }
  return <SettingsSection settings={settings} setSettings={setSettings} adminPost={adminPost} refreshAll={refresh} notice={notice} />;
}

function Head({ title, note, action }: { title: string; note?: string; action?: React.ReactNode }) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[22px] font-bold text-ink md:text-[26px]">{title}</h1>
        {note ? <p className="num mt-1 text-[12.5px] text-muted">{note}</p> : null}
      </div>
      {action}
    </header>
  );
}

function Notice({ text }: { text: string }) {
  if (!text) return null;
  return <p className="mb-4 rounded-md border border-accent/30 bg-accent/5 px-4 py-2.5 text-[12.5px] text-ink">{text}</p>;
}

function ProductsSection({
  products,
  categories,
  refresh,
  notice,
  setNotice,
}: {
  products: ProductRow[];
  categories: CategoryRow[];
  refresh: () => void;
  notice: string;
  setNotice: (v: string) => void;
}) {
  const [editing, setEditing] = useState<typeof EMPTY_PRODUCT | null>(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  const list = products.filter(
    (p) => !q.trim() || p.name.includes(q.trim()) || (p.sku ?? "").includes(q.trim()) || (p.brand ?? "").includes(q.trim()),
  );

  function startNew() {
    setEditing({ ...EMPTY_PRODUCT });
    setNotice("");
  }

  function startEdit(p: ProductRow) {
    setEditing({
      id: p.id,
      name: p.name,
      brand: p.brand ?? "",
      categoryId: p.categoryId ? String(p.categoryId) : "",
      image: p.image ?? "",
      sizeLabel: p.sizeLabel ?? "",
      unit: p.unit,
      price: String(p.price),
      wholesalePrice: p.wholesalePrice != null ? String(p.wholesalePrice) : "",
      wholesaleMin: String(p.wholesaleMin),
      discount: String(p.discount),
      stock: String(p.stock),
      lowStockAt: String(p.lowStockAt),
      sku: p.sku ?? "",
      barcode: p.barcode ?? "",
      description: p.description ?? "",
      isPopular: p.isPopular,
      isActive: p.isActive,
    });
    setNotice("");
  }

  async function save() {
    if (!editing) return;
    if (!editing.name.trim()) {
      setNotice("نام محصول لازم است");
      return;
    }
    setBusy(true);
    const payload = {
      ...editing,
      categoryId: editing.categoryId || null,
      price: Number(editing.price) || 0,
      wholesalePrice: editing.wholesalePrice ? Number(editing.wholesalePrice) : null,
      wholesaleMin: Number(editing.wholesaleMin) || 12,
      discount: Number(editing.discount) || 0,
      stock: Number(editing.stock) || 0,
      lowStockAt: Number(editing.lowStockAt) || 10,
    };
    const res = await fetch(editing.id ? `/api/products/${editing.id}` : "/api/products", {
      method: editing.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setNotice(data.error ?? "ذخیره محصول ناموفق بود");
      return;
    }
    setNotice(editing.id ? "محصول به‌روز شد" : "محصول اضافه شد");
    setEditing(null);
    refresh();
  }

  async function toggleActive(p: ProductRow) {
    await fetch(`/api/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    refresh();
  }

  async function remove(p: ProductRow) {
    if (!window.confirm(`حذف «${p.name}»؟`)) return;
    await fetch(`/api/products/${p.id}`, { method: "DELETE" });
    setNotice("محصول حذف شد");
    refresh();
  }

  return (
    <div>
      <Head
        title="Products"
        note={`${toFa(products.length)} محصول ثبت شده`}
        action={
          <Button type="button" className="h-10 px-4 text-[13px]" onClick={startNew}>
            <PlusIcon width={16} height={16} />
            افزودن محصول
          </Button>
        }
      />
      <Notice text={notice} />

      {editing ? (
        <div className="animate-rise mb-5 rounded-lg border border-line bg-white p-5">
          <h2 className="text-[15px] font-bold text-ink">{editing.id ? "ویرایش محصول" : "محصول جدید"}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Field label="نام محصول" required>
              <input className={inputClass} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </Field>
            <Field label="برند">
              <input className={inputClass} value={editing.brand} onChange={(e) => setEditing({ ...editing, brand: e.target.value })} />
            </Field>
            <Field label="دسته‌بندی">
              <select className={inputClass} value={editing.categoryId} onChange={(e) => setEditing({ ...editing, categoryId: e.target.value })}>
                <option value="">بدون دسته</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="آدرس تصویر (URL)" hint="لینک عکس محصول یا مسیر /images/…">
              <input className={inputClass} dir="ltr" value={editing.image} onChange={(e) => setEditing({ ...editing, image: e.target.value })} />
            </Field>
            <Field label="وزن / حجم">
              <input className={inputClass} value={editing.sizeLabel} onChange={(e) => setEditing({ ...editing, sizeLabel: e.target.value })} placeholder="۱۰ کیلوگرام" />
            </Field>
            <Field label="واحد">
              <input className={inputClass} value={editing.unit} onChange={(e) => setEditing({ ...editing, unit: e.target.value })} />
            </Field>
            <Field label="قیمت پرچون (افغانی)" required>
              <input className={`${inputClass} num`} inputMode="numeric" value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} />
            </Field>
            <Field label="قیمت عمده" hint="خالی یعنی بدون قیمت عمده">
              <input className={`${inputClass} num`} inputMode="numeric" value={editing.wholesalePrice} onChange={(e) => setEditing({ ...editing, wholesalePrice: e.target.value })} />
            </Field>
            <Field label="حداقل تعداد عمده">
              <input className={`${inputClass} num`} inputMode="numeric" value={editing.wholesaleMin} onChange={(e) => setEditing({ ...editing, wholesaleMin: e.target.value })} />
            </Field>
            <Field label="تخفیف (٪)">
              <input className={`${inputClass} num`} inputMode="numeric" value={editing.discount} onChange={(e) => setEditing({ ...editing, discount: e.target.value })} />
            </Field>
            <Field label="موجودی">
              <input className={`${inputClass} num`} inputMode="numeric" value={editing.stock} onChange={(e) => setEditing({ ...editing, stock: e.target.value })} />
            </Field>
            <Field label="حد هشدار موجودی">
              <input className={`${inputClass} num`} inputMode="numeric" value={editing.lowStockAt} onChange={(e) => setEditing({ ...editing, lowStockAt: e.target.value })} />
            </Field>
            <Field label="SKU">
              <input className={inputClass} dir="ltr" value={editing.sku} onChange={(e) => setEditing({ ...editing, sku: e.target.value })} />
            </Field>
            <Field label="بارکد">
              <input className={inputClass} dir="ltr" value={editing.barcode} onChange={(e) => setEditing({ ...editing, barcode: e.target.value })} />
            </Field>
            <Field label="توضیحات">
              <input className={inputClass} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            </Field>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-5">
            <label className="flex items-center gap-2 text-[13px] text-ink">
              <input type="checkbox" checked={editing.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} className="h-4 w-4 accent-[#0F5132]" />
              فعال در فروشگاه
            </label>
            <label className="flex items-center gap-2 text-[13px] text-ink">
              <input type="checkbox" checked={editing.isPopular} onChange={(e) => setEditing({ ...editing, isPopular: e.target.checked })} className="h-4 w-4 accent-[#0F5132]" />
              محصول پرفروش
            </label>
            <span className="mr-auto flex gap-2">
              <Button type="button" variant="ghost" className="h-10 px-4 text-[13px]" onClick={() => setEditing(null)}>
                انصراف
              </Button>
              <Button type="button" className="h-10 px-4 text-[13px]" onClick={save} disabled={busy}>
                {busy ? "در حال ذخیره…" : "ذخیره محصول"}
              </Button>
            </span>
          </div>
        </div>
      ) : null}

      <input className={`${inputClass} mb-4 max-w-xs`} placeholder="جستجوی محصول، برند یا SKU…" value={q} onChange={(e) => setQ(e.target.value)} />

      <div className="overflow-hidden rounded-lg border border-line bg-white">
        <table className="w-full text-right text-[13px]">
          <thead className="bg-brand-soft text-[11.5px] text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">محصول</th>
              <th className="px-4 py-3 font-medium">دسته</th>
              <th className="px-4 py-3 font-medium">پرچون</th>
              <th className="px-4 py-3 font-medium">عمده</th>
              <th className="px-4 py-3 font-medium">موجودی</th>
              <th className="px-4 py-3 font-medium">وضعیت</th>
              <th className="px-4 py-3 font-medium">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {list.map((p) => (
              <tr key={p.id} className="transition hover:bg-brand-soft/40">
                <td className="px-4 py-3">
                  <span className="flex items-center gap-3">
                    <span className="h-10 w-10 shrink-0 overflow-hidden rounded bg-brand-soft">
                      {p.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                      ) : null}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink">{p.name}</span>
                      <span className="num block text-[11px] text-muted" dir="ltr">{p.sku}</span>
                    </span>
                  </span>
                </td>
                <td className="px-4 py-3 text-muted">{p.categoryName ?? "—"}</td>
                <td className="num px-4 py-3">{num(p.price)} ؋</td>
                <td className="num px-4 py-3 text-muted">
                  {p.wholesalePrice != null ? `${num(p.wholesalePrice)} ؋ / ${toFa(p.wholesaleMin)}+` : "—"}
                </td>
                <td className="num px-4 py-3">
                  {p.stock === 0 ? (
                    <span className="font-semibold text-danger">ناموجود</span>
                  ) : p.stock <= p.lowStockAt ? (
                    <span className="font-semibold text-accent">{toFa(p.stock)}</span>
                  ) : (
                    toFa(p.stock)
                  )}
                </td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => toggleActive(p)}>
                    <Badge tone={p.isActive ? "#0F5132" : "#737B76"}>{p.isActive ? "فعال" : "غیرفعال"}</Badge>
                  </button>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5">
                    <button type="button" aria-label="ویرایش" onClick={() => startEdit(p)} className="grid h-8 w-8 place-items-center rounded border border-line text-muted transition hover:border-brand hover:text-brand">
                      <EditIcon width={15} height={15} />
                    </button>
                    <button type="button" aria-label="حذف" onClick={() => remove(p)} className="grid h-8 w-8 place-items-center rounded border border-line text-muted transition hover:border-danger hover:text-danger">
                      <TrashIcon width={15} height={15} />
                    </button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CategoriesSection({
  categories,
  refresh,
  adminPost,
  notice,
}: {
  categories: CategoryRow[];
  refresh: () => void;
  adminPost: (a: string, p: Record<string, unknown>) => Promise<unknown>;
  notice: string;
}) {
  const [form, setForm] = useState({ id: 0, name: "", slug: "", image: "", sortOrder: "0", isActive: true });

  async function save() {
    if (!form.name.trim()) return;
    await adminPost("category:save", form);
    setForm({ id: 0, name: "", slug: "", image: "", sortOrder: "0", isActive: true });
    refresh();
  }

  return (
    <div>
      <Head title="Categories" note={`${toFa(categories.length)} دسته‌بندی فعال`} />
      <Notice text={notice} />
      <div className="mb-5 rounded-lg border border-line bg-white p-5">
        <h2 className="text-[15px] font-bold text-ink">{form.id ? "ویرایش دسته" : "افزودن دسته"}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <Field label="نام دسته" required>
            <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Slug" hint="برای آدرس /products?cat=…">
            <input className={inputClass} dir="ltr" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </Field>
          <Field label="تصویر (URL)">
            <input className={inputClass} dir="ltr" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
          </Field>
          <Field label="ترتیب">
            <input className={`${inputClass} num`} value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
          </Field>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <label className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 accent-[#0F5132]" />
            فعال
          </label>
          <span className="mr-auto flex gap-2">
            {form.id ? (
              <Button type="button" variant="ghost" className="h-10 px-4 text-[13px]" onClick={() => setForm({ id: 0, name: "", slug: "", image: "", sortOrder: "0", isActive: true })}>
                انصراف
              </Button>
            ) : null}
            <Button type="button" className="h-10 px-4 text-[13px]" onClick={save}>
              ذخیره دسته
            </Button>
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center gap-3 rounded-lg border border-line bg-white p-3">
            <span className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-brand-soft">
              {c.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.image} alt={c.name} className="h-full w-full object-cover" />
              ) : null}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-medium text-ink">{c.name}</span>
              <span className="num block text-[11px] text-muted" dir="ltr">{c.slug}</span>
              <span className="num mt-1 block text-[11px] text-muted">{toFa(c.count ?? 0)} محصول</span>
            </span>
            <span className="flex shrink-0 flex-col gap-1.5">
              <button
                type="button"
                aria-label="ویرایش"
                onClick={() => setForm({ id: c.id, name: c.name, slug: c.slug, image: c.image ?? "", sortOrder: String(c.sortOrder), isActive: c.isActive })}
                className="grid h-8 w-8 place-items-center rounded border border-line text-muted transition hover:border-brand hover:text-brand"
              >
                <EditIcon width={15} height={15} />
              </button>
              <button
                type="button"
                aria-label="حذف"
                onClick={async () => {
                  if (!window.confirm(`حذف دسته «${c.name}»؟`)) return;
                  await adminPost("category:delete", { id: c.id });
                  refresh();
                }}
                className="grid h-8 w-8 place-items-center rounded border border-line text-muted transition hover:border-danger hover:text-danger"
              >
                <TrashIcon width={15} height={15} />
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeliverySection({
  zones,
  setZones,
  adminPost,
  notice,
  freeThreshold,
}: {
  zones: ZoneRow[];
  setZones: (z: ZoneRow[]) => void;
  adminPost: (a: string, p: Record<string, unknown>) => Promise<any>;
  notice: string;
  freeThreshold: number;
}) {
  const [form, setForm] = useState({ id: 0, name: "", fee: "0", minOrder: "0", freeOver: String(freeThreshold), eta: "۲۴ ساعت", isActive: true });

  async function save() {
    if (!form.name.trim()) return;
    const data = await adminPost("zone:save", {
      ...form,
      fee: Number(form.fee) || 0,
      minOrder: Number(form.minOrder) || 0,
      freeOver: Number(form.freeOver) || 0,
    });
    if (data?.items) setZones(data.items as ZoneRow[]);
    setForm({ id: 0, name: "", fee: "0", minOrder: "0", freeOver: String(freeThreshold), eta: "۲۴ ساعت", isActive: true });
  }

  async function remove(id: number) {
    const data = await adminPost("zone:delete", { id });
    if (data?.items) setZones(data.items as ZoneRow[]);
  }

  return (
    <div>
      <Head title="Delivery" note={`حد ارسال رایگان سراسری: ${num(freeThreshold)} افغانی (قابل تغییر در Settings)`} />
      <Notice text={notice} />

      <div className="mb-5 rounded-lg border border-line bg-white p-5">
        <h2 className="text-[15px] font-bold text-ink">{form.id ? "ویرایش منطقه" : "افزودن منطقه تحویل"}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Field label="نام منطقه" required>
            <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="کرایه (افغانی)">
            <input className={`${inputClass} num`} value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} />
          </Field>
          <Field label="حداقل سفارش">
            <input className={`${inputClass} num`} value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} />
          </Field>
          <Field label="حد ارسال رایگان">
            <input className={`${inputClass} num`} value={form.freeOver} onChange={(e) => setForm({ ...form, freeOver: e.target.value })} />
          </Field>
          <Field label="زمان تحویل">
            <input className={inputClass} value={form.eta} onChange={(e) => setForm({ ...form, eta: e.target.value })} />
          </Field>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-[13px]">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 accent-[#0F5132]" />
              فعال
            </label>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          {form.id ? (
            <Button type="button" variant="ghost" className="h-10 px-4 text-[13px]" onClick={() => setForm({ ...form, id: 0, name: "" })}>
              انصراف
            </Button>
          ) : null}
          <Button type="button" className="h-10 px-4 text-[13px]" onClick={save}>
            ذخیره منطقه
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-white">
        <table className="w-full text-right text-[13px]">
          <thead className="bg-brand-soft text-[11.5px] text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">منطقه</th>
              <th className="px-4 py-3 font-medium">کرایه</th>
              <th className="px-4 py-3 font-medium">حداقل سفارش</th>
              <th className="px-4 py-3 font-medium">ارسال رایگان از</th>
              <th className="px-4 py-3 font-medium">زمان تحویل</th>
              <th className="px-4 py-3 font-medium">وضعیت</th>
              <th className="px-4 py-3 font-medium">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {zones.map((z) => (
              <tr key={z.id} className="transition hover:bg-brand-soft/40">
                <td className="px-4 py-3 font-medium text-ink">{z.name}</td>
                <td className="num px-4 py-3">{num(z.fee)} ؋</td>
                <td className="num px-4 py-3 text-muted">{num(z.minOrder)} ؋</td>
                <td className="num px-4 py-3 text-brand">{num(z.freeOver)} ؋</td>
                <td className="num px-4 py-3 text-muted">{z.eta}</td>
                <td className="px-4 py-3">
                  <Badge tone={z.isActive ? "#0F5132" : "#737B76"}>{z.isActive ? "فعال" : "غیرفعال"}</Badge>
                </td>
                <td className="px-4 py-3">
                  <span className="flex gap-1.5">
                    <button
                      type="button"
                      aria-label="ویرایش"
                      onClick={() =>
                        setForm({
                          id: z.id,
                          name: z.name,
                          fee: String(z.fee),
                          minOrder: String(z.minOrder),
                          freeOver: String(z.freeOver),
                          eta: z.eta,
                          isActive: z.isActive,
                        })
                      }
                      className="grid h-8 w-8 place-items-center rounded border border-line text-muted transition hover:border-brand hover:text-brand"
                    >
                      <EditIcon width={15} height={15} />
                    </button>
                    <button type="button" aria-label="حذف" onClick={() => remove(z.id)} className="grid h-8 w-8 place-items-center rounded border border-line text-muted transition hover:border-danger hover:text-danger">
                      <TrashIcon width={15} height={15} />
                    </button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaymentsSection({
  settings,
  setSettings,
  adminPost,
  refreshAll,
  notice,
}: {
  settings: Record<string, string>;
  setSettings: (s: Record<string, string>) => void;
  adminPost: (a: string, p: Record<string, unknown>) => Promise<unknown>;
  refreshAll: () => void;
  notice: string;
}) {
  const toggles = [
    { key: "codEnabled", label: "پرداخت هنگام تحویل", hint: "پول در زمان تحویل به پیک پرداخت می‌شود" },
    { key: "bankEnabled", label: "حواله بانکی", hint: "مشتری مبلغ را به حساب شرکت حواله می‌کند" },
    { key: "onlineEnabled", label: "پرداخت آنلاین", hint: "از طریق درگاه پرداخت آنلاین" },
    { key: "cardEnabled", label: "کارت بانکی", hint: "در صورت اتصال Gateway فعال شود" },
  ];

  async function save() {
    await adminPost("settings:save", { values: settings });
    refreshAll();
  }

  return (
    <div>
      <Head title="Payments" note="روش‌های پرداخت فعال و اطلاعات حساب بانکی" />
      <Notice text={notice} />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          {toggles.map((t) => (
            <label key={t.key} className="flex items-start gap-3 rounded-lg border border-line bg-white p-4 transition hover:border-brand/40">
              <input
                type="checkbox"
                checked={settings[t.key] === "true"}
                onChange={(e) => setSettings({ ...settings, [t.key]: e.target.checked ? "true" : "false" })}
                className="mt-1 h-4 w-4 accent-[#0F5132]"
              />
              <span>
                <span className="block text-[13.5px] font-medium text-ink">{t.label}</span>
                <span className="mt-0.5 block text-[12px] text-muted">{t.hint}</span>
              </span>
              <Badge tone={settings[t.key] === "true" ? "#0F5132" : "#737B76"}>
                {settings[t.key] === "true" ? "فعال" : "غیرفعال"}
              </Badge>
            </label>
          ))}
        </div>

        <div className="rounded-lg border border-line bg-white p-5">
          <h2 className="text-[15px] font-bold text-ink">اطلاعات حساب بانکی</h2>
          <div className="mt-4 space-y-4">
            <Field label="نام بانک">
              <input className={inputClass} dir="ltr" value={settings.bankName ?? ""} onChange={(e) => setSettings({ ...settings, bankName: e.target.value })} />
            </Field>
            <Field label="شماره حساب">
              <input className={`${inputClass} num`} dir="ltr" value={settings.bankAccount ?? ""} onChange={(e) => setSettings({ ...settings, bankAccount: e.target.value })} />
            </Field>
            <Field label="صاحب حساب">
              <input className={inputClass} value={settings.bankHolder ?? ""} onChange={(e) => setSettings({ ...settings, bankHolder: e.target.value })} />
            </Field>
            <Field label="Gateway API Key" hint="در صورت اتصال درگاه پرداخت آنلاین">
              <input className={inputClass} dir="ltr" value={settings.gatewayKey ?? ""} onChange={(e) => setSettings({ ...settings, gatewayKey: e.target.value })} placeholder="خالی = درگاه متصل نیست" />
            </Field>
          </div>
          <Button type="button" className="mt-5 w-full" onClick={save}>
            <CheckIcon width={16} height={16} />
            ذخیره تنظیمات پرداخت
          </Button>
        </div>
      </div>
    </div>
  );
}

function DiscountsSection({
  coupons,
  setCoupons,
  products,
  adminPost,
  refresh,
  notice,
}: {
  coupons: CouponRow[];
  setCoupons: (c: CouponRow[]) => void;
  products: ProductRow[];
  adminPost: (a: string, p: Record<string, unknown>) => Promise<any>;
  refresh: () => void;
  notice: string;
}) {
  const [form, setForm] = useState({ id: 0, code: "", percent: "0", amount: "0", minOrder: "0", isActive: true });
  const discounted = products.filter((p) => p.discount > 0);

  async function save() {
    if (!form.code.trim()) return;
    const data = await adminPost("coupon:save", {
      ...form,
      percent: Number(form.percent) || 0,
      amount: Number(form.amount) || 0,
      minOrder: Number(form.minOrder) || 0,
    });
    if (data?.items) setCoupons(data.items as CouponRow[]);
    setForm({ id: 0, code: "", percent: "0", amount: "0", minOrder: "0", isActive: true });
  }

  async function remove(id: number) {
    const data = await adminPost("coupon:delete", { id });
    if (data?.items) setCoupons(data.items as CouponRow[]);
  }

  async function setProductDiscount(p: ProductRow, discount: number) {
    await fetch(`/api/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discount }),
    });
    refresh();
  }

  return (
    <div>
      <Head title="Discounts" note="کدهای تخفیف و تخفیف مستقیم روی محصول" />
      <Notice text={notice} />

      <div className="mb-5 rounded-lg border border-line bg-white p-5">
        <h2 className="text-[15px] font-bold text-ink">{form.id ? "ویرایش کد تخفیف" : "کد تخفیف جدید"}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-5">
          <Field label="کد" required>
            <input className={inputClass} dir="ltr" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
          </Field>
          <Field label="درصد تخفیف">
            <input className={`${inputClass} num`} value={form.percent} onChange={(e) => setForm({ ...form, percent: e.target.value })} />
          </Field>
          <Field label="مبلغ ثابت (افغانی)">
            <input className={`${inputClass} num`} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </Field>
          <Field label="حداقل سفارش">
            <input className={`${inputClass} num`} value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} />
          </Field>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-[13px]">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 accent-[#0F5132]" />
              فعال
            </label>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="button" className="h-10 px-4 text-[13px]" onClick={save}>
            ذخیره کد
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-lg border border-line bg-white">
          <p className="border-b border-line bg-brand-soft px-4 py-3 text-[12.5px] text-muted">کدهای فعال</p>
          <ul className="divide-y divide-line">
            {coupons.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3 text-[13px]">
                <span className="num font-semibold text-ink" dir="ltr">{c.code}</span>
                <span className="num text-muted">
                  {c.percent > 0 ? `${toFa(c.percent)}٪` : `${num(c.amount)} ؋`} · حداقل {num(c.minOrder)} ؋
                </span>
                <Badge tone={c.isActive ? "#0F5132" : "#737B76"}>{c.isActive ? "فعال" : "غیرفعال"}</Badge>
                <span className="flex gap-1.5">
                  <button
                    type="button"
                    aria-label="ویرایش"
                    onClick={() =>
                      setForm({ id: c.id, code: c.code, percent: String(c.percent), amount: String(c.amount), minOrder: String(c.minOrder), isActive: c.isActive })
                    }
                    className="grid h-8 w-8 place-items-center rounded border border-line text-muted transition hover:border-brand hover:text-brand"
                  >
                    <EditIcon width={15} height={15} />
                  </button>
                  <button type="button" aria-label="حذف" onClick={() => remove(c.id)} className="grid h-8 w-8 place-items-center rounded border border-line text-muted transition hover:border-danger hover:text-danger">
                    <TrashIcon width={15} height={15} />
                  </button>
                </span>
              </li>
            ))}
            {!coupons.length ? <li className="px-4 py-6 text-center text-[12.5px] text-muted">کد تخفیفی ثبت نشده است</li> : null}
          </ul>
        </div>

        <div className="overflow-hidden rounded-lg border border-line bg-white">
          <p className="border-b border-line bg-brand-soft px-4 py-3 text-[12.5px] text-muted">
            محصولات دارای تخفیف ({toFa(discounted.length)})
          </p>
          <ul className="divide-y divide-line">
            {discounted.slice(0, 10).map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 text-[13px]">
                <span className="min-w-0 flex-1 truncate">{p.name}</span>
                <span className="num text-muted line-through">{num(p.price)}</span>
                <span className="num font-semibold text-accent">{toFa(p.discount)}٪</span>
                <button type="button" onClick={() => setProductDiscount(p, 0)} className="text-[11.5px] text-muted transition hover:text-danger">
                  حذف تخفیف
                </button>
              </li>
            ))}
            {!discounted.length ? (
              <li className="flex items-center gap-2 px-4 py-6 text-center text-[12.5px] text-muted">
                <AlertIcon width={15} height={15} />
                تخفیفی روی محصولات فعال نیست — از بخش Products درصد تخفیف بدهید.
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  );
}

function SettingsSection({
  settings,
  setSettings,
  adminPost,
  refreshAll,
  notice,
}: {
  settings: Record<string, string>;
  setSettings: (s: Record<string, string>) => void;
  adminPost: (a: string, p: Record<string, unknown>) => Promise<unknown>;
  refreshAll: () => void;
  notice: string;
}) {
  const fields = [
    { key: "siteName", label: "نام فروشگاه" },
    { key: "city", label: "شهر اصلی" },
    { key: "phone", label: "تلفن" },
    { key: "whatsapp", label: "واتساپ" },
    { key: "email", label: "ایمیل" },
    { key: "address", label: "آدرس فروشگاه" },
    { key: "workingHours", label: "ساعات کاری" },
    { key: "freeDeliveryThreshold", label: "حد ارسال رایگان (افغانی)", num: true },
    { key: "defaultDeliveryFee", label: "کرایه پیش‌فرض (افغانی)", num: true },
    { key: "defaultZoneEta", label: "زمان تحویل پیش‌فرض" },
  ];

  async function save() {
    await adminPost("settings:save", { values: settings });
    refreshAll();
  }

  async function reset() {
    if (!window.confirm("بازگردانی همه تنظیمات به حالت اولیه؟")) return;
    const data = await adminPost("settings:reset", {}) as { settings?: Record<string, string> } | null;
    if (data?.settings) setSettings(data.settings);
    refreshAll();
  }

  return (
    <div>
      <Head
        title="Settings"
        note="مشخصات فروشگاه، حد ارسال رایگان و اطلاعات تماس"
        action={
          <Button type="button" variant="outline" className="h-10 px-4 text-[13px]" onClick={reset}>
            بازگردانی پیش‌فرض
          </Button>
        }
      />
      <Notice text={notice} />
      <div className="rounded-lg border border-line bg-white p-5">
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map((f) => (
            <Field key={f.key} label={f.label}>
              <input
                className={`${inputClass} ${f.num ? "num" : ""}`}
                dir={f.num ? "ltr" : undefined}
                value={settings[f.key] ?? ""}
                onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
              />
            </Field>
          ))}
          <div className="md:col-span-2">
            <Field label="آدرس انبار (برای دریافت حضوری)">
              <textarea className={areaClass} rows={2} value={settings.pickupAddress ?? ""} onChange={(e) => setSettings({ ...settings, pickupAddress: e.target.value })} />
            </Field>
          </div>
        </div>
        <Button type="button" className="mt-5" onClick={save}>
          <CheckIcon width={16} height={16} />
          ذخیره تنظیمات
        </Button>
      </div>
    </div>
  );
}

type ReviewRow = {
  id: number;
  name: string;
  rating: number;
  body: string | null;
  isApproved: boolean;
  createdAt: string;
  productId: number;
  productName: string | null;
  productSlug: string | null;
};

function ReviewsSection({
  adminPost,
  notice,
}: {
  adminPost: (a: string, p: Record<string, unknown>) => Promise<unknown>;
  notice: string;
}) {
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [filter, setFilter] = useState<"pending" | "approved" | "all">("pending");

  async function load() {
    const data = await getJSON<{ items: ReviewRow[] }>("/api/admin?action=reviews");
    if (data) setRows(data.items);
  }

  useEffect(() => {
    load();
  }, []);

  async function act(action: string, id: number) {
    await adminPost(action, { id });
    load();
  }

  const pending = rows.filter((r) => !r.isApproved).length;
  const list = rows.filter((r) =>
    filter === "all" ? true : filter === "pending" ? !r.isApproved : r.isApproved,
  );

  return (
    <div>
      <Head
        title="Reviews"
        note={`${toFa(rows.length)} نقد ثبت شده · ${toFa(pending)} مورد در انتظار تأیید`}
      />
      <Notice text={notice} />

      <div className="mb-4 flex gap-2">
        {(
          [
            { key: "pending", label: "در انتظار تأیید" },
            { key: "approved", label: "منتشرشده" },
            { key: "all", label: "همه" },
          ] as const
        ).map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-3.5 py-1.5 text-[12.5px] transition ${
              filter === f.key ? "border-brand bg-brand text-white" : "border-line bg-white text-ink hover:border-brand"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        {list.map((r) => (
          <article key={r.id} className="rounded-xl border border-line bg-white p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="display-font grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft text-[13px] font-bold text-brand">
                {r.name.slice(0, 1)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold text-ink">{r.name}</span>
                <span className="num block text-[11px] text-muted">
                  {r.productName ?? "—"} · {timeAgo(r.createdAt)}
                </span>
              </span>
              <span className="mr-auto flex items-center gap-3">
                <Stars value={r.rating} size={14} showValue />
                <Badge tone={r.isApproved ? "#0F5132" : "#B26B00"}>{r.isApproved ? "منتشر شده" : "در انتظار"}</Badge>
              </span>
            </div>
            {r.body ? <p className="mt-3 text-[12.5px] leading-7 text-muted">{r.body}</p> : null}
            <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
              {r.isApproved ? (
                <Button type="button" variant="outline" className="h-9 px-3 text-[12px]" onClick={() => act("review:reject", r.id)}>
                  برگرداندن به انتظار
                </Button>
              ) : (
                <Button type="button" className="h-9 px-3 text-[12px]" onClick={() => act("review:approve", r.id)}>
                  <CheckIcon width={14} height={14} />
                  تأیید و انتشار
                </Button>
              )}
              <Button type="button" variant="danger" className="h-9 px-3 text-[12px]" onClick={() => act("review:delete", r.id)}>
                <TrashIcon width={14} height={14} />
                حذف
              </Button>
              <a
                href={`/products/${r.productSlug ?? r.productId}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center rounded-md px-3 text-[12px] text-muted transition hover:text-brand"
              >
                دیدن محصول
              </a>
            </div>
          </article>
        ))}
        {!list.length ? (
          <p className="rounded-xl border border-dashed border-line bg-white px-4 py-10 text-center text-[12.5px] text-muted">
            نقدی در این وضعیت وجود ندارد
          </p>
        ) : null}
      </div>
    </div>
  );
}
