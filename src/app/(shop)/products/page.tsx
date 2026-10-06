import Link from "next/link";
import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { SLIM_COLUMNS } from "@/lib/queries";
import { ProductsView } from "@/components/products-view";
import { SearchIcon } from "@/components/icons";
import { toFa } from "@/lib/format";

export const dynamic = "force-dynamic";

const SORTS = [
  { value: "popular", label: "پرفروش‌ترین" },
  { value: "new", label: "جدیدترین" },
  { value: "cheap", label: "ارزان‌ترین" },
  { value: "expensive", label: "گران‌ترین" },
];

type Params = Promise<{ q?: string; cat?: string; sort?: string }>;

export default async function ProductsPage({ searchParams }: { searchParams: Params }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const cat = (sp.cat ?? "").trim();
  const sort = sp.sort ?? "popular";

  const cats = await db
    .select({ id: categories.id, slug: categories.slug, name: categories.name })
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.sortOrder));

  const conds = [eq(products.isActive, true)];
  if (cat) conds.push(eq(categories.slug, cat));
  if (q) {
    conds.push(
      or(
        ilike(products.name, `%${q}%`),
        ilike(products.brand, `%${q}%`),
        ilike(products.sku, `%${q}%`),
        ilike(products.barcode, `%${q}%`),
        ilike(categories.name, `%${q}%`),
      )!,
    );
  }

  const order =
    sort === "cheap"
      ? [asc(products.price)]
      : sort === "expensive"
        ? [desc(products.price)]
        : sort === "new"
          ? [desc(products.createdAt)]
          : [desc(products.isPopular), desc(products.id)];

  const items = await db
    .select(SLIM_COLUMNS)
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(...conds))
    .orderBy(...order)
    .limit(120);

  const activeCat = cats.find((c) => c.slug === cat);

  const buildHref = (patch: { q?: string; cat?: string; sort?: string }) => {
    const next = { q, cat, sort, ...patch };
    const params = new URLSearchParams();
    if (next.q) params.set("q", next.q);
    if (next.cat) params.set("cat", next.cat);
    if (next.sort && next.sort !== "popular") params.set("sort", next.sort);
    const qs = params.toString();
    return `/products${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-6 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          <h1 className="text-[26px] font-bold text-ink md:text-[32px]">
            {activeCat ? activeCat.name : q ? `نتایج «${q}»` : "همه محصولات"}
          </h1>
          <p className="num mt-1.5 text-[13px] text-muted">{toFa(items.length)} محصول</p>
        </div>
        <form action="/products" method="get" className="relative w-full max-w-xs">
          {cat ? <input type="hidden" name="cat" value={cat} /> : null}
          <SearchIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" width={17} height={17} />
          <input
            name="q"
            defaultValue={q}
            placeholder="جستجو: نام، برند، SKU یا بارکد"
            className="h-11 w-full rounded-md border border-line bg-brand-soft pr-10 pl-3 text-sm outline-none transition focus:border-brand focus:bg-white"
          />
        </form>
      </div>

      <div className="no-bar mt-5 flex gap-2 overflow-x-auto pb-1">
        <Link
          href={buildHref({ cat: "" })}
          className={`shrink-0 rounded-full border px-4 py-2 text-[13px] transition ${
            !cat ? "border-brand bg-brand text-white" : "border-line text-ink hover:border-brand hover:text-brand"
          }`}
        >
          همه
        </Link>
        {cats.map((c) => (
          <Link
            key={c.id}
            href={buildHref({ cat: c.slug })}
            className={`shrink-0 rounded-full border px-4 py-2 text-[13px] transition ${
              cat === c.slug ? "border-brand bg-brand text-white" : "border-line text-ink hover:border-brand hover:text-brand"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {q ? (
        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-[12.5px] text-muted">نتایج برای عبارت «{q}» در نام، برند، SKU و بارکد جستجو شد.</p>
          <Link href={buildHref({ q: "" })} className="shrink-0 text-[12.5px] text-muted transition hover:text-danger">
            پاک کردن جستجو
          </Link>
        </div>
      ) : null}

      <ProductsView items={items} sort={sort} q={q} cat={cat} />
    </div>
  );
}

export async function generateMetadata({ searchParams }: { searchParams: Params }) {
  const sp = await searchParams;
  const suffix = sp.cat ? ` — ${sp.cat}` : sp.q ? ` — ${sp.q}` : "";
  return {
    title: `محصولات${suffix} | Muslim Store`,
    description: "فهرست محصولات خوراکی عمده و پرچون مسلم استور",
  };
}


