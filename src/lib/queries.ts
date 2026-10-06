import { sql } from "drizzle-orm";
import { products } from "@/db/schema";

// NOTE: references the outer `products` table literally so the correlated
// sub-query stays unambiguous even when `products` is joined with categories.
export const SOLD_SQL = sql<number>`(
  select coalesce(sum(order_items.qty), 0)::int
  from order_items
  join orders on orders.id = order_items.order_id
  where order_items.product_id = products.id
    and orders.status <> 'cancelled'
)`;

export const RATING_SQL = sql<number>`coalesce(
  (select round(avg(reviews.rating)::numeric, 2)::float from reviews
    where reviews.product_id = products.id and reviews.is_approved = true), 0)`;

export const REVIEW_COUNT_SQL = sql<number>`(
  select count(*)::int from reviews
    where reviews.product_id = products.id and reviews.is_approved = true)`;

export const CARD_COLUMNS = {
  id: products.id,
  slug: products.slug,
  name: products.name,
  brand: products.brand,
  image: products.image,
  images: products.images,
  description: products.description,
  unit: products.unit,
  sizeLabel: products.sizeLabel,
  sku: products.sku,
  barcode: products.barcode,
  price: products.price,
  wholesalePrice: products.wholesalePrice,
  wholesaleMin: products.wholesaleMin,
  discount: products.discount,
  stock: products.stock,
  lowStockAt: products.lowStockAt,
  isPopular: products.isPopular,
  isActive: products.isActive,
  createdAt: products.createdAt,
  sold: SOLD_SQL,
  rating: RATING_SQL,
  reviewCount: REVIEW_COUNT_SQL,
};

export const SLIM_COLUMNS = {
  id: products.id,
  slug: products.slug,
  name: products.name,
  brand: products.brand,
  image: products.image,
  unit: products.unit,
  sizeLabel: products.sizeLabel,
  price: products.price,
  wholesalePrice: products.wholesalePrice,
  wholesaleMin: products.wholesaleMin,
  discount: products.discount,
  stock: products.stock,
  sold: SOLD_SQL,
  rating: RATING_SQL,
  reviewCount: REVIEW_COUNT_SQL,
};
