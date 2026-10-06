import { asc, desc, eq, ilike, or, sql, and } from "drizzle-orm";
import { isDemoMode } from "@/lib/demo";
import {
  DEMO_CATEGORIES,
  DEMO_PRODUCTS,
  DEMO_ZONES,
  demoSlim,
  type DemoProduct,
} from "@/lib/demo-data";

async function liveDb() {
  const { db } = await import("@/db");
  const schema = await import("@/db/schema");
  const { CARD_COLUMNS, SLIM_COLUMNS } = await import("@/lib/queries");
  return { db, ...schema, CARD_COLUMNS, SLIM_COLUMNS };
}

export async function listCategories() {
  if (isDemoMode()) return DEMO_CATEGORIES;
  const { db, categories, products } = await liveDb();
  return db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      image: categories.image,
      sortOrder: categories.sortOrder,
      isActive: categories.isActive,
      count: sql<number>`count(${products.id})::int`,
    })
    .from(categories)
    .leftJoin(products, sql`${products.categoryId} = ${categories.id} and ${products.isActive} = true`)
    .where(eq(categories.isActive, true))
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder));
}

export async function listZones() {
  if (isDemoMode()) return DEMO_ZONES.filter((z) => z.isActive);
  const { db, zones } = await liveDb();
  return db.select().from(zones).where(eq(zones.isActive, true)).orderBy(asc(zones.id));
}

type ProductQuery = {
  q?: string;
  cat?: string;
  slug?: string;
  sort?: string;
  limit?: number;
  popular?: boolean;
  deals?: boolean;
  wholesale?: boolean;
  all?: boolean;
};

function filterDemo(opts: ProductQuery): DemoProduct[] {
  let rows = DEMO_PRODUCTS.filter((p) => p.isActive || opts.all);
  if (opts.slug) rows = rows.filter((p) => p.slug === opts.slug);
  if (opts.cat) rows = rows.filter((p) => p.categorySlug === opts.cat);
  if (opts.popular) rows = rows.filter((p) => p.isPopular);
  if (opts.deals) rows = rows.filter((p) => p.discount > 0 && p.stock > 0);
  if (opts.wholesale) rows = rows.filter((p) => p.wholesalePrice != null);
  if (opts.q) {
    const q = opts.q.toLowerCase();
    rows = rows.filter(
      (p) =>
        p.name.includes(opts.q!) ||
        (p.brand ?? "").includes(opts.q!) ||
        (p.sku ?? "").toLowerCase().includes(q) ||
        p.categoryName.includes(opts.q!),
    );
  }
  const sort = opts.sort ?? "popular";
  rows = [...rows].sort((a, b) => {
    if (sort === "cheap") return a.price - b.price;
    if (sort === "expensive") return b.price - a.price;
    if (sort === "new") return b.createdAt.getTime() - a.createdAt.getTime();
    return Number(b.isPopular) - Number(a.isPopular) || b.sold - a.sold;
  });
  if (opts.wholesale) rows.sort((a, b) => a.wholesaleMin - b.wholesaleMin);
  if (opts.deals) rows.sort((a, b) => b.discount - a.discount);
  if (opts.popular) rows.sort((a, b) => b.sold - a.sold);
  return rows.slice(0, opts.limit ?? 48);
}

