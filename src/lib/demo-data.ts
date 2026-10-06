/**
 * Static catalog for DEMO_MODE / no-DATABASE_URL so the shop renders on Vercel.
 */

export type DemoCategory = {
  id: number;
  slug: string;
  name: string;
  image: string | null;
  sortOrder: number;
  isActive: boolean;
  count: number;
};

export type DemoProduct = {
  id: number;
  slug: string;
  name: string;
  brand: string | null;
  categoryId: number;
  categorySlug: string;
  categoryName: string;
  image: string | null;
  images: string | null;
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
  createdAt: Date;
  sold: number;
  rating: number;
  reviewCount: number;
};

export type DemoZone = {
  id: number;
  name: string;
  fee: number;
  minOrder: number;
  freeOver: number;
  eta: string;
  isActive: boolean;
};

const img = (file: string) => `/images/products/${file}`;

const CAT_DEFS = [
  { id: 1, name: "برنج و غلات", slug: "berenj-va-ghallat", image: img("rice.jpg"), sortOrder: 1 },
  { id: 2, name: "روغن", slug: "roghan", image: img("oil.jpg"), sortOrder: 2 },
  { id: 3, name: "آرد", slug: "aard", image: img("flour.jpg"), sortOrder: 3 },
  { id: 4, name: "چای و قهوه", slug: "chai-va-qahwa", image: img("tea.jpg"), sortOrder: 4 },
  { id: 5, name: "لبنیات", slug: "labaniyat", image: img("milk.jpg"), sortOrder: 5 },
  { id: 6, name: "نوشیدنی", slug: "noshidani", image: img("juice.jpg"), sortOrder: 6 },
  { id: 7, name: "خشکبار و زعفران", slug: "khoshkbar", image: img("saffron.jpg"), sortOrder: 7 },
  { id: 8, name: "تنقلات", slug: "tanaqolat", image: img("snacks.jpg"), sortOrder: 8 },
  { id: 9, name: "مواد شوینده", slug: "mavade-shuyanda", image: img("detergent.jpg"), sortOrder: 9 },
] as const;

type P = [
  string, // name
  string, // brand
  string, // catSlug
  string, // image
  string, // sizeLabel
  string, // unit
  number, // price
  number, // wholesale
  number, // wholesaleMin
  number, // stock
  boolean, // popular
  number, // discount
  string, // description
];

