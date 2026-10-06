import "dotenv/config";
import pg from "pg";
import { randomBytes, scryptSync } from "node:crypto";
import { EXTRA_CATS, EXTRA_PRODUCTS } from "./catalog.mjs";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const hash = (pw) => {
  const salt = randomBytes(12).toString("hex");
  return `${salt}:${scryptSync(pw, salt, 32).toString("hex")}`;
};

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@muslimstore.af";
const randomPw = () => `Ms${randomBytes(7).toString("base64url")}!${Math.floor(100 + Math.random() * 900)}`;
const adminPassword = process.env.ADMIN_PASSWORD || randomPw();
const demoPassword = process.env.DEMO_CUSTOMER_PASSWORD || randomPw();
const usedEnvAdmin = Boolean(process.env.ADMIN_PASSWORD);
const usedEnvDemo = Boolean(process.env.DEMO_CUSTOMER_PASSWORD);

const img = (file) => `/images/products/${file}`;

const SETTINGS = {
  siteName: "Muslim Store",
  city: "مزارشریف",
  phone: "+93 700 123 456",
  whatsapp: "+93 700 123 456",
  email: "info@muslimstore.af",
  address: "مزارشریف، چهارراهی حاجی کامران، سرک اول",
  workingHours: "شنبه تا پنجشنبه — ۸:۰۰ صبح تا ۸:۰۰ شب",
  freeDeliveryThreshold: "2000",
  defaultDeliveryFee: "80",
  defaultZoneEta: "۲۴ ساعت",
  codEnabled: "true",
  bankEnabled: "true",
  onlineEnabled: "true",
  cardEnabled: "false",
  bankName: "Afghanistan International Bank",
  bankAccount: "1234-5678-9012",
  bankHolder: "Muslim Store Trading Co.",
  pickupAddress: "مزارشریف، چهارراهی حاجی کامران — انبار مسلم استور",
  adminEmail: "admin@muslimstore.af",
};

const CATS = [
  ["برنج و غلات", "berenj-va-ghallat", img("rice.jpg"), 1],
  ["روغن", "roghan", img("oil.jpg"), 2],
  ["آرد", "aard", img("flour.jpg"), 3],
  ["چای و قهوه", "chai-va-qahwa", img("tea.jpg"), 4],
  ["لبنیات", "labaniyat", img("milk.jpg"), 5],
  ["نوشیدنی", "noshidani", img("juice.jpg"), 6],
  ["خشکبار و زعفران", "khoshkbar", img("saffron.jpg"), 7],
  ["تنقلات", "tanaqolat", img("snacks.jpg"), 8],
  ["مواد شوینده", "mavade-shuyanda", img("detergent.jpg"), 9],
  // appended last so existing sortOrder / indexes stay stable
  ...EXTRA_CATS,
];

