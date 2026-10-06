import Link from "next/link";
import { listCategories, listProducts } from "@/lib/store-data";
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

  const [cats, items] = await Promise.all([
    listCategories(),
    listProducts({ q: q || undefined, cat: cat || undefined, sort, limit: 120 }),
  ]);

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
        <form action="/products" className="flex h-11 w-full max-w-sm overflow-hidden rounded-lg border border-line bg-white sm:w-auto">
          <input
            name="q"
            defaultValue={q}
            placeholder="جستجو…"
            className="min-w-0 flex-1 px-3 text-[13px] outline-none"
          />
          {cat ? <input type="hidden" name="cat" value={cat} /> : null}
          <button type="submit" className="grid w-11 place-items-center bg-brand text-white">
            <SearchIcon width={18} height={18} />
          </button>
        </form>
      </div>

      <div className="no-bar mt-5 flex gap-2 overflow-x-auto pb-1">
        <Link
          href={buildHref({ cat: "" })}
          className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[12.5px] ${!cat ? "border-brand bg-brand text-white" : "border-line bg-white text-ink"}`}
        >
          همه
        </Link>
        {cats.map((c) => (
          <Link
            key={c.id}
            href={buildHref({ cat: c.slug })}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[12.5px] ${cat === c.slug ? "border-brand bg-brand text-white" : "border-line bg-white text-ink"}`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {SORTS.map((s) => (
          <Link
            key={s.value}
            href={buildHref({ sort: s.value })}
            className={`rounded-md border px-3 py-1.5 text-[12px] ${sort === s.value ? "border-brand text-brand" : "border-line text-muted"}`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <ProductsView items={items} sort={sort} q={q} cat={cat} />
      </div>
    </div>
  );
}