const PRODUCT_DEFS: P[] = [
  ["برنج باسمتی هرات ۱۰ کیلو", "هرات", "berenj-va-ghallat", img("rice.jpg"), "۱۰ کیلوگرام", "بوجی", 1280, 1150, 10, 58, true, 0, "برنج باسمتی دانه بلند برند هرات با عطر طبیعی."],
  ["برنج باسمتی الکوزی ۵ کیلو", "الکوزی", "berenj-va-ghallat", img("rice.jpg"), "۵ کیلوگرام", "بوجی", 640, 575, 12, 42, true, 5, "بسته ۵ کیلویی باسمتی الکوزی."],
  ["لوبیا سفید بغلانی ۱ کیلو", "بغلانی", "berenj-va-ghallat", img("beans.jpg"), "۱ کیلوگرام", "کیلو", 135, 118, 20, 70, false, 0, "لوبیای سفید پاک‌شده بغلان."],
  ["ماش سمنگانی ۱ کیلو", "سمنگان", "berenj-va-ghallat", img("beans.jpg"), "۱ کیلوگرام", "کیلو", 145, 126, 20, 55, false, 0, "ماش درشت سمنگان."],
  ["عدس سرخ هرات ۱ کیلو", "صادق‌یار", "berenj-va-ghallat", img("beans.jpg"), "۱ کیلوگرام", "کیلو", 160, 140, 20, 48, false, 0, "حبوبات بسته‌بندی‌شده صادق‌یار فودز."],
  ["روغن آفتاب‌گردان الکوزی ۵ لیتر", "الکوزی", "roghan", img("oil.jpg"), "۵ لیتر", "بوتل", 620, 545, 12, 36, true, 0, "روغن گل‌آفتاب‌پرست خالص الکوزی."],
  ["روغن نباتی شعیب ۵ لیتر", "شعیب", "roghan", img("oil.jpg"), "۵ لیتر", "بوتل", 590, 525, 12, 40, true, 8, "روغن پخت‌وپز شعیب گروپ."],
  ["روغن آفتاب‌گردان بشیر ۱ لیتر", "بشیر", "roghan", img("oil.jpg"), "۱ لیتر", "بوتل", 135, 118, 24, 160, true, 0, "روغن سرخ‌کردنی بشیر."],
  ["روغن کنجد سردپرس افغان‌سوییس ۵۰۰ ملی", "افغان‌سوییس", "roghan", img("oil.jpg"), "۵۰۰ ملی‌لیتر", "بوتل", 420, 380, 12, 22, false, 0, "روغن کنجد سردپرس مزارشریف."],
  ["روغن نباتی شعیب ۱۶ لیتر", "شعیب", "roghan", img("oil.jpg"), "۱۶ لیتر", "بلک", 1820, 1660, 4, 16, false, 0, "بلک ۱۶ لیتری ویژه دکان‌ها."],
  ["آرد گندم بشیر نوید ۵۰ کیلو", "بشیر نوید", "aard", img("flour.jpg"), "۵۰ کیلوگرام", "بوجی", 2250, 2050, 5, 24, true, 0, "آرد درجه یک بشیر نوید."],
  ["آرد گندم سلطانی ۱۰ کیلو", "سلطانی", "aard", img("flour.jpg"), "۱۰ کیلوگرام", "بوجی", 480, 430, 12, 50, false, 0, "آرد سفید خانگی سلطانی."],
  ["آرد ذرت نور ۱ کیلو", "نور", "aard", img("flour.jpg"), "۱ کیلوگرام", "کیلو", 75, 64, 24, 60, false, 0, "آرد ذرت نرم."],
  ["چای سبز الکوزی ۵۰۰ گرام", "الکوزی", "chai-va-qahwa", img("tea.jpg"), "۵۰۰ گرام", "بسته", 280, 248, 12, 70, true, 10, "چای سبز الکوزی."],
  ["چای سیاه الکوزی ۱ کیلو", "الکوزی", "chai-va-qahwa", img("tea.jpg"), "۱ کیلوگرام", "بسته", 390, 350, 12, 55, true, 0, "چای سیاه دانه‌درشت الکوزی."],
  ["چای کیسه‌ای الکوزی ۲۵ عددی", "الکوزی", "chai-va-qahwa", img("tea.jpg"), "۲۵ عدد", "بکس", 145, 128, 20, 110, false, 0, "چای کیسه‌ای آماده دم."],
  ["چای زعفرانی هرات ۱۰۰ گرام", "هرات زعفران", "chai-va-qahwa", img("saffron.jpg"), "۱۰۰ گرام", "قوطی", 320, 290, 12, 28, false, 0, "چای معطر با زعفران افغانی."],
  ["شیر تازه سلطان تازه ۱ لیتر", "سلطان تازه", "labaniyat", img("milk.jpg"), "۱ لیتر", "بوتل", 75, 65, 24, 180, true, 0, "شیر تازه سلطان تازه — مزارشریف."],
  ["ماست غلیظ سلطان تازه ۱ کیلو", "سلطان تازه", "labaniyat", img("yogurt.jpg"), "۱ کیلوگرام", "کاسه", 90, 78, 20, 65, true, 0, "ماست غلیظ سلطان تازه."],
  ["پنیر چنکی سلطان تازه ۵۰۰ گرام", "سلطان تازه", "labaniyat", img("cheese.jpg"), "۵۰۰ گرام", "بسته", 195, 172, 12, 40, false, 0, "پنیر چنکی کم‌نمک."],
  ["دوغ سلطان تازه ۱ لیتر", "سلطان تازه", "labaniyat", img("yogurt.jpg"), "۱ لیتر", "بوتل", 55, 46, 24, 90, false, 0, "دوغ سنتی سلطان تازه."],
  ["شیر پرچرب Hi ۱ لیتر", "Hi Dairies", "labaniyat", img("milk.jpg"), "۱ لیتر", "بوتل", 80, 70, 24, 100, false, 0, "شیر پرچرب برند Hi."],
  ["شیر خشک پامیر ۴۰۰ گرام", "پامیر", "labaniyat", img("milk.jpg"), "۴۰۰ گرام", "قوطی", 380, 345, 12, 35, false, 0, "شیر خشک پرچرب پامیر."],
  ["آب معدنی پامیر ۱.۵ لیتر", "پامیر", "noshidani", img("water.jpg"), "۱.۵ لیتر", "بوتل", 25, 20, 24, 420, true, 0, "آب آشامیدنی پامیر."],
  ["پامیر کولا ۳۳۰ ملی", "پامیر کولا", "noshidani", img("cola.jpg"), "۳۳۰ ملی‌لیتر", "قوطی", 28, 22, 48, 260, true, 0, "نوشابه پامیر کولا."],
  ["آبمیوه انار شفا ۱ لیتر", "شفا", "noshidani", img("juice.jpg"), "۱ لیتر", "بوتل", 120, 105, 24, 70, false, 0, "آبمیوه انار شفا."],
  ["آبمیوه ۴ باغ شعیب ۱ لیتر", "شعیب", "noshidani", img("juice.jpg"), "۱ لیتر", "بوتل", 115, 98, 24, 55, false, 5, "آبمیوه طبیعی ۴ باغ شعیب."],
  ["آب معدنی الکوزی ۱.۵ لیتر", "الکوزی", "noshidani", img("water.jpg"), "۱.۵ لیتر", "بوتل", 28, 22, 24, 300, false, 0, "آب آشامیدنی الکوزی."],
  ["نکتار انبه شفا ۲۰۰ ملی", "شفا", "noshidani", img("juice.jpg"), "۲۰۰ ملی‌لیتر", "پاکت", 35, 28, 48, 200, false, 0, "نکتار انبه شفا."],
  ["زعفران سوپر نگین هرات ۱ گرام", "هرات زعفران", "khoshkbar", img("saffron.jpg"), "۱ گرام", "قوطی", 450, 410, 10, 80, true, 0, "زعفران سوپر نگین هرات."],
  ["زعفران نگین رایان ۱ گرام", "رایان", "khoshkbar", img("saffron.jpg"), "۱ گرام", "قوطی", 420, 385, 10, 60, true, 0, "زعفران نگین رایان هرات."],
  ["کشمش سبز کندهاری ۵۰۰ گرام", "کینگ‌خان", "khoshkbar", img("raisins.jpg"), "۵۰۰ گرام", "بسته", 280, 250, 12, 45, false, 0, "کشمش سبز قندهار."],
  ["بادام افغانی رومی ۵۰۰ گرام", "رومی", "khoshkbar", img("almonds.jpg"), "۵۰۰ گرام", "بسته", 480, 440, 12, 32, true, 0, "بادام بسته‌بندی‌شده رومی."],
  ["انجیر خشک قندهار ۳۰۰ گرام", "کینگ‌خان", "khoshkbar", img("dryfruits.jpg"), "۳۰۰ گرام", "بسته", 260, 235, 12, 38, false, 0, "انجیر خشک آفتابی قندهار."],
  ["هلوای کنجدی صادق‌یار ۴۰۰ گرام", "صادق‌یار", "khoshkbar", img("halva.jpg"), "۴۰۰ گرام", "بسته", 210, 185, 12, 40, false, 0, "هلوای کنجدی صادق‌یار."],
  ["چیپس میوه صادق‌یار ۲۰۰ گرام", "صادق‌یار", "khoshkbar", img("chips.jpg"), "۲۰۰ گرام", "بسته", 180, 158, 12, 50, false, 0, "چیپس میوه خشک‌شده."],
  ["زیره سبز طلای سرخ ۱۰۰ گرام", "طلای سرخ", "khoshkbar", img("saffron.jpg"), "۱۰۰ گرام", "قوطی", 95, 82, 20, 70, false, 0, "زیره سبز افغانی."],
  ["چیپس سیب‌زمینی پامیر ۱۰۰ گرام", "پامیر", "tanaqolat", img("chips.jpg"), "۱۰۰ گرام", "بسته", 45, 38, 48, 220, true, 0, "چیپس سیب‌زمینی پامیر."],
  ["بسکیت چاکلتی شیرین ۱ کیلو", "شیرین", "tanaqolat", img("snacks.jpg"), "۱ کیلوگرام", "بکس", 220, 196, 12, 55, false, 0, "بسکیت چاکلتی فله‌ای."],
  ["بادام و کشمش مخلوط سمنگان ۵۰۰ گرام", "سمنگان", "tanaqolat", img("almonds.jpg"), "۵۰۰ گرام", "بسته", 450, 410, 12, 28, false, 0, "مخلوط بادام و کشمش."],
  ["کیک وانیلی نان سحر ۱۲ عددی", "نان سحر", "tanaqolat", img("snacks.jpg"), "۱۲ عدد", "بکس", 180, 158, 12, 48, false, 0, "کیک تک‌نفره نان سحر."],
  ["پودر لباس‌شویی الکوزی ۳ کیلو", "الکوزی", "mavade-shuyanda", img("detergent.jpg"), "۳ کیلوگرام", "بکس", 310, 275, 12, 50, true, 0, "پودر لباس‌شویی الکوزی."],
  ["دستمال کاغذی الکوزی ۱۷۰ برگ", "الکوزی", "mavade-shuyanda", img("soap.jpg"), "۱۷۰ برگ", "بسته", 85, 72, 24, 120, false, 0, "دستمال کاغذی الکوزی."],
  ["پودر شستشوی بشیر ۹ کیلو", "بشیر", "mavade-shuyanda", img("detergent.jpg"), "۹ کیلوگرام", "بکس", 890, 810, 4, 14, false, 0, "پودر شستشو عمده بشیر."],
  ["مایع ظرفشویی پریل ۱ لیتر", "Pril", "mavade-shuyanda", img("soap.jpg"), "۱ لیتر", "بوتل", 110, 95, 24, 75, false, 0, "مایع ظرفشویی پریل."],
  ["صابون حمام لوکس ۶ عددی", "Lux", "mavade-shuyanda", img("soap.jpg"), "۶ عدد", "بسته", 90, 78, 24, 100, false, 0, "صابون گیاهی لوکس."],
];

