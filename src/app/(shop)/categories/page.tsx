import Link from "next/link";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { Reveal } from "@/components/ui";
import { ArrowLeft } from "@/components/icons";
import { num, toFa } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "دسته‌بندی‌ها | Muslim Store" };

export default async function CategoriesPage() {
  const cats = await db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      image: categories.image,
      count: sql<number>`count(${products.id})::int`,
    })
    .from(categories)
    .leftJoin(products, sql`${products.categoryId} = ${categories.id} and ${products.isActive} = true`)
    .where(eq(categories.isActive, true))
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder));

  const ids = cats.map((c) => c.id);
  const items = ids.length
    ? await db
        .select({
          categoryId: products.categoryId,
          name: products.name,
          slug: products.slug,
          price: products.price,
        })
        .from(products)
        .where(and(inArray(products.categoryId, ids), eq(products.isActive, true)))
        .orderBy(sql`${products.isPopular} desc, ${products.id} asc`)
        .limit(200)
    : [];

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-6 md:py-14">
      <div className="border-b border-line pb-5">
        <h1 className="text-[26px] font-bold text-ink md:text-[32px]">دسته‌بندی‌ها</h1>
        <p className="num mt-1.5 text-[13px] text-muted">
          {toFa(cats.length)} دسته · {toFa(items.length)} محصول فعال
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cats.map((cat, i) => {
          const samples = items.filter((it) => it.categoryId === cat.id).slice(0, 3);
          return (
            <Reveal key={cat.id} delay={i * 50}>
              <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-line bg-white transition duration-200 hover:-translate-y-0.5 hover:border-brand/40">
                <Link href={`/products?cat=${cat.slug}`} className="block aspect-[5/4] overflow-hidden bg-brand-soft">
                  {cat.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cat.image}
                      alt={cat.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : null}
                </Link>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <Link href={`/products?cat=${cat.slug}`} className="text-[15px] font-semibold text-ink transition group-hover:text-brand">
                      {cat.name}
                    </Link>
                    <span className="num text-[11.5px] text-muted">{toFa(cat.count)} محصول</span>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-[12.5px] text-muted">
                    {samples.map((s) => (
                      <li key={s.slug} className="flex items-center justify-between gap-2">
                        <Link href={`/products/${s.slug}`} className="truncate transition hover:text-brand">
                          {s.name}
                        </Link>
                        <span className="num shrink-0">{num(s.price)}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/products?cat=${cat.slug}`}
                    className="mt-4 inline-flex items-center gap-1.5 border-t border-line pt-3 text-[12.5px] font-medium text-brand"
                  >
                    دیدن همه
                    <ArrowLeft width={14} height={14} />
                  </Link>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