/** Authentic Afghan / locally distributed brands from public brand catalogs */
const PRODUCTS = [
  // برنج و غلات
  ["برنج باسمتی هرات ۱۰ کیلو", "هرات", "berenj-va-ghallat", img("rice.jpg"), "۱۰ کیلوگرام", "بوجی", 1280, 1150, 10, 58, true, 0,
    "برنج باسمتی دانه بلند برند هرات (طلای سرخ)، عطر طبیعی و قدکشنده؛ بسته‌بندی کارخانه‌ای مناسب خانه و دکان."],
  ["برنج باسمتی الکوزی ۵ کیلو", "الکوزی", "berenj-va-ghallat", img("rice.jpg"), "۵ کیلوگرام", "بوجی", 640, 575, 12, 42, true, 5,
    "بسته ۵ کیلویی باسمتی الکوزی برای خانواده‌های کم‌جمعیت با کیفیت ثابت بازار افغانستان."],
  ["لوبیا سفید بغلانی ۱ کیلو", "بغلانی", "berenj-va-ghallat", img("beans.jpg"), "۱ کیلوگرام", "کیلو", 135, 118, 20, 70, false, 0,
    "لوبیای سفید پاک‌شده بغلان، یکدست و بدون سنگریزه؛ مناسب آش و خورشت."],
  ["ماش سمنگانی ۱ کیلو", "سمنگان", "berenj-va-ghallat", img("beans.jpg"), "۱ کیلوگرام", "کیلو", 145, 126, 20, 55, false, 0,
    "ماش درشت سمنگان، تازه و مناسب کچری و آش محلی."],
  ["عدس سرخ هرات ۱ کیلو", "صادق‌یار", "berenj-va-ghallat", img("beans.jpg"), "۱ کیلوگرام", "کیلو", 160, 140, 20, 48, false, 0,
    "حبوبات بسته‌بندی‌شده صادق‌یار فودز (هرات) با استاندارد بهداشتی و پاک‌سازی دقیق."],

  // روغن — الکوزی، شعیب، بشیر
  ["روغن آفتاب‌گردان الکوزی ۵ لیتر", "الکوزی", "roghan", img("oil.jpg"), "۵ لیتر", "بوتل", 620, 545, 12, 36, true, 0,
    "روغن گل‌آفتاب‌پرست خالص الکوزی با ویتامین E؛ بوتل پلمپ کارخانه‌ای و پرفروش در سراسر افغانستان."],
  ["روغن نباتی شعیب ۵ لیتر", "شعیب", "roghan", img("oil.jpg"), "۵ لیتر", "بوتل", 590, 525, 12, 40, true, 8,
    "روغن پخت‌وپز شعیب گروپ — برند شناخته‌شده افغانستانی با توزیع سراسری از کابل تا مزار."],
  ["روغن آفتاب‌گردان بشیر ۱ لیتر", "بشیر", "roghan", img("oil.jpg"), "۱ لیتر", "بوتل", 135, 118, 24, 160, true, 0,
    "روغن سرخ‌کردنی و پخت‌وپز بشیر؛ بدون کلسترول و مناسب مصرف روزانه خانه."],
  ["روغن کنجد سردپرس افغان‌سوییس ۵۰۰ ملی", "افغان‌سوییس", "roghan", img("oil.jpg"), "۵۰۰ ملی‌لیتر", "بوتل", 420, 380, 12, 22, false, 0,
    "روغن کنجد سردپرس افغان‌سوییس فودز (مزارشریف)؛ طعم طبیعی برای سالاد و پخت سبک."],
  ["روغن نباتی شعیب ۱۶ لیتر", "شعیب", "roghan", img("oil.jpg"), "۱۶ لیتر", "بلک", 1820, 1660, 4, 16, false, 0,
    "بلک ۱۶ لیتری روغن نباتی شعیب ویژه دکان‌ها، نانوایی‌ها و رستوران‌ها."],

  // آرد
  ["آرد گندم بشیر نوید ۵۰ کیلو", "بشیر نوید", "aard", img("flour.jpg"), "۵۰ کیلوگرام", "بوجی", 2250, 2050, 5, 24, true, 0,
    "آرد درجه یک بشیر نوید از گندم قزاقی؛ قوت بالا برای نانوایی و نان خانگی."],
  ["آرد گندم سلطانی ۱۰ کیلو", "سلطانی", "aard", img("flour.jpg"), "۱۰ کیلوگرام", "بوجی", 480, 430, 12, 50, false, 0,
    "آرد سفید خانگی سلطانی مناسب نان تافتون، نان روغنی و شیرینی."],
  ["آرد ذرت نور ۱ کیلو", "نور", "aard", img("flour.jpg"), "۱ کیلوگرام", "کیلو", 75, 64, 24, 60, false, 0,
    "آرد ذرت نرم برای سوپ، حلوا و پخت‌وپز خانگی."],

  // چای — الکوزی
  ["چای سبز الکوزی ۵۰۰ گرام", "الکوزی", "chai-va-qahwa", img("tea.jpg"), "۵۰۰ گرام", "بسته", 280, 248, 12, 70, true, 10,
    "چای سبز الکوزی — یکی از محبوب‌ترین برندهای چای در بازار افغانستان با عطر ملایم و بسته‌بندی ضد رطوبت."],
  ["چای سیاه الکوزی ۱ کیلو", "الکوزی", "chai-va-qahwa", img("tea.jpg"), "۱ کیلوگرام", "بسته", 390, 350, 12, 55, true, 0,
    "چای سیاه دانه‌درشت الکوزی با رنگ‌دهی بالا؛ مناسب دفتر، دکان و مهمانی."],
  ["چای کیسه‌ای الکوزی ۲۵ عددی", "الکوزی", "chai-va-qahwa", img("tea.jpg"), "۲۵ عدد", "بکس", 145, 128, 20, 110, false, 0,
    "چای کیسه‌ای آماده دم الکوزی برای مصرف سریع در خانه و محل کار."],
  ["چای زعفرانی هرات ۱۰۰ گرام", "هرات زعفران", "chai-va-qahwa", img("saffron.jpg"), "۱۰۰ گرام", "قوطی", 320, 290, 12, 28, false, 0,
    "چای معطر با زعفران افغانی برند هرات؛ طعم اصیل و عطر طلایی."],

  // لبنیات — سلطان تازه (مزار) و Hi / پامیر
  ["شیر تازه سلطان تازه ۱ لیتر", "سلطان تازه", "labaniyat", img("milk.jpg"), "۱ لیتر", "بوتل", 75, 65, 24, 180, true, 0,
    "شیر تازه پاستوریزه سلطان تازه — تولید مزارشریف، توزیع روزانه در بیش از ۲۵۰۰ دکان شمال."],
  ["ماست غلیظ سلطان تازه ۱ کیلو", "سلطان تازه", "labaniyat", img("yogurt.jpg"), "۱ کیلوگرام", "کاسه", 90, 78, 20, 65, true, 0,
    "ماست تازه و غلیظ سلطان تازه از شیر محلی مزار؛ بدون نگهدارنده مصنوعی."],
  ["پنیر چنکی سلطان تازه ۵۰۰ گرام", "سلطان تازه", "labaniyat", img("cheese.jpg"), "۵۰۰ گرام", "بسته", 195, 172, 12, 40, false, 0,
    "پنیر چنکی کم‌نمک سلطان تازه؛ مناسب صبحانه افغانی."],
  ["دوغ سلطان تازه ۱ لیتر", "سلطان تازه", "labaniyat", img("yogurt.jpg"), "۱ لیتر", "بوتل", 55, 46, 24, 90, false, 0,
    "دوغ سنتی سلطان تازه با طعم ملایم؛ مناسب سفره و مهمانی."],
  ["شیر پرچرب Hi ۱ لیتر", "Hi Dairies", "labaniyat", img("milk.jpg"), "۱ لیتر", "بوتل", 80, 70, 24, 100, false, 0,
    "شیر پرچرب برند Hi از گروه پامیر کولا؛ بسته‌بندی بهداشتی و تاریخ تازه."],
  ["شیر خشک پامیر ۴۰۰ گرام", "پامیر", "labaniyat", img("milk.jpg"), "۴۰۰ گرام", "قوطی", 380, 345, 12, 35, false, 0,
    "شیر خشک پرچرب پامیر برای چای، شیرینی و مصارف خانگی."],

  // نوشیدنی — پامیر کولا، شفا، شعیب، الکوزی
  ["آب معدنی پامیر ۱.۵ لیتر", "پامیر", "noshidani", img("water.jpg"), "۱.۵ لیتر", "بوتل", 25, 20, 24, 420, true, 0,
    "آب آشامیدنی تصفیه‌شده پامیر با املاح متعادل؛ مناسب خانه، دفتر و بوفه."],
  ["پامیر کولا ۳۳۰ ملی", "پامیر کولا", "noshidani", img("cola.jpg"), "۳۳۰ ملی‌لیتر", "قوطی", 28, 22, 48, 260, true, 0,
    "نوشابه پامیر کولا — تولید داخلی افغانستان با طعم کلاسیک."],
  ["آبمیوه انار شفا ۱ لیتر", "شفا", "noshidani", img("juice.jpg"), "۱ لیتر", "بوتل", 120, 105, 24, 70, false, 0,
    "آبمیوه انار شفا از گروه پامیر کولا؛ طعم طبیعی میوه افغانی."],
  ["آبمیوه ۴ باغ شعیب ۱ لیتر", "شعیب", "noshidani", img("juice.jpg"), "۱ لیتر", "بوتل", 115, 98, 24, 55, false, 5,
    "آبمیوه طبیعی ۴ باغ شعیب — بدون افزودنی مصنوعی، تولید کارخانه پل‌چرخی."],
  ["آب معدنی الکوزی ۱.۵ لیتر", "الکوزی", "noshidani", img("water.jpg"), "۱.۵ لیتر", "بوتل", 28, 22, 24, 300, false, 0,
    "آب آشامیدنی الکوزی با فرایند تصفیه چندمرحله‌ای و بسته‌بندی پلمپ."],
  ["نکتار انبه شفا ۲۰۰ ملی", "شفا", "noshidani", img("juice.jpg"), "۲۰۰ ملی‌لیتر", "پاکت", 35, 28, 48, 200, false, 0,
    "نکتار انبه شفا بسته تک‌نفره؛ مناسب مکتب، بوفه و سفر."],

  // خشکبار و زعفران — هرات، صادق‌یار، رومی، طلای سرخ
  ["زعفران سوپر نگین هرات ۱ گرام", "هرات زعفران", "khoshkbar", img("saffron.jpg"), "۱ گرام", "قوطی", 450, 410, 10, 80, true, 0,
    "زعفران سوپر نگین برند هرات زعفران (طلای سرخ) با گواهی ISO و دست‌چین هرات."],
  ["زعفران نگین رایان ۱ گرام", "رایان", "khoshkbar", img("saffron.jpg"), "۱ گرام", "قوطی", 420, 385, 10, 60, true, 0,
    "زعفران نگین رایان هرات — برند ثبت‌شده با آزمایش آزمایشگاهی و بسته‌بندی صادراتی."],
  ["کشمش سبز کندهاری ۵۰۰ گرام", "کینگ‌خان", "khoshkbar", img("raisins.jpg"), "۵۰۰ گرام", "بسته", 280, 250, 12, 45, false, 0,
    "کشمش سبز درجه یک قندهار از کینگ‌خان؛ شیرین طبیعی و بدون افزودنی."],
  ["بادام افغانی رومی ۵۰۰ گرام", "رومی", "khoshkbar", img("almonds.jpg"), "۵۰۰ گرام", "بسته", 480, 440, 12, 32, true, 0,
    "بادام بسته‌بندی‌شده رومی — خشکبار ارگانیک افغانی از کشاورزان محلی."],
  ["انجیر خشک قندهار ۳۰۰ گرام", "کینگ‌خان", "khoshkbar", img("dryfruits.jpg"), "۳۰۰ گرام", "بسته", 260, 235, 12, 38, false, 0,
    "انجیر خشک آفتابی قندهار؛ نرم، شیرین و مناسب پذیرایی."],
  ["هلوای کنجدی صادق‌یار ۴۰۰ گرام", "صادق‌یار", "khoshkbar", img("halva.jpg"), "۴۰۰ گرام", "بسته", 210, 185, 12, 40, false, 0,
    "هلوای کنجدی سنتی صادق‌یار فودز هرات — تولید زنان‌محور با استاندارد بهداشتی."],
  ["چیپس میوه صادق‌یار ۲۰۰ گرام", "صادق‌یار", "khoshkbar", img("chips.jpg"), "۲۰۰ گرام", "بسته", 180, 158, 12, 50, false, 0,
    "چیپس میوه خشک‌شده صادق‌یار؛ میان‌وعده سالم بدون روغن سرخ‌کردنی."],
  ["زیره سبز طلای سرخ ۱۰۰ گرام", "طلای سرخ", "khoshkbar", img("saffron.jpg"), "۱۰۰ گرام", "قوطی", 95, 82, 20, 70, false, 0,
    "زیره سبز افغانی برند طلای سرخ؛ عطر قوی برای پلو و خورشت."],

  // تنقلات
  ["چیپس سیب‌زمینی پامیر ۱۰۰ گرام", "پامیر", "tanaqolat", img("chips.jpg"), "۱۰۰ گرام", "بسته", 45, 38, 48, 220, true, 0,
    "چیپس سیب‌زمینی پامیر با طعم‌های متنوع؛ تولید داخلی افغانستان."],
  ["بسکیت چاکلتی شیرین ۱ کیلو", "شیرین", "tanaqolat", img("snacks.jpg"), "۱ کیلوگرام", "بکس", 220, 196, 12, 55, false, 0,
    "بسکیت چاکلتی فله‌ای تازه و ترد؛ مناسب دکان و مهمانی."],
  ["بادام و کشمش مخلوط سمنگان ۵۰۰ گرام", "سمنگان", "tanaqolat", img("almonds.jpg"), "۵۰۰ گرام", "بسته", 450, 410, 12, 28, false, 0,
    "مخلوط مغز بادام و کشمش سبز درجه یک سمنگان با بسته‌بندی بهداشتی."],
  ["کیک وانیلی نان سحر ۱۲ عددی", "نان سحر", "tanaqolat", img("snacks.jpg"), "۱۲ عدد", "بکس", 180, 158, 12, 48, false, 0,
    "کیک بسته‌بندی تک‌نفره نان سحر با طعم وانیل."],

  // شوینده — الکوزی + برندهای رایج
  ["پودر لباس‌شویی الکوزی ۳ کیلو", "الکوزی", "mavade-shuyanda", img("detergent.jpg"), "۳ کیلوگرام", "بکس", 310, 275, 12, 50, true, 0,
    "پودر ماشین‌لباسشویی الکوزی با کف کنترل‌شده و قدرت لکه‌بری بالا."],
  ["دستمال کاغذی الکوزی ۱۷۰ برگ", "الکوزی", "mavade-shuyanda", img("soap.jpg"), "۱۷۰ برگ", "بسته", 85, 72, 24, 120, false, 0,
    "دستمال کاغذی دو‌رویه نرم الکوزی؛ پرفروش در فروشگاه‌های افغانستان."],
  ["پودر شستشوی بشیر ۹ کیلو", "بشیر", "mavade-shuyanda", img("detergent.jpg"), "۹ کیلوگرام", "بکس", 890, 810, 4, 14, false, 0,
    "بسته بزرگ پودر شستشو بشیر ویژه مصرف عمده و قالون‌شویی."],
  ["مایع ظرفشویی پریل ۱ لیتر", "Pril", "mavade-shuyanda", img("soap.jpg"), "۱ لیتر", "بوتل", 110, 95, 24, 75, false, 0,
    "مایع ظرفشویی پریل با عطر لیمو و چربی‌زدایی قوی."],
  ["صابون حمام لوکس ۶ عددی", "Lux", "mavade-shuyanda", img("soap.jpg"), "۶ عدد", "بسته", 90, 78, 24, 100, false, 0,
    "صابون گیاهی ملایم لوکس برای مصرف روزانه خانواده."],

  // ── برندهای افغانی تازه (هری دونیا، زیبا، سلطان تازه، چوپان، بابار و …) ──
  // IMPORTANT: keep these at the END — orderPlan/basket items below are indexed
  // positionally against the original list.
  ...EXTRA_PRODUCTS,
];