const catBySlug = Object.fromEntries(CAT_DEFS.map((c) => [c.slug, c]));

export const DEMO_PRODUCTS: DemoProduct[] = PRODUCT_DEFS.map((row, i) => {
  const [name, brand, catSlug, image, sizeLabel, unit, price, wholesalePrice, wholesaleMin, stock, isPopular, discount, description] = row;
  const cat = catBySlug[catSlug]!;
  const id = 1001 + i;
  return {
    id,
    slug: `p-${id}`,
    name,
    brand,
    categoryId: cat.id,
    categorySlug: cat.slug,
    categoryName: cat.name,
    image,
    images: JSON.stringify([image]),
    description,
    unit,
    sizeLabel,
    sku: `MS-${id}`,
    barcode: `62${String(id).padStart(9, "0")}`,
    price,
    wholesalePrice,
    wholesaleMin,
    discount,
    stock,
    lowStockAt: 10,
    isPopular,
    isActive: true,
    createdAt: new Date(Date.now() - i * 86400000),
    sold: isPopular ? 40 + (i % 30) : 5 + (i % 20),
    rating: 4 + (i % 10) / 10,
    reviewCount: 2 + (i % 8),
  };
});

export const DEMO_CATEGORIES: DemoCategory[] = CAT_DEFS.map((c) => ({
  ...c,
  isActive: true,
  count: DEMO_PRODUCTS.filter((p) => p.categoryId === c.id).length,
}));