export async function listProducts(opts: ProductQuery = {}) {
  if (isDemoMode()) {
    return filterDemo(opts).map((p) => ({
      ...demoSlim(p),
      categoryId: p.categoryId,
      categorySlug: p.categorySlug,
      categoryName: p.categoryName,
      images: p.images,
      description: p.description,
      sku: p.sku,
      barcode: p.barcode,
      lowStockAt: p.lowStockAt,
      isPopular: p.isPopular,
      isActive: p.isActive,
      createdAt: p.createdAt,
    }));
  }

  const { db, products, categories, CARD_COLUMNS, SLIM_COLUMNS } = await liveDb();
  const limit = Math.min(opts.limit ?? 48, 100);
  const conds = [];
  if (!opts.all) conds.push(eq(products.isActive, true));
  if (opts.slug) conds.push(eq(products.slug, opts.slug));
  if (opts.cat) conds.push(eq(categories.slug, opts.cat));
  if (opts.popular) conds.push(eq(products.isPopular, true));
  if (opts.deals) conds.push(sql`${products.discount} > 0 and ${products.stock} > 0`);
  if (opts.wholesale) conds.push(sql`${products.wholesalePrice} is not null`);
  if (opts.q) {
    const q = opts.q.trim();
    conds.push(
      or(
        ilike(products.name, `%${q}%`),
        ilike(products.brand, `%${q}%`),
        ilike(products.sku, `%${q}%`),
        ilike(categories.name, `%${q}%`),
      )!,
    );
  }

  const sort = opts.sort ?? "popular";
  const order =
    opts.wholesale
      ? [asc(products.wholesaleMin)]
      : opts.deals
        ? [desc(products.discount)]
        : opts.popular
          ? [desc(CARD_COLUMNS.sold)]
          : sort === "cheap"
            ? [asc(products.price)]
            : sort === "expensive"
              ? [desc(products.price)]
              : sort === "new"
                ? [desc(products.createdAt)]
                : [desc(products.isPopular), desc(products.id)];

  return db
    .select({
      ...SLIM_COLUMNS,
      categoryId: products.categoryId,
      categorySlug: categories.slug,
      categoryName: categories.name,
      images: products.images,
      description: products.description,
      sku: products.sku,
      barcode: products.barcode,
      lowStockAt: products.lowStockAt,
      isPopular: products.isPopular,
      isActive: products.isActive,
      createdAt: products.createdAt,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(...order)
    .limit(limit);
}

export async function getProductBySlug(slug: string) {
  const items = await listProducts({ slug, limit: 1, all: true });
  return items[0] ?? null;
}

export async function getHomeBundles() {
  if (isDemoMode()) {
    const cats = DEMO_CATEGORIES;
    const popular = filterDemo({ popular: true, limit: 14 }).map(demoSlim);
    const deals = filterDemo({ deals: true, limit: 12 }).map(demoSlim);
    const wholesale = filterDemo({ wholesale: true, limit: 12 }).map(demoSlim);
    const newest = filterDemo({ sort: "new", limit: 12 }).map(demoSlim);
    const zoneRows = DEMO_ZONES.filter((z) => z.isActive);
    const totals = [{ products: DEMO_PRODUCTS.length, delivered: 48, soldUnits: 920 }];
    return { cats, popular, deals, wholesale, newest, zoneRows, totals };
  }

  const { db, categories, products, zones, CARD_COLUMNS, SLIM_COLUMNS } = await liveDb();
  const [cats, popular, deals, wholesale, newest, zoneRows, totals] = await Promise.all([
    db
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
      .orderBy(asc(categories.sortOrder)),
    db
      .select(SLIM_COLUMNS)
      .from(products)
      .where(sql`${products.isActive} = true and ${products.isPopular} = true`)
      .orderBy(desc(CARD_COLUMNS.sold))
      .limit(14),
    db
      .select(SLIM_COLUMNS)
      .from(products)
      .where(sql`${products.isActive} = true and ${products.discount} > 0 and ${products.stock} > 0`)
      .orderBy(desc(products.discount))
      .limit(12),
    db
      .select(SLIM_COLUMNS)
      .from(products)
      .where(sql`${products.isActive} = true and ${products.wholesalePrice} is not null`)
      .orderBy(asc(products.wholesaleMin))
      .limit(12),
    db
      .select(SLIM_COLUMNS)
      .from(products)
      .where(sql`${products.isActive} = true`)
      .orderBy(desc(products.createdAt), desc(products.id))
      .limit(12),
    db.select().from(zones).where(eq(zones.isActive, true)).orderBy(asc(zones.id)),
    db
      .select({
        products: sql<number>`(select count(*)::int from products where is_active = true)`,
        delivered: sql<number>`(select count(*)::int from orders where status = 'delivered')`,
        soldUnits: sql<number>`(select coalesce(sum(order_items.qty),0)::int from order_items)`,
      })
      .from(products)
      .limit(1),
  ]);
  return { cats, popular, deals, wholesale, newest, zoneRows, totals };
}

export async function listProductReviews(productId: number) {
  if (isDemoMode()) {
    return [
      {
        id: 1,
        name: "احمد ولي",
        rating: 5,
        body: "کیفیت عالی و تحویل به‌موقع بود.",
        createdAt: new Date(),
        isApproved: true,
      },
    ];
  }
  const { db, reviews } = await liveDb();
  return db
    .select({
      id: reviews.id,
      name: reviews.name,
      rating: reviews.rating,
      body: reviews.body,
      createdAt: reviews.createdAt,
      isApproved: reviews.isApproved,
    })
    .from(reviews)
    .where(sql`${reviews.productId} = ${productId} and ${reviews.isApproved} = true`)
    .orderBy(desc(reviews.id))
    .limit(20);
}