const ZONES = [
  ["ناحیه ۱ — مرکز شهر", 60, 200, 2000, "۲ تا ۴ ساعت", true],
  ["ناحیه ۲ — خلم مارکیت", 80, 200, 2000, "۴ تا ۶ ساعت", true],
  ["ناحیه ۳ — کارته شهاب", 100, 300, 2500, "۶ تا ۸ ساعت", true],
  ["ده‌دادی", 150, 500, 3000, "۱ روز", true],
  ["چمتال", 200, 800, 4000, "۱ روز", true],
  ["شورتپه", 250, 1000, 5000, "۱ تا ۲ روز", false],
];

const COUPONS = [
  ["RAMAZAN10", 10, 0, 1500, true],
  ["WELCOME", 0, 100, 500, true],
  ["AFGHAN15", 15, 0, 2500, true],
];

const MAZAR = { lat: 36.7069, lng: 67.1147 };

async function main() {
  const client = await pool.connect();
  try {
    await client.query(`TRUNCATE reviews, order_items, orders, basket_items, baskets, addresses, favorites,
      messages, coupons, zones, products, categories, customers, settings RESTART IDENTITY CASCADE`);

    for (const [key, value] of Object.entries(SETTINGS)) {
      await client.query(`INSERT INTO settings (key, value) VALUES ($1, $2)`, [key, value]);
    }

    const catIds = {};
    for (const [name, slug, image, sortOrder] of CATS) {
      const { rows } = await client.query(
        `INSERT INTO categories (name, slug, image, sort_order, is_active) VALUES ($1,$2,$3,$4,true) RETURNING id`,
        [name, slug, image, sortOrder],
      );
      catIds[slug] = rows[0].id;
    }

    const productBySlug = {};
    let skuSeq = 1001;
    for (const [name, brand, cat, image, sizeLabel, unit, price, wp, wmin, stock, popular, discount, description] of PRODUCTS) {
      const slug = `p-${skuSeq}`;
      const sku = `MS-${skuSeq}`;
      const barcode = `62${String(skuSeq).padStart(9, "0")}`;
      const { rows } = await client.query(
        `INSERT INTO products (slug, name, brand, category_id, image, description, unit, size_label, sku, barcode,
          price, wholesale_price, wholesale_min, discount, stock, low_stock_at, is_popular, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,10,$16,true) RETURNING id, price, wholesale_price, wholesale_min, discount, name, size_label`,
        [slug, name, brand, catIds[cat], image, description, unit, sizeLabel, sku, barcode, price, wp, wmin, discount, stock, popular],
      );
      productBySlug[slug] = rows[0];
      skuSeq += 1;
    }

    const zoneIds = [];
    for (const [name, fee, minOrder, freeOver, eta, active] of ZONES) {
      const { rows } = await client.query(
        `INSERT INTO zones (name, fee, min_order, free_over, eta, is_active) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [name, fee, minOrder, freeOver, eta, active],
      );
      zoneIds.push(rows[0].id);
    }

    for (const [code, percent, amount, minOrder, active] of COUPONS) {
      await client.query(
        `INSERT INTO coupons (code, percent, amount, min_order, is_active) VALUES ($1,$2,$3,$4,$5)`,
        [code, percent, amount, minOrder, active],
      );
    }

    const { rows: adminRows } = await client.query(
      `INSERT INTO customers (name, email, phone, password_hash, role) VALUES ($1,$2,$3,$4,'admin') RETURNING id`,
      ["ادمین مسلم استور", ADMIN_EMAIL, "+93 700 000 111", hash(adminPassword)],
    );
    const adminId = adminRows[0].id;

    const { rows: custRows } = await client.query(
      `INSERT INTO customers (name, email, phone, password_hash, role) VALUES ($1,$2,$3,$4,'customer') RETURNING id`,
      ["احمد رضایی", "ahmad@muslimstore.af", "+93 700 111 2233", hash(demoPassword)],
    );
    const customerId = custRows[0].id;

    const { rows: shopRows } = await client.query(
      `INSERT INTO customers (name, email, phone, password_hash, role) VALUES ($1,$2,$3,$4,'customer') RETURNING id`,
      ["دکان رحیمی", "rahimi@muslimstore.af", "+93 700 555 7788", hash(demoPassword)],
    );
    const shopId = shopRows[0].id;

    await client.query(
      `INSERT INTO addresses (customer_id, title, zone_id, details, lat, lng, is_default) VALUES ($1,$2,$3,$4,$5,$6,true)`,
      [customerId, "خانه", zoneIds[0], "مزارشریف، ناحیه ۱، کارته شهاب، سرک دوم، خانه ۳۴", MAZAR.lat, MAZAR.lng],
    );
    await client.query(
      `INSERT INTO addresses (customer_id, title, zone_id, details, lat, lng, is_default) VALUES ($1,$2,$3,$4,$5,$6,true)`,
      [shopId, "دکان", zoneIds[1], "مزارشریف، خلم مارکیت، دکان شماره ۱۲", 36.7583, 67.2],
    );

    const slugs = Object.keys(productBySlug);
    const { rows: basketRows } = await client.query(
      `INSERT INTO baskets (customer_id, name) VALUES ($1, $2) RETURNING id`,
      [customerId, "سبد ماهانه خانه"],
    );
    for (const [i, slug] of [slugs[0], slugs[5], slugs[13], slugs[17], slugs[23], slugs[40]].entries()) {
      const p = productBySlug[slug];
      if (!p) continue;
      await client.query(`INSERT INTO basket_items (basket_id, product_id, qty) VALUES ($1,$2,$3)`, [
        basketRows[0].id,
        p.id,
        [2, 2, 2, 12, 12, 1][i] ?? 1,
      ]);
    }

    const orderPlan = [
      { daysAgo: 0, hoursAgo: 2, status: "pending", cust: customerId, zone: 0, payment: "cod", delivery: "delivery", items: [[0, 2], [5, 1], [17, 6]] },
      { daysAgo: 0, hoursAgo: 5, status: "confirmed", cust: shopId, zone: 1, payment: "bank", delivery: "delivery", items: [[10, 3], [0, 6], [40, 8]] },
      { daysAgo: 1, hoursAgo: 3, status: "preparing", cust: customerId, zone: 2, payment: "cod", delivery: "delivery", items: [[13, 4], [14, 2], [23, 12]] },
      { daysAgo: 2, hoursAgo: 6, status: "shipped", cust: shopId, zone: 0, payment: "online", delivery: "delivery", items: [[29, 10], [30, 8]] },
      { daysAgo: 4, hoursAgo: 4, status: "delivered", cust: customerId, zone: 0, payment: "cod", delivery: "delivery", items: [[0, 1], [2, 2], [17, 4]] },
      { daysAgo: 6, hoursAgo: 7, status: "delivered", cust: shopId, zone: 3, payment: "bank", delivery: "delivery", items: [[10, 5], [11, 10]] },
      { daysAgo: 8, hoursAgo: 5, status: "delivered", cust: customerId, zone: 1, payment: "cod", delivery: "pickup", items: [[5, 2], [13, 3]] },
      { daysAgo: 11, hoursAgo: 9, status: "cancelled", cust: shopId, zone: 4, payment: "cod", delivery: "delivery", items: [[1, 4]] },
      { daysAgo: 12, hoursAgo: 3, status: "delivered", cust: customerId, zone: 0, payment: "card", delivery: "delivery", items: [[36, 6], [23, 24]] },
    ];

    const custInfo = {
      [customerId]: { name: "احمد رضایی", phone: "+93 700 111 2233", address: "مزارشریف، کارته شهاب، سرک دوم، خانه ۳۴" },
      [shopId]: { name: "دکان رحیمی", phone: "+93 700 555 7788", address: "مزارشریف، خلم مارکیت، دکان شماره ۱۲" },
    };

    let seq = 0;
    for (const plan of orderPlan) {
      const info = custInfo[plan.cust];
      const lines = [];
      let subtotal = 0;
      for (const [idx, qty] of plan.items) {
        const p = productBySlug[slugs[idx]];
        if (!p) continue;
        const wholesale = p.wholesale_price != null && qty >= p.wholesale_min;
        const unit = wholesale
          ? p.wholesale_price
          : p.discount > 0
            ? Math.round((p.price * (100 - p.discount)) / 100)
            : p.price;
        const lineTotal = unit * qty;
        subtotal += lineTotal;
        lines.push({ p, qty, unit, wholesale, lineTotal });
      }
      const zoneRow = await client.query(`SELECT * FROM zones WHERE id = $1`, [zoneIds[plan.zone]]);
      const zone = zoneRow.rows[0];
      const fee =
        plan.delivery === "pickup" || subtotal >= zone.free_over ? 0 : zone.fee;
      const total = subtotal + fee;
      const when = new Date(Date.now() - plan.daysAgo * 86400000 - plan.hoursAgo * 3600000);
      const number = `MS-SEED${String(++seq).padStart(4, "0")}`;

      const { rows } = await client.query(
        `INSERT INTO orders (number, customer_id, customer_name, phone, zone_id, zone_name, address, lat, lng,
          delivery, payment, status, subtotal, discount, delivery_fee, total, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,0,$14,$15,$16) RETURNING id`,
        [
          number,
          plan.cust,
          info.name,
          info.phone,
          zone.id,
          zone.name,
          plan.delivery === "pickup" ? SETTINGS.pickupAddress : info.address,
          MAZAR.lat + (Math.random() - 0.5) * 0.04,
          MAZAR.lng + (Math.random() - 0.5) * 0.04,
          plan.delivery,
          plan.payment,
          plan.status,
          subtotal,
          fee,
          total,
          when.toISOString(),
        ],
      );
      for (const line of lines) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, name, size_label, unit_price, qty, price_type, line_total)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            rows[0].id,
            line.p.id,
            line.p.name,
            line.p.size_label,
            line.unit,
            line.qty,
            line.wholesale ? "wholesale" : "retail",
            line.lineTotal,
          ],
        );
      }
    }

    await client.query(
      `INSERT INTO messages (name, phone, body, is_read) VALUES ($1,$2,$3,false)`,
      ["نجیب‌الله", "+93 707 220 118", "سلام، قیمت عمده روغن ۱۶ لیتری شعیب برای ۲۰ بلک چقدر می‌شود؟"],
    );
    await client.query(
      `INSERT INTO messages (name, phone, body, is_read) VALUES ($1,$2,$3,true)`,
      ["فریده احمدی", "+93 700 909 331", "آیا زعفران هرات و سلطان تازه هر روز موجود است؟"],
    );

    const reviewPlan = [
      ["p-1001", "احمد ولي رحیمی", 5, "برنج هرات بسیار خوش‌عطر و دانه‌بلند بود؛ بعد از پخت قد کشید و نرم ماند."],
      ["p-1001", "سمیرا عزیزی", 4, "کیفیت خوب است، فقط ای کاش بسته ۵ کیلویی‌اش هم همیشه موجود می‌بود."],
      ["p-1006", "حاجی عبدالناصر", 5, "روغن اصلی الکوزی است، بوی تازه می‌دهد و هنگام سرخ‌کردن کف نمی‌کند."],
      ["p-1007", "فریده احمدی", 5, "روغن شعیب برای دکان‌مان عالی است؛ قیمت عمده خودکار اعمال شد."],
      ["p-1011", "نانوایی برادران کریمی", 5, "آرد بشیر نوید قوت دارد و نان خوب پف می‌کند. تحویل همان روز انجام شد."],
      ["p-1014", "نصیر احمد زیاری", 5, "چای سبز الکوزی تازه و خوش‌رنگ با بسته‌بندی ضد رطوبت."],
      ["p-1018", "زینب حسینی", 5, "شیر سلطان تازه هر هفته سفارش می‌دهیم؛ طعم محلی مزار را دارد."],
      ["p-1019", "حبیب‌الله شمس", 5, "ماست سلطان تازه غلیظ و ترش ملایم است؛ خانواده خیلی دوست دارد."],
      ["p-1024", "میثم صادقی", 4, "آب پامیر برای بوفه مکتب مناسب است؛ بوتل‌ها سالم و تاریخ‌دار بودند."],
      ["p-1030", "داکتر سمیع", 5, "زعفران هرات رنگ و عطر فوق‌العاده دارد؛ برای چای زعفرانی عالی است."],
      ["p-1033", "نگار کریمی", 5, "بادام رومی درشت و تازه با بسته‌بندی تمیز."],
      ["p-1035", "شکریه نبی‌زاده", 4, "هلوای صادق‌یار طعم سنتی هرات را دارد؛ برای مهمانی عالی بود."],
      ["p-1040", "مریم رسولی", 5, "پودر الکوزی لکه‌ها را خوب می‌برد و بوی ملایمی دارد."],
      ["p-1008", "عباس نظری", 4, "روغن بشیر بوتل پلمپ و قیمت مناسب؛ از ۲۴ عدد عمده حساب شد."],
    ];
    for (const [slug, name, rating, body, approved] of reviewPlan) {
      const { rows } = await client.query(`SELECT id FROM products WHERE slug = $1`, [slug]);
      if (!rows[0]) continue;
      await client.query(
        `INSERT INTO reviews (product_id, customer_id, name, rating, body, is_approved, created_at)
         VALUES ($1, NULL, $2, $3, $4, $5, now() - (random() * interval '26 days'))`,
        [rows[0].id, name, rating, body, approved === false ? false : true],
      );
    }

    const { rows: galleryRows } = await client.query(`SELECT id, image, category_id FROM products ORDER BY id`);
    for (const row of galleryRows) {
      const related = galleryRows
        .filter((x) => x.category_id === row.category_id && x.id !== row.id && x.image && x.image !== row.image)
        .slice(0, 3)
        .map((x) => x.image);
      const gallery = [row.image, ...related].filter(Boolean);
      await client.query(`UPDATE products SET images = $1 WHERE id = $2`, [JSON.stringify(gallery), row.id]);
    }

    const { rows: pCount } = await client.query(`SELECT count(*)::int AS c FROM products`);
    const { rows: oCount } = await client.query(`SELECT count(*)::int AS c FROM orders`);
    console.log(`Seeded: ${pCount[0].c} products, ${oCount[0].c} orders, admin id ${adminId}`);
    console.log(`Admin: ${ADMIN_EMAIL} — password ${usedEnvAdmin ? "loaded from env ADMIN_PASSWORD" : `GENERATED (not stored anywhere): ${adminPassword}`}`);
    console.log(`Demo customers (ahmad@ / rahimi@muslimstore.af) — password ${usedEnvDemo ? "loaded from env DEMO_CUSTOMER_PASSWORD" : `GENERATED: ${demoPassword}`}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