export const DEMO_ZONES: DemoZone[] = [
  { id: 1, name: "ناحیه ۱ — مرکز شهر", fee: 60, minOrder: 200, freeOver: 2000, eta: "۲ تا ۴ ساعت", isActive: true },
  { id: 2, name: "ناحیه ۲ — خلم مارکیت", fee: 80, minOrder: 200, freeOver: 2000, eta: "۴ تا ۶ ساعت", isActive: true },
  { id: 3, name: "ناحیه ۳ — کارته شهاب", fee: 100, minOrder: 300, freeOver: 2500, eta: "۶ تا ۸ ساعت", isActive: true },
  { id: 4, name: "ده‌دادی", fee: 150, minOrder: 500, freeOver: 3000, eta: "۱ روز", isActive: true },
  { id: 5, name: "چمتال", fee: 200, minOrder: 800, freeOver: 4000, eta: "۱ روز", isActive: true },
];

export function demoSlim(p: DemoProduct) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    image: p.image,
    unit: p.unit,
    sizeLabel: p.sizeLabel,
    price: p.price,
    wholesalePrice: p.wholesalePrice,
    wholesaleMin: p.wholesaleMin,
    discount: p.discount,
    stock: p.stock,
    sold: p.sold,
    rating: p.rating,
    reviewCount: p.reviewCount,
  };
}
