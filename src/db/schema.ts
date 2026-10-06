import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  image: text("image"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  brand: text("brand"),
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
  image: text("image"),
  images: text("images"),
  description: text("description"),
  unit: text("unit").notNull().default("عدد"),
  sizeLabel: text("size_label"),
  sku: text("sku"),
  barcode: text("barcode"),
  price: integer("price").notNull().default(0),
  wholesalePrice: integer("wholesale_price"),
  wholesaleMin: integer("wholesale_min").notNull().default(12),
  discount: integer("discount").notNull().default(0),
  stock: integer("stock").notNull().default(0),
  lowStockAt: integer("low_stock_at").notNull().default(10),
  isPopular: boolean("is_popular").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("customer"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  title: text("title").notNull().default("خانه"),
  zoneId: integer("zone_id"),
  details: text("details").notNull(),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const favorites = pgTable(
  "favorites",
  {
    id: serial("id").primaryKey(),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("favorites_customer_product_idx").on(t.customerId, t.productId)],
);

export const baskets = pgTable("baskets", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("سبد ماهانه"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const basketItems = pgTable("basket_items", {
  id: serial("id").primaryKey(),
  basketId: integer("basket_id")
    .notNull()
    .references(() => baskets.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  qty: integer("qty").notNull().default(1),
});

export const zones = pgTable("zones", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  fee: integer("fee").notNull().default(0),
  minOrder: integer("min_order").notNull().default(0),
  freeOver: integer("free_over").notNull().default(2000),
  eta: text("eta").notNull().default("۲۴ ساعت"),
  isActive: boolean("is_active").notNull().default(true),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  number: text("number").notNull().unique(),
  customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  zoneId: integer("zone_id").references(() => zones.id, { onDelete: "set null" }),
  zoneName: text("zone_name"),
  address: text("address").notNull(),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  delivery: text("delivery").notNull().default("delivery"),
  payment: text("payment").notNull().default("cod"),
  status: text("status").notNull().default("pending"),
  note: text("note"),
  subtotal: integer("subtotal").notNull().default(0),
  discount: integer("discount").notNull().default(0),
  deliveryFee: integer("delivery_fee").notNull().default(0),
  total: integer("total").notNull().default(0),
  couponCode: text("coupon_code"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  sizeLabel: text("size_label"),
  unitPrice: integer("unit_price").notNull(),
  qty: integer("qty").notNull(),
  priceType: text("price_type").notNull().default("retail"),
  lineTotal: integer("line_total").notNull(),
});

export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  percent: integer("percent").notNull().default(0),
  amount: integer("amount").notNull().default(0),
  minOrder: integer("min_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
  orderItemId: integer("order_item_id"),
  name: text("name").notNull(),
  rating: integer("rating").notNull().default(5),
  body: text("body"),
  isApproved: boolean("is_approved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  body: text("body").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Product = typeof products.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Zone = typeof zones.$inferSelect;
